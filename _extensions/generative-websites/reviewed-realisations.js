// Copyright 2026 Kai Prince; SPDX-License-Identifier: Apache-2.0
// Developer draft: finite reviewed English/French renderings of declared IR.
import {validateAssertionRegistry,canonicalAssertion,ASSERTION_STATUSES,ASSERTION_MODALITIES} from './assertions.js';
import {controlledData,controlledFields,controlledFreeze,controlledCanonical,controlledDigest,controlledFail} from './controlled-authoring.js';

export const REALISATION_PROFILE='gw-reviewed-ir-en-fr-v1';
export const REALISATION_LIMITS=Object.freeze({lexiconCharacters:65536,label:160,template:1000,output:65536});
export const REALISATION_QUALIFICATION='Deterministic wording from a finite grammar and an author-reviewed lexicon tied to identical declared IR. This is not automatic translation of ordinary prose, proof of lexical meaning or independent verification of translation fidelity.';
const fail=code=>controlledFail(code);
const text=(value,max)=>{if(typeof value!=='string'||!value||value.trim()!==value||value.length>max||/[\u0000-\u001f\u007f<>]/u.test(value))fail('realisation-text');return value;};
const digest=value=>{if(typeof value!=='string'||!/^(?:sha1:[a-f0-9]{40}|sha256:[a-f0-9]{64})$/u.test(value))fail('realisation-source');return value;};
const registryFor=input=>validateAssertionRegistry(controlledData(input));
function entries(value,maximum){if(!Array.isArray(value)||value.length>maximum)fail('realisation-lexicon');return value;}
function template(value,arity){
 text(value,REALISATION_LIMITS.template);let rest=value;for(let i=0;i<arity;i++){const slot='{'+i+'}';if(rest.split(slot).length!==2)fail('realisation-template');rest=rest.replace(slot,'');}if(/[{}]/u.test(rest))fail('realisation-template');return value;
}
/** Review is an explicit author declaration. The validator checks finite syntax
 * and exact signature/role coverage, not whether lexical meaning is correct. */
export function validateReviewedLexicon(input,registryInput){
 const value=controlledData(input),registry=registryFor(registryInput);controlledFields(value,['version','id','revision','language','review','reviewedBy','sorts','constants','functions','predicates']);
 if(value.version!==1||!['en','fr'].includes(value.language)||value.review!=='author-reviewed')fail('realisation-review');text(value.id,256);text(value.revision,128);text(value.reviewedBy,256);
 if(controlledCanonical(value).length>REALISATION_LIMITS.lexiconCharacters)fail('realisation-budget');
 const groups={sorts:registry.sorts.map(id=>({id})),constants:registry.constants,functions:registry.functions,predicates:registry.predicates};
 for(const [category,declared]of Object.entries(groups)){
  const ids=new Map(declared.map(item=>[item.id,item])),seen=new Set();
  for(const entry of entries(value[category],category==='sorts'?64:128)){
   const sort=category==='sorts',constant=category==='constants';controlledFields(entry,sort?['id','singular',value.language==='en'?'article':'gender']:constant?['id','label']:['id','template']);if(!ids.has(entry.id)||seen.has(entry.id))fail('realisation-undeclared-sense');seen.add(entry.id);
   if(sort){text(entry.singular,REALISATION_LIMITS.label);if(value.language==='en'?!['a','an'].includes(entry.article):!['masculine','feminine'].includes(entry.gender))fail('realisation-agreement');}
   else if(constant)text(entry.label,REALISATION_LIMITS.label);
   else template(entry.template,ids.get(entry.id).args.length);
  }
 }
 return controlledFreeze(value);
}
async function identities(registry,assertionId,lexicon,sourceDigest,cryptoObject){
 const assertion=registry.assertions.find(item=>item.id===assertionId);if(!assertion)fail('realisation-assertion');
 return {version:1,assertionId:assertion.id,assertionRevision:assertion.revision,irSha256:await controlledDigest(canonicalAssertion(assertion),cryptoObject),sourceDigest:digest(sourceDigest),lexiconId:lexicon.id,lexiconRevision:lexicon.revision,lexiconSha256:await controlledDigest(controlledCanonical(lexicon),cryptoObject)};
}
/** Produces inspectable review pins only, never an approval. Native integration
 * must supply its actual current projection digest, not infer file truth here. */
export async function reviewedRealisationIdentity(input,{cryptoObject=globalThis.crypto}={}){
 const value=controlledData(input);controlledFields(value,['registry','assertionId','lexicon','sourceDigest']);const registry=registryFor(value.registry),lexicon=validateReviewedLexicon(value.lexicon,registry);
 return controlledFreeze(await identities(registry,value.assertionId,lexicon,value.sourceDigest,cryptoObject));
}
function render(assertion,lexicon){
 const maps=Object.fromEntries(['sorts','constants','functions','predicates'].map(category=>[category,new Map(lexicon[category].map(entry=>[entry.id,entry]))])),fr=lexicon.language==='fr';
 const lookup=(category,id)=>{const entry=maps[category].get(id);if(!entry)fail('realisation-missing-lexicon');return entry;};
 const expand=(raw,args)=>raw.replace(/\{([0-9]+)\}/gu,(_match,index)=>args[Number(index)]);
 function term(value){
  if(Object.hasOwn(value,'var'))return value.var;
  if(Object.hasOwn(value,'constant'))return lookup('constants',value.constant).label;
  return expand(lookup('functions',value.apply).template,value.args.map(term));
 }
 function formula(value){
  if(value.op==='predicate')return expand(lookup('predicates',value.id).template,value.args.map(term));
  if(value.op==='eq')return `(${term(value.left)}) ${fr?'est égal à':'equals'} (${term(value.right)})`;
  if(value.op==='and'||value.op==='or')return value.items.map(item=>'('+formula(item)+')').join(value.op==='and'?(fr?' et ':' and '):(fr?' ou ':' or '));
  if(value.op==='not')return (fr?'il n’est pas vrai que ':'it is not the case that ')+'('+formula(value.body)+')';
  if(value.op==='implies')return (fr?'si ':'if ')+'('+formula(value.antecedent)+')'+(fr?', alors ':' then ')+'('+formula(value.consequent)+')';
  if(value.op==='modal')return (fr?(value.mode==='possible'?'il est possible que ':'il est nécessaire que '):(value.mode==='possible'?'it is possible that ':'it is necessary that '))+'('+formula(value.body)+')';
  const sort=lookup('sorts',value.sort),body='('+formula(value.body)+')';
  if(value.op==='forall')return fr?`pour ${sort.gender==='feminine'?'toute':'tout'} ${sort.singular} ${value.variable}, ${body}`:`for every ${sort.singular} ${value.variable}, ${body}`;
  if(value.op==='exists')return fr?`il existe ${sort.gender==='feminine'?'une':'un'} ${sort.singular} ${value.variable} ${sort.gender==='feminine'?'telle':'tel'} que ${body}`:`there exists ${sort.article} ${sort.singular} ${value.variable} such that ${body}`;
  fail('realisation-unsupported-ir');
 }
 const statuses=fr?['affirmation','définition','conjecture','hypothèse','observation','autodéclaration','prouvé (statut déclaré par l’auteur)']:['claim','definition','conjecture','hypothesis','observation','self-reported','proved (author-declared status)'];
 const modalities=fr?['asserté','possible','nécessaire']:['asserted','possible','necessary'];
 const assumptions=assertion.assumptions.map(formula),claim=formula(assertion.claim),context=assertion.context,domain=assertion.domain,status=statuses[ASSERTION_STATUSES.indexOf(assertion.status)],modality=modalities[ASSERTION_MODALITIES.indexOf(assertion.modality)];
 const header=fr?`Contexte : ${context}\nDomaine : ${domain}\nStatut : ${status}\nModalité : ${modality}`:`Context: ${context}\nDomain: ${domain}\nStatus: ${status}\nModality: ${modality}`;
 const output=header+'\n'+(fr?'Hypothèses ordonnées :':'Ordered assumptions:')+(assumptions.length?'\n'+assumptions.map((item,i)=>`${i+1}. ${item}`).join('\n'):(fr?' aucune déclarée':' none declared'))+'\n'+(fr?'Énoncé : ':'Claim: ')+claim;
 if(output.length>REALISATION_LIMITS.output)fail('realisation-budget');return {text:output,context,domain,status,modality,assumptions,claim};
}
/** All source/IR/lexicon/revision pins are checked before any wording is returned.
 * Fixed operator grammar cannot silently drop a quantifier or ordered premise. */
export async function realiseReviewedAssertion(input,{cryptoObject=globalThis.crypto}={}){
 const value=controlledData(input);controlledFields(value,['id','revision','registry','assertionId','lexicon','sourceDigest','binding']);text(value.id,256);text(value.revision,128);
 const registry=registryFor(value.registry),lexicon=validateReviewedLexicon(value.lexicon,registry),identity=await identities(registry,value.assertionId,lexicon,value.sourceDigest,cryptoObject),binding=value.binding;
 controlledFields(binding,[...Object.keys(identity),'review','reviewedBy']);if(binding.review!=='author-reviewed')fail('realisation-review');text(binding.reviewedBy,256);
 for(const [key,expected]of Object.entries(identity))if(binding[key]!==expected)fail('realisation-stale-binding');
 const assertion=registry.assertions.find(item=>item.id===value.assertionId),wording=render(assertion,lexicon),packet={version:1,kind:'reviewed-controlled-realisation',profile:REALISATION_PROFILE,id:value.id,revision:value.revision,language:lexicon.language,...identity,...wording,review:{status:'author-reviewed',reviewedBy:binding.reviewedBy,lexiconReviewedBy:lexicon.reviewedBy},sourceBinding:'caller-supplied-digest-not-execution-attestation',qualification:REALISATION_QUALIFICATION};
 return controlledFreeze({...packet,realisationSha256:await controlledDigest(controlledCanonical(packet),cryptoObject)});
}
/** Native authored content remains the explicit fallback. No candidate wording
 * or guessed language is returned when the finite contract is unavailable. */
export async function tryRealiseReviewedAssertion(input,options={}){
 try{return controlledFreeze({status:'available',realisation:await realiseReviewedAssertion(input,options)});}
 catch(error){const reason=typeof error?.code==='string'&&/^(?:realisation-|controlled-|invalid-assertion-)/u.test(error.code)?error.code:'realisation-unavailable';return Object.freeze({status:'unavailable',fallback:'native-authored',reason});}
}
