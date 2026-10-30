// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Original data-only selector for the published Interactive CV v1 interface.
// No CV code/dependency is embedded; no records are rewritten or upgraded.
export const PROFESSIONAL_VERSION='gw-professional-view-v1';
export const PROFESSIONAL_LIMITS=Object.freeze({modelBytes:2097152,records:2000,query:512,skillDepth:64});
const pEncoder=new TextEncoder();
const pTypes=new Set(['Person','Role','Project','Skill','Activity','Output','Outcome','Impact','PersonalReflection','Evidence','Time','Assertion','ServiceOffering','EvidenceSource','Relation']);
const pQualifiers=['origin','review','verification','evidence-availability','reviewer','reviewed-at','verifier','verified-at','method','scope','source-verification','source-status','source-scope','rights','contribution','causal-attribution'];
const pRecordFields=['id','type','title','summary','url','qualification','publicationReview','start','end','date','scalarFacts','relations','facts'];
const pEvidence=new Set(['supportedByEvidence','contradictedByEvidence','qualifiedByEvidence','evidence']);
// These are explicit, directed context links, not inferred causal relations.
const pContext={withinRole:'Role',prerequisiteRole:'Role',withinProject:'Project',prerequisiteProject:'Project',producedBy:'Activity',followsOutput:'Output',contributedBy:'Outcome'};
function pFail(){const error=new TypeError('generative-websites: invalid or unsupported public professional model or selection');error.code='invalid-professional-view';throw error;}
function pFields(value,allowed,required=allowed){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))pFail();
 for(const key of Reflect.ownKeys(value)){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!allowed.includes(key)||!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))pFail();}
 if(required.some(key=>!Object.hasOwn(value,key)))pFail();
}
function pArray(value,max=2000){
 if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>max)pFail();
 const keys=Reflect.ownKeys(value).filter(key=>key!=='length');if(keys.length!==value.length)pFail();
 keys.forEach((key,index)=>{const descriptor=Object.getOwnPropertyDescriptor(value,key);if(key!==String(index)||!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))pFail();});return value;
}
function pText(value,max=8192){if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff\ud800-\udfff]/u.test(value))pFail();return value;}
function pID(value){pText(value);if(!/^[a-z][a-z0-9+.-]*:\S+$/iu.test(value)||/\s/u.test(value))pFail();return value;}
function pURL(value){
 pText(value);if(/[\u0000-\u0020\\]/u.test(value)||value.startsWith('//'))pFail();
 if(/^[a-z][a-z0-9+.-]*:/iu.test(value)){
  let url;try{url=new URL(value);}catch{pFail();}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password)pFail();
 }
 return value;
}
function pDate(value,{day=false}={}){
 pText(value);if(!(day?/^\d{4}-\d{2}-\d{2}$/u:/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/u).test(value))pFail();
 const [year,month,date]=value.split('-').map(Number);if(month!==undefined&&(month<1||month>12))pFail();
 if(date!==undefined){const leap=year%400===0||year%4===0&&year%100!==0;if(date<1||date>[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month-1])pFail();}return value;
}
function pCanonical(value,depth=0,ancestors=new Set(),budget={nodes:0,bytes:0}){
 if(depth>16||++budget.nodes>200000)pFail();
 function add(bytes){budget.bytes+=bytes;if(budget.bytes>PROFESSIONAL_LIMITS.modelBytes)pFail();}
 if(typeof value==='string'){const result=JSON.stringify(value);add(pEncoder.encode(result).length);return result;}
 if(value===null||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)){const result=JSON.stringify(value);add(result.length);return result;}
 if(!value||typeof value!=='object'||ancestors.has(value))pFail();ancestors.add(value);let result;
 if(Array.isArray(value)){pArray(value);add(2+Math.max(0,value.length-1));result='['+value.map(item=>pCanonical(item,depth+1,ancestors,budget)).join(',')+']';}
 else{pFields(value,Object.keys(value));const keys=Object.keys(value).sort();add(2+Math.max(0,keys.length-1));result='{'+keys.map(key=>{const name=JSON.stringify(key);add(pEncoder.encode(name).length+1);return name+':'+pCanonical(value[key],depth+1,ancestors,budget);}).join(',')+'}';}
 ancestors.delete(value);return result;
}
function pClone(value){pCanonical(value);return JSON.parse(JSON.stringify(value));}
function pFreeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(pFreeze);Object.freeze(value);}return value;}
async function pHash(value,cryptoObject){if(!cryptoObject?.subtle||typeof cryptoObject.subtle.digest!=='function')pFail();const result=await cryptoObject.subtle.digest('SHA-256',pEncoder.encode(pCanonical(value)));if(!(result instanceof ArrayBuffer)||result.byteLength!==32)pFail();return [...new Uint8Array(result)].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
function pValidateModel(value){
 // Reject private/author-model fields and accessors before copying anything.
 pFields(value,['version','asOf','records']);pCanonical(value);if(value.version!==1)pFail();pDate(value.asOf,{day:true});pArray(value.records);
 const byID=new Map();
 for(const record of value.records){
  pFields(record,pRecordFields,['id','type','title','summary','url','qualification','publicationReview']);pID(record.id);
  if(byID.has(record.id)||!pTypes.has(record.type)||!['author-reviewed','independently-reviewed'].includes(record.publicationReview))pFail();
  pText(record.title);pText(record.summary);pURL(record.url);pFields(record.qualification,pQualifiers,['origin','review','verification','evidence-availability']);
  const q=record.qualification;for(const field of Object.keys(q))pText(q[field]);
  if(!['author-declared','extracted-candidate','inferred-proposal'].includes(q.origin)||!['unreviewed','author-reviewed','independently-reviewed'].includes(q.review)||
   !['unassessed','self-reported','externally-verified'].includes(q.verification)||!['public','restricted','unavailable','awaiting-permission'].includes(q['evidence-availability']))pFail();
  if(q.verification==='externally-verified')for(const key of ['verifier','verified-at','method','scope'])pText(q[key]);
  if(q.review==='independently-reviewed')pText(q.reviewer);
  for(const key of ['reviewed-at','verified-at'])if(q[key]!==undefined)pDate(q[key]);
  for(const key of ['start','end','date'])if(record[key]!==undefined&&record[key]!==null)pText(record[key]);
  for(const key of ['facts','scalarFacts'])if(record[key]!==undefined)for(const fact of pArray(record[key])){pFields(fact,['label','value']);pText(fact.label);pText(fact.value);}
  if(record.relations!==undefined)for(const relation of pArray(record.relations)){pFields(relation,['predicate','target','title','url']);pText(relation.predicate);pID(relation.target);pText(relation.title);pURL(relation.url);}
  byID.set(record.id,record);
 }
 for(const record of value.records){
  for(const relation of record.relations||[]){const target=byID.get(relation.target);if(!target||relation.title!==target.title||relation.url!==target.url)pFail();
   if(relation.predicate==='broader'&&(record.type!=='Skill'||target.type!=='Skill'))pFail();
   if(['supportedByEvidence','contradictedByEvidence','qualifiedByEvidence'].includes(relation.predicate)&&target.type!=='Evidence')pFail();
   if(relation.predicate==='hasAssertion'&&target.type!=='Assertion')pFail();
  }
  if(['Outcome','Impact'].includes(record.type)&&!(record.relations||[]).some(link=>link.predicate==='hasAssertion'))pFail();
  if(record.type==='Assertion'&&!(record.relations||[]).some(link=>['supportedByEvidence','contradictedByEvidence','qualifiedByEvidence'].includes(link.predicate)))pFail();
 }
 return byID;
}
function pRequest(value,byID){
 pFields(value,['query','skillIds','projectIds','types','detail','includeEvidence'],[]);
 const query=value.query===undefined?'':value.query;if(typeof query!=='string'||query.length>512||/[\u0000-\u001f\u007f\ud800-\udfff]/u.test(query))pFail();
 const result={query,skillIds:[],projectIds:[],types:[],detail:value.detail===undefined?'summary':value.detail,includeEvidence:value.includeEvidence===undefined?true:value.includeEvidence};
 if(!['summary','full'].includes(result.detail)||typeof result.includeEvidence!=='boolean')pFail();
 for(const [key,type]of [['skillIds','Skill'],['projectIds','Project'],['types',null]]){
  if(value[key]===undefined)continue;const seen=new Set();for(const id of pArray(value[key],2000)){pText(id);if(seen.has(id)||type&&byID.get(id)?.type!==type||!type&&!pTypes.has(id))pFail();seen.add(id);result[key].push(id);}
 }
 return result;
}
const pNormalize=value=>value.normalize('NFKC').toLowerCase().replace(/\s+/gu,' ').trim();
function pSkillAncestors(byID){
 const complete=new Map(),visiting=new Set();
 function visit(id,depth){if(depth>64||visiting.has(id))pFail();if(complete.has(id)){const cached=complete.get(id);if(depth+cached.height>64)pFail();return cached;}
  visiting.add(id);const ids=new Set([id]);let height=0;
  for(const link of byID.get(id).relations||[])if(link.predicate==='broader'){const parent=visit(link.target,depth+1);height=Math.max(height,parent.height+1);for(const ancestor of parent.ids)ids.add(ancestor);}
  visiting.delete(id);const result={ids,height};complete.set(id,result);return result;
 }
 for(const record of byID.values())if(record.type==='Skill')visit(record.id,0);return complete;
}
function pContextLinks(record,byID){return(record.relations||[]).filter(link=>pContext[link.predicate]===byID.get(link.target).type);}
function pProjectPaths(record,byID){
 const result=new Set(),queued=new Set([record.id]),queue=[record];for(let index=0;index<queue.length;index++){const current=queue[index];if(current.type==='Project')result.add(current.id);
  for(const link of pContextLinks(current,byID))if(!queued.has(link.target)){queued.add(link.target);queue.push(byID.get(link.target));}}return result;
}

/** Select only this caller-supplied public snapshot. Facet dimensions intersect;
 * values within a facet are alternatives. A skill facet follows exact declared
 * Skill links and multi-parent `broader` ancestors, never mastery. Project
 * paths use the finite directed context vocabulary above. Unknown predicates
 * remain verbatim data and receive no invented semantics.
 *
 * `detail` is a display hint: neither mode removes wording, qualifiers, facts
 * or relations. `includeEvidence:false` omits optional reverse `documents`
 * associations, NEVER explicit assertion subject/object associations or
 * mandatory claim, contrary or qualifying evidence. Review/consent/rights
 * declarations are not authenticated.
 */
export async function selectProfessionalView(model,request,options={}){
 pFields(options,['cryptoObject'],[]);pValidateModel(model);const snapshot=pClone(model),byID=pValidateModel(snapshot),normalized=pRequest(request,byID),chosen=pClone(normalized),cryptoObject=options.cryptoObject===undefined?globalThis.crypto:options.cryptoObject;
 const ancestors=pSkillAncestors(byID),words=pNormalize(chosen.query).split(' ').filter(Boolean),skills=new Map(),projects=new Map();
 for(const record of snapshot.records){const ids=new Set(record.type==='Skill'?ancestors.get(record.id).ids:[]);
  for(const link of record.relations||[])if(byID.get(link.target).type==='Skill')for(const id of ancestors.get(link.target).ids)ids.add(id);skills.set(record.id,ids);projects.set(record.id,pProjectPaths(record,byID));}
 const reasons=new Map(),reasonKeys=new Map(),primaryIds=[];
 function include(id,reason){if(!reasons.has(id)){reasons.set(id,[]);reasonKeys.set(id,new Set());}const key=pCanonical(reason);if(!reasonKeys.get(id).has(key)){reasonKeys.get(id).add(key);reasons.get(id).push(reason);}}
 for(const record of snapshot.records){
  const haystack=pNormalize([record.title,record.summary,...Object.values(record.qualification),...(record.facts||[]).flatMap(fact=>[fact.label,fact.value]),...(record.scalarFacts||[]).flatMap(fact=>[fact.label,fact.value]),...['start','end','date'].map(key=>record[key]||''),...[...skills.get(record.id)].map(id=>byID.get(id).title)].join(' '));
  if(chosen.types.length&&!chosen.types.includes(record.type)||chosen.skillIds.length&&!chosen.skillIds.some(id=>skills.get(record.id).has(id))||chosen.projectIds.length&&!chosen.projectIds.some(id=>projects.get(record.id).has(id))||!words.every(word=>haystack.includes(word)))continue;
  primaryIds.push(record.id);include(record.id,{kind:'matches-request'});
 }
 if(primaryIds.length)for(const record of snapshot.records)if(record.type==='Person')include(record.id,{kind:'public-person-context'});
 // A monotone bounded worklist preserves qualifications through every included
 // context and assertion, including contradictions and uncertain evidence.
 const associated=new Map();for(const candidate of snapshot.records)for(const link of candidate.relations||[])
  if(chosen.includeEvidence&&candidate.type==='Evidence'&&link.predicate==='documents'||candidate.type==='Assertion'&&['subject','object'].includes(link.predicate)){
   if(!associated.has(link.target))associated.set(link.target,[]);associated.get(link.target).push({id:candidate.id,predicate:link.predicate});}
 const queue=[...reasons.keys()],processed=new Set();let visits=0;
 for(let index=0;index<queue.length;index++){
  const id=queue[index];if(processed.has(id))continue;processed.add(id);const record=byID.get(id);
  function add(target,kind,predicate){const fresh=!reasons.has(target);include(target,{kind,sourceId:id,predicate});if(fresh)queue.push(target);}
  for(const link of record.relations||[]){if(++visits>200000)pFail();const target=byID.get(link.target);
   if(pContext[link.predicate]===target.type)add(link.target,'declared-context',link.predicate);
   if(target.type==='Skill')add(link.target,'declared-skill-context',link.predicate);
   if(record.type==='Skill'&&link.predicate==='broader')add(link.target,'declared-skill-ancestor',link.predicate);
   if(link.predicate==='hasAssertion'&&target.type==='Assertion')add(link.target,'required-assertion',link.predicate);
   if(pEvidence.has(link.predicate)&&target.type==='Evidence')add(link.target,'required-evidence',link.predicate);
   if(record.type==='Evidence'&&target.type==='EvidenceSource'&&['fromSource','source'].includes(link.predicate))add(link.target,'evidence-source',link.predicate);
  }
  for(const candidate of associated.get(id)||[]){if(++visits>200000)pFail();add(candidate.id,byID.get(candidate.id).type==='Assertion'?'required-associated-assertion':'declared-associated-evidence',candidate.predicate);}
 }
 const records=snapshot.records.filter(record=>reasons.has(record.id)),selectionIds=records.map(record=>record.id),reasonRows=selectionIds.map(id=>({id,reasons:reasons.get(id)}));
 const modelSha256=await pHash(snapshot,cryptoObject),requestSha256=await pHash(chosen,cryptoObject),selectedFactsSha256=await pHash(records,cryptoObject),recordHashes=[];
 for(const record of records)recordHashes.push({id:record.id,sha256:await pHash(record,cryptoObject)});
 return pFreeze({version:1,kind:'gw-professional-view',providerVersion:PROFESSIONAL_VERSION,asOf:snapshot.asOf,request:chosen,primaryIds,selectionIds,reasons:reasonRows,records,
  hashes:{modelSha256,requestSha256,selectedFactsSha256,records:recordHashes},
  coverage:{scope:'declared-public-model-only',graphScope:'caller-selected-model',exhaustiveWithinModel:true,totalRecords:snapshot.records.length,matchedRecords:primaryIds.length,selectedRecords:records.length},
  reviewStatus:'unchanged-source-declarations',sourceQualification:'Caller-supplied published CV v1 data; hashes bind data, not source authenticity, consent, rights, claim truth or review authentication. No mastery, causal impact or new professional claims are inferred.'});
}
