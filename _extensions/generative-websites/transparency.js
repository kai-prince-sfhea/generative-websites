// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Deterministic grouping of explicitly public records, never impact inference.
export const TRANSPARENCY_VERSION='gw-transparency-v1';
export const TRANSPARENCY_SOURCE_QUALIFICATION='Caller-supplied public native-content SHA-256; no original QMD offsets or authenticated review is established.';
export const TRANSPARENCY_SOURCE_KINDS=Object.freeze(['native-content','published-cv-record']);
export const TRANSPARENCY_CV_SOURCE_QUALIFICATION='Caller-supplied SHA-256 of an exact published CV record, including its qualifications; this is not a native-content or original QMD span hash, authenticated review or verification.';
export const TRANSPARENCY_LIMITS=Object.freeze({records:512,links:32,textBytes:4000,totalBytes:262144});
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
export async function buildPeriodReport(records,options){
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
