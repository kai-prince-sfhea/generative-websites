// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Original problem-only export to the Sandbox's finite Boolean/Horn THY subset.
// No Sandbox implementation or runtime assets are copied into this package.
export const SANDBOX_EXPORT_VERSION='gw-problem-only-thy-v1';
export const SANDBOX_EXPORT_LIMITS=Object.freeze({atoms:40,rules:80,premises:40,bytes:99999});
export const SANDBOX_SOURCE_QUALIFICATION='Caller-supplied public native-content SHA-256; no original QMD offsets, authenticated review, Sandbox import or proof acceptance is established.';
const sbEncoder=new TextEncoder();
function sbFail(){const error=new TypeError('generative-websites: invalid, changed or unsupported public Sandbox problem');error.code='invalid-sandbox-problem';throw error;}
function sbFields(value,allowed,required=allowed){
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))sbFail();
  for(const key of Reflect.ownKeys(value)){const prop=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!allowed.includes(key)||!prop.enumerable||!Object.hasOwn(prop,'value'))sbFail();}
  if(required.some(key=>!Object.hasOwn(value,key)))sbFail();
}
function sbArray(value,min,max){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<min||value.length>max)sbFail();
  const keys=Reflect.ownKeys(value).filter(key=>key!=='length');if(keys.length!==value.length)sbFail();
  keys.forEach((key,index)=>{const prop=Object.getOwnPropertyDescriptor(value,key);if(key!==String(index)||!prop.enumerable||!Object.hasOwn(prop,'value'))sbFail();});
}
function sbText(value,max){if(typeof value!=='string'||!value||value!==value.trim()||sbEncoder.encode(value).length>max||/[\u0000-\u001f\u007f\ud800-\udfff]/u.test(value))sbFail();return value;}
function sbID(value){sbText(value,128);if(!/^[A-Za-z][A-Za-z0-9._:-]*$/.test(value)||['constructor','prototype','__proto__'].includes(value))sbFail();return value;}
function sbComment(value,max){sbText(value,max);if(value.includes('*'))sbFail();return value;}
function sbHash(value,length=64){if(typeof value!=='string'||!(length===40?/^[a-f0-9]{40}$/:/^[a-f0-9]{64}$/).test(value))sbFail();return value;}
function sbURL(value){
  sbText(value,2048);if(/[\\%?#\s<>"']/.test(value)||value.startsWith('//'))sbFail();let path=value;
  if(/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)){let url;try{url=new URL(value);}catch{sbFail();}if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.href!==value)sbFail();path=url.pathname;}
  else if(value.includes(':'))sbFail();
  if(!path.endsWith('.html')||path.split('/').some((part,index)=>part==='.'||part==='..'||part.startsWith('.')||!part&&index!==0))sbFail();return value;
}
function sbContext(value){
  sbFields(value,['source','route'],['source']);sbFields(value.source,['path','anchor','sha256']);
  const context={source:{path:sbURL(value.source.path),anchor:sbID(value.source.anchor),sha256:sbHash(value.source.sha256)}};
  if(value.route!==undefined){sbFields(value.route,['snapshot','goal','current'],['snapshot','goal']);context.route={snapshot:sbHash(value.route.snapshot,40),goal:sbID(value.route.goal),
    ...(value.route.current===undefined?{}:{current:sbID(value.route.current)})};}
  return context;
}
function sbCanonical(value,depth=0,budget={nodes:0}){
  if(depth>20||++budget.nodes>16384)sbFail();if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'&&Number.isSafeInteger(value))return JSON.stringify(value);
  if(Array.isArray(value)){sbArray(value,0,256);return '['+value.map(item=>sbCanonical(item,depth+1,budget)).join(',')+']';}
  sbFields(value,Object.keys(value));return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+sbCanonical(value[key],depth+1,budget)).join(',')+'}';
}
async function sbHashText(value){if(!globalThis.crypto?.subtle)sbFail();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',sbEncoder.encode(value)))].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
const sbDigest=value=>sbHashText(sbCanonical(value));
function sbFreeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(sbFreeze);Object.freeze(value);}return value;}
function sbSpec(value){
  sbFields(value,['version','id','revision','label','description','public','review','atoms','givens','rules','goals']);
  if(value.version!==1||value.public!==true||value.review!=='author-reviewed')sbFail();
  const spec={version:1,id:sbID(value.id),revision:sbText(value.revision,128),label:sbComment(value.label,100),description:sbComment(value.description,1800),public:true,review:'author-reviewed'};
  sbArray(value.atoms,1,40);const names=new Set();spec.atoms=value.atoms.map(atom=>{sbFields(atom,['id','label']);const id=sbID(atom.id);if(names.has(id))sbFail();names.add(id);return {id,label:sbComment(atom.label,256)};});
  const refs=(values,min,max)=>{sbArray(values,min,max);const seen=new Set();return values.map(value=>{const id=sbID(value);if(!names.has(id)||seen.has(id))sbFail();seen.add(id);return id;});};
  spec.givens=refs(value.givens,0,40);spec.goals=refs(value.goals,1,40);if(spec.goals.some(goal=>spec.givens.includes(goal)))sbFail();
  sbArray(value.rules,0,80);const ruleNames=new Set();spec.rules=value.rules.map(rule=>{
    sbFields(rule,['id','premises','conclusion']);const id=sbID(rule.id);if(ruleNames.has(id)||names.has(id))sbFail();ruleNames.add(id);
    return {id,premises:refs(rule.premises,1,40),conclusion:refs([rule.conclusion],1,1)[0]};
  });if(!spec.givens.length&&!spec.rules.length)sbFail();return spec;
}

/** Generate an inspectable file for the existing Sandbox's manual Import action.
 * Goals are never givens. Positive Horn rules describe the authored problem;
 * no attempt, worked solution, tactical code or completion claim is accepted. */
export async function exportProblem(spec,context){
  const normalized=sbSpec(spec),bound=sbContext(context),problemSha256=await sbDigest(normalized),contextSha256=await sbDigest(bound);
  const theory='GW_Problem_'+problemSha256.slice(0,16),mapping=new Map(normalized.atoms.map((atom,index)=>[atom.id,'p'+index]));
  const bindings={atoms:normalized.atoms.map(atom=>({source:atom.id,generated:mapping.get(atom.id)})),
    givens:normalized.givens.map((id,index)=>({source:id,generated:'f'+index})),rules:normalized.rules.map((rule,index)=>({source:rule.id,generated:'r'+index}))};
  const declaration={version:1,exporter:SANDBOX_EXPORT_VERSION,problemSha256,contextSha256,source:bound.source,
    review:'author-reviewed declaration only',proofStatus:'not-checked',...(bound.route?{route:bound.route}:{})};
  // Escape every asterisk in the JSON comment so even a legal public URL cannot
  // close an Isabelle comment. Readable labels separately reject that delimiter.
  const encoded=sbCanonical(declaration).replace(/\*/g,'\\u002a');
  const lines=[`theory ${theory} imports Main begin`,`(* generative-websites:provenance ${encoded} *)`,
    `(* thread:title ${normalized.label} *)`,`(* thread:description ${normalized.description} *)`,
    `(* thread:goal ${normalized.goals.map(id=>mapping.get(id)).join(',')} *)`,
    ...normalized.atoms.map(atom=>`(* thread:label ${mapping.get(atom.id)} = ${atom.label} *)`),
    'locale GW_Case =',`  fixes ${normalized.atoms.map(atom=>mapping.get(atom.id)).join(' ')} :: "bool"`];
  const clauses=[...normalized.givens.map((id,index)=>`f${index}: "${mapping.get(id)}"`),
    ...normalized.rules.map((rule,index)=>`r${index}: "${rule.premises.map(id=>mapping.get(id)).join(' & ')} ==> ${mapping.get(rule.conclusion)}"`)];
  lines.push('  assumes '+clauses.join('\n      and '),'begin','end','end');
  const text=lines.join('\n')+'\n';if(sbEncoder.encode(text).length>99999)sbFail();
  const receipt={version:1,kind:'gw-sandbox-problem-export',exporter:SANDBOX_EXPORT_VERSION,problemSha256,contextSha256,
    exportSha256:await sbHashText(text),source:bound.source,...(bound.route?{route:bound.route}:{}),bindings,
    reviewStatus:'declared-author-reviewed',importStatus:'manual-import-not-performed',proofStatus:'not-checked',
    sourceQualification:SANDBOX_SOURCE_QUALIFICATION,
    interchangeScope:'Positive Boolean/Horn problem only; no reader attempt, solution, evidence-status restoration or proof-session round trip.'};
  return sbFreeze({version:1,filename:theory+'.thy',mediaType:'text/plain;charset=utf-8',text,receipt,spec:normalized,context:bound});
}

/** Detect an edited download/receipt and, optionally, a known changed context.
 * This does not execute or import anything and cannot assert kernel acceptance. */
export async function verifyProblemExport(value,options={}){
  sbFields(options,['context'],[]);sbFields(value,['version','filename','mediaType','text','receipt','spec','context']);sbCanonical(value);
  const current=options.context===undefined?null:sbContext(options.context),rebuilt=await exportProblem(value.spec,value.context);
  if(sbCanonical(value)!==sbCanonical(rebuilt)||current&&sbCanonical(current)!==sbCanonical(rebuilt.context))sbFail();return rebuilt;
}
