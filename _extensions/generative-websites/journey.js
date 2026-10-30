// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Portable route position and nested return frames. A visit is not knowledge.
import {selectClosure,validatePublication,validatePublicPage} from './delivery.js';
export const JOURNEY_LIMITS=Object.freeze({bytes:65536,steps:500,choices:500,detours:32,scroll:10000000});
const jEncoder=new TextEncoder(),jNative=/^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
function jFail(){const error=new TypeError('generative-websites: saved journey is invalid, unavailable or stale; build a current route');error.code='invalid-journey';throw error;}
function jFields(value,allowed,required=allowed){
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))jFail();
  for(const key of Reflect.ownKeys(value)){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!allowed.includes(key)||!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))jFail();}
  if(required.some(key=>!Object.hasOwn(value,key)))jFail();
}
function jArray(value,max,min=0){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<min||value.length>max)jFail();
  const keys=Reflect.ownKeys(value).filter(key=>key!=='length');if(keys.length!==value.length)jFail();
  keys.forEach((key,index)=>{const descriptor=Object.getOwnPropertyDescriptor(value,key);if(key!==String(index)||!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))jFail();});return value;
}
function jText(value,max=2048){if(typeof value!=='string'||!value||value!==value.trim()||jEncoder.encode(value).length>max||/[\u0000-\u001f\u007f\ud800-\udfff]/u.test(value))jFail();return value;}
function jID(value){jText(value,128);if(!jNative.test(value)||['constructor','prototype','__proto__'].includes(value))jFail();return value;}
function jHash(value){if(typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value))jFail();return value;}
function jNativeHash(value){if(typeof value!=='string'||!/^sha1:[a-f0-9]{40}$/.test(value))jFail();return value;}
function jBase(value){
  jText(value);let url;try{url=new URL(value);}catch{jFail();}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||!url.pathname.endsWith('/'))jFail();return url;
}
function jCanonical(value,depth=0,ancestors=new Set(),budget={nodes:0}){
  if(depth>24||++budget.nodes>20000)jFail();
  if(typeof value==='string'){if(value.length>65536||jEncoder.encode(value).length>65536)jFail();return JSON.stringify(value);}
  if(value===null||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
  if(!value||typeof value!=='object'||ancestors.has(value))jFail();ancestors.add(value);let result;
  if(Array.isArray(value)){jArray(value,500);result='['+value.map(item=>jCanonical(item,depth+1,ancestors,budget)).join(',')+']';}
  else{jFields(value,Object.keys(value));result='{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+jCanonical(value[key],depth+1,ancestors,budget)).join(',')+'}';}
  ancestors.delete(value);if(jEncoder.encode(result).length>65536)jFail();return result;
}
function jFreeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(jFreeze);Object.freeze(value);}return value;}
const jCopy=value=>JSON.parse(jCanonical(value));
const jGoal=value=>{jText(value,257);const parts=value.split('#');if(parts.length!==2)jFail();parts.forEach(jID);return parts;};
function jState(catalogue){
  if(catalogue?.version!==1||catalogue.kind!=='observed-publication')jFail();const root=jBase(catalogue.baseURL);
  let publication;try{publication=validatePublication(catalogue.publication,{baseURL:root.href});}catch{jFail();}
  jArray(catalogue.pages,32);const observations=new Map();
  for(const page of catalogue.pages){if(!page||typeof page!=='object'||typeof page.id!=='string'||observations.has(page.id))jFail();observations.set(page.id,page);}
  return {root,publication,observations};
}
function jPage(state,id){
  const declared=state.publication.pages.find(page=>page.id===id),observed=state.observations.get(id);
  if(!declared||!observed||observed.status!=='complete')jFail();let data;
  try{data=validatePublicPage(observed.data,{baseURL:state.root.href});}catch{jFail();}
  const url=new URL(declared.url,state.root).href;
  if(observed.url!==url||data.page.id!==id||new URL(data.page.url,state.root).href!==url||data.page.revision!==declared.revision||
    data.project.id!==state.publication.id||data.project.revision!==state.publication.revision||declared.sourceDigest!==undefined&&declared.sourceDigest!==data.page.sourceDigest||
    declared.language!==undefined&&Intl.getCanonicalLocales(declared.language)[0]!==Intl.getCanonicalLocales(data.page.language)[0])jFail();
  return {id,url,sha256:jHash(observed.observedSha256),sourceDigest:jNativeHash(data.page.sourceDigest)};
}
function jRoute(catalogue,route,state){
  jFields(route,['version','status','project','goal','steps','choices','pageIds']);jCanonical(route);
  const [pageId,objectId]=jGoal(route.goal);let fresh;try{fresh=selectClosure(catalogue,{pageId,objectId});}catch{jFail();}
  if(fresh.status!=='complete'||jCanonical(fresh)!==jCanonical(route))jFail();
  jArray(fresh.steps,500,1);jArray(fresh.choices,500);jArray(fresh.pageIds,32,1);
  const pages=fresh.pageIds.map(id=>jPage(state,id));return {route:jCopy(fresh),pages};
}
function jPosition(value,count){if(!Number.isSafeInteger(value)||value<0||value>=count)jFail();return value;}
function jFrame(frame,state,count,{normalize=false}={}){
  jFields(frame,['url','sourceDigest','scrollX','scrollY','focus','current']);jText(frame.url);let url;
  try{url=new URL(frame.url,state.root);}catch{jFail();}
  if(!['https:','http:'].includes(url.protocol)||url.origin!==state.root.origin||!url.pathname.startsWith(state.root.pathname)||url.username||url.password||url.search||/[\\\s]/.test(frame.url))jFail();
  if(url.hash){let anchor;try{anchor=decodeURIComponent(url.hash.slice(1));}catch{jFail();}jID(anchor);}
  const pageURL=url.origin+url.pathname,declared=state.publication.pages.find(page=>new URL(page.url,state.root).href===pageURL);if(!declared)jFail();
  const page=jPage(state,declared.id);if(jNativeHash(frame.sourceDigest)!==page.sourceDigest)jFail();
  for(const coordinate of [frame.scrollX,frame.scrollY])if(typeof coordinate!=='number'||!Number.isFinite(coordinate)||coordinate<0||coordinate>10000000)jFail();
  const focus=normalize&&frame.focus===''?null:frame.focus;if(focus!==null)jID(focus);
  if(!normalize&&url.href!==frame.url)jFail();
  return {url:url.href,sourceDigest:page.sourceDigest,scrollX:frame.scrollX,scrollY:frame.scrollY,focus,current:jPosition(frame.current,count)};
}

/** Create a frozen bookmark from a fresh complete producer route. Only pages
 * used by that route bind its observed-byte identity; unrelated pages do not.
 * Detours bind their own native-content identity separately. Hashes supplied by
 * the observed-publication producer are not signatures or proof of learning. */
export function createJourney(catalogue,route,options={}){
  jFields(options,['current','detours'],[]);const state=jState(catalogue),fresh=jRoute(catalogue,route,state),detours=options.detours===undefined?[]:options.detours;
  jArray(detours,32);const record={version:1,kind:'gw-learning-journey',baseURL:state.root.href,
    project:jCopy(fresh.route.project),goal:fresh.route.goal,steps:fresh.route.steps,choices:fresh.route.choices,pageIds:fresh.route.pageIds,pages:fresh.pages,
    current:jPosition(options.current===undefined?0:options.current,fresh.route.steps.length),detours:detours.map(frame=>jFrame(frame,state,fresh.route.steps.length)),
    scope:'route-position-only',attestation:'producer-observed-hashes-not-authentication'};
  jCanonical(record);return jFreeze(record);
}

/** Validate portable/tab storage as untrusted data; never accept stored URLs,
 * reasons, OR choices or source hashes instead of the recomputed producer route. */
export function validateJourney(record,catalogue){
  jFields(record,['version','kind','baseURL','project','goal','steps','choices','pageIds','pages','current','detours','scope','attestation']);jCanonical(record);
  if(record.version!==1||record.kind!=='gw-learning-journey'||record.scope!=='route-position-only'||record.attestation!=='producer-observed-hashes-not-authentication')jFail();
  const state=jState(catalogue),[pageId,objectId]=jGoal(record.goal);let fresh;try{fresh=selectClosure(catalogue,{pageId,objectId});}catch{jFail();}
  if(fresh.status!=='complete'||record.baseURL!==state.root.href)jFail();
  const rebuilt=createJourney(catalogue,fresh,{current:record.current,detours:record.detours});if(jCanonical(record)!==jCanonical(rebuilt))jFail();return rebuilt;
}

/** Capture an actual page return position. The caller obtains its native digest
 * from the loaded producer catalogue, never from a guessed QMD filename. */
export function createReturnFrame(catalogue,options,route){
  jFields(options,['url','scrollX','scrollY','focus','current'],['url']);jText(options.url);const state=jState(catalogue),fresh=jRoute(catalogue,route,state);let url;
  try{url=new URL(options.url,state.root);}catch{jFail();}
  const declared=state.publication.pages.find(page=>new URL(page.url,state.root).href===url.origin+url.pathname);if(!declared)jFail();
  const page=jPage(state,declared.id),frame=jFrame({url:options.url,sourceDigest:page.sourceDigest,scrollX:options.scrollX===undefined?0:options.scrollX,scrollY:options.scrollY===undefined?0:options.scrollY,
    focus:options.focus===undefined?null:options.focus,current:options.current===undefined?0:options.current},state,fresh.route.steps.length,{normalize:true});jCanonical(frame);return jFreeze(frame);
}

/** Validate a one-shot pending return against the same current route and native
 * page identity. Consumption/storage/focus restoration remain the caller's job. */
export function validateReturnFrame(frame,catalogue,route){const state=jState(catalogue),fresh=jRoute(catalogue,route,state);jCanonical(frame);return jFreeze(jFrame(frame,state,fresh.route.steps.length));}
