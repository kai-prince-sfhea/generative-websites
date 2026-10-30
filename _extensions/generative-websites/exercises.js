// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Original finite practice generators. No authored executable expressions.
export const EXERCISE_VERSION='gw-finite-exercises-v1';
export const EXERCISE_SOURCE_QUALIFICATION='Caller-supplied public native-content SHA-256; no original QMD offsets, review authentication or mathematical proof is established.';
export const EXERCISE_LIMITS=Object.freeze({minimum:-20,maximum:20,denominator:12,setSize:8,answerBytes:256});
const exEncoder=new TextEncoder(),exKinds=new Set(['rational-add','rational-subtract','rational-multiply','finite-union','finite-intersection']);
function exFail(){const error=new TypeError('generative-websites: invalid, changed or unsupported finite exercise data');error.code='invalid-exercise';throw error;}
function exFields(value,allowed,required=allowed){
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))exFail();
  for(const key of Reflect.ownKeys(value)){const prop=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!allowed.includes(key)||!prop.enumerable||!Object.hasOwn(prop,'value'))exFail();}
  if(required.some(key=>!Object.hasOwn(value,key)))exFail();
}
function exArray(value,max){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>max)exFail();
  const keys=Reflect.ownKeys(value).filter(key=>key!=='length');if(keys.length!==value.length)exFail();
  keys.forEach((key,index)=>{const prop=Object.getOwnPropertyDescriptor(value,key);if(key!==String(index)||!prop.enumerable||!Object.hasOwn(prop,'value'))exFail();});
}
function exText(value,max){if(typeof value!=='string'||!value||value!==value.trim()||exEncoder.encode(value).length>max||/[\u0000-\u001f\u007f\ud800-\udfff]/u.test(value))exFail();return value;}
function exId(value){exText(value,128);if(!/^[A-Za-z][A-Za-z0-9._:-]*$/.test(value)||['constructor','prototype','__proto__'].includes(value))exFail();return value;}
function exHash(value){if(typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value))exFail();return value;}
function exURL(value){
  exText(value,2048);if(/[\\%?#\s<>"']/.test(value)||value.startsWith('//'))exFail();
  let path=value;
  if(/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)){
    let url;try{url=new URL(value);}catch{exFail();}
    if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.href!==value)exFail();path=url.pathname;
  }else if(value.includes(':'))exFail();
  if(!path.endsWith('.html')||path.split('/').some((part,index)=>part==='.'||part==='..'||part.startsWith('.')||!part&&index!==0))exFail();
  return value;
}
function exSource(value){exFields(value,['path','anchor','sha256']);return {path:exURL(value.path),anchor:exId(value.anchor),sha256:exHash(value.sha256)};}
function exContext(value){
  exFields(value,['source','catalogSnapshot'],['source']);const result={source:exSource(value.source)};
  if(value.catalogSnapshot!==undefined){if(typeof value.catalogSnapshot!=='string'||!/^[a-f0-9]{40}$/.test(value.catalogSnapshot))exFail();result.catalogSnapshot=value.catalogSnapshot;}
  return result;
}
function exInteger(value,min,max){if(!Number.isSafeInteger(value)||value<min||value>max)exFail();return value;}
function exSpec(value){
  exFields(value,['id','revision','kind','label','public','review','min','max','maxDenominator','setSize'],['id','revision','kind','public','review']);
  if(value.public!==true||value.review!=='author-reviewed'||!exKinds.has(value.kind))exFail();
  const result={id:exId(value.id),revision:exText(value.revision,128),kind:value.kind,
    ...(value.label===undefined?{}:{label:exText(value.label,160)}),public:true,review:'author-reviewed',
    min:exInteger(value.min??-20,-20,20),max:exInteger(value.max??20,-20,20)};
  if(result.min>result.max)exFail();
  if(value.kind.startsWith('rational-')){if(value.setSize!==undefined)exFail();result.maxDenominator=exInteger(value.maxDenominator??12,1,12);}
  else{if(value.maxDenominator!==undefined)exFail();result.setSize=exInteger(value.setSize??Math.min(5,result.max-result.min+1),0,8);if(result.setSize>result.max-result.min+1)exFail();}
  return result;
}
function exCanonical(value,depth=0,budget={nodes:0}){
  if(depth>20||++budget.nodes>4096)exFail();
  if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'&&Number.isSafeInteger(value))return JSON.stringify(value);
  if(Array.isArray(value)){exArray(value,128);return '['+value.map(item=>exCanonical(item,depth+1,budget)).join(',')+']';}
  exFields(value,Object.keys(value));return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+exCanonical(value[key],depth+1,budget)).join(',')+'}';
}
async function exDigest(value){if(!globalThis.crypto?.subtle)exFail();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',exEncoder.encode(exCanonical(value))))].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
function exFreeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(exFreeze);Object.freeze(value);}return value;}
function exGCD(left,right){left=left<0n?-left:left;right=right<0n?-right:right;while(right){const next=left%right;left=right;right=next;}return left;}
function exRational(numerator,denominator){
  let n=BigInt(numerator),d=BigInt(denominator);if(d===0n)exFail();if(d<0n){n=-n;d=-d;}const divisor=exGCD(n,d);n/=divisor;d/=divisor;
  return {numerator:Number(n),denominator:Number(d)};
}
const exFraction=value=>value.denominator===1?String(value.numerator):value.numerator+'/'+value.denominator;
function exProblem(spec,seed){
  // A specified 32-bit LCG is for deterministic variation, not cryptography or
  // a statistical/educational quality claim. Integer draws have bounded modulo bias.
  let state=seed;const draw=(min,max)=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return min+state%(max-min+1);};
  if(spec.kind.startsWith('rational-')){
    const left=exRational(draw(spec.min,spec.max),draw(1,spec.maxDenominator)),right=exRational(draw(spec.min,spec.max),draw(1,spec.maxDenominator));
    const operation={ 'rational-add':'+','rational-subtract':'−','rational-multiply':'×'}[spec.kind];
    return {left,right,operation,prompt:`Calculate ${exFraction(left)} ${operation} ${exFraction(right)}. Enter an integer or a fraction such as -3/4.`};
  }
  function set(){const values=Array.from({length:spec.max-spec.min+1},(_,index)=>spec.min+index);for(let index=values.length-1;index>0;index--){const chosen=draw(0,index);[values[index],values[chosen]]=[values[chosen],values[index]];}return values.slice(0,draw(0,spec.setSize)).sort((a,b)=>a-b);}
  const left=set(),right=set(),operation=spec.kind==='finite-union'?'union':'intersection',display=value=>'{'+value.join(', ')+'}';
  return {left,right,operation,prompt:`Find the ${operation} of ${display(left)} and ${display(right)}. Enter distinct integers separated by commas; use {} for the empty set.`};
}

/** Generate a finite, inspectable practice problem from reviewed public metadata. */
export async function createExercise(spec,options={}){
  exFields(options,['seed','context']);const {seed,context}=options;
  const normalized=exSpec(spec),chosen=exInteger(seed,0,0xffffffff),bound=exContext(context),problem=exProblem(normalized,chosen);
  const core={version:1,kind:'gw-finite-exercise',generatorVersion:EXERCISE_VERSION,spec:normalized,seed:chosen,problem,context:bound,
    sourceQualification:EXERCISE_SOURCE_QUALIFICATION,reviewStatus:'declared-author-reviewed',checkingScope:'finite-generated-practice-only'};
  const hashes={specSha256:await exDigest(normalized),contextSha256:await exDigest(bound),problemSha256:await exDigest(problem),instanceSha256:await exDigest(core)};
  return exFreeze({...core,hashes});
}
function exAnswer(instance,answer){
  if(instance.spec.kind.startsWith('rational-')){
    if(typeof answer!=='string'||exEncoder.encode(answer).length>256)return null;
    const match=/^\s*([+-]?\d{1,12})(?:\s*\/\s*([+-]?\d{1,12}))?\s*$/.exec(answer);if(!match)return null;
    const n=BigInt(match[1]),d=BigInt(match[2]??'1');if(d===0n)return null;return {n,d};
  }
  let values=answer;
  if(typeof answer==='string'){
    if(exEncoder.encode(answer).length>256)return null;const text=answer.trim();
    if(text==='{}'||text==='')values=[];
    else if(/^[+-]?\d{1,3}(?:\s*,\s*[+-]?\d{1,3})*$/.test(text))values=text.split(',').map(value=>Number(value.trim()));else return null;
  }
  try{exArray(values,41);}catch{return null;}
  if(values.some(value=>!Number.isSafeInteger(value)||value<-20||value>20)||new Set(values).size!==values.length)return null;
  return [...values].sort((a,b)=>a-b);
}

/** Recompute all generated data and identities before checking one typed answer.
 * A supplied current context additionally prevents reuse after a known source edit.
 * Source hashes are caller observations, not authentication or proof authority. */
export async function checkAnswer(instance,answer,options={}){
  exFields(options,['context'],[]);exFields(instance,['version','kind','generatorVersion','spec','seed','problem','context','sourceQualification','reviewStatus','checkingScope','hashes']);
  const expectedContext=options.context===undefined?null:exContext(options.context);
  exCanonical(instance);const regenerated=await createExercise(instance.spec,{seed:instance.seed,context:instance.context});
  if(exCanonical(instance)!==exCanonical(regenerated)||expectedContext&&exCanonical(expectedContext)!==exCanonical(regenerated.context))exFail();
  const parsed=exAnswer(regenerated,answer);let correct=false;
  if(parsed!==null){
    const {left,right}=regenerated.problem;
    if(regenerated.spec.kind.startsWith('rational-')){
      const ln=BigInt(left.numerator),ld=BigInt(left.denominator),rn=BigInt(right.numerator),rd=BigInt(right.denominator);
      const n=regenerated.spec.kind==='rational-multiply'?ln*rn:ln*rd+(regenerated.spec.kind==='rational-subtract'?-1n:1n)*rn*ld;
      const d=ld*rd;correct=parsed.n*d===n*parsed.d;
    }else{const expected=regenerated.spec.kind==='finite-union'?[...new Set([...left,...right])].sort((a,b)=>a-b):left.filter(value=>right.includes(value));correct=exCanonical(parsed)===exCanonical(expected);}
  }
  return exFreeze({version:1,status:parsed===null?'invalid':correct?'correct':'incorrect',instanceSha256:regenerated.hashes.instanceSha256,
    checkerVersion:EXERCISE_VERSION,checkingScope:'finite-generated-practice-only',reviewStatus:'not-a-human-or-proof-review',
    feedback:parsed===null?'Use the stated integer, fraction or finite-set answer format.':correct?'The response matches this finite generated task.':'The response does not match this finite generated task. No theorem or learning outcome is being assessed.'});
}
