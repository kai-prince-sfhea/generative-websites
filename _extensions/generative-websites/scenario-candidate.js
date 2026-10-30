// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Original finite transformation of the existing typed IR. No prose inference.
import {validateAssertionRegistry,canonicalAssertion} from './assertions.js';
import {controlledData,controlledFields,controlledCanonical,controlledDigest,controlledFreeze,controlledFail} from './controlled-authoring.js';
import {exportProblem} from './sandbox-export.js';
export const SCENARIO_PROFILE='gw-controlled-ground-horn-v1';
export const SCENARIO_NOTICE='Selected controlled statements form a ground positive-Horn problem only. Givens are assumptions for this problem; roles, author review and exact hashes do not establish truth, source fidelity, a solution or proof.';
const fail=code=>controlledFail(code),hash=/^[a-f0-9]{64}$/u;
const text=(v,n=256)=>{if(typeof v!=='string'||!v.trim()||v!==v.trim()||v.length>n||/[\u0000-\u001f\u007f*]/u.test(v))fail('scenario-field');return v;};
const id=v=>{text(v,128);if(!/^[A-Za-z][A-Za-z0-9._:-]{0,127}$/u.test(v)||['constructor','prototype'].includes(v))fail('scenario-id');return v;};
const list=(v,n)=>{if(!Array.isArray(v)||v.length>n)fail('scenario-budget');return v;};
const sha=(v,crypto)=>controlledDigest(controlledCanonical(v),crypto);
function atom(value,registry){
 if(value.op!=='predicate'||value.args.some(t=>!Object.hasOwn(t,'constant')))fail('scenario-non-ground-horn');
 const signature=registry.predicates.find(p=>p.id===value.id);
 const terms=value.args.map(t=>{const constant=registry.constants.find(c=>c.id===t.constant);if(!constant)fail('scenario-non-ground-horn');return{id:constant.id,sort:constant.sort};});
 return{predicate:value.id,signature:signature.args,terms};
}
function premises(value,registry){return value.op==='and'?value.items.flatMap(v=>premises(v,registry)):[atom(value,registry)];}
/** Already validated shared compilation is supplied by the native compiler.
 * No new assertion binding is accepted by this transformation's review. */
export async function prepareScenarioCandidates(input,{cryptoObject=globalThis.crypto}={}){
 const v=controlledData(input);controlledFields(v,['config','compilation','objects','observations','project','page','compiler']);
 if(v.config===false||v.config===null)return null;
 const cfg=controlledFields(v.config,[],['mode','scenarios','reviews']),mode=cfg.mode??'inspect';if(!['inspect','reviewed'].includes(mode))fail('scenario-mode');
 const specs=list(cfg.scenarios??[],16),reviews=list(cfg.reviews??[],16),observations=list(v.observations,32),objects=list(v.objects,50);
 if(new Set(specs.map(s=>s.id)).size!==specs.length||new Set(reviews.map(s=>s.scenarioId)).size!==reviews.length)fail('scenario-duplicate');
 controlledFields(v.project,['id','revision']);controlledFields(v.page,['id','url','revision','sourceDigest']);
 controlledFields(v.compiler,['profile','artifacts','executionAttestation']);if(v.compiler.profile!==SCENARIO_PROFILE||v.compiler.executionAttestation!=='not-provided')fail('scenario-compiler');
 for(const [name,digest]of Object.entries(v.compiler.artifacts)){text(name,128);if(!hash.test(digest))fail('scenario-compiler');}
 const observationsByScenario=new Map(),roleIds=new Set(),ownerIds=new Set();
 for(const row of observations){controlledFields(row,['objectId','roleId','scenario','role','sourceText','sourceDigest'],['unsupported']);id(row.objectId);id(row.roleId);id(row.scenario);
  if(roleIds.has(row.roleId)||ownerIds.has(row.objectId))fail('scenario-duplicate');roleIds.add(row.roleId);ownerIds.add(row.objectId);
  if(!['given','rule','goal'].includes(row.role))fail('scenario-role');if(typeof row.sourceText!=='string'||row.sourceText.length>65536||!/^sha1:[a-f0-9]{40}$/u.test(row.sourceDigest))fail('scenario-source');
  const rows=observationsByScenario.get(row.scenario)??[];rows.push(row);observationsByScenario.set(row.scenario,rows);
 }
 if(observations.some(row=>!specs.some(spec=>spec.id===row.scenario))||reviews.some(row=>!specs.some(spec=>spec.id===row.scenarioId)))fail('scenario-unknown');
 const registry=v.compilation?validateAssertionRegistry(v.compilation.registry):null,results=[],exports=[],suggested=[];
 for(const raw of specs){controlledFields(raw,['id','revision','label','description']);const spec={id:id(raw.id),revision:text(raw.revision,128),label:text(raw.label,100),description:text(raw.description,1800)};
  const rows=observationsByScenario.get(spec.id)??[],sources=[],mapping=[],atoms=new Map(),givens=[],rules=[],goals=[];let reason=null,exported=null;
  try{
   if(!registry||!rows.length)fail('scenario-source-unavailable');
   let context=null,domain=null;
   const intern=async value=>{const key=controlledCanonical(value);if(!atoms.has(key)){if(atoms.size>=40)fail('scenario-budget');const name='a'+(await sha(value,cryptoObject)).slice(0,32);atoms.set(key,{id:name,label:text(value.predicate+'('+value.terms.map(t=>t.id).join(',')+')',256)});}return atoms.get(key).id;};
   for(const row of rows){
    const owner=objects.find(o=>o.id===row.objectId),assertion=registry.assertions.find(a=>a.id===owner?.assertionId),compiled=v.compilation.sources.find(s=>s.assertionId===assertion?.id);
    if(row.unsupported||!owner||!assertion||!compiled||assertion.modality!=='asserted')fail('scenario-source-ineligible');
    if(context===null){context=assertion.context;domain=assertion.domain;}if(context!==assertion.context||domain!==assertion.domain||owner.context!==context)fail('scenario-context');
    sources.push({objectId:owner.id,objectRevision:owner.revision,assertionId:assertion.id,assertionRevision:assertion.revision,roleId:row.roleId,role:row.role,
     source:{path:v.page.url,anchor:owner.id,sha256:await controlledDigest(owner.sourceText,cryptoObject)},sourceDigest:owner.sourceDigest,
     roleSourceDigest:row.sourceDigest,roleSha256:await controlledDigest(row.sourceText,cryptoObject),controlledSourceSha256:compiled.sourceSha256,irSha256:await controlledDigest(canonicalAssertion(assertion),cryptoObject),
     context,domain,modality:assertion.modality,status:assertion.status,precision:'native-ast-content'});
    if(row.role==='given'||row.role==='goal'){
     if(assertion.assumptions.length)fail('scenario-assumptions-role');const name=await intern(atom(assertion.claim,registry));(row.role==='given'?givens:goals).push(name);mapping.push({roleId:row.roleId,role:row.role,atom:name});
    }else{
     let before,after;if(assertion.claim.op==='implies'){if(assertion.assumptions.length)fail('scenario-nested-rule');before=premises(assertion.claim.antecedent,registry);after=atom(assertion.claim.consequent,registry);}
     else{before=assertion.assumptions.flatMap(a=>premises(a,registry));after=atom(assertion.claim,registry);}
     if(!before.length||before.length>40)fail('scenario-rule-premises');const names=[];for(const premise of before)names.push(await intern(premise));const rule={id:'rule'+rules.length,premises:[...new Set(names)],conclusion:await intern(after)};rules.push(rule);mapping.push({roleId:row.roleId,role:'rule',rule:rule.id});
    }
   }
   const first=sources[0];exported=await exportProblem({version:1,...spec,public:true,review:'author-reviewed',atoms:[...atoms.values()],givens:[...new Set(givens)],rules,goals:[...new Set(goals)]},{source:first.source});
  }catch(error){reason=typeof error?.code==='string'?error.code:'scenario-unexportable';}
  const core={version:1,profile:SCENARIO_PROFILE,scenario:spec,project:v.project,page:v.page,compiler:v.compiler,sources,mapping,
   ...(exported?{problemSha256:exported.receipt.problemSha256,contextSha256:exported.receipt.contextSha256,exportSha256:exported.receipt.exportSha256}:{}),reason};
  const snapshotSha256=await sha(core,cryptoObject),expected={version:1,scenarioId:spec.id,scenarioRevision:spec.revision,snapshotSha256,review:'author-reviewed',reviewedBy:sources.length?objects.find(o=>o.id===sources[0].objectId).reviewedBy:'Course author'};
  if(!reason)suggested.push(expected);
  const review=reviews.find(r=>r.scenarioId===spec.id);if(review){controlledFields(review,Object.keys(expected));text(review.reviewedBy);if(Object.keys(expected).some(k=>k!=='reviewedBy'&&review[k]!==expected[k]))reason='scenario-stale-review';}
  if(!reason&&mode==='reviewed'&&!review)reason='scenario-review-needed';
  const status=reason?'unavailable':mode==='reviewed'&&review?'reviewed':'inspect';
  results.push({...core,reason,snapshotSha256,status,notice:SCENARIO_NOTICE,coverage:{selectedStatements:rows.length,mappedStatements:reason?0:mapping.length,wholeProblem:!reason},...(status==='reviewed'?{reviewedBy:review.reviewedBy}: {})});
  if(status==='reviewed')exports.push(exported);
 }
 return controlledFreeze({version:1,kind:'gw-scenario-candidates',profile:SCENARIO_PROFILE,mode,results,exports,previewConfig:{mode:'reviewed',scenarios:specs,reviews:suggested}});
}
