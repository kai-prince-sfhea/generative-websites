// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Author-declared finite typed assertions, not a proof or prose-equivalence engine.
export const ASSERTION_VERSION = 1;
export const ASSERTION_LIMITS = Object.freeze({maxSorts:64,maxSignatures:128,maxAssertions:64,
  maxBindings:128,maxArity:16,maxAssumptions:32,maxConnectives:32,maxDepth:32,maxNodes:4096});
export const ASSERTION_STATUSES = Object.freeze(['claim','definition','conjecture','hypothesis','observation','self-reported','proved']);
export const ASSERTION_MODALITIES = Object.freeze(['asserted','possible','necessary']);
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
export function validateAssertionRegistry(input,options={}) {
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
export function canonicalAssertion(assertion) {
  const result=assertion&&typeof assertion==='object'?canonicalRecords.get(assertion):undefined;
  if(result===undefined)fail('unvalidated-assertion');return result;
}

/** Exact ordered structure and reachable signatures; not logical equivalence. */
export function compareAssertions(left,right) {
  const equal=canonicalAssertion(left)===canonicalAssertion(right);
  return Object.freeze({equal,reason:equal?'identical-ir':'different-ir'});
}
