// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Reviewed language metadata for native pages. No translation, DOM, filesystem or network.
export const LANGUAGE_PUBLICATION_VERSION=1;
export const LANGUAGE_PUBLICATION_LIMITS=Object.freeze({maxPages:32,maxSets:16,maxRealisationsPerSet:16,maxRealisations:64});
const contexts=new WeakMap();
const fail=()=>{const error=new Error('Generative Websites: invalid or stale reviewed language publication.');error.code='invalid-language-publication';throw error;};
const object=(value,allowed,required=allowed)=>{
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail();
  const descriptors=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(descriptors);
  if(keys.some(key=>typeof key!=='string'||!allowed.includes(key)||!Object.hasOwn(descriptors[key],'value'))
    ||required.some(key=>!Object.hasOwn(descriptors,key)))fail();return value;
};
const array=(value,maximum)=>{
  if(!Array.isArray(value)||value.length>maximum)fail();const descriptors=Object.getOwnPropertyDescriptors(value);
  if(Reflect.ownKeys(descriptors).length!==value.length+1)fail();
  return Array.from({length:value.length},(_,index)=>{if(!descriptors[index]||!Object.hasOwn(descriptors[index],'value'))fail();return descriptors[index].value;});
};
const text=(value,maximum=256)=>{
  if(typeof value!=='string'||!value||value.trim()!==value||value.length>maximum||/[\u0000-\u001f\u007f]/u.test(value)
    ||/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/u.test(value))fail();return value;
};
const id=value=>{value=text(value,512);if(/[\s<>"'`\\]/u.test(value))fail();return value;};
const nativeId=value=>{value=text(value,128);if(!/^[A-Za-z][A-Za-z0-9._:-]*$/u.test(value))fail();return value;};
const digest=value=>{if(typeof value!=='string'||!/^(?:sha1:[a-f0-9]{40}|sha256:[a-f0-9]{64})$/u.test(value))fail();return value;};
const language=value=>{
  value=text(value,64);try{if(Intl.getCanonicalLocales(value).length!==1)fail();}catch{fail();}return value;
};
const canonicalLanguage=value=>Intl.getCanonicalLocales(value)[0];
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const rootURL=(value,optional=false)=>{
  if(value===undefined&&optional)return null;
  value=text(value??'https://quarto.invalid/',2048);let url;
  try{url=new URL(value);}catch{fail();}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)fail();
  if(!url.pathname.endsWith('/'))url.pathname+='/';return url;
};
const path=(value,root)=>{
  value=text(value,2048);
  if(value.startsWith('/')||/[\\%?#:\s<>"|*]/u.test(value)||!value.endsWith('.html')||value.split('/').some(part=>!part||part==='.'||part==='..'))fail();
  let url;try{url=new URL(value,root);}catch{fail();}if(url.origin!==root.origin||!url.pathname.startsWith(root.pathname))fail();return value;
};
const reference=value=>{
  object(value,['pageId','revision','sourceDigest']);return {pageId:nativeId(value.pageId),revision:text(value.revision,128),sourceDigest:digest(value.sourceDigest)};
};
const assertion=value=>{
  object(value,['id','revision','irDigest']);if(typeof value.irDigest!=='string'||!/^sha256:[a-f0-9]{64}$/u.test(value.irDigest))fail();
  return {id:id(value.id),revision:text(value.revision,128),irDigest:value.irDigest};
};
const sameReference=(left,right)=>left.pageId===right.pageId&&left.revision===right.revision&&left.sourceDigest===right.sourceDigest;
const sameAssertion=(left,right)=>left.id===right.id&&left.revision===right.revision&&left.irDigest===right.irDigest;
const project=value=>{object(value,['id','revision']);return {id:nativeId(value.id),revision:text(value.revision,128)};};
const pageRecord=(value,root)=>{
  object(value,['id','url','revision','language','sourceDigest'],['id','url','revision']);
  const result={id:nativeId(value.id),url:path(value.url,root),revision:text(value.revision,128)};
  if(Object.hasOwn(value,'language'))result.language=language(value.language);
  if(Object.hasOwn(value,'sourceDigest'))result.sourceDigest=digest(value.sourceDigest);
  return result;
};

/** Validate declared language sets against a bounded selected native-output map.
 * `currentPage` is an optional actual native observation. Other mappings remain
 * declarations until their rendered outputs are independently checked. */
export function validateLanguagePublication(input,options={}){
  object(options,['pages','project','currentPage','baseURL','siteURL'],['pages','project']);
  const root=rootURL(options.baseURL),canonicalRoot=rootURL(options.siteURL,true),expectedProject=project(options.project);
  object(input,['version','project','sets']);if(input.version!==LANGUAGE_PUBLICATION_VERSION)fail();
  const declaredProject=project(input.project);if(declaredProject.id!==expectedProject.id||declaredProject.revision!==expectedProject.revision)fail();
  const pages=new Map(),urls=new Set();
  for(const raw of array(options.pages,LANGUAGE_PUBLICATION_LIMITS.maxPages)){
    const page=pageRecord(raw,root);if(pages.has(page.id)||urls.has(page.url))fail();pages.set(page.id,page);urls.add(page.url);
  }
  if(!pages.size)fail();let current=null;
  if(options.currentPage!==undefined){
    current=pageRecord(options.currentPage,root);if(current.language===undefined||current.sourceDigest===undefined)fail();const declared=pages.get(current.id);
    if(!declared||declared.url!==current.url||declared.revision!==current.revision
      ||declared.language!==undefined&&canonicalLanguage(declared.language)!==canonicalLanguage(current.language)
      ||declared.sourceDigest!==undefined&&declared.sourceDigest!==current.sourceDigest)fail();
    pages.set(current.id,current);
  }
  const usedPages=new Set(),setIds=new Set();let realisationCount=0;
  const sets=array(input.sets,LANGUAGE_PUBLICATION_LIMITS.maxSets).map(value=>{
    object(value,['id','context','source','assertion','realisations'],['id','context','source','realisations']);
    const name=nativeId(value.id),context=id(value.context),source=reference(value.source),expectedSource=pages.get(source.pageId);
    if(setIds.has(name)||!expectedSource||expectedSource.revision!==source.revision
      ||expectedSource.sourceDigest!==undefined&&expectedSource.sourceDigest!==source.sourceDigest)fail();setIds.add(name);
    const typed=value.assertion===undefined?undefined:assertion(value.assertion),languages=new Set();
    const raw=array(value.realisations,LANGUAGE_PUBLICATION_LIMITS.maxRealisationsPerSet);if(raw.length<2)fail();
    const realisations=raw.map(item=>{
      if(++realisationCount>LANGUAGE_PUBLICATION_LIMITS.maxRealisations)fail();
      object(item,['pageId','url','revision','language','sourceDigest','context','basedOn','assertion','review','reviewedBy'],
        ['pageId','url','revision','language','sourceDigest','context','basedOn','review','reviewedBy']);
      const result={pageId:nativeId(item.pageId),url:path(item.url,root),revision:text(item.revision,128),language:language(item.language),
        sourceDigest:digest(item.sourceDigest),context:id(item.context),basedOn:reference(item.basedOn),review:item.review,reviewedBy:text(item.reviewedBy)};
      const expected=pages.get(result.pageId),lang=canonicalLanguage(result.language).toLowerCase();
      if(!expected||expected.url!==result.url||expected.revision!==result.revision||expected.language===undefined
        ||canonicalLanguage(expected.language).toLowerCase()!==lang||expected.sourceDigest!==undefined&&expected.sourceDigest!==result.sourceDigest
        ||usedPages.has(result.pageId)||languages.has(lang)||result.review!=='author-reviewed'||result.context!==context||!sameReference(result.basedOn,source))fail();
      if(typed!==undefined){const declared=assertion(item.assertion);if(!sameAssertion(declared,typed))fail();result.assertion=declared;}
      else if(item.assertion!==undefined)fail();
      usedPages.add(result.pageId);languages.add(lang);return result;
    });
    const original=realisations.find(item=>item.pageId===source.pageId);
    if(!original||original.revision!==source.revision||original.sourceDigest!==source.sourceDigest)fail();
    return {id:name,context,source,...(typed===undefined?{}:{assertion:typed}),realisations};
  });
  const result=freeze({version:LANGUAGE_PUBLICATION_VERSION,project:declaredProject,sets});
  contexts.set(result,{root:root.href,canonicalRoot:canonicalRoot?.href??null,currentPageId:current?.id??null});return result;
}

const relativeURL=(from,to)=>{
  const directory=from.split('/').slice(0,-1),target=to.split('/');let common=0;
  while(common<directory.length&&common<target.length&&directory[common]===target[common])common++;
  return '../'.repeat(directory.length-common)+target.slice(common).join('/');
};

/** Generate one complete self/reciprocal set. Metadata agreement is not proof of translation. */
export function planLanguageLinks(publication,currentPageId){
  const ctx=contexts.get(publication);if(!ctx)fail();currentPageId=nativeId(currentPageId);
  const set=publication.sets.find(value=>value.realisations.some(item=>item.pageId===currentPageId));
  if(!set)return freeze({version:1,status:'unlisted',currentPageId,canonical:null,alternates:[],translationFidelity:'not-established'});
  const current=set.realisations.find(value=>value.pageId===currentPageId);
  const href=target=>ctx.canonicalRoot?new URL(target.url,ctx.canonicalRoot).href:relativeURL(current.url,target.url);
  return freeze({version:1,status:'declared-reviewed-language-set',currentPageId,setId:set.id,context:set.context,language:canonicalLanguage(current.language),
    source:set.source,...(set.assertion===undefined?{}:{assertion:set.assertion}),canonical:{href:href(current),absolute:ctx.canonicalRoot!==null},
    alternates:set.realisations.map(value=>({pageId:value.pageId,language:canonicalLanguage(value.language),href:href(value),self:value.pageId===currentPageId,
      revision:value.revision,sourceDigest:value.sourceDigest})),
    seoStatus:ctx.canonicalRoot?'declared-absolute-urls':'relative-only',reviewStatus:'author-reviewed-declaration',
    semanticEvidence:set.assertion?'matching-declared-typed-ir':'author-reviewed-declaration',translationFidelity:'not-established',
    mappingScope:'selected-native-output-declarations',actualCurrentPageBound:ctx.currentPageId===currentPageId});
}
