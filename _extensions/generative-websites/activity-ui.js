// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// R5 private draft. No eager storage, network, model, Journey or Sandbox import.
import {hydrateActivityData} from './activity-native.js';
import {createProgressSession,PROGRESS_QUALIFICATION} from './activity-progress.js';
import {LIMITS,canonical,copy,fail} from './activity-data.js';

/** The existing practice panel delegates an associated check to checkExercise;
 * no duplicate answer input/checker panel or second grading implementation. */
export function mountActivityControls(input,settings={}){
 const doc=settings.documentObject??globalThis.document,win=settings.windowObject??globalThis.window;
 if(!doc||!win)fail('activity-ui-unavailable');
 const root=doc.createElement('div');root.className='generative-activity-progress';
 const status=doc.createElement('p');status.setAttribute('role','status');status.textContent='Preparing optional private activity controls. Authored content remains readable.';
 const nodes=[],originals=[],listeners=[],panels=[],exerciseKeys=new Map();let alive=true,disposed=false,busy=false,epoch=0,session=null,currentData=null,rawIdentity=null,cancelButton=null;
 const node=(tag,label)=>{const el=doc.createElement(tag);if(label!==undefined)el.textContent=label;return el;};
 const on=(target,name,callback)=>{target.addEventListener(name,callback);listeners.push(()=>target.removeEventListener(name,callback));};
 const control=(label,action)=>{const el=node('button',label);el.type='button';el.className='btn btn-secondary';on(el,'click',action);nodes.push(el);return el;};
 const unique=id=>{const matches=[...doc.querySelectorAll('[id]')].filter(el=>el.id===id);if(matches.length!==1)fail('activity-ui-anchor');return matches[0];};
 const identity=()=>canonical(input.data);
 const samePage=()=>{try{const actual=new URL(win.location.href),expected=new URL(input.page.page.url,input.baseURL);actual.hash='';return actual.href===expected.href;}catch{return false;}};
 const current=()=>alive&&!disposed&&samePage()&&rawIdentity===identity()&&(!settings.isCurrent||settings.isCurrent()===true)&&originals.every(entry=>unique(entry.el.id)===entry.el&&entry.el.innerHTML===entry.html)&&(!settings.readData||settings.readData()===settings.initialDataText);
 const assertCurrent=()=>{if(!current())fail('activity-ui-stale');};
 const rowFor=key=>session.get().activities.find(row=>row.key===key);
 const storageMessage=()=>{const value=session.status(),message=value.storage.status==='unavailable'?' Browser storage is unavailable; saved data may remain. Memory is usable.':value.storage.status==='removed'?' Only this activity scope’s saved report was removed.':value.remembered?' Remembering this selected private scope on this device.':' Private progress stays in memory unless you explicitly export or remember it.';return message+(panels.some(panel=>panel.reflections?.some(value=>value.dirty))?' Unsaved reflections remain in their text boxes until you save them.':'');};
 const replaceReflectionDrafts=()=>{for(const panel of panels)for(const reflection of panel.reflections)reflection.dirty=false;};
 function setBusy(value){busy=value;for(const el of nodes)if(el!==cancelButton)el.disabled=value;}
 function targeted(el){let target;try{const fragment=decodeURIComponent(new URL(win.location.href).hash.slice(1));target=fragment?unique(fragment):null;}catch{return false;}return target===el||target&&el.contains(target);}
 function render(){
  if(!session)return;
  for(const panel of panels){const row=rowFor(panel.packet.key),declaration=panel.packet.declaration;
   panel.summary.textContent='Visits reported: '+row.visitCount+'. Attempt reported: '+(row.attemptReported?'yes':'no')+'. Self-completion: '+row.selfCompletion+'. Finite checks reported: '+row.checks.length+'. These are unauthenticated reports; no mastery is inferred.';
   for(const entry of panel.disclosed){const show=entry.kind==='hint'?declaration.disclosure.hints==='open'||row.hintsRevealed.includes(entry.el.id):entry.kind==='solution'?declaration.disclosure.solution==='open'||row.solutionRevealed:declaration.disclosure.feedback==='open'||row.checks.at(-1)?.status===entry.when;entry.el.hidden=!(show||targeted(entry.el));}
   panel.hint.disabled=busy||row.hintsRevealed.length>=declaration.hints.length;panel.solution.disabled=busy||!declaration.solution||row.solutionRevealed;
   panel.completion.value=row.selfCompletion;
   for(const reflection of panel.reflections)if(!reflection.dirty)reflection.input.value=row.reflections.find(value=>value.promptId===reflection.id)?.text??'';
  }
 }
 async function run(action,success='Private report updated. No mastery or proof status was inferred.'){
  if(busy||!session)return null;const token=++epoch;setBusy(true);
  try{assertCurrent();const result=await action({isCurrent:()=>token===epoch&&current()});if(token!==epoch||!current())return null;render();status.textContent=success+storageMessage();return result;}
  catch{if(token===epoch)status.textContent='That optional update was unavailable, cancelled or stale. The last private report was retained; authored content remains readable.';return null;}
  finally{if(token===epoch){setBusy(false);render();}}
 }
 const cancel=()=>{epoch++;session?.cancel();setBusy(false);if(!disposed)status.textContent='Pending private action cancelled. The last report was retained.';};
 function download(raw){if(settings.saveFile)return settings.saveFile('activity-progress.json',raw,'application/json');const objectURL=URL.createObjectURL(new Blob([raw],{type:'application/json'})),link=node('a');link.href=objectURL;link.download='activity-progress.json';link.click();setTimeout(()=>URL.revokeObjectURL(objectURL),1000);}
 const ready=(async()=>{
  rawIdentity=identity();
  currentData=await hydrateActivityData(input.data,{baseURL:input.baseURL,page:input.page,exercises:input.exercises??[],sandboxExports:input.sandboxExports??[],cryptoObject:settings.cryptoObject,isCurrent:()=>alive&&!disposed&&rawIdentity===identity()});
  for(const packet of currentData.packets){
   const native=unique(packet.declaration.id);if(!native.classList.contains('learning-activity')||native.getAttribute('data-gw-activity')!==packet.declaration.id)fail('activity-ui-anchor');
   const allParts=[...packet.declaration.objectives,packet.declaration.task,...packet.declaration.hints,...(packet.declaration.solution?[packet.declaration.solution]:[]),...(packet.declaration.debrief?[packet.declaration.debrief]:[]),...packet.declaration.feedback.map(item=>item.part),...packet.declaration.reflectionPrompts];
   for(const part of allParts){const el=unique(part.id);if(!native.contains(el))fail('activity-ui-anchor');originals.push({el,hidden:el.hidden,html:el.innerHTML});}
   if(packet.practiceBinding?.kind==='exercise'){if(exerciseKeys.has(packet.practiceBinding.id))fail('activity-ui-practice');exerciseKeys.set(packet.practiceBinding.id,packet.key);}
   panels.push({native,packet});
  }
  session=await createProgressSession(currentData.catalogue,{cryptoObject:settings.cryptoObject,storageObject:settings.storageObject,isCurrent:current});assertCurrent();
  for(const panel of panels){const declaration=panel.packet.declaration,key=panel.packet.key,box=node('fieldset');box.className='generative-activity-controls';const heading=node('legend',declaration.label+' — your private activity report'),summary=node('p'),reflections=[];summary.className='generative-activity-summary';
   const hint=control('Show next hint',()=>run(async action=>{const next=declaration.hints[rowFor(key).hintsRevealed.length];if(!next)return;await session.revealHint(key,next.id,action);},'Next hint requested. This does not establish that it was read.'));
   const solution=control('Show worked solution',()=>run(action=>session.revealSolution(key,action),'Worked solution requested. This is help, not a checked completion.'));
   const completion=node('select');for(const [value,label]of [['not-reported','No completion reported'],['reported-complete','I report this task complete'],['reported-incomplete','I report this task incomplete']]){const option=node('option',label);option.value=value;completion.append(option);}nodes.push(completion);const completionLabel=node('label','Self-reported completion');completionLabel.append(completion);on(completion,'change',()=>{const chosen=completion.value;run(action=>session.reportCompletion(key,chosen,action));});
   box.append(heading,summary,control('Record a visit',()=>run(action=>session.visit(key))),control('Record an attempt',()=>run(action=>session.reportAttempt(key))),hint,solution,completionLabel);
   for(const [index,prompt]of declaration.reflectionPrompts.entries()){const group=node('fieldset'),legend=node('legend','Reflection '+(index+1)),link=node('a','Read the authored reflection prompt'),wrapper=node('label','Your private reflection'),textarea=node('textarea');link.href='#'+encodeURIComponent(prompt.id);textarea.maxLength=LIMITS.reflectionCharacters;textarea.rows=3;textarea.setAttribute('aria-describedby',prompt.id);nodes.push(textarea);const reflection={id:prompt.id,input:textarea,dirty:false};on(textarea,'input',()=>{reflection.dirty=true;status.textContent='Unsaved private reflection. Use its Save this reflection control; unrelated hints and checks will retain this draft.';});wrapper.append(textarea);group.append(legend,link,wrapper,control('Save this reflection',()=>{const value=textarea.value;return run(async action=>{await session.reflect(key,prompt.id,value,action);if(textarea.value===value)reflection.dirty=false;},'Private reflection updated. It is not uploaded or added to published evidence.');}));box.append(group);reflections.push(reflection);}
   panel.native.append(box);Object.assign(panel,{box,summary,hint,solution,completion,reflections,disclosed:[...declaration.hints.map(part=>({kind:'hint',el:unique(part.id)})),...(declaration.solution?[{kind:'solution',el:unique(declaration.solution.id)}]:[]),...declaration.feedback.map(item=>({kind:'feedback',when:item.when,el:unique(item.part.id)}))]});
  }
  const details=node('details'),summary=node('summary','Private progress: export, import and optional device storage'),consentLabel=node('label'),consent=node('input');consent.type='checkbox';nodes.push(consent);consentLabel.append(consent,doc.createTextNode('I choose to save this selected private activity report, including my reflections, on this device.'));
  const fileLabel=node('label','Import a private activity report JSON file'),file=node('input');file.type='file';file.accept='.json,application/json';nodes.push(file);fileLabel.append(file);
  on(file,'change',()=>{const selected=file.files?.[0];if(!selected)return;return run(async action=>{if(!Number.isSafeInteger(selected.size)||selected.size<1||selected.size>LIMITS.bytes)fail('activity-progress-budget');const bytes=new Uint8Array(await selected.arrayBuffer());if(bytes.byteLength!==selected.size||bytes.byteLength>LIMITS.bytes||!action.isCurrent())fail('activity-ui-stale');const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);await session.import(raw,action);replaceReflectionDrafts();},'Imported an unauthenticated reader report after matching current activity and source identities.');});
  details.append(summary,node('p',PROGRESS_QUALIFICATION),control('Export private activity report',()=>run(async action=>download(await session.export(action)),'Private JSON exported. The report is not authenticated assessment.')),fileLabel,consentLabel,
   control('Remember private progress on this device',()=>run(action=>{if(!consent.checked)fail('activity-progress-consent-required');return session.remember({...action,consent:true});})),
   control('Stop remembering',()=>run(()=>session.stopRemembering(),'Future writes stopped. Previously saved data may remain.')),
   control('Restore this device’s saved report',()=>run(async action=>{await session.restore({...action,consent:true});if(session.status().storage.status==='observed-saved')replaceReflectionDrafts();},'Saved data was inspected; only a current compatible report can replace memory.')),
   control('Clear this scope’s saved report',()=>run(()=>session.clearSaved(),'Selected saved report deletion attempted.')),
   control('Reset private progress and saved report',()=>run(async action=>{await session.reset(action);replaceReflectionDrafts();},'Private memory reset; selected saved report deletion attempted.')));
  cancelButton=control('Cancel pending private action',cancel);root.append(details,status,cancelButton);panels[0].native.append(root);status.textContent='Private controls ready. Visits and attempts are recorded only when requested.'+storageMessage();render();return api;
 })().catch(error=>{for(const entry of originals)entry.el.hidden=entry.hidden;for(const panel of panels)panel.box?.remove();root.remove();settings.onUnavailable?.(error?.code??'activity-ui-unavailable');throw error;});
 const api=Object.freeze({ready,hasExercise:id=>exerciseKeys.has(id),
  async checkExercise(id,answer,seed,action={}){await ready;const key=exerciseKeys.get(id);if(!key)return null;if(busy)fail('activity-progress-busy');let outcome;await run(async own=>{outcome=await session.checkExercise(key,answer,seed,{...action,isCurrent:()=>own.isCurrent()&&(!action.isCurrent||action.isCurrent()===true)});},'Finite check reported. No response text or mastery judgment was retained.');if(!outcome)fail('activity-ui-check-unavailable');return outcome.result.checker;},
  cancel,get:()=>session?.get()??null,status:()=>session?.status()??null,
  dispose(){if(disposed)return;disposed=true;cancel();listeners.splice(0).forEach(remove=>remove());for(const entry of originals)entry.el.hidden=entry.hidden;for(const panel of panels)panel.box?.remove();root.remove();}
 });
 on(win,'pagehide',()=>{alive=false;cancel();for(const entry of originals)entry.el.hidden=entry.hidden;});
 on(win,'pageshow',()=>{if(disposed)return;alive=true;if(session&&current())render();else if(session){status.textContent='This restored page no longer matches its activity source. Authored content remains readable.';setBusy(true);}});
 on(win,'hashchange',()=>{if(session&&current())render();});
 return api;
}
