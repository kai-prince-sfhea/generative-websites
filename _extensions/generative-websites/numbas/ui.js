// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Private original adapter: native Numbas executes and grades its own activity.
import {NUMBAS_LIMITS,validateNumbasPayload,verifyNumbasPayload,current,sha,fail,scanEntry} from './admission.js';
const decoder=new TextDecoder('utf-8',{fatal:true});

async function fetchBounded(url,file,{fetchImpl,signal,check}){
 check();const response=await fetchImpl(url,{signal,credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',cache:'no-store'});check();
 if(!response?.ok||response.redirected||response.url&&response.url!==url)fail('resource-unavailable-or-redirected');
 const length=response.headers?.get('content-length'),encoding=response.headers?.get('content-encoding');if(length!==null&&length!==undefined&&(!/^\d+$/u.test(length)||!Number.isSafeInteger(Number(length))||(!encoding||encoding==='identity')&&Number(length)!==file.bytes))fail('resource-length-mismatch');
 if(!response.body?.getReader)fail('bounded-stream-unavailable');const reader=response.body.getReader(),chunks=[];let size=0,completed=false;
 try{while(true){check();const result=await reader.read();check();if(result.done){completed=true;break;}if(!(result.value instanceof Uint8Array)||(size+=result.value.length)>file.bytes)fail('resource-size-mismatch');chunks.push(new Uint8Array(result.value));}if(size!==file.bytes)fail('resource-size-mismatch');const bytes=new Uint8Array(size);let at=0;for(const part of chunks){bytes.set(part,at);at+=part.length;}return bytes;
 }finally{if(!completed)try{await reader.cancel();}catch{}reader.releaseLock?.();}
}

// Observes existing v11 state; it does not infer marks, mastery or proof status.
export function nativeReadiness(frame,payload,{baseURL}={}){
 try{const win=frame.contentWindow,doc=frame.contentDocument;if(!win||!doc||win.location.href!==new URL(payload.entry,new URL(payload.packagePath,baseURL)).href)return {status:'waiting'};
 const exams=doc.querySelectorAll('numbas-exam');if(exams.length!==1)return {status:'waiting'};const element=exams[0];
 if(element.getAttribute('seed')!==payload.seed||element.getAttribute('storage')!=='none')return {status:'refused',code:'native-seed-or-storage-mismatch'};
 if(typeof element.viewModel?.loaded!=='function'||element.viewModel.loaded()!==true)return {status:'waiting',element};
 const exam=typeof element.viewModel.exam==='function'?element.viewModel.exam()?.exam:null;
 if(!exam||String(exam.seed)!==payload.seed)return {status:'refused',code:'native-seed-mismatch'};
 return {status:'ready',element,seed:payload.seed};
 }catch{return {status:'waiting'};}
}

export function mountNumbasActivity(container,input,{baseURL,fetchImpl=globalThis.fetch?.bind(globalThis),cryptoObject=globalThis.crypto,isCurrent=()=>true,readyTimeoutMs=NUMBAS_LIMITS.readyTimeoutMs,preflightTimeoutMs=NUMBAS_LIMITS.readyTimeoutMs,setTimeoutImpl=setTimeout,clearTimeoutImpl=clearTimeout}={}){
 const payload=validateNumbasPayload(input,{baseURL});if(!container?.ownerDocument||typeof fetchImpl!=='function'||!Number.isSafeInteger(readyTimeoutMs)||readyTimeoutMs<10||readyTimeoutMs>60000||!Number.isSafeInteger(preflightTimeoutMs)||preflightTimeoutMs<10||preflightTimeoutMs>60000)fail('invalid-ui-environment');
 const doc=container.ownerDocument,controls=doc.createElement('div'),loadButton=doc.createElement('button'),unloadButton=doc.createElement('button'),status=doc.createElement('p'),notice=doc.createElement('p'),slot=doc.createElement('div');
 controls.className='gw-numbas-controls';loadButton.type=unloadButton.type='button';loadButton.textContent='Load '+payload.label;unloadButton.textContent='Unload activity';unloadButton.disabled=true;status.setAttribute('role','status');status.setAttribute('aria-atomic','true');notice.textContent='Loads trusted same-origin Numbas activity ('+payload.files.length+' files; '+payload.totalBytes+' bytes). This frame is not a security sandbox. Host policy is unchanged. The static prompt remains available.';controls.append(loadButton,unloadButton);container.append(controls,notice,status,slot);
 let epoch=0,disposed=false,controller=null,frame=null,cleanupReady=()=>{},state=Object.freeze({status:'not-loaded',sourceDigest:payload.sourceDigest});
 const ownsFocus=node=>!disposed&&controls.ownerDocument===doc&&controls.isConnected===true&&doc.activeElement===node;
 function refreshControls(){
  const busy=state.status==='checking'||state.status==='starting',ready=state.status==='ready',ownsLoad=ownsFocus(loadButton),ownsUnload=ownsFocus(unloadButton);
  if(!ready)loadButton.disabled=false;if(busy||ready)unloadButton.disabled=false;
  if(ready&&ownsLoad)unloadButton.focus();else if(!busy&&!ready&&ownsUnload)loadButton.focus();
  loadButton.disabled=ready;unloadButton.disabled=!(busy||ready);
  if(busy){loadButton.setAttribute('aria-disabled','true');loadButton.setAttribute('aria-busy','true');}
  else{loadButton.removeAttribute('aria-disabled');loadButton.removeAttribute('aria-busy');}
 }
 const keepFrameFocus=()=>{if(frame&&ownsFocus(frame)){loadButton.disabled=false;loadButton.focus();}};
 const setState=(next,message)=>{state=Object.freeze({...next,sourceDigest:payload.sourceDigest});status.textContent=message;refreshControls();};
 const clearFrame=()=>{cleanupReady();cleanupReady=()=>{};frame?.remove();frame=null;};
 const invalidate=()=>{epoch++;controller?.abort(new DOMException('Cancelled','AbortError'));controller=null;clearFrame();};
 const active=(token,signal)=>{if(disposed||token!==epoch)throw new DOMException('Cancelled','AbortError');current({signal,isCurrent});};
 function unload(){if(disposed)return;if(ownsFocus(unloadButton)){loadButton.disabled=false;loadButton.focus();}else keepFrameFocus();invalidate();setState({status:'not-loaded'},'Activity unloaded. The static prompt remains available.');}
 async function load(){if(disposed)return state;keepFrameFocus();invalidate();const token=epoch,job=controller=new AbortController(),check=()=>active(token,job.signal);setState({status:'checking'},'Checking the declared activity files.');let timeout=setTimeoutImpl(()=>job.abort(new DOMException('Preflight timed out','TimeoutError')),preflightTimeoutMs);
 try{await verifyNumbasPayload(payload,{baseURL,cryptoObject,signal:job.signal,isCurrent:()=>!disposed&&token===epoch&&isCurrent()});check();let next=0,checked=0;const entries=new Map();async function worker(){while(next<payload.files.length){check();const file=payload.files[next++],url=new URL(file.path.split('/').map(encodeURIComponent).join('/'),new URL(payload.packagePath,baseURL)).href,bytes=await fetchBounded(url,file,{fetchImpl,signal:job.signal,check});if(await sha(bytes,cryptoObject)!==file.sha256)fail('resource-digest-mismatch');check();if(file.path===payload.entry)entries.set(file.path,bytes);checked++;setState({status:'checking',checkedFiles:checked},'Checked '+checked+' of '+payload.files.length+' activity files.');}}await Promise.all([worker(),worker()]);check();
 const entry=scanEntry(decoder.decode(entries.get(payload.entry)));if(entry.exam.attrs.seed!==payload.seed||entry.exam.attrs.storage!=='none')fail('native-seed-or-storage-mismatch');clearTimeoutImpl(timeout);timeout=null;check();frame=doc.createElement('iframe');frame.setAttribute('data-gw-numbas-focus-owner',payload.profile);frame.title=payload.label+' — Numbas activity';frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('allow','camera \u0027none\u0027; microphone \u0027none\u0027; geolocation \u0027none\u0027');
 // Same-origin authored code remains trusted. No sandbox/isolation claim or score IPC.
 const ownedFrame=frame;setState({status:'starting',checkedFiles:checked},'Waiting for the native Numbas activity. If host CSP blocks it, use the static prompt.');
 await new Promise((resolve,reject)=>{let poll=null,deadline=null,element=null,settled=false;const cleanup=()=>{if(poll!==null)clearTimeoutImpl(poll);if(deadline!==null)clearTimeoutImpl(deadline);ownedFrame.removeEventListener('load',probe);job.signal.removeEventListener('abort',abort);element?.removeEventListener('numbas:loaded',probe);};const finish=(error)=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve();};const abort=()=>finish(job.signal.reason??new DOMException('Cancelled','AbortError'));function probe(){if(settled)return;try{check();const observation=nativeReadiness(ownedFrame,payload,{baseURL});if(observation.status==='refused')fail(observation.code);if(observation.status==='ready'){finish();return;}if(observation.element&&element!==observation.element){element?.removeEventListener('numbas:loaded',probe);element=observation.element;element.addEventListener('numbas:loaded',probe);}if(poll!==null)clearTimeoutImpl(poll);poll=setTimeoutImpl(probe,100);}catch(error){finish(error);}}cleanupReady=()=>finish(new DOMException('Cancelled','AbortError'));job.signal.addEventListener('abort',abort,{once:true});ownedFrame.addEventListener('load',probe);deadline=setTimeoutImpl(()=>{const error=new Error('Numbas ready timeout');error.code='native-ready-timeout';finish(error);},readyTimeoutMs);ownedFrame.src=new URL(payload.entry,new URL(payload.packagePath,baseURL)).href;slot.append(ownedFrame);probe();});check();setState({status:'ready',checkedFiles:checked,seed:payload.seed},'Native Numbas activity is ready with the declared seed. Numbas handles answers and feedback.');return state;
 }catch(error){if(token!==epoch||disposed)return state;keepFrameFocus();job.abort();clearFrame();const code=error?.code??(error?.name==='TimeoutError'?'preflight-timeout':error?.name==='AbortError'?'cancelled':'activity-unavailable');setState({status:'unavailable',code},'Activity unavailable ('+code+'). The static prompt remains available; check the local package and host CSP.');return state;
 }finally{if(timeout!==null)clearTimeoutImpl(timeout);if(controller===job)controller=null;}}
 function dispose(){if(disposed)return;invalidate();disposed=true;loadButton.removeEventListener('click',clickLoad);unloadButton.removeEventListener('click',unload);controls.remove();notice.remove();status.remove();slot.remove();}
 const clickLoad=()=>{if(loadButton.disabled||loadButton.getAttribute('aria-disabled')==='true')return;void load();};loadButton.addEventListener('click',clickLoad);unloadButton.addEventListener('click',unload);setState({status:'not-loaded'},'Activity not loaded.');return Object.freeze({load,unload,dispose,getState:()=>state,elements:Object.freeze({loadButton,unloadButton,status,slot})});
}
