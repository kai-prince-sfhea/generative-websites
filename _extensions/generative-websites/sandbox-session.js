// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Original, data-only interchange. No Sandbox implementation is embedded.
import {verifyProblemExport} from './sandbox-export.js';

export const SANDBOX_SESSION_LIMITS=Object.freeze({threadBytes:20000000,capsuleBytes:28000000,stages:3,claimsPerStage:128,dependencies:32});
export const SANDBOX_SESSION_QUALIFICATION='Imported completion, confirmed membership, epistemic and kernel statuses are reported only and have not been rechecked. Exact JSON preservation is not proof acceptance, authentication or learning assessment.';
const ssEncoder=new TextEncoder(),ssDecoder=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true});
const ssHex=/^[a-f0-9]{64}$/u,ssNative=/^[A-Za-z][A-Za-z0-9._:-]{0,127}$/u,ssClaim=/^[A-Za-z][A-Za-z0-9_-]{0,63}$/u;
function ssFail(code='invalid-session'){const error=new TypeError('generative-websites: invalid, unsupported, unrelated or changed Sandbox session');error.code=code;throw error;}
function ssCheck(signal){if(signal?.aborted)ssFail('cancelled');}
function ssObject(value){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))ssFail();return value;}
function ssFields(value,allowed,required=allowed){ssObject(value);for(const key of Reflect.ownKeys(value)){const prop=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!allowed.includes(key)||!prop.enumerable||!Object.hasOwn(prop,'value'))ssFail();}if(required.some(key=>!Object.hasOwn(value,key)))ssFail();}
function ssArray(value,max,min=0){if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<min||value.length>max)ssFail();const keys=Reflect.ownKeys(value).filter(key=>key!=='length');if(keys.length!==value.length)ssFail();keys.forEach((key,index)=>{const prop=Object.getOwnPropertyDescriptor(value,key);if(key!==String(index)||!prop.enumerable||!Object.hasOwn(prop,'value'))ssFail();});return value;}
function ssText(value,max=8000,{empty=false}={}){if(typeof value!=='string'||!empty&&!value||ssEncoder.encode(value).length>max||/[\ud800-\udfff]/u.test(value))ssFail();return value;}
function ssID(value){ssText(value,128);if(!ssNative.test(value)||['constructor','prototype','__proto__'].includes(value))ssFail();return value;}
function ssDigest(value){if(typeof value!=='string'||!ssHex.test(value))ssFail();return value;}
function ssBytes(value,max){if(!(value instanceof Uint8Array)||Object.getPrototypeOf(value)!==Uint8Array.prototype||value.length<1||value.length>max)ssFail();return value.slice();}
function ssFreeze(value){if(value&&typeof value==='object'&&!(value instanceof Uint8Array)){Object.values(value).forEach(ssFreeze);Object.freeze(value);}return value;}
function ssCanonical(value,depth=0,seen=new Set(),budget={nodes:0}){
  if(depth>40||++budget.nodes>250000)ssFail();if(value===null||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='string'){ssText(value,SANDBOX_SESSION_LIMITS.capsuleBytes,{empty:true});return JSON.stringify(value);}
  if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
  if(!value||typeof value!=='object'||seen.has(value))ssFail();seen.add(value);let result;
  if(Array.isArray(value)){ssArray(value,100000);result='['+value.map(item=>ssCanonical(item,depth+1,seen,budget)).join(',')+']';}
  else{ssObject(value);const keys=Reflect.ownKeys(value);for(const key of keys){const p=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!p.enumerable||!Object.hasOwn(p,'value'))ssFail();}result='{'+keys.sort().map(key=>JSON.stringify(key)+':'+ssCanonical(value[key],depth+1,seen,budget)).join(',')+'}';}
  seen.delete(value);return result;
}
const ssCopy=value=>JSON.parse(ssCanonical(value));
async function ssHash(bytes,{cryptoObject=globalThis.crypto,signal}={}){ssCheck(signal);if(!cryptoObject?.subtle?.digest)ssFail();const result=await cryptoObject.subtle.digest('SHA-256',bytes);ssCheck(signal);return [...new Uint8Array(result)].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
const ssHashJSON=(value,options)=>ssHash(ssEncoder.encode(ssCanonical(value)),options);

// Duplicate keys, escaped duplicate names, trailing data and nonfinite numbers
// are rejected before any derived view. Original bytes are retained separately.
function ssParse(bytes,max){const original=ssBytes(bytes,max);let text;try{text=ssDecoder.decode(original);}catch{ssFail();}if(text.startsWith('\uFEFF'))text=text.slice(1);let at=0,nodes=0;
  const space=()=>{while(/[\x20\t\r\n]/u.test(text[at]??'!'))at++;};
  const string=()=>{const start=at++;while(at<text.length){const ch=text[at++];if(ch==='"'){let value;try{value=JSON.parse(text.slice(start,at));}catch{ssFail();}ssText(value,max,{empty:true});return value;}if(ch==='\\')at++;else if(ch<' ')ssFail();}ssFail();};
  const read=depth=>{space();if(depth>40||++nodes>250000)ssFail();const ch=text[at];if(ch==='"')return string();if(ch==='{'||ch==='['){at++;const value=ch==='{'?Object.create(null):[],keys=new Set();space();if(text[at]===(ch==='{'?'}':']')){at++;return value;}while(true){space();let key;if(ch==='{'){if(text[at]!=='"')ssFail();key=string();if(keys.has(key))ssFail('duplicate-key');keys.add(key);space();if(text[at++]!==':')ssFail();}const item=read(depth+1);if(ch==='{')value[key]=item;else{if(value.length>=100000)ssFail();value.push(item);}space();const end=text[at++];if(end===(ch==='{'?'}':']'))return value;if(end!==',')ssFail();}}
    const token=/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/u.exec(text.slice(at));if(!token)ssFail();at+=token[0].length;const value=JSON.parse(token[0]);if(typeof value==='number'&&!Number.isFinite(value))ssFail();return value;};
  const value=read(0);space();if(at!==text.length)ssFail();return {original,value};
}
export function parseSessionCapsule(bytes){const parsed=ssParse(bytes,SANDBOX_SESSION_LIMITS.capsuleBytes);ssObject(parsed.value);if(parsed.value.kind!=='gw-sandbox-session-capsule'||parsed.value.version!==1)ssFail();return ssFreeze(parsed.value);}

function ssClaimList(values,{strict=true}={}){ssArray(values,128);const seen=new Set();return values.map(value=>{ssObject(value);const claim=value.graph===undefined?value:ssObject(value.graph),id=claim.id??value.id;
  if(typeof id!=='string'||!ssClaim.test(id)||seen.has(id))ssFail();ssText(claim.text??value.text??'',8000,{empty:true});
  const dependencies=claim.depends_on===undefined&&!strict?[]:claim.depends_on;ssArray(dependencies,32);if(new Set(dependencies).size!==dependencies.length||dependencies.some(dep=>!seen.has(dep)))ssFail();seen.add(id);return {id,claim,view:value};});}
function ssPrepare(bytes){const parsed=ssParse(bytes,SANDBOX_SESSION_LIMITS.threadBytes),raw=ssObject(parsed.value);
  if(raw.format!=='thread-reasoning-session'||raw.version!==1)ssFail('unsupported-thread-format');if(raw.completed!==undefined&&typeof raw.completed!=='boolean')ssFail();
  if(raw.claims!==undefined)ssClaimList(raw.claims,{strict:false});
  const reasons=[],server=raw.server_session===undefined?null:ssObject(raw.server_session),current=server??raw;
  let records;if(raw.stage_history!==undefined){ssArray(raw.stage_history,3);records=raw.stage_history.length?raw.stage_history:null;}
  records??=[{session:current}];const ids=new Set();
  const stages=records.map((record,index)=>{ssObject(record);const saved=ssObject(record.session),scenario=ssObject(saved.scenario);
    const sessionId=saved.session_id===undefined&&!server?'archive-current':ssText(saved.session_id,128);
    if(ids.has(sessionId))ssFail();ids.add(sessionId);const graph=saved.graph??(!server&&records.length===1?raw.claims??[]:undefined),claims=ssClaimList(graph,{strict:Boolean(server)});
    if(scenario.source_hash!==undefined)ssDigest(scenario.source_hash);if(scenario.source_text!==undefined)ssText(scenario.source_text,100000);
    if(scenario.revision!=='problem-only-v1')reasons.push('scenario-revision-not-supported');if(typeof scenario.source_text!=='string')reasons.push('scenario-source-unavailable');
    if(saved.pending!==undefined&&saved.pending!==null)ssObject(saved.pending);
    const statuses=claims.map(item=>({claimId:item.id,status:ssText(item.claim.epistemic?.state??item.view.epistemic?.state??item.claim.status??'reported-confirmed-member',256)}));
    if(saved.pending){const pending=saved.pending,interpretation=pending.interpretation&&ssObject(pending.interpretation);statuses.push({claimId:ssText(interpretation?.id??pending.candidate_id??'pending-interpretation',128),status:ssText(interpretation?.epistemic?.state??pending.status??'reported-pending-interpretation',256)});}
    return {index,saved,scenario,claims,summary:{sessionId,scenarioId:typeof scenario.id==='string'?ssText(scenario.id,256):'unspecified',sourceHash:scenario.source_hash??null,confirmedClaims:claims.length,pendingClaims:saved.pending?1:0,reportedStatuses:statuses}};
  });
  if(server){const last=stages.at(-1);if(last.saved.session_id!==current.session_id)ssFail();if(ssCanonical(last.saved.graph)!==ssCanonical(current.graph)||ssCanonical(last.scenario)!==ssCanonical(current.scenario))ssFail('contradictory-current-stage');}
  else reasons.push('current-server-envelope-unavailable');
  return {original:parsed.original,raw,current,stages,reasons:[...new Set(reasons)]};
}
async function ssInspection(prepared,options){return ssFreeze({version:1,kind:'gw-thread-session-inspection',sha256:await ssHash(prepared.original,options),byteLength:prepared.original.length,
  restoration:{envelopeCompatible:prepared.reasons.length===0,reasons:prepared.reasons},reported:{completed:prepared.raw.completed??null,
    confirmedClaims:prepared.stages.reduce((n,s)=>n+s.claims.length,0),pendingClaims:prepared.stages.reduce((n,s)=>n+(s.saved.pending?1:0),0),stages:prepared.stages.map(stage=>stage.summary)},qualification:SANDBOX_SESSION_QUALIFICATION});}
export async function inspectThreadSession(bytes,options={}){ssFields(options,['cryptoObject','signal'],[]);ssCheck(options.signal);return ssInspection(ssPrepare(bytes),options);}

function ssContext(value){ssFields(value,['version','project','page','problem']);if(value.version!==1)ssFail();ssFields(value.project,['id','revision']);ssFields(value.page,['url','sourceDigest']);ssFields(value.problem,['id','revision','problemSha256','contextSha256','exportSha256']);
  const urlText=ssText(value.page.url,2048);let url;try{url=new URL(urlText);}catch{ssFail();}if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.href!==urlText||!url.pathname.endsWith('.html')||/%(?:2e|2f|5c|00|0a|0d)/iu.test(url.pathname))ssFail();
  if(typeof value.page.sourceDigest!=='string'||!/^sha(?:1:[a-f0-9]{40}|256:[a-f0-9]{64})$/u.test(value.page.sourceDigest))ssFail();
  return {version:1,project:{id:ssID(value.project.id),revision:ssText(value.project.revision,128)},page:{url:url.href,sourceDigest:value.page.sourceDigest},
    problem:{id:ssID(value.problem.id),revision:ssText(value.problem.revision,128),problemSha256:ssDigest(value.problem.problemSha256),contextSha256:ssDigest(value.problem.contextSha256),exportSha256:ssDigest(value.problem.exportSha256)}};
}
const ssNormalizedTheory=value=>value.replace(/^\uFEFF+/u,'').replace(/\r\n/gu,'\n');
function ssScenarioMatches(scenario,verified){
  const atoms=verified.receipt.bindings.atoms,known=new Map(atoms.map(atom=>[atom.source,atom.generated]));ssObject(scenario.nodes);
  if(ssCanonical(Object.keys(scenario.nodes).sort())!==ssCanonical(atoms.map(atom=>atom.generated).sort()))ssFail('scenario-projection-mismatch');
  for(const atom of atoms){const node=ssObject(scenario.nodes[atom.generated]),authored=verified.spec.atoms.find(value=>value.id===atom.source);if(node.label!==authored.label||node.fact!==verified.spec.givens.includes(atom.source)||node.hol!==undefined&&node.hol!==atom.generated)ssFail('scenario-projection-mismatch');}
  ssArray(scenario.rules,80);const expected=verified.spec.rules.map(rule=>({id:verified.receipt.bindings.rules.find(value=>value.source===rule.id).generated,premises:rule.premises.map(id=>known.get(id)),conclusion:known.get(rule.conclusion)}));
  const actual=scenario.rules.map(rule=>{ssObject(rule);ssArray(rule.premises,40,1);return {id:rule.id,premises:ssCopy(rule.premises),conclusion:rule.conclusion};});
  if(ssCanonical(actual)!==ssCanonical(expected)||ssCanonical(scenario.targets)!==ssCanonical(verified.spec.goals.map(id=>known.get(id))))ssFail('scenario-projection-mismatch');
}
async function ssAssociate(prepared,context,problemExport,options){ssCheck(options.signal);const verified=await verifyProblemExport(problemExport);ssCheck(options.signal);
  const expected={id:verified.spec.id,revision:verified.spec.revision,problemSha256:verified.receipt.problemSha256,contextSha256:verified.receipt.contextSha256,exportSha256:verified.receipt.exportSha256};
  if(ssCanonical(context.problem)!==ssCanonical(expected))ssFail('stale-problem-context');
  const scenario=prepared.stages.at(-1).scenario;if(typeof scenario.source_text!=='string')ssFail('scenario-source-unavailable');
  const actual=ssNormalizedTheory(scenario.source_text),source=ssNormalizedTheory(verified.text);if(actual!==source)ssFail('unrelated-problem');
  const normalizedSha256=await ssHash(ssEncoder.encode(actual),options);if(scenario.source_hash!==undefined&&scenario.source_hash!==normalizedSha256)ssFail('scenario-source-mismatch');
  ssScenarioMatches(scenario,verified);
  return {version:1,current:'exact-bom-crlf-normalized-export',normalizedSourceSha256:normalizedSha256,scenarioProjection:'declared-boolean-horn-fields-match-export',earlierStages:prepared.stages.length>1?'preserved-unverified':'absent',qualification:'Current declared scenario text and positive Boolean/Horn fields match the current exported problem; this does not authenticate its producer or recheck any imported claim.'};
}

/** Validate only explicit author mappings against actual verified exports.
 * Pedagogical roles remain declarations; an objection is not inferred to be a
 * logical contradiction and evidence membership does not establish support. */
export async function validateSessionMappings(value=[],problemExports=[]){
  ssArray(value,16);ssArray(problemExports,16);const entries=ssCopy(value),exports=ssCopy(problemExports),problems=new Map();
  for(const item of exports){const verified=await verifyProblemExport(item);if(problems.has(verified.spec.id))ssFail('duplicate-problem');problems.set(verified.spec.id,verified);}
  const seen=new Set(),normalized=entries.map(entry=>{ssFields(entry,['problem','atoms']);const problem=ssID(entry.problem),exported=problems.get(problem);if(!exported||seen.has(problem))ssFail('invalid-session-mapping');seen.add(problem);ssArray(entry.atoms,40);
    const known=new Set(exported.spec.atoms.map(atom=>atom.id)),ids=new Set();const atoms=entry.atoms.map(atom=>{ssFields(atom,['id','role','targets'],['id','role']);const id=ssID(atom.id);if(!known.has(id)||ids.has(id)||!['claim','evidence','objection'].includes(atom.role))ssFail('invalid-session-mapping');ids.add(id);const result={id,role:atom.role};
      if(atom.targets!==undefined){if(atom.role==='claim')ssFail('invalid-session-mapping');ssArray(atom.targets,40,1);const targets=new Set();result.targets=atom.targets.map(value=>{const target=ssID(value);if(!known.has(target)||target===id||targets.has(target))ssFail('invalid-session-mapping');targets.add(target);return target;});}return result;});return {problem,atoms};});
  return ssFreeze(normalized);
}
function ssBase64(bytes){let binary='';for(let at=0;at<bytes.length;at+=32768)binary+=String.fromCharCode(...bytes.subarray(at,at+32768));return btoa(binary);}
function ssUnbase64(value,length){ssText(value,Math.ceil(SANDBOX_SESSION_LIMITS.threadBytes/3)*4);const padding=value.indexOf('=');if(!Number.isSafeInteger(length)||length<1||length>SANDBOX_SESSION_LIMITS.threadBytes||value.length%4||/[^A-Za-z0-9+/=]/u.test(value)||padding!==-1&&(padding<value.length-2||!/^={1,2}$/u.test(value.slice(padding))))ssFail();let binary;try{binary=atob(value);}catch{ssFail();}if(binary.length!==length)ssFail();const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));if(ssBase64(bytes)!==value)ssFail();return bytes;}
function ssJourney(value){if(ssEncoder.encode(ssCanonical(value)).length>65536)ssFail();ssObject(value);if(value.version!==1||value.kind!=='gw-learning-journey')ssFail();return ssCopy(value);}
function ssCapsuleBody(value){ssFields(value,['version','kind','context','thread','association','journey','journeySha256','qualification','hashes'],['version','kind','context','thread','association','qualification','hashes']);if(value.version!==1||value.kind!=='gw-sandbox-session-capsule'||value.qualification!==SANDBOX_SESSION_QUALIFICATION)ssFail();ssFields(value.thread,['encoding','mediaType','byteLength','sha256','data']);if(value.thread.encoding!=='base64'||value.thread.mediaType!=='application/json')ssFail();ssDigest(value.thread.sha256);
  if((value.journey===undefined)!==(value.journeySha256===undefined))ssFail();const body={version:1,kind:value.kind,context:ssContext(value.context),thread:ssCopy(value.thread),association:ssCopy(value.association),qualification:value.qualification};if(value.journey!==undefined){body.journey=ssJourney(value.journey);body.journeySha256=ssDigest(value.journeySha256);}return body;}

export async function createSessionCapsule(bytes,context,options={}){ssFields(options,['problemExport','journey','cryptoObject','signal'],['problemExport']);ssCheck(options.signal);const prepared=ssPrepare(bytes),bound=ssContext(context),problemExport=ssCopy(options.problemExport),journey=options.journey===undefined?undefined:ssJourney(options.journey),inspection=await ssInspection(prepared,options),association=await ssAssociate(prepared,bound,problemExport,options);
  const body={version:1,kind:'gw-sandbox-session-capsule',context:bound,thread:{encoding:'base64',mediaType:'application/json',byteLength:prepared.original.length,sha256:inspection.sha256,data:ssBase64(prepared.original)},association,qualification:SANDBOX_SESSION_QUALIFICATION};
  if(journey!==undefined){body.journey=journey;body.journeySha256=await ssHashJSON(body.journey,options);}
  const capsule={...body,hashes:{contextSha256:await ssHashJSON(bound,options),capsuleSha256:await ssHashJSON(body,options)}};if(ssEncoder.encode(ssCanonical(capsule)).length>SANDBOX_SESSION_LIMITS.capsuleBytes)ssFail();ssCheck(options.signal);return ssFreeze(capsule);
}
export async function validateSessionCapsule(value,currentContext,options={}){ssFields(options,['problemExport','cryptoObject','signal'],['problemExport']);ssCheck(options.signal);const serialized=ssCanonical(value);if(ssEncoder.encode(serialized).length>SANDBOX_SESSION_LIMITS.capsuleBytes)ssFail();value=JSON.parse(serialized);const body=ssCapsuleBody(value),bound=ssContext(currentContext),problemExport=ssCopy(options.problemExport);ssFields(value.hashes,['contextSha256','capsuleSha256']);
  if(ssCanonical(body.context)!==ssCanonical(bound)||ssDigest(value.hashes.contextSha256)!==await ssHashJSON(bound,options)||ssDigest(value.hashes.capsuleSha256)!==await ssHashJSON(body,options))ssFail('stale-capsule');
  if(body.journey!==undefined&&body.journeySha256!==await ssHashJSON(body.journey,options))ssFail('changed-journey');const bytes=ssUnbase64(body.thread.data,body.thread.byteLength),prepared=ssPrepare(bytes),inspection=await ssInspection(prepared,options);
  if(inspection.sha256!==body.thread.sha256)ssFail('changed-thread-bytes');const association=await ssAssociate(prepared,bound,problemExport,options);if(ssCanonical(association)!==ssCanonical(body.association))ssFail('changed-association');
  const receipt={version:1,kind:'gw-sandbox-capsule-receipt',threadSha256:inspection.sha256,contextSha256:value.hashes.contextSha256,capsuleSha256:value.hashes.capsuleSha256,threadRestoration:'exact-original-bytes-only',proofStatus:'reported-unverified',journeyStatus:body.journey===undefined?'absent':'requires-current-producer-validation',qualification:SANDBOX_SESSION_QUALIFICATION};
  ssCheck(options.signal);return ssFreeze({bytes,inspection,context:bound,...(body.journey===undefined?{}:{journey:body.journey}),receipt});
}

/** A deliberately finite AIF view. Unsupported material is reported as a loss,
 * never repaired into a premise or certified proof. Original Thread bytes stay
 * the separate lossless restoration object. */
export async function projectArgumentInterchange(bytes,options={}){ssFields(options,['format','cryptoObject','signal','context','problemExport','pedagogy'],['format']);if(!['aif','xaif'].includes(options.format)||(options.context===undefined)!==(options.problemExport===undefined)||options.pedagogy!==undefined&&options.context===undefined)ssFail();ssCheck(options.signal);
  const prepared=ssPrepare(bytes),bound=options.context===undefined?null:ssContext(options.context),problem=options.problemExport===undefined?null:ssCopy(options.problemExport),pedagogy=options.pedagogy===undefined?[]:ssCopy(options.pedagogy),inspection=await ssInspection(prepared,options),nodes=[],edges=[],losses=new Map();let serial=0,course=null;
  if(bound){const association=await ssAssociate(prepared,bound,problem,options),verified=await verifyProblemExport(problem),mappings=await validateSessionMappings([{problem:bound.problem.id,atoms:pedagogy}],[verified]),declared=new Map(mappings[0].atoms.map(atom=>[atom.id,atom])),prefix='s'+(prepared.stages.length-1)+':p:';
    const generated=new Map(verified.receipt.bindings.atoms.map(atom=>[atom.source,atom.generated]));
    course={context:bound,source:ssCopy(verified.context.source),association,bindings:verified.receipt.bindings.atoms.map(atom=>{const mapping=declared.get(atom.source);return {atomId:atom.source,generated:atom.generated,nodeID:prefix+atom.generated,...(mapping?{role:mapping.role,...(mapping.targets?{targets:mapping.targets.map(id=>({atomId:id,generated:generated.get(id),nodeID:prefix+generated.get(id)}))}:{})}:{})};}),qualification:'Current source/problem association and author-declared pedagogy only. Evidence targets do not establish support; pedagogical objections are not logical CA nodes or proof statuses.'};}
  const loss=(code,count=1,scope='session')=>{const key=code+'\u0000'+scope,prior=losses.get(key);losses.set(key,{code,count:(prior?.count??0)+count,scope});};
  const add=value=>{if(nodes.length>=2048)ssFail('projection-budget');nodes.push(value);return value.nodeID;};const edge=(fromID,toID)=>{if(edges.length>=8192)ssFail('projection-budget');edges.push({edgeID:String(++serial),fromID,toID});};
  for(const stage of prepared.stages){ssCheck(options.signal);const prefix='s'+stage.index+':',scenario=stage.scenario,known=new Map(),negative=new Map(),scope='stage-'+(stage.index+1);
    if(scenario.nodes!==undefined){ssObject(scenario.nodes);if(Object.keys(scenario.nodes).length>128)ssFail();for(const [id,value]of Object.entries(scenario.nodes)){if(!ssClaim.test(id)||!value||typeof value!=='object'||Array.isArray(value)||typeof value.label!=='string'){loss('unsupported-proposition',1,scope);continue;}const nodeID=prefix+'p:'+id;known.set(id,nodeID);add({nodeID,text:ssText(value.label,8000),type:'I',thread:{membership:'scenario-declaration',given:value.fact===true,verification:'reported-unverified',...(typeof value.hol==='string'?{hol:ssText(value.hol,8000)}:{})}});}}
    else loss('scenario-propositions-unavailable',1,scope);
    const literal=value=>{if(!value||typeof value!=='object'||Array.isArray(value)||typeof value.id!=='string'||!known.has(value.id)||value.positive!==undefined&&typeof value.positive!=='boolean')return null;if(value.positive!==false)return known.get(value.id);if(negative.has(value.id))return negative.get(value.id);const nodeID=add({nodeID:prefix+'n:'+value.id,text:'Not: '+scenario.nodes[value.id].label,type:'I',thread:{polarity:false,proposition:value.id,verification:'reported-unverified'}}),conflict=add({nodeID:prefix+'conflict:'+value.id,text:'Reported contradictory propositions',type:'CA',thread:{verification:'reported-unverified'}});edge(known.get(value.id),conflict);edge(conflict,nodeID);negative.set(value.id,nodeID);return nodeID;};
    const expression=(value,depth=0,budget={nodes:0})=>{if(!value||typeof value!=='object'||Array.isArray(value)||depth>12||++budget.nodes>256)return null;
      const fields={atom:['op','name'],const:['op','value'],not:['op','arg'],box:['op','arg'],diamond:['op','arg'],and:['op','left','right'],or:['op','left','right'],implies:['op','left','right'],iff:['op','left','right'],answer:['op','guard','proposition']}[value.op];if(!fields||Object.keys(value).length!==fields.length||Object.keys(value).some(key=>!fields.includes(key)))return null;
      if(value.op==='atom')return typeof value.name==='string'&&known.has(value.name)?ssCopy(value):null;
      if(value.op==='const')return typeof value.value==='boolean'?ssCopy(value):null;
      if(['not','box','diamond'].includes(value.op))return expression(value.arg,depth+1,budget)?ssCopy(value):null;
      if(['and','or','implies','iff'].includes(value.op))return expression(value.left,depth+1,budget)&&expression(value.right,depth+1,budget)?ssCopy(value):null;
      if(value.op==='answer')return typeof value.guard==='string'&&known.has(value.guard)&&expression(value.proposition,depth+1,budget)?ssCopy(value):null;return null;};
    const expressionNodes=new Map();const exprNode=value=>{const normalized=expression(value);if(!normalized)return null;const key=ssCanonical(normalized);if(expressionNodes.has(key))return expressionNodes.get(key);const nodeID=add({nodeID:prefix+'expr:'+expressionNodes.size,text:key,type:'I',thread:{expression:normalized,verification:'reported-unverified'}});expressionNodes.set(key,nodeID);return nodeID;};
    if(scenario.rules!==undefined){ssArray(scenario.rules,128);const names=new Set();for(const rule of scenario.rules){if(!rule||typeof rule!=='object'||typeof rule.id!=='string'||!ssClaim.test(rule.id)||names.has(rule.id)||!Array.isArray(rule.premises)||rule.premises.length<1||rule.premises.length>40||rule.premises.some(id=>!known.has(id))||!known.has(rule.conclusion)){loss('unsupported-scenario-rule',1,scope);continue;}names.add(rule.id);const nodeID=add({nodeID:prefix+'r:'+rule.id,text:'Declared rule '+rule.id,type:'RA',thread:{membership:'scenario-rule',verification:'reported-unverified'}});for(const id of rule.premises)edge(known.get(id),nodeID);edge(nodeID,known.get(rule.conclusion));}}
    for(const item of stage.claims){const claim=item.claim,claimText=ssText(claim.text??item.view.text??'',8000,{empty:true}),premises=[],conclusions=[];let supported=claim.mode===undefined||['assertion','conditional'].includes(claim.mode);
      if(claim.assumptions!==undefined){if(!Array.isArray(claim.assumptions)||claim.assumptions.length>40)supported=false;else for(const value of claim.assumptions){const id=value?.op?exprNode(value):literal(value);if(!id)supported=false;else premises.push(id);}}
      if(claim.conclusions!==undefined){if(!Array.isArray(claim.conclusions)||claim.conclusions.length>40)supported=false;else for(const value of claim.conclusions){const id=value?.op?exprNode(value):literal(value);if(!id)supported=false;else conclusions.push(id);}}
      if(claim.conclusion!==undefined){const id=claim.conclusion?.op?exprNode(claim.conclusion):literal(claim.conclusion);if(!id)supported=false;else conclusions.push(id);}
      if(!conclusions.length)supported=false;const nodeID=add({nodeID:prefix+'c:'+item.id,text:claimText,type:supported?'RA':'I',thread:{membership:'reported-confirmed',verification:'reported-unverified',reportedStatus:ssText(claim.epistemic?.state??item.view.epistemic?.state??claim.status??'unspecified',256),...(typeof claim.mode==='string'?{mode:ssText(claim.mode,128)}:{}),dependsOn:ssCopy(claim.depends_on??[])}});
      if(supported){for(const id of new Set(premises))edge(id,nodeID);for(const id of new Set(conclusions))edge(nodeID,id);}else loss('unsupported-claim-logic-retained-as-text',1,scope);
      if(claim.depends_on?.length)loss('claim-dependencies-retained-as-metadata',claim.depends_on.length,scope);
    }
    if(stage.saved.pending){const pending=stage.saved.pending,view=pending.interpretation??pending;add({nodeID:prefix+'pending',text:ssText(view.text??pending.original??'Pending interpretation',8000),type:'I',thread:{membership:'pending-interpretation',verification:'reported-unverified'}});loss('pending-logic-not-promoted',1,scope);}
    if(scenario.targets!==undefined||scenario.goal!==undefined)loss('goals-retained-as-metadata-not-proof-obligations',1,scope);
    for(const key of ['history','solution','solution_checks','case_review'])if(stage.saved[key]!==undefined&&stage.saved[key]!==null)loss('formal-session-details-not-projected',1,scope);
  }
  for(const key of ['transcript','reflection','learning','performance','draft'])if(prepared.raw[key]!==undefined&&prepared.raw[key]!==null)loss(key+'-not-projected');if(prepared.stages.length>1)loss('stage-transitions-retained-as-metadata',prepared.stages.length-1);
  loss('proof-status-not-rechecked');loss('exact-thread-bytes-require-original-json-or-capsule');loss('dialogue-and-layout-not-reconstructed');if(!course)loss('native-course-mapping-unavailable');
  const aif={nodes,edges,schemefulfillments:[],descriptorfulfillments:[],participants:[],locutions:[],thread:{version:1,sourceSha256:inspection.sha256,verification:'reported-unverified',stages:prepared.stages.map(stage=>({id:stage.summary.sessionId,scenario:stage.summary.scenarioId,sourceHash:stage.summary.sourceHash,...(stage.scenario.targets===undefined?{}:{reportedTargets:ssCopy(stage.scenario.targets)})})),...(course?{course}:{}),scope:'Finite argument view with explicit losses; not a Thread restoration record.'}};
  aif.thread.losses=[...losses.values()];let data=aif;if(options.format==='xaif')data={AIF:aif,dialog:false,OVA:{firstname:'',surname:'',url:'',nodes:[],edges:[]},text:prepared.stages.flatMap(stage=>stage.claims.map(item=>item.claim.text??item.view.text??'')).join('\n')};
  const result={version:1,format:options.format,data,losses:aif.thread.losses,qualification:SANDBOX_SESSION_QUALIFICATION,sourceSha256:inspection.sha256,projectionSha256:await ssHashJSON(data,options)};ssCheck(options.signal);return ssFreeze(result);
}
