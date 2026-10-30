// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Generated from original sibling modules by developer-only tests/bundle.mjs. Do not edit.

const adaptation = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Finite reviewed native variants. This module performs no DOM, network or model work.
const ADAPTATION_VERSION = 1;
const ADAPTATION_AXES = Object.freeze(['exposition','terminology','scaffolding','prerequisite-knowledge','reading-complexity','context-interest','representation','challenge']);
const ADAPTATION_LIMITS = Object.freeze({maxObjects:50,maxGroupsPerObject:32,
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
function validateAdaptationPage(input,options={}) {
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
function resolveAdaptation(page,preferences={}) {
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

return {ADAPTATION_VERSION,ADAPTATION_AXES,ADAPTATION_LIMITS,validateAdaptationPage,resolveAdaptation};
})();

const assertions = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Author-declared finite typed assertions, not a proof or prose-equivalence engine.
const ASSERTION_VERSION = 1;
const ASSERTION_LIMITS = Object.freeze({maxSorts:64,maxSignatures:128,maxAssertions:64,
  maxBindings:128,maxArity:16,maxAssumptions:32,maxConnectives:32,maxDepth:32,maxNodes:4096});
const ASSERTION_STATUSES = Object.freeze(['claim','definition','conjecture','hypothesis','observation','self-reported','proved']);
const ASSERTION_MODALITIES = Object.freeze(['asserted','possible','necessary']);
const CODE='invalid-assertion-registry',canonicalRecords=new WeakMap();
const fail = (code=CODE) => {const error=new Error(code==='unvalidated-assertion'
  ? 'Generative Websites: compare only assertions returned by a validated registry.'
  : 'Generative Websites: invalid finite typed assertion registry.');error.code=code;throw error;};
const object = (value,allowed,required) => {
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail();
  const descriptors=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(descriptors);
  if(keys.some(key=>typeof key!=='string'||!allowed.includes(key)||!Object.hasOwn(descriptors[key],'value'))
    ||required.some(key=>!Object.hasOwn(descriptors,key)))fail();return value;
};
const array = (value,maximum) => {
  if(!Array.isArray(value)||value.length>maximum)fail();const descriptors=Object.getOwnPropertyDescriptors(value);
  if(Reflect.ownKeys(descriptors).length!==value.length+1)fail();
  return Array.from({length:value.length},(_,index)=>{if(!descriptors[index]||!Object.hasOwn(descriptors[index],'value'))fail();return descriptors[index].value;});
};
const text = (value,maximum=256) => {
  if(typeof value!=='string'||!value||value.trim()!==value||value.length>maximum||/[\u0000-\u001f\u007f]/u.test(value)
    ||/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/u.test(value))fail();return value;
};
const id = value => {value=text(value,512);if(/[\s<>"'`]/u.test(value))fail();return value;};
const digest = value => {if(typeof value!=='string'||!/^(?:sha1:[a-f0-9]{40}|sha256:[a-f0-9]{64})$/u.test(value))fail();return value;};
const freeze = value => {if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;};
const canonical = value => {
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
  return JSON.stringify(value);
};
const limitsFor = value => {
  if(value===undefined)return {...ASSERTION_LIMITS};object(value,Object.keys(ASSERTION_LIMITS),[]);
  const result={...ASSERTION_LIMITS};for(const [key,limit]of Object.entries(value)){
    if(!Number.isSafeInteger(limit)||limit<1||limit>ASSERTION_LIMITS[key])fail();result[key]=limit;
  }return result;
};

/** All declarations and every assertion are checked before any record is returned. */
function validateAssertionRegistry(input,options={}) {
  object(options,['limits'],[]);const limits=limitsFor(options.limits);
  const keys=['version','sorts','constants','functions','predicates','assertions','bindings'];object(input,keys,keys);
  if(input.version!==ASSERTION_VERSION)fail();
  const sorts=array(input.sorts,limits.maxSorts).map(id),sortSet=new Set(sorts);
  if(!sorts.length||sortSet.size!==sorts.length)fail();
  const sort = value => {value=id(value);if(!sortSet.has(value))fail();return value;};
  let signatures=0;
  const constantMap=new Map(),functionMap=new Map(),predicateMap=new Map();
  const constants=array(input.constants,limits.maxSignatures).map(value=>{
    if(++signatures>limits.maxSignatures)fail();object(value,['id','sort'],['id','sort']);
    const result={id:id(value.id),sort:sort(value.sort)};if(constantMap.has(result.id))fail();constantMap.set(result.id,result);return result;
  });
  const functions=array(input.functions,limits.maxSignatures).map(value=>{
    if(++signatures>limits.maxSignatures)fail();object(value,['id','args','returns'],['id','args','returns']);
    const result={id:id(value.id),args:array(value.args,limits.maxArity).map(sort),returns:sort(value.returns)};
    if(functionMap.has(result.id))fail();functionMap.set(result.id,result);return result;
  });
  const predicates=array(input.predicates,limits.maxSignatures).map(value=>{
    if(++signatures>limits.maxSignatures)fail();object(value,['id','args'],['id','args']);
    const result={id:id(value.id),args:array(value.args,limits.maxArity).map(sort)};
    if(predicateMap.has(result.id))fail();predicateMap.set(result.id,result);return result;
  });
  let nodes=0;
  const enter = depth => {if(depth>limits.maxDepth||++nodes>limits.maxNodes)fail();};
  const term = (value,environment,depth,used) => {
    enter(depth);object(value,['var','constant','apply','args'],[]);
    if(Object.hasOwn(value,'var')){
      object(value,['var'],['var']);const name=id(value.var),type=environment.get(name);if(type===undefined)fail();
      used.sorts.add(type);return {value:{var:name},sort:type};
    }
    if(Object.hasOwn(value,'constant')){
      object(value,['constant'],['constant']);const name=id(value.constant),entry=constantMap.get(name);if(!entry)fail();
      used.constants.add(name);used.sorts.add(entry.sort);return {value:{constant:name},sort:entry.sort};
    }
    object(value,['apply','args'],['apply','args']);const name=id(value.apply),entry=functionMap.get(name);if(!entry)fail();
    const args=array(value.args,limits.maxArity);if(args.length!==entry.args.length)fail();
    const parsed=args.map(item=>term(item,environment,depth+1,used));
    if(parsed.some((item,index)=>item.sort!==entry.args[index]))fail();
    used.functions.add(name);for(const type of [...entry.args,entry.returns])used.sorts.add(type);
    return {value:{apply:name,args:parsed.map(item=>item.value)},sort:entry.returns};
  };
  const formula = (value,environment,depth,used) => {
    enter(depth);object(value,['op','id','args','left','right','items','body','antecedent','consequent','variable','sort','mode'],['op']);
    const op=value.op;
    if(op==='predicate'){
      object(value,['op','id','args'],['op','id','args']);const name=id(value.id),entry=predicateMap.get(name);if(!entry)fail();
      const args=array(value.args,limits.maxArity);if(args.length!==entry.args.length)fail();
      const parsed=args.map(item=>term(item,environment,depth+1,used));if(parsed.some((item,index)=>item.sort!==entry.args[index]))fail();
      used.predicates.add(name);for(const type of entry.args)used.sorts.add(type);
      return {op,id:name,args:parsed.map(item=>item.value)};
    }
    if(op==='eq'){
      object(value,['op','left','right'],['op','left','right']);const left=term(value.left,environment,depth+1,used),right=term(value.right,environment,depth+1,used);
      if(left.sort!==right.sort)fail();return {op,left:left.value,right:right.value};
    }
    if(op==='and'||op==='or'){
      object(value,['op','items'],['op','items']);const items=array(value.items,limits.maxConnectives);if(items.length<2)fail();
      return {op,items:items.map(item=>formula(item,environment,depth+1,used))};
    }
    if(op==='not'){
      object(value,['op','body'],['op','body']);return {op,body:formula(value.body,environment,depth+1,used)};
    }
    if(op==='implies'){
      object(value,['op','antecedent','consequent'],['op','antecedent','consequent']);
      return {op,antecedent:formula(value.antecedent,environment,depth+1,used),consequent:formula(value.consequent,environment,depth+1,used)};
    }
    if(op==='forall'||op==='exists'){
      object(value,['op','variable','sort','body'],['op','variable','sort','body']);const variable=id(value.variable),type=sort(value.sort);
      // Refuse capture/shadowing rather than guessing an alpha-renaming.
      if(environment.has(variable))fail();const nested=new Map(environment);nested.set(variable,type);used.sorts.add(type);
      return {op,variable,sort:type,body:formula(value.body,nested,depth+1,used)};
    }
    if(op==='modal'){
      object(value,['op','mode','body'],['op','mode','body']);if(!['possible','necessary'].includes(value.mode))fail();
      return {op,mode:value.mode,body:formula(value.body,environment,depth+1,used)};
    }
    fail();
  };
  const assertionMap=new Map(),assertionKeys=['id','revision','context','domain','modality','status','assumptions','claim'];
  const assertions=array(input.assertions,limits.maxAssertions).map(value=>{
    object(value,assertionKeys,assertionKeys);const name=id(value.id);if(assertionMap.has(name))fail();
    if(!ASSERTION_MODALITIES.includes(value.modality)||!ASSERTION_STATUSES.includes(value.status))fail();
    const used={sorts:new Set(),constants:new Set(),functions:new Set(),predicates:new Set()};
    const result={id:name,revision:text(value.revision,128),context:id(value.context),domain:id(value.domain),modality:value.modality,status:value.status,
      assumptions:array(value.assumptions,limits.maxAssumptions).map(item=>formula(item,new Map(),0,used)),claim:formula(value.claim,new Map(),0,used)};
    // Operational assertion ID/revision and realisation/source/reviewer identities
    // are separate. Include the exact reachable type signatures in the IR identity.
    const ordered=(map,selected)=>[...selected].sort().map(key=>map.get(key));
    canonicalRecords.set(result,canonical({context:result.context,domain:result.domain,modality:result.modality,status:result.status,
      signatures:{sorts:[...used.sorts].sort(),constants:ordered(constantMap,used.constants),functions:ordered(functionMap,used.functions),predicates:ordered(predicateMap,used.predicates)},
      assumptions:result.assumptions,claim:result.claim}));
    assertionMap.set(name,result);return result;
  });
  const bound=new Set();
  const bindings=array(input.bindings,limits.maxBindings).map(value=>{
    const fields=['objectId','objectRevision','assertionId','assertionRevision','sourceDigest','review','reviewedBy'];object(value,fields,fields);
    const objectId=id(value.objectId),assertionId=id(value.assertionId),assertion=assertionMap.get(assertionId);
    if(bound.has(objectId)||!assertion||value.review!=='author-reviewed'||value.assertionRevision!==assertion.revision)fail();bound.add(objectId);
    return {objectId,objectRevision:text(value.objectRevision,128),assertionId,assertionRevision:text(value.assertionRevision,128),sourceDigest:digest(value.sourceDigest),
      review:'author-reviewed',reviewedBy:text(value.reviewedBy)};
  });
  return freeze({version:ASSERTION_VERSION,sorts,constants,functions,predicates,assertions,bindings});
}

/** Canonical IR only, for a record returned by this module's registry validator. */
function canonicalAssertion(assertion) {
  const result=assertion&&typeof assertion==='object'?canonicalRecords.get(assertion):undefined;
  if(result===undefined)fail('unvalidated-assertion');return result;
}

/** Exact ordered structure and reachable signatures; not logical equivalence. */
function compareAssertions(left,right) {
  const equal=canonicalAssertion(left)===canonicalAssertion(right);
  return Object.freeze({equal,reason:equal?'identical-ir':'different-ir'});
}

return {ASSERTION_VERSION,ASSERTION_LIMITS,ASSERTION_STATUSES,ASSERTION_MODALITIES,validateAssertionRegistry,canonicalAssertion,compareAssertions};
})();

const controlled_authoring = (() => {
// Copyright 2026 Kai Prince; SPDX-License-Identifier: Apache-2.0
// Developer draft: explicit finite English grammar, never ordinary-prose NLP.
const {validateAssertionRegistry,canonicalAssertion} = assertions;

const CONTROLLED_PROFILE='gw-controlled-english-v1';
const CONTROLLED_LIMITS=Object.freeze({assertions:32,formulaCharacters:12000,totalCharacters:65536,tokens:4096,depth:32,nodes:16384});
const CONTROLLED_QUALIFICATION='Compiled only the explicit finite controlled grammar into declared typed IR. Type checking and identical IR do not establish truth, proof, source fidelity or ordinary-language translation equivalence.';
const controlledFail=code=>{const error=Error(code);error.code=code;throw error;};
const controlledFreeze=value=>{if(value&&typeof value==='object'){for(const item of Object.values(value))controlledFreeze(item);Object.freeze(value);}return value;};
const controlledCanonical=value=>Array.isArray(value)?'['+value.map(controlledCanonical).join(',')+']':value!==null&&typeof value==='object'?'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+controlledCanonical(value[key])).join(',')+'}':JSON.stringify(value);
async function controlledDigest(text,cryptoObject=globalThis.crypto){if(!cryptoObject?.subtle||typeof cryptoObject.subtle.digest!=='function')controlledFail('controlled-crypto-unavailable');return [...new Uint8Array(await cryptoObject.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
/** Bounded data capture before awaits. No getter, prototype or JSON code path. */
function controlledData(input){
 let nodes=0,characters=0;const ancestors=new Set();
 function read(value,depth){
  if(depth>40||++nodes>CONTROLLED_LIMITS.nodes)controlledFail('controlled-data-budget');
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='number'){if(!Number.isFinite(value))controlledFail('controlled-data');return value;}
  if(typeof value==='string'){if((characters+=value.length)>262144||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)||/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/u.test(value))controlledFail('controlled-data');return value;}
  if(!value||typeof value!=='object'||ancestors.has(value))controlledFail('controlled-data');ancestors.add(value);let out;
  const ds=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(ds);
  if(Array.isArray(value)){if(value.length>4096||keys.length!==value.length+1)controlledFail('controlled-data');out=[];for(let i=0;i<value.length;i++){if(!Object.hasOwn(ds[i]??{},'value'))controlledFail('controlled-data');out.push(read(ds[i].value,depth+1));}}
  else{if(![Object.prototype,null].includes(Object.getPrototypeOf(value)))controlledFail('controlled-data');out={};for(const key of keys){if(typeof key!=='string'||['__proto__','constructor','prototype'].includes(key)||!Object.hasOwn(ds[key],'value'))controlledFail('controlled-data');out[key]=read(ds[key].value,depth+1);}}
  ancestors.delete(value);return out;
 }return read(input,0);
}
function controlledFields(value,required,optional=[]){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>![...required,...optional].includes(key))||required.some(key=>!Object.hasOwn(value,key)))controlledFail('controlled-fields');return value;}
const word=/^[A-Za-z][A-Za-z0-9_-]{0,63}$/u;
const reserved=new Set(['for','every','of','there','exists','if','then','and','or','not','possible','necessary','equal','it','its','they','them','their','this','that','these','those','he','she','his','her']);
const identifier=value=>{if(typeof value!=='string'||!word.test(value)||reserved.has(value.toLowerCase()))controlledFail('controlled-symbol');return value;};
function vocabulary(registry,raw){
 const categories=['sorts','constants','functions','predicates'];controlledFields(raw,[],categories);const maps={};
 for(const category of categories){
  const ids=new Set(category==='sorts'?registry.sorts:registry[category].map(entry=>entry.id)),entries=new Map();
  for(const id of ids)if(word.test(id)&&!reserved.has(id.toLowerCase()))entries.set(id,id);
  const aliases=raw[category]??[];if(!Array.isArray(aliases)||aliases.length>128)controlledFail('controlled-alias');const labels=new Set();
  for(const entry of aliases){controlledFields(entry,['label','id']);const label=identifier(entry.label);if(labels.has(label)||!ids.has(entry.id)||entries.has(label)&&entries.get(label)!==entry.id)controlledFail('controlled-alias');labels.add(label);entries.set(label,entry.id);}
  maps[category]=entries;
 }
 for(const label of maps.constants.keys())if(maps.functions.has(label))controlledFail('controlled-ambiguous-symbol');return maps;
}
function parseFormula(raw,maps){
 if(typeof raw!=='string'||!raw.trim()||raw.length>CONTROLLED_LIMITS.formulaCharacters)controlledFail('controlled-formula-budget');
 const syntax=raw.trimEnd().endsWith('.')?raw.trimEnd().slice(0,-1):raw,tokens=[];let at=0;
 while(at<syntax.length){if(/[ \t\r\n]/u.test(syntax[at])){at++;continue;}const token=/^[A-Za-z][A-Za-z0-9_-]{0,63}/u.exec(syntax.slice(at));if(token){tokens.push(token[0]);at+=token[0].length;}else if('(),:'.includes(syntax[at]))tokens.push(syntax[at++]);else controlledFail('controlled-unsupported-syntax');if(tokens.length>CONTROLLED_LIMITS.tokens)controlledFail('controlled-formula-budget');}
 let cursor=0,depth=0;const peek=()=>tokens[cursor],take=expected=>{const actual=tokens[cursor++];if(actual!==expected)controlledFail('controlled-unsupported-syntax');return actual;};
 const scoped=fn=>{if(++depth>CONTROLLED_LIMITS.depth)controlledFail('controlled-formula-budget');try{return fn();}finally{depth--;}};
 const resolve=(category,label)=>{const id=maps[category].get(label);if(id===undefined)controlledFail('controlled-undeclared-sense');return id;};
 function args(parse){take('(');const items=[];if(peek()!==')'){for(;;){items.push(parse());if(peek()!==',')break;take(',');}}take(')');return items;}
 const variables=new Set();
 function term(){return scoped(()=>{const label=identifier(tokens[cursor++]);if(peek()==='(')return {apply:resolve('functions',label),args:args(term)};if(variables.has(label)){if(maps.constants.has(label))controlledFail('controlled-ambiguous-symbol');return {var:label};}if(maps.constants.has(label))return {constant:resolve('constants',label)};return {var:label};});}
 function unary(){return scoped(()=>{
  const token=peek();
  if(token==='not'||token==='possible'||token==='necessary'){cursor++;take('(');const body=formula();take(')');return token==='not'?{op:'not',body}:{op:'modal',mode:token,body};}
  if(token==='('){take('(');const value=formula();take(')');return value;}
  if(token==='equal'){cursor++;const values=args(term);if(values.length!==2)controlledFail('controlled-unsupported-syntax');return {op:'eq',left:values[0],right:values[1]};}
  const name=identifier(tokens[cursor++]);return {op:'predicate',id:resolve('predicates',name),args:args(term)};
 });}
 function conjunction(){const items=[unary()];while(peek()==='and'){cursor++;items.push(unary());}return items.length===1?items[0]:{op:'and',items};}
 function disjunction(){const items=[conjunction()];while(peek()==='or'){cursor++;items.push(conjunction());}return items.length===1?items[0]:{op:'or',items};}
 function formula(){return scoped(()=>{
  if(peek()==='for'||peek()==='there'){
   const op=peek()==='for'?'forall':'exists';take(op==='forall'?'for':'there');take(op==='forall'?'every':'exists');const variable=identifier(tokens[cursor++]);if(variables.has(variable)||maps.constants.has(variable))controlledFail('controlled-ambiguous-symbol');take('of');const sort=resolve('sorts',identifier(tokens[cursor++]));take(':');variables.add(variable);let body;try{body=formula();}finally{variables.delete(variable);}return {op,variable,sort,body};
  }
  if(peek()==='if'){take('if');take('(');const antecedent=formula();take(')');take('then');take('(');const consequent=formula();take(')');return {op:'implies',antecedent,consequent};}
  return disjunction();
 });}
 const result=formula();if(cursor!==tokens.length)controlledFail('controlled-unsupported-syntax');return result;
}

/** Reuses the existing registry validator for signatures, sorts, free variables,
 * arity, binder capture, domain/status and all finite IR bounds. */
async function compileControlledAssertions(input,{cryptoObject=globalThis.crypto}={}){
 const source=controlledData(input);controlledFields(source,['version','language','registry','assertions'],['aliases']);if(source.version!==1||source.language!=='en'||!Array.isArray(source.assertions)||source.assertions.length<1||source.assertions.length>CONTROLLED_LIMITS.assertions)controlledFail('controlled-profile');
 controlledFields(source.registry,['version','sorts','constants','functions','predicates','assertions','bindings']);
 const declarations=validateAssertionRegistry({...source.registry,assertions:[],bindings:[]}),maps=vocabulary(declarations,source.aliases??{});let characters=0;
 const records=source.assertions.map(value=>{
  controlledFields(value,['id','revision','context','domain','modality','status','assumptions','claim']);if(!Array.isArray(value.assumptions)||value.assumptions.length>32)controlledFail('controlled-formula-budget');
  for(const raw of [...value.assumptions,value.claim]){if(typeof raw!=='string'||(characters+=raw.length)>CONTROLLED_LIMITS.totalCharacters)controlledFail('controlled-formula-budget');}
  return {...value,assumptions:value.assumptions.map(raw=>parseFormula(raw,maps)),claim:parseFormula(value.claim,maps)};
 });
 const registry=validateAssertionRegistry({...source.registry,assertions:[...source.registry.assertions,...records]}),sources=[];
 for(const original of source.assertions){const assertion=registry.assertions.find(value=>value.id===original.id);sources.push({assertionId:assertion.id,assertionRevision:assertion.revision,sourceSha256:await controlledDigest(controlledCanonical(original),cryptoObject),irSha256:await controlledDigest(canonicalAssertion(assertion),cryptoObject)});}
 return controlledFreeze({version:1,kind:'controlled-assertion-compilation',profile:CONTROLLED_PROFILE,language:'en',registry,sources,inputSha256:await controlledDigest(controlledCanonical(source),cryptoObject),qualification:CONTROLLED_QUALIFICATION});
}

return {CONTROLLED_PROFILE,CONTROLLED_LIMITS,CONTROLLED_QUALIFICATION,controlledFail,controlledFreeze,controlledCanonical,controlledDigest,controlledData,controlledFields,compileControlledAssertions};
})();

const wai_symbols = (() => {
// Copyright 2026 Kai Prince; SPDX-License-Identifier: Apache-2.0
// Original finite WAI-Adapt annotation/local project symbol-set pilot.
const {controlledData,controlledFields,controlledCanonical,controlledDigest,controlledFreeze,controlledFail} = controlled_authoring;

const WAI_SYMBOL_PROFILE='gw-wai-symbols-pilot-v1';
const WAI_SYMBOL_HELPER='gw-local-symbols-v1';
const WAI_SYMBOL_LIMITS=Object.freeze({annotations:32,assets:32,labelCharacters:512,assetBytes:262144,totalAssetBytes:2097152,pngDimension:2048,pngPixels:4194304});
const WAI_SYMBOL_REGISTRY=controlledFreeze({version:'w3c-aac-registry-2022-12-13',source:'https://www.w3.org/TR/aac-registry/',concepts:[{id:'14704',meaning:'help, aid, assistance, support (noun)'},{id:'14705',meaning:'help, aid, assist, serve, support (verb)'},{id:'14885',meaning:'home'}]});
const WAI_SYMBOL_QUALIFICATION='Finite reviewed adapt-symbol annotations and an optional original local project symbol-set helper. Declared reviews and rights are not authenticated approval, AAC familiarity, external-helper acceptance or full WAI-Adapt conformance.';
const fail=code=>controlledFail(code),canonical=controlledCanonical;
const fields=(value,required,optional=[])=>{try{return controlledFields(value,required,optional);}catch{fail('wai-symbol-fields');}};
const list=(value,max)=>{if(!Array.isArray(value)||value.length>max)fail('wai-symbol-budget');return value;};
const text=(value,max=256)=>{if(typeof value!=='string'||!value.trim()||value.length>max)fail('wai-symbol-text');return value;};
const id=value=>{if(typeof value!=='string'||! /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/u.test(value))fail('wai-symbol-id');return value;};
const sha=value=>{if(typeof value!=='string'||! /^[a-f0-9]{64}$/u.test(value))fail('wai-symbol-hash');return value;};
const concept=value=>{if(typeof value!=='string'||!WAI_SYMBOL_REGISTRY.concepts.some(row=>row.id===value))fail('wai-symbol-concept');return value;};
const unique=(rows,key)=>{if(new Set(rows.map(row=>row[key])).size!==rows.length)fail('wai-symbol-duplicate');return rows;};
function path(value,{relativeParents=false}={}){
 text(value,512);
 if(value.startsWith('/')||/[\\%?#:]/u.test(value)||value.split('/').some(part=>!part||part==='.'||part==='..'&&!relativeParents)||!value.toLowerCase().endsWith('.png'))fail('wai-symbol-path');
 return value;
}
function scopeOf(value){fields(value,['projectId','projectRevision','pageURL','pageSourceSha256']);id(value.projectId);text(value.projectRevision,128);text(value.pageURL,512);if(value.pageURL.startsWith('/')||/[\\%?#:]/u.test(value.pageURL)||value.pageURL.split('/').some(part=>!part||part==='.'||part==='..')||! /\.html?$/iu.test(value.pageURL))fail('wai-symbol-scope');sha(value.pageSourceSha256);return value;}
function observationOf(value){
 fields(value,['id','revision','concept','sourceDigest','sourceSha256','text','reviewedBy']);id(value.id);text(value.revision,128);concept(value.concept);sha(value.sourceSha256);text(value.text,WAI_SYMBOL_LIMITS.labelCharacters);text(value.reviewedBy);
 if(typeof value.sourceDigest!=='string'||!/^sha1:[a-f0-9]{40}$/u.test(value.sourceDigest)||/[\r\n\t]/u.test(value.text))fail('wai-symbol-source');
 return value;
}
function assetOf(value){
 fields(value,['concept','path','url','bytes','sha256','licence','attribution']);concept(value.concept);path(value.path);path(value.url,{relativeParents:true});sha(value.sha256);text(value.licence,256);text(value.attribution,1024);
 if(!Number.isSafeInteger(value.bytes)||value.bytes<57||value.bytes>WAI_SYMBOL_LIMITS.assetBytes)fail('wai-symbol-budget');return value;
}
function configOf(value){
 fields(value,[],['mode','helper','symbols','reviews']);const result={mode:value.mode??'inspect',helper:value.helper??false,symbols:value.symbols??[],reviews:value.reviews??[]};
 if(!['inspect','reviewed'].includes(result.mode)||![false,WAI_SYMBOL_HELPER].includes(result.helper))fail('wai-symbol-mode');
 unique(list(result.symbols,WAI_SYMBOL_LIMITS.assets).map(row=>{fields(row,['concept','path','licence','attribution']);concept(row.concept);path(row.path,{relativeParents:true});text(row.licence);text(row.attribution,1024);return row;}),'concept');
 unique(list(result.reviews,WAI_SYMBOL_LIMITS.annotations).map(row=>{fields(row,['id','revision','snapshotSha256','review','reviewedBy']);id(row.id);text(row.revision,128);sha(row.snapshotSha256);if(row.review!=='author-reviewed')fail('wai-symbol-review');text(row.reviewedBy);return row;}),'id');return result;
}
const frame=(helper,symbols,binding)=>({version:1,profile:WAI_SYMBOL_PROFILE,registry:WAI_SYMBOL_REGISTRY,helper,symbols,...binding});
const notice=status=>status==='inspect'?'Inspect the exact native label, registry meaning, local asset and declared rights, then copy the current YAML review pins. Authored text is retained.':status==='reviewed'?'Current declared source/registry/asset review pins match. Text remains the accessible name; symbol display is an explicit optional local helper action.':'The optional symbol enhancement is unavailable because a review is missing or stale. Authored text is retained.';

/** The native caller confines files and validates their PNG bytes before passing
 * metadata. This pure step binds that observation; it does not read a path. */
async function prepareWaiSymbolsNative(input,{cryptoObject=globalThis.crypto}={}){
 const value=controlledData(input);fields(value,[],['config','observations','assets','scope']);
 if(value.config===undefined||value.config===false)return controlledFreeze({version:1,kind:'gw-wai-symbols',profile:WAI_SYMBOL_PROFILE,status:'disabled',helper:false,annotations:[],inspection:null,previewConfig:null});
 const config=configOf(value.config),scope=scopeOf(value.scope),observations=unique(list(value.observations??[],WAI_SYMBOL_LIMITS.annotations).map(observationOf),'id'),assets=unique(list(value.assets??[],WAI_SYMBOL_LIMITS.assets).map(assetOf),'concept');
 if(assets.reduce((sum,row)=>sum+row.bytes,0)>WAI_SYMBOL_LIMITS.totalAssetBytes)fail('wai-symbol-budget');
 if(assets.length!==config.symbols.length||config.symbols.some(row=>!assets.some(asset=>['concept','licence','attribution'].every(key=>asset[key]===row[key]))))fail('wai-symbol-asset-binding');
 if(config.helper===WAI_SYMBOL_HELPER&&observations.some(row=>!assets.some(asset=>asset.concept===row.concept)))fail('wai-symbol-asset-missing');
 const binding={scope,observations,assets},snapshotSha256=await controlledDigest(canonical(frame(config.helper,config.symbols,binding)),cryptoObject);
 const reviews=observations.map(row=>({id:row.id,revision:row.revision,snapshotSha256,review:'author-reviewed',reviewedBy:row.reviewedBy}));
 const accepted=config.mode==='reviewed'&&config.reviews.length===reviews.length&&reviews.every(expected=>config.reviews.some(actual=>['id','revision','snapshotSha256','review'].every(key=>actual[key]===expected[key])));
 const status=config.mode==='inspect'?'inspect':accepted?'reviewed':'unavailable';
 const records=observations.map(row=>({...row,meaning:WAI_SYMBOL_REGISTRY.concepts.find(entry=>entry.id===row.concept).meaning,asset:assets.find(entry=>entry.concept===row.concept)??null}));
 return controlledFreeze({version:1,kind:'gw-wai-symbols',profile:WAI_SYMBOL_PROFILE,status,helper:config.helper,snapshotSha256,binding,annotations:accepted?observations.map(row=>({...row,snapshotSha256})):[],inspection:{reason:status==='unavailable'?'wai-symbol-review-stale':null,records,notice:notice(status)+' '+WAI_SYMBOL_QUALIFICATION},previewConfig:{mode:'reviewed',helper:config.helper,symbols:config.symbols,reviews:accepted?config.reviews:reviews}});
}

/** Regenerate a reviewed packet before browser use. These hashes bind data and
 * expose staleness; they do not authenticate the author or a script origin. */
async function hydrateWaiSymbolsPacket(input,{cryptoObject=globalThis.crypto}={}){
 const value=controlledData(input);fields(value,['version','kind','profile','status','helper','snapshotSha256','binding','annotations','inspection','previewConfig']);
 if(value.version!==1||value.kind!=='gw-wai-symbols'||value.profile!==WAI_SYMBOL_PROFILE||value.status!=='reviewed')fail('wai-symbol-packet');
 fields(value.binding,['scope','observations','assets']);
 const expected=await prepareWaiSymbolsNative({config:value.previewConfig,...value.binding},{cryptoObject});
 if(canonical(expected)!==canonical(value))fail('wai-symbol-packet');return expected;
}

const crc32=(bytes,start,end)=>{let crc=0xffffffff;for(let at=start;at<end;at++){crc^=bytes[at];for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;};
/** Shared native/browser finite static PNG envelope. Bounded chunks/CRC and
 * dimensions are checked without inflating compressed data. Actual decoding is
 * checked separately by the explicit browser action before any image is shown. */
function validateWaiSymbolPNG(bytes){
 const signature=[137,80,78,71,13,10,26,10];if(!(bytes instanceof Uint8Array)||bytes.length<57||bytes.length>WAI_SYMBOL_LIMITS.assetBytes||signature.some((value,index)=>bytes[index]!==value))fail('wai-symbol-png');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let at=8,index=0,width=0,height=0,color=-1,palette=0,transparency=false,idat=false,idatEnded=false,compressed=0;
 while(at<bytes.length){
  if(at+12>bytes.length)fail('wai-symbol-png');const size=view.getUint32(at),type=String.fromCharCode(...bytes.subarray(at+4,at+8)),end=at+8+size;
  if(size>bytes.length-at-12||! /^[A-Za-z]{2}[A-Z][A-Za-z]$/u.test(type)||crc32(bytes,at+4,end)!==view.getUint32(end))fail('wai-symbol-png');
  if(index===0){
   if(type!=='IHDR'||size!==13)fail('wai-symbol-png');width=view.getUint32(at+8);height=view.getUint32(at+12);const depth=bytes[at+16];color=bytes[at+17];
   if(!width||!height||width>WAI_SYMBOL_LIMITS.pngDimension||height>WAI_SYMBOL_LIMITS.pngDimension||width*height>WAI_SYMBOL_LIMITS.pngPixels||!({0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]})[color]?.includes(depth)||bytes[at+18]!==0||bytes[at+19]!==0||bytes[at+20]>1)fail('wai-symbol-png');
  }else if(type==='IHDR'||['acTL','fcTL','fdAT'].includes(type))fail('wai-symbol-png');
  else if(type==='PLTE'){if(idat||palette||[0,4].includes(color)||!size||size>768||size%3)fail('wai-symbol-png');palette=size/3;}
  else if(type==='tRNS'){if(idat||transparency||![0,2,3].includes(color)||color===0&&size!==2||color===2&&size!==6||color===3&&(!palette||!size||size>palette))fail('wai-symbol-png');transparency=true;}
  else if(type==='IDAT'){if(idatEnded||color===3&&!palette)fail('wai-symbol-png');idat=true;compressed+=size;}
  else if(type==='IEND'){if(size||end+4!==bytes.length||!idat||!compressed)fail('wai-symbol-png');return Object.freeze({width,height});}
  else if(type[0]===type[0].toUpperCase())fail('wai-symbol-png');
  if(idat&&type!=='IDAT')idatEnded=true;at=end+4;index++;
 }
 fail('wai-symbol-png');
}
function assetURL(value,href){let result;try{result=new URL(value,href);}catch{fail('wai-symbol-url');}const current=new URL(href);if(!['http:','https:'].includes(current.protocol)||result.origin!==current.origin||result.username||result.password||result.search||result.hash)fail('wai-symbol-url');return result.href;}
async function readImage(asset,{href,fetchImpl,signal,cryptoObject}){
 const url=assetURL(asset.url,href),response=await fetchImpl(url,{method:'GET',mode:'same-origin',credentials:'omit',cache:'no-store',redirect:'error',signal});
 if(!response?.ok||response.url&&response.url!==url||!response.body||typeof response.body.getReader!=='function')fail('wai-symbol-fetch');
 const length=response.headers?.get?.('content-length');if(length!==null&&length!==undefined&&(!/^\d+$/u.test(length)||Number(length)!==asset.bytes))fail('wai-symbol-fetch');
 const reader=response.body.getReader(),parts=[];let size=0,complete=false;
 try{for(;;){if(signal.aborted)fail('wai-symbol-cancelled');const part=await reader.read();if(part.done){complete=true;break;}if(!(part.value instanceof Uint8Array)||(size+=part.value.byteLength)>asset.bytes)fail('wai-symbol-budget');parts.push(part.value.slice());}if(size!==asset.bytes)fail('wai-symbol-fetch');}
 finally{if(!complete)try{await reader.cancel();}catch{}reader.releaseLock?.();}
 if(signal.aborted)fail('wai-symbol-cancelled');const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}validateWaiSymbolPNG(bytes);
 // Hash bytes directly, without a text conversion that could alter an image.
 if(!cryptoObject?.subtle)fail('wai-symbol-crypto');const actual=[...new Uint8Array(await cryptoObject.subtle.digest('SHA-256',bytes))].map(byte=>byte.toString(16).padStart(2,'0')).join('');if(actual!==asset.sha256)fail('wai-symbol-asset-stale');return bytes;
}
const excludedRoles=new Set(['answer','solution','hint','feedback','post-attempt','generative-answer','generative-solution','generative-feedback']);
function eligible(el,doc){
 if(el.ownerDocument!==doc||el.isConnected!==true||el.tagName!=='SPAN'||!(el.getAttribute('class')??'').split(/\s+/u).includes('learning-symbol'))return false;
 for(let current=el;current;current=current.parentNode){if(current.ownerDocument&&current.ownerDocument!==doc)return false;const attr=name=>current.getAttribute?.(name);if(current.hidden||current.inert||attr('hidden')!==undefined&&attr('hidden')!==null||attr('inert')!==undefined&&attr('inert')!==null||attr('aria-hidden')==='true'||attr('public')==='false'||attr('consent')==='false'||attr('visibility')==='private'||attr('audience')==='private'||['SCRIPT','STYLE','TEMPLATE','NOSCRIPT','CODE','PRE','MATH','SVG','TEXTAREA'].includes(current.tagName))return false;const classes=(attr('class')??current.className??'').split(/\s+/u);if(classes.some(name=>name==='private'||name==='content-hidden'||excludedRoles.has(name)))return false;for(const key of ['learning-role','data-learning-role','scenario-role'])if(excludedRoles.has(attr(key)))return false;}
 return true;
}
const attributes=el=>canonical([...el.attributes].map(entry=>Array.isArray(entry)?entry:[entry.name,entry.value]).sort((a,b)=>a[0].localeCompare(b[0])));
async function decodedImage(image,signal){
 if(typeof image.decode!=='function'||signal.aborted)fail('wai-symbol-decode');let cancel;const cancelled=new Promise((resolve,reject)=>{cancel=()=>reject(Error('wai-symbol-cancelled'));signal.addEventListener('abort',cancel,{once:true});});
 try{await Promise.race([image.decode(),cancelled]);if(signal.aborted||image.naturalWidth!==undefined&&(!image.naturalWidth||!image.naturalHeight||image.naturalWidth>WAI_SYMBOL_LIMITS.pngDimension||image.naturalHeight>WAI_SYMBOL_LIMITS.pngDimension||image.naturalWidth*image.naturalHeight>WAI_SYMBOL_LIMITS.pngPixels))fail('wai-symbol-decode');}
 finally{signal.removeEventListener('abort',cancel);}
}

/** No asset request occurs until show(). Only owned image nodes/blob URLs are
 * removed. Label text, source attributes, focus and accessible names are untouched. */
function mountWaiSymbolControls(input,settings={}){
 const doc=settings.documentObject??globalThis.document,win=settings.windowObject??globalThis.window;if(!doc||!win)fail('wai-symbol-ui-unavailable');
 const root=doc.createElement('div');root.className='generative-wai-symbol-controls';const status=doc.createElement('p');status.setAttribute('role','status');status.textContent='Optional local symbols are off. Authored text remains readable.';
 const showButton=doc.createElement('button'),resetButton=doc.createElement('button');showButton.type=resetButton.type='button';showButton.textContent='Show symbols';resetButton.textContent='Reset symbols';showButton.disabled=true;root.append(showButton,resetButton,status);settings.container?.append(root);
 const fetchImpl=settings.fetchImpl??globalThis.fetch,cryptoObject=settings.cryptoObject??globalThis.crypto,urlAPI=settings.urlObject??win.URL??globalThis.URL,BlobClass=settings.BlobClass??win.Blob??globalThis.Blob;
 const listeners=[],originals=[],owned=[],blobURLs=[];let packet=null,identity=null,expectedURL=null,ready=false,alive=true,disposed=false,shown=false,loading=false,invalidated=false,epoch=0,abort=null,observer=null;
 const on=(target,name,handler)=>{target.addEventListener(name,handler);listeners.push(()=>target.removeEventListener(name,handler));};
 const unique=anchor=>{const matches=[...doc.querySelectorAll('[id]')].filter(el=>el.id===anchor);if(matches.length!==1)fail('wai-symbol-ui-anchor');return matches[0];};
 const cleanup=()=>{for(const row of owned.splice(0))row.image.remove();for(const url of blobURLs.splice(0))try{urlAPI.revokeObjectURL(url);}catch{}shown=false;};
 function current(){try{const now=new URL(win.location.href);now.hash='';return ready&&alive&&!disposed&&!invalidated&&root.ownerDocument===doc&&root.isConnected===true&&(!win.document||win.document===doc)&&(!doc.defaultView||doc.defaultView===win)&&win.closed!==true&&now.href===expectedURL&&identity===canonical(controlledData(input))&&(!settings.isCurrent||settings.isCurrent()===true)&&(!settings.readData||settings.readData()===settings.initialDataText)&&originals.every(row=>unique(row.record.id)===row.el&&eligible(row.el,doc)&&row.el.parentNode===row.parent&&row.el.innerHTML===row.html&&attributes(row.el)===row.attributes&&row.el.textContent===row.record.text)&&owned.every(row=>row.image.ownerDocument===doc&&row.image.isConnected===true&&row.image.parentNode===row.parent&&row.image.src===row.src&&attributes(row.image)===row.attributes);}catch{return false;}}
 function refreshShowControl(){
  const unavailable=!current(),owns=alive&&!disposed&&root.ownerDocument===doc&&root.isConnected===true&&doc.activeElement===showButton;
  if(unavailable&&owns&&resetButton.isConnected&&!resetButton.disabled)resetButton.focus();
  showButton.disabled=unavailable;
  if(loading&&!unavailable){showButton.setAttribute('aria-disabled','true');showButton.setAttribute('aria-busy','true');}
  else{showButton.removeAttribute('aria-disabled');showButton.removeAttribute('aria-busy');}
 }
 function reset(message='Local symbols are off. Authored text is retained.'){epoch++;abort?.abort();abort=null;loading=false;cleanup();refreshShowControl();if(!disposed)status.textContent=message;}
 async function show(){
  if(shown){if(current())return true;reset('Optional local symbols are unavailable or stale. Authored text is retained.');return false;}if(loading)return false;const token=++epoch;if(!current()||typeof fetchImpl!=='function'||typeof urlAPI?.createObjectURL!=='function'||typeof BlobClass!=='function'){reset('Optional local symbols are unavailable or stale. Authored text is retained.');return false;}
  abort?.abort();abort=new AbortController();const controller=abort,signal=controller.signal,timer=setTimeout(()=>controller.abort(),15000);loading=true;refreshShowControl();status.textContent='Checking the selected local symbol images. Reset remains available.';
  try{
   const images=new Map();for(const asset of packet.binding.assets){const bytes=await readImage(asset,{href:win.location.href,fetchImpl,signal,cryptoObject});if(token!==epoch||signal.aborted||!current())fail('wai-symbol-ui-stale');const url=urlAPI.createObjectURL(new BlobClass([bytes],{type:'image/png'}));if(typeof url!=='string'||!url.startsWith('blob:')){try{urlAPI.revokeObjectURL(url);}catch{}fail('wai-symbol-url');}blobURLs.push(url);images.set(asset.concept,url);}
   if(token!==epoch||signal.aborted||!current())fail('wai-symbol-ui-stale');
   const pendingImages=[];for(const row of originals){const image=doc.createElement('img');image.className='generative-wai-symbol';image.setAttribute('alt','');image.setAttribute('aria-hidden','true');image.setAttribute('data-gw-symbol-owner',row.record.id);image.src=images.get(row.record.concept);await decodedImage(image,signal);if(token!==epoch||signal.aborted||!current())fail('wai-symbol-ui-stale');pendingImages.push({image,parent:row.parent,src:image.src,attributes:attributes(image),source:row.el});}
   if(token!==epoch||signal.aborted||!current())fail('wai-symbol-ui-stale');for(const row of pendingImages){owned.push(row);row.parent.insertBefore(row.image,row.source.nextSibling);}
   shown=true;status.textContent='Local project symbols are shown beside retained text. This does not establish AAC familiarity or external-helper support.';return true;
  }catch{if(token===epoch){abort?.abort();cleanup();status.textContent='Optional local symbols are unavailable, cancelled or stale. Authored text is retained.';}return false;}
  finally{clearTimeout(timer);if(token===epoch){loading=false;refreshShowControl();}}
 }
 on(showButton,'click',()=>{void show();});on(resetButton,'click',()=>reset());on(win,'pagehide',()=>{alive=false;reset('Local symbols are off after leaving the page. Authored text is retained.');});on(win,'pageshow',()=>{alive=true;reset('Local symbols are off. Use Show symbols again when wanted.');});
 const readyPromise=(async()=>{
  identity=canonical(controlledData(input));packet=await hydrateWaiSymbolsPacket(input,{cryptoObject});if(disposed||!alive||identity!==canonical(controlledData(input))||packet.helper!==WAI_SYMBOL_HELPER||!packet.annotations.length)fail('wai-symbol-ui-unavailable');
  const expected=new URL(packet.binding.scope.pageURL,settings.baseURL??win.location.href);expected.hash='';expectedURL=expected.href;
  for(const record of packet.annotations){const el=unique(record.id);if(!eligible(el,doc)||el.textContent!==record.text||el.getAttribute('adapt-symbol')!==record.concept||el.getAttribute('data-gw-symbol-snapshot')!==packet.snapshotSha256||el.childNodes&&[...el.childNodes].some(child=>child.nodeType!==3))fail('wai-symbol-ui-anchor');originals.push({record,el,parent:el.parentNode,html:el.innerHTML,attributes:attributes(el)});}
  ready=true;if(root.isConnected===true&&!current())fail('wai-symbol-ui-stale');const Observer=settings.MutationObserverClass??win.MutationObserver;if(typeof Observer==='function'&&doc.documentElement){observer=new Observer(()=>{if(ready&&alive&&!disposed&&!invalidated&&!current()){invalidated=true;reset('Optional local symbols became stale. Authored text is retained.');}});observer.observe(doc.documentElement,{subtree:true,childList:true,attributes:true,characterData:true});}showButton.disabled=false;return packet;
 })();
 readyPromise.catch(()=>{cleanup();showButton.disabled=true;if(!disposed)status.textContent='Optional local symbols are unavailable. Authored text is retained.';});
 return Object.freeze({root,ready:readyPromise,show,reset,dispose(){if(disposed)return;disposed=true;alive=false;epoch++;abort?.abort();observer?.disconnect();cleanup();for(const remove of listeners)remove();showButton.disabled=resetButton.disabled=true;root.remove();}});
}

return {WAI_SYMBOL_PROFILE,WAI_SYMBOL_HELPER,WAI_SYMBOL_LIMITS,WAI_SYMBOL_REGISTRY,WAI_SYMBOL_QUALIFICATION,prepareWaiSymbolsNative,hydrateWaiSymbolsPacket,validateWaiSymbolPNG,mountWaiSymbolControls};
})();

const publication = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Reviewed language metadata for native pages. No translation, DOM, filesystem or network.
const LANGUAGE_PUBLICATION_VERSION=1;
const LANGUAGE_PUBLICATION_LIMITS=Object.freeze({maxPages:32,maxSets:16,maxRealisationsPerSet:16,maxRealisations:64});
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
function validateLanguagePublication(input,options={}){
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
function planLanguageLinks(publication,currentPageId){
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

return {LANGUAGE_PUBLICATION_VERSION,LANGUAGE_PUBLICATION_LIMITS,validateLanguagePublication,planLanguageLinks};
})();

const exercises = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Original finite practice generators. No authored executable expressions.
const EXERCISE_VERSION='gw-finite-exercises-v1';
const EXERCISE_SOURCE_QUALIFICATION='Caller-supplied public native-content SHA-256; no original QMD offsets, review authentication or mathematical proof is established.';
const EXERCISE_LIMITS=Object.freeze({minimum:-20,maximum:20,denominator:12,setSize:8,answerBytes:256});
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
async function createExercise(spec,options={}){
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
async function checkAnswer(instance,answer,options={}){
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

return {EXERCISE_VERSION,EXERCISE_SOURCE_QUALIFICATION,EXERCISE_LIMITS,createExercise,checkAnswer};
})();

const transparency = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Deterministic grouping of explicitly public records, never impact inference.
const TRANSPARENCY_VERSION='gw-transparency-v1';
const TRANSPARENCY_SOURCE_QUALIFICATION='Caller-supplied public native-content SHA-256; no original QMD offsets or authenticated review is established.';
const TRANSPARENCY_SOURCE_KINDS=Object.freeze(['native-content','published-cv-record']);
const TRANSPARENCY_CV_SOURCE_QUALIFICATION='Caller-supplied SHA-256 of an exact published CV record, including its qualifications; this is not a native-content or original QMD span hash, authenticated review or verification.';
const TRANSPARENCY_LIMITS=Object.freeze({records:512,links:32,textBytes:4000,totalBytes:262144});
const trEncoder=new TextEncoder(),trKinds=['activity','output','outcome','impact','evidence','reflection'];
const trLabels={activity:'Declared activity',output:'Declared output',outcome:'Declared outcome',impact:'Declared impact',evidence:'Declared evidence',reflection:'Public reflection'};
const trRelations=new Set(['project','role','output','outcome','impact','evidence','reflection','related']);
function trFail(){const error=new TypeError('generative-websites: invalid, changed or unsupported transparency records or review');error.code='invalid-transparency';throw error;}
function trFields(value,allowed,required=allowed){
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))trFail();
  for(const key of Reflect.ownKeys(value)){const prop=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!allowed.includes(key)||!prop.enumerable||!Object.hasOwn(prop,'value'))trFail();}
  if(required.some(key=>!Object.hasOwn(value,key)))trFail();
}
function trArray(value,max){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>max)trFail();
  const keys=Reflect.ownKeys(value).filter(key=>key!=='length');if(keys.length!==value.length)trFail();
  keys.forEach((key,index)=>{const prop=Object.getOwnPropertyDescriptor(value,key);if(key!==String(index)||!prop.enumerable||!Object.hasOwn(prop,'value'))trFail();});
}
function trText(value,max,{multiline=false}={}){
  if(typeof value!=='string'||!value||value!==value.trim()||trEncoder.encode(value).length>max||
    (multiline?/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\ud800-\udfff]/u:/[\u0000-\u001f\u007f\ud800-\udfff]/u).test(value))trFail();return value;
}
function trID(value){trText(value,256);if(/[\s<>"'\\]/.test(value)||['constructor','prototype','__proto__'].includes(value))trFail();return value;}
function trHash(value){if(typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value))trFail();return value;}
function trURL(value){
  trText(value,2048);if(/[\\%?#\s<>"']/.test(value)||value.startsWith('//'))trFail();let path=value;
  if(/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)){let url;try{url=new URL(value);}catch{trFail();}
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.href!==value)trFail();path=url.pathname;}
  else if(value.includes(':'))trFail();
  if(!path.endsWith('.html')||path.split('/').some((part,index)=>part==='.'||part==='..'||part.startsWith('.')||!part&&index!==0))trFail();return value;
}
function trSource(value){trFields(value,['path','anchor','sha256']);const anchor=trID(value.anchor);if(!/^[A-Za-z][A-Za-z0-9._:-]*$/.test(anchor))trFail();return {path:trURL(value.path),anchor,sha256:trHash(value.sha256)};}
function trSourceKind(value){if(value!==undefined&&!TRANSPARENCY_SOURCE_KINDS.includes(value))trFail();return value;}
function trQualification(value){return value==='published-cv-record'?TRANSPARENCY_CV_SOURCE_QUALIFICATION:TRANSPARENCY_SOURCE_QUALIFICATION;}
function trDay(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'0001-01-01')trFail();
  const date=new Date(value+'T00:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)trFail();return value;
}
function trCanonical(value,depth=0,budget={nodes:0}){
  if(depth>20||++budget.nodes>50000)trFail();if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'&&Number.isSafeInteger(value))return JSON.stringify(value);
  if(Array.isArray(value)){trArray(value,16384);return '['+value.map(item=>trCanonical(item,depth+1,budget)).join(',')+']';}
  trFields(value,Object.keys(value));return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+trCanonical(value[key],depth+1,budget)).join(',')+'}';
}
async function trDigest(value){if(!globalThis.crypto?.subtle)trFail();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',trEncoder.encode(trCanonical(value))))].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
function trFreeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(trFreeze);Object.freeze(value);}return value;}
function trVisible(raw){
  // Check only publication/review descriptors before inspecting an excluded
  // record. Its private text, paths, labels and getters are never read or hashed.
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||![Object.prototype,null].includes(Object.getPrototypeOf(raw)))trFail();
  const publication=Object.getOwnPropertyDescriptor(raw,'public');if(!publication||!Object.hasOwn(publication,'value')||typeof publication.value!=='boolean')trFail();
  if(!publication.value)return false;
  const review=Object.getOwnPropertyDescriptor(raw,'review');if(!review||!Object.hasOwn(review,'value')||!['author-reviewed','candidate','declared'].includes(review.value))trFail();
  return review.value==='author-reviewed';
}
function trRecord(value){
  trFields(value,['id','revision','kind','public','review','label','occurredOn','recordedOn','text','qualification','source','sourceKind','links','supersedes'],
    ['id','revision','kind','public','review','label','occurredOn','source']);
  if(value.public!==true||value.review!=='author-reviewed'||!trKinds.includes(value.kind))trFail();
  const result={id:trID(value.id),revision:trText(value.revision,128),kind:value.kind,public:true,review:'author-reviewed',label:trText(value.label,256),
    occurredOn:trDay(value.occurredOn),recordedOn:value.recordedOn===undefined?null:trDay(value.recordedOn),source:trSource(value.source),links:[]};
  if(trSourceKind(value.sourceKind)!==undefined)result.sourceKind=value.sourceKind;
  if(value.text!==undefined)result.text=trText(value.text,4000,{multiline:true});
  if(value.qualification!==undefined)result.qualification=trText(value.qualification,1000,{multiline:true});
  if(['outcome','impact'].includes(value.kind)&&!result.qualification)trFail();
  if(value.supersedes!==undefined)result.supersedes=trID(value.supersedes);
  if(value.links!==undefined){trArray(value.links,32);const seen=new Set();result.links=value.links.map(link=>{
    trFields(link,['relation','target']);if(!trRelations.has(link.relation))trFail();const target=trID(link.target),key=link.relation+'\n'+target;
    if(seen.has(key))trFail();seen.add(key);return {relation:link.relation,target};});result.links.sort((a,b)=>a.relation<b.relation?-1:a.relation>b.relation?1:a.target<b.target?-1:a.target>b.target?1:0);}
  return result;
}
function trTarget(value){
  trFields(value,['id','revision','kind','public','review','label','source','sourceKind'],['id','revision','kind','public','review','label','source']);
  if(value.public!==true||value.review!=='author-reviewed'||!['project','role'].includes(value.kind))trFail();
  const sourceKind=trSourceKind(value.sourceKind);
  return {id:trID(value.id),revision:trText(value.revision,128),kind:value.kind,public:true,review:'author-reviewed',label:trText(value.label,256),
    source:trSource(value.source),...(sourceKind===undefined?{}:{sourceKind}),kindLabel:value.kind==='project'?'Declared project':'Declared role',sourceQualification:trQualification(sourceKind)};
}

/** Produce a draft or a hash-bound declared review of an explicit public period.
 * Unknown/private link targets are withheld; their values never enter output.
 * All eligible records bind freshness, including supporting records outside the
 * chosen period. Review is an unauthenticated authored claim, not verification. */
async function buildPeriodReport(records,options){
  trFields(options,['period','start','review','targets'],['period','start']);if(!['day','iso-week'].includes(options.period))trFail();
  const chosen=trDay(options.start),startDate=new Date(chosen+'T00:00:00Z');
  if(options.period==='iso-week')startDate.setUTCDate(startDate.getUTCDate()-(startDate.getUTCDay()+6)%7);
  const endDate=new Date(startDate);if(options.period==='iso-week')endDate.setUTCDate(endDate.getUTCDate()+6);
  const start=startDate.toISOString().slice(0,10),end=endDate.toISOString().slice(0,10);trDay(start);trDay(end);
  trArray(records,512);const eligible=records.filter(trVisible).map(trRecord).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const byID=new Map();for(const record of eligible){if(byID.has(record.id))trFail();byID.set(record.id,record);}
  const rawTargets=options.targets??[];trArray(rawTargets,128);const targets=rawTargets.filter(trVisible).map(trTarget).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const publicIDs=new Set(byID.keys());for(const target of targets){if(publicIDs.has(target.id))trFail();publicIDs.add(target.id);}
  const publicRecords=eligible.map(record=>{
    const links=record.links.filter(link=>publicIDs.has(link.target)),missing=record.links.length-links.length,flags=[];
    if(missing)flags.push('unresolved-links');
    if(record.recordedOn===null)flags.push('recorded-date-not-supplied');
    else if(record.recordedOn>record.occurredOn)flags.push('recorded-after-occurrence');
    else if(record.recordedOn<record.occurredOn)flags.push('recorded-before-occurrence');
    const result={...record,links,kindLabel:trLabels[record.kind],unresolvedLinkCount:missing,flags,
      sourceQualification:trQualification(record.sourceKind)};
    if(record.supersedes!==undefined){
      if(!byID.has(record.supersedes)){delete result.supersedes;flags.push('unresolved-correction');}
      else{
        flags.push('declared-correction');let at=record.id;const visited=new Set();
        while(byID.get(at)?.supersedes!==undefined){if(visited.has(at)){flags.push('correction-cycle');break;}visited.add(at);at=byID.get(at).supersedes;}
      }
    }
    return result;
  });
  if(trEncoder.encode(trCanonical({publicRecords,targets})).length>TRANSPARENCY_LIMITS.totalBytes)trFail();
  const selected=publicRecords.filter(record=>record.occurredOn>=start&&record.occurredOn<=end)
    .sort((a,b)=>a.occurredOn<b.occurredOn?-1:a.occurredOn>b.occurredOn?1:trKinds.indexOf(a.kind)-trKinds.indexOf(b.kind)|| (a.id<b.id?-1:a.id>b.id?1:0));
  const days=[...new Set(selected.map(record=>record.occurredOn))].map(day=>({day,records:selected.filter(record=>record.occurredOn===day).map(record=>record.id)}));
  const basis={version:1,generatorVersion:TRANSPARENCY_VERSION,period:options.period,start,end,publicRecords,targets};
  const hashes={recordsSha256:await trDigest(publicRecords),sourceDigest:await trDigest(basis)};
  let review=null;
  if(options.review!==undefined){
    trFields(options.review,['reviewer','date','sourceDigest']);review={reviewer:trText(options.review.reviewer,256),date:trDay(options.review.date),sourceDigest:trHash(options.review.sourceDigest),
      authentication:'not-established',scope:'authored review declaration for these exact public records and period; no causal, institutional or external verification'};
    if(review.sourceDigest!==hashes.sourceDigest)trFail();
  }
  const report={version:1,kind:'gw-period-report',generatorVersion:TRANSPARENCY_VERSION,status:review?'author-reviewed-declaration':'draft',
    period:options.period,start,end,records:selected,targets,days,sourceDigest:hashes.sourceDigest,hashes,review,
    coverage:{scope:'explicit-public-author-reviewed-records',selectedPeriodOnly:true,completeWebsite:false},
    sourceQualification:[...publicRecords,...targets].some(row=>row.sourceKind==='published-cv-record')?
      ([...publicRecords,...targets].every(row=>row.sourceKind==='published-cv-record')?TRANSPARENCY_CV_SOURCE_QUALIFICATION:'Mixed declared source scopes: each row identifies whether its SHA-256 binds native content or an exact published CV record; no original QMD span or authenticated review is established.'):
      TRANSPARENCY_SOURCE_QUALIFICATION,
    interpretation:'Activities, outputs, outcomes and impacts retain their authored distinctions and qualifications. Links and temporal grouping do not establish cause, attribution, achievement or effectiveness.'};
  return trFreeze(report);
}

return {TRANSPARENCY_VERSION,TRANSPARENCY_SOURCE_QUALIFICATION,TRANSPARENCY_SOURCE_KINDS,TRANSPARENCY_CV_SOURCE_QUALIFICATION,TRANSPARENCY_LIMITS,buildPeriodReport};
})();

const sandbox_export = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Original problem-only export to the Sandbox's finite Boolean/Horn THY subset.
// No Sandbox implementation or runtime assets are copied into this package.
const SANDBOX_EXPORT_VERSION='gw-problem-only-thy-v1';
const SANDBOX_EXPORT_LIMITS=Object.freeze({atoms:40,rules:80,premises:40,bytes:99999});
const SANDBOX_SOURCE_QUALIFICATION='Caller-supplied public native-content SHA-256; no original QMD offsets, authenticated review, Sandbox import or proof acceptance is established.';
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
async function exportProblem(spec,context){
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
async function verifyProblemExport(value,options={}){
  sbFields(options,['context'],[]);sbFields(value,['version','filename','mediaType','text','receipt','spec','context']);sbCanonical(value);
  const current=options.context===undefined?null:sbContext(options.context),rebuilt=await exportProblem(value.spec,value.context);
  if(sbCanonical(value)!==sbCanonical(rebuilt)||current&&sbCanonical(current)!==sbCanonical(rebuilt.context))sbFail();return rebuilt;
}

return {SANDBOX_EXPORT_VERSION,SANDBOX_EXPORT_LIMITS,SANDBOX_SOURCE_QUALIFICATION,exportProblem,verifyProblemExport};
})();

const sandbox_session = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Original, data-only interchange. No Sandbox implementation is embedded.
const {verifyProblemExport} = sandbox_export;

const SANDBOX_SESSION_LIMITS=Object.freeze({threadBytes:20000000,capsuleBytes:28000000,stages:3,claimsPerStage:128,dependencies:32});
const SANDBOX_SESSION_QUALIFICATION='Imported completion, confirmed membership, epistemic and kernel statuses are reported only and have not been rechecked. Exact JSON preservation is not proof acceptance, authentication or learning assessment.';
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
function parseSessionCapsule(bytes){const parsed=ssParse(bytes,SANDBOX_SESSION_LIMITS.capsuleBytes);ssObject(parsed.value);if(parsed.value.kind!=='gw-sandbox-session-capsule'||parsed.value.version!==1)ssFail();return ssFreeze(parsed.value);}

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
async function inspectThreadSession(bytes,options={}){ssFields(options,['cryptoObject','signal'],[]);ssCheck(options.signal);return ssInspection(ssPrepare(bytes),options);}

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
async function validateSessionMappings(value=[],problemExports=[]){
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

async function createSessionCapsule(bytes,context,options={}){ssFields(options,['problemExport','journey','cryptoObject','signal'],['problemExport']);ssCheck(options.signal);const prepared=ssPrepare(bytes),bound=ssContext(context),problemExport=ssCopy(options.problemExport),journey=options.journey===undefined?undefined:ssJourney(options.journey),inspection=await ssInspection(prepared,options),association=await ssAssociate(prepared,bound,problemExport,options);
  const body={version:1,kind:'gw-sandbox-session-capsule',context:bound,thread:{encoding:'base64',mediaType:'application/json',byteLength:prepared.original.length,sha256:inspection.sha256,data:ssBase64(prepared.original)},association,qualification:SANDBOX_SESSION_QUALIFICATION};
  if(journey!==undefined){body.journey=journey;body.journeySha256=await ssHashJSON(body.journey,options);}
  const capsule={...body,hashes:{contextSha256:await ssHashJSON(bound,options),capsuleSha256:await ssHashJSON(body,options)}};if(ssEncoder.encode(ssCanonical(capsule)).length>SANDBOX_SESSION_LIMITS.capsuleBytes)ssFail();ssCheck(options.signal);return ssFreeze(capsule);
}
async function validateSessionCapsule(value,currentContext,options={}){ssFields(options,['problemExport','cryptoObject','signal'],['problemExport']);ssCheck(options.signal);const serialized=ssCanonical(value);if(ssEncoder.encode(serialized).length>SANDBOX_SESSION_LIMITS.capsuleBytes)ssFail();value=JSON.parse(serialized);const body=ssCapsuleBody(value),bound=ssContext(currentContext),problemExport=ssCopy(options.problemExport);ssFields(value.hashes,['contextSha256','capsuleSha256']);
  if(ssCanonical(body.context)!==ssCanonical(bound)||ssDigest(value.hashes.contextSha256)!==await ssHashJSON(bound,options)||ssDigest(value.hashes.capsuleSha256)!==await ssHashJSON(body,options))ssFail('stale-capsule');
  if(body.journey!==undefined&&body.journeySha256!==await ssHashJSON(body.journey,options))ssFail('changed-journey');const bytes=ssUnbase64(body.thread.data,body.thread.byteLength),prepared=ssPrepare(bytes),inspection=await ssInspection(prepared,options);
  if(inspection.sha256!==body.thread.sha256)ssFail('changed-thread-bytes');const association=await ssAssociate(prepared,bound,problemExport,options);if(ssCanonical(association)!==ssCanonical(body.association))ssFail('changed-association');
  const receipt={version:1,kind:'gw-sandbox-capsule-receipt',threadSha256:inspection.sha256,contextSha256:value.hashes.contextSha256,capsuleSha256:value.hashes.capsuleSha256,threadRestoration:'exact-original-bytes-only',proofStatus:'reported-unverified',journeyStatus:body.journey===undefined?'absent':'requires-current-producer-validation',qualification:SANDBOX_SESSION_QUALIFICATION};
  ssCheck(options.signal);return ssFreeze({bytes,inspection,context:bound,...(body.journey===undefined?{}:{journey:body.journey}),receipt});
}

/** A deliberately finite AIF view. Unsupported material is reported as a loss,
 * never repaired into a premise or certified proof. Original Thread bytes stay
 * the separate lossless restoration object. */
async function projectArgumentInterchange(bytes,options={}){ssFields(options,['format','cryptoObject','signal','context','problemExport','pedagogy'],['format']);if(!['aif','xaif'].includes(options.format)||(options.context===undefined)!==(options.problemExport===undefined)||options.pedagogy!==undefined&&options.context===undefined)ssFail();ssCheck(options.signal);
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

return {SANDBOX_SESSION_LIMITS,SANDBOX_SESSION_QUALIFICATION,parseSessionCapsule,inspectThreadSession,validateSessionMappings,createSessionCapsule,validateSessionCapsule,projectArgumentInterchange};
})();

const delivery = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Explicit, bounded public-page delivery. Observed bytes are not build attestation.
const {validateAdaptationPage} = adaptation;
const {validateAssertionRegistry} = assertions;

const DELIVERY_LIMITS=Object.freeze({pages:32,objects:500,files:512,pageBytes:2097152,assetBytes:16777216,totalBytes:67108864,jsonBytes:1048576,depth:16,expressions:512,visits:20000,cssDepth:8});
const utf8=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true}),hex=/^[a-f0-9]{64}$/u,native=/^[A-Za-z][A-Za-z0-9._:-]{0,127}$/u;
const forbidden=/(?:^|\/)(?:\.git|\.quarto|_extensions|local-ai-assets|api|argumentation-sandbox)(?:\/|$)|(?:^|\/)\.env(?:\.|$)|\.(?:litertlm|tflite|onnx|gguf|safetensors|bin|ckpt)(?:$|[?#])/iu;
const freeze=value=>{if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;};
const fail=message=>{throw new TypeError('generative-websites delivery: '+message);};
function object(value,keys,required=keys){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail('expected an ordinary object');for(const key of Reflect.ownKeys(value)){const d=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!keys.includes(key)||!d.enumerable||!Object.hasOwn(d,'value'))fail('unknown or non-JSON field');}for(const key of required)if(!Object.hasOwn(value,key))fail('missing '+key);return value;}
function array(value,max,min=0){if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<min||value.length>max||Reflect.ownKeys(value).length!==value.length+1)fail('invalid bounded dense array');for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('invalid array data');}return value;}
function text(value,max=256){if(typeof value!=='string'||!value||value!==value.trim()||utf8.encode(value).length>max||/[\u0000-\u001f\u007f\ud800-\udfff]/u.test(value))fail('invalid bounded text');return value;}
function id(value){text(value,128);if(!native.test(value)||['constructor','prototype','__proto__'].includes(value))fail('invalid identifier');return value;}
function base(value){let url;try{url=new URL(value);}catch{fail('invalid site base');}if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||!url.pathname.endsWith('/'))fail('site base must be an ordinary HTTP(S) directory URL');return url;}
function local(value,root,{fragment=false}={}){text(value,2048);if(value.startsWith('/')||/[\\:?<>"'\s]/u.test(value)||value.startsWith('#')||(!fragment&&value.includes('#')))fail('expected a project-root-relative public output URL');const path=value.split('#')[0];let decoded;try{decoded=decodeURIComponent(path);}catch{fail('invalid URL encoding');}if(decoded.includes('%')||decoded.includes('\\')||decoded.split('/').some(part=>!part||part==='.'||part==='..')||/%(?:2f|5c)/iu.test(path)||forbidden.test(decoded))fail('unsafe or excluded public output path');const url=new URL(value,root);if(url.origin!==root.origin||!url.pathname.startsWith(root.pathname)||url.search)fail('URL escaped the project output');if(fragment){try{decodeURIComponent(url.hash.slice(1));}catch{fail('invalid anchor encoding');}}return url;}
function language(value){text(value,64);try{const result=Intl.getCanonicalLocales(value);if(result.length!==1)fail('invalid language');return result[0];}catch{fail('invalid BCP47 language');}}
function clone(value){return JSON.parse(JSON.stringify(value));}
function validatePublication(value,{baseURL}={}){const root=base(baseURL);object(value,['version','id','revision','pages','assets','withdrawn','expiresAt'],['version','id','revision','pages','assets','withdrawn']);if(value.version!==1)fail('unsupported publication version');id(value.id);text(value.revision,128);const seen=new Set(),pageIDs=new Set();array(value.pages,DELIVERY_LIMITS.pages,1).forEach(page=>{object(page,['url','id','revision','sourceDigest','language'],['url','id','revision']);id(page.id);text(page.revision,128);if(page.language!==undefined)language(page.language);const url=local(page.url,root);if(!/\.html$/iu.test(url.pathname)||seen.has(url.href)||pageIDs.has(page.id))fail('duplicate or invalid page');if(page.sourceDigest!==undefined&&!/^sha1:[a-f0-9]{40}$/u.test(page.sourceDigest))fail('invalid native source digest');seen.add(url.href);pageIDs.add(page.id);});array(value.assets,DELIVERY_LIMITS.files).forEach(path=>{const url=local(path,root);if(seen.has(url.href))fail('duplicate publication URL');seen.add(url.href);});const withdrawn=new Set();array(value.withdrawn,DELIVERY_LIMITS.files).forEach(path=>{const url=local(path,root);if(withdrawn.has(url.href)||seen.has(url.href))fail('withdrawn URL is duplicate or still published');withdrawn.add(url.href);});if(value.expiresAt!==undefined&&(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/u.test(value.expiresAt)||!Number.isFinite(Date.parse(value.expiresAt))))fail('invalid expiry');return freeze(clone(value));}
function validatePublicPage(value,{baseURL}={}){const root=base(baseURL);object(value,['version','kind','project','page','adaptation','assertions','objects']);if(value.version!==1||value.kind!=='generative-public-page')fail('unsupported public page');object(value.project,['id','revision']);id(value.project.id);text(value.project.revision,128);object(value.page,['id','url','language','revision','sourceDigest']);id(value.page.id);text(value.page.revision,128);language(value.page.language);if(!/^sha1:[a-f0-9]{40}$/u.test(value.page.sourceDigest))fail('invalid language or native digest');const pageURL=local(value.page.url,root);if(!/\.html$/iu.test(pageURL.pathname))fail('page is not HTML');let expressions=0;const expression=(v,depth)=>{if(v===null)return;if(depth>16||++expressions>512)fail('prerequisite expression budget exceeded');object(v,['ref','all','any'],[]);const keys=Object.keys(v);if(keys.length!==1)fail('prerequisite needs exactly one operator');if(keys[0]==='ref'){text(v.ref,260);const parts=v.ref.split('#');if(parts.length!==2)fail('prerequisite must be pageId#nativeId');parts.forEach(id);}else array(v[keys[0]],50,1).forEach(child=>expression(child,depth+1));};const ids=new Set();array(value.objects,DELIVERY_LIMITS.objects).forEach(item=>{object(item,['id','conceptId','revision','label','context','url','prerequisites']);id(item.id);if(ids.has(item.id))fail('duplicate object');ids.add(item.id);text(item.conceptId,512);if(!/^[A-Za-z][A-Za-z0-9+.-]*:[^\s<>"']+$/u.test(item.conceptId))fail('invalid scoped concept URI');text(item.revision,128);text(item.label,256);text(item.context,128);const url=local(item.url,root,{fragment:true});if(url.origin+url.pathname!==pageURL.href||decodeURIComponent(url.hash.slice(1))!==item.id)fail('object destination must be its containing native anchor');expression(item.prerequisites,0);});if(value.adaptation!==null){const adaptation=validateAdaptationPage(value.adaptation,{baseURL:root.href});if(adaptation.page.id!==value.page.id||adaptation.page.url!==value.page.url||language(adaptation.page.language)!==language(value.page.language)||adaptation.page.sourceDigest!==value.page.sourceDigest)fail('adaptation belongs to a different native page');for(const item of adaptation.objects){const owner=value.objects.find(object=>object.id===item.id);if(!owner||owner.revision!==item.revision||item.context!==undefined&&item.context!==owner.context)fail('adaptation object identity differs from the public object');}}if(value.assertions!==null)validateAssertionRegistry(value.assertions);return freeze(clone(value));}

// Original small JSON reader preserves duplicate-key refusal before JSON.parse.
function parseDeliveryJSON(input,{maxBytes=DELIVERY_LIMITS.jsonBytes}={}){if(typeof input!=='string'||utf8.encode(input).length>maxBytes)fail('JSON exceeds byte budget');let at=0,nodes=0;const space=()=>{while(/[\x20\t\r\n]/u.test(input[at]??'!'))at++;};const string=()=>{const start=at++;while(at<input.length){const c=input[at++];if(c==='"'){let result;try{result=JSON.parse(input.slice(start,at));}catch{fail('invalid JSON string');}if(/[\ud800-\udfff]/u.test(result))fail('unpaired JSON surrogate');return result;}if(c==='\\')at++;else if(c<' ')fail('invalid JSON string');}fail('unterminated JSON string');};const read=depth=>{space();if(depth>24||++nodes>30000)fail('JSON structure budget exceeded');const c=input[at];if(c==='"')return string();if(c==='{'||c==='['){at++;const out=c==='{'?Object.create(null):[],seen=new Set();space();if(input[at]===(c==='{'?'}':']')){at++;return out;}while(true){space();let key;if(c==='{'){if(input[at]!=='"')fail('expected JSON key');key=string();if(seen.has(key))fail('duplicate JSON key');seen.add(key);space();if(input[at++]!==':')fail('expected JSON colon');}const value=read(depth+1);if(c==='{')out[key]=value;else out.push(value);space();const end=input[at++];if(end===(c==='{'?'}':']'))return out;if(end!==',')fail('invalid JSON delimiter');}}const match=/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/u.exec(input.slice(at));if(!match)fail('invalid JSON value');at+=match[0].length;const result=JSON.parse(match[0]);if(typeof result==='number'&&!Number.isFinite(result))fail('nonfinite JSON number');return result;};const value=read(0);space();if(at!==input.length)fail('trailing JSON data');return value;}
async function digest(bytes,cryptoObject=globalThis.crypto){if(!cryptoObject?.subtle)fail('secure SHA256 is unavailable');return [...new Uint8Array(await cryptoObject.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}
function check(signal){if(signal?.aborted)throw signal.reason??new DOMException('Cancelled','AbortError');}
async function fetchBytes(url,maximum,{fetchImpl,signal}){check(signal);const response=await fetchImpl(url,{signal,credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',cache:'no-store'});if(!response?.ok||response.redirected||response.url&&response.url!==url)fail('public file unavailable or redirected');const declared=response.headers?.get('content-length');if(declared&&(!/^\d+$/u.test(declared)||Number(declared)>maximum))fail('public file exceeds byte budget');let bytes;if(response.body?.getReader){const reader=response.body.getReader(),parts=[];let count=0;try{while(true){check(signal);const next=await reader.read();if(next.done)break;if(!(next.value instanceof Uint8Array)||(count+=next.value.byteLength)>maximum)fail('public file exceeds byte budget');parts.push(next.value);}bytes=new Uint8Array(count);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}}catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}}else{bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>maximum)fail('public file exceeds byte budget');}check(signal);const cached=response.headers?.get('x-generative-offline-snapshot');return {bytes,contentType:response.headers?.get('content-type')??'application/octet-stream',observation:cached!==null&&cached!==undefined?{mode:'prepared-offline-snapshot',snapshot:String(cached).slice(0,128),lastChecked:response.headers?.get('x-generative-offline-checked')??null}:{mode:'network-observation'}};}
function htmlEntity(value){return value.replace(/&([^;\s]{1,32});/gu,(_,name)=>{const simple={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};if(Object.hasOwn(simple,name))return simple[name];if(/^#(?:[0-9]+|x[0-9a-f]+)$/iu.test(name)){const n=name[1].toLowerCase()==='x'?parseInt(name.slice(2),16):Number(name.slice(1));if(n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff))return String.fromCodePoint(n);}fail('unsupported HTML entity in a critical attribute');});}
function htmlTag(html,start){
 let at=start+1,closing=false;if(html[at]==='/'){closing=true;at++;}const name=/^[A-Za-z][A-Za-z0-9:-]*/u.exec(html.slice(at));if(!name)return null;at+=name[0].length;const attributes=Object.create(null);let selfClosing=false;
 while(at<html.length){while(/[\t\n\r\f ]/u.test(html[at]??'!'))at++;if(html[at]==='>')return {name:name[0].toLowerCase(),attributes,end:at+1,closing,selfClosing};if(html[at]==='/'&&html[at+1]==='>'){selfClosing=true;return {name:name[0].toLowerCase(),attributes,end:at+2,closing,selfClosing};}const key=/^[^\s/=>\u0000-\u001f"'<\x60]+/u.exec(html.slice(at));if(!key)fail('malformed native HTML');at+=key[0].length;const lower=key[0].toLowerCase();if(Object.hasOwn(attributes,lower))fail('duplicate HTML attribute');while(/[\t\n\r\f ]/u.test(html[at]??'!'))at++;let value='';if(html[at]==='='){at++;while(/[\t\n\r\f ]/u.test(html[at]??'!'))at++;const quote=html[at];if(quote==='"'||quote==="'"){const end=html.indexOf(quote,++at);if(end<0)fail('unclosed HTML attribute');value=html.slice(at,end);at=end+1;}else{const match=/^[^\s>"'\x60=<]+/u.exec(html.slice(at));if(!match)fail('invalid HTML attribute');value=match[0];at+=value.length;}}attributes[lower]=value;
 }fail('unclosed HTML tag');
}
function scanHTML(html){
 const ids=new Map(),eligibleIds=new Set(),resources=[],inlineCSS=[],inlineScripts=[];let payload=null,at=0,tags=0,templateDepth=0,inSelect=false;
 const rawTags=new Set(['script','style','textarea','title','xmp','iframe','noembed','noframes','noscript']);
 while(at<html.length){const start=html.indexOf('<',at);if(start<0)break;
  if(html.startsWith('<!--',start)){const end=html.indexOf('-->',start+4);if(end<0)fail('unclosed HTML comment');at=end+3;continue;}
  if(html.startsWith('<![CDATA[',start)){const end=html.indexOf(']]>',start+9);if(end<0)fail('unclosed CDATA');at=end+3;continue;}
  if(html.startsWith('<!',start)||html.startsWith('<?',start)){const end=html.indexOf('>',start+2);if(end<0)fail('unclosed declaration');at=end+1;continue;}
  const tag=htmlTag(html,start);if(!tag){at=start+1;continue;}if(++tags>50000)fail('HTML token budget exceeded');at=tag.end;const a=tag.attributes;
  if(inSelect&&!['option','optgroup','hr','script','template',...(tag.closing?['select']:[])].includes(tag.name))fail('unsupported native markup inside select');
  if(tag.closing){if(tag.name==='template')templateDepth=Math.max(0,templateDepth-1);if(tag.name==='select')inSelect=false;continue;}
  if(tag.name==='select')inSelect=true;
  if(!templateDepth&&Object.hasOwn(a,'id')){const value=htmlEntity(a.id);ids.set(value,(ids.get(value)??0)+1);if(!rawTags.has(tag.name)&&!['template','plaintext'].includes(tag.name))eligibleIds.add(value);}
  if(tag.name==='plaintext')break;
  if(tag.name==='template'){templateDepth++;continue;}
  if(rawTags.has(tag.name)){
   const close=new RegExp('</'+tag.name+'\\s*>','giu');close.lastIndex=at;const found=close.exec(html);if(!found)fail('unclosed raw HTML element');const body=html.slice(at,found.index);
   const marker=(a.class??'').split(/[\t\n\r\f ]+/u).includes('generative-public-data');
   if(marker){if(tag.name!=='script'||templateDepth||tag.selfClosing||a.type!=='application/json'||a.class!=='generative-public-data'||Object.keys(a).some(key=>!['type','class'].includes(key))||payload!==null||body.includes('<'))fail('invalid or duplicate native catalogue marker');payload=body;}
   else if(!templateDepth&&tag.name==='script'){if(a.src)resources.push({url:htmlEntity(a.src),kind:'script'});else if(!a.type||/^(?:module|text\/javascript|application\/javascript)$/iu.test(a.type))inlineScripts.push(body);}
   else if(!templateDepth&&tag.name==='style')inlineCSS.push(body);
   else if(!templateDepth&&tag.name==='iframe'&&(a.src||a.srcdoc))resources.push({url:a.src?htmlEntity(a.src):'',kind:'unsupported-frame'});
   at=close.lastIndex;continue;
  }
  if(templateDepth)continue;
  if(tag.name==='link'&&a.href&&a.rel?.toLowerCase().split(/\s+/u).includes('stylesheet'))resources.push({url:htmlEntity(a.href),kind:'style'});
  if(['img','source','audio','video','track','embed','object','input','image','use'].includes(tag.name)){
   if(a.srcset)resources.push({url:'',kind:'unsupported-srcset'});
   const value=a.src??a.data??(['image','use'].includes(tag.name)?a.href??a['xlink:href']:null);if(value&&!value.startsWith('data:')&&!value.startsWith('#'))resources.push({url:htmlEntity(value),kind:'asset'});
   if(a.poster&&!a.poster.startsWith('data:'))resources.push({url:htmlEntity(a.poster),kind:'asset'});
  }
  if(a.style)inlineCSS.push(a.style);
 }
 if(payload===null)fail('native public catalogue is missing');return {payload,ids,eligibleIds,resources,inlineCSS,inlineScripts};
}
function publicAnchors(data){return [...data.objects.map(item=>item.id),...(data.adaptation?.objects??[]).flatMap(item=>item.groups.flatMap(group=>group.variants.map(variant=>variant.anchor)))];}
async function loadPublication(input,{baseURL,fetchImpl=globalThis.fetch?.bind(globalThis),cryptoObject=globalThis.crypto,signal,onProgress=()=>{}}={}){const publication=validatePublication(input,{baseURL}),root=base(baseURL);if(!fetchImpl)fail('fetch is unavailable');const pages=[];let total=0;for(const expected of publication.pages){check(signal);onProgress({pageId:expected.id,status:'pending'});try{const url=local(expected.url,root).href,observed=await fetchBytes(url,DELIVERY_LIMITS.pageBytes,{fetchImpl,signal});if(!/^text\/html(?:;|$)/iu.test(observed.contentType))fail('published page is not HTML');total+=observed.bytes.length;if(total>DELIVERY_LIMITS.totalBytes)fail('publication byte budget exceeded');const html=decoder.decode(observed.bytes),scanned=scanHTML(html),data=validatePublicPage(parseDeliveryJSON(scanned.payload),{baseURL});if(data.project.id!==publication.id||data.project.revision!==publication.revision||data.page.id!==expected.id||data.page.revision!==expected.revision||local(data.page.url,root).href!==url||expected.sourceDigest&&data.page.sourceDigest!==expected.sourceDigest||expected.language&&language(data.page.language)!==language(expected.language))fail('public page revision or identity mismatch');for(const anchor of publicAnchors(data))if(scanned.ids.get(anchor)!==1||!scanned.eligibleIds.has(anchor))fail('native object or variant anchor is missing or ambiguous');check(signal);pages.push({id:expected.id,status:'complete',url,data,observedSha256:await digest(observed.bytes,cryptoObject),bytes:observed.bytes.length,body:observed.bytes,contentType:observed.contentType,observation:observed.observation,resources:scanned.resources,inlineCSS:scanned.inlineCSS});onProgress({pageId:expected.id,status:'complete'});}catch(error){check(signal);pages.push({id:expected.id,status:'failed',reason:String(error.message).slice(0,240)});onProgress({pageId:expected.id,status:'failed'});}}check(signal);return {version:1,kind:'observed-publication',publication,baseURL:root.href,status:pages.every(page=>page.status==='complete')?'complete':'partial',pages,scope:'explicit-public-pages',attestation:'observed-bytes-not-build-attestation'};}
function selectClosure(catalogue,{pageId,objectId}={}){if(catalogue?.kind!=='observed-publication')fail('load a publication first');id(pageId);id(objectId);const byID=new Map();for(const page of catalogue.pages)if(page.status==='complete')for(const item of page.data.objects)byID.set(page.id+'#'+item.id,{...item,pageId:page.id,pageURL:page.url});const goal=byID.get(pageId+'#'+objectId);if(!goal)return {status:'unavailable',steps:[],reason:'The selected public object is unavailable.'};let visits=0;const done=new Set(),visiting=new Set(),steps=[],choices=[];const visit=(key,parent)=>{if(++visits>DELIVERY_LIMITS.visits)throw Error('Route visit budget exceeded.');const item=byID.get(key);if(!item)throw Error('A required public object is unavailable.');if(item.context!==goal.context)throw Error('A prerequisite context is incompatible.');if(done.has(key))return;if(visiting.has(key))throw Error('A prerequisite cycle prevents this route.');visiting.add(key);try{expression(item.prerequisites,key);done.add(key);steps.push({key,pageId:item.pageId,id:item.id,url:new URL(item.url,catalogue.baseURL).href,reason:parent?'Prerequisite for '+parent:'Selected goal'});}finally{visiting.delete(key);}};const expression=(value,owner)=>{if(value===null)return;if(value.ref){visit(value.ref,owner);return;}if(value.all){for(const child of value.all)expression(child,owner);return;}for(let index=0;index<value.any.length;index++){const savedDone=new Set(done),length=steps.length,choiceLength=choices.length;try{expression(value.any[index],owner);choices.push({owner,selected:index});return;}catch{done.clear();for(const key of savedDone)done.add(key);steps.length=length;choices.length=choiceLength;}}throw Error('No available authored prerequisite alternative.');};try{visit(pageId+'#'+objectId,null);return freeze({version:1,status:'complete',project:{id:catalogue.publication.id,revision:catalogue.publication.revision},goal:pageId+'#'+objectId,steps,choices,pageIds:[...new Set(steps.map(step=>step.pageId))]});}catch(error){return freeze({status:'unavailable',steps:[],reason:error.message});}}

function assetURL(value,owner,root){if(typeof value!=='string'||!value||value.length>2048||/[\u0000-\u001f\u007f]/u.test(value))fail('unsupported static asset URL');if(/^data:/iu.test(value))return null;if(/[\\\u0020]/u.test(value)||/%(?:2f|5c|25)/iu.test(value))fail('unsupported static asset URL');let url;try{url=new URL(value,owner);}catch{fail('invalid static asset URL');}if(url.origin!==root.origin||!url.pathname.startsWith(root.pathname)||url.username||url.password)fail('an external critical asset prevents offline readiness');if(url.search&&!/^\?(?:v=)?[a-f0-9._-]{6,128}$/iu.test(url.search))fail('a dynamic asset query prevents offline readiness');const path=url.pathname.slice(root.pathname.length);local(path,root);url.hash='';if(!/\.(?:html|css|js|mjs|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot|mp[34]|ogg|webm|wav|vtt|pdf)$/iu.test(url.pathname))fail('unsupported critical asset type');return url.href;}
function hasModuleReferences(script){return /\bimport\b(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*(?:\n|$))*(?:\(|["'{*]|(?:[$_\p{ID_Start}]|\\u(?:[a-fA-F0-9]{4}|\{[a-fA-F0-9]{1,6}\}))(?:[$_\u200c\u200d\p{ID_Continue}]|\\u(?:[a-fA-F0-9]{4}|\{[a-fA-F0-9]{1,6}\}))*(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*(?:\n|$))*(?:,|from\b))/u.test(script)||/\bexport\b(?:\s|\/\*[\s\S]*?\*\/)*(?:\*|\{[\s\S]*?\})(?:\s|\/\*[\s\S]*?\*\/)*from\b/u.test(script);}
function cssURLs(css){if(css.includes('/*')&&!/\/\*[\s\S]*?\*\//u.test(css))fail('unclosed CSS comment');css=css.replace(/\/\*[\s\S]*?\*\//gu,'');const out=[];const pattern=/url\(\s*(?:"([^"\n]*)"|'([^'\n]*)'|([^\s)'"(]+))\s*\)|@import\s+(?:"([^"\n]+)"|'([^'\n]+)')/giu;for(const m of css.matchAll(pattern)){const value=m[1]??m[2]??m[3]??m[4]??m[5];if(value.includes('\\'))fail('CSS escaped URLs require an explicit supported asset');if(value&&!value.startsWith('#'))out.push(value);}const removed=css.replace(pattern,'');if(/@import\b|\burl\s*\(/iu.test(removed))fail('unsupported CSS resource syntax');return out;}
async function offlineCachePrefix(baseURL,{cryptoObject=globalThis.crypto}={}){return 'quarto-generative-v1-'+(await digest(utf8.encode(base(baseURL).href),cryptoObject)).slice(0,24)+'-';}
const commitURL=root=>new URL('.gw-offline/complete',root).href;
const consentURL=root=>new URL('.gw-offline/consent',root).href;
async function stateCache(cacheStorage,root,prefix){const name=prefix+'client-state';if(!(await cacheStorage.keys()).includes(name))return null;const cache=await cacheStorage.open(name),response=await cache.match(consentURL(root));if(!response)return null;try{const data=parseDeliveryJSON(decoder.decode((await fetchBytes(consentURL(root),2048,{fetchImpl:async()=>response})).bytes));object(data,['version','kind','baseURL']);if(data.version!==1||data.kind!=='gw-offline-state-consent'||data.baseURL!==root.href)return null;return cache;}catch{return null;}}
async function stateSummary(cacheStorage,root,prefix,now){const cache=await stateCache(cacheStorage,root,prefix);if(!cache)return {status:'missing',associations:0,staleAssociations:0};let associations=0,staleAssociations=0;if(cache.keys)for(const request of await cache.keys()){const url=typeof request==='string'?request:request.url;if(url===consentURL(root))continue;associations++;try{const response=await cache.match(request),data=parseDeliveryJSON(decoder.decode((await fetchBytes(url,2048,{fetchImpl:async()=>response})).bytes));if(!['snapshot','network'].includes(data.mode)||!Number.isFinite(Date.parse(data.expiresAt))||Date.parse(data.expiresAt)<=now||data.mode==='snapshot'&&!(await cacheStorage.keys()).includes(data.snapshot))staleAssociations++;}catch{staleAssociations++;}}return {status:'available',associations,staleAssociations};}
async function pruneAssociations(cacheStorage,root,prefix,removed){const cache=await stateCache(cacheStorage,root,prefix);if(!cache?.keys)return;for(const request of await cache.keys()){const url=typeof request==='string'?request:request.url;if(url===consentURL(root))continue;try{const response=await cache.match(request),data=parseDeliveryJSON(decoder.decode((await fetchBytes(url,2048,{fetchImpl:async()=>response})).bytes));if(data.mode==='snapshot'&&removed.has(data.snapshot))await cache.delete(request);}catch{await cache.delete(request);}}}

async function metadata(cache,root){const response=await cache.match(commitURL(root));if(!response)return null;let data;try{data=parseDeliveryJSON(decoder.decode((await fetchBytes(commitURL(root),DELIVERY_LIMITS.jsonBytes,{fetchImpl:async()=>response})).bytes));object(data,['version','kind','baseURL','project','createdAt','expiresAt','selection','files','scope','attestation']);if(data.version!==1||data.kind!=='gw-offline-commit'||data.baseURL!==root.href||data.scope!=='selected-route-static-assets'||data.attestation!=='observed-bytes-not-build-attestation')return null;object(data.project,['id','revision']);id(data.project.id);text(data.project.revision,128);if(!Number.isFinite(Date.parse(data.createdAt))||!Number.isFinite(Date.parse(data.expiresAt)))return null;array(data.files,DELIVERY_LIMITS.files,1);let total=0;const seen=new Set();for(const file of data.files){object(file,['url','sha256','bytes','contentType']);const url=assetURL(file.url,root,root);if(!url||seen.has(url)||!hex.test(file.sha256)||!Number.isSafeInteger(file.bytes)||file.bytes<0||file.bytes>DELIVERY_LIMITS.assetBytes||(total+=file.bytes)>DELIVERY_LIMITS.totalBytes)return null;seen.add(url);text(file.contentType,256);}return data;}catch{return null;}}
async function inspectOffline({baseURL,cacheStorage=globalThis.caches,cryptoObject=globalThis.crypto,now=Date.now()}={}){const root=base(baseURL),prefix=await offlineCachePrefix(root.href,{cryptoObject});if(!cacheStorage?.keys)return {status:'unavailable',snapshots:[],reason:'Browser cache storage is unavailable.'};const state=await stateSummary(cacheStorage,root,prefix,now),snapshots=[];for(const name of await cacheStorage.keys()){if(!name.startsWith(prefix)||name===prefix+'client-state')continue;const cache=await cacheStorage.open(name),data=await metadata(cache,root);if(!data){snapshots.push({name,status:'incomplete'});continue;}let status=Date.parse(data.expiresAt)<=now?'expired':'complete';for(const file of data.files){const response=await cache.match(file.url);if(!response){status='incomplete';break;}const {bytes}=await fetchBytes(file.url,file.bytes,{fetchImpl:async()=>response});if(bytes.length!==file.bytes||await digest(bytes,cryptoObject)!==file.sha256){status='incomplete';break;}}snapshots.push({name,status,...data,offlineChanges:'New revisions and withdrawals cannot be checked while offline.'});}return {status:state.status==='available'&&snapshots.some(item=>item.status==='complete')?'ready':snapshots.length?'not-ready':'not-prepared',snapshots,state};}
async function applyOfflineWithdrawals(input,{baseURL,cacheStorage=globalThis.caches,cryptoObject=globalThis.crypto}={}){const publication=validatePublication(input,{baseURL}),root=base(baseURL);if(!cacheStorage?.keys||!publication.withdrawn.length)return {deleted:0};const prefix=await offlineCachePrefix(root.href,{cryptoObject}),withdrawn=new Set(publication.withdrawn.map(path=>local(path,root).href));let deleted=0;const removed=new Set();for(const name of await cacheStorage.keys()){if(!name.startsWith(prefix)||name===prefix+'client-state')continue;const data=await metadata(await cacheStorage.open(name),root);if(data?.project.id===publication.id&&data.files.some(file=>withdrawn.has(file.url))){await cacheStorage.delete(name);removed.add(name);deleted++;}}await pruneAssociations(cacheStorage,root,prefix,removed);if(!(await cacheStorage.keys()).some(name=>name.startsWith(prefix)&&name!==prefix+'client-state'))await cacheStorage.delete(prefix+'client-state');return {deleted};}
async function clearOffline({baseURL,cacheStorage=globalThis.caches,cryptoObject=globalThis.crypto,serviceWorker=globalThis.navigator?.serviceWorker,workerURL='gw-offline-worker.js'}={}){const root=base(baseURL),prefix=await offlineCachePrefix(root.href,{cryptoObject});let deleted=0;if(cacheStorage?.keys)for(const name of await cacheStorage.keys())if(name.startsWith(prefix)){await cacheStorage.delete(name);deleted++;}let unregistered=false;const worker=assetURL(workerURL,root,root);if(serviceWorker?.getRegistration){const registration=await serviceWorker.getRegistration(root.href);if(registration?.scope===root.href&&[registration.active,registration.waiting,registration.installing].filter(Boolean).every(item=>item.scriptURL===worker))unregistered=await registration.unregister();}return {deleted,unregistered,scope:'only-this-project-generative-cache'};}

async function prepareOffline(catalogue,selection,{consent=false,workerURL='gw-offline-worker.js',cacheStorage=globalThis.caches,serviceWorker=globalThis.navigator?.serviceWorker,fetchImpl=globalThis.fetch?.bind(globalThis),cryptoObject=globalThis.crypto,signal,onProgress=()=>{},now=Date.now(),maxBytes=DELIVERY_LIMITS.totalBytes,expiresDays=7}={}){
 if(consent!==true)fail('explicit offline-storage consent is required');if(!Number.isSafeInteger(maxBytes)||maxBytes<1024||maxBytes>DELIVERY_LIMITS.totalBytes||!Number.isSafeInteger(expiresDays)||expiresDays<1||expiresDays>30)fail('offline size or expiry option is outside its bounded range');if(!cacheStorage?.open||!serviceWorker?.register||!fetchImpl)fail('offline storage or service workers are unavailable');const root=base(catalogue?.baseURL),publication=validatePublication(catalogue.publication,{baseURL:root.href}),worker=assetURL(workerURL,root,root);if(!worker||new URL(worker).pathname!==root.pathname+'gw-offline-worker.js')fail('worker must be the dedicated project-root service worker');const registration=await serviceWorker.getRegistration?.(root.href);if(registration&&(registration.scope!==root.href||[registration.active,registration.waiting,registration.installing].filter(Boolean).some(item=>item.scriptURL!==worker)))fail('an unrelated service worker already controls this deployment scope');
 const parts=selection?.goal?.split('#')??[],expected=parts.length===2?selectClosure(catalogue,{pageId:parts[0],objectId:parts[1]}):null;if(!expected||expected.status!=='complete'||JSON.stringify(expected)!==JSON.stringify(selection))fail('a complete current prerequisite closure is required');if(publication.expiresAt&&Date.parse(publication.expiresAt)<=now)fail('this offline publication has expired');await applyOfflineWithdrawals(publication,{baseURL:root.href,cacheStorage,cryptoObject});check(signal);
 const files=new Map(),queue=[],rootPageURLs=new Set();let total=0;
 const add=(url,bytes,contentType)=>{if(files.has(url))return;if(files.size>=DELIVERY_LIMITS.files||(total+=bytes.length)>maxBytes)fail('offline file or total byte budget exceeded');files.set(url,{url,body:bytes,bytes:bytes.length,contentType});};
 for(const pageId of expected.pageIds){const page=catalogue.pages.find(item=>item.id===pageId&&item.status==='complete');if(!page)fail('a required page is unavailable');if(page.observation?.mode==='prepared-offline-snapshot')fail('offline-served bytes cannot refresh offline preparation or its expiry');const declared=publication.pages.find(item=>item.id===pageId);if(!declared||local(declared.url,root).href!==page.url||page.data.page.revision!==declared.revision||declared.sourceDigest&&declared.sourceDigest!==page.data.page.sourceDigest)fail('selected page is outside the admitted publication');const body=new Uint8Array(page.body);if(body.length!==page.bytes||await digest(body,cryptoObject)!==page.observedSha256)fail('observed page bytes changed after validation');const scanned=scanHTML(decoder.decode(body)),data=validatePublicPage(parseDeliveryJSON(scanned.payload),{baseURL:root.href});if(JSON.stringify(data)!==JSON.stringify(page.data)||data.project.id!==publication.id||data.project.revision!==publication.revision)fail('observed page catalogue changed');add(page.url,body,page.contentType);rootPageURLs.add(page.url);for(const item of scanned.resources)queue.push({...item,owner:page.url,depth:0});for(const script of scanned.inlineScripts)if(hasModuleReferences(script))fail('inline script has unlisted dynamic module dependencies');for(const css of scanned.inlineCSS)for(const url of cssURLs(css))queue.push({url,kind:'asset',owner:page.url,depth:0});}
 for(const url of publication.assets)queue.push({url,kind:'asset',owner:root.href,depth:0});
 while(queue.length){check(signal);const item=queue.shift();if(item.kind.startsWith('unsupported-'))fail('unsupported embedded or responsive content prevents offline readiness');const url=assetURL(item.url,item.owner,root);if(url===null||files.has(url))continue;if(item.depth>DELIVERY_LIMITS.cssDepth)fail('CSS dependency depth exceeded');onProgress({status:'pending',url});const observed=await fetchBytes(url,Math.min(DELIVERY_LIMITS.assetBytes,maxBytes-total),{fetchImpl,signal});if(observed.observation.mode==='prepared-offline-snapshot')fail('offline-served assets cannot refresh offline preparation or its expiry');if(/\.html$/iu.test(new URL(url).pathname)&&!rootPageURLs.has(url))fail('unselected HTML is not an offline asset');add(url,observed.bytes,observed.contentType);if(item.kind==='style'||/\.css$/iu.test(new URL(url).pathname)){const css=decoder.decode(observed.bytes);for(const child of cssURLs(css))queue.push({url:child,kind:'asset',owner:url,depth:item.depth+1});}if(/\.(?:m?js)$/iu.test(new URL(url).pathname)){const js=decoder.decode(observed.bytes);if(hasModuleReferences(js))fail('a script has unlisted module dependencies; use the self-contained browser bundle');}onProgress({status:'complete',url});}
 const manifestFiles=[];for(const file of files.values()){check(signal);manifestFiles.push({url:file.url,bytes:file.bytes,sha256:await digest(file.body,cryptoObject),contentType:file.contentType});}manifestFiles.sort((a,b)=>a.url.localeCompare(b.url));const createdAt=new Date(now).toISOString(),expiresAt=new Date(Math.min(publication.expiresAt?Date.parse(publication.expiresAt):Infinity,now+expiresDays*86400000)).toISOString(),commit={version:1,kind:'gw-offline-commit',baseURL:root.href,project:{id:publication.id,revision:publication.revision},createdAt,expiresAt,selection:expected,files:manifestFiles,scope:'selected-route-static-assets',attestation:'observed-bytes-not-build-attestation'},prefix=await offlineCachePrefix(root.href,{cryptoObject}),nonce=new Uint8Array(16);if(typeof cryptoObject?.getRandomValues!=='function')fail('secure transaction identity is unavailable');cryptoObject.getRandomValues(nonce);const name=prefix+await digest(utf8.encode(JSON.stringify(commit)+'\n'+[...nonce].join(',')),cryptoObject);let cache,complete=false,registered;if(utf8.encode(JSON.stringify(commit)).length>DELIVERY_LIMITS.jsonBytes)fail('offline snapshot metadata exceeds its bounded budget');
 try{check(signal);cache=await cacheStorage.open(name);for(const file of files.values()){check(signal);await cache.put(file.url,new Response(file.body,{headers:{'Content-Type':file.contentType}}));}check(signal);registered=await serviceWorker.register(worker,{scope:root.href});check(signal);await cache.put(commitURL(root),new Response(JSON.stringify(commit),{headers:{'Content-Type':'application/json'}}));check(signal);if(!await stateCache(cacheStorage,root,prefix)){const state=await cacheStorage.open(prefix+'client-state');await state.put(consentURL(root),new Response(JSON.stringify({version:1,kind:'gw-offline-state-consent',baseURL:root.href}),{headers:{'Content-Type':'application/json'}}));}check(signal);(registered.installing??registered.waiting??registered.active)?.postMessage?.({version:1,type:'gw-offline-network-client'});complete=true;return freeze({status:'ready',cacheName:name,...commit,offlineChanges:'Only these observed pages and static assets are prepared. New revisions, withdrawals and unlisted dynamic features cannot be checked while offline.'});}finally{
  if(!complete&&cache){
   await cacheStorage.delete(name);
   // A reader can cancel/delete while register() is unresolved. Remove only
   // this newly-created registration, after confirming no other transaction
   // or complete snapshot needs it. A pre-existing registration is retained.
   if(!(await cacheStorage.keys()).some(value=>value.startsWith(prefix)&&value!==prefix+'client-state')){
    await cacheStorage.delete(prefix+'client-state');
    if(registered&&registered!==registration&&typeof registered.unregister==='function')try{const current=await serviceWorker.getRegistration?.(root.href),workers=[registered.active,registered.waiting,registered.installing].filter(Boolean);if(current===registered&&registered.scope===root.href&&workers.length&&workers.every(value=>value.scriptURL===worker))await registered.unregister();}catch{}
   }
  }
 }
}

return {DELIVERY_LIMITS,validatePublication,validatePublicPage,parseDeliveryJSON,loadPublication,selectClosure,offlineCachePrefix,inspectOffline,applyOfflineWithdrawals,clearOffline,prepareOffline};
})();

const oer = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Original bounded ZIP-store writer. No compression library, IO or automatic download.
const OER_LIMITS=Object.freeze({components:512,fileBytes:16777216,totalBytes:67108864,payloadBytes:2097152,pathBytes:2048,metadataBytes:2048});
const encoder=new TextEncoder(),hashPattern=/^[a-f0-9]{64}$/u;
const fail=message=>{const error=new TypeError('generative-websites OER: '+message);error.code='invalid-oer-bundle';throw error;};
function fields(value,allowed,required=allowed){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail('expected ordinary JSON object');for(const key of Reflect.ownKeys(value)){const d=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!allowed.includes(key)||!d.enumerable||!Object.hasOwn(d,'value'))fail('unknown or non-JSON field');}for(const key of required)if(!Object.hasOwn(value,key))fail('missing '+key);}
function array(value,maximum,minimum=0){if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<minimum||value.length>maximum||Reflect.ownKeys(value).length!==value.length+1)fail('invalid bounded dense array');for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('non-JSON array');}}
function text(value,max=2048){if(typeof value!=='string'||!value.trim()||value!==value.trim()||encoder.encode(value).length>max||/[\u0000-\u001f\u007f\ud800-\udfff]/u.test(value))fail('invalid bounded metadata');return value;}
function path(value){text(value,OER_LIMITS.pathBytes);if(value.startsWith('/')||/[\\%:#?<>"|*\s]/u.test(value)||value.split('/').some(part=>!part||part.startsWith('.')||part.endsWith('.')||encoder.encode(part).length>255||/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(part)))fail('unsafe extraction path');return value;}
const pathKey=value=>value.normalize('NFC').toLowerCase();
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
function decode64(value,bytes){if(typeof value!=='string'||value.length!==Math.ceil(bytes/3)*4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(value))fail('invalid base64 encoding or byte size');let binary;try{binary=atob(value);}catch{fail('invalid base64');}if(binary.length!==bytes||btoa(binary)!==value)fail('noncanonical base64');return Uint8Array.from(binary,c=>c.charCodeAt(0));}
function rights(value){fields(value,['licence','attribution','modifications','ai']);for(const key of Object.keys(value))text(value[key]);if(/^(?:unknown|noassertion|restricted|all rights reserved|none|n\/?a|not known|proprietary)$/iu.test(value.licence))fail('reusable rights are not declared');}
function validateOerPayload(value){fields(value,['version','sourceConsent','components','reconstruction','omissions']);if(value.version!==1||value.sourceConsent!==true)fail('explicit author source publication consent is required');array(value.components,OER_LIMITS.components,1);const paths=new Set();let total=0,encoded=0;for(const component of value.components){fields(component,['path','bytes','sha256','base64','rights']);path(component.path);const key=pathKey(component.path);if(paths.has(key)||key==='oer-manifest.json')fail('duplicate, conflicting or reserved archive path');paths.add(key);if(!Number.isSafeInteger(component.bytes)||component.bytes<0||component.bytes>OER_LIMITS.fileBytes||(total+=component.bytes)>OER_LIMITS.totalBytes||!hashPattern.test(component.sha256))fail('invalid component size or digest');if(typeof component.base64!=='string'||(encoded+=component.base64.length)>OER_LIMITS.payloadBytes)fail('inline source payload budget exceeded');decode64(component.base64,component.bytes);rights(component.rights);}for(const key of paths)for(const other of paths)if(key!==other&&other.startsWith(key+'/'))fail('file/directory archive path collision');fields(value.reconstruction,['quarto','entrypoints','instructions']);text(value.reconstruction.quarto,128);text(value.reconstruction.instructions,4096);array(value.reconstruction.entrypoints,64,1);const entries=new Set();for(const entry of value.reconstruction.entrypoints){path(entry);const key=pathKey(entry);if(!/\.qmd$/iu.test(entry)||!paths.has(key)||entries.has(key))fail('missing or duplicate editable entrypoint');entries.add(key);}array(value.omissions,512);const omitted=new Set();for(const omission of value.omissions){fields(omission,['path','reason','required']);path(omission.path);text(omission.reason);if(typeof omission.required!=='boolean'||paths.has(pathKey(omission.path))||omitted.has(pathKey(omission.path)))fail('conflicting omission');omitted.add(pathKey(omission.path));}if(encoder.encode(JSON.stringify(value)).length>OER_LIMITS.payloadBytes)fail('inline source payload budget exceeded');return freeze(JSON.parse(JSON.stringify(value)));}
async function digest(bytes,cryptoObject){if(!cryptoObject?.subtle)fail('secure SHA256 is unavailable');return [...new Uint8Array(await cryptoObject.subtle.digest('SHA-256',bytes))].map(value=>value.toString(16).padStart(2,'0')).join('');}
const crcTable=(()=>{const table=new Uint32Array(256);for(let n=0;n<256;n++){let value=n;for(let bit=0;bit<8;bit++)value=(value&1)?0xedb88320^(value>>>1):value>>>1;table[n]=value>>>0;}return table;})();
function crc32(bytes){let crc=0xffffffff;for(const value of bytes)crc=crcTable[(crc^value)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function header(size){const bytes=new Uint8Array(size);return {bytes,view:new DataView(bytes.buffer)};}
function u16(view,offset,value){view.setUint16(offset,value,true);}function u32(view,offset,value){view.setUint32(offset,value,true);}
/** Reproducible ordinary ZIP, UTF-8 names, stored files, no executable extraction. */
async function buildOerZip(input,{cryptoObject=globalThis.crypto,signal}={}){
 const payload=validateOerPayload(input);if(payload.omissions.some(item=>item.required))fail('required source or rights omissions prevent a complete declared bundle');const check=()=>{if(signal?.aborted)throw signal.reason??new DOMException('Cancelled','AbortError');};check();const files=[];
 for(const component of payload.components){check();const body=decode64(component.base64,component.bytes);if(await digest(body,cryptoObject)!==component.sha256)fail('component bytes do not match the author-published digest');check();files.push({path:component.path,body,bytes:body.length,sha256:component.sha256,rights:component.rights});}
 const manifest={version:1,kind:'editable-declared-resource-bundle',status:'declared-files-complete',sourceConsent:true,components:files.map(({path,bytes,sha256,rights})=>({path,bytes,sha256,rights})),reconstruction:payload.reconstruction,omissions:payload.omissions,scope:'Only explicitly published source files and listed software/assets.',rightsStatus:'author-declared-licences; compatibility and legal permission are not independently verified',reconstructionStatus:'independent-render-verification-required',aiDisclosure:'Component AI-assistance statements are retained; no independent review or institutional approval is inferred.'};
 const manifestBody=encoder.encode(JSON.stringify(manifest,null,2)+'\n');files.push({path:'oer-manifest.json',body:manifestBody,bytes:manifestBody.length,sha256:await digest(manifestBody,cryptoObject)});files.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
 const localParts=[],centralParts=[];let localOffset=0,centralSize=0;
 for(const file of files){check();const name=encoder.encode(file.path),crc=crc32(file.body),local=header(30),central=header(46);u32(local.view,0,0x04034b50);u16(local.view,4,20);u16(local.view,6,0x0800);u16(local.view,8,0);u16(local.view,10,0);u16(local.view,12,33);u32(local.view,14,crc);u32(local.view,18,file.bytes);u32(local.view,22,file.bytes);u16(local.view,26,name.length);u16(local.view,28,0);localParts.push(local.bytes,name,file.body);u32(central.view,0,0x02014b50);u16(central.view,4,20);u16(central.view,6,20);u16(central.view,8,0x0800);u16(central.view,10,0);u16(central.view,12,0);u16(central.view,14,33);u32(central.view,16,crc);u32(central.view,20,file.bytes);u32(central.view,24,file.bytes);u16(central.view,28,name.length);u16(central.view,30,0);u16(central.view,32,0);u16(central.view,34,0);u16(central.view,36,0);u32(central.view,38,0);u32(central.view,42,localOffset);centralParts.push(central.bytes,name);localOffset+=30+name.length+file.bytes;centralSize+=46+name.length;}
 if(files.length>65535||localOffset+centralSize>0xffffffff)fail('ZIP32 size budget exceeded');const end=header(22);u32(end.view,0,0x06054b50);u16(end.view,4,0);u16(end.view,6,0);u16(end.view,8,files.length);u16(end.view,10,files.length);u32(end.view,12,centralSize);u32(end.view,16,localOffset);u16(end.view,20,0);const output=new Uint8Array(localOffset+centralSize+22);let at=0;for(const part of [...localParts,...centralParts,end.bytes]){output.set(part,at);at+=part.length;}check();const archiveSha256=await digest(output,cryptoObject);check();return {version:1,status:'ready',filename:'editable-resource.zip',mediaType:'application/zip',bytes:output,sha256:archiveSha256,manifest:freeze(manifest),qualification:'Declared files and hashes verified; independent reconstruction, rights compatibility, accessibility and learning benefit require separate checks.'};
}

return {OER_LIMITS,validateOerPayload,buildOerZip};
})();

const journey = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Portable route position and nested return frames. A visit is not knowledge.
const {selectClosure,validatePublication,validatePublicPage} = delivery;
const JOURNEY_LIMITS=Object.freeze({bytes:65536,steps:500,choices:500,detours:32,scroll:10000000});
const jEncoder=new TextEncoder(),jNative=/^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
function jFail(){const error=new TypeError('generative-websites: saved journey is invalid, unavailable or stale; build a current route');error.code='invalid-journey';throw error;}
function jFields(value,allowed,required=allowed){
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))jFail();
  for(const key of Reflect.ownKeys(value)){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!allowed.includes(key)||!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))jFail();}
  if(required.some(key=>!Object.hasOwn(value,key)))jFail();
}
function jArray(value,max,min=0){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<min||value.length>max)jFail();
  const keys=Reflect.ownKeys(value).filter(key=>key!=='length');if(keys.length!==value.length)jFail();
  keys.forEach((key,index)=>{const descriptor=Object.getOwnPropertyDescriptor(value,key);if(key!==String(index)||!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))jFail();});return value;
}
function jText(value,max=2048){if(typeof value!=='string'||!value||value!==value.trim()||jEncoder.encode(value).length>max||/[\u0000-\u001f\u007f\ud800-\udfff]/u.test(value))jFail();return value;}
function jID(value){jText(value,128);if(!jNative.test(value)||['constructor','prototype','__proto__'].includes(value))jFail();return value;}
function jHash(value){if(typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value))jFail();return value;}
function jNativeHash(value){if(typeof value!=='string'||!/^sha1:[a-f0-9]{40}$/.test(value))jFail();return value;}
function jBase(value){
  jText(value);let url;try{url=new URL(value);}catch{jFail();}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||!url.pathname.endsWith('/'))jFail();return url;
}
function jCanonical(value,depth=0,ancestors=new Set(),budget={nodes:0}){
  if(depth>24||++budget.nodes>20000)jFail();
  if(typeof value==='string'){if(value.length>65536||jEncoder.encode(value).length>65536)jFail();return JSON.stringify(value);}
  if(value===null||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
  if(!value||typeof value!=='object'||ancestors.has(value))jFail();ancestors.add(value);let result;
  if(Array.isArray(value)){jArray(value,500);result='['+value.map(item=>jCanonical(item,depth+1,ancestors,budget)).join(',')+']';}
  else{jFields(value,Object.keys(value));result='{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+jCanonical(value[key],depth+1,ancestors,budget)).join(',')+'}';}
  ancestors.delete(value);if(jEncoder.encode(result).length>65536)jFail();return result;
}
function jFreeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(jFreeze);Object.freeze(value);}return value;}
const jCopy=value=>JSON.parse(jCanonical(value));
const jGoal=value=>{jText(value,257);const parts=value.split('#');if(parts.length!==2)jFail();parts.forEach(jID);return parts;};
function jState(catalogue){
  if(catalogue?.version!==1||catalogue.kind!=='observed-publication')jFail();const root=jBase(catalogue.baseURL);
  let publication;try{publication=validatePublication(catalogue.publication,{baseURL:root.href});}catch{jFail();}
  jArray(catalogue.pages,32);const observations=new Map();
  for(const page of catalogue.pages){if(!page||typeof page!=='object'||typeof page.id!=='string'||observations.has(page.id))jFail();observations.set(page.id,page);}
  return {root,publication,observations};
}
function jPage(state,id){
  const declared=state.publication.pages.find(page=>page.id===id),observed=state.observations.get(id);
  if(!declared||!observed||observed.status!=='complete')jFail();let data;
  try{data=validatePublicPage(observed.data,{baseURL:state.root.href});}catch{jFail();}
  const url=new URL(declared.url,state.root).href;
  if(observed.url!==url||data.page.id!==id||new URL(data.page.url,state.root).href!==url||data.page.revision!==declared.revision||
    data.project.id!==state.publication.id||data.project.revision!==state.publication.revision||declared.sourceDigest!==undefined&&declared.sourceDigest!==data.page.sourceDigest||
    declared.language!==undefined&&Intl.getCanonicalLocales(declared.language)[0]!==Intl.getCanonicalLocales(data.page.language)[0])jFail();
  return {id,url,sha256:jHash(observed.observedSha256),sourceDigest:jNativeHash(data.page.sourceDigest)};
}
function jRoute(catalogue,route,state){
  jFields(route,['version','status','project','goal','steps','choices','pageIds']);jCanonical(route);
  const [pageId,objectId]=jGoal(route.goal);let fresh;try{fresh=selectClosure(catalogue,{pageId,objectId});}catch{jFail();}
  if(fresh.status!=='complete'||jCanonical(fresh)!==jCanonical(route))jFail();
  jArray(fresh.steps,500,1);jArray(fresh.choices,500);jArray(fresh.pageIds,32,1);
  const pages=fresh.pageIds.map(id=>jPage(state,id));return {route:jCopy(fresh),pages};
}
function jPosition(value,count){if(!Number.isSafeInteger(value)||value<0||value>=count)jFail();return value;}
function jFrame(frame,state,count,{normalize=false}={}){
  jFields(frame,['url','sourceDigest','scrollX','scrollY','focus','current']);jText(frame.url);let url;
  try{url=new URL(frame.url,state.root);}catch{jFail();}
  if(!['https:','http:'].includes(url.protocol)||url.origin!==state.root.origin||!url.pathname.startsWith(state.root.pathname)||url.username||url.password||url.search||/[\\\s]/.test(frame.url))jFail();
  if(url.hash){let anchor;try{anchor=decodeURIComponent(url.hash.slice(1));}catch{jFail();}jID(anchor);}
  const pageURL=url.origin+url.pathname,declared=state.publication.pages.find(page=>new URL(page.url,state.root).href===pageURL);if(!declared)jFail();
  const page=jPage(state,declared.id);if(jNativeHash(frame.sourceDigest)!==page.sourceDigest)jFail();
  for(const coordinate of [frame.scrollX,frame.scrollY])if(typeof coordinate!=='number'||!Number.isFinite(coordinate)||coordinate<0||coordinate>10000000)jFail();
  const focus=normalize&&frame.focus===''?null:frame.focus;if(focus!==null)jID(focus);
  if(!normalize&&url.href!==frame.url)jFail();
  return {url:url.href,sourceDigest:page.sourceDigest,scrollX:frame.scrollX,scrollY:frame.scrollY,focus,current:jPosition(frame.current,count)};
}

/** Create a frozen bookmark from a fresh complete producer route. Only pages
 * used by that route bind its observed-byte identity; unrelated pages do not.
 * Detours bind their own native-content identity separately. Hashes supplied by
 * the observed-publication producer are not signatures or proof of learning. */
function createJourney(catalogue,route,options={}){
  jFields(options,['current','detours'],[]);const state=jState(catalogue),fresh=jRoute(catalogue,route,state),detours=options.detours===undefined?[]:options.detours;
  jArray(detours,32);const record={version:1,kind:'gw-learning-journey',baseURL:state.root.href,
    project:jCopy(fresh.route.project),goal:fresh.route.goal,steps:fresh.route.steps,choices:fresh.route.choices,pageIds:fresh.route.pageIds,pages:fresh.pages,
    current:jPosition(options.current===undefined?0:options.current,fresh.route.steps.length),detours:detours.map(frame=>jFrame(frame,state,fresh.route.steps.length)),
    scope:'route-position-only',attestation:'producer-observed-hashes-not-authentication'};
  jCanonical(record);return jFreeze(record);
}

/** Validate portable/tab storage as untrusted data; never accept stored URLs,
 * reasons, OR choices or source hashes instead of the recomputed producer route. */
function validateJourney(record,catalogue){
  jFields(record,['version','kind','baseURL','project','goal','steps','choices','pageIds','pages','current','detours','scope','attestation']);jCanonical(record);
  if(record.version!==1||record.kind!=='gw-learning-journey'||record.scope!=='route-position-only'||record.attestation!=='producer-observed-hashes-not-authentication')jFail();
  const state=jState(catalogue),[pageId,objectId]=jGoal(record.goal);let fresh;try{fresh=selectClosure(catalogue,{pageId,objectId});}catch{jFail();}
  if(fresh.status!=='complete'||record.baseURL!==state.root.href)jFail();
  const rebuilt=createJourney(catalogue,fresh,{current:record.current,detours:record.detours});if(jCanonical(record)!==jCanonical(rebuilt))jFail();return rebuilt;
}

/** Capture an actual page return position. The caller obtains its native digest
 * from the loaded producer catalogue, never from a guessed QMD filename. */
function createReturnFrame(catalogue,options,route){
  jFields(options,['url','scrollX','scrollY','focus','current'],['url']);jText(options.url);const state=jState(catalogue),fresh=jRoute(catalogue,route,state);let url;
  try{url=new URL(options.url,state.root);}catch{jFail();}
  const declared=state.publication.pages.find(page=>new URL(page.url,state.root).href===url.origin+url.pathname);if(!declared)jFail();
  const page=jPage(state,declared.id),frame=jFrame({url:options.url,sourceDigest:page.sourceDigest,scrollX:options.scrollX===undefined?0:options.scrollX,scrollY:options.scrollY===undefined?0:options.scrollY,
    focus:options.focus===undefined?null:options.focus,current:options.current===undefined?0:options.current},state,fresh.route.steps.length,{normalize:true});jCanonical(frame);return jFreeze(frame);
}

/** Validate a one-shot pending return against the same current route and native
 * page identity. Consumption/storage/focus restoration remain the caller's job. */
function validateReturnFrame(frame,catalogue,route){const state=jState(catalogue),fresh=jRoute(catalogue,route,state);jCanonical(frame);return jFreeze(jFrame(frame,state,fresh.route.steps.length));}

return {JOURNEY_LIMITS,createJourney,validateJourney,createReturnFrame,validateReturnFrame};
})();

const sandbox_session_ui = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Original optional file inspection and navigation UI. It never invokes a
// Sandbox endpoint, imports executable code or promotes a reported proof state.
const sessionAdapter = sandbox_session;
const {parseDeliveryJSON,loadPublication,selectClosure} = delivery;
const {createJourney,validateJourney,createReturnFrame,validateReturnFrame} = journey;

const encoder=new TextEncoder();
const mounted=new WeakSet(),returnRuns=new WeakMap();
const keyFor=(config,page)=>'quarto-generative-journey-v1:'+new URL(config.baseURL).pathname+':'+page.project.id;
const node=(document,tag,text)=>{const value=document.createElement(tag);if(text!==undefined)value.textContent=text;return value;};
const cancelled=()=>new Error('Session action cancelled or source changed.');
/** Commit the two existing same-tab return records together. Web Storage has
 * no transaction, so a quota/navigation failure rolls back only our own
 * synchronous writes; a newer reader action is never overwritten. */
function commitJourneyReturn(storage,key,bookmark,pending,navigate){
  const prior=storage.getItem(key),priorPending=storage.getItem(key+':return'),next=JSON.stringify(bookmark),nextPending=JSON.stringify(pending);
  let wroteRoute=false,wrotePending=false;
  try{storage.setItem(key,next);wroteRoute=true;storage.setItem(key+':return',nextPending);wrotePending=true;navigate();}
  catch(error){
    try{if(wrotePending&&storage.getItem(key+':return')===nextPending){if(priorPending===null)storage.removeItem(key+':return');else storage.setItem(key+':return',priorPending);}}catch{}
    try{if(wroteRoute&&storage.getItem(key)===next){if(prior===null)storage.removeItem(key);else storage.setItem(key,prior);}}catch{}
    let restored=false;try{restored=storage.getItem(key)===prior&&storage.getItem(key+':return')===priorPending;}catch{}
    if(!restored){const incomplete=new Error('Reading-position storage could not be fully restored.');incomplete.code='return-state-not-retained';throw incomplete;}
    throw error;
  }
}
function sourceStamp(document){
  return ['generative-publication-data','generative-public-data','generative-sandbox-data','generative-sandbox-session-mappings-data'].map((name,index)=>{
    const nodes=document.querySelectorAll('script.'+name);if(index===3&&nodes.length===0)return'';if(nodes.length!==1)throw cancelled();return nodes[0].textContent;
  }).join('\u0000');
}
function contextFor(page,config,problem){
  return {version:1,project:{id:page.project.id,revision:page.project.revision},
    page:{url:new URL(page.page.url,config.baseURL).href,sourceDigest:page.page.sourceDigest},
    problem:{id:problem.spec.id,revision:problem.spec.revision,problemSha256:problem.receipt.problemSha256,
      contextSha256:problem.receipt.contextSha256,exportSha256:problem.receipt.exportSha256}};
}
function defaultDownload(name,bytes,type,document){
  const url=URL.createObjectURL(new Blob([bytes],{type})),link=node(document,'a');link.href=url;link.download=name;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function nativeFocus(document,id){
  if(id===null)return null;
  const all=[...document.querySelectorAll('[id]')].filter(element=>element.id===id);
  if(all.length!==1)throw cancelled();return all[0];
}
function applyPosition(frame,{documentObject:document,windowObject:window,locationObject:location,page}){
  const target=new URL(frame.url),here=new URL(location.href);
  if(target.href!==here.href||frame.sourceDigest!==page.page.sourceDigest)throw cancelled();
  const focus=nativeFocus(document,frame.focus);
  if(focus){const style=window.getComputedStyle?.(focus);if(focus.hidden||focus.closest?.('[hidden]')||style&&(style.display==='none'||style.visibility==='hidden'))throw cancelled();if(!focus.hasAttribute('tabindex')&&!focus.matches('button,input,select,a[href],textarea'))focus.setAttribute('tabindex','-1');focus.focus({preventScroll:true});}
  window.scrollTo(frame.scrollX,frame.scrollY);
}
function routeFrom(catalogue,bookmark){const [pageId,objectId]=bookmark.goal.split('#'),route=selectClosure(catalogue,{pageId,objectId});if(route.status!=='complete')throw cancelled();return route;}

/** Restore only a one-shot pending position created by an explicit route action.
 * Reading ordinary pages causes no fetch when no such pending record exists.
 * The stored record is untrusted: source pages and prerequisite choices are
 * freshly validated before any navigation state, focus or scroll is restored. */
async function restorePendingSessionReturn(page,config,{
  documentObject=document,windowObject=window,locationObject=location,
  storageObject=globalThis.sessionStorage,loadPublicationImpl=loadPublication
}={}){
  const key=keyFor(config,page),pendingKey=key+':return';let raw;
  try{raw=storageObject?.getItem(pendingKey);}catch{return false;}
  if(!raw)return false;
  let snapshot;try{snapshot=sourceStampForReturn(documentObject);}catch{return false;}
  const previous=returnRuns.get(documentObject);if(previous?.pendingValue===raw)return false;previous?.abort();
  const controller=new AbortController();controller.pendingValue=raw;returnRuns.set(documentObject,controller);
  const timer=setTimeout(()=>controller.abort(),60000),
    stop=()=>controller.abort();windowObject.addEventListener('pagehide',stop,{once:true});
  const live=()=>{try{return!controller.signal.aborted&&returnRuns.get(documentObject)===controller&&sourceStampForReturn(documentObject)===snapshot;}catch{return false;}};
  try{
    const pending=parseDeliveryJSON(raw,{maxBytes:65536});
    if(!pending||Object.keys(pending).some(key=>!['version','project','frame'].includes(key))||pending.version!==1||
      !pending.project||typeof pending.project!=='object'||Array.isArray(pending.project)||
      Object.keys(pending.project).length!==2||Object.keys(pending.project).some(key=>!['id','revision'].includes(key))||
      pending.project.id!==page.project.id||pending.project.revision!==page.project.revision)throw cancelled();
    const saved=parseDeliveryJSON(storageObject.getItem(key)??'null',{maxBytes:65536});
    const catalogue=await loadPublicationImpl(config.publication,{baseURL:config.baseURL,signal:controller.signal});if(!live())throw cancelled();
    const checked=validateJourney(saved,catalogue),route=routeFrom(catalogue,checked),frame=validateReturnFrame(pending.frame,catalogue,route);
    if(!live())throw cancelled();
    // Consume only the exact pending value inspected by this run; another
    // reader action may already have replaced it while pages were loading.
    if(storageObject.getItem(pendingKey)!==raw)throw cancelled();
    storageObject.removeItem(pendingKey);
    const applied=await new Promise(resolve=>{let id;const abort=()=>{windowObject.cancelAnimationFrame?.(id);resolve(false);};controller.signal.addEventListener('abort',abort,{once:true});id=windowObject.requestAnimationFrame(()=>{controller.signal.removeEventListener('abort',abort);if(live()){try{applyPosition(frame,{documentObject,windowObject,locationObject,page});resolve(true);}catch{resolve(false);}}else resolve(false);});});
    return applied&&live();
  }catch{
    // A failed return does not replace or delete the last valid route.
    try{if(!controller.signal.aborted&&returnRuns.get(documentObject)===controller&&storageObject.getItem(pendingKey)===raw)storageObject.removeItem(pendingKey);}catch{}
    return false;
  }finally{clearTimeout(timer);windowObject.removeEventListener('pagehide',stop);if(returnRuns.get(documentObject)===controller)returnRuns.delete(documentObject);}
}
function sourceStampForReturn(document){
  return ['generative-publication-data','generative-public-data'].map(name=>{const all=document.querySelectorAll('script.'+name);if(all.length!==1)throw cancelled();return all[0].textContent;}).join('\u0000');
}

/** Internal browser seam. Authors use the existing QMD .learning-sandbox block;
 * no author-written JavaScript, transport endpoint or persistence is required. */
function mountSandboxSessionControls(panel,{page,config,problems,sessionMappings=[]},{
  documentObject=globalThis.document,windowObject=globalThis.window,locationObject=globalThis.location,
  storageObject=globalThis.sessionStorage,adapter=sessionAdapter,loadPublicationImpl=loadPublication,
  cryptoObject=globalThis.crypto,download=(name,bytes,type)=>defaultDownload(name,bytes,type,documentObject)
}={}){
  if(mounted.has(panel))return null;mounted.add(panel);
  if(!Array.isArray(problems)||!problems.length||problems.length>128)return null;
  const document=documentObject,window=windowObject,location=locationObject,stamp=sourceStamp(document);
  let epoch=0,controller=null,busy=false,current=null;
  const box=node(document,'section');box.className='generative-feature-controls generative-session-controls';box.setAttribute('aria-label','Private Sandbox session inspection');
  box.append(node(document,'p','Inspect a Thread session file on this device. Imported claims and completion remain reported, unverified data. No file is uploaded and no Sandbox checker runs here.'));
  const problemLabel=node(document,'label','Associate with the current published problem '),problemSelect=node(document,'select');
  for(const [index,problem]of problems.entries()){const option=node(document,'option',problem.spec.label);option.value=String(index);problemSelect.append(option);}problemSelect.value='0';problemLabel.append(problemSelect);
  const kindLabel=node(document,'label','File type '),kind=node(document,'select');
  for(const [value,label]of [['thread','Thread session JSON'],['capsule','GW source-bound session capsule']]){const option=node(document,'option',label);option.value=value;kind.append(option);}kind.value='thread';kindLabel.append(kind);
  const fileLabel=node(document,'label','Choose a session JSON file '),file=node(document,'input');file.type='file';file.accept='.json,application/json';fileLabel.append(file);
  const routeLabel=node(document,'label'),routeChoice=node(document,'input');routeChoice.type='checkbox';routeChoice.checked=false;
  routeLabel.append(routeChoice,document.createTextNode('Attach this tab’s current validated reading route and return position when creating a capsule (optional).'));
  const status=node(document,'p','No session selected. Files stay in memory unless you explicitly download a copy.');status.className='generative-session-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const output=node(document,'div');output.className='generative-session-inspection';
  const controls=[],make=(label,action)=>{const item=node(document,'button',label);item.type='button';item.addEventListener('click',action);controls.push(item);return item;};
  const selected=()=>problems[Number(problemSelect.value)];
  const fresh=()=>{try{return sourceStamp(document)===stamp;}catch{return false;}};
  const valid=()=>current&&fresh();
  const refresh=()=>{for(const control of [rawDownload,capsuleDownload,aifDownload,xaifDownload])control.disabled=busy||!valid();restore.disabled=busy||!valid()||!current.journey;back.disabled=restore.disabled;cancel.disabled=!busy;};
  const stop=()=>{epoch++;controller?.abort();controller=null;busy=false;refresh();};
  const run=async action=>{
    const token=++epoch;controller?.abort();const own=new AbortController();controller=own;busy=true;refresh();
    const timer=setTimeout(()=>own.abort(),60000),live=()=>token===epoch&&!own.signal.aborted&&fresh();
    try{await action(own.signal,live);if(!live()&&token===epoch)status.textContent=fresh()?'Action cancelled. The last complete inspection is retained.':'Published source changed. Reload before binding a session or restoring a route.';}
    catch(error){if(token===epoch)status.textContent=error?.code==='return-state-not-retained'?'The reading-position update failed and this tab could not restore every previous storage value. The inspected file remains unchanged. Resume or rebuild the reading route before returning.':fresh()?'The file or requested association is unavailable, invalid or stale. The last complete inspection and reading route were retained.':'Published source changed. Reload before binding a session or restoring a route.';}
    finally{clearTimeout(timer);if(token===epoch){busy=false;controller=null;refresh();}}
  };
  function render(inspection){
    output.replaceChildren();output.append(node(document,'h3','Reported session information — not rechecked'));
    output.append(node(document,'p',`${inspection.byteLength} exact file bytes; ${inspection.reported.confirmedClaims} reported confirmed claims; ${inspection.reported.pendingClaims} pending claims. Reported completion: ${inspection.reported.completed===null?'not supplied':inspection.reported.completed?'complete':'not complete'}.`));
    output.append(node(document,'p','“Confirmed” and completion labels describe the exported file. They do not establish truth, proof acceptance, source fidelity or mastery.'));
    const list=node(document,'ul');for(const stage of inspection.reported.stages){const item=node(document,'li',`Stage ${stage.sessionId}: ${stage.confirmedClaims} reported confirmed claims, ${stage.pendingClaims} pending claims.`);
      const claims=node(document,'ul');for(const claim of stage.reportedStatuses)claims.append(node(document,'li',`${claim.claimId}: reported ${claim.status}; not rechecked here.`));item.append(claims);list.append(item);}output.append(list);
    output.append(node(document,'p',inspection.restoration.envelopeCompatible?'This file fits the inspected Sandbox restoration envelope. Actual restoration and fresh checker results remain the Sandbox’s responsibility.':'This file cannot be advertised as a restorable Sandbox envelope. It remains an inspected archive.'));
    if(inspection.restoration.reasons.length){const reasons=node(document,'ul');for(const reason of inspection.restoration.reasons)reasons.append(node(document,'li',reason));output.append(reasons);}
    output.append(node(document,'p',inspection.qualification));
  }
  async function freshRoute(bookmark,signal,live){const catalogue=await loadPublicationImpl(config.publication,{baseURL:config.baseURL,signal});if(!live())throw cancelled();const checked=validateJourney(bookmark,catalogue);return{catalogue,checked,route:routeFrom(catalogue,checked)};}
  async function attachedRoute(signal,live){
    const saved=parseDeliveryJSON(storageObject.getItem(keyFor(config,page))??'null',{maxBytes:65536}),{catalogue,checked,route}=await freshRoute(saved,signal,live);
    const focus=document.activeElement?.id||panel.id||null;if(focus)nativeFocus(document,focus);
    const frame=createReturnFrame(catalogue,{url:location.href,scrollX:window.scrollX,scrollY:window.scrollY,focus,current:checked.current},route);
    return createJourney(catalogue,route,{current:checked.current,detours:[...checked.detours,frame]});
  }
  file.addEventListener('change',()=>void run(async(signal,live)=>{
    const chosen=file.files?.[0];if(!chosen)return;
    const maximum=kind.value==='capsule'?adapter.SANDBOX_SESSION_LIMITS.capsuleBytes:adapter.SANDBOX_SESSION_LIMITS.threadBytes;
    if(!Number.isSafeInteger(chosen.size)||chosen.size<1||chosen.size>maximum)throw cancelled();
    const bytes=new Uint8Array(await chosen.arrayBuffer());if(!live()||bytes.length>maximum)throw cancelled();
    let next;
    if(kind.value==='capsule'){
      const capsule=adapter.parseSessionCapsule(bytes),checked=await adapter.validateSessionCapsule(capsule,contextFor(page,config,selected()),{problemExport:selected(),cryptoObject,signal});
      next={bytes:checked.bytes.slice(),inspection:checked.inspection,capsule,journey:checked.journey??null};
    }else{const inspection=await adapter.inspectThreadSession(bytes,{cryptoObject,signal});next={bytes:bytes.slice(),inspection,capsule:null,journey:null};}
    if(!live())throw cancelled();current=next;render(next.inspection);status.textContent=next.journey?'Session inspected. An attached route is available; restoring it requires a separate explicit action.':'Session inspected locally. Reported states remain unverified; no reading route was changed.';
  }));
  const rawDownload=make('Download exact Thread session bytes',()=>void run(async(_signal,live)=>{if(!current||!live())throw cancelled();download('sandbox-session.json',current.bytes.slice(),'application/json');if(live())status.textContent='Exact original Thread bytes downloaded. Their reported proof and completion states remain unverified.';}));
  const capsuleDownload=make('Download source-bound session capsule',()=>void run(async(signal,live)=>{
    if(!current)throw cancelled();let capsule=current.capsule;
    if(!capsule||routeChoice.checked){const journey=routeChoice.checked?await attachedRoute(signal,live):undefined;if(!live())throw cancelled();capsule=await adapter.createSessionCapsule(current.bytes,contextFor(page,config,selected()),{problemExport:selected(),...(journey?{journey}:{}),cryptoObject,signal});}
    const checked=await adapter.validateSessionCapsule(capsule,contextFor(page,config,selected()),{problemExport:selected(),cryptoObject,signal});if(!live())throw cancelled();
    download('sandbox-session-capsule.json',encoder.encode(JSON.stringify(capsule,null,2)+'\n'),'application/json');if(!live())return;current={...current,capsule,journey:checked.journey??null};status.textContent='Source-bound capsule downloaded. Hashes establish the declared byte association; no proof state was rechecked or restored.';
  }));
  async function project(format,signal,live){
    if(!current)throw cancelled();const mappings=await adapter.validateSessionMappings(sessionMappings,problems);if(!live())throw cancelled();
    const mapping=mappings.find(item=>item.problem===selected().spec.id);let result,bound=true;
    try{result=await adapter.projectArgumentInterchange(current.bytes,{format,context:contextFor(page,config,selected()),problemExport:selected(),...(mapping?{pedagogy:mapping.atoms}:{}),cryptoObject,signal});}
    catch(error){if(!['unrelated-problem','scenario-source-unavailable'].includes(error?.code)||!live())throw error;bound=false;result=await adapter.projectArgumentInterchange(current.bytes,{format,cryptoObject,signal});}
    if(!live())throw cancelled();
    const details=node(document,'section');details.className='generative-session-losses';details.append(node(document,'h4','Interchange scope and losses'),node(document,'p',result.qualification));
    details.append(node(document,'p',bound?'Current scenario declarations match the selected published problem. Pedagogical roles below are explicit author declarations, not inferred from argument edge types or reported proof status.':'This session is not associated with the selected published problem. The projection is unbound and contains no course-role mapping.'));
    const course=(result.data.AIF??result.data).thread?.course;
    if(course){const roles=node(document,'ul');for(const binding of course.bindings??[])if(binding.role)roles.append(node(document,'li',`${binding.atomId}: declared ${binding.role}${binding.targets?.length?'; targets '+binding.targets.map(target=>target.atomId).join(', '):''}.`));details.append(roles);}
    const list=node(document,'ul');for(const loss of result.losses)list.append(node(document,'li',`${loss.code}: ${loss.count}. ${loss.scope}`));details.append(list);output.querySelector('.generative-session-losses')?.remove();output.append(details);
    download('sandbox-session-'+format+'.json',encoder.encode(JSON.stringify(result.data,null,2)+'\n'),'application/json');if(live())status.textContent=bound?'Argument projection downloaded with its displayed loss report. Keep the exact Thread session or capsule for the full archive; AIF alone cannot restore finite proof metadata.':'Unbound argument projection downloaded. No association with the selected course problem or pedagogical role was asserted; keep the exact Thread file for the full archive.';
  }
  const aifDownload=make('Download AIF projection',()=>void run((signal,live)=>project('aif',signal,live))),xaifDownload=make('Download xAIF projection',()=>void run((signal,live)=>project('xaif',signal,live)));
  const restore=make('Restore attached reading route',()=>void run(async(signal,live)=>{if(!current?.journey)throw cancelled();const {checked}=await freshRoute(current.journey,signal,live);if(!live())throw cancelled();storageObject.setItem(keyFor(config,page),JSON.stringify(checked));status.textContent='Validated navigation route restored to this tab, including nested return frames. Use Resume this tab’s route. No claim, completion or knowledge state was imported.';}));
  const back=make('Return to attached reading position',()=>void run(async(signal,live)=>{
    if(!current?.journey)throw cancelled();const {catalogue,checked,route}=await freshRoute(current.journey,signal,live),frame=checked.detours.at(-1);if(!frame)throw cancelled();validateReturnFrame(frame,catalogue,route);if(!live())throw cancelled();
    const bookmark=createJourney(catalogue,route,{current:frame.current,detours:checked.detours.slice(0,-1)}),key=keyFor(config,page);
    if(new URL(frame.url).href===new URL(location.href).href){applyPosition(frame,{documentObject:document,windowObject:window,locationObject:location,page});storageObject.setItem(key,JSON.stringify(bookmark));}
    else commitJourneyReturn(storageObject,key,bookmark,{version:1,project:page.project,frame},()=>location.assign(frame.url));
    status.textContent='Reading position restored through the validated route. Imported session states remain unverified.';
  }));
  const cancel=make('Cancel session action',()=>{stop();status.textContent='Session action cancelled. The last complete inspection and route are retained.';});
  const clear=make('Clear inspected session',()=>{stop();current=null;file.value='';routeChoice.checked=false;output.replaceChildren();status.textContent='Inspected session cleared from these controls. Downloaded files and reading routes are unchanged.';refresh();});
  for(const input of [problemSelect,kind])input.addEventListener('change',()=>{stop();current=null;file.value='';output.replaceChildren();status.textContent='Selection changed. Choose a session file again; no previous session was attached to this problem.';refresh();});
  routeChoice.addEventListener('change',()=>{stop();status.textContent='Route attachment choice changed. It applies only to an explicit capsule download.';});
  box.append(problemLabel,kindLabel,fileLabel,routeLabel,...controls,status,output);panel.append(box);refresh();
  window.addEventListener('pagehide',()=>{stop();});
  return Object.freeze({clear:()=>clear.click(),cancel:()=>cancel.click()});
}

return {commitJourneyReturn,restorePendingSessionReturn,mountSandboxSessionControls};
})();

const activity_data = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// R5 DEVELOPER DRAFT. Closed, bounded data only; no storage or network effects.
const LIMITS=Object.freeze({activities:32,hints:8,objectives:8,reflectionPrompts:4,checks:32,reflectionCharacters:4000,bytes:262144,nodes:20000,depth:20});
const encoder=new TextEncoder();
function fail(code='invalid-activity-progress'){const error=Error(code);error.code=code;throw error;}
function fields(value,required,optional=[]){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail();const ds=Object.getOwnPropertyDescriptors(value);if(Reflect.ownKeys(ds).some(key=>typeof key!=='string'||![...required,...optional].includes(key)||!ds[key].enumerable||!Object.hasOwn(ds[key],'value'))||required.some(key=>!Object.hasOwn(ds,key)))fail();return value;}
function array(value,max,min=0){if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<min||value.length>max)fail();const ds=Object.getOwnPropertyDescriptors(value);if(Reflect.ownKeys(ds).length!==value.length+1)fail();for(let i=0;i<value.length;i++)if(!Object.hasOwn(ds[i]??{},'value')||!ds[i].enumerable)fail();return value;}
function text(value,max=2048,{empty=false,multiline=false}={}){if(typeof value!=='string'||!empty&&!value.length||value.length>max||encoder.encode(value).length>max||/[\ud800-\udfff]/u.test(value)||(multiline?/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u:/[\u0000-\u001f\u007f]/u).test(value))fail();return value;}
function id(value){text(value,128);if(!/^[A-Za-z][A-Za-z0-9._:-]*$/u.test(value)||['constructor','prototype','__proto__'].includes(value))fail();return value;}
function hash(value){if(typeof value!=='string'||!/^[a-f0-9]{64}$/u.test(value))fail();return value;}
function integer(value,min,max){if(!Number.isSafeInteger(value)||value<min||value>max)fail();return value;}
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function canonical(value,depth=0,budget={nodes:0},ancestors=new Set()){
 if(depth>LIMITS.depth||++budget.nodes>LIMITS.nodes)fail('activity-progress-budget');let result;
 if(value===null||typeof value==='boolean'||typeof value==='number'&&Number.isSafeInteger(value))result=JSON.stringify(value);
 else if(typeof value==='string'){text(value,LIMITS.bytes,{empty:true,multiline:true});result=JSON.stringify(value);}
 else{if(!value||typeof value!=='object'||ancestors.has(value))fail();ancestors.add(value);if(Array.isArray(value)){array(value,4096);result='['+value.map(item=>canonical(item,depth+1,budget,ancestors)).join(',')+']';}else{fields(value,Reflect.ownKeys(value));result='{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key],depth+1,budget,ancestors)).join(',')+'}';}ancestors.delete(value);}
 if(encoder.encode(result).length>LIMITS.bytes)fail('activity-progress-budget');return result;
}
const copy=value=>JSON.parse(canonical(value));
async function digest(value,cryptoObject=globalThis.crypto){if(!cryptoObject?.subtle)fail('activity-progress-crypto-unavailable');return [...new Uint8Array(await cryptoObject.subtle.digest('SHA-256',encoder.encode(typeof value==='string'?value:canonical(value))))].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
function current({signal,isCurrent}={}){if(signal?.aborted)fail('activity-progress-cancelled');if(isCurrent&&isCurrent()!==true)fail('activity-progress-stale');}
function options(value,allowed=[]){fields(value,[],['signal','isCurrent','cryptoObject',...allowed]);if(value.isCurrent!==undefined&&typeof value.isCurrent!=='function')fail();return {...value};}
function baseURL(value){text(value);let url;try{url=new URL(value);}catch{fail();}if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||!url.pathname.endsWith('/')||url.href!==value||/%(?:2e|2f|5c|25|00)/iu.test(url.pathname))fail();return url.href;}
function pageURL(value,root){text(value);let url;try{url=new URL(value);}catch{fail();}let decoded;try{decoded=decodeURIComponent(url.pathname);}catch{fail();}const base=new URL(baseURL(root));if(!['http:','https:'].includes(url.protocol)||url.href!==value||url.origin!==base.origin||!url.pathname.startsWith(base.pathname)||url.username||url.password||url.search||url.hash||!url.pathname.endsWith('.html')||/%(?:2e|2f|5c|25|00)/iu.test(url.pathname)||/[\u0000-\u001f\u007f\\]/u.test(decoded)||decoded.split('/').some(part=>part.startsWith('.')||['_extensions','node_modules','site_libs','local-ai-assets'].includes(part.toLowerCase())))fail();return url.href;}

return {LIMITS,fail,fields,array,text,id,hash,integer,freeze,canonical,copy,digest,current,options,baseURL,pageURL};
})();

const activity = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// R5 DEVELOPER DRAFT: compiled current native-part references, not QMD parsing.
const {createExercise} = exercises;
const {verifyProblemExport} = sandbox_export;
const {LIMITS,fields,array,text,id,hash,freeze,canonical,copy,digest,current,options,baseURL,pageURL,fail} = activity_data;
const activities=new WeakMap(),catalogues=new WeakMap();
const source=value=>{fields(value,['project','page','object']);fields(value.project,['id','revision']);fields(value.page,['id','url','revision','sourceDigest']);fields(value.object,['id','revision','sha256']);id(value.project.id);text(value.project.revision,128);id(value.page.id);text(value.page.revision,128);if(!/^sha(?:1:[a-f0-9]{40}|256:[a-f0-9]{64})$/u.test(value.page.sourceDigest))fail();id(value.object.id);text(value.object.revision,128);hash(value.object.sha256);return value;};
const nativePart=value=>{fields(value,['id','sha256']);return{id:id(value.id),sha256:hash(value.sha256)};};
const sameSource=(observed,expected,root)=>pageURL(new URL(observed.path,root).href,root)===expected.page.url&&observed.anchor===expected.object.id&&observed.sha256===expected.object.sha256;
const ACTIVITY_QUALIFICATION='Native-part and practice hashes bind the supplied current public projection, not original QMD spans or authenticated review. Help, visiting, self-completion and finite checker outcomes do not establish mastery or mathematical proof.';
/** Caller admission must first establish actual visible unique native anchors,
 * explicit public/review policy and one shared problem across alternate views. */
async function createActivity(input,rawOptions={}){
 const settings=options(rawOptions,['baseURL','exercises','sandboxExports']);current(settings);const value=copy(input),root=baseURL(settings.baseURL);fields(value,['version','id','revision','label','public','review','source','objectives','task'],['hints','solution','debrief','feedback','reflectionPrompts','practice','disclosure']);if(value.version!==1||value.public!==true||value.review!=='author-reviewed')fail();id(value.id);text(value.revision,128);text(value.label,160);source(value.source);pageURL(value.source.page.url,root);
 const suppliedDisclosure=value.disclosure??{};fields(suppliedDisclosure,[],['hints','solution','feedback']);const disclosure={hints:suppliedDisclosure.hints??'staged',solution:suppliedDisclosure.solution??'reader-choice',feedback:suppliedDisclosure.feedback??'after-check'};if(!['staged','open'].includes(disclosure.hints)||!['reader-choice','open'].includes(disclosure.solution)||!['after-check','open'].includes(disclosure.feedback))fail('activity-disclosure-unsupported');
 const normalizeParts=(items,max,min=0)=>array(items,max,min).map(nativePart);
 const declaration={version:1,id:value.id,revision:value.revision,label:value.label,public:true,review:'author-reviewed',source:value.source,objectives:normalizeParts(value.objectives,LIMITS.objectives,1),task:nativePart(value.task),hints:normalizeParts(value.hints??[],LIMITS.hints),solution:value.solution===undefined||value.solution===null?null:nativePart(value.solution),debrief:value.debrief===undefined||value.debrief===null?null:nativePart(value.debrief),feedback:array(value.feedback??[],4).map(item=>{fields(item,['when','part']);if(!['correct','incorrect','invalid','unavailable'].includes(item.when))fail();return{when:item.when,part:nativePart(item.part)};}),reflectionPrompts:normalizeParts(value.reflectionPrompts??[],LIMITS.reflectionPrompts),practice:value.practice??null,disclosure};
 if(new Set(declaration.feedback.map(item=>item.when)).size!==declaration.feedback.length)fail();
 const parts=[...declaration.objectives,declaration.task,...declaration.hints,...(declaration.solution?[declaration.solution]:[]),...(declaration.debrief?[declaration.debrief]:[]),...declaration.feedback.map(item=>item.part),...declaration.reflectionPrompts];if(new Set(parts.map(part=>part.id)).size!==parts.length||parts.some(part=>part.id===value.id))fail();
 let practice=null,binding=null;
 if(declaration.practice!==null){fields(declaration.practice,['kind','id']);id(declaration.practice.id);
  if(declaration.practice.kind==='exercise'){
   const instances=array(settings.exercises??[],32).map(copy),matches=instances.filter(instance=>instance.spec?.id===declaration.practice.id);if(matches.length!==1)fail('activity-practice-unavailable');const supplied=matches[0];practice=await createExercise(supplied.spec,{seed:supplied.seed,context:supplied.context});current(settings);if(canonical(practice)!==canonical(supplied)||!sameSource(practice.context.source,value.source,root))fail('activity-practice-source');binding={kind:'exercise',id:practice.spec.id,generatorVersion:practice.generatorVersion,instanceSha256:practice.hashes.instanceSha256,specSha256:practice.hashes.specSha256,contextSha256:practice.hashes.contextSha256};
  }else if(declaration.practice.kind==='sandbox'){
   const candidates=array(settings.sandboxExports??[],16).map(copy),matches=candidates.filter(item=>item.spec?.id===declaration.practice.id);if(matches.length!==1)fail('activity-practice-unavailable');practice=await verifyProblemExport(matches[0]);current(settings);if(!sameSource(practice.context.source,value.source,root))fail('activity-practice-source');binding={kind:'sandbox',id:practice.spec.id,problemSha256:practice.receipt.problemSha256,contextSha256:practice.receipt.contextSha256,exportSha256:practice.receipt.exportSha256};
  }else fail('activity-practice-unsupported');
 }
 const core={version:1,kind:'gw-authored-activity',baseURL:root,key:value.source.page.id+'#'+value.id,declaration,practiceBinding:binding,qualification:ACTIVITY_QUALIFICATION},sha256=await digest(core,settings.cryptoObject);current(settings);const result=freeze({...core,sha256});activities.set(result,{practice});return result;
}
async function verifyActivityPacket(value,settings={}){fields(value,['version','kind','baseURL','key','declaration','practiceBinding','qualification','sha256']);if(value.baseURL!==baseURL(settings.baseURL))fail('activity-packet-scope');const rebuilt=await createActivity(value.declaration,settings);if(canonical(value)!==canonical(rebuilt))fail('activity-packet-changed');return rebuilt;}
function assertActivity(value){if(!activities.has(value))fail('activity-not-current');return value;}
function activityPractice(value){assertActivity(value);return activities.get(value).practice;}
async function createActivityCatalogue(values,rawOptions={}){
 const settings=options(rawOptions);current(settings);array(values,LIMITS.activities,1);values.forEach(assertActivity);const first=values[0],project=first.declaration.source.project;
 if(new Set(values.map(value=>value.key)).size!==values.length||values.some(value=>value.baseURL!==first.baseURL||canonical(value.declaration.source.project)!==canonical(project)))fail('activity-catalogue-scope');
 const core={version:1,kind:'gw-current-activity-catalogue',baseURL:first.baseURL,project:copy(project),records:values.map(value=>({key:value.key,sha256:value.sha256})),scope:'explicitly-selected-current-public-activities'},sha256=await digest(core,settings.cryptoObject),storageScopeSha256=await digest({version:1,baseURL:first.baseURL,projectId:project.id,keys:core.records.map(record=>record.key)},settings.cryptoObject);current(settings);const result=freeze({...core,sha256,storageScopeSha256});catalogues.set(result,new Map(values.map(value=>[value.key,value])));return result;
}
function assertActivityCatalogue(value){if(!catalogues.has(value))fail('activity-catalogue-not-current');return value;}
function catalogueActivity(catalogue,key){assertActivityCatalogue(catalogue);return catalogues.get(catalogue).get(key)??null;}

return {ACTIVITY_QUALIFICATION,createActivity,verifyActivityPacket,assertActivity,activityPractice,createActivityCatalogue,assertActivityCatalogue,catalogueActivity};
})();

const activity_native = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// R5 developer draft. The native caller admits visibility/anchors; this helper
// validates their finite projection, never reads files or guesses QMD spans.
const {createActivity,createActivityCatalogue} = activity;
const {LIMITS,fields,array,text,id,hash,freeze,canonical,copy,digest,current,options,baseURL,pageURL,fail} = activity_data;
const KIND='gw-native-activities';
const QUALIFICATION='Current native part projections and explicit review/publication declarations. Hashes are observations, not source authenticity, semantic equivalence, mastery or secure assessment.';
function relativePage(value){text(value,2048);if(value.startsWith('/')||value.includes('\\')||/[?#%:\s]/u.test(value)||!value.endsWith('.html')||value.split('/').some(part=>!part||part==='.'||part==='..'||part.startsWith('.')||['_extensions','node_modules','site_libs','local-ai-assets'].includes(part.toLowerCase())))fail('activity-native-page');return value;}
function project(value){fields(value,['id','revision']);return{id:id(value.id),revision:text(value.revision,128)};}
function page(value){fields(value,['id','url','revision','sourceDigest']);if(!/^sha(?:1:[a-f0-9]{40}|256:[a-f0-9]{64})$/u.test(value.sourceDigest))fail('activity-native-source');return{id:id(value.id),url:relativePage(value.url),revision:text(value.revision,128),sourceDigest:value.sourceDigest};}
function finiteRole(value){fields(value,['id','role','sourceText'],['feedback']);id(value.id);text(value.sourceText,65536,{multiline:true});if(!['objective','task','hint','solution','debrief','feedback','reflection-prompt'].includes(value.role))fail('activity-native-role');if(value.role==='feedback'){if(!['correct','incorrect','invalid','unavailable'].includes(value.feedback))fail('activity-native-feedback');}else if(value.feedback!==undefined)fail('activity-native-feedback');return value;}
function coreFromData(value){fields(value,['version','kind','project','page','records','qualification','sha256']);if(value.version!==1||value.kind!==KIND||value.qualification!==QUALIFICATION)fail('activity-native-version');hash(value.sha256);project(value.project);page(value.page);array(value.records,LIMITS.activities,1);return{version:1,kind:KIND,project:value.project,page:value.page,records:value.records,qualification:QUALIFICATION};}
function rootedDeclaration(value,root,expectedProject,expectedPage){const declaration=copy(value);if(canonical(declaration.source?.project)!==canonical(expectedProject)||canonical(declaration.source?.page)!==canonical(expectedPage))fail('activity-native-source');declaration.source.page.url=pageURL(new URL(expectedPage.url,root).href,root);return declaration;}
/** Compile only the actual already-admitted source objects and native parts.
 * The transport retains relative URLs so deployment URLs do not pretend to be
 * publisher hashes. The browser derives its own deployment-bound identities. */
async function compileActivityData(input,rawOptions={}){
 const settings=options(rawOptions,['baseURL','exercises','sandboxExports']);current(settings);fields(input,['version','project','page','definitions','observations','objects']);if(input.version!==1)fail('activity-native-version');if(!array(input.definitions,LIMITS.activities).length)return null;const value=copy(input),root=baseURL(settings.baseURL),projectValue=project(value.project),pageValue=page(value.page);pageURL(new URL(pageValue.url,root).href,root);
 const definitions=array(value.definitions,LIMITS.activities),observations=array(value.observations,LIMITS.activities),objects=array(value.objects,50);
 const byObject=new Map(),byObservation=new Map(),usedPractice=new Set(),records=[],packets=[];
 for(const object of objects){fields(object,['id','revision','sourceText']);id(object.id);text(object.revision,128);text(object.sourceText,131072,{multiline:true});if(byObject.has(object.id))fail('activity-native-duplicate');byObject.set(object.id,object);}
 for(const observation of observations){fields(observation,['id','parts']);id(observation.id);array(observation.parts,31,2).forEach(finiteRole);if(byObservation.has(observation.id))fail('activity-native-duplicate');byObservation.set(observation.id,observation);}
 const ids=new Set();
 for(const definition of definitions){fields(definition,['id','revision','label','public','review','source'],['exercise','sandbox','disclosure']);id(definition.id);if(ids.has(definition.id))fail('activity-native-duplicate');ids.add(definition.id);if(definition.public!==true||definition.review!=='author-reviewed')fail('activity-native-policy');const observed=byObservation.get(definition.id),source=byObject.get(id(definition.source));if(!observed||!source)fail('activity-native-unavailable');if(definition.exercise!==undefined&&definition.sandbox!==undefined)fail('activity-native-practice');
  const parts=[];for(const role of observed.parts){parts.push({id:role.id,sha256:await digest(role.sourceText,settings.cryptoObject),role:role.role,...(role.feedback===undefined?{}:{feedback:role.feedback})});current(settings);}
  const all=role=>parts.filter(part=>part.role===role).map(({id,sha256})=>({id,sha256})),one=(role,required=false)=>{const matches=all(role);if(matches.length>(required?1:1)||required&&matches.length!==1)fail('activity-native-role-count');return matches[0]??null;};
  const practice=definition.exercise!==undefined?{kind:'exercise',id:id(definition.exercise)}:definition.sandbox!==undefined?{kind:'sandbox',id:id(definition.sandbox)}:null;if(practice){const key=practice.kind+':'+practice.id;if(usedPractice.has(key))fail('activity-native-practice-reused');usedPractice.add(key);}
  const declaration={version:1,id:definition.id,revision:definition.revision,label:definition.label,public:true,review:'author-reviewed',source:{project:projectValue,page:pageValue,object:{id:source.id,revision:source.revision,sha256:await digest(source.sourceText,settings.cryptoObject)}},objectives:all('objective'),task:one('task',true),hints:all('hint'),solution:one('solution'),debrief:one('debrief'),feedback:parts.filter(part=>part.role==='feedback').map(part=>({when:part.feedback,part:{id:part.id,sha256:part.sha256}})),reflectionPrompts:all('reflection-prompt'),practice,...(definition.disclosure===undefined?{}:{disclosure:definition.disclosure})};current(settings);
  const packet=await createActivity(rootedDeclaration(declaration,root,projectValue,pageValue),settings);current(settings);const normalized=copy(packet.declaration);normalized.source.page=pageValue;records.push(normalized);packets.push(packet);
 }
 await createActivityCatalogue(packets,{cryptoObject:settings.cryptoObject,signal:settings.signal,isCurrent:settings.isCurrent});current(settings);const core={version:1,kind:KIND,project:projectValue,page:pageValue,records,qualification:QUALIFICATION},sha256=await digest(core,settings.cryptoObject);current(settings);return freeze({...core,sha256});
}
/** Revalidate against the current public page and actual delivered practice.
 * This creates a fresh branded catalogue, not a trusted imported progress file. */
async function hydrateActivityData(input,rawOptions={}){
 const settings=options(rawOptions,['baseURL','page','exercises','sandboxExports']);current(settings);const value=copy(input),core=coreFromData(value),root=baseURL(settings.baseURL);const currentPage=settings.page;fields(currentPage,['project','page']);const expectedProject=project(currentPage.project),expectedPage=page(currentPage.page);if(canonical(core.project)!==canonical(expectedProject)||canonical(core.page)!==canonical(expectedPage))fail('activity-native-source');if(await digest(core,settings.cryptoObject)!==value.sha256)fail('activity-native-integrity');current(settings);
 const packets=[],practiceSettings={baseURL:root,exercises:settings.exercises,sandboxExports:settings.sandboxExports,cryptoObject:settings.cryptoObject,signal:settings.signal,isCurrent:settings.isCurrent};
 for(const record of core.records){packets.push(await createActivity(rootedDeclaration(record,root,expectedProject,expectedPage),practiceSettings));current(settings);}
 const catalogue=await createActivityCatalogue(packets,{cryptoObject:settings.cryptoObject,signal:settings.signal,isCurrent:settings.isCurrent});current(settings);return Object.freeze({data:freeze(value),packets:Object.freeze(packets),catalogue});
}

return {compileActivityData,hydrateActivityData};
})();

const activity_progress = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// R5 DEVELOPER DRAFT. No storage access before an explicit storage action.
const {createExercise,checkAnswer,EXERCISE_VERSION} = exercises;
const {parseDeliveryJSON} = delivery;
const {assertActivityCatalogue,catalogueActivity,activityPractice} = activity;
const {LIMITS,fields,array,text,hash,integer,freeze,canonical,copy,digest,current,options,fail} = activity_data;
const PROGRESS_QUALIFICATION='Private unauthenticated reader report for the exact current selected activities. Visits, help, self-completion, reflections and finite checker outcomes are separate observations; none establishes mastery, competence, source truth or mathematical proof. Imported checker outcomes are reported data, not authenticated assessment.';
const initialRows=catalogue=>catalogue.records.map(record=>({key:record.key,activitySha256:record.sha256,visitCount:0,attemptReported:false,hintsRevealed:[],solutionRevealed:false,selfCompletion:'not-reported',checks:[],reflections:[]}));
const prefix=(values,parts)=>{array(values,LIMITS.hints);if(values.some((value,index)=>value!==parts[index]?.id))fail('activity-progress-help-order');return values;};
// Admission covers the complete sealed record and the actual download form.
// Otherwise a final hash/indentation can make a successful edit impossible to
// export, restore or mutate. Refuse before replacing usable private memory.
function reportJSON(value){const raw=JSON.stringify(value,null,2)+'\n';if(raw.length>LIMITS.bytes||new TextEncoder().encode(raw).byteLength>LIMITS.bytes)fail('activity-progress-budget');return raw;}
async function seal(core,settings){const result={...core,reportSha256:await digest(core,settings.cryptoObject)};current(settings);canonical(result);reportJSON(result);return freeze(result);}
async function initialRecord(catalogue,settings){return seal({version:1,kind:'gw-private-activity-progress',authority:'unauthenticated-reader-report',catalogueSha256:catalogue.sha256,activities:initialRows(catalogue),qualification:PROGRESS_QUALIFICATION},settings);}
async function validateProgressRecord(input,catalogue,rawOptions={}){
 const settings=options(rawOptions);current(settings);assertActivityCatalogue(catalogue);const value=copy(input);fields(value,['version','kind','authority','catalogueSha256','activities','qualification','reportSha256']);if(value.version!==1||value.kind!=='gw-private-activity-progress'||value.authority!=='unauthenticated-reader-report'||value.catalogueSha256!==catalogue.sha256||value.qualification!==PROGRESS_QUALIFICATION)fail('activity-progress-context');hash(value.reportSha256);array(value.activities,LIMITS.activities);if(value.activities.length!==catalogue.records.length)fail('activity-progress-context');
 for(let index=0;index<value.activities.length;index++){
  const row=value.activities[index],expected=catalogue.records[index],activity=catalogueActivity(catalogue,expected.key),declaration=activity.declaration;fields(row,['key','activitySha256','visitCount','attemptReported','hintsRevealed','solutionRevealed','selfCompletion','checks','reflections']);if(row.key!==expected.key||row.activitySha256!==expected.sha256)fail('activity-progress-context');integer(row.visitCount,0,999);if(typeof row.attemptReported!=='boolean'||typeof row.solutionRevealed!=='boolean'||row.solutionRevealed&&!declaration.solution||!['not-reported','reported-complete','reported-incomplete'].includes(row.selfCompletion))fail();prefix(row.hintsRevealed,declaration.hints);
  const practice=activityPractice(activity);array(row.checks,LIMITS.checks);
  for(const check of row.checks){fields(check,['seed','instanceSha256','status','checkerVersion','checkingScope','help']);if(activity.practiceBinding?.kind!=='exercise'||!['correct','incorrect','invalid'].includes(check.status)||check.checkerVersion!==EXERCISE_VERSION||check.checkingScope!=='finite-generated-practice-only')fail('activity-progress-checker');integer(check.seed,0,0xffffffff);fields(check.help,['hints','solutionSeen']);prefix(check.help.hints,declaration.hints);if(check.help.hints.length>row.hintsRevealed.length||typeof check.help.solutionSeen!=='boolean'||check.help.solutionSeen&&!row.solutionRevealed)fail('activity-progress-checker');const fresh=await createExercise(practice.spec,{seed:check.seed,context:practice.context});current(settings);if(check.instanceSha256!==fresh.hashes.instanceSha256)fail('activity-progress-checker');}
  array(row.reflections,LIMITS.reflectionPrompts);const promptOrder=declaration.reflectionPrompts.map(part=>part.id);let previous=-1;for(const reflection of row.reflections){fields(reflection,['promptId','text']);const position=promptOrder.indexOf(reflection.promptId);if(position<=previous||typeof reflection.text!=='string'||reflection.text.length>LIMITS.reflectionCharacters)fail();previous=position;text(reflection.text,16000,{multiline:true});}
 }
 const {reportSha256,...core}=value;if(await digest(core,settings.cryptoObject)!==reportSha256)fail('activity-progress-integrity');current(settings);reportJSON(value);return freeze(value);
}
async function parseProgressRecord(raw,catalogue,settings={}){text(raw,LIMITS.bytes,{multiline:true});return validateProgressRecord(parseDeliveryJSON(raw,{maxBytes:LIMITS.bytes}),catalogue,settings);}
/** No reads, writes, cache enumeration, workers or models occur at creation.
 * Only remember/restore/clearSaved/reset access this one selected-scope key. */
async function createProgressSession(catalogue,rawOptions={}){
 const settings=options(rawOptions,['storageObject']);assertActivityCatalogue(catalogue);current(settings);let record=await initialRecord(catalogue,settings),epoch=0,remembered=false,origin='this-tab',storage={status:'not-requested'};
 const key='quarto-generative-activity-progress-v1:'+catalogue.storageScopeSha256;
 const store=()=>{const object=settings.storageObject??globalThis.localStorage;if(!object||typeof object.getItem!=='function'||typeof object.setItem!=='function'||typeof object.removeItem!=='function')fail('activity-progress-storage-unavailable');return object;};
 const persist=()=>{if(!remembered)return;try{store().setItem(key,JSON.stringify(record));storage={status:'saved',reportSha256:record.reportSha256};}catch{remembered=false;storage={status:'unavailable',code:'activity-progress-memory-retained'};}};
 const guard=(token,action)=>{current(settings);current(action);if(token!==epoch)fail('activity-progress-stale');};
 const rowFor=(next,key)=>{const row=next.activities.find(item=>item.key===key);if(!row)fail('activity-progress-context');return row;};
 async function mutate(change,rawAction={}){const action=options(rawAction),token=++epoch;guard(token,action);const next=copy(record);delete next.reportSha256;const result=await change(next,action,()=>guard(token,action));guard(token,action);const sealed=await seal(next,{cryptoObject:action.cryptoObject??settings.cryptoObject,isCurrent:()=>token===epoch,signal:action.signal});guard(token,action);record=sealed;origin='this-tab';persist();return result===undefined?record:{result,progress:record};}
 const api={
  get:()=>record,status:()=>freeze({origin,remembered,storage:{...storage},authority:'unauthenticated-reader-report'}),cancel(){epoch++;},
  visit:(key,action)=>mutate(next=>{const row=rowFor(next,key);row.visitCount=integer(row.visitCount+1,0,999);},action),
  reportAttempt:(key,action)=>mutate(next=>{rowFor(next,key).attemptReported=true;},action),
  revealHint:(key,hintId,action)=>mutate(next=>{const row=rowFor(next,key),parts=catalogueActivity(catalogue,key).declaration.hints;if(row.hintsRevealed.includes(hintId))return;if(parts[row.hintsRevealed.length]?.id!==hintId)fail('activity-progress-help-order');row.hintsRevealed.push(hintId);},action),
  revealSolution:(key,action)=>mutate(next=>{if(!catalogueActivity(catalogue,key)?.declaration.solution)fail('activity-progress-solution-unavailable');rowFor(next,key).solutionRevealed=true;},action),
  reportCompletion:(key,value,action)=>mutate(next=>{if(!['not-reported','reported-complete','reported-incomplete'].includes(value))fail();rowFor(next,key).selfCompletion=value;},action),
  reflect:(key,promptId,value,action)=>mutate(next=>{const row=rowFor(next,key),prompts=catalogueActivity(catalogue,key).declaration.reflectionPrompts.map(part=>part.id);if(!prompts.includes(promptId)||typeof value!=='string'||value.length>LIMITS.reflectionCharacters)fail();text(value,16000,{empty:true,multiline:true});row.reflections=row.reflections.filter(item=>item.promptId!==promptId);if(value.length)row.reflections.push({promptId,text:value});row.reflections.sort((a,b)=>prompts.indexOf(a.promptId)-prompts.indexOf(b.promptId));},action),
  checkExercise:(key,answer,seed,action)=>mutate(async(next,_action,checkCurrent)=>{const row=rowFor(next,key),activity=catalogueActivity(catalogue,key),practice=activityPractice(activity);if(activity.practiceBinding?.kind!=='exercise')fail('activity-progress-checker-unavailable');if(row.checks.length>=LIMITS.checks)fail('activity-progress-check-budget');const chosen=seed===undefined?practice.seed:integer(seed,0,0xffffffff),instance=chosen===practice.seed?practice:await createExercise(practice.spec,{seed:chosen,context:practice.context});checkCurrent();const result=await checkAnswer(instance,answer,{context:practice.context});checkCurrent();row.checks.push({seed:chosen,instanceSha256:instance.hashes.instanceSha256,status:result.status,checkerVersion:result.checkerVersion,checkingScope:result.checkingScope,help:{hints:[...row.hintsRevealed],solutionSeen:row.solutionRevealed}});return{checker:result,feedbackPart:activity.declaration.feedback.find(item=>item.when===result.status)?.part??null};},action),
  async export(rawAction={}){const action=options(rawAction),token=epoch;guard(token,action);const verified=await validateProgressRecord(record,catalogue,{...action,cryptoObject:action.cryptoObject??settings.cryptoObject});guard(token,action);return reportJSON(verified);},
  async import(raw,rawAction={}){const action=options(rawAction),token=++epoch;guard(token,action);const verified=await parseProgressRecord(raw,catalogue,{...action,cryptoObject:action.cryptoObject??settings.cryptoObject});guard(token,action);record=verified;origin='imported-reader-report';persist();return record;},
  remember(rawAction={}){const action=options(rawAction,['consent']);current(settings);current(action);if(action.consent!==true)fail('activity-progress-consent-required');remembered=true;persist();return api.status();},
  stopRemembering(){remembered=false;return api.status();},
  async restore(rawAction={}){const action=options(rawAction,['consent']);if(action.consent!==true)fail('activity-progress-consent-required');const token=++epoch;guard(token,action);let raw;try{raw=store().getItem(key);}catch{storage={status:'unavailable',code:'activity-progress-storage-unavailable'};return api.status();}if(raw===null){storage={status:'missing'};return api.status();}const {consent,...validation}=action,verified=await parseProgressRecord(raw,catalogue,{...validation,cryptoObject:action.cryptoObject??settings.cryptoObject});guard(token,action);record=verified;origin='saved-browser-report';storage={status:'observed-saved',reportSha256:record.reportSha256};return api.status();},
  clearSaved(){epoch++;remembered=false;try{store().removeItem(key);storage={status:'removed'};}catch{storage={status:'unavailable',code:'activity-progress-saved-data-may-remain'};}return api.status();},
  async reset(rawAction={}){const action=options(rawAction,['clearSaved']);if(action.clearSaved!==undefined&&typeof action.clearSaved!=='boolean')fail();const token=++epoch;guard(token,action);const fresh=await initialRecord(catalogue,{cryptoObject:action.cryptoObject??settings.cryptoObject,isCurrent:()=>token===epoch,signal:action.signal});guard(token,action);record=fresh;origin='this-tab';remembered=false;if(action.clearSaved!==false)api.clearSaved();else storage={status:'not-cleared',code:'activity-progress-saved-data-may-remain'};return api.status();}
 };
 return Object.freeze(api);
}

return {PROGRESS_QUALIFICATION,validateProgressRecord,parseProgressRecord,createProgressSession};
})();

const activity_ui = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// R5 private draft. No eager storage, network, model, Journey or Sandbox import.
const {hydrateActivityData} = activity_native;
const {createProgressSession,PROGRESS_QUALIFICATION} = activity_progress;
const {LIMITS,canonical,copy,fail} = activity_data;

/** The existing practice panel delegates an associated check to checkExercise;
 * no duplicate answer input/checker panel or second grading implementation. */
function mountActivityControls(input,settings={}){
 const doc=settings.documentObject??globalThis.document,win=settings.windowObject??globalThis.window;
 if(!doc||!win)fail('activity-ui-unavailable');
 const root=doc.createElement('div');root.className='generative-activity-progress';
 const status=doc.createElement('p');status.setAttribute('role','status');status.textContent='Preparing optional private activity controls. Authored content remains readable.';
 const nodes=[],originals=[],listeners=[],panels=[],exerciseKeys=new Map();let alive=true,disposed=false,busy=false,epoch=0,session=null,currentData=null,rawIdentity=null,cancelButton=null;
 const node=(tag,label)=>{const el=doc.createElement(tag);if(label!==undefined)el.textContent=label;return el;};
 const on=(target,name,callback)=>{target.addEventListener(name,callback);listeners.push(()=>target.removeEventListener(name,callback));};
 const control=(label,action)=>{const el=node('button',label);el.type='button';el.className='btn btn-secondary';on(el,'click',action);nodes.push(el);return el;};
 const unique=id=>{const matches=[...doc.querySelectorAll('[id]')].filter(el=>el.id===id);if(matches.length!==1)fail('activity-ui-anchor');return matches[0];};
 const identity=()=>canonical(input.data);
 const samePage=()=>{try{const actual=new URL(win.location.href),expected=new URL(input.page.page.url,input.baseURL);actual.hash='';return actual.href===expected.href;}catch{return false;}};
 const current=()=>alive&&!disposed&&samePage()&&rawIdentity===identity()&&(!settings.isCurrent||settings.isCurrent()===true)&&originals.every(entry=>unique(entry.el.id)===entry.el&&entry.el.innerHTML===entry.html)&&(!settings.readData||settings.readData()===settings.initialDataText);
 const assertCurrent=()=>{if(!current())fail('activity-ui-stale');};
 const rowFor=key=>session.get().activities.find(row=>row.key===key);
 const storageMessage=()=>{const value=session.status(),message=value.storage.status==='unavailable'?' Browser storage is unavailable; saved data may remain. Memory is usable.':value.storage.status==='removed'?' Only this activity scope’s saved report was removed.':value.remembered?' Remembering this selected private scope on this device.':' Private progress stays in memory unless you explicitly export or remember it.';return message+(panels.some(panel=>panel.reflections?.some(value=>value.dirty))?' Unsaved reflections remain in their text boxes until you save them.':'');};
 const replaceReflectionDrafts=()=>{for(const panel of panels)for(const reflection of panel.reflections)reflection.dirty=false;};
 function setBusy(value){busy=value;for(const el of nodes)if(el!==cancelButton)el.disabled=value;}
 function targeted(el){let target;try{const fragment=decodeURIComponent(new URL(win.location.href).hash.slice(1));target=fragment?unique(fragment):null;}catch{return false;}return target===el||target&&el.contains(target);}
 function render(){
  if(!session)return;
  for(const panel of panels){const row=rowFor(panel.packet.key),declaration=panel.packet.declaration;
   panel.summary.textContent='Visits reported: '+row.visitCount+'. Attempt reported: '+(row.attemptReported?'yes':'no')+'. Self-completion: '+row.selfCompletion+'. Finite checks reported: '+row.checks.length+'. These are unauthenticated reports; no mastery is inferred.';
   for(const entry of panel.disclosed){const show=entry.kind==='hint'?declaration.disclosure.hints==='open'||row.hintsRevealed.includes(entry.el.id):entry.kind==='solution'?declaration.disclosure.solution==='open'||row.solutionRevealed:declaration.disclosure.feedback==='open'||row.checks.at(-1)?.status===entry.when;entry.el.hidden=!(show||targeted(entry.el));}
   panel.hint.disabled=busy||row.hintsRevealed.length>=declaration.hints.length;panel.solution.disabled=busy||!declaration.solution||row.solutionRevealed;
   panel.completion.value=row.selfCompletion;
   for(const reflection of panel.reflections)if(!reflection.dirty)reflection.input.value=row.reflections.find(value=>value.promptId===reflection.id)?.text??'';
  }
 }
 async function run(action,success='Private report updated. No mastery or proof status was inferred.'){
  if(busy||!session)return null;const token=++epoch;setBusy(true);
  try{assertCurrent();const result=await action({isCurrent:()=>token===epoch&&current()});if(token!==epoch||!current())return null;render();status.textContent=success+storageMessage();return result;}
  catch{if(token===epoch)status.textContent='That optional update was unavailable, cancelled or stale. The last private report was retained; authored content remains readable.';return null;}
  finally{if(token===epoch){setBusy(false);render();}}
 }
 const cancel=()=>{epoch++;session?.cancel();setBusy(false);if(!disposed)status.textContent='Pending private action cancelled. The last report was retained.';};
 function download(raw){if(settings.saveFile)return settings.saveFile('activity-progress.json',raw,'application/json');const objectURL=URL.createObjectURL(new Blob([raw],{type:'application/json'})),link=node('a');link.href=objectURL;link.download='activity-progress.json';link.click();setTimeout(()=>URL.revokeObjectURL(objectURL),1000);}
 const ready=(async()=>{
  rawIdentity=identity();
  currentData=await hydrateActivityData(input.data,{baseURL:input.baseURL,page:input.page,exercises:input.exercises??[],sandboxExports:input.sandboxExports??[],cryptoObject:settings.cryptoObject,isCurrent:()=>alive&&!disposed&&rawIdentity===identity()});
  for(const packet of currentData.packets){
   const native=unique(packet.declaration.id);if(!native.classList.contains('learning-activity')||native.getAttribute('data-gw-activity')!==packet.declaration.id)fail('activity-ui-anchor');
   const allParts=[...packet.declaration.objectives,packet.declaration.task,...packet.declaration.hints,...(packet.declaration.solution?[packet.declaration.solution]:[]),...(packet.declaration.debrief?[packet.declaration.debrief]:[]),...packet.declaration.feedback.map(item=>item.part),...packet.declaration.reflectionPrompts];
   for(const part of allParts){const el=unique(part.id);if(!native.contains(el))fail('activity-ui-anchor');originals.push({el,hidden:el.hidden,html:el.innerHTML});}
   if(packet.practiceBinding?.kind==='exercise'){if(exerciseKeys.has(packet.practiceBinding.id))fail('activity-ui-practice');exerciseKeys.set(packet.practiceBinding.id,packet.key);}
   panels.push({native,packet});
  }
  session=await createProgressSession(currentData.catalogue,{cryptoObject:settings.cryptoObject,storageObject:settings.storageObject,isCurrent:current});assertCurrent();
  for(const panel of panels){const declaration=panel.packet.declaration,key=panel.packet.key,box=node('fieldset');box.className='generative-activity-controls';const heading=node('legend',declaration.label+' — your private activity report'),summary=node('p'),reflections=[];summary.className='generative-activity-summary';
   const hint=control('Show next hint',()=>run(async action=>{const next=declaration.hints[rowFor(key).hintsRevealed.length];if(!next)return;await session.revealHint(key,next.id,action);},'Next hint requested. This does not establish that it was read.'));
   const solution=control('Show worked solution',()=>run(action=>session.revealSolution(key,action),'Worked solution requested. This is help, not a checked completion.'));
   const completion=node('select');for(const [value,label]of [['not-reported','No completion reported'],['reported-complete','I report this task complete'],['reported-incomplete','I report this task incomplete']]){const option=node('option',label);option.value=value;completion.append(option);}nodes.push(completion);const completionLabel=node('label','Self-reported completion');completionLabel.append(completion);on(completion,'change',()=>{const chosen=completion.value;run(action=>session.reportCompletion(key,chosen,action));});
   box.append(heading,summary,control('Record a visit',()=>run(action=>session.visit(key))),control('Record an attempt',()=>run(action=>session.reportAttempt(key))),hint,solution,completionLabel);
   for(const [index,prompt]of declaration.reflectionPrompts.entries()){const group=node('fieldset'),legend=node('legend','Reflection '+(index+1)),link=node('a','Read the authored reflection prompt'),wrapper=node('label','Your private reflection'),textarea=node('textarea');link.href='#'+encodeURIComponent(prompt.id);textarea.maxLength=LIMITS.reflectionCharacters;textarea.rows=3;textarea.setAttribute('aria-describedby',prompt.id);nodes.push(textarea);const reflection={id:prompt.id,input:textarea,dirty:false};on(textarea,'input',()=>{reflection.dirty=true;status.textContent='Unsaved private reflection. Use its Save this reflection control; unrelated hints and checks will retain this draft.';});wrapper.append(textarea);group.append(legend,link,wrapper,control('Save this reflection',()=>{const value=textarea.value;return run(async action=>{await session.reflect(key,prompt.id,value,action);if(textarea.value===value)reflection.dirty=false;},'Private reflection updated. It is not uploaded or added to published evidence.');}));box.append(group);reflections.push(reflection);}
   panel.native.append(box);Object.assign(panel,{box,summary,hint,solution,completion,reflections,disclosed:[...declaration.hints.map(part=>({kind:'hint',el:unique(part.id)})),...(declaration.solution?[{kind:'solution',el:unique(declaration.solution.id)}]:[]),...declaration.feedback.map(item=>({kind:'feedback',when:item.when,el:unique(item.part.id)}))]});
  }
  const details=node('details'),summary=node('summary','Private progress: export, import and optional device storage'),consentLabel=node('label'),consent=node('input');consent.type='checkbox';nodes.push(consent);consentLabel.append(consent,doc.createTextNode('I choose to save this selected private activity report, including my reflections, on this device.'));
  const fileLabel=node('label','Import a private activity report JSON file'),file=node('input');file.type='file';file.accept='.json,application/json';nodes.push(file);fileLabel.append(file);
  on(file,'change',()=>{const selected=file.files?.[0];if(!selected)return;return run(async action=>{if(!Number.isSafeInteger(selected.size)||selected.size<1||selected.size>LIMITS.bytes)fail('activity-progress-budget');const bytes=new Uint8Array(await selected.arrayBuffer());if(bytes.byteLength!==selected.size||bytes.byteLength>LIMITS.bytes||!action.isCurrent())fail('activity-ui-stale');const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);await session.import(raw,action);replaceReflectionDrafts();},'Imported an unauthenticated reader report after matching current activity and source identities.');});
  details.append(summary,node('p',PROGRESS_QUALIFICATION),control('Export private activity report',()=>run(async action=>download(await session.export(action)),'Private JSON exported. The report is not authenticated assessment.')),fileLabel,consentLabel,
   control('Remember private progress on this device',()=>run(action=>{if(!consent.checked)fail('activity-progress-consent-required');return session.remember({...action,consent:true});})),
   control('Stop remembering',()=>run(()=>session.stopRemembering(),'Future writes stopped. Previously saved data may remain.')),
   control('Restore this device’s saved report',()=>run(async action=>{await session.restore({...action,consent:true});if(session.status().storage.status==='observed-saved')replaceReflectionDrafts();},'Saved data was inspected; only a current compatible report can replace memory.')),
   control('Clear this scope’s saved report',()=>run(()=>session.clearSaved(),'Selected saved report deletion attempted.')),
   control('Reset private progress and saved report',()=>run(async action=>{await session.reset(action);replaceReflectionDrafts();},'Private memory reset; selected saved report deletion attempted.')));
  cancelButton=control('Cancel pending private action',cancel);root.append(details,status,cancelButton);panels[0].native.append(root);status.textContent='Private controls ready. Visits and attempts are recorded only when requested.'+storageMessage();render();return api;
 })().catch(error=>{for(const entry of originals)entry.el.hidden=entry.hidden;for(const panel of panels)panel.box?.remove();root.remove();settings.onUnavailable?.(error?.code??'activity-ui-unavailable');throw error;});
 const api=Object.freeze({ready,hasExercise:id=>exerciseKeys.has(id),
  async checkExercise(id,answer,seed,action={}){await ready;const key=exerciseKeys.get(id);if(!key)return null;if(busy)fail('activity-progress-busy');let outcome;await run(async own=>{outcome=await session.checkExercise(key,answer,seed,{...action,isCurrent:()=>own.isCurrent()&&(!action.isCurrent||action.isCurrent()===true)});},'Finite check reported. No response text or mastery judgment was retained.');if(!outcome)fail('activity-ui-check-unavailable');return outcome.result.checker;},
  cancel,get:()=>session?.get()??null,status:()=>session?.status()??null,
  dispose(){if(disposed)return;disposed=true;cancel();listeners.splice(0).forEach(remove=>remove());for(const entry of originals)entry.el.hidden=entry.hidden;for(const panel of panels)panel.box?.remove();root.remove();}
 });
 on(win,'pagehide',()=>{alive=false;cancel();for(const entry of originals)entry.el.hidden=entry.hidden;});
 on(win,'pageshow',()=>{if(disposed)return;alive=true;if(session&&current())render();else if(session){status.textContent='This restored page no longer matches its activity source. Authored content remains readable.';setBusy(true);}});
 on(win,'hashchange',()=>{if(session&&current())render();});
 return api;
}

return {mountActivityControls};
})();

const numbas_admission = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Private original prototype. No Numbas implementation is embedded here.
const {parseDeliveryJSON} = delivery;

const NUMBAS_LIMITS=Object.freeze({files:512,totalBytes:67108864,fileBytes:16777216,entryBytes:524288,sourceBytes:524288,questions:32,parts:128,resourceReferences:4096,htmlTags:16384,readyTimeoutMs:30000});
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true}),inspections=new WeakMap(),hex=/^[a-f0-9]{64}$/u;
const QUALIFICATION='Declared, author-reviewed Numbas 11.0 number-entry package and byte identities. This is trusted same-origin authored activity, not a security sandbox, proof, mastery assessment, licence clearance or execution attestation. Host CSP is never changed.';
function fail(code){const error=new TypeError('Numbas activity: '+code);error.code=code;throw error;}
function object(value,keys,required=keys){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail('invalid-object');for(const key of Reflect.ownKeys(value)){const d=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!keys.includes(key)||!d.enumerable||!Object.hasOwn(d,'value'))fail('unknown-or-nondata-field');}for(const key of required)if(!Object.hasOwn(value,key))fail('missing-field');return value;}
function array(value,max,min=0){if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<min||value.length>max||Reflect.ownKeys(value).length!==value.length+1)fail('invalid-array');for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('invalid-array');}return value;}
function text(value,max=256){if(typeof value!=='string'||!value||value!==value.trim()||encoder.encode(value).length>max||/[\u0000-\u001f\u007f\ud800-\udfff]/u.test(value))fail('invalid-text');return value;}
function freeze(value){if(value&&typeof value==='object'&&!(value instanceof Uint8Array)){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
function canonical(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';}
async function sha(bytes,cryptoObject=globalThis.crypto){if(!cryptoObject?.subtle)fail('sha256-unavailable');return [...new Uint8Array(await cryptoObject.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}
function current({signal,isCurrent=()=>true}={}){if(signal?.aborted)throw signal.reason??new DOMException('Cancelled','AbortError');if(!isCurrent())fail('source-changed');}
function ordinaryPath(value){text(value,1024);if(value!==value.normalize('NFC')||/^[./]|[\\:%?#<>"'|\u0000-\u001f]/u.test(value)||value.split('/').some(part=>!part||part.startsWith('.')||part==='..'||part.endsWith('.')||part.endsWith(' ')||/^(?:\.git|\.quarto|_extensions|node_modules)$/iu.test(part)||/^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/iu.test(part)))fail('unsafe-local-path');return value;}
function identifier(value){text(value,128);if(!/^[A-Za-z][A-Za-z0-9._-]*$/u.test(value))fail('invalid-id');return value;}
function isoDay(value){text(value,10);const day=new Date(value+'T00:00:00Z');if(!/^\d{4}-\d\d-\d\d$/u.test(value)||!Number.isFinite(day.valueOf())||day.toISOString().slice(0,10)!==value)fail('invalid-review-day');return value;}
function options(value){object(value,['id','label','path','version','seed','questionRights']);identifier(value.id);text(value.label);ordinaryPath(value.path);if(value.version!=='11.0')fail('unsupported-version');text(value.seed,128);if(!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value.seed))fail('invalid-seed');object(value.questionRights,['licence','attribution']);text(value.questionRights.licence,512);text(value.questionRights.attribution,2048);return JSON.parse(canonical(value));}
function decode(bytes){try{return decoder.decode(bytes);}catch{fail('invalid-utf8');}}
const lineNormal=value=>value.replace(/^\uFEFF/u,'').replace(/\r\n?/gu,'\n');
function parseSource(value){const source=lineNormal(value);if(!source.startsWith('// Numbas version: finer_feedback_settings\n'))fail('unsupported-source-schema');return parseDeliveryJSON(source.slice(source.indexOf('\n')+1),{maxBytes:NUMBAS_LIMITS.sourceBytes});}
function empty(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===0;}
function emptyArray(value){return Array.isArray(value)&&value.length===0;}
// Only declared numeric substitutions are admitted. Numbas evaluates JME in
// text AND names; arbitrary built-ins such as image()/html()/string() must not
// create an unlisted resource through an apparently harmless variable.
function prose(value,names=new Set()){
 if(typeof value!=='string'||value.length>16000||/[\u0000\ud800-\udfff]/u.test(value))fail('unsupported-question-text');
 if(/&(?!(?:amp|lt|gt|quot|apos|nbsp);)/u.test(value))fail('unsupported-question-entity');
 const residue=value.replace(/<\/?(?:p|strong|em|code|sub|sup|br)\s*\/?>/giu,'');if(/[<>]/u.test(residue))fail('unsupported-question-markup');
 const rest=residue.replace(/\{([^{}]{1,512})\}/gu,(_,body)=>{expression(body,names,false);return '';});if(/[{}]/u.test(rest))fail('unsupported-question-substitution');
}
function expression(value,names=new Set(),allowRandom=true){
 if(typeof value!=='string'||!value||value.length>512)fail('unsupported-jme-expression');let at=0,nodes=0;const refs=new Set();
 const space=()=>{while(/\s/u.test(value[at]??'!'))at++;};
 const token=part=>{space();if(value.startsWith(part,at)){at+=part.length;return true;}return false;};
 function number(){space();const match=/^(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/u.exec(value.slice(at));if(!match)fail('unsupported-jme-expression');at+=match[0].length;const n=Number(match[0]);if(!Number.isFinite(n)||n>1000000)fail('unsupported-jme-number');return n;}
 function factor(depth){if(depth>16||++nodes>128)fail('jme-expression-budget');space();if(token('+')||token('-'))return factor(depth+1);if(token('(')){sum(depth+1);if(!token(')'))fail('unsupported-jme-expression');return;}const match=/^[A-Za-z_][A-Za-z0-9_]*/u.exec(value.slice(at));if(match){const name=match[0];at+=name.length;if(name==='random'){if(!allowRandom)fail('unsupported-question-substitution');if(!token('('))fail('unsupported-jme-expression');const sign=token('-')?-1:(token('+'),1),low=sign*number();if(!token('..'))fail('unsupported-jme-expression');const sign2=token('-')?-1:(token('+'),1),high=sign2*number();if(!token(')')||!Number.isInteger(low)||!Number.isInteger(high)||high<low||high-low>10000)fail('unsupported-random-range');return;}if(!names.has(name))fail('undeclared-jme-variable');refs.add(name);return;}number();}
 function power(depth){factor(depth);while(token('^'))factor(depth+1);}
 function product(depth){power(depth);while(true){if(token('*')||token('/'))power(depth+1);else break;}}
 function sum(depth){product(depth);while(true){if(token('+')||token('-'))product(depth+1);else break;}}
 sum(0);space();if(at!==value.length)fail('unsupported-jme-expression');return refs;
}
function numericVariables(question){if(question.variables===undefined)return new Set();const keys=Object.keys(question.variables);object(question.variables,keys);if(keys.length>32)fail('variable-budget');const names=new Set(keys);for(const key of keys)if(!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(key)||key==='random')fail('unsupported-variable-name');const graph=new Map();for(const key of keys){const variable=question.variables[key];object(variable,['name','definition']);if(variable.name!==key)fail('variable-identity');graph.set(key,expression(variable.definition,names));}const done=new Set(),active=new Set();function visit(key){if(active.has(key))fail('cyclic-numeric-variables');if(done.has(key))return;active.add(key);for(const target of graph.get(key))visit(target);active.delete(key);done.add(key);}keys.forEach(visit);return names;}
function booleans(value,keys){for(const key of keys)if(value[key]!==undefined&&typeof value[key]!=='boolean')fail('invalid-source-field-type');}
function finite(value,min,max){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)fail('invalid-source-number');}
function validateSourceTypes(exam){
 booleans(exam,['allowPrinting','showQuestionGroupNames','showStudentName','shuffleQuestions','shuffleQuestionGroups']);
 if(exam.duration!==undefined)finite(exam.duration,0,86400);if(exam.percentPass!==undefined)finite(exam.percentPass,0,100);
 if(exam.navigation!==undefined){const v=exam.navigation;object(v,['allowRegen','allowSteps','showFrontPage','showResultsPage','preventLeave','allowAttemptDownload','reverse','browse','onleave'],[]);booleans(v,['allowRegen','allowSteps','showFrontPage','preventLeave','allowAttemptDownload','reverse','browse']);if(v.showResultsPage!==undefined&&!['oncompletion','never','always'].includes(v.showResultsPage))fail('unsupported-navigation-mode');if(v.onleave!==undefined){object(v.onleave,['action','message']);if(!['none','warn','prevent'].includes(v.onleave.action))fail('unsupported-navigation-mode');prose(v.onleave.message);}}
 if(exam.feedback!==undefined){const v=exam.feedback,states=['showactualmarkwhen','showtotalmarkwhen','showanswerstatewhen','showpartfeedbackmessageswhen','showexpectedanswerswhen','showadvicewhen'];object(v,[...states,'enterreviewmodeimmediately','allowrevealanswer','advicethreshold','intro'],[]);for(const key of states)if(v[key]!==undefined&&!['always','never','inreview','oncompletion','afteranswer'].includes(v[key]))fail('unsupported-feedback-mode');booleans(v,['enterreviewmodeimmediately','allowrevealanswer']);if(v.advicethreshold!==undefined)finite(v.advicethreshold,0,100);if(v.intro!==undefined)prose(v.intro);}
 for(const group of exam.question_groups){if(group.name!==undefined){text(group.name);prose(group.name);}if(group.pickingStrategy!==undefined&&group.pickingStrategy!=='all-ordered')fail('unsupported-question-selection');if(group.pickQuestions!==undefined&&(!Number.isSafeInteger(group.pickQuestions)||group.pickQuestions<1||group.pickQuestions>group.questions.length))fail('invalid-question-count');for(const q of group.questions){if(q.tags!==undefined)for(const tag of array(q.tags,32))text(tag,128);for(const p of q.parts){booleans(p,['allowFractions','showPrecisionHint','showFractionHint']);if(p.precisionType!==undefined&&p.precisionType!=='none')fail('unsupported-precision-mode');if(p.notationStyles!==undefined)for(const style of array(p.notationStyles,8,1))if(!['plain','en','si-en'].includes(style))fail('unsupported-number-notation');}}}
}
function sourceProfile(exam){object(exam,['type','name','duration','percentPass','allowPrinting','showQuestionGroupNames','showStudentName','shuffleQuestions','shuffleQuestionGroups','resources','extensions','custom_part_types','navigation','feedback','question_groups'],['type','name','question_groups']);if(exam.type!=='exam')fail('unsupported-exam');text(exam.name);prose(exam.name);for(const key of ['resources','extensions','custom_part_types'])if(exam[key]!==undefined&&!emptyArray(exam[key]))fail('unsupported-extension-or-resource');let questions=0,parts=0;for(const group of array(exam.question_groups,32,1)){object(group,['name','pickingStrategy','pickQuestions','questions'],['questions']);for(const q of array(group.questions,32,1)){if(++questions>NUMBAS_LIMITS.questions)fail('question-budget');object(q,['name','statement','advice','variables','variable_groups','variablesTest','functions','rulesets','tags','resources','extensions','parts'],['name','statement','parts']);const names=numericVariables(q);text(q.name);prose(q.name,names);prose(q.statement,names);if(q.advice!==undefined)prose(q.advice,names);for(const key of ['functions','rulesets','resources','extensions','variable_groups'])if(q[key]!==undefined&&!(key==='functions'||key==='rulesets'?empty(q[key]):emptyArray(q[key])))fail('unsupported-question-extension');if(q.variables!==undefined){const keys=Object.keys(q.variables);object(q.variables,keys);if(keys.length>32)fail('variable-budget');for(const key of keys){identifier(key);const variable=q.variables[key];object(variable,['name','definition']);if(variable.name!==key)fail('variable-identity');expression(variable.definition,names);}}if(q.variablesTest!==undefined){object(q.variablesTest,['condition','maxRuns']);if(!['true','false'].includes(q.variablesTest.condition))fail('unsupported-variable-test');if(!Number.isSafeInteger(q.variablesTest.maxRuns)||q.variablesTest.maxRuns<1||q.variablesTest.maxRuns>100)fail('variable-test-budget');}for(const p of array(q.parts,16,1)){if(++parts>NUMBAS_LIMITS.parts)fail('part-budget');object(p,['type','marks','prompt','answer','minValue','maxValue','allowFractions','precisionType','notationStyles','showPrecisionHint','showFractionHint','steps'],['type','marks','prompt']);if(p.type!=='numberentry'||!Number.isFinite(p.marks)||p.marks<0||p.marks>1000)fail('unsupported-part');prose(p.prompt,names);if(p.answer!==undefined){if(p.minValue!==undefined||p.maxValue!==undefined)fail('conflicting-answer-fields');expression(p.answer,names);}else{expression(p.minValue,names);expression(p.maxValue,names);}if(p.steps!==undefined&&!emptyArray(p.steps))fail('unsupported-steps');}}}validateSourceTypes(exam);return {questions,parts};}

// Tokenizer for source structure/resource observations, not an HTML sanitizer.
// Raw script/style contents and comments cannot create a native exam candidate.
function scanEntry(html){if(encoder.encode(html).length>NUMBAS_LIMITS.entryBytes)fail('entry-budget');const tags=[],scripts=[],styles=[];let at=0,templateDepth=0,exam=null,examEnd=null;while(at<html.length){const start=html.indexOf('<',at);if(start<0)break;if(html.startsWith('<!--',start)){const end=html.indexOf('-->',start+4);if(end<0)fail('malformed-entry');at=end+3;continue;}const doctype=/^<!doctype\s+html\s*>/iu.exec(html.slice(start));if(doctype){at=start+doctype[0].length;continue;}const head=/^<(\/?)([A-Za-z][A-Za-z0-9:-]*)\b/u.exec(html.slice(start));if(!head)fail('malformed-entry');let end=start+head[0].length,quote=null;for(;end<html.length;end++){const c=html[end];if(quote){if(c===quote)quote=null;}else if(c==='"'||c==="'")quote=c;else if(c==='>')break;}if(end===html.length||quote)fail('malformed-entry');const closing=!!head[1],name=head[2].toLowerCase(),raw=html.slice(start+head[0].length,end),attrs=Object.create(null);if(!closing){let p=0;while(p<raw.length){while(/\s/u.test(raw[p]??'' )&&p<raw.length)p++;if(p>=raw.length||/^\/\s*$/u.test(raw.slice(p)))break;const m=/^([A-Za-z_:][A-Za-z0-9_.:-]*)/u.exec(raw.slice(p));if(!m)fail('malformed-attribute');const key=m[1].toLowerCase();if(Object.hasOwn(attrs,key)&&key!=='class')fail('duplicate-attribute');p+=m[0].length;while(/\s/u.test(raw[p]??'')&&p<raw.length)p++;let value='';if(raw[p]==='='){p++;while(/\s/u.test(raw[p]??'')&&p<raw.length)p++;const q=raw[p];if(q==='"'||q==="'"){const e=raw.indexOf(q,p+1);if(e<0)fail('malformed-attribute');value=raw.slice(p+1,e);p=e+1;}else{const v=/^[^\s"'`=<>]+/u.exec(raw.slice(p));if(!v)fail('malformed-attribute');value=v[0];p+=v[0].length;}}attrs[key]=value;}}
const tag={name,closing,attrs,start,end:end+1,templateDepth};tags.push(tag);if(tags.length>NUMBAS_LIMITS.htmlTags)fail('entry-tag-budget');if(name==='template')templateDepth+=closing?-1:1;if(templateDepth<0)fail('malformed-template');if(name==='numbas-exam'){if(closing){if(!exam||examEnd!==null)fail('ambiguous-exam');examEnd=start;}else{if(exam||templateDepth!==0)fail('ambiguous-exam');exam=tag;}}at=end+1;if(!closing&&['script','style','textarea','title'].includes(name)){const re=new RegExp('</'+name+'(?=[\\s/>])','giu');re.lastIndex=at;const candidate=re.exec(html);if(!candidate)fail('malformed-raw-element');const tail=html.slice(candidate.index),exact=new RegExp('^</'+name+'\\s*>','iu').exec(tail);if(!exact)fail('unsupported-raw-close');const close={index:candidate.index,0:exact[0]};const content=html.slice(at,close.index);if(name==='script')scripts.push({tag,content});if(name==='style')styles.push(content);at=close.index+close[0].length;}}
if(!exam||examEnd===null||templateDepth!==0)fail('missing-native-exam');if(Object.keys(exam.attrs).some(key=>!['storage','seed'].includes(key)))fail('unsupported-exam-attributes');const sources=scripts.filter(item=>item.tag.attrs.type==='application/numbas-exam');if(sources.length!==1||sources[0].tag.templateDepth!==0||sources[0].tag.start<exam.end||sources[0].tag.start>examEnd)fail('ambiguous-exam-source');const extensionData=scripts.filter(item=>item.tag.attrs.slot==='extension-data');if(extensionData.length!==1||extensionData[0].tag.attrs.type!=='application/json'||extensionData[0].tag.templateDepth!==0||extensionData[0].tag.start<exam.end||extensionData[0].tag.start>examEnd||!empty(parseDeliveryJSON(extensionData[0].content)))fail('unsupported-extension-data');return {tags,scripts,styles,exam,source:sources[0].content};}

function resolveResource(value,owner,available){text(value,2048);if(value.startsWith('/'))fail('unsafe-resource-url');if(value.startsWith('#')){if(!/^#[A-Za-z0-9_.:&=-]{1,128}$/u.test(value))fail('unsafe-resource-fragment');return null;}if(value.startsWith('data:')){if(value.length>65536||!/^data:image\/(?:png|gif|svg\+xml);(?:base64,|charset=utf-8,)/iu.test(value))fail('unsupported-data-resource');return null;}if(/[\\\s<>"'&]/u.test(value.replace(/#iefix&v=3\.0\.1$/u,''))||/%(?:2f|5c|25|00)/iu.test(value))fail('unsafe-resource-url');if(/^[A-Za-z][A-Za-z0-9+.-]*:|^\/\//u.test(value)){if(/^https:\/\/cdn\.jsdelivr\.net\/npm\/mathjax@(?:4|4\.1\.3)\/tex-svg\.js$/u.test(value))return {external:'mathjax-local-preparation'};fail('external-resource');}const u=new URL(value,'https://numbas.invalid/'+owner);if(u.origin!=='https://numbas.invalid'||u.username||u.password)fail('unsafe-resource-url');let decoded;try{decoded=decodeURIComponent(value.split(/[?#]/u)[0]);}catch{fail('unsafe-resource-url');}const components=owner.split('/').slice(0,-1);for(const part of decoded.split('/')){if(part===''&&components.length===0||part==='.')continue;if(part==='..'){if(!components.length)fail('resource-outside-package');components.pop();}else{if(!part)fail('unsafe-resource-url');components.push(part);}}const path=decodeURIComponent(u.pathname.slice(1));if(path!==components.join('/'))fail('unsafe-resource-url');ordinaryPath(path);if(u.search&&!((/\.(?:js|css)$/u.test(path)&&/^\?build_time=\d{1,16}(?:\.\d{1,10})?$/u.test(u.search))||(/^resources\/iconfont\/fontawesome\.(?:eot|woff|ttf)$/u.test(path)&&u.search==='?v=3.0.1')))fail('unsupported-resource-query');if(u.hash&&!(path==='resources/iconfont/fontawesome.eot'&&u.hash==='#iefix&v=3.0.1'||path.endsWith('.svg')&&/^#[A-Za-z0-9_.:-]{1,128}$/u.test(u.hash)))fail('unsafe-resource-fragment');if(!available.has(path))fail('missing-resource');return {path,url:value,query:u.search,fragment:u.hash};}
function cssResources(css){
 const result=[];let at=0;
 const whitespace=()=>{while(/\s/u.test(css[at]??'!'))at++;};
 const quoted=()=>{const quote=css[at++],start=at;while(at<css.length){if(css[at]==='\\'){at+=2;continue;}if(css[at]===quote){const value=css.slice(start,at++);return value;}if(/[\r\n]/u.test(css[at]))fail('malformed-css-string');at++;}fail('malformed-css-string');};
 const urlValue=()=>{whitespace();let value;if(css[at]==='"'||css[at]==="'")value=quoted();else{const start=at;while(at<css.length&&css[at]!==')'){if(/[\\"'(]/u.test(css[at]))fail('unsupported-css-url');at++;}value=css.slice(start,at).trim();}whitespace();if(css[at++]!==')')fail('malformed-css-url');return value;};
 while(at<css.length){const c=css[at];if(css.startsWith('/*',at)){const end=css.indexOf('*/',at+2);if(end<0)fail('malformed-css-comment');at=end+2;continue;}if(c==='"'||c==="'"){quoted();continue;}if(c==='\\')fail('unsupported-css-identifier-escape');if(c==='@'){at++;const ident=/^[A-Za-z_-]+/u.exec(css.slice(at));if(!ident)fail('unsupported-css-at-rule');at+=ident[0].length;if(ident[0].toLowerCase()==='import'){whitespace();let value;if(css[at]==='"'||css[at]==="'")value=quoted();else{const prefix=/^url\s*\(/iu.exec(css.slice(at));if(!prefix)fail('unsupported-css-import');at+=prefix[0].length;value=urlValue();}whitespace();if(css[at++]!==';')fail('unsupported-css-import');result.push(value);if(result.length>NUMBAS_LIMITS.resourceReferences)fail('resource-reference-budget');}continue;}const ident=/^[A-Za-z_-][A-Za-z0-9_-]*/u.exec(css.slice(at));if(ident){at+=ident[0].length;if(['image-set','-webkit-image-set','image','cross-fade','-webkit-cross-fade','src'].includes(ident[0].toLowerCase())&&/^\s*\(/u.test(css.slice(at)))fail('unsupported-css-image-function');if(ident[0].toLowerCase()==='url'){whitespace();if(css[at]==='('){at++;result.push(urlValue());if(result.length>NUMBAS_LIMITS.resourceReferences)fail('resource-reference-budget');}}continue;}at++;}
 return result;
}

async function inspectNumbasPackage(input,settings={}){object(input,['options','files']);const config=options(input.options),available=new Map(),names=new Set();let total=0;for(const file of array(input.files,NUMBAS_LIMITS.files,1)){object(file,['path','bytes']);const path=ordinaryPath(file.path),fold=path.toLowerCase();if(names.has(fold)||!(file.bytes instanceof Uint8Array)||file.bytes.length>NUMBAS_LIMITS.fileBytes||(total+=file.bytes.length)>NUMBAS_LIMITS.totalBytes)fail('file-budget-or-identity');names.add(fold);available.set(path,new Uint8Array(file.bytes));}current(settings);for(const required of ['index.html','source.exam','numbas-manifest.json','numbas.js','numbas.css'])if(!available.has(required))fail('missing-profile-file');const manifest=parseDeliveryJSON(decode(available.get('numbas-manifest.json')),{maxBytes:8192});object(manifest,['Numbas_version','source_url','edit_url','locale','features']);object(manifest.features,['run_headless','scorm','has_index_html','html','css','js']);if(manifest.Numbas_version!=='11.0'||manifest.source_url!==null||manifest.edit_url!==null||manifest.features.scorm!==false||manifest.features.has_index_html!==true||manifest.features.run_headless!==true||manifest.features.html!=='index.html'||manifest.features.css!=='numbas.css'||manifest.features.js!=='numbas.js')fail('unsupported-manifest');text(manifest.locale,32);if(Intl.getCanonicalLocales(manifest.locale)[0]!==manifest.locale)fail('invalid-locale');const html=decode(available.get('index.html')),scan=scanEntry(html),sourceText=decode(available.get('source.exam'));if(available.get('source.exam').length>NUMBAS_LIMITS.sourceBytes||lineNormal(sourceText)!==lineNormal(scan.source))fail('question-source-mismatch');const profile=sourceProfile(parseSource(sourceText)),observations=[],preparation=new Set(),observe=value=>{if(observations.length>=NUMBAS_LIMITS.resourceReferences)fail('resource-reference-budget');observations.push(value);};for(const tag of scan.tags){if(tag.closing)continue;if(['base','iframe','object','embed'].includes(tag.name)||tag.attrs.srcset!==undefined||tag.attrs.imagesrcset!==undefined||tag.attrs.action!==undefined||tag.attrs.formaction!==undefined||tag.attrs.ping!==undefined||tag.attrs.manifest!==undefined||tag.attrs['xml:base']!==undefined||tag.name==='meta'&&tag.attrs['http-equiv']?.toLowerCase()==='refresh')fail('unsupported-entry-resource');for(const key of ['src','href','xlink:href','poster'])if(tag.attrs[key]!==undefined){if(tag.name==='a'&&key==='href'){if(tag.attrs[key]!==''&&!tag.attrs[key].startsWith('#')&&!(tag.attrs.target==='_blank'&&['https://docs.numbas.org.uk/en/latest/accessibility/exam.html','https://www.numbas.org.uk','https://www.newcastle.ac.uk'].includes(tag.attrs[key])))fail('unsupported-navigation');continue;}const resource=resolveResource(tag.attrs[key], 'index.html',available);if(resource?.external)preparation.add(resource.external);else if(resource)observe({owner:'index.html',...resource});}if(tag.attrs.style!==undefined){if(tag.attrs.style.includes('&'))fail('unsupported-style-entity');for(const url of cssResources(tag.attrs.style)){const resource=resolveResource(url,'index.html',available);if(resource?.external)fail('external-css-resource');if(resource)observe({owner:'index.html#style-attribute',...resource});}}}for(const [path,bytes]of available)if(path.endsWith('.css'))for(const url of cssResources(decode(bytes))){const resource=resolveResource(url,path,available);if(resource?.external)fail('external-css-resource');if(resource)observe({owner:path,...resource});}for(const css of scan.styles)for(const url of cssResources(css)){const resource=resolveResource(url,'index.html',available);if(resource?.external)fail('external-css-resource');if(resource)observe({owner:'index.html#inline-style',...resource});}
const opening='<numbas-exam storage="none" seed="'+config.seed+'">',derived=encoder.encode(html.slice(0,scan.exam.start)+opening+html.slice(scan.exam.end));if(derived.length>NUMBAS_LIMITS.entryBytes)fail('derived-entry-budget');const inventory=[];for(const [path,bytes]of [...available].sort(([a],[b])=>a<b?-1:a>b?1:0)){current(settings);inventory.push({path,bytes:bytes.length,sha256:await sha(bytes,settings.cryptoObject)});}const wrapperSha256=await sha(derived,settings.cryptoObject),identity={version:1,profile:'numbas-11.0-numberentry-v1',options:config,inventory,entry:{original:'index.html',derived:'gw-numbas-entry.html',sha256:wrapperSha256},question:{path:'source.exam',sha256:inventory.find(row=>row.path==='source.exam').sha256},profileCounts:profile},sourceDigest='sha256:'+await sha(encoder.encode(canonical(identity)),settings.cryptoObject);current(settings);const result=freeze({...identity,status:preparation.size?'needs-local-preparation':'inspectable',sourceDigest,totalBytes:total,resourceObservations:observations,preparation:[...preparation],reviewDraft:{reviewer:'REPLACE_WITH_REVIEWER',date:'YYYY-MM-DD',sourceDigest},qualification:QUALIFICATION});inspections.set(result,{available,derived});return result;}
function reviewerName(value){text(value,256);if(value==='REPLACE_WITH_REVIEWER')fail('reviewer-placeholder');return value;}
function createNumbasReview(inspection,reviewer,date){if(!inspections.has(inspection)||inspection.status!=='inspectable')fail('inspection-not-admissible');return freeze({reviewer:reviewerName(reviewer),date:isoDay(date),sourceDigest:inspection.sourceDigest});}
function review(value,digest){object(value,['reviewer','date','sourceDigest']);reviewerName(value.reviewer);isoDay(value.date);if(value.sourceDigest!==digest)fail('stale-review');return JSON.parse(canonical(value));}
function baseURL(value){let url;try{url=new URL(value);}catch{fail('invalid-base-url');}if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||!url.pathname.endsWith('/'))fail('invalid-base-url');return url;}
async function prepareNumbasPublication(inspection,authorReview,{baseURL:base,packageURL,cryptoObject,signal,isCurrent}={}){const privateData=inspections.get(inspection);if(!privateData||inspection.status!=='inspectable')fail('inspection-not-admissible');const approved=review(authorReview,inspection.sourceDigest),root=baseURL(base);ordinaryPath(packageURL);if(packageURL!=='gw-numbas/'+inspection.options.id+'/'+inspection.sourceDigest.slice(7)+'/package')fail('managed-package-url-required');const folder=new URL(packageURL+'/',root);if(folder.origin!==root.origin||!folder.pathname.startsWith(root.pathname))fail('package-outside-base');const files=[...privateData.available].map(([path,bytes])=>({path,bytes:new Uint8Array(bytes)}));if(files.some(file=>file.path==='gw-numbas-entry.html'))fail('reserved-entry-collision');files.push({path:'gw-numbas-entry.html',bytes:new Uint8Array(privateData.derived)});if(files.length>NUMBAS_LIMITS.files)fail('published-file-budget');const publishedBytes=files.reduce((n,f)=>n+f.bytes.length,0);if(publishedBytes>NUMBAS_LIMITS.totalBytes)fail('published-byte-budget');current({signal,isCurrent});const payload=freeze({version:1,kind:'generative-numbas-activity',profile:inspection.profile,id:inspection.options.id,label:inspection.options.label,versionDeclared:'11.0',seed:inspection.options.seed,storage:'none',sourceDigest:inspection.sourceDigest,review:approved,questionRights:inspection.options.questionRights,identity:{version:inspection.version,profile:inspection.profile,options:inspection.options,inventory:inspection.inventory,entry:inspection.entry,question:inspection.question,profileCounts:inspection.profileCounts},packagePath:packageURL+'/',entry:'gw-numbas-entry.html',originalEntrySha256:inspection.inventory.find(file=>file.path==='index.html').sha256,questionSha256:inspection.question.sha256,files:[...inspection.inventory,{path:'gw-numbas-entry.html',bytes:privateData.derived.length,sha256:inspection.entry.sha256}],totalBytes:publishedBytes,qualification:QUALIFICATION});validateNumbasPayload(payload,{baseURL:root.href});current({signal,isCurrent});return {payload,files};}
function validateNumbasPayload(value,{baseURL:base}={}){object(value,['version','kind','profile','id','label','versionDeclared','seed','storage','sourceDigest','review','questionRights','identity','packagePath','entry','originalEntrySha256','questionSha256','files','totalBytes','qualification']);if(value.version!==1||value.kind!=='generative-numbas-activity'||value.profile!=='numbas-11.0-numberentry-v1'||value.versionDeclared!=='11.0'||value.storage!=='none'||value.entry!=='gw-numbas-entry.html'||value.qualification!==QUALIFICATION)fail('unsupported-payload');options({id:value.id,label:value.label,path:'activity',version:value.versionDeclared,seed:value.seed,questionRights:value.questionRights});if(!/^sha256:[a-f0-9]{64}$/u.test(value.sourceDigest)||!hex.test(value.originalEntrySha256)||!hex.test(value.questionSha256))fail('invalid-digest');review(value.review,value.sourceDigest);const root=baseURL(base);text(value.packagePath,2048);if(value.packagePath!=='gw-numbas/'+value.id+'/'+value.sourceDigest.slice(7)+'/package/')fail('managed-package-url-required');const folder=baseURL(new URL(value.packagePath,root).href);if(folder.origin!==root.origin||!folder.pathname.startsWith(root.pathname)||folder.pathname===root.pathname||decodeURIComponent(folder.pathname).includes('..')||/%(?:2f|5c|25)/iu.test(folder.pathname))fail('package-outside-base');ordinaryPath(decodeURIComponent(folder.pathname.slice(root.pathname.length)).replace(/\/$/u,''));const seen=new Set();let total=0;for(const file of array(value.files,NUMBAS_LIMITS.files,1)){object(file,['path','bytes','sha256']);ordinaryPath(file.path);if(seen.has(file.path.toLowerCase())||!Number.isSafeInteger(file.bytes)||file.bytes<0||file.bytes>NUMBAS_LIMITS.fileBytes||!hex.test(file.sha256))fail('invalid-file-receipt');seen.add(file.path.toLowerCase());total+=file.bytes;}object(value.identity,['version','profile','options','inventory','entry','question','profileCounts']);const identity=value.identity;options(identity.options);object(identity.entry,['original','derived','sha256']);object(identity.question,['path','sha256']);object(identity.profileCounts,['questions','parts']);array(identity.inventory,NUMBAS_LIMITS.files,1);for(const file of identity.inventory)object(file,['path','bytes','sha256']);for(const [key,limit]of [['questions',NUMBAS_LIMITS.questions],['parts',NUMBAS_LIMITS.parts]])if(!Number.isSafeInteger(identity.profileCounts[key])||identity.profileCounts[key]<1||identity.profileCounts[key]>limit)fail('invalid-profile-counts');if(identity.version!==1||identity.profile!==value.profile||identity.options.id!==value.id||identity.options.label!==value.label||identity.options.seed!==value.seed||canonical(identity.options.questionRights)!==canonical(value.questionRights)||identity.entry.original!=='index.html'||identity.entry.derived!==value.entry||identity.question.path!=='source.exam'||identity.question.sha256!==value.questionSha256||!hex.test(identity.entry.sha256)||canonical([...identity.inventory,{path:value.entry,bytes:value.files.find(f=>f.path===value.entry)?.bytes,sha256:identity.entry.sha256}])!==canonical(value.files))fail('payload-identity-mismatch');if(folder.href!==new URL('gw-numbas/'+value.id+'/'+value.sourceDigest.slice(7)+'/package/',root).href)fail('managed-package-url-required');if(total!==value.totalBytes||total>NUMBAS_LIMITS.totalBytes||!value.files.some(file=>file.path===value.entry)||!value.files.some(file=>file.path==='index.html'&&file.sha256===value.originalEntrySha256)||!value.files.some(file=>file.path==='source.exam'&&file.sha256===value.questionSha256))fail('incomplete-file-receipt');return freeze(JSON.parse(canonical(value)));}

async function verifyNumbasPayload(value,settings={}){const validated=validateNumbasPayload(value,settings);current(settings);if('sha256:'+await sha(encoder.encode(canonical(validated.identity)),settings.cryptoObject)!==validated.sourceDigest)fail('payload-digest-mismatch');current(settings);return validated;}
const validateNumbasOptions=options;

return {NUMBAS_LIMITS,QUALIFICATION,fail,object,text,freeze,canonical,sha,current,ordinaryPath,scanEntry,resolveResource,inspectNumbasPackage,createNumbasReview,prepareNumbasPublication,validateNumbasPayload,verifyNumbasPayload,validateNumbasOptions};
})();

const numbas_ui = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Private original adapter: native Numbas executes and grades its own activity.
const {NUMBAS_LIMITS,validateNumbasPayload,verifyNumbasPayload,current,sha,fail,scanEntry} = numbas_admission;
const decoder=new TextDecoder('utf-8',{fatal:true});

async function fetchBounded(url,file,{fetchImpl,signal,check}){
 check();const response=await fetchImpl(url,{signal,credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',cache:'no-store'});check();
 if(!response?.ok||response.redirected||response.url&&response.url!==url)fail('resource-unavailable-or-redirected');
 const length=response.headers?.get('content-length'),encoding=response.headers?.get('content-encoding');if(length!==null&&length!==undefined&&(!/^\d+$/u.test(length)||!Number.isSafeInteger(Number(length))||(!encoding||encoding==='identity')&&Number(length)!==file.bytes))fail('resource-length-mismatch');
 if(!response.body?.getReader)fail('bounded-stream-unavailable');const reader=response.body.getReader(),chunks=[];let size=0,completed=false;
 try{while(true){check();const result=await reader.read();check();if(result.done){completed=true;break;}if(!(result.value instanceof Uint8Array)||(size+=result.value.length)>file.bytes)fail('resource-size-mismatch');chunks.push(new Uint8Array(result.value));}if(size!==file.bytes)fail('resource-size-mismatch');const bytes=new Uint8Array(size);let at=0;for(const part of chunks){bytes.set(part,at);at+=part.length;}return bytes;
 }finally{if(!completed)try{await reader.cancel();}catch{}reader.releaseLock?.();}
}

// Observes existing v11 state; it does not infer marks, mastery or proof status.
function nativeReadiness(frame,payload,{baseURL}={}){
 try{const win=frame.contentWindow,doc=frame.contentDocument;if(!win||!doc||win.location.href!==new URL(payload.entry,new URL(payload.packagePath,baseURL)).href)return {status:'waiting'};
 const exams=doc.querySelectorAll('numbas-exam');if(exams.length!==1)return {status:'waiting'};const element=exams[0];
 if(element.getAttribute('seed')!==payload.seed||element.getAttribute('storage')!=='none')return {status:'refused',code:'native-seed-or-storage-mismatch'};
 if(typeof element.viewModel?.loaded!=='function'||element.viewModel.loaded()!==true)return {status:'waiting',element};
 const exam=typeof element.viewModel.exam==='function'?element.viewModel.exam()?.exam:null;
 if(!exam||String(exam.seed)!==payload.seed)return {status:'refused',code:'native-seed-mismatch'};
 return {status:'ready',element,seed:payload.seed};
 }catch{return {status:'waiting'};}
}

function mountNumbasActivity(container,input,{baseURL,fetchImpl=globalThis.fetch?.bind(globalThis),cryptoObject=globalThis.crypto,isCurrent=()=>true,readyTimeoutMs=NUMBAS_LIMITS.readyTimeoutMs,preflightTimeoutMs=NUMBAS_LIMITS.readyTimeoutMs,setTimeoutImpl=setTimeout,clearTimeoutImpl=clearTimeout}={}){
 const payload=validateNumbasPayload(input,{baseURL});if(!container?.ownerDocument||typeof fetchImpl!=='function'||!Number.isSafeInteger(readyTimeoutMs)||readyTimeoutMs<10||readyTimeoutMs>60000||!Number.isSafeInteger(preflightTimeoutMs)||preflightTimeoutMs<10||preflightTimeoutMs>60000)fail('invalid-ui-environment');
 const doc=container.ownerDocument,controls=doc.createElement('div'),loadButton=doc.createElement('button'),unloadButton=doc.createElement('button'),status=doc.createElement('p'),notice=doc.createElement('p'),slot=doc.createElement('div');
 controls.className='gw-numbas-controls';loadButton.type=unloadButton.type='button';loadButton.textContent='Load '+payload.label;unloadButton.textContent='Unload activity';unloadButton.disabled=true;status.setAttribute('role','status');status.setAttribute('aria-atomic','true');notice.textContent='Loads trusted same-origin Numbas activity ('+payload.files.length+' files; '+payload.totalBytes+' bytes). This frame is not a security sandbox. Host policy is unchanged. The static prompt remains available.';controls.append(loadButton,unloadButton);container.append(controls,notice,status,slot);
 let epoch=0,disposed=false,controller=null,frame=null,cleanupReady=()=>{},state=Object.freeze({status:'not-loaded',sourceDigest:payload.sourceDigest});
 const ownsFocus=node=>!disposed&&controls.ownerDocument===doc&&controls.isConnected===true&&doc.activeElement===node;
 function refreshControls(){
  const busy=state.status==='checking'||state.status==='starting',ready=state.status==='ready',ownsLoad=ownsFocus(loadButton),ownsUnload=ownsFocus(unloadButton);
  if(!ready)loadButton.disabled=false;if(busy||ready)unloadButton.disabled=false;
  if(ready&&ownsLoad)unloadButton.focus();else if(!busy&&!ready&&ownsUnload)loadButton.focus();
  loadButton.disabled=ready;unloadButton.disabled=!(busy||ready);
  if(busy){loadButton.setAttribute('aria-disabled','true');loadButton.setAttribute('aria-busy','true');}
  else{loadButton.removeAttribute('aria-disabled');loadButton.removeAttribute('aria-busy');}
 }
 const keepFrameFocus=()=>{if(frame&&ownsFocus(frame)){loadButton.disabled=false;loadButton.focus();}};
 const setState=(next,message)=>{state=Object.freeze({...next,sourceDigest:payload.sourceDigest});status.textContent=message;refreshControls();};
 const clearFrame=()=>{cleanupReady();cleanupReady=()=>{};frame?.remove();frame=null;};
 const invalidate=()=>{epoch++;controller?.abort(new DOMException('Cancelled','AbortError'));controller=null;clearFrame();};
 const active=(token,signal)=>{if(disposed||token!==epoch)throw new DOMException('Cancelled','AbortError');current({signal,isCurrent});};
 function unload(){if(disposed)return;if(ownsFocus(unloadButton)){loadButton.disabled=false;loadButton.focus();}else keepFrameFocus();invalidate();setState({status:'not-loaded'},'Activity unloaded. The static prompt remains available.');}
 async function load(){if(disposed)return state;keepFrameFocus();invalidate();const token=epoch,job=controller=new AbortController(),check=()=>active(token,job.signal);setState({status:'checking'},'Checking the declared activity files.');let timeout=setTimeoutImpl(()=>job.abort(new DOMException('Preflight timed out','TimeoutError')),preflightTimeoutMs);
 try{await verifyNumbasPayload(payload,{baseURL,cryptoObject,signal:job.signal,isCurrent:()=>!disposed&&token===epoch&&isCurrent()});check();let next=0,checked=0;const entries=new Map();async function worker(){while(next<payload.files.length){check();const file=payload.files[next++],url=new URL(file.path.split('/').map(encodeURIComponent).join('/'),new URL(payload.packagePath,baseURL)).href,bytes=await fetchBounded(url,file,{fetchImpl,signal:job.signal,check});if(await sha(bytes,cryptoObject)!==file.sha256)fail('resource-digest-mismatch');check();if(file.path===payload.entry)entries.set(file.path,bytes);checked++;setState({status:'checking',checkedFiles:checked},'Checked '+checked+' of '+payload.files.length+' activity files.');}}await Promise.all([worker(),worker()]);check();
 const entry=scanEntry(decoder.decode(entries.get(payload.entry)));if(entry.exam.attrs.seed!==payload.seed||entry.exam.attrs.storage!=='none')fail('native-seed-or-storage-mismatch');clearTimeoutImpl(timeout);timeout=null;check();frame=doc.createElement('iframe');frame.setAttribute('data-gw-numbas-focus-owner',payload.profile);frame.title=payload.label+' — Numbas activity';frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('allow','camera \u0027none\u0027; microphone \u0027none\u0027; geolocation \u0027none\u0027');
 // Same-origin authored code remains trusted. No sandbox/isolation claim or score IPC.
 const ownedFrame=frame;setState({status:'starting',checkedFiles:checked},'Waiting for the native Numbas activity. If host CSP blocks it, use the static prompt.');
 await new Promise((resolve,reject)=>{let poll=null,deadline=null,element=null,settled=false;const cleanup=()=>{if(poll!==null)clearTimeoutImpl(poll);if(deadline!==null)clearTimeoutImpl(deadline);ownedFrame.removeEventListener('load',probe);job.signal.removeEventListener('abort',abort);element?.removeEventListener('numbas:loaded',probe);};const finish=(error)=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve();};const abort=()=>finish(job.signal.reason??new DOMException('Cancelled','AbortError'));function probe(){if(settled)return;try{check();const observation=nativeReadiness(ownedFrame,payload,{baseURL});if(observation.status==='refused')fail(observation.code);if(observation.status==='ready'){finish();return;}if(observation.element&&element!==observation.element){element?.removeEventListener('numbas:loaded',probe);element=observation.element;element.addEventListener('numbas:loaded',probe);}if(poll!==null)clearTimeoutImpl(poll);poll=setTimeoutImpl(probe,100);}catch(error){finish(error);}}cleanupReady=()=>finish(new DOMException('Cancelled','AbortError'));job.signal.addEventListener('abort',abort,{once:true});ownedFrame.addEventListener('load',probe);deadline=setTimeoutImpl(()=>{const error=new Error('Numbas ready timeout');error.code='native-ready-timeout';finish(error);},readyTimeoutMs);ownedFrame.src=new URL(payload.entry,new URL(payload.packagePath,baseURL)).href;slot.append(ownedFrame);probe();});check();setState({status:'ready',checkedFiles:checked,seed:payload.seed},'Native Numbas activity is ready with the declared seed. Numbas handles answers and feedback.');return state;
 }catch(error){if(token!==epoch||disposed)return state;keepFrameFocus();job.abort();clearFrame();const code=error?.code??(error?.name==='TimeoutError'?'preflight-timeout':error?.name==='AbortError'?'cancelled':'activity-unavailable');setState({status:'unavailable',code},'Activity unavailable ('+code+'). The static prompt remains available; check the local package and host CSP.');return state;
 }finally{if(timeout!==null)clearTimeoutImpl(timeout);if(controller===job)controller=null;}}
 function dispose(){if(disposed)return;invalidate();disposed=true;loadButton.removeEventListener('click',clickLoad);unloadButton.removeEventListener('click',unload);controls.remove();notice.remove();status.remove();slot.remove();}
 const clickLoad=()=>{if(loadButton.disabled||loadButton.getAttribute('aria-disabled')==='true')return;void load();};loadButton.addEventListener('click',clickLoad);unloadButton.addEventListener('click',unload);setState({status:'not-loaded'},'Activity not loaded.');return Object.freeze({load,unload,dispose,getState:()=>state,elements:Object.freeze({loadButton,unloadButton,status,slot})});
}

return {nativeReadiness,mountNumbasActivity};
})();

const features_main = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
const {validateAdaptationPage,resolveAdaptation,ADAPTATION_AXES} = adaptation;
const {validatePublicPage,parseDeliveryJSON,loadPublication,selectClosure,prepareOffline,inspectOffline,clearOffline,applyOfflineWithdrawals} = delivery;
const {checkAnswer,createExercise} = exercises;
const {buildOerZip} = oer;
const {createJourney,validateJourney,createReturnFrame} = journey;
const {mountSandboxSessionControls,restorePendingSessionReturn,commitJourneyReturn} = sandbox_session_ui;
const {mountActivityControls} = activity_ui;
const {mountNumbasActivity} = numbas_ui;
const {mountWaiSymbolControls} = wai_symbols;
let numbasControls=[];
let activityControls=null;
let waiControls=null;

const managed=new WeakSet();
const node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
const button=(label,action)=>{const el=node('button',label);el.type='button';el.addEventListener('click',action);return el;};
const marker=(name,maximum=1048576)=>{const all=document.querySelectorAll('script.'+name);if(!all.length)return null;if(all.length!==1)throw Error('A public feature catalogue is duplicated.');return parseDeliveryJSON(all[0].textContent,{maxBytes:maximum});};
const describe=(parent,title,value)=>{const details=node('details'),summary=node('summary',title),pre=node('pre',JSON.stringify(value,null,2));details.append(summary,pre);parent.append(details);return details;};
function save(name,bytes,type){const url=URL.createObjectURL(new Blob([bytes],{type})),link=node('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function select(label,values){const wrapper=node('label',label),control=node('select');for(const value of values){const option=node('option',value.label??value);option.value=value.value??value;control.append(option);}wrapper.append(control);return{wrapper,control};}
const operation=async(status,run)=>{try{return await run();}catch{status.textContent='This optional action is unavailable. The authored content remains readable; inspect the selected sources and configuration.';return null;}};
function journeyControlState({loading=false,exporting=false,catalogue=false,route=null,current=0,detours=0,goals=0,savedReturn=false,consent=false}={}){
 const busy=loading||exporting,ready=!!catalogue&&route?.status==='complete'&&Array.isArray(route.steps)&&route.steps.length>0;
 return{load:busy,cancel:!busy,goal:busy||!catalogue||!goals,build:busy||!catalogue||!goals||detours>0,complete:busy||!ready||current>=route.steps.length-1,explore:busy||!ready||detours>=32,back:busy||!(detours||savedReturn),download:busy||!ready,transfer:busy,offline:busy||!ready||!consent};
}
function uniqueAnchor(id){const all=[...document.querySelectorAll('[id]')].filter(el=>el.id===id);if(all.length!==1)throw Error('A reviewed native anchor is missing or ambiguous.');return all[0];}

function preferences(page,config){
 if(!page.adaptation)return;
 const adaptation=validateAdaptationPage(page.adaptation,{baseURL:config.baseURL});
 for(const panel of document.querySelectorAll('.learning-preferences')){
  if(managed.has(panel))continue;managed.add(panel);
  const box=node('div');box.className='generative-feature-controls';const status=node('p','Choose reviewed alternatives. This does not infer your knowledge or translate the page.');status.setAttribute('role','status');
  const authoredDefaults={...config.defaults};if(authoredDefaults.exposition===undefined&&authoredDefaults.level!==undefined)authoredDefaults.exposition=authoredDefaults.level;delete authoredDefaults.level;
  const choices={...authoredDefaults},controls=[],more=node('details');more.className='generative-feature-advanced';more.append(node('summary','More reviewed preferences'));
  for(const axis of ADAPTATION_AXES){
   const values=[...new Set(adaptation.objects.flatMap(object=>object.groups.filter(group=>group.axis===axis).flatMap(group=>group.variants.map(variant=>variant.value))))];
   if(!values.length)continue;const entry=select(({exposition:'Exposition',terminology:'Terminology',scaffolding:'Scaffolding','prerequisite-knowledge':'Prerequisite familiarity','reading-complexity':'Reading complexity','context-interest':'Context and interest',representation:'Representation',challenge:'Challenge'})[axis],[{value:'',label:'Author defaults'},...values.map(value=>({value,label:value}))]);
   entry.control.value=choices[axis]??'';entry.control.addEventListener('change',()=>{if(entry.control.value)choices[axis]=entry.control.value;else if(authoredDefaults[axis]!==undefined)choices[axis]=authoredDefaults[axis];else delete choices[axis];apply();});(['exposition','representation','terminology'].includes(axis)?box:more).append(entry.wrapper);controls.push({...entry,axis});
  }
  const allVariants=adaptation.objects.flatMap(object=>object.groups.flatMap(group=>group.variants));
  const original=allVariants.map(variant=>{const el=uniqueAnchor(variant.anchor);if(el.getAttribute('data-gw-object')!==adaptation.objects.find(object=>object.groups.some(group=>group.variants.includes(variant))).id)throw Error('A native variant changed.');return{el,hidden:el.hidden};});
  let current;
  function apply(){
   current=resolveAdaptation(adaptation,choices);const selected=new Set(current.objects.flatMap(object=>object.groups.map(group=>group.anchor)));
   for(const entry of original)entry.el.hidden=!selected.has(entry.el.id);
   status.textContent=current.unsupportedPreferences.length?'Some choices are unavailable here; their author defaults are retained.':'Reviewed alternatives selected. Tasks, protected assertions, citations and mathematical notation retain their authored forms.';
  }
  box.append(button('Restore author defaults',()=>{for(const key of Object.keys(choices))delete choices[key];Object.assign(choices,authoredDefaults);for(const entry of controls)entry.control.value=choices[entry.axis]??'';apply();}),node('p','Choices select reviewed alternatives; they do not infer your knowledge or translate the page. Tasks, protected assertions, citations and mathematical notation remain authored.'),status);
  if(more.childNodes.length>1)box.append(more);
  describe(box,'Inspect source revisions and review declarations',{page:adaptation.page,objects:adaptation.objects,assertions:page.assertions});panel.append(box);apply();
  const restore=()=>{for(const entry of original)entry.el.hidden=entry.hidden;};window.addEventListener('pagehide',restore);window.addEventListener('pageshow',apply);
 }
}
function practice(exercises,activityController=null){
 for(const instance of exercises??[]){const panel=uniqueAnchor(instance.spec.id);if(managed.has(panel))continue;managed.add(panel);let current=instance;
  const box=node('div');box.className='generative-feature-controls';const label=node('label',instance.spec.kind.startsWith('rational-')?'Your answer (integer or fraction)':'Your answer (comma-separated set, or {})'),input=node('input');input.type='text';input.maxLength=256;label.append(input);
  const status=node('p','Checking stays on this page; no response is uploaded or recorded as mastery.');status.setAttribute('role','status');let epoch=0,checking=null;
  const clearChecking=()=>{checking=null;check.removeAttribute('aria-disabled');check.removeAttribute('aria-busy');};
  const check=button('Check this response',async()=>{if(checking!==null)return;const token=++epoch;checking=token;check.setAttribute('aria-disabled','true');check.setAttribute('aria-busy','true');try{const result=activityController?.hasExercise(current.spec.id)?await activityController.checkExercise(current.spec.id,input.value,current.seed,{isCurrent:()=>token===epoch}):await checkAnswer(current,input.value,{context:current.context});if(token!==epoch)return;status.textContent=result.status==='correct'?'Correct for this finite generated instance.':result.status==='incorrect'?'That response is incorrect for this instance. You can revise it.':'Use the stated answer format; no result was inferred.';}catch{if(token===epoch)status.textContent='The checker could not validate this instance. Read the authored task; no result was inferred.';}finally{if(checking===token)clearChecking();}});
  input.addEventListener('input',()=>{epoch++;clearChecking();status.textContent='Response changed. Check again when ready.';});
  const seedLabel=node('label','Practice seed (0–4294967295)'),seed=node('input');seed.type='text';seed.inputMode='numeric';seed.maxLength=10;seed.value=String(instance.seed);seedLabel.append(seed);
  box.append(label,check,button('Clear response',()=>{epoch++;input.value='';clearChecking();status.textContent='Response cleared.';}),seedLabel,button('Create instance with this seed',async()=>{if(!/^(?:0|[1-9]\d{0,9})$/.test(seed.value)||Number(seed.value)>0xffffffff){status.textContent='Enter a whole seed from 0 to 4294967295.';return;}const token=++epoch;clearChecking();const result=await operation(status,()=>createExercise(instance.spec,{seed:Number(seed.value),context:instance.context}));if(!result||token!==epoch)return;current=result;input.value='';clearChecking();const task=panel.querySelector('.generative-exercise-task');if(task)task.textContent=current.problem.prompt;status.textContent='A new deterministic instance is ready. Source definitions and review status are unchanged.';}),status);describe(box,'Inspect initial seed, source and finite checking scope',{seed:instance.seed,hashes:instance.hashes,context:instance.context,checkingScope:instance.checkingScope});panel.append(box);
 }
}
function sandbox(exports,page,config,sessionMappings){
 const panels=[...document.querySelectorAll('.learning-sandbox')];if(!panels.length||!exports?.length)return;
 for(const panel of panels){if(managed.has(panel))continue;managed.add(panel);const box=node('div');box.className='generative-feature-controls';
  box.append(node('p','Download a problem-only theory, open your chosen Argumentation Sandbox, and use its Import control. No solution, attempt or proof status is imported automatically.'));
  for(const item of exports){box.append(button('Download '+item.filename,()=>save(item.filename,item.text,item.mediaType??'text/plain')));describe(box,'Inspect problem/source receipt',item.receipt);}
  const href=panel.getAttribute('data-sandbox-url');if(href){const url=new URL(href,location.href);if(['http:','https:'].includes(url.protocol)&&!url.username&&!url.password){const link=node('a','Open Argumentation Sandbox');link.href=url.href;box.append(link);}}
  panel.append(box);
  mountSandboxSessionControls(panel,{page,config,problems:exports,sessionMappings:sessionMappings??[]});
 }
}
function journeys(page,config,oer){
 const panels=[...document.querySelectorAll('.learning-journey,.learning-export')];
 const key='quarto-generative-journey-v1:'+new URL(config.baseURL).pathname+':'+page.project.id;
 for(const panel of panels){if(managed.has(panel))continue;managed.add(panel);const box=node('div');box.className='generative-feature-controls';const status=node('p','Load the explicitly published page catalogues when you want a cross-page route.');status.setAttribute('role','status');status.setAttribute('tabindex','-1');
  let exportEpoch=0,exportAbort=null,refreshControls=()=>{};
  const downloadOer=async(parent)=>{const token=++exportEpoch;exportAbort?.abort();exportAbort=new AbortController();const signal=exportAbort.signal;refreshControls();try{const result=await buildOerZip(oer,{signal});if(token!==exportEpoch||signal.aborted)return;save(result.filename,result.bytes,result.mediaType);status.textContent='Selected editable files and rights manifest downloaded. Independent reconstruction and legal compatibility remain separate.';describe(parent,'Editable resource manifest',result.manifest);}catch{if(token===exportEpoch&&!signal.aborted)status.textContent='The selected editable bundle is incomplete or unavailable. No partial archive was downloaded.';}finally{if(token===exportEpoch){exportAbort=null;refreshControls();}}};
  window.addEventListener('pagehide',()=>{exportEpoch++;exportAbort?.abort();});
  if(!panel.classList.contains('learning-journey')){if(oer)box.append(button('Download editable resource bundle',()=>downloadOer(box)));else status.textContent='No editable source bundle has been explicitly selected.';box.append(status);panel.append(box);continue;}
  const actionButton=(label,action)=>{const control=button(label,(...args)=>{if(control.disabled||control.getAttribute('aria-disabled')==='true')return;return action(...args);});return control;};
  const output=node('div'),goal=select('Learning goal',[]);let catalogue=null,route=null,abort=null,epoch=0,active=0;const detours=[];let offlinePrepare=null,offlineConsent=null;
  const replaceOutput=(...rows)=>{const owned=output.contains(document.activeElement);output.replaceChildren(...rows);if(owned)status.focus();};
  function populateGoals(result,selected){goal.control.replaceChildren();for(const p of result.pages)if(p.status==='complete')for(const object of p.data.objects){const option=node('option',object.label+' ('+p.id+')');option.value=p.id+'#'+object.id;goal.control.append(option);}if(selected)goal.control.value=selected;}
  const cancel=()=>{epoch++;abort?.abort();abort=null;exportEpoch++;exportAbort?.abort();exportAbort=null;refreshControls();};
  const guarded=async(run)=>{const token=++epoch;abort?.abort();abort=new AbortController();const own=abort,timer=setTimeout(()=>own.abort(),60000);status.textContent='Loading selected public records. Cancel remains available.';refreshControls();try{const result=await run(own.signal);return token===epoch?result:null;}catch{if(token===epoch)status.textContent='The optional request could not complete. Authored content and the last complete route remain available.';return null;}finally{clearTimeout(timer);if(abort===own){abort=null;refreshControls();}}};
  const load=actionButton('Load published learning pages',async()=>{
   const result=await guarded(signal=>loadPublication(config.publication,{baseURL:config.baseURL,signal,onProgress:value=>{status.textContent='Loading selected public page catalogues; unavailable pages remain unknown.';}}));if(!result)return;catalogue=result;route=null;active=0;detours.length=0;goal.control.replaceChildren();
   for(const p of result.pages)if(p.status==='complete')for(const object of p.data.objects){const option=node('option',object.label+' ('+p.id+')');option.value=p.id+'#'+object.id;goal.control.append(option);}
   status.textContent=result.pages.every(p=>p.status==='complete')?'Published page catalogues loaded. Choose a goal.':'Some pages are unavailable. Available routes still require every hard prerequisite.';replaceOutput();describe(output,'Observed page coverage and delivered bytes',result.pages.map(p=>({id:p.id,status:p.status,observedSha256:p.observedSha256,bytes:p.bytes,observation:p.observation,reason:p.reason})));refreshControls();
  });
  const bookmark=()=>route&&catalogue?createJourney(catalogue,route,{current:active,detours:[...detours]}):null;
  const store=()=>{const value=bookmark();if(!value)return;try{sessionStorage.setItem(key,JSON.stringify(value));}catch{status.textContent='This tab cannot save its route. Ordinary page links remain available.';}};
  function renderRoute(){refreshControls();replaceOutput();if(!route||route.status!=='complete'){output.append(node('p',route?.reason??'No route selected.'));return;}const list=node('ol');route.steps.forEach((step,index)=>{const li=node('li'),link=node('a',(index===active?'Current: ':'')+step.key);link.href=step.url;link.addEventListener('click',()=>{active=index;store();refreshControls();});li.append(link,node('span',' — '+step.reason));list.append(li);});output.append(list);status.textContent='Route prepared from reviewed records. Following a link does not establish completion or mastery.';store();}
  const build=actionButton('Build cross-page route',()=>{if(!catalogue)return;const parts=goal.control.value.split('#');route=selectClosure(catalogue,{pageId:parts[0],objectId:parts[1]});active=0;detours.length=0;renderRoute();});build.disabled=true;
  const complete=actionButton('Mark current step complete and continue',()=>{if(!route?.steps.length)return;active=Math.min(active+1,route.steps.length-1);renderRoute();});
  const resume=actionButton('Resume this tab’s route',async()=>{
   let saved;try{const text=sessionStorage.getItem(key);if(!text){status.textContent='No route is saved in this tab.';return;}saved=parseDeliveryJSON(text,{maxBytes:65536});}catch{status.textContent='The saved route cannot be read. Native page links remain available.';return;}
   const result=await guarded(signal=>loadPublication(config.publication,{baseURL:config.baseURL,signal}));if(!result)return;
   let checked;try{checked=validateJourney(saved,result);}catch{status.textContent='A source or prerequisite changed, or the saved record is invalid. Build a current route; the old one was not restored.';return;}
   const parts=checked.goal.split('#'),fresh=selectClosure(result,{pageId:parts[0],objectId:parts[1]});
   catalogue=result;route=fresh;active=checked.current;detours.splice(0,detours.length,...checked.detours);populateGoals(result,checked.goal);renderRoute();
  });
  const explore=actionButton('Explore selected concept and keep route',()=>{if(!route||!catalogue)return;try{const parts=goal.control.value.split('#'),probe=selectClosure(catalogue,{pageId:parts[0],objectId:parts[1]});if(probe.status!=='complete'||detours.length>=32)return;detours.push(createReturnFrame(catalogue,{url:location.href,scrollX:scrollX,scrollY:scrollY,focus:document.activeElement?.id||null,current:active},route));store();location.assign(probe.steps.at(-1).url);}catch{status.textContent='That detour cannot be bound to the saved route. Ordinary links remain available.';}});
  const back=actionButton('Return to saved route position',async()=>{let saved;try{saved=parseDeliveryJSON(sessionStorage.getItem(key)??'null',{maxBytes:65536});}catch{return;}const fresh=await guarded(signal=>loadPublication(config.publication,{baseURL:config.baseURL,signal}));if(!fresh)return;try{saved=validateJourney(saved,fresh);const frame=saved.detours.at(-1);if(!frame){status.textContent='No detour is open.';return;}const parts=saved.goal.split('#'),plan=selectClosure(fresh,{pageId:parts[0],objectId:parts[1]});commitJourneyReturn(sessionStorage,key,createJourney(fresh,plan,{current:frame.current,detours:saved.detours.slice(0,-1)}),{version:1,project:page.project,frame},()=>location.assign(frame.url));}catch(error){status.textContent=error?.code==='return-state-not-retained'?'The return update failed and previous storage could not be fully restored. Resume or rebuild the reading route before returning.':'The saved return position is stale or invalid; no navigation was performed.';}});
  const abortRequest=actionButton('Cancel public-page or offline request',()=>{cancel();status.textContent='Request cancelled. Authored content is unchanged.';});
  const download=actionButton('Download route bookmark',()=>{const data=bookmark();if(data)save('learning-route.json',JSON.stringify(data,null,2)+'\n','application/json');});
  const clear=actionButton('Clear this tab’s route',()=>{cancel();try{sessionStorage.removeItem(key);sessionStorage.removeItem(key+':return');}catch{}route=null;catalogue=null;detours.length=0;replaceOutput();status.textContent='Tab route cleared. No learning record is retained.';refreshControls();});
  const advanced=node('details');advanced.className='generative-feature-advanced';advanced.append(node('summary','Save, restore and offline options'),resume,download,clear);
  box.append(load,goal.wrapper,build,complete,explore,back,abortRequest);
  const importLabel=node('label','Restore a route bookmark JSON file'),file=node('input');file.type='file';file.accept='.json,application/json';importLabel.append(file);file.addEventListener('change',async()=>{if(file.disabled)return;const token=++epoch;abort?.abort();abort=null;refreshControls();const selected=file.files?.[0];if(!selected)return;if(selected.size>65536){status.textContent='The route file exceeds 64 KiB.';return;}let saved;try{const text=await selected.text();if(token!==epoch)return;saved=parseDeliveryJSON(text,{maxBytes:65536});}catch{if(token===epoch)status.textContent='The route file is invalid.';return;}if(token!==epoch)return;const fresh=await guarded(signal=>loadPublication(config.publication,{baseURL:config.baseURL,signal}));if(!fresh)return;try{const checked=validateJourney(saved,fresh),parts=checked.goal.split('#');catalogue=fresh;route=selectClosure(fresh,{pageId:parts[0],objectId:parts[1]});active=checked.current;detours.splice(0,detours.length,...checked.detours);populateGoals(fresh,checked.goal);renderRoute();}catch{status.textContent='The route file is stale or incompatible. The current route was retained.';}});advanced.append(importLabel);
  if(config.offline?.enabled){
   const consent=node('label'),checkbox=node('input');checkbox.type='checkbox';consent.append(checkbox,document.createTextNode('Save this selected public route and its declared static assets on this device. Models and Sandbox data are excluded.'));
   const prepare=actionButton('Prepare selected route for offline reading',async()=>{if(!checkbox.checked||!catalogue||route?.status!=='complete'){status.textContent='Load a complete route and explicitly select offline consent first.';return;}const result=await guarded(signal=>prepareOffline(catalogue,route,{consent:true,baseURL:config.baseURL,workerURL:'gw-offline-worker.js',maxBytes:config.offline.maxBytes,expiresDays:config.offline.expiresDays,signal}));if(result){status.textContent='Saved observed route snapshot. New revisions and withdrawals cannot be checked while offline.';describe(output,'Offline files and observation time',result);}});
   offlinePrepare=prepare;offlineConsent=checkbox;checkbox.addEventListener('change',()=>refreshControls());
   advanced.append(consent,prepare,button('Inspect saved offline content',async()=>{const result=await operation(status,()=>inspectOffline({baseURL:config.baseURL}));if(result){describe(output,'Saved offline content',result);status.textContent='Saved content inspected. Availability and expiry are reported separately.';}}),actionButton('Delete this project’s offline content',async()=>{cancel();const result=await operation(status,()=>clearOffline({baseURL:config.baseURL}));if(result){status.textContent='This project’s optional saved snapshots were removed.';}}));
  }
  if(oer)advanced.append(actionButton('Download editable resource bundle',()=>downloadOer(output)));
  refreshControls=()=>{let savedReturn=false;try{const saved=parseDeliveryJSON(sessionStorage.getItem(key)??'null',{maxBytes:65536});savedReturn=Array.isArray(saved?.detours)&&saved.detours.length>0;}catch{}
   const state=journeyControlState({loading:!!abort,exporting:!!exportAbort,catalogue:!!catalogue,route,current:active,detours:detours.length,goals:goal.control.options.length,savedReturn,consent:!!offlineConsent?.checked});
   const idle=journeyControlState({catalogue:!!catalogue,route,current:active,detours:detours.length,goals:goal.control.options.length,savedReturn,consent:!!offlineConsent?.checked}),focused=document.activeElement;let handoff=false;
   const controls=[[load,'load'],[abortRequest,'cancel'],[goal.control,'goal'],[build,'build'],[complete,'complete'],[explore,'explore'],[back,'back'],[download,'download'],[file,'transfer'],[resume,'transfer'],[clear,'transfer'],...(offlinePrepare?[[offlinePrepare,'offline']]:[])];
   for(const [control,key]of controls){const waiting=control.tagName==='BUTTON'&&state[key]&&!idle[key],disabled=state[key]&&!waiting;if(disabled&&focused===control)handoff=true;control.disabled=disabled;if(waiting)control.setAttribute('aria-disabled','true');else control.removeAttribute('aria-disabled');}
   if(handoff){const target=!state.cancel?abortRequest:load;if(!target.disabled&&target.getAttribute('aria-disabled')!=='true')target.focus();else status.focus();}
  };
  box.append(node('p','Routes use reviewed source declarations and hard prerequisites. Unavailable pages remain unknown; following a route does not establish learning or mastery.'),status,output,advanced);refreshControls();panel.append(box);
  window.addEventListener('pagehide',()=>{epoch++;abort?.abort();});
 }
}
function boot(){
 try{
  const config=marker('generative-publication-data');if(!config)return;
  const baseURL=new URL(config.root,location.href).href,page=validatePublicPage(marker('generative-public-data'),{baseURL});
  const numbas=marker('generative-numbas-data',1048576);
  if(numbas&&numbasControls.length===0){if(numbas.version!==1||!Array.isArray(numbas.payloads)||numbas.payloads.length>4)throw Error('Numbas native data is unavailable.');const source=document.querySelector('script.generative-numbas-data'),original=source.textContent;
   for(const activity of numbas.payloads){const panel=uniqueAnchor(activity.id);if(!panel.classList.contains('learning-numbas'))throw Error('Numbas native panel is unavailable.');const controls=mountNumbasActivity(panel,activity,{baseURL,isCurrent:()=>source.isConnected&&source.textContent===original&&panel.isConnected&&document.querySelectorAll('#'+CSS.escape(activity.id)).length===1});numbasControls.push(controls);}
  }
  config.baseURL=baseURL;preferences(page,config);const exercises=marker('generative-exercises-data'),activityData=marker('generative-activities-data',262144);
  const waiData=marker('generative-wai-symbols-data');if(waiData&&!waiControls&&waiData.status==='reviewed'&&waiData.helper==='gw-local-symbols-v1'){
    const source=document.querySelector('script.generative-wai-symbols-data'),container=document.querySelector('.generative-symbol-inspection');
    if(container)waiControls=mountWaiSymbolControls(waiData,{baseURL,container,initialDataText:source.textContent,readData:()=>source.textContent,isCurrent:()=>source.ownerDocument===document&&container.ownerDocument===document&&source.isConnected&&container.isConnected&&document.documentElement.contains(source)&&document.documentElement.contains(container)});
  }
  if(activityData&&!activityControls){const dataNode=document.querySelector('script.generative-activities-data');activityControls=mountActivityControls({data:activityData,baseURL,page:{project:page.project,page:{id:page.page.id,url:page.page.url,revision:page.page.revision,sourceDigest:page.page.sourceDigest}},exercises,sandboxExports:marker('generative-sandbox-data')},{initialDataText:dataNode.textContent,readData:()=>dataNode.textContent,onUnavailable:()=>{const owner=document.querySelector('.learning-activity');if(owner){const notice=node('p','Optional private progress is unavailable for this page. Authored content and the existing finite practice controls remain readable.');notice.setAttribute('role','status');owner.append(notice);}}});}
  if(activityControls)activityControls.ready.then(()=>practice(exercises,activityControls)).catch(()=>practice(exercises));else practice(exercises);sandbox(marker('generative-sandbox-data'),page,config,marker('generative-sandbox-session-mappings-data'));journeys(page,config,marker('generative-oer-data',2097152));
  restorePendingSessionReturn(page,config).catch(()=>{});
  applyOfflineWithdrawals(config.publication,{baseURL}).catch(()=>{});
 }catch{for(const panel of document.querySelectorAll('.learning-preferences,.learning-journey,.learning-export'))if(!managed.has(panel)){managed.add(panel);panel.append(node('p','Optional reviewed controls are unavailable. The authored content remains readable.'));}}
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.addEventListener('pageshow',boot);window.addEventListener('pagehide',()=>{for(const controls of numbasControls)controls.dispose();numbasControls=[];waiControls?.dispose();waiControls=null;});}

return {journeyControlState};
})();
