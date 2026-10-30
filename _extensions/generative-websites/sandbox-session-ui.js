// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Original optional file inspection and navigation UI. It never invokes a
// Sandbox endpoint, imports executable code or promotes a reported proof state.
import * as sessionAdapter from './sandbox-session.js';
import {parseDeliveryJSON,loadPublication,selectClosure} from './delivery.js';
import {createJourney,validateJourney,createReturnFrame,validateReturnFrame} from './journey.js';

const encoder=new TextEncoder();
const mounted=new WeakSet(),returnRuns=new WeakMap();
const keyFor=(config,page)=>'quarto-generative-journey-v1:'+new URL(config.baseURL).pathname+':'+page.project.id;
const node=(document,tag,text)=>{const value=document.createElement(tag);if(text!==undefined)value.textContent=text;return value;};
const cancelled=()=>new Error('Session action cancelled or source changed.');
/** Commit the two existing same-tab return records together. Web Storage has
 * no transaction, so a quota/navigation failure rolls back only our own
 * synchronous writes; a newer reader action is never overwritten. */
export function commitJourneyReturn(storage,key,bookmark,pending,navigate){
  const prior=storage.getItem(key),priorPending=storage.getItem(key+':return'),next=JSON.stringify(bookmark),nextPending=JSON.stringify(pending);
  let wroteRoute=false,wrotePending=false;
  try{storage.setItem(key,next);wroteRoute=true;storage.setItem(key+':return',nextPending);wrotePending=true;navigate();}
  catch(error){
    try{if(wrotePending&&storage.getItem(key+':return')===nextPending){if(priorPending===null)storage.removeItem(key+':return');else storage.setItem(key+':return',priorPending);}}catch{}
    try{if(wroteRoute&&storage.getItem(key)===next){if(prior===null)storage.removeItem(key);else storage.setItem(key,prior);}}catch{}
    let restored=false;try{restored=storage.getItem(key)===prior&&storage.getItem(key+':return')===priorPending;}catch{}
    if(!restored){const incomplete=new Error('Reading-position storage could not be fully restored.');incomplete.code='return-state-not-retained';throw incomplete;}
    throw error;
  }
}
function sourceStamp(document){
  return ['generative-publication-data','generative-public-data','generative-sandbox-data','generative-sandbox-session-mappings-data'].map((name,index)=>{
    const nodes=document.querySelectorAll('script.'+name);if(index===3&&nodes.length===0)return'';if(nodes.length!==1)throw cancelled();return nodes[0].textContent;
  }).join('\u0000');
}
function contextFor(page,config,problem){
  return {version:1,project:{id:page.project.id,revision:page.project.revision},
    page:{url:new URL(page.page.url,config.baseURL).href,sourceDigest:page.page.sourceDigest},
    problem:{id:problem.spec.id,revision:problem.spec.revision,problemSha256:problem.receipt.problemSha256,
      contextSha256:problem.receipt.contextSha256,exportSha256:problem.receipt.exportSha256}};
}
function defaultDownload(name,bytes,type,document){
  const url=URL.createObjectURL(new Blob([bytes],{type})),link=node(document,'a');link.href=url;link.download=name;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function nativeFocus(document,id){
  if(id===null)return null;
  const all=[...document.querySelectorAll('[id]')].filter(element=>element.id===id);
  if(all.length!==1)throw cancelled();return all[0];
}
function applyPosition(frame,{documentObject:document,windowObject:window,locationObject:location,page}){
  const target=new URL(frame.url),here=new URL(location.href);
  if(target.href!==here.href||frame.sourceDigest!==page.page.sourceDigest)throw cancelled();
  const focus=nativeFocus(document,frame.focus);
  if(focus){const style=window.getComputedStyle?.(focus);if(focus.hidden||focus.closest?.('[hidden]')||style&&(style.display==='none'||style.visibility==='hidden'))throw cancelled();if(!focus.hasAttribute('tabindex')&&!focus.matches('button,input,select,a[href],textarea'))focus.setAttribute('tabindex','-1');focus.focus({preventScroll:true});}
  window.scrollTo(frame.scrollX,frame.scrollY);
}
function routeFrom(catalogue,bookmark){const [pageId,objectId]=bookmark.goal.split('#'),route=selectClosure(catalogue,{pageId,objectId});if(route.status!=='complete')throw cancelled();return route;}

/** Restore only a one-shot pending position created by an explicit route action.
 * Reading ordinary pages causes no fetch when no such pending record exists.
 * The stored record is untrusted: source pages and prerequisite choices are
 * freshly validated before any navigation state, focus or scroll is restored. */
export async function restorePendingSessionReturn(page,config,{
  documentObject=document,windowObject=window,locationObject=location,
  storageObject=globalThis.sessionStorage,loadPublicationImpl=loadPublication
}={}){
  const key=keyFor(config,page),pendingKey=key+':return';let raw;
  try{raw=storageObject?.getItem(pendingKey);}catch{return false;}
  if(!raw)return false;
  let snapshot;try{snapshot=sourceStampForReturn(documentObject);}catch{return false;}
  const previous=returnRuns.get(documentObject);if(previous?.pendingValue===raw)return false;previous?.abort();
  const controller=new AbortController();controller.pendingValue=raw;returnRuns.set(documentObject,controller);
  const timer=setTimeout(()=>controller.abort(),60000),
    stop=()=>controller.abort();windowObject.addEventListener('pagehide',stop,{once:true});
  const live=()=>{try{return!controller.signal.aborted&&returnRuns.get(documentObject)===controller&&sourceStampForReturn(documentObject)===snapshot;}catch{return false;}};
  try{
    const pending=parseDeliveryJSON(raw,{maxBytes:65536});
    if(!pending||Object.keys(pending).some(key=>!['version','project','frame'].includes(key))||pending.version!==1||
      !pending.project||typeof pending.project!=='object'||Array.isArray(pending.project)||
      Object.keys(pending.project).length!==2||Object.keys(pending.project).some(key=>!['id','revision'].includes(key))||
      pending.project.id!==page.project.id||pending.project.revision!==page.project.revision)throw cancelled();
    const saved=parseDeliveryJSON(storageObject.getItem(key)??'null',{maxBytes:65536});
    const catalogue=await loadPublicationImpl(config.publication,{baseURL:config.baseURL,signal:controller.signal});if(!live())throw cancelled();
    const checked=validateJourney(saved,catalogue),route=routeFrom(catalogue,checked),frame=validateReturnFrame(pending.frame,catalogue,route);
    if(!live())throw cancelled();
    // Consume only the exact pending value inspected by this run; another
    // reader action may already have replaced it while pages were loading.
    if(storageObject.getItem(pendingKey)!==raw)throw cancelled();
    storageObject.removeItem(pendingKey);
    const applied=await new Promise(resolve=>{let id;const abort=()=>{windowObject.cancelAnimationFrame?.(id);resolve(false);};controller.signal.addEventListener('abort',abort,{once:true});id=windowObject.requestAnimationFrame(()=>{controller.signal.removeEventListener('abort',abort);if(live()){try{applyPosition(frame,{documentObject,windowObject,locationObject,page});resolve(true);}catch{resolve(false);}}else resolve(false);});});
    return applied&&live();
  }catch{
    // A failed return does not replace or delete the last valid route.
    try{if(!controller.signal.aborted&&returnRuns.get(documentObject)===controller&&storageObject.getItem(pendingKey)===raw)storageObject.removeItem(pendingKey);}catch{}
    return false;
  }finally{clearTimeout(timer);windowObject.removeEventListener('pagehide',stop);if(returnRuns.get(documentObject)===controller)returnRuns.delete(documentObject);}
}
function sourceStampForReturn(document){
  return ['generative-publication-data','generative-public-data'].map(name=>{const all=document.querySelectorAll('script.'+name);if(all.length!==1)throw cancelled();return all[0].textContent;}).join('\u0000');
}

/** Internal browser seam. Authors use the existing QMD .learning-sandbox block;
 * no author-written JavaScript, transport endpoint or persistence is required. */
export function mountSandboxSessionControls(panel,{page,config,problems,sessionMappings=[]},{
  documentObject=globalThis.document,windowObject=globalThis.window,locationObject=globalThis.location,
  storageObject=globalThis.sessionStorage,adapter=sessionAdapter,loadPublicationImpl=loadPublication,
  cryptoObject=globalThis.crypto,download=(name,bytes,type)=>defaultDownload(name,bytes,type,documentObject)
}={}){
  if(mounted.has(panel))return null;mounted.add(panel);
  if(!Array.isArray(problems)||!problems.length||problems.length>128)return null;
  const document=documentObject,window=windowObject,location=locationObject,stamp=sourceStamp(document);
  let epoch=0,controller=null,busy=false,current=null;
  const box=node(document,'section');box.className='generative-feature-controls generative-session-controls';box.setAttribute('aria-label','Private Sandbox session inspection');
  box.append(node(document,'p','Inspect a Thread session file on this device. Imported claims and completion remain reported, unverified data. No file is uploaded and no Sandbox checker runs here.'));
  const problemLabel=node(document,'label','Associate with the current published problem '),problemSelect=node(document,'select');
  for(const [index,problem]of problems.entries()){const option=node(document,'option',problem.spec.label);option.value=String(index);problemSelect.append(option);}problemSelect.value='0';problemLabel.append(problemSelect);
  const kindLabel=node(document,'label','File type '),kind=node(document,'select');
  for(const [value,label]of [['thread','Thread session JSON'],['capsule','GW source-bound session capsule']]){const option=node(document,'option',label);option.value=value;kind.append(option);}kind.value='thread';kindLabel.append(kind);
  const fileLabel=node(document,'label','Choose a session JSON file '),file=node(document,'input');file.type='file';file.accept='.json,application/json';fileLabel.append(file);
  const routeLabel=node(document,'label'),routeChoice=node(document,'input');routeChoice.type='checkbox';routeChoice.checked=false;
  routeLabel.append(routeChoice,document.createTextNode('Attach this tab’s current validated reading route and return position when creating a capsule (optional).'));
  const status=node(document,'p','No session selected. Files stay in memory unless you explicitly download a copy.');status.className='generative-session-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const output=node(document,'div');output.className='generative-session-inspection';
  const controls=[],make=(label,action)=>{const item=node(document,'button',label);item.type='button';item.addEventListener('click',action);controls.push(item);return item;};
  const selected=()=>problems[Number(problemSelect.value)];
  const fresh=()=>{try{return sourceStamp(document)===stamp;}catch{return false;}};
  const valid=()=>current&&fresh();
  const refresh=()=>{for(const control of [rawDownload,capsuleDownload,aifDownload,xaifDownload])control.disabled=busy||!valid();restore.disabled=busy||!valid()||!current.journey;back.disabled=restore.disabled;cancel.disabled=!busy;};
  const stop=()=>{epoch++;controller?.abort();controller=null;busy=false;refresh();};
  const run=async action=>{
    const token=++epoch;controller?.abort();const own=new AbortController();controller=own;busy=true;refresh();
    const timer=setTimeout(()=>own.abort(),60000),live=()=>token===epoch&&!own.signal.aborted&&fresh();
    try{await action(own.signal,live);if(!live()&&token===epoch)status.textContent=fresh()?'Action cancelled. The last complete inspection is retained.':'Published source changed. Reload before binding a session or restoring a route.';}
    catch(error){if(token===epoch)status.textContent=error?.code==='return-state-not-retained'?'The reading-position update failed and this tab could not restore every previous storage value. The inspected file remains unchanged. Resume or rebuild the reading route before returning.':fresh()?'The file or requested association is unavailable, invalid or stale. The last complete inspection and reading route were retained.':'Published source changed. Reload before binding a session or restoring a route.';}
    finally{clearTimeout(timer);if(token===epoch){busy=false;controller=null;refresh();}}
  };
  function render(inspection){
    output.replaceChildren();output.append(node(document,'h3','Reported session information — not rechecked'));
    output.append(node(document,'p',`${inspection.byteLength} exact file bytes; ${inspection.reported.confirmedClaims} reported confirmed claims; ${inspection.reported.pendingClaims} pending claims. Reported completion: ${inspection.reported.completed===null?'not supplied':inspection.reported.completed?'complete':'not complete'}.`));
    output.append(node(document,'p','“Confirmed” and completion labels describe the exported file. They do not establish truth, proof acceptance, source fidelity or mastery.'));
    const list=node(document,'ul');for(const stage of inspection.reported.stages){const item=node(document,'li',`Stage ${stage.sessionId}: ${stage.confirmedClaims} reported confirmed claims, ${stage.pendingClaims} pending claims.`);
      const claims=node(document,'ul');for(const claim of stage.reportedStatuses)claims.append(node(document,'li',`${claim.claimId}: reported ${claim.status}; not rechecked here.`));item.append(claims);list.append(item);}output.append(list);
    output.append(node(document,'p',inspection.restoration.envelopeCompatible?'This file fits the inspected Sandbox restoration envelope. Actual restoration and fresh checker results remain the Sandbox’s responsibility.':'This file cannot be advertised as a restorable Sandbox envelope. It remains an inspected archive.'));
    if(inspection.restoration.reasons.length){const reasons=node(document,'ul');for(const reason of inspection.restoration.reasons)reasons.append(node(document,'li',reason));output.append(reasons);}
    output.append(node(document,'p',inspection.qualification));
  }
  async function freshRoute(bookmark,signal,live){const catalogue=await loadPublicationImpl(config.publication,{baseURL:config.baseURL,signal});if(!live())throw cancelled();const checked=validateJourney(bookmark,catalogue);return{catalogue,checked,route:routeFrom(catalogue,checked)};}
  async function attachedRoute(signal,live){
    const saved=parseDeliveryJSON(storageObject.getItem(keyFor(config,page))??'null',{maxBytes:65536}),{catalogue,checked,route}=await freshRoute(saved,signal,live);
    const focus=document.activeElement?.id||panel.id||null;if(focus)nativeFocus(document,focus);
    const frame=createReturnFrame(catalogue,{url:location.href,scrollX:window.scrollX,scrollY:window.scrollY,focus,current:checked.current},route);
    return createJourney(catalogue,route,{current:checked.current,detours:[...checked.detours,frame]});
  }
  file.addEventListener('change',()=>void run(async(signal,live)=>{
    const chosen=file.files?.[0];if(!chosen)return;
    const maximum=kind.value==='capsule'?adapter.SANDBOX_SESSION_LIMITS.capsuleBytes:adapter.SANDBOX_SESSION_LIMITS.threadBytes;
    if(!Number.isSafeInteger(chosen.size)||chosen.size<1||chosen.size>maximum)throw cancelled();
    const bytes=new Uint8Array(await chosen.arrayBuffer());if(!live()||bytes.length>maximum)throw cancelled();
    let next;
    if(kind.value==='capsule'){
      const capsule=adapter.parseSessionCapsule(bytes),checked=await adapter.validateSessionCapsule(capsule,contextFor(page,config,selected()),{problemExport:selected(),cryptoObject,signal});
      next={bytes:checked.bytes.slice(),inspection:checked.inspection,capsule,journey:checked.journey??null};
    }else{const inspection=await adapter.inspectThreadSession(bytes,{cryptoObject,signal});next={bytes:bytes.slice(),inspection,capsule:null,journey:null};}
    if(!live())throw cancelled();current=next;render(next.inspection);status.textContent=next.journey?'Session inspected. An attached route is available; restoring it requires a separate explicit action.':'Session inspected locally. Reported states remain unverified; no reading route was changed.';
  }));
  const rawDownload=make('Download exact Thread session bytes',()=>void run(async(_signal,live)=>{if(!current||!live())throw cancelled();download('sandbox-session.json',current.bytes.slice(),'application/json');if(live())status.textContent='Exact original Thread bytes downloaded. Their reported proof and completion states remain unverified.';}));
  const capsuleDownload=make('Download source-bound session capsule',()=>void run(async(signal,live)=>{
    if(!current)throw cancelled();let capsule=current.capsule;
    if(!capsule||routeChoice.checked){const journey=routeChoice.checked?await attachedRoute(signal,live):undefined;if(!live())throw cancelled();capsule=await adapter.createSessionCapsule(current.bytes,contextFor(page,config,selected()),{problemExport:selected(),...(journey?{journey}:{}),cryptoObject,signal});}
    const checked=await adapter.validateSessionCapsule(capsule,contextFor(page,config,selected()),{problemExport:selected(),cryptoObject,signal});if(!live())throw cancelled();
    download('sandbox-session-capsule.json',encoder.encode(JSON.stringify(capsule,null,2)+'\n'),'application/json');if(!live())return;current={...current,capsule,journey:checked.journey??null};status.textContent='Source-bound capsule downloaded. Hashes establish the declared byte association; no proof state was rechecked or restored.';
  }));
  async function project(format,signal,live){
    if(!current)throw cancelled();const mappings=await adapter.validateSessionMappings(sessionMappings,problems);if(!live())throw cancelled();
    const mapping=mappings.find(item=>item.problem===selected().spec.id);let result,bound=true;
    try{result=await adapter.projectArgumentInterchange(current.bytes,{format,context:contextFor(page,config,selected()),problemExport:selected(),...(mapping?{pedagogy:mapping.atoms}:{}),cryptoObject,signal});}
    catch(error){if(!['unrelated-problem','scenario-source-unavailable'].includes(error?.code)||!live())throw error;bound=false;result=await adapter.projectArgumentInterchange(current.bytes,{format,cryptoObject,signal});}
    if(!live())throw cancelled();
    const details=node(document,'section');details.className='generative-session-losses';details.append(node(document,'h4','Interchange scope and losses'),node(document,'p',result.qualification));
    details.append(node(document,'p',bound?'Current scenario declarations match the selected published problem. Pedagogical roles below are explicit author declarations, not inferred from argument edge types or reported proof status.':'This session is not associated with the selected published problem. The projection is unbound and contains no course-role mapping.'));
    const course=(result.data.AIF??result.data).thread?.course;
    if(course){const roles=node(document,'ul');for(const binding of course.bindings??[])if(binding.role)roles.append(node(document,'li',`${binding.atomId}: declared ${binding.role}${binding.targets?.length?'; targets '+binding.targets.map(target=>target.atomId).join(', '):''}.`));details.append(roles);}
    const list=node(document,'ul');for(const loss of result.losses)list.append(node(document,'li',`${loss.code}: ${loss.count}. ${loss.scope}`));details.append(list);output.querySelector('.generative-session-losses')?.remove();output.append(details);
    download('sandbox-session-'+format+'.json',encoder.encode(JSON.stringify(result.data,null,2)+'\n'),'application/json');if(live())status.textContent=bound?'Argument projection downloaded with its displayed loss report. Keep the exact Thread session or capsule for the full archive; AIF alone cannot restore finite proof metadata.':'Unbound argument projection downloaded. No association with the selected course problem or pedagogical role was asserted; keep the exact Thread file for the full archive.';
  }
  const aifDownload=make('Download AIF projection',()=>void run((signal,live)=>project('aif',signal,live))),xaifDownload=make('Download xAIF projection',()=>void run((signal,live)=>project('xaif',signal,live)));
  const restore=make('Restore attached reading route',()=>void run(async(signal,live)=>{if(!current?.journey)throw cancelled();const {checked}=await freshRoute(current.journey,signal,live);if(!live())throw cancelled();storageObject.setItem(keyFor(config,page),JSON.stringify(checked));status.textContent='Validated navigation route restored to this tab, including nested return frames. Use Resume this tab’s route. No claim, completion or knowledge state was imported.';}));
  const back=make('Return to attached reading position',()=>void run(async(signal,live)=>{
    if(!current?.journey)throw cancelled();const {catalogue,checked,route}=await freshRoute(current.journey,signal,live),frame=checked.detours.at(-1);if(!frame)throw cancelled();validateReturnFrame(frame,catalogue,route);if(!live())throw cancelled();
    const bookmark=createJourney(catalogue,route,{current:frame.current,detours:checked.detours.slice(0,-1)}),key=keyFor(config,page);
    if(new URL(frame.url).href===new URL(location.href).href){applyPosition(frame,{documentObject:document,windowObject:window,locationObject:location,page});storageObject.setItem(key,JSON.stringify(bookmark));}
    else commitJourneyReturn(storageObject,key,bookmark,{version:1,project:page.project,frame},()=>location.assign(frame.url));
    status.textContent='Reading position restored through the validated route. Imported session states remain unverified.';
  }));
  const cancel=make('Cancel session action',()=>{stop();status.textContent='Session action cancelled. The last complete inspection and route are retained.';});
  const clear=make('Clear inspected session',()=>{stop();current=null;file.value='';routeChoice.checked=false;output.replaceChildren();status.textContent='Inspected session cleared from these controls. Downloaded files and reading routes are unchanged.';refresh();});
  for(const input of [problemSelect,kind])input.addEventListener('change',()=>{stop();current=null;file.value='';output.replaceChildren();status.textContent='Selection changed. Choose a session file again; no previous session was attached to this problem.';refresh();});
  routeChoice.addEventListener('change',()=>{stop();status.textContent='Route attachment choice changed. It applies only to an explicit capsule download.';});
  box.append(problemLabel,kindLabel,fileLabel,routeLabel,...controls,status,output);panel.append(box);refresh();
  window.addEventListener('pagehide',()=>{stop();});
  return Object.freeze({clear:()=>clear.click(),cancel:()=>cancel.click()});
}
