// Copyright 2026 Kai Prince; SPDX-License-Identifier: Apache-2.0
// Original finite WAI-Adapt annotation/local project symbol-set pilot.
import {controlledData,controlledFields,controlledCanonical,controlledDigest,controlledFreeze,controlledFail} from './controlled-authoring.js';

export const WAI_SYMBOL_PROFILE='gw-wai-symbols-pilot-v1';
export const WAI_SYMBOL_HELPER='gw-local-symbols-v1';
export const WAI_SYMBOL_LIMITS=Object.freeze({annotations:32,assets:32,labelCharacters:512,assetBytes:262144,totalAssetBytes:2097152,pngDimension:2048,pngPixels:4194304});
export const WAI_SYMBOL_REGISTRY=controlledFreeze({version:'w3c-aac-registry-2022-12-13',source:'https://www.w3.org/TR/aac-registry/',concepts:[{id:'14704',meaning:'help, aid, assistance, support (noun)'},{id:'14705',meaning:'help, aid, assist, serve, support (verb)'},{id:'14885',meaning:'home'}]});
export const WAI_SYMBOL_QUALIFICATION='Finite reviewed adapt-symbol annotations and an optional original local project symbol-set helper. Declared reviews and rights are not authenticated approval, AAC familiarity, external-helper acceptance or full WAI-Adapt conformance.';
const fail=code=>controlledFail(code),canonical=controlledCanonical;
const fields=(value,required,optional=[])=>{try{return controlledFields(value,required,optional);}catch{fail('wai-symbol-fields');}};
const list=(value,max)=>{if(!Array.isArray(value)||value.length>max)fail('wai-symbol-budget');return value;};
const text=(value,max=256)=>{if(typeof value!=='string'||!value.trim()||value.length>max)fail('wai-symbol-text');return value;};
const id=value=>{if(typeof value!=='string'||! /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/u.test(value))fail('wai-symbol-id');return value;};
const sha=value=>{if(typeof value!=='string'||! /^[a-f0-9]{64}$/u.test(value))fail('wai-symbol-hash');return value;};
const concept=value=>{if(typeof value!=='string'||!WAI_SYMBOL_REGISTRY.concepts.some(row=>row.id===value))fail('wai-symbol-concept');return value;};
const unique=(rows,key)=>{if(new Set(rows.map(row=>row[key])).size!==rows.length)fail('wai-symbol-duplicate');return rows;};
function path(value,{relativeParents=false}={}){
 text(value,512);
 if(value.startsWith('/')||/[\\%?#:]/u.test(value)||value.split('/').some(part=>!part||part==='.'||part==='..'&&!relativeParents)||!value.toLowerCase().endsWith('.png'))fail('wai-symbol-path');
 return value;
}
function scopeOf(value){fields(value,['projectId','projectRevision','pageURL','pageSourceSha256']);id(value.projectId);text(value.projectRevision,128);text(value.pageURL,512);if(value.pageURL.startsWith('/')||/[\\%?#:]/u.test(value.pageURL)||value.pageURL.split('/').some(part=>!part||part==='.'||part==='..')||! /\.html?$/iu.test(value.pageURL))fail('wai-symbol-scope');sha(value.pageSourceSha256);return value;}
function observationOf(value){
 fields(value,['id','revision','concept','sourceDigest','sourceSha256','text','reviewedBy']);id(value.id);text(value.revision,128);concept(value.concept);sha(value.sourceSha256);text(value.text,WAI_SYMBOL_LIMITS.labelCharacters);text(value.reviewedBy);
 if(typeof value.sourceDigest!=='string'||!/^sha1:[a-f0-9]{40}$/u.test(value.sourceDigest)||/[\r\n\t]/u.test(value.text))fail('wai-symbol-source');
 return value;
}
function assetOf(value){
 fields(value,['concept','path','url','bytes','sha256','licence','attribution']);concept(value.concept);path(value.path);path(value.url,{relativeParents:true});sha(value.sha256);text(value.licence,256);text(value.attribution,1024);
 if(!Number.isSafeInteger(value.bytes)||value.bytes<57||value.bytes>WAI_SYMBOL_LIMITS.assetBytes)fail('wai-symbol-budget');return value;
}
function configOf(value){
 fields(value,[],['mode','helper','symbols','reviews']);const result={mode:value.mode??'inspect',helper:value.helper??false,symbols:value.symbols??[],reviews:value.reviews??[]};
 if(!['inspect','reviewed'].includes(result.mode)||![false,WAI_SYMBOL_HELPER].includes(result.helper))fail('wai-symbol-mode');
 unique(list(result.symbols,WAI_SYMBOL_LIMITS.assets).map(row=>{fields(row,['concept','path','licence','attribution']);concept(row.concept);path(row.path,{relativeParents:true});text(row.licence);text(row.attribution,1024);return row;}),'concept');
 unique(list(result.reviews,WAI_SYMBOL_LIMITS.annotations).map(row=>{fields(row,['id','revision','snapshotSha256','review','reviewedBy']);id(row.id);text(row.revision,128);sha(row.snapshotSha256);if(row.review!=='author-reviewed')fail('wai-symbol-review');text(row.reviewedBy);return row;}),'id');return result;
}
const frame=(helper,symbols,binding)=>({version:1,profile:WAI_SYMBOL_PROFILE,registry:WAI_SYMBOL_REGISTRY,helper,symbols,...binding});
const notice=status=>status==='inspect'?'Inspect the exact native label, registry meaning, local asset and declared rights, then copy the current YAML review pins. Authored text is retained.':status==='reviewed'?'Current declared source/registry/asset review pins match. Text remains the accessible name; symbol display is an explicit optional local helper action.':'The optional symbol enhancement is unavailable because a review is missing or stale. Authored text is retained.';

/** The native caller confines files and validates their PNG bytes before passing
 * metadata. This pure step binds that observation; it does not read a path. */
export async function prepareWaiSymbolsNative(input,{cryptoObject=globalThis.crypto}={}){
 const value=controlledData(input);fields(value,[],['config','observations','assets','scope']);
 if(value.config===undefined||value.config===false)return controlledFreeze({version:1,kind:'gw-wai-symbols',profile:WAI_SYMBOL_PROFILE,status:'disabled',helper:false,annotations:[],inspection:null,previewConfig:null});
 const config=configOf(value.config),scope=scopeOf(value.scope),observations=unique(list(value.observations??[],WAI_SYMBOL_LIMITS.annotations).map(observationOf),'id'),assets=unique(list(value.assets??[],WAI_SYMBOL_LIMITS.assets).map(assetOf),'concept');
 if(assets.reduce((sum,row)=>sum+row.bytes,0)>WAI_SYMBOL_LIMITS.totalAssetBytes)fail('wai-symbol-budget');
 if(assets.length!==config.symbols.length||config.symbols.some(row=>!assets.some(asset=>['concept','licence','attribution'].every(key=>asset[key]===row[key]))))fail('wai-symbol-asset-binding');
 if(config.helper===WAI_SYMBOL_HELPER&&observations.some(row=>!assets.some(asset=>asset.concept===row.concept)))fail('wai-symbol-asset-missing');
 const binding={scope,observations,assets},snapshotSha256=await controlledDigest(canonical(frame(config.helper,config.symbols,binding)),cryptoObject);
 const reviews=observations.map(row=>({id:row.id,revision:row.revision,snapshotSha256,review:'author-reviewed',reviewedBy:row.reviewedBy}));
 const accepted=config.mode==='reviewed'&&config.reviews.length===reviews.length&&reviews.every(expected=>config.reviews.some(actual=>['id','revision','snapshotSha256','review'].every(key=>actual[key]===expected[key])));
 const status=config.mode==='inspect'?'inspect':accepted?'reviewed':'unavailable';
 const records=observations.map(row=>({...row,meaning:WAI_SYMBOL_REGISTRY.concepts.find(entry=>entry.id===row.concept).meaning,asset:assets.find(entry=>entry.concept===row.concept)??null}));
 return controlledFreeze({version:1,kind:'gw-wai-symbols',profile:WAI_SYMBOL_PROFILE,status,helper:config.helper,snapshotSha256,binding,annotations:accepted?observations.map(row=>({...row,snapshotSha256})):[],inspection:{reason:status==='unavailable'?'wai-symbol-review-stale':null,records,notice:notice(status)+' '+WAI_SYMBOL_QUALIFICATION},previewConfig:{mode:'reviewed',helper:config.helper,symbols:config.symbols,reviews:accepted?config.reviews:reviews}});
}

/** Regenerate a reviewed packet before browser use. These hashes bind data and
 * expose staleness; they do not authenticate the author or a script origin. */
export async function hydrateWaiSymbolsPacket(input,{cryptoObject=globalThis.crypto}={}){
 const value=controlledData(input);fields(value,['version','kind','profile','status','helper','snapshotSha256','binding','annotations','inspection','previewConfig']);
 if(value.version!==1||value.kind!=='gw-wai-symbols'||value.profile!==WAI_SYMBOL_PROFILE||value.status!=='reviewed')fail('wai-symbol-packet');
 fields(value.binding,['scope','observations','assets']);
 const expected=await prepareWaiSymbolsNative({config:value.previewConfig,...value.binding},{cryptoObject});
 if(canonical(expected)!==canonical(value))fail('wai-symbol-packet');return expected;
}

const crc32=(bytes,start,end)=>{let crc=0xffffffff;for(let at=start;at<end;at++){crc^=bytes[at];for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;};
/** Shared native/browser finite static PNG envelope. Bounded chunks/CRC and
 * dimensions are checked without inflating compressed data. Actual decoding is
 * checked separately by the explicit browser action before any image is shown. */
export function validateWaiSymbolPNG(bytes){
 const signature=[137,80,78,71,13,10,26,10];if(!(bytes instanceof Uint8Array)||bytes.length<57||bytes.length>WAI_SYMBOL_LIMITS.assetBytes||signature.some((value,index)=>bytes[index]!==value))fail('wai-symbol-png');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let at=8,index=0,width=0,height=0,color=-1,palette=0,transparency=false,idat=false,idatEnded=false,compressed=0;
 while(at<bytes.length){
  if(at+12>bytes.length)fail('wai-symbol-png');const size=view.getUint32(at),type=String.fromCharCode(...bytes.subarray(at+4,at+8)),end=at+8+size;
  if(size>bytes.length-at-12||! /^[A-Za-z]{2}[A-Z][A-Za-z]$/u.test(type)||crc32(bytes,at+4,end)!==view.getUint32(end))fail('wai-symbol-png');
  if(index===0){
   if(type!=='IHDR'||size!==13)fail('wai-symbol-png');width=view.getUint32(at+8);height=view.getUint32(at+12);const depth=bytes[at+16];color=bytes[at+17];
   if(!width||!height||width>WAI_SYMBOL_LIMITS.pngDimension||height>WAI_SYMBOL_LIMITS.pngDimension||width*height>WAI_SYMBOL_LIMITS.pngPixels||!({0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]})[color]?.includes(depth)||bytes[at+18]!==0||bytes[at+19]!==0||bytes[at+20]>1)fail('wai-symbol-png');
  }else if(type==='IHDR'||['acTL','fcTL','fdAT'].includes(type))fail('wai-symbol-png');
  else if(type==='PLTE'){if(idat||palette||[0,4].includes(color)||!size||size>768||size%3)fail('wai-symbol-png');palette=size/3;}
  else if(type==='tRNS'){if(idat||transparency||![0,2,3].includes(color)||color===0&&size!==2||color===2&&size!==6||color===3&&(!palette||!size||size>palette))fail('wai-symbol-png');transparency=true;}
  else if(type==='IDAT'){if(idatEnded||color===3&&!palette)fail('wai-symbol-png');idat=true;compressed+=size;}
  else if(type==='IEND'){if(size||end+4!==bytes.length||!idat||!compressed)fail('wai-symbol-png');return Object.freeze({width,height});}
  else if(type[0]===type[0].toUpperCase())fail('wai-symbol-png');
  if(idat&&type!=='IDAT')idatEnded=true;at=end+4;index++;
 }
 fail('wai-symbol-png');
}
function assetURL(value,href){let result;try{result=new URL(value,href);}catch{fail('wai-symbol-url');}const current=new URL(href);if(!['http:','https:'].includes(current.protocol)||result.origin!==current.origin||result.username||result.password||result.search||result.hash)fail('wai-symbol-url');return result.href;}
async function readImage(asset,{href,fetchImpl,signal,cryptoObject}){
 const url=assetURL(asset.url,href),response=await fetchImpl(url,{method:'GET',mode:'same-origin',credentials:'omit',cache:'no-store',redirect:'error',signal});
 if(!response?.ok||response.url&&response.url!==url||!response.body||typeof response.body.getReader!=='function')fail('wai-symbol-fetch');
 const length=response.headers?.get?.('content-length');if(length!==null&&length!==undefined&&(!/^\d+$/u.test(length)||Number(length)!==asset.bytes))fail('wai-symbol-fetch');
 const reader=response.body.getReader(),parts=[];let size=0,complete=false;
 try{for(;;){if(signal.aborted)fail('wai-symbol-cancelled');const part=await reader.read();if(part.done){complete=true;break;}if(!(part.value instanceof Uint8Array)||(size+=part.value.byteLength)>asset.bytes)fail('wai-symbol-budget');parts.push(part.value.slice());}if(size!==asset.bytes)fail('wai-symbol-fetch');}
 finally{if(!complete)try{await reader.cancel();}catch{}reader.releaseLock?.();}
 if(signal.aborted)fail('wai-symbol-cancelled');const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}validateWaiSymbolPNG(bytes);
 // Hash bytes directly, without a text conversion that could alter an image.
 if(!cryptoObject?.subtle)fail('wai-symbol-crypto');const actual=[...new Uint8Array(await cryptoObject.subtle.digest('SHA-256',bytes))].map(byte=>byte.toString(16).padStart(2,'0')).join('');if(actual!==asset.sha256)fail('wai-symbol-asset-stale');return bytes;
}
const excludedRoles=new Set(['answer','solution','hint','feedback','post-attempt','generative-answer','generative-solution','generative-feedback']);
function eligible(el,doc){
 if(el.ownerDocument!==doc||el.isConnected!==true||el.tagName!=='SPAN'||!(el.getAttribute('class')??'').split(/\s+/u).includes('learning-symbol'))return false;
 for(let current=el;current;current=current.parentNode){if(current.ownerDocument&&current.ownerDocument!==doc)return false;const attr=name=>current.getAttribute?.(name);if(current.hidden||current.inert||attr('hidden')!==undefined&&attr('hidden')!==null||attr('inert')!==undefined&&attr('inert')!==null||attr('aria-hidden')==='true'||attr('public')==='false'||attr('consent')==='false'||attr('visibility')==='private'||attr('audience')==='private'||['SCRIPT','STYLE','TEMPLATE','NOSCRIPT','CODE','PRE','MATH','SVG','TEXTAREA'].includes(current.tagName))return false;const classes=(attr('class')??current.className??'').split(/\s+/u);if(classes.some(name=>name==='private'||name==='content-hidden'||excludedRoles.has(name)))return false;for(const key of ['learning-role','data-learning-role','scenario-role'])if(excludedRoles.has(attr(key)))return false;}
 return true;
}
const attributes=el=>canonical([...el.attributes].map(entry=>Array.isArray(entry)?entry:[entry.name,entry.value]).sort((a,b)=>a[0].localeCompare(b[0])));
async function decodedImage(image,signal){
 if(typeof image.decode!=='function'||signal.aborted)fail('wai-symbol-decode');let cancel;const cancelled=new Promise((resolve,reject)=>{cancel=()=>reject(Error('wai-symbol-cancelled'));signal.addEventListener('abort',cancel,{once:true});});
 try{await Promise.race([image.decode(),cancelled]);if(signal.aborted||image.naturalWidth!==undefined&&(!image.naturalWidth||!image.naturalHeight||image.naturalWidth>WAI_SYMBOL_LIMITS.pngDimension||image.naturalHeight>WAI_SYMBOL_LIMITS.pngDimension||image.naturalWidth*image.naturalHeight>WAI_SYMBOL_LIMITS.pngPixels))fail('wai-symbol-decode');}
 finally{signal.removeEventListener('abort',cancel);}
}

/** No asset request occurs until show(). Only owned image nodes/blob URLs are
 * removed. Label text, source attributes, focus and accessible names are untouched. */
export function mountWaiSymbolControls(input,settings={}){
 const doc=settings.documentObject??globalThis.document,win=settings.windowObject??globalThis.window;if(!doc||!win)fail('wai-symbol-ui-unavailable');
 const root=doc.createElement('div');root.className='generative-wai-symbol-controls';const status=doc.createElement('p');status.setAttribute('role','status');status.textContent='Optional local symbols are off. Authored text remains readable.';
 const showButton=doc.createElement('button'),resetButton=doc.createElement('button');showButton.type=resetButton.type='button';showButton.textContent='Show symbols';resetButton.textContent='Reset symbols';showButton.disabled=true;root.append(showButton,resetButton,status);settings.container?.append(root);
 const fetchImpl=settings.fetchImpl??globalThis.fetch,cryptoObject=settings.cryptoObject??globalThis.crypto,urlAPI=settings.urlObject??win.URL??globalThis.URL,BlobClass=settings.BlobClass??win.Blob??globalThis.Blob;
 const listeners=[],originals=[],owned=[],blobURLs=[];let packet=null,identity=null,expectedURL=null,ready=false,alive=true,disposed=false,shown=false,loading=false,invalidated=false,epoch=0,abort=null,observer=null;
 const on=(target,name,handler)=>{target.addEventListener(name,handler);listeners.push(()=>target.removeEventListener(name,handler));};
 const unique=anchor=>{const matches=[...doc.querySelectorAll('[id]')].filter(el=>el.id===anchor);if(matches.length!==1)fail('wai-symbol-ui-anchor');return matches[0];};
 const cleanup=()=>{for(const row of owned.splice(0))row.image.remove();for(const url of blobURLs.splice(0))try{urlAPI.revokeObjectURL(url);}catch{}shown=false;};
 function current(){try{const now=new URL(win.location.href);now.hash='';return ready&&alive&&!disposed&&!invalidated&&root.ownerDocument===doc&&root.isConnected===true&&(!win.document||win.document===doc)&&(!doc.defaultView||doc.defaultView===win)&&win.closed!==true&&now.href===expectedURL&&identity===canonical(controlledData(input))&&(!settings.isCurrent||settings.isCurrent()===true)&&(!settings.readData||settings.readData()===settings.initialDataText)&&originals.every(row=>unique(row.record.id)===row.el&&eligible(row.el,doc)&&row.el.parentNode===row.parent&&row.el.innerHTML===row.html&&attributes(row.el)===row.attributes&&row.el.textContent===row.record.text)&&owned.every(row=>row.image.ownerDocument===doc&&row.image.isConnected===true&&row.image.parentNode===row.parent&&row.image.src===row.src&&attributes(row.image)===row.attributes);}catch{return false;}}
 function reset(message='Local symbols are off. Authored text is retained.'){epoch++;abort?.abort();abort=null;loading=false;cleanup();showButton.disabled=!current();if(!disposed)status.textContent=message;}
 async function show(){
  if(shown){if(current())return true;reset('Optional local symbols are unavailable or stale. Authored text is retained.');return false;}if(loading)return false;const token=++epoch;if(!current()||typeof fetchImpl!=='function'||typeof urlAPI?.createObjectURL!=='function'||typeof BlobClass!=='function'){reset('Optional local symbols are unavailable or stale. Authored text is retained.');return false;}
  abort?.abort();abort=new AbortController();const controller=abort,signal=controller.signal,timer=setTimeout(()=>controller.abort(),15000);loading=true;showButton.disabled=true;status.textContent='Checking the selected local symbol images. Reset remains available.';
  try{
   const images=new Map();for(const asset of packet.binding.assets){const bytes=await readImage(asset,{href:win.location.href,fetchImpl,signal,cryptoObject});if(token!==epoch||signal.aborted||!current())fail('wai-symbol-ui-stale');const url=urlAPI.createObjectURL(new BlobClass([bytes],{type:'image/png'}));if(typeof url!=='string'||!url.startsWith('blob:')){try{urlAPI.revokeObjectURL(url);}catch{}fail('wai-symbol-url');}blobURLs.push(url);images.set(asset.concept,url);}
   if(token!==epoch||signal.aborted||!current())fail('wai-symbol-ui-stale');
   const pendingImages=[];for(const row of originals){const image=doc.createElement('img');image.className='generative-wai-symbol';image.setAttribute('alt','');image.setAttribute('aria-hidden','true');image.setAttribute('data-gw-symbol-owner',row.record.id);image.src=images.get(row.record.concept);await decodedImage(image,signal);if(token!==epoch||signal.aborted||!current())fail('wai-symbol-ui-stale');pendingImages.push({image,parent:row.parent,src:image.src,attributes:attributes(image),source:row.el});}
   if(token!==epoch||signal.aborted||!current())fail('wai-symbol-ui-stale');for(const row of pendingImages){owned.push(row);row.parent.insertBefore(row.image,row.source.nextSibling);}
   shown=true;status.textContent='Local project symbols are shown beside retained text. This does not establish AAC familiarity or external-helper support.';return true;
  }catch{if(token===epoch){abort?.abort();cleanup();status.textContent='Optional local symbols are unavailable, cancelled or stale. Authored text is retained.';}return false;}
  finally{clearTimeout(timer);if(token===epoch){loading=false;showButton.disabled=!current();}}
 }
 on(showButton,'click',()=>{void show();});on(resetButton,'click',()=>reset());on(win,'pagehide',()=>{alive=false;reset('Local symbols are off after leaving the page. Authored text is retained.');});on(win,'pageshow',()=>{alive=true;reset('Local symbols are off. Use Show symbols again when wanted.');});
 const readyPromise=(async()=>{
  identity=canonical(controlledData(input));packet=await hydrateWaiSymbolsPacket(input,{cryptoObject});if(disposed||!alive||identity!==canonical(controlledData(input))||packet.helper!==WAI_SYMBOL_HELPER||!packet.annotations.length)fail('wai-symbol-ui-unavailable');
  const expected=new URL(packet.binding.scope.pageURL,settings.baseURL??win.location.href);expected.hash='';expectedURL=expected.href;
  for(const record of packet.annotations){const el=unique(record.id);if(!eligible(el,doc)||el.textContent!==record.text||el.getAttribute('adapt-symbol')!==record.concept||el.getAttribute('data-gw-symbol-snapshot')!==packet.snapshotSha256||el.childNodes&&[...el.childNodes].some(child=>child.nodeType!==3))fail('wai-symbol-ui-anchor');originals.push({record,el,parent:el.parentNode,html:el.innerHTML,attributes:attributes(el)});}
  ready=true;if(root.isConnected===true&&!current())fail('wai-symbol-ui-stale');const Observer=settings.MutationObserverClass??win.MutationObserver;if(typeof Observer==='function'&&doc.documentElement){observer=new Observer(()=>{if(ready&&alive&&!disposed&&!invalidated&&!current()){invalidated=true;reset('Optional local symbols became stale. Authored text is retained.');}});observer.observe(doc.documentElement,{subtree:true,childList:true,attributes:true,characterData:true});}showButton.disabled=false;return packet;
 })();
 readyPromise.catch(()=>{cleanup();showButton.disabled=true;if(!disposed)status.textContent='Optional local symbols are unavailable. Authored text is retained.';});
 return Object.freeze({root,ready:readyPromise,show,reset,dispose(){if(disposed)return;disposed=true;alive=false;epoch++;abort?.abort();observer?.disconnect();cleanup();for(const remove of listeners)remove();showButton.disabled=resetButton.disabled=true;root.remove();}});
}
