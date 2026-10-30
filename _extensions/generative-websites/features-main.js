// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
import {validateAdaptationPage,resolveAdaptation,ADAPTATION_AXES} from './adaptation.js';
import {validatePublicPage,parseDeliveryJSON,loadPublication,selectClosure,prepareOffline,inspectOffline,clearOffline,applyOfflineWithdrawals} from './delivery.js';
import {checkAnswer,createExercise} from './exercises.js';
import {buildOerZip} from './oer.js';
import {createJourney,validateJourney,createReturnFrame} from './journey.js';
import {mountSandboxSessionControls,restorePendingSessionReturn,commitJourneyReturn} from './sandbox-session-ui.js';
import {mountActivityControls} from './activity-ui.js';
import {mountNumbasActivity} from './numbas/ui.js';
import {mountWaiSymbolControls} from './wai-symbols.js';
let numbasControls=[];
let activityControls=null;
let waiControls=null;

const managed=new WeakSet();
const node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
const button=(label,action)=>{const el=node('button',label);el.type='button';el.addEventListener('click',action);return el;};
const marker=(name,maximum=1048576)=>{const all=document.querySelectorAll('script.'+name);if(!all.length)return null;if(all.length!==1)throw Error('A public feature catalogue is duplicated.');return parseDeliveryJSON(all[0].textContent,{maxBytes:maximum});};
const describe=(parent,title,value)=>{const details=node('details'),summary=node('summary',title),pre=node('pre',JSON.stringify(value,null,2));details.append(summary,pre);parent.append(details);return details;};
function save(name,bytes,type){const url=URL.createObjectURL(new Blob([bytes],{type})),link=node('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function select(label,values){const wrapper=node('label',label),control=node('select');for(const value of values){const option=node('option',value.label??value);option.value=value.value??value;control.append(option);}wrapper.append(control);return{wrapper,control};}
const operation=async(status,run)=>{try{return await run();}catch{status.textContent='This optional action is unavailable. The authored content remains readable; inspect the selected sources and configuration.';return null;}};
export function journeyControlState({loading=false,exporting=false,catalogue=false,route=null,current=0,detours=0,goals=0,savedReturn=false,consent=false}={}){
 const busy=loading||exporting,ready=!!catalogue&&route?.status==='complete'&&Array.isArray(route.steps)&&route.steps.length>0;
 return{load:busy,cancel:!busy,goal:busy||!catalogue||!goals,build:busy||!catalogue||!goals||detours>0,complete:busy||!ready||current>=route.steps.length-1,explore:busy||!ready||detours>=32,back:busy||!(detours||savedReturn),download:busy||!ready,transfer:busy,offline:busy||!ready||!consent};
}
function uniqueAnchor(id){const all=[...document.querySelectorAll('[id]')].filter(el=>el.id===id);if(all.length!==1)throw Error('A reviewed native anchor is missing or ambiguous.');return all[0];}

function preferences(page,config){
 if(!page.adaptation)return;
 const adaptation=validateAdaptationPage(page.adaptation,{baseURL:config.baseURL});
 for(const panel of document.querySelectorAll('.learning-preferences')){
  if(managed.has(panel))continue;managed.add(panel);
  const box=node('div');box.className='generative-feature-controls';const status=node('p','Choose reviewed alternatives. This does not infer your knowledge or translate the page.');status.setAttribute('role','status');
  const authoredDefaults={...config.defaults};if(authoredDefaults.exposition===undefined&&authoredDefaults.level!==undefined)authoredDefaults.exposition=authoredDefaults.level;delete authoredDefaults.level;
  const choices={...authoredDefaults},controls=[],more=node('details');more.className='generative-feature-advanced';more.append(node('summary','More reviewed preferences'));
  for(const axis of ADAPTATION_AXES){
   const values=[...new Set(adaptation.objects.flatMap(object=>object.groups.filter(group=>group.axis===axis).flatMap(group=>group.variants.map(variant=>variant.value))))];
   if(!values.length)continue;const entry=select(({exposition:'Exposition',terminology:'Terminology',scaffolding:'Scaffolding','prerequisite-knowledge':'Prerequisite familiarity','reading-complexity':'Reading complexity','context-interest':'Context and interest',representation:'Representation',challenge:'Challenge'})[axis],[{value:'',label:'Author defaults'},...values.map(value=>({value,label:value}))]);
   entry.control.value=choices[axis]??'';entry.control.addEventListener('change',()=>{if(entry.control.value)choices[axis]=entry.control.value;else if(authoredDefaults[axis]!==undefined)choices[axis]=authoredDefaults[axis];else delete choices[axis];apply();});(['exposition','representation','terminology'].includes(axis)?box:more).append(entry.wrapper);controls.push({...entry,axis});
  }
  const allVariants=adaptation.objects.flatMap(object=>object.groups.flatMap(group=>group.variants));
  const original=allVariants.map(variant=>{const el=uniqueAnchor(variant.anchor);if(el.getAttribute('data-gw-object')!==adaptation.objects.find(object=>object.groups.some(group=>group.variants.includes(variant))).id)throw Error('A native variant changed.');return{el,hidden:el.hidden};});
  let current;
  function apply(){
   current=resolveAdaptation(adaptation,choices);const selected=new Set(current.objects.flatMap(object=>object.groups.map(group=>group.anchor)));
   for(const entry of original)entry.el.hidden=!selected.has(entry.el.id);
   status.textContent=current.unsupportedPreferences.length?'Some choices are unavailable here; their author defaults are retained.':'Reviewed alternatives selected. Tasks, protected assertions, citations and mathematical notation retain their authored forms.';
  }
  box.append(button('Restore author defaults',()=>{for(const key of Object.keys(choices))delete choices[key];Object.assign(choices,authoredDefaults);for(const entry of controls)entry.control.value=choices[entry.axis]??'';apply();}),node('p','Choices select reviewed alternatives; they do not infer your knowledge or translate the page. Tasks, protected assertions, citations and mathematical notation remain authored.'),status);
  if(more.childNodes.length>1)box.append(more);
  describe(box,'Inspect source revisions and review declarations',{page:adaptation.page,objects:adaptation.objects,assertions:page.assertions});panel.append(box);apply();
  const restore=()=>{for(const entry of original)entry.el.hidden=entry.hidden;};window.addEventListener('pagehide',restore);window.addEventListener('pageshow',apply);
 }
}
function practice(exercises,activityController=null){
 for(const instance of exercises??[]){const panel=uniqueAnchor(instance.spec.id);if(managed.has(panel))continue;managed.add(panel);let current=instance;
  const box=node('div');box.className='generative-feature-controls';const label=node('label',instance.spec.kind.startsWith('rational-')?'Your answer (integer or fraction)':'Your answer (comma-separated set, or {})'),input=node('input');input.type='text';input.maxLength=256;label.append(input);
  const status=node('p','Checking stays on this page; no response is uploaded or recorded as mastery.');status.setAttribute('role','status');let epoch=0,checking=null;
  const clearChecking=()=>{checking=null;check.removeAttribute('aria-disabled');check.removeAttribute('aria-busy');};
  const check=button('Check this response',async()=>{if(checking!==null)return;const token=++epoch;checking=token;check.setAttribute('aria-disabled','true');check.setAttribute('aria-busy','true');try{const result=activityController?.hasExercise(current.spec.id)?await activityController.checkExercise(current.spec.id,input.value,current.seed,{isCurrent:()=>token===epoch}):await checkAnswer(current,input.value,{context:current.context});if(token!==epoch)return;status.textContent=result.status==='correct'?'Correct for this finite generated instance.':result.status==='incorrect'?'That response is incorrect for this instance. You can revise it.':'Use the stated answer format; no result was inferred.';}catch{if(token===epoch)status.textContent='The checker could not validate this instance. Read the authored task; no result was inferred.';}finally{if(checking===token)clearChecking();}});
  input.addEventListener('input',()=>{epoch++;clearChecking();status.textContent='Response changed. Check again when ready.';});
  const seedLabel=node('label','Practice seed (0–4294967295)'),seed=node('input');seed.type='text';seed.inputMode='numeric';seed.maxLength=10;seed.value=String(instance.seed);seedLabel.append(seed);
  box.append(label,check,button('Clear response',()=>{epoch++;input.value='';clearChecking();status.textContent='Response cleared.';}),seedLabel,button('Create instance with this seed',async()=>{if(!/^(?:0|[1-9]\d{0,9})$/.test(seed.value)||Number(seed.value)>0xffffffff){status.textContent='Enter a whole seed from 0 to 4294967295.';return;}const token=++epoch;clearChecking();const result=await operation(status,()=>createExercise(instance.spec,{seed:Number(seed.value),context:instance.context}));if(!result||token!==epoch)return;current=result;input.value='';clearChecking();const task=panel.querySelector('.generative-exercise-task');if(task)task.textContent=current.problem.prompt;status.textContent='A new deterministic instance is ready. Source definitions and review status are unchanged.';}),status);describe(box,'Inspect initial seed, source and finite checking scope',{seed:instance.seed,hashes:instance.hashes,context:instance.context,checkingScope:instance.checkingScope});panel.append(box);
 }
}
function sandbox(exports,page,config,sessionMappings){
 const panels=[...document.querySelectorAll('.learning-sandbox')];if(!panels.length||!exports?.length)return;
 for(const panel of panels){if(managed.has(panel))continue;managed.add(panel);const box=node('div');box.className='generative-feature-controls';
  box.append(node('p','Download a problem-only theory, open your chosen Argumentation Sandbox, and use its Import control. No solution, attempt or proof status is imported automatically.'));
  for(const item of exports){box.append(button('Download '+item.filename,()=>save(item.filename,item.text,item.mediaType??'text/plain')));describe(box,'Inspect problem/source receipt',item.receipt);}
  const href=panel.getAttribute('data-sandbox-url');if(href){const url=new URL(href,location.href);if(['http:','https:'].includes(url.protocol)&&!url.username&&!url.password){const link=node('a','Open Argumentation Sandbox');link.href=url.href;box.append(link);}}
  panel.append(box);
  mountSandboxSessionControls(panel,{page,config,problems:exports,sessionMappings:sessionMappings??[]});
 }
}
function journeys(page,config,oer){
 const panels=[...document.querySelectorAll('.learning-journey,.learning-export')];
 const key='quarto-generative-journey-v1:'+new URL(config.baseURL).pathname+':'+page.project.id;
 for(const panel of panels){if(managed.has(panel))continue;managed.add(panel);const box=node('div');box.className='generative-feature-controls';const status=node('p','Load the explicitly published page catalogues when you want a cross-page route.');status.setAttribute('role','status');status.setAttribute('tabindex','-1');
  let exportEpoch=0,exportAbort=null,refreshControls=()=>{};
  const downloadOer=async(parent)=>{const token=++exportEpoch;exportAbort?.abort();exportAbort=new AbortController();const signal=exportAbort.signal;refreshControls();try{const result=await buildOerZip(oer,{signal});if(token!==exportEpoch||signal.aborted)return;save(result.filename,result.bytes,result.mediaType);status.textContent='Selected editable files and rights manifest downloaded. Independent reconstruction and legal compatibility remain separate.';describe(parent,'Editable resource manifest',result.manifest);}catch{if(token===exportEpoch&&!signal.aborted)status.textContent='The selected editable bundle is incomplete or unavailable. No partial archive was downloaded.';}finally{if(token===exportEpoch){exportAbort=null;refreshControls();}}};
  window.addEventListener('pagehide',()=>{exportEpoch++;exportAbort?.abort();});
  if(!panel.classList.contains('learning-journey')){if(oer)box.append(button('Download editable resource bundle',()=>downloadOer(box)));else status.textContent='No editable source bundle has been explicitly selected.';box.append(status);panel.append(box);continue;}
  const actionButton=(label,action)=>{const control=button(label,(...args)=>{if(control.disabled||control.getAttribute('aria-disabled')==='true')return;return action(...args);});return control;};
  const output=node('div'),goal=select('Learning goal',[]);let catalogue=null,route=null,abort=null,epoch=0,active=0;const detours=[];let offlinePrepare=null,offlineConsent=null;
  const replaceOutput=(...rows)=>{const owned=output.contains(document.activeElement);output.replaceChildren(...rows);if(owned)status.focus();};
  function populateGoals(result,selected){goal.control.replaceChildren();for(const p of result.pages)if(p.status==='complete')for(const object of p.data.objects){const option=node('option',object.label+' ('+p.id+')');option.value=p.id+'#'+object.id;goal.control.append(option);}if(selected)goal.control.value=selected;}
  const cancel=()=>{epoch++;abort?.abort();abort=null;exportEpoch++;exportAbort?.abort();exportAbort=null;refreshControls();};
  const guarded=async(run)=>{const token=++epoch;abort?.abort();abort=new AbortController();const own=abort,timer=setTimeout(()=>own.abort(),60000);status.textContent='Loading selected public records. Cancel remains available.';refreshControls();try{const result=await run(own.signal);return token===epoch?result:null;}catch{if(token===epoch)status.textContent='The optional request could not complete. Authored content and the last complete route remain available.';return null;}finally{clearTimeout(timer);if(abort===own){abort=null;refreshControls();}}};
  const load=actionButton('Load published learning pages',async()=>{
   const result=await guarded(signal=>loadPublication(config.publication,{baseURL:config.baseURL,signal,onProgress:value=>{status.textContent='Loading selected public page catalogues; unavailable pages remain unknown.';}}));if(!result)return;catalogue=result;route=null;active=0;detours.length=0;goal.control.replaceChildren();
   for(const p of result.pages)if(p.status==='complete')for(const object of p.data.objects){const option=node('option',object.label+' ('+p.id+')');option.value=p.id+'#'+object.id;goal.control.append(option);}
   status.textContent=result.pages.every(p=>p.status==='complete')?'Published page catalogues loaded. Choose a goal.':'Some pages are unavailable. Available routes still require every hard prerequisite.';replaceOutput();describe(output,'Observed page coverage and delivered bytes',result.pages.map(p=>({id:p.id,status:p.status,observedSha256:p.observedSha256,bytes:p.bytes,observation:p.observation,reason:p.reason})));refreshControls();
  });
  const bookmark=()=>route&&catalogue?createJourney(catalogue,route,{current:active,detours:[...detours]}):null;
  const store=()=>{const value=bookmark();if(!value)return;try{sessionStorage.setItem(key,JSON.stringify(value));}catch{status.textContent='This tab cannot save its route. Ordinary page links remain available.';}};
  function renderRoute(){refreshControls();replaceOutput();if(!route||route.status!=='complete'){output.append(node('p',route?.reason??'No route selected.'));return;}const list=node('ol');route.steps.forEach((step,index)=>{const li=node('li'),link=node('a',(index===active?'Current: ':'')+step.key);link.href=step.url;link.addEventListener('click',()=>{active=index;store();refreshControls();});li.append(link,node('span',' — '+step.reason));list.append(li);});output.append(list);status.textContent='Route prepared from reviewed records. Following a link does not establish completion or mastery.';store();}
  const build=actionButton('Build cross-page route',()=>{if(!catalogue)return;const parts=goal.control.value.split('#');route=selectClosure(catalogue,{pageId:parts[0],objectId:parts[1]});active=0;detours.length=0;renderRoute();});build.disabled=true;
  const complete=actionButton('Mark current step complete and continue',()=>{if(!route?.steps.length)return;active=Math.min(active+1,route.steps.length-1);renderRoute();});
  const resume=actionButton('Resume this tab’s route',async()=>{
   let saved;try{const text=sessionStorage.getItem(key);if(!text){status.textContent='No route is saved in this tab.';return;}saved=parseDeliveryJSON(text,{maxBytes:65536});}catch{status.textContent='The saved route cannot be read. Native page links remain available.';return;}
   const result=await guarded(signal=>loadPublication(config.publication,{baseURL:config.baseURL,signal}));if(!result)return;
   let checked;try{checked=validateJourney(saved,result);}catch{status.textContent='A source or prerequisite changed, or the saved record is invalid. Build a current route; the old one was not restored.';return;}
   const parts=checked.goal.split('#'),fresh=selectClosure(result,{pageId:parts[0],objectId:parts[1]});
   catalogue=result;route=fresh;active=checked.current;detours.splice(0,detours.length,...checked.detours);populateGoals(result,checked.goal);renderRoute();
  });
  const explore=actionButton('Explore selected concept and keep route',()=>{if(!route||!catalogue)return;try{const parts=goal.control.value.split('#'),probe=selectClosure(catalogue,{pageId:parts[0],objectId:parts[1]});if(probe.status!=='complete'||detours.length>=32)return;detours.push(createReturnFrame(catalogue,{url:location.href,scrollX:scrollX,scrollY:scrollY,focus:document.activeElement?.id||null,current:active},route));store();location.assign(probe.steps.at(-1).url);}catch{status.textContent='That detour cannot be bound to the saved route. Ordinary links remain available.';}});
  const back=actionButton('Return to saved route position',async()=>{let saved;try{saved=parseDeliveryJSON(sessionStorage.getItem(key)??'null',{maxBytes:65536});}catch{return;}const fresh=await guarded(signal=>loadPublication(config.publication,{baseURL:config.baseURL,signal}));if(!fresh)return;try{saved=validateJourney(saved,fresh);const frame=saved.detours.at(-1);if(!frame){status.textContent='No detour is open.';return;}const parts=saved.goal.split('#'),plan=selectClosure(fresh,{pageId:parts[0],objectId:parts[1]});commitJourneyReturn(sessionStorage,key,createJourney(fresh,plan,{current:frame.current,detours:saved.detours.slice(0,-1)}),{version:1,project:page.project,frame},()=>location.assign(frame.url));}catch(error){status.textContent=error?.code==='return-state-not-retained'?'The return update failed and previous storage could not be fully restored. Resume or rebuild the reading route before returning.':'The saved return position is stale or invalid; no navigation was performed.';}});
  const abortRequest=actionButton('Cancel public-page or offline request',()=>{cancel();status.textContent='Request cancelled. Authored content is unchanged.';});
  const download=actionButton('Download route bookmark',()=>{const data=bookmark();if(data)save('learning-route.json',JSON.stringify(data,null,2)+'\n','application/json');});
  const clear=actionButton('Clear this tab’s route',()=>{cancel();try{sessionStorage.removeItem(key);sessionStorage.removeItem(key+':return');}catch{}route=null;catalogue=null;detours.length=0;replaceOutput();status.textContent='Tab route cleared. No learning record is retained.';refreshControls();});
  const advanced=node('details');advanced.className='generative-feature-advanced';advanced.append(node('summary','Save, restore and offline options'),resume,download,clear);
  box.append(load,goal.wrapper,build,complete,explore,back,abortRequest);
  const importLabel=node('label','Restore a route bookmark JSON file'),file=node('input');file.type='file';file.accept='.json,application/json';importLabel.append(file);file.addEventListener('change',async()=>{if(file.disabled)return;const token=++epoch;abort?.abort();abort=null;refreshControls();const selected=file.files?.[0];if(!selected)return;if(selected.size>65536){status.textContent='The route file exceeds 64 KiB.';return;}let saved;try{const text=await selected.text();if(token!==epoch)return;saved=parseDeliveryJSON(text,{maxBytes:65536});}catch{if(token===epoch)status.textContent='The route file is invalid.';return;}if(token!==epoch)return;const fresh=await guarded(signal=>loadPublication(config.publication,{baseURL:config.baseURL,signal}));if(!fresh)return;try{const checked=validateJourney(saved,fresh),parts=checked.goal.split('#');catalogue=fresh;route=selectClosure(fresh,{pageId:parts[0],objectId:parts[1]});active=checked.current;detours.splice(0,detours.length,...checked.detours);populateGoals(fresh,checked.goal);renderRoute();}catch{status.textContent='The route file is stale or incompatible. The current route was retained.';}});advanced.append(importLabel);
  if(config.offline?.enabled){
   const consent=node('label'),checkbox=node('input');checkbox.type='checkbox';consent.append(checkbox,document.createTextNode('Save this selected public route and its declared static assets on this device. Models and Sandbox data are excluded.'));
   const prepare=actionButton('Prepare selected route for offline reading',async()=>{if(!checkbox.checked||!catalogue||route?.status!=='complete'){status.textContent='Load a complete route and explicitly select offline consent first.';return;}const result=await guarded(signal=>prepareOffline(catalogue,route,{consent:true,baseURL:config.baseURL,workerURL:'gw-offline-worker.js',maxBytes:config.offline.maxBytes,expiresDays:config.offline.expiresDays,signal}));if(result){status.textContent='Saved observed route snapshot. New revisions and withdrawals cannot be checked while offline.';describe(output,'Offline files and observation time',result);}});
   offlinePrepare=prepare;offlineConsent=checkbox;checkbox.addEventListener('change',()=>refreshControls());
   advanced.append(consent,prepare,button('Inspect saved offline content',async()=>{const result=await operation(status,()=>inspectOffline({baseURL:config.baseURL}));if(result){describe(output,'Saved offline content',result);status.textContent='Saved content inspected. Availability and expiry are reported separately.';}}),actionButton('Delete this project’s offline content',async()=>{cancel();const result=await operation(status,()=>clearOffline({baseURL:config.baseURL}));if(result){status.textContent='This project’s optional saved snapshots were removed.';}}));
  }
  if(oer)advanced.append(actionButton('Download editable resource bundle',()=>downloadOer(output)));
  refreshControls=()=>{let savedReturn=false;try{const saved=parseDeliveryJSON(sessionStorage.getItem(key)??'null',{maxBytes:65536});savedReturn=Array.isArray(saved?.detours)&&saved.detours.length>0;}catch{}
   const state=journeyControlState({loading:!!abort,exporting:!!exportAbort,catalogue:!!catalogue,route,current:active,detours:detours.length,goals:goal.control.options.length,savedReturn,consent:!!offlineConsent?.checked});
   const idle=journeyControlState({catalogue:!!catalogue,route,current:active,detours:detours.length,goals:goal.control.options.length,savedReturn,consent:!!offlineConsent?.checked}),focused=document.activeElement;let handoff=false;
   const controls=[[load,'load'],[abortRequest,'cancel'],[goal.control,'goal'],[build,'build'],[complete,'complete'],[explore,'explore'],[back,'back'],[download,'download'],[file,'transfer'],[resume,'transfer'],[clear,'transfer'],...(offlinePrepare?[[offlinePrepare,'offline']]:[])];
   for(const [control,key]of controls){const waiting=control.tagName==='BUTTON'&&state[key]&&!idle[key],disabled=state[key]&&!waiting;if(disabled&&focused===control)handoff=true;control.disabled=disabled;if(waiting)control.setAttribute('aria-disabled','true');else control.removeAttribute('aria-disabled');}
   if(handoff){const target=!state.cancel?abortRequest:load;if(!target.disabled&&target.getAttribute('aria-disabled')!=='true')target.focus();else status.focus();}
  };
  box.append(node('p','Routes use reviewed source declarations and hard prerequisites. Unavailable pages remain unknown; following a route does not establish learning or mastery.'),status,output,advanced);refreshControls();panel.append(box);
  window.addEventListener('pagehide',()=>{epoch++;abort?.abort();});
 }
}
function boot(){
 try{
  const config=marker('generative-publication-data');if(!config)return;
  const baseURL=new URL(config.root,location.href).href,page=validatePublicPage(marker('generative-public-data'),{baseURL});
  const numbas=marker('generative-numbas-data',1048576);
  if(numbas&&numbasControls.length===0){if(numbas.version!==1||!Array.isArray(numbas.payloads)||numbas.payloads.length>4)throw Error('Numbas native data is unavailable.');const source=document.querySelector('script.generative-numbas-data'),original=source.textContent;
   for(const activity of numbas.payloads){const panel=uniqueAnchor(activity.id);if(!panel.classList.contains('learning-numbas'))throw Error('Numbas native panel is unavailable.');const controls=mountNumbasActivity(panel,activity,{baseURL,isCurrent:()=>source.isConnected&&source.textContent===original&&panel.isConnected&&document.querySelectorAll('#'+CSS.escape(activity.id)).length===1});numbasControls.push(controls);}
  }
  config.baseURL=baseURL;preferences(page,config);const exercises=marker('generative-exercises-data'),activityData=marker('generative-activities-data',262144);
  const waiData=marker('generative-wai-symbols-data');if(waiData&&!waiControls&&waiData.status==='reviewed'&&waiData.helper==='gw-local-symbols-v1'){
    const source=document.querySelector('script.generative-wai-symbols-data'),container=document.querySelector('.generative-symbol-inspection');
    if(container)waiControls=mountWaiSymbolControls(waiData,{baseURL,container,initialDataText:source.textContent,readData:()=>source.textContent,isCurrent:()=>source.ownerDocument===document&&container.ownerDocument===document&&source.isConnected&&container.isConnected&&document.documentElement.contains(source)&&document.documentElement.contains(container)});
  }
  if(activityData&&!activityControls){const dataNode=document.querySelector('script.generative-activities-data');activityControls=mountActivityControls({data:activityData,baseURL,page:{project:page.project,page:{id:page.page.id,url:page.page.url,revision:page.page.revision,sourceDigest:page.page.sourceDigest}},exercises,sandboxExports:marker('generative-sandbox-data')},{initialDataText:dataNode.textContent,readData:()=>dataNode.textContent,onUnavailable:()=>{const owner=document.querySelector('.learning-activity');if(owner){const notice=node('p','Optional private progress is unavailable for this page. Authored content and the existing finite practice controls remain readable.');notice.setAttribute('role','status');owner.append(notice);}}});}
  if(activityControls)activityControls.ready.then(()=>practice(exercises,activityControls)).catch(()=>practice(exercises));else practice(exercises);sandbox(marker('generative-sandbox-data'),page,config,marker('generative-sandbox-session-mappings-data'));journeys(page,config,marker('generative-oer-data',2097152));
  restorePendingSessionReturn(page,config).catch(()=>{});
  applyOfflineWithdrawals(config.publication,{baseURL}).catch(()=>{});
 }catch{for(const panel of document.querySelectorAll('.learning-preferences,.learning-journey,.learning-export'))if(!managed.has(panel)){managed.add(panel);panel.append(node('p','Optional reviewed controls are unavailable. The authored content remains readable.'));}}
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.addEventListener('pageshow',boot);window.addEventListener('pagehide',()=>{for(const controls of numbasControls)controls.dispose();numbasControls=[];waiControls?.dispose();waiControls=null;});}
