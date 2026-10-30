// Copyright 2026 Kai Prince; SPDX-License-Identifier: Apache-2.0
// Private native-glue draft. Actual source objects are supplied by native Lua.
import {compileControlledAssertions,controlledData,controlledFields,controlledFreeze,controlledFail} from './controlled-authoring.js';
import {reviewedRealisationIdentity,tryRealiseReviewedAssertion} from './reviewed-realisations.js';
const fail=code=>controlledFail(code);
const array=(v,n)=>{if(!Array.isArray(v)||v.length>n)fail('controlled-native-fields');return v;};
const normalizedRegistry=value=>{const v={version:1,sorts:[],constants:[],functions:[],predicates:[],assertions:[],bindings:[],...(value??{})};if(v.version==='1')v.version=1;return v;};
const reviewKeys=['objectId','objectRevision','assertionId','assertionRevision','sourceDigest','sourceSha256','irSha256','review','reviewedBy'];
const legacyKeys=['objectId','objectRevision','assertionId','assertionRevision','sourceDigest','review','reviewedBy'];
/** Produces existing assertion bindings rather than a second semantic authority.
 * Inspect mode publishes no newly compiled assertion as an accepted binding. */
export async function prepareControlledNative(input,{cryptoObject=globalThis.crypto}={}){
 const value=controlledData(input);controlledFields(value,['options','objects','controlled','realisations']);const cfg=value.options['controlled-authoring']??{};
 controlledFields(cfg,[],['mode','language','aliases','reviews','lexicons','realisations']);const mode=cfg.mode??'inspect',language=cfg.language??'en';if(!['inspect','reviewed'].includes(mode)||language!=='en')fail('controlled-native-mode');
 const controls=array(value.controlled,32),panels=array(value.realisations,32),objects=new Map(value.objects.map(object=>[object.id,object]));
 if(new Set(controls.map(row=>row.objectId)).size!==controls.length||new Set(panels.map(row=>row.id)).size!==panels.length)fail('controlled-native-duplicate');
 const controlIDs=new Set(controls.map(row=>row.objectId)),baseRegistry=normalizedRegistry(value.options.assertions),baseOptions={...value.options},plainObjects=value.objects.map(object=>{if(!controlIDs.has(object.id))return object;const copy={...object};delete copy.assertionId;return copy;});
 if(!controls.length&&!panels.length)return controlledFreeze({options:baseOptions,objects:value.objects,inspection:null,realisations:[],previewConfig:null,compilation:null});
 const originalRegistry=normalizedRegistry(value.options.assertions),records=controls.map(row=>{
  controlledFields(row,['objectId','assertionId','assertionRevision','context','domain','modality','status','assumptions','claim'],['unsupported']);const owner=objects.get(row.objectId);if(!owner||owner.assertionId!==row.assertionId||owner.context!==row.context)fail('controlled-native-source');
  return{id:row.assertionId,revision:row.assertionRevision,context:row.context,domain:row.domain,modality:row.modality,status:row.status,assumptions:row.assumptions,claim:row.claim};
 });
 const legacyAssertions=new Set(baseRegistry.assertions.map(assertion=>assertion.id));if(records.some(record=>legacyAssertions.has(record.id)))fail('controlled-native-duplicate');
 let compilation=null,unavailable=null;
 try{
  if(controls.some(row=>row.unsupported))fail('controlled-native-unsupported-content');
  if(controls.length)compilation=await compileControlledAssertions({version:1,language,registry:{...baseRegistry,bindings:baseRegistry.bindings.filter(binding=>!controlIDs.has(binding.objectId))},aliases:cfg.aliases??{},assertions:records},{cryptoObject});
 }catch(error){if(mode==='reviewed')fail('controlled-native-required-binding');unavailable=typeof error?.code==='string'?error.code:'controlled-native-unavailable';}
 const sources=new Map((compilation?.sources??[]).map(source=>[source.assertionId,source])),currentReviews=[];
 for(const row of controls){const owner=objects.get(row.objectId),source=sources.get(row.assertionId);if(source)currentReviews.push({objectId:owner.id,objectRevision:owner.revision,assertionId:row.assertionId,assertionRevision:row.assertionRevision,sourceDigest:owner.sourceDigest,sourceSha256:source.sourceSha256,irSha256:source.irSha256,review:'author-reviewed',reviewedBy:owner.reviewedBy});}
 const reviews=array(cfg.reviews??[],32);for(const review of reviews)controlledFields(review,reviewKeys);if(new Set(reviews.map(review=>review.objectId)).size!==reviews.length)fail('controlled-native-duplicate');
 let acceptedRegistry=originalRegistry,acceptedObjects=plainObjects;
 if(mode==='reviewed'){
  if(!compilation&&controls.length)fail('controlled-native-required-binding');
  if(baseRegistry.bindings.some(binding=>controlIDs.has(binding.objectId)))fail('controlled-native-binding-location');
  for(const expected of currentReviews){const actual=reviews.find(review=>review.objectId===expected.objectId);if(!actual||reviewKeys.some(key=>key==='reviewedBy'?typeof actual[key]!=='string'||!actual[key].trim():actual[key]!==expected[key]))fail('controlled-native-required-binding');}
  if(reviews.some(review=>!controlIDs.has(review.objectId)))fail('controlled-native-source');
  acceptedRegistry=compilation?{...compilation.registry,bindings:[...baseRegistry.bindings,...reviews.map(review=>Object.fromEntries(legacyKeys.map(key=>[key,review[key]])))]}:baseRegistry;acceptedObjects=value.objects;
 }else acceptedRegistry={...originalRegistry,bindings:originalRegistry.bindings.filter(binding=>!controlIDs.has(binding.objectId))};
 if(value.options.assertions!==undefined||mode==='reviewed'&&controls.length)baseOptions.assertions=acceptedRegistry;
 else delete baseOptions.assertions;
 const inspection={version:1,status:mode==='inspect'?'inspect':'reviewed',reason:unavailable,records:compilation?compilation.registry.assertions.filter(assertion=>sources.has(assertion.id)):[],sources:compilation?.sources??[],notice:mode==='inspect'?'Controlled text is an inspectable candidate. No newly compiled assertion binding has been accepted. Review the source and typed structure before using the current YAML pins.':'Controlled statements use exact reviewed source/IR pins and the existing native assertion binding checks. This is not mathematical proof.'};
 const lexicons=array(cfg.lexicons??[],32).map(lexicon=>({...lexicon,version:lexicon.version==='1'?1:lexicon.version}));if(new Set(lexicons.map(lexicon=>lexicon.id)).size!==lexicons.length)fail('controlled-native-duplicate');
 const realisationReviews=array(cfg.realisations??[],32);for(const entry of realisationReviews)controlledFields(entry,['id','binding']);if(new Set(realisationReviews.map(entry=>entry.id)).size!==realisationReviews.length)fail('controlled-native-duplicate');
 const outputs=[],currentRealisations=[];
 for(const panel of panels){
  controlledFields(panel,['id','revision','source','lexicon','required']);if(typeof panel.required!=='boolean')fail('controlled-native-fields');const owner=objects.get(panel.source),lexicon=lexicons.find(lexicon=>lexicon.id===panel.lexicon),row=controls.find(row=>row.objectId===panel.source),registry=compilation?.registry??baseRegistry;
  if(!owner||!row||!lexicon||!compilation){if(panel.required&&mode==='reviewed')fail('controlled-native-required-realisation');outputs.push({id:panel.id,status:'unavailable',reason:'controlled-native-realisation-source',notice:'Authored fallback retained: no compatible current controlled source or reviewed lexicon is available.'});continue;}
  let identity;
  try{identity=await reviewedRealisationIdentity({registry,assertionId:row.assertionId,lexicon,sourceDigest:owner.sourceDigest},{cryptoObject});}
  catch{if(panel.required&&mode==='reviewed')fail('controlled-native-required-realisation');outputs.push({id:panel.id,status:'unavailable',reason:'controlled-native-lexicon',notice:'Authored fallback retained: the finite reviewed lexicon is unavailable.'});continue;}
  const suggested={...identity,review:'author-reviewed',reviewedBy:owner.reviewedBy};currentRealisations.push({id:panel.id,binding:suggested});const supplied=realisationReviews.find(entry=>entry.id===panel.id)?.binding;
  if(mode==='inspect'||!supplied){if(panel.required&&mode==='reviewed')fail('controlled-native-required-realisation');outputs.push({id:panel.id,status:'unavailable',reason:'controlled-native-review-needed',notice:'Authored fallback retained: inspect and review the exact source/IR/lexicon YAML pins first.'});continue;}
  const binding={...supplied,version:supplied.version==='1'?1:supplied.version},result=await tryRealiseReviewedAssertion({id:panel.id,revision:panel.revision,registry,assertionId:row.assertionId,lexicon,sourceDigest:owner.sourceDigest,binding},{cryptoObject});
  if(result.status==='unavailable'){if(panel.required)fail('controlled-native-required-realisation');outputs.push({id:panel.id,...result,notice:'Authored fallback retained: the reviewed source, IR or finite lexicon binding is stale or unsupported.'});}
  else outputs.push({id:panel.id,status:'available',realisation:result.realisation,notice:result.realisation.qualification});
 }
 if(realisationReviews.some(entry=>!panels.some(panel=>panel.id===entry.id)))fail('controlled-native-source');
 return controlledFreeze({options:baseOptions,objects:acceptedObjects,inspection,realisations:outputs,previewConfig:{...cfg,mode:'reviewed',language,reviews:currentReviews,lexicons,realisations:currentRealisations},compilation});
}
