// Copyright 2026 Kai Prince; SPDX-License-Identifier: Apache-2.0
// Developer draft: explicit finite English grammar, never ordinary-prose NLP.
import {validateAssertionRegistry,canonicalAssertion} from './assertions.js';

export const CONTROLLED_PROFILE='gw-controlled-english-v1';
export const CONTROLLED_LIMITS=Object.freeze({assertions:32,formulaCharacters:12000,totalCharacters:65536,tokens:4096,depth:32,nodes:16384});
export const CONTROLLED_QUALIFICATION='Compiled only the explicit finite controlled grammar into declared typed IR. Type checking and identical IR do not establish truth, proof, source fidelity or ordinary-language translation equivalence.';
export const controlledFail=code=>{const error=Error(code);error.code=code;throw error;};
export const controlledFreeze=value=>{if(value&&typeof value==='object'){for(const item of Object.values(value))controlledFreeze(item);Object.freeze(value);}return value;};
export const controlledCanonical=value=>Array.isArray(value)?'['+value.map(controlledCanonical).join(',')+']':value!==null&&typeof value==='object'?'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+controlledCanonical(value[key])).join(',')+'}':JSON.stringify(value);
export async function controlledDigest(text,cryptoObject=globalThis.crypto){if(!cryptoObject?.subtle||typeof cryptoObject.subtle.digest!=='function')controlledFail('controlled-crypto-unavailable');return [...new Uint8Array(await cryptoObject.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
/** Bounded data capture before awaits. No getter, prototype or JSON code path. */
export function controlledData(input){
 let nodes=0,characters=0;const ancestors=new Set();
 function read(value,depth){
  if(depth>40||++nodes>CONTROLLED_LIMITS.nodes)controlledFail('controlled-data-budget');
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='number'){if(!Number.isFinite(value))controlledFail('controlled-data');return value;}
  if(typeof value==='string'){if((characters+=value.length)>262144||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)||/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/u.test(value))controlledFail('controlled-data');return value;}
  if(!value||typeof value!=='object'||ancestors.has(value))controlledFail('controlled-data');ancestors.add(value);let out;
  const ds=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(ds);
  if(Array.isArray(value)){if(value.length>4096||keys.length!==value.length+1)controlledFail('controlled-data');out=[];for(let i=0;i<value.length;i++){if(!Object.hasOwn(ds[i]??{},'value'))controlledFail('controlled-data');out.push(read(ds[i].value,depth+1));}}
  else{if(![Object.prototype,null].includes(Object.getPrototypeOf(value)))controlledFail('controlled-data');out={};for(const key of keys){if(typeof key!=='string'||['__proto__','constructor','prototype'].includes(key)||!Object.hasOwn(ds[key],'value'))controlledFail('controlled-data');out[key]=read(ds[key].value,depth+1);}}
  ancestors.delete(value);return out;
 }return read(input,0);
}
export function controlledFields(value,required,optional=[]){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>![...required,...optional].includes(key))||required.some(key=>!Object.hasOwn(value,key)))controlledFail('controlled-fields');return value;}
const word=/^[A-Za-z][A-Za-z0-9_-]{0,63}$/u;
const reserved=new Set(['for','every','of','there','exists','if','then','and','or','not','possible','necessary','equal','it','its','they','them','their','this','that','these','those','he','she','his','her']);
const identifier=value=>{if(typeof value!=='string'||!word.test(value)||reserved.has(value.toLowerCase()))controlledFail('controlled-symbol');return value;};
function vocabulary(registry,raw){
 const categories=['sorts','constants','functions','predicates'];controlledFields(raw,[],categories);const maps={};
 for(const category of categories){
  const ids=new Set(category==='sorts'?registry.sorts:registry[category].map(entry=>entry.id)),entries=new Map();
  for(const id of ids)if(word.test(id)&&!reserved.has(id.toLowerCase()))entries.set(id,id);
  const aliases=raw[category]??[];if(!Array.isArray(aliases)||aliases.length>128)controlledFail('controlled-alias');const labels=new Set();
  for(const entry of aliases){controlledFields(entry,['label','id']);const label=identifier(entry.label);if(labels.has(label)||!ids.has(entry.id)||entries.has(label)&&entries.get(label)!==entry.id)controlledFail('controlled-alias');labels.add(label);entries.set(label,entry.id);}
  maps[category]=entries;
 }
 for(const label of maps.constants.keys())if(maps.functions.has(label))controlledFail('controlled-ambiguous-symbol');return maps;
}
function parseFormula(raw,maps){
 if(typeof raw!=='string'||!raw.trim()||raw.length>CONTROLLED_LIMITS.formulaCharacters)controlledFail('controlled-formula-budget');
 const syntax=raw.trimEnd().endsWith('.')?raw.trimEnd().slice(0,-1):raw,tokens=[];let at=0;
 while(at<syntax.length){if(/[ \t\r\n]/u.test(syntax[at])){at++;continue;}const token=/^[A-Za-z][A-Za-z0-9_-]{0,63}/u.exec(syntax.slice(at));if(token){tokens.push(token[0]);at+=token[0].length;}else if('(),:'.includes(syntax[at]))tokens.push(syntax[at++]);else controlledFail('controlled-unsupported-syntax');if(tokens.length>CONTROLLED_LIMITS.tokens)controlledFail('controlled-formula-budget');}
 let cursor=0,depth=0;const peek=()=>tokens[cursor],take=expected=>{const actual=tokens[cursor++];if(actual!==expected)controlledFail('controlled-unsupported-syntax');return actual;};
 const scoped=fn=>{if(++depth>CONTROLLED_LIMITS.depth)controlledFail('controlled-formula-budget');try{return fn();}finally{depth--;}};
 const resolve=(category,label)=>{const id=maps[category].get(label);if(id===undefined)controlledFail('controlled-undeclared-sense');return id;};
 function args(parse){take('(');const items=[];if(peek()!==')'){for(;;){items.push(parse());if(peek()!==',')break;take(',');}}take(')');return items;}
 const variables=new Set();
 function term(){return scoped(()=>{const label=identifier(tokens[cursor++]);if(peek()==='(')return {apply:resolve('functions',label),args:args(term)};if(variables.has(label)){if(maps.constants.has(label))controlledFail('controlled-ambiguous-symbol');return {var:label};}if(maps.constants.has(label))return {constant:resolve('constants',label)};return {var:label};});}
 function unary(){return scoped(()=>{
  const token=peek();
  if(token==='not'||token==='possible'||token==='necessary'){cursor++;take('(');const body=formula();take(')');return token==='not'?{op:'not',body}:{op:'modal',mode:token,body};}
  if(token==='('){take('(');const value=formula();take(')');return value;}
  if(token==='equal'){cursor++;const values=args(term);if(values.length!==2)controlledFail('controlled-unsupported-syntax');return {op:'eq',left:values[0],right:values[1]};}
  const name=identifier(tokens[cursor++]);return {op:'predicate',id:resolve('predicates',name),args:args(term)};
 });}
 function conjunction(){const items=[unary()];while(peek()==='and'){cursor++;items.push(unary());}return items.length===1?items[0]:{op:'and',items};}
 function disjunction(){const items=[conjunction()];while(peek()==='or'){cursor++;items.push(conjunction());}return items.length===1?items[0]:{op:'or',items};}
 function formula(){return scoped(()=>{
  if(peek()==='for'||peek()==='there'){
   const op=peek()==='for'?'forall':'exists';take(op==='forall'?'for':'there');take(op==='forall'?'every':'exists');const variable=identifier(tokens[cursor++]);if(variables.has(variable)||maps.constants.has(variable))controlledFail('controlled-ambiguous-symbol');take('of');const sort=resolve('sorts',identifier(tokens[cursor++]));take(':');variables.add(variable);let body;try{body=formula();}finally{variables.delete(variable);}return {op,variable,sort,body};
  }
  if(peek()==='if'){take('if');take('(');const antecedent=formula();take(')');take('then');take('(');const consequent=formula();take(')');return {op:'implies',antecedent,consequent};}
  return disjunction();
 });}
 const result=formula();if(cursor!==tokens.length)controlledFail('controlled-unsupported-syntax');return result;
}

/** Reuses the existing registry validator for signatures, sorts, free variables,
 * arity, binder capture, domain/status and all finite IR bounds. */
export async function compileControlledAssertions(input,{cryptoObject=globalThis.crypto}={}){
 const source=controlledData(input);controlledFields(source,['version','language','registry','assertions'],['aliases']);if(source.version!==1||source.language!=='en'||!Array.isArray(source.assertions)||source.assertions.length<1||source.assertions.length>CONTROLLED_LIMITS.assertions)controlledFail('controlled-profile');
 controlledFields(source.registry,['version','sorts','constants','functions','predicates','assertions','bindings']);
 const declarations=validateAssertionRegistry({...source.registry,assertions:[],bindings:[]}),maps=vocabulary(declarations,source.aliases??{});let characters=0;
 const records=source.assertions.map(value=>{
  controlledFields(value,['id','revision','context','domain','modality','status','assumptions','claim']);if(!Array.isArray(value.assumptions)||value.assumptions.length>32)controlledFail('controlled-formula-budget');
  for(const raw of [...value.assumptions,value.claim]){if(typeof raw!=='string'||(characters+=raw.length)>CONTROLLED_LIMITS.totalCharacters)controlledFail('controlled-formula-budget');}
  return {...value,assumptions:value.assumptions.map(raw=>parseFormula(raw,maps)),claim:parseFormula(value.claim,maps)};
 });
 const registry=validateAssertionRegistry({...source.registry,assertions:[...source.registry.assertions,...records]}),sources=[];
 for(const original of source.assertions){const assertion=registry.assertions.find(value=>value.id===original.id);sources.push({assertionId:assertion.id,assertionRevision:assertion.revision,sourceSha256:await controlledDigest(controlledCanonical(original),cryptoObject),irSha256:await controlledDigest(canonicalAssertion(assertion),cryptoObject)});}
 return controlledFreeze({version:1,kind:'controlled-assertion-compilation',profile:CONTROLLED_PROFILE,language:'en',registry,sources,inputSha256:await controlledDigest(controlledCanonical(source),cryptoObject),qualification:CONTROLLED_QUALIFICATION});
}
