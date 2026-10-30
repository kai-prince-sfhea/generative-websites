// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Finite reviewed native variants. This module performs no DOM, network or model work.
export const ADAPTATION_VERSION = 1;
export const ADAPTATION_AXES = Object.freeze(['exposition','terminology','scaffolding','prerequisite-knowledge','reading-complexity','context-interest','representation','challenge']);
export const ADAPTATION_LIMITS = Object.freeze({maxObjects:50,maxGroupsPerObject:32,
  maxGroups:128,maxVariantsPerGroup:16,maxVariants:512});
const failure = code => {const error=new Error(code==='invalid-adaptation-preferences'
  ? 'Generative Websites: invalid adaptation preferences.'
  : 'Generative Websites: invalid reviewed adaptation page.');error.code=code;throw error;};
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
  const ids=new Set(),anchors=new Set();let groupCount=0,variantCount=0;
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
      const defaultValue=token(group.defaultValue),seen=new Set(),raw=array(group.variants,limits.maxVariantsPerGroup);
      if(!raw.length)failure(PAGE);
      const variants=raw.map(variant=>{
        if(++variantCount>limits.maxVariants)failure(PAGE);
        object(variant,['value','anchor','revision','sourceDigest','review','reviewedBy'],['value','anchor','revision','sourceDigest','review','reviewedBy']);
        const selected=token(variant.value),destination=anchor(variant.anchor);
        if(seen.has(selected)||anchors.has(destination)||variant.review!=='author-reviewed')failure(PAGE);
        seen.add(selected);anchors.add(destination);
        return {value:selected,anchor:destination,revision:text(variant.revision,128),sourceDigest:digest(variant.sourceDigest),
          review:'author-reviewed',reviewedBy:text(variant.reviewedBy)};
      });
      if(!seen.has(defaultValue))failure(PAGE);
      return {id,axis:group.axis,defaultValue,variants};
    });
    return result;
  });
  return freeze({version:ADAPTATION_VERSION,kind:'generative-adaptation-page',page,objects});
}

/** Independent reader choices select existing anchors; no string or AST replacement. */
export function resolveAdaptation(page,preferences={}) {
  page=validateAdaptationPage(page);
  object(preferences,[...ADAPTATION_AXES,'level'],[],PREF);
  const requested={};
  for(const axis of ADAPTATION_AXES)if(Object.hasOwn(preferences,axis))requested[axis]=token(preferences[axis],PREF);
  if(Object.hasOwn(preferences,'level')){
    const level=token(preferences.level,PREF);
    if(requested.exposition!==undefined&&requested.exposition!==level)failure(PREF);
    requested.exposition=level;
  }
  const unsupportedPreferences=[],axes=new Set();
  const objects=page.objects.map(value=>({id:value.id,groups:value.groups.map(group=>{
    axes.add(group.axis);const choice=requested[group.axis],selected=group.variants.find(item=>item.value===choice);
    const variant=selected??group.variants.find(item=>item.value===group.defaultValue);
    if(choice!==undefined&&!selected)unsupportedPreferences.push({objectId:value.id,groupId:group.id,axis:group.axis,value:choice,reason:'unsupported-value'});
    return {id:group.id,axis:group.axis,selectedValue:variant.value,anchor:variant.anchor,
      reason:selected?'reader-preference':choice===undefined?'author-default':'unsupported-preference'};
  })}));
  for(const axis of ADAPTATION_AXES)if(requested[axis]!==undefined&&!axes.has(axis))unsupportedPreferences.push({axis,value:requested[axis],reason:'axis-unavailable'});
  return freeze({version:1,pageId:page.page.id,sourceDigest:page.page.sourceDigest,objects,unsupportedPreferences});
}
