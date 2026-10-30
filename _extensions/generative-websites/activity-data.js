// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// R5 DEVELOPER DRAFT. Closed, bounded data only; no storage or network effects.
export const LIMITS=Object.freeze({activities:32,hints:8,objectives:8,reflectionPrompts:4,checks:32,reflectionCharacters:4000,bytes:262144,nodes:20000,depth:20});
const encoder=new TextEncoder();
export function fail(code='invalid-activity-progress'){const error=Error(code);error.code=code;throw error;}
export function fields(value,required,optional=[]){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail();const ds=Object.getOwnPropertyDescriptors(value);if(Reflect.ownKeys(ds).some(key=>typeof key!=='string'||![...required,...optional].includes(key)||!ds[key].enumerable||!Object.hasOwn(ds[key],'value'))||required.some(key=>!Object.hasOwn(ds,key)))fail();return value;}
export function array(value,max,min=0){if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<min||value.length>max)fail();const ds=Object.getOwnPropertyDescriptors(value);if(Reflect.ownKeys(ds).length!==value.length+1)fail();for(let i=0;i<value.length;i++)if(!Object.hasOwn(ds[i]??{},'value')||!ds[i].enumerable)fail();return value;}
export function text(value,max=2048,{empty=false,multiline=false}={}){if(typeof value!=='string'||!empty&&!value.length||value.length>max||encoder.encode(value).length>max||/[\ud800-\udfff]/u.test(value)||(multiline?/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u:/[\u0000-\u001f\u007f]/u).test(value))fail();return value;}
export function id(value){text(value,128);if(!/^[A-Za-z][A-Za-z0-9._:-]*$/u.test(value)||['constructor','prototype','__proto__'].includes(value))fail();return value;}
export function hash(value){if(typeof value!=='string'||!/^[a-f0-9]{64}$/u.test(value))fail();return value;}
export function integer(value,min,max){if(!Number.isSafeInteger(value)||value<min||value>max)fail();return value;}
export function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export function canonical(value,depth=0,budget={nodes:0},ancestors=new Set()){
 if(depth>LIMITS.depth||++budget.nodes>LIMITS.nodes)fail('activity-progress-budget');let result;
 if(value===null||typeof value==='boolean'||typeof value==='number'&&Number.isSafeInteger(value))result=JSON.stringify(value);
 else if(typeof value==='string'){text(value,LIMITS.bytes,{empty:true,multiline:true});result=JSON.stringify(value);}
 else{if(!value||typeof value!=='object'||ancestors.has(value))fail();ancestors.add(value);if(Array.isArray(value)){array(value,4096);result='['+value.map(item=>canonical(item,depth+1,budget,ancestors)).join(',')+']';}else{fields(value,Reflect.ownKeys(value));result='{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key],depth+1,budget,ancestors)).join(',')+'}';}ancestors.delete(value);}
 if(encoder.encode(result).length>LIMITS.bytes)fail('activity-progress-budget');return result;
}
export const copy=value=>JSON.parse(canonical(value));
export async function digest(value,cryptoObject=globalThis.crypto){if(!cryptoObject?.subtle)fail('activity-progress-crypto-unavailable');return [...new Uint8Array(await cryptoObject.subtle.digest('SHA-256',encoder.encode(typeof value==='string'?value:canonical(value))))].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
export function current({signal,isCurrent}={}){if(signal?.aborted)fail('activity-progress-cancelled');if(isCurrent&&isCurrent()!==true)fail('activity-progress-stale');}
export function options(value,allowed=[]){fields(value,[],['signal','isCurrent','cryptoObject',...allowed]);if(value.isCurrent!==undefined&&typeof value.isCurrent!=='function')fail();return {...value};}
export function baseURL(value){text(value);let url;try{url=new URL(value);}catch{fail();}if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||!url.pathname.endsWith('/')||url.href!==value||/%(?:2e|2f|5c|25|00)/iu.test(url.pathname))fail();return url.href;}
export function pageURL(value,root){text(value);let url;try{url=new URL(value);}catch{fail();}let decoded;try{decoded=decodeURIComponent(url.pathname);}catch{fail();}const base=new URL(baseURL(root));if(!['http:','https:'].includes(url.protocol)||url.href!==value||url.origin!==base.origin||!url.pathname.startsWith(base.pathname)||url.username||url.password||url.search||url.hash||!url.pathname.endsWith('.html')||/%(?:2e|2f|5c|25|00)/iu.test(url.pathname)||/[\u0000-\u001f\u007f\\]/u.test(decoded)||decoded.split('/').some(part=>part.startsWith('.')||['_extensions','node_modules','site_libs','local-ai-assets'].includes(part.toLowerCase())))fail();return url.href;}
