// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Finite reviewed native variants. This module performs no DOM, network or model work.
export const ADAPTATION_VERSION = 1;
export const ADAPTATION_AXES = Object.freeze(['exposition','terminology','scaffolding','prerequisite-knowledge','reading-complexity','context-interest','representation','challenge']);
export const EXPERTISE_LEVELS = Object.freeze(['introduction','introductory','intermediate','advanced']);
export const ADAPTATION_LIMITS = Object.freeze({maxObjects:50,maxGroupsPerObject:32,
  maxGroups:128,maxVariantsPerGroup:16,maxVariants:512});
const failure = (code,detail='') => {
  const message=code==='invalid-adaptation-preferences'?'Invalid adaptation preferences.':'Invalid adaptation page.';
  const error=new Error(`Generative Websites: ${message}${detail?' '+detail:''}`);
  error.code=code;throw error;
};
const PAGE='invalid-adaptation-page',PREF='invalid-adaptation-preferences';
const object = (value,allowed,required,code=PAGE) => {
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))failure(code);
  const descriptors=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(descriptors);
  if(keys.some(key=>typeof key!=='string'||!allowed.includes(key)||!Object.hasOwn(descriptors[key],'value'))
    ||required.some(key=>!Object.hasOwn(descriptors,key)))failure(code);
  return value;
};
const array = (value,maximum,code=PAGE) => {
  if(!Array.isArray(value)||value.length>maximum)failure(code);
  const descriptors=Object.getOwnPropertyDescriptors(value);
  if(Reflect.ownKeys(descriptors).length!==value.length+1)failure(code);
  return Array.from({length:value.length},(_,index)=>{
    if(!descriptors[index]||!Object.hasOwn(descriptors[index],'value'))failure(code);
    return descriptors[index].value;
  });
};
const text = (value,maximum=256,code=PAGE) => {
  if(typeof value!=='string'||!value||value.trim()!==value||value.length>maximum
    ||/[\u0000-\u001f\u007f]/u.test(value)||/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/u.test(value))failure(code);
  return value;
};
const anchor = value => {
  value=text(value);if(!/^[A-Za-z][A-Za-z0-9._:-]{0,255}$/u.test(value))failure(PAGE);return value;
};
const token = (value,code=PAGE) => {
  value=text(value,64,code);if(!/^[a-z][a-z0-9-]{0,63}$/u.test(value))failure(code);return value;
};
const subjectPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const maximumSubjects = 32;

export function subjectExpertise(value) {
  if(typeof value!=='string')return null;
  const separator=value.lastIndexOf('-');
  if(separator<1)return null;
  const subject=value.slice(0,separator),level=value.slice(separator+1);
  return subjectPattern.test(subject)&&EXPERTISE_LEVELS.includes(level)?{subject,level}:null;
}

function subjectChoices(axis,value) {
  if(axis!=='exposition') return [];
  return (Array.isArray(value)?value:[value]).map(subjectExpertise).filter(Boolean);
}

function variantValue(value,axis) {
  if(!Array.isArray(value)) return token(value);
  const values=array(value,8).map(item=>token(item));
  const choices=subjectChoices(axis,values);
  if(!values.length||choices.length!==values.length||new Set(choices.map(item=>item.subject)).size!==choices.length)failure(PAGE);
  return values;
}

function variantKey(axis,value) {
  const choices=subjectChoices(axis,value);
  return choices.length ? choices.map(({subject,level})=>`${subject}:${level}`).sort().join(',') : value;
}
const identity = value => {
  value=text(value,512);if(/[\s<>"'`]/u.test(value))failure(PAGE);return value;
};
const digest = value => {
  if(typeof value!=='string'||!/^(?:sha1:[a-f0-9]{40}|sha256:[a-f0-9]{64})$/u.test(value))failure(PAGE);return value;
};
const language = value => {
  value=text(value,64);
  try{if(Intl.getCanonicalLocales(value).length!==1)failure(PAGE);}catch{failure(PAGE);}
  return value;
};
const freeze = value => {
  if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;
};
const limitsFor = value => {
  if(value===undefined)return {...ADAPTATION_LIMITS};
  object(value,Object.keys(ADAPTATION_LIMITS),[]);const result={...ADAPTATION_LIMITS};
  for(const [key,limit]of Object.entries(value)){
    if(!Number.isSafeInteger(limit)||limit<1||limit>ADAPTATION_LIMITS[key])failure(PAGE);result[key]=limit;
  }return result;
};
const pageURL = (value,baseURL) => {
  value=text(value,2048);
  // URLs are actual project-root-relative HTML destinations, not guessed QMD names.
  if(value.startsWith('/')||/[\\%?#:<>"|*]/u.test(value)||!value.endsWith('.html')
    ||value.split('/').some(part=>!part||part==='.'||part==='..'))failure(PAGE);
  let base,url;
  try{base=new URL(baseURL??'https://quarto.invalid/');url=new URL(value,base);}catch{failure(PAGE);}
  if(!['http:','https:'].includes(base.protocol)||base.username||base.password||base.search||base.hash||!base.pathname.endsWith('/')
    ||url.origin!==base.origin||!url.pathname.startsWith(base.pathname))failure(PAGE);
  return value;
};

/** Validate data only; retain the real project-relative URL and original language tag. */
export function validateAdaptationPage(input,options={}) {
  object(options,['baseURL','limits'],[]);const limits=limitsFor(options.limits);
  object(input,['version','kind','page','objects'],['version','kind','page','objects']);
  if(input.version!==ADAPTATION_VERSION||input.kind!=='generative-adaptation-page')failure(PAGE);
  object(input.page,['id','url','language','sourceDigest'],['id','url','language','sourceDigest']);
  const page={id:anchor(input.page.id),url:pageURL(input.page.url,options.baseURL),language:language(input.page.language),sourceDigest:digest(input.page.sourceDigest)};
  // The logical page ID is not a native DOM anchor. It can legitimately equal
  // an object ID (for example groups.qmd containing #groups).
  const ids=new Set(),anchors=new Set(),subjects=new Set();let groupCount=0,variantCount=0;
  const values=array(input.objects,limits.maxObjects);if(!values.length)failure(PAGE);
  // Reserve every object ID before admitting variants, including later objects.
  for(const value of values){
    object(value,['id','revision','sourceDigest','context','assertionId','groups'],['id','revision','sourceDigest','groups']);
    const id=anchor(value.id);if(ids.has(id))failure(PAGE);ids.add(id);anchors.add(id);
  }
  const objects=values.map(value=>{
    const result={id:value.id,revision:text(value.revision,128),sourceDigest:digest(value.sourceDigest)};
    if(Object.hasOwn(value,'context'))result.context=identity(value.context);
    if(Object.hasOwn(value,'assertionId'))result.assertionId=identity(value.assertionId);
    const groups=array(value.groups,limits.maxGroupsPerObject);if(!groups.length)failure(PAGE);
    const groupIds=new Set();
    result.groups=groups.map(group=>{
      if(++groupCount>limits.maxGroups)failure(PAGE);
      object(group,['id','axis','defaultValue','variants'],['id','axis','defaultValue','variants']);
      const id=token(group.id);if(groupIds.has(id)||!ADAPTATION_AXES.includes(group.axis))failure(PAGE);groupIds.add(id);
      const defaultValue=variantValue(group.defaultValue,group.axis),seen=new Set(),raw=array(group.variants,limits.maxVariantsPerGroup);
      if(!raw.length)failure(PAGE);
      let subjectScoped;
      const variants=raw.map(variant=>{
        if(++variantCount>limits.maxVariants)failure(PAGE);
        object(variant,['value','anchor','revision','sourceDigest','authorship','review','reviewedBy'],['value','anchor','revision','sourceDigest','review']);
        const selected=variantValue(variant.value,group.axis),destination=anchor(variant.anchor);
        const scoped=subjectChoices(group.axis,selected);
        if(subjectScoped!==undefined&&subjectScoped!==(scoped.length>0)){
          failure(PAGE,'Use separate groups for general exposition and subject expertise.');
        }
        subjectScoped=scoped.length>0;
        const key=variantKey(group.axis,selected);
        if(seen.has(key)||anchors.has(destination))failure(PAGE);
        for(const {subject} of scoped)subjects.add(subject);
        if(subjects.size>maximumSubjects)failure(PAGE);
        const origin=Object.hasOwn(variant,'authorship')?variant.authorship:undefined;
        if(Object.hasOwn(variant,'authorship')&&!['human','ai-assisted','ai-generated'].includes(origin))failure(PAGE);
        const reviewed=variant.review==='author-reviewed';
        if(!reviewed&&(variant.review!=='not-declared'||origin===undefined||Object.hasOwn(variant,'reviewedBy')))failure(PAGE);
        seen.add(key);anchors.add(destination);
        return {value:selected,anchor:destination,revision:text(variant.revision,128),sourceDigest:digest(variant.sourceDigest),
          ...(origin===undefined?{}:{authorship:origin}),review:variant.review,...(reviewed?{reviewedBy:text(variant.reviewedBy)}:{})};
      });
      if(!seen.has(variantKey(group.axis,defaultValue)))failure(PAGE);
      return {id,axis:group.axis,defaultValue,variants};
    });
    return result;
  });
  return freeze({version:ADAPTATION_VERSION,kind:'generative-adaptation-page',page,objects});
}

export function normalizeAdaptationPreferences(preferences) {
  object(preferences,[...ADAPTATION_AXES,'level','expertise'],[],PREF);
  const requested={};
  for(const axis of ADAPTATION_AXES)if(Object.hasOwn(preferences,axis))requested[axis]=token(preferences[axis],PREF);
  if(Object.hasOwn(preferences,'level')){
    const level=token(preferences.level,PREF);
    if(requested.exposition!==undefined&&requested.exposition!==level)failure(PREF);
    requested.exposition=level;
  }
  const expertise=new Map();
  function setExpertise(subject,level){
    subject=token(subject,PREF);
    if(!subjectPattern.test(subject)||!EXPERTISE_LEVELS.includes(level)||expertise.has(subject)&&expertise.get(subject)!==level)failure(PREF);
    expertise.set(subject,level);
    if(expertise.size>maximumSubjects)failure(PREF);
  }
  if(Object.hasOwn(preferences,'expertise')){
    const values=preferences.expertise;
    if(!values||typeof values!=='object'||Array.isArray(values))failure(PREF);
    const keys=Object.keys(values);
    object(values,keys,[],PREF);
    if(keys.length>maximumSubjects)failure(PREF);
    for(const key of keys)setExpertise(key,values[key]);
  }
  const scoped=subjectExpertise(requested.exposition??'');
  if(scoped){
    setExpertise(scoped.subject,scoped.level);
    delete requested.exposition;
  }
  if(expertise.size)requested.expertise=Object.fromEntries(expertise);
  return requested;
}

/** Independent reader choices select existing anchors. */
export function resolveAdaptation(page,preferences={}) {
  page=validateAdaptationPage(page);
  const requested=normalizeAdaptationPreferences(preferences),expertise=requested.expertise??{};
  const unsupportedPreferences=[],axes=new Set(),subjects=new Set();
  const objects=page.objects.map(value=>({id:value.id,groups:value.groups.map(group=>{
    const entries=group.variants.map(variant=>({variant,choices:subjectChoices(group.axis,variant.value)}));
    const groupSubjects=new Set(entries.flatMap(entry=>entry.choices.map(item=>item.subject)));
    for(const subject of groupSubjects)subjects.add(subject);
    const activeSubjects=[...groupSubjects].filter(subject=>Object.hasOwn(expertise,subject));
    const generic=entries.filter(entry=>!entry.choices.length);
    if(generic.length)axes.add(group.axis);
    const choice=generic.length?requested[group.axis]:undefined;
    const selected=activeSubjects.length
      ? entries.find(entry=>activeSubjects.every(subject=>entry.choices.some(item=>item.subject===subject&&item.level===expertise[subject])))?.variant
      : generic.find(entry=>entry.variant.value===choice)?.variant;
    const variant=selected??group.variants.find(item=>variantKey(group.axis,item.value)===variantKey(group.axis,group.defaultValue));
    if(!selected){
      for(const subject of activeSubjects)unsupportedPreferences.push({objectId:value.id,groupId:group.id,axis:group.axis,subject,value:expertise[subject],reason:activeSubjects.length>1?'unsupported-combination':'unsupported-value'});
      if(!activeSubjects.length&&choice!==undefined)unsupportedPreferences.push({objectId:value.id,groupId:group.id,axis:group.axis,value:choice,reason:'unsupported-value'});
    }
    return {id:group.id,axis:group.axis,selectedValue:variant.value,anchor:variant.anchor,
      reason:selected?'reader-preference':choice===undefined&&!activeSubjects.length?'author-default':'unsupported-preference'};
  })}));
  for(const axis of ADAPTATION_AXES)if(requested[axis]!==undefined&&!axes.has(axis))unsupportedPreferences.push({axis,value:requested[axis],reason:'axis-unavailable'});
  for(const [subject,level]of Object.entries(expertise))if(!subjects.has(subject))unsupportedPreferences.push({axis:'exposition',subject,value:level,reason:'subject-unavailable'});
  return freeze({version:1,pageId:page.page.id,sourceDigest:page.page.sourceDigest,objects,unsupportedPreferences});
}
