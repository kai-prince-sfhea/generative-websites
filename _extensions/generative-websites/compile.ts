// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Installed native compiler: finite original data contracts, no AI/network.
import {parse as parseYAML,stringify as stringifyYAML} from 'stdlib/yaml';
import {prepareControlledNative} from './controlled-native.js';
import {prepareTranslations,TRANSLATION_PROFILE} from './translation-candidate.js';
import {parseDeliveryJSON} from './delivery.js';
import {prepareScenarioCandidates,SCENARIO_PROFILE} from './scenario-candidate.js';
import {prepareWaiSymbolsNative,validateWaiSymbolPNG} from './wai-symbols.js';
import {stageNumbasPage} from './numbas/lifecycle.js';
import {compileActivityData} from './activity-native.js';
import {resolve,relative,dirname,join,isAbsolute,sep,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {lstatSync,realpathSync,readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {validateAdaptationPage,resolveAdaptation} from './adaptation.js';
import {validateAssertionRegistry,canonicalAssertion} from './assertions.js';
import {validatePublicPage,validatePublication} from './delivery.js';
import {createExercise} from './exercises.js';
import {buildPeriodReport} from './transparency.js';
import {exportProblem} from './sandbox-export.js';
import {validateSessionMappings} from './sandbox-session.js';
import {validateLanguagePublication,planLanguageLinks} from './publication.js';
const sha=(v:Uint8Array|string)=>createHash('sha256').update(v).digest('hex');
const own=(v:any,allowed:string[],required:string[]=[])=>{
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!allowed.includes(k))||required.some(k=>!Object.hasOwn(v,k)))throw Error('fields');return v;
};
const txt=(v:any,max=512)=>{if(typeof v!=='string'||!v.trim()||v!==v.trim()||v.length>max||/[\u0000-\u001f\u007f]/u.test(v))throw Error('text');return v;};
const arr=(v:any,max=2000)=>{if(!Array.isArray(v)||v.length>max)throw Error('list');return v;};
const id=(v:any)=>{v=txt(v,128);if(!/^[A-Za-z][A-Za-z0-9._:-]*$/.test(v)||['constructor','prototype'].includes(v))throw Error('id');return v;};
const integer=(v:any,min:number,max:number)=>{if(typeof v==='string'&&/^-?(?:0|[1-9][0-9]*)$/.test(v))v=Number(v);if(!Number.isSafeInteger(v)||v<min||v>max)throw Error('integer');return v;};
function ordinary(root:string,path:string,max=2*1024*1024){
 const base=resolve(root),target=resolve(path),local=relative(base,target);
 if(isAbsolute(local)||local==='..'||local.startsWith('..'+sep)||lstatSync(base).isSymbolicLink()||resolve(realpathSync(base)).toLowerCase()!==base.toLowerCase())throw Error('confinement');
 let cursor=base;for(const part of local.split(sep)){cursor=join(cursor,part);if(lstatSync(cursor).isSymbolicLink())throw Error('link');}
 const before=lstatSync(target);if(!before.isFile()||before.size>max)throw Error('file');const bytes=readFileSync(target),after=lstatSync(target);
 if(bytes.length!==before.size||before.ino!==after.ino||before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw Error('changed');return bytes;
}
function outputPath(v:any){v=txt(v,2048);if(v.includes('\\')||v.startsWith('/')||v.includes('//')||/[?#%:\s]/u.test(v)||v.split('/').some((p:string)=>!p||p==='.'||p==='..'||p.startsWith('.')))throw Error('output');return v;}
function privateDeclaration(value:any,depth=0):boolean{
 if(depth>32)throw Error('source-metadata-depth');if(!value||typeof value!=='object')return false;
 if(value.public===false||value.publish===false||value.consent===false||value.visibility==='private'||value.audience==='private')return true;
 return Object.values(value).some(v=>privateDeclaration(v,depth+1));
}
function sourceMetadata(path:string,bytes:Uint8Array){
 if(/\.(?:ya?ml|json|qmd)$/u.test(path)){
  const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);let meta:any=null;
  if(/\.json$/u.test(path))meta=JSON.parse(text);
  else if(/\.ya?ml$/u.test(path))meta=parseYAML(text);
  else if(/^---\r?\n/u.test(text)){const match=/^---\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)\r?\n/u.exec(text);if(!match)throw Error('source-frontmatter');meta=parseYAML(match[1]);}
  if(privateDeclaration(meta))throw Error('source-private-declaration');
  if(/\.qmd$/u.test(path)&&/\{[^}\n]*(?:\.private\b|\.content-hidden\b|(?:public|consent)\s*=\s*["']?false\b)/u.test(text))throw Error('source-private-body');
  return{meta,text};
 }
 return{meta:null,text:null};
}
function expression(v:any,pageId:string,depth=0,budget={n:0}):any{
 if(++budget.n>512||depth>16)throw Error('prerequisite-budget');if(v===undefined||v===null)return null;
 if(typeof v==='string'){const parts=v.split('#');if(parts.length>2)throw Error('ref');return{ref:parts.length===2?id(parts[0])+'#'+id(parts[1]):pageId+'#'+id(v)};}
 if(Array.isArray(v))return v.length?{all:arr(v,50).map(x=>expression(x,pageId,depth+1,budget))}:null;
 own(v,['ref','all','any']);const keys=Object.keys(v);if(keys.length!==1)throw Error('expression');const key=keys[0];
 if(key==='ref')return expression(v.ref,pageId,depth+1,budget);const children=arr(v[key],50);if(!children.length)throw Error('empty-group');return{[key]:children.map(x=>expression(x,pageId,depth+1,budget))};
}
async function effectiveSiteURL(root:string){
 // Quarto 1.11.5 omits website project settings from the Pandoc metadata API.
 // Ask Quarto for its effective project configuration; do not parse project YAML.
 const result=await new Deno.Command(Deno.env.get('QUARTO_BIN')||'quarto',{args:['inspect',root],stdin:'null',stdout:'piped',stderr:'null',signal:AbortSignal.timeout(30000)}).output();
 if(!result.success||result.stdout.length>2*1024*1024)throw Error('project-inspection');
 const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(result.stdout));
 const site=value?.config?.website?.['site-url'];if(site===undefined)return undefined;return txt(site,2048);
}
async function compile(input:any){
 own(input,['version','root','inputDir','pageURL','language','html','options','objects','pageSource','siteURL','controlled','realisations','scenarioRows','symbolRows','activities','activitySources','sourcePath','numbasRows','numbasRunId','numbasOutputRoot','translationRows'],['version','root','inputDir','pageURL','language','html','options','objects','pageSource']);
 if(input.version!==1||typeof input.html!=='boolean')throw Error('version');const root=resolve(input.root),inputDir=resolve(input.inputDir);
 let options=input.options;own(options,['translations','enabled','prerequisites','graph-prerequisites','local-ai-sources','catalogue','numbas','activities','controlled-authoring','scenario-candidates','wai-adapt','project','defaults','assertions','exercises','records','reports','sandbox','sandbox-session-mappings','publication','offline','oer']);
 if(options.catalogue!==undefined){
  const bytes=ordinary(root,resolve(inputDir,txt(options.catalogue,2048)),1024*1024);
  const catalogue=parseYAML(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  own(catalogue,['translations','version','numbas','activities','controlled-authoring','scenario-candidates','wai-adapt','project','defaults','prerequisites','assertions','exercises','records','reports','sandbox','sandbox-session-mappings','publication','offline','oer'],['version']);if(catalogue.version!==1)throw Error('catalogue-version');
  options={...catalogue,...options,project:{...(catalogue.project??{}),...(options.project??{})},defaults:{...(catalogue.defaults??{}),...(options.defaults??{})}};
 }
 async function prepareNumbas(){ let numbas=null;
 if(input.sourcePath!==undefined&&(options.numbas!==undefined||typeof input.numbasRunId==='string')){let requested=options.numbas;
  if(requested!==undefined&&requested!==false){arr(requested,4);if(!requested.length)throw Error('numbas-empty');requested=requested.map((item:any)=>{own(item,['id','label','path','version','seed','question-rights','review'],['id','label','path','version','seed','question-rights']);return{id:item.id,label:item.label,path:item.path,version:item.version,seed:item.seed,questionRights:item['question-rights'],...(item.review!==undefined?{review:item.review}:{})};});}
  numbas=await stageNumbasPage({root,inputDir,outputRoot:input.numbasOutputRoot,sourcePath:input.sourcePath,pageURL:input.pageURL,html:input.html,pageSource:input.pageSource,activities:requested,observations:input.numbasRows??[],runId:input.numbasRunId??null});
  if(numbas)numbas={...numbas,inspections:numbas.inspections.map((item:any)=>({...item,reviewYAML:stringifyYAML({review:item.reviewDraft})}))};
 }
return numbas;}
 const numbasOnly=!input.html&&input.sourcePath!==undefined&&(options.numbas!==undefined||input.numbasRunId!==undefined)&&Object.keys(options).every(key=>['enabled','numbas','catalogue','project','defaults'].includes(key))&&(input.objects??[]).length===0&&(input.controlled??[]).length===0&&(input.realisations??[]).length===0&&(input.activities??[]).length===0;
 if(numbasOnly)return {version:1,numbas:await prepareNumbas(),selection:{objects:[]}};
 const project=options.project??{};own(project,['id','revision','page-id','page-revision','page-url']);
 const projectId=id(project.id??'learning'),revision=txt(project.revision??'draft-1',128),pageId=id(project['page-id']??basename(input.pageURL).replace(/\.[^.]+$/,''));
 const pageRevision=txt(project['page-revision']??revision,128),language=txt(input.language,64);
 const siteURL=input.siteURL??(input.html&&options.publication?.['language-sets']!==undefined?await effectiveSiteURL(root):undefined);
 const base=new URL(siteURL??'https://quarto.invalid/');if(!['https:','http:'].includes(base.protocol)||base.username||base.password||base.search||base.hash)throw Error('site-url');if(!base.pathname.endsWith('/'))base.pathname+='/';const baseURL=base.href;
 const defaults=options.defaults??{};own(defaults,['exposition','terminology','scaffolding','prerequisite-knowledge','reading-complexity','context-interest','representation','challenge','level']);for(const v of Object.values(defaults))txt(v,128);
 const pubOptions=options.publication??{};own(pubOptions,['pages','assets','withdrawn','expiresAt','language-sets']);
 let pageURL=project['page-url']??input.pageURL;
 if(!input.html&&!project['page-url']){const match=(pubOptions.pages??[]).find((v:any)=>v.id===pageId);if(!match)throw Error('native-public-url');pageURL=match.url;}
 pageURL=outputPath(pageURL);if(input.html&&pageURL!==input.pageURL)throw Error('actual-output-mismatch');
 if(!pageURL.endsWith('.html'))throw Error('html-publication-url');
 const page={id:pageId,url:pageURL,language,revision:pageRevision,sourceDigest:'sha1:'+createHash('sha1').update(input.pageSource).digest('hex')};
 let translations=null;
 if(options.translations!==false&&((input.translationRows??[]).length||options.translations!==undefined)){
  const cfg=options.translations??{};own(cfg,['mode','imports','reviews']);const imported=[];
  for(const filename of arr(cfg.imports??[],16)){txt(filename,2048);const path=resolve(inputDir,filename);const bytes=ordinary(root,path,262144);imported.push(parseDeliveryJSON(bytes.toString('utf8'),{maxBytes:262144}));}
  const runtime=dirname(fileURLToPath(import.meta.url)),artifacts:any={};for(const filename of ['translation-candidate.js','translation-native.lua','translation-prepare.ts','translation-private-workspace.js','controlled-authoring.js','assertions.js','delivery.js','adaptation.js','features.lua','compile.ts'])artifacts[filename]=sha(ordinary(runtime,join(runtime,filename),1024*1024));
  translations=await prepareTranslations({config:cfg,rows:input.translationRows??[],imports:imported,compiler:{profile:TRANSLATION_PROFILE,artifacts}});
 }
 const nativeObjects=input.objects;let controlledPrepared:any=null;
 if(options['controlled-authoring']!==undefined||(input.controlled??[]).length||(input.realisations??[]).length){
  controlledPrepared=await prepareControlledNative({options,objects:input.objects,controlled:input.controlled??[],realisations:input.realisations??[]});
  options=controlledPrepared.options;input={...input,objects:controlledPrepared.objects};
 }
 const adaptationObjects:any[]=[],publicObjects:any[]=[],sourceById=new Map();
 for(const raw of arr(input.objects,50)){
  own(raw,['id','revision','label','context','conceptId','reviewedBy','sourceDigest','sourceText','assertionId','groups'],['id','revision','label','context','conceptId','reviewedBy','sourceDigest','sourceText','groups']);
  const objectId=id(raw.id);if(sourceById.has(objectId))throw Error('duplicate-object');
  txt(raw.conceptId,512);if(!/^[A-Za-z][A-Za-z0-9+.-]*:[^\s<>"']+$/u.test(raw.conceptId))throw Error('concept-uri');
  const source={path:pageURL,anchor:objectId,sha256:sha(raw.sourceText)};sourceById.set(objectId,source);
  const groups=arr(raw.groups,100);if(groups.length)adaptationObjects.push({id:objectId,revision:raw.revision,sourceDigest:raw.sourceDigest,context:raw.context,...(raw.assertionId?{assertionId:raw.assertionId}:{}),groups});
  const prerequisites=expression((options.prerequisites??{})[objectId],pageId);
  publicObjects.push({id:objectId,conceptId:raw.conceptId,revision:txt(raw.revision,128),label:txt(raw.label),context:txt(raw.context,128),url:pageURL+'#'+objectId,prerequisites});
 }
 const adaptation=adaptationObjects.length?validateAdaptationPage({version:1,kind:'generative-adaptation-page',page:{id:pageId,url:pageURL,language,sourceDigest:page.sourceDigest},objects:adaptationObjects},{baseURL}):null;
 const selection=adaptation?resolveAdaptation(adaptation,defaults):{objects:[],unsupportedPreferences:[]};
 let assertions=null,assertionIdentities:any[]=[];
 if(options.assertions!==undefined){
  const fullRegistry=validateAssertionRegistry({...options.assertions,version:integer(options.assertions.version,1,1)});
  assertions=validateAssertionRegistry({...fullRegistry,bindings:fullRegistry.bindings.filter((b:any)=>sourceById.has(b.objectId))});
  const originals=new Map(input.objects.map((x:any)=>[x.id,x]));
  const bound=new Set();
  for(const b of assertions.bindings){const object:any=originals.get(b.objectId),assertion=assertions.assertions.find((a:any)=>a.id===b.assertionId);if(!object||bound.has(b.objectId)||object.revision!==b.objectRevision||object.sourceDigest!==b.sourceDigest||object.assertionId!==b.assertionId||object.context!==assertion.context)throw Error('assertion-source-binding');bound.add(b.objectId);}
  for(const object of input.objects)if(object.assertionId&&!bound.has(object.id))throw Error('missing-assertion-binding');
  assertionIdentities=assertions.assertions.map((a:any)=>({id:a.id,revision:a.revision,irSha256:sha(canonicalAssertion(a))}));
 }else if(input.objects.some((o:any)=>o.assertionId))throw Error('missing-assertion-registry');
 const publicPage=validatePublicPage({version:1,kind:'generative-public-page',project:{id:projectId,revision},page,objects:publicObjects,adaptation,assertions},{baseURL});
 const publication=validatePublication({version:1,id:projectId,revision,pages:pubOptions.pages??[{id:pageId,url:pageURL,revision:pageRevision}],assets:pubOptions.assets??[],withdrawn:pubOptions.withdrawn??[],...(pubOptions.expiresAt?{expiresAt:pubOptions.expiresAt}:{})},{baseURL});
 // Native writers have their own whole-page AST. Object assertion bindings
 // still apply; Word must not claim an HTML page-byte/source attestation.
 const self=publication.pages.find((x:any)=>x.id===pageId);if(!self||self.url!==pageURL||self.revision!==pageRevision||self.language!==undefined&&Intl.getCanonicalLocales(self.language)[0]!==Intl.getCanonicalLocales(page.language)[0]||input.html&&self.sourceDigest!==undefined&&self.sourceDigest!==page.sourceDigest)throw Error('publication-self');
 let languageLinks=null;
 if(pubOptions['language-sets']!==undefined&&input.html){
  const mapping=validateLanguagePublication({version:1,project:{id:projectId,revision},sets:pubOptions['language-sets']},{pages:publication.pages,project:{id:projectId,revision},currentPage:page,baseURL,...(siteURL?{siteURL}:{})});
  for(const set of mapping.sets)if(set.realisations.some((r:any)=>r.pageId===pageId)&&set.assertion){const identity=assertionIdentities.find(x=>x.id===set.assertion.id&&x.revision===set.assertion.revision),actual=assertions?.assertions.find((a:any)=>a.id===set.assertion.id),bound=assertions?.bindings.some((b:any)=>b.assertionId===set.assertion.id&&b.assertionRevision===set.assertion.revision);if(!identity||!actual||!bound||actual.context!==set.context||'sha256:'+identity.irSha256!==set.assertion.irDigest)throw Error('language-ir-binding');}
  languageLinks=planLanguageLinks(mapping,pageId);
 }
 const offline=options.offline??{enabled:false};own(offline,['enabled','maxBytes','expiresDays']);if(typeof offline.enabled!=='boolean')throw Error('offline-enabled');
 if(offline.maxBytes!==undefined)offline.maxBytes=integer(offline.maxBytes,1024,64*1024*1024);if(offline.expiresDays!==undefined)offline.expiresDays=integer(offline.expiresDays,1,30);
 const context=(objectId:any)=>{const source=sourceById.get(id(objectId));if(!source)throw Error('source-object');return{source};};
 const exercises=[];
 for(const x of arr(options.exercises??[],32)){
  own(x,['id','revision','kind','label','public','review','min','max','maxDenominator','setSize','seed','source'],['id','revision','kind','public','review','seed','source']);
  const {seed,source,...spec}=x;for(const key of ['min','max','maxDenominator','setSize'])if(spec[key]!==undefined)spec[key]=integer(spec[key],-20,20);
  exercises.push(await createExercise(spec,{seed:integer(seed,0,0xffffffff),context:context(source)}));
 }
 const recordSource=(r:any)=>r.public===true&&r.review==='author-reviewed'&&typeof r.source==='string'?{...r,source:context(r.source).source}:r;
 const records=arr(options.records??[],2000).map(recordSource),reports=[];
 for(const r of arr(options.reports??[],24)){
  own(r,['id','period','start','review','targets'],['id','period','start']);
  const result=await buildPeriodReport(records,{period:r.period,start:r.start,...(r.review?{review:r.review}:{}),...(r.targets?{targets:arr(r.targets).map(recordSource)}:{})});
  const linkTargets=[...records,...(r.targets??[]).map(recordSource)].filter((x:any)=>x.public===true&&x.review==='author-reviewed'&&x.source&&typeof x.source==='object').map((x:any)=>({id:x.id,label:x.label,source:x.source}));
  reports.push({...result,linkTargets,id:id(r.id),title:(r.period==='day'?'Daily':'Weekly')+' transparency report — '+r.start,
   notice:result.status==='author-reviewed-declaration'?'Declared author-reviewed report; dates and associations do not establish causal impact.':'Draft public-record report. Review the exact source fingerprint before declaring it reviewed.'});
 }
 const sandbox=[];
 for(const raw of arr(options.sandbox??[],16)){own(raw,['spec','source','route'],['spec','source']);sandbox.push(await exportProblem({...raw.spec,version:integer(raw.spec.version,1,1)},{...context(raw.source),...(raw.route?{route:raw.route}:{})}));}
 let scenarioCandidates=null;
 if(options['scenario-candidates']!==undefined&&options['scenario-candidates']!==false){
  const config=own(options['scenario-candidates'],['mode','scenarios','reviews']);
  // Pandoc metadata numbers can arrive as MetaInlines strings. Normalize only
  // this declared native version field; the pure candidate protocol stays strict.
  const scenarioConfig={...config,...(config.reviews===undefined?{}:{reviews:arr(config.reviews,16).map(review=>({...review,version:integer(review.version,1,1)}))})};
  const runtime=dirname(fileURLToPath(import.meta.url)),artifacts:any={};
  for(const file of ['features.lua','compile.ts','scenario-candidate.js','controlled-native.js','controlled-authoring.js','assertions.js','sandbox-export.js'])artifacts[file]=sha(ordinary(runtime,join(runtime,file),1024*1024));
  scenarioCandidates=await prepareScenarioCandidates({config:scenarioConfig,compilation:controlledPrepared?.compilation??null,objects:nativeObjects,observations:input.scenarioRows??[],project:{id:projectId,revision},page:{id:page.id,url:page.url,revision:page.revision,sourceDigest:page.sourceDigest},compiler:{profile:SCENARIO_PROFILE,artifacts,executionAttestation:'not-provided'}});
  for(const exported of scenarioCandidates.exports){if(sandbox.some(value=>value.spec.id===exported.spec.id))throw Error('scenario-sandbox-duplicate');sandbox.push(exported);}
 }
 let waiSymbols=null;const waiResources:string[]=[];
 if(options['wai-adapt']!==undefined&&options['wai-adapt']!==false){
  const cfg=options['wai-adapt'];own(cfg,['mode','helper','symbols','reviews']);const assets=[];let total=0;
  for(const entry of arr(cfg.symbols??[],32)){
   own(entry,['concept','path','licence','attribution']);const path=txt(entry.path,2048);
   if(/[\\%?#:\u0000-\u0020]/u.test(path)||isAbsolute(path)||path.split('/').some(p=>!p||p!=='.'&&p!=='..'&&p.startsWith('.')))throw Error('symbol-path');
   const absolute=resolve(inputDir,path),publicPath=outputPath(relative(root,absolute).split(sep).join('/'));
   const bytes=ordinary(root,absolute,262144);total+=bytes.length;if(total>2097152)throw Error('symbol-budget');validateWaiSymbolPNG(bytes);
   const offset='../'.repeat(pageURL.split('/').length-1);
   assets.push({concept:txt(String(entry.concept),16),path:publicPath,url:offset+publicPath,bytes:bytes.length,sha256:sha(bytes),licence:txt(entry.licence,2048),attribution:txt(entry.attribution,2048)});waiResources.push(absolute);
  }
  const observations=arr(input.symbolRows??[],32).map(row=>{own(row,['id','revision','concept','sourceDigest','sourceText','text','reviewedBy','unsupported'],['id','revision','concept','sourceDigest','sourceText','text','reviewedBy']);if(row.unsupported)throw Error('symbol-native-ineligible');const{sourceText,unsupported,...rest}=row;return{...rest,sourceSha256:sha(sourceText)};});
  waiSymbols=await prepareWaiSymbolsNative({config:cfg,observations,assets,scope:{projectId,projectRevision:revision,pageURL,pageSourceSha256:sha(input.pageSource)}});
 }
 const activitySources=arr(input.activitySources??[],50).map(id);
 const activities=await compileActivityData({version:1,project:{id:projectId,revision},page:{id:page.id,url:page.url,revision:page.revision,sourceDigest:page.sourceDigest},definitions:options.activities??[],observations:input.activities??[],objects:input.objects.filter((object:any)=>activitySources.includes(object.id)).map((object:any)=>({id:object.id,revision:object.revision,sourceText:object.sourceText}))},{baseURL,exercises,sandboxExports:sandbox});
 const sandboxSessionMappings=await validateSessionMappings(options['sandbox-session-mappings']??[],sandbox);
 let oer=null;
 if(options.oer!==undefined){
  const cfg=own(options.oer,['source-consent','files','title','include-runtime'],['source-consent','files']);if(cfg['source-consent']!==true)throw Error('source-consent');
  const components:any[]=[],omissions:any[]=[],seen=new Set(),dependencies:any[]=[],selectors=new Set();let total=0;
  const add=(path:string,bytes:Uint8Array,rights:any)=>{path=outputPath(path);if(seen.has(path))throw Error('archive-duplicate');seen.add(path);total+=bytes.length;if(total>1400000)throw Error('source-pack-budget');components.push({path,bytes:bytes.length,sha256:sha(bytes),base64:Buffer.from(bytes).toString('base64'),rights});};
  for(const item of arr(cfg.files,64)){
   own(item,['path','licence','attribution','modifications','ai','required'],['path','licence','attribution','modifications','ai']);
   const path=outputPath(item.path),rights={licence:txt(item.licence,2048),attribution:txt(item.attribution,2048),modifications:txt(item.modifications,2048),ai:txt(item.ai,2048)};
   if(/^(?:unknown|noassertion|restricted|all rights reserved)$/iu.test(rights.licence)){omissions.push({path,reason:'No declared reusable rights',required:item.required!==false});continue;}
   const bytes=ordinary(root,resolve(root,path),1024*1024),parsed=sourceMetadata(path,bytes);
   if(path.endsWith('.qmd')){
    const metadata=parsed.meta??{};
    for(const filter of metadata.filters??[]){if(typeof filter!=='string'||!['generative-websites','kai-prince-sfhea/generative-websites'].includes(filter)){omissions.push({path:'missing/filter-'+omissions.length,reason:'This declared standalone bundle does not include a required additional filter',required:true});}else selectors.add(filter);}
    const requirePath=(reference:any)=>{if(typeof reference!=='string')throw Error('source-dependency');if(/^[a-z][a-z0-9+.-]*:/iu.test(reference)){omissions.push({path:'missing/external-'+omissions.length,reason:'An external source dependency is not included in this standalone archive',required:true});return;}if(reference.startsWith('#'))return;const normalized=relative(root,resolve(dirname(resolve(root,path)),reference)).replaceAll('\\','/');dependencies.push(outputPath(normalized));};
    for(const key of ['bibliography','csl','metadata-files']){const value=metadata[key];if(value!==undefined)for(const reference of Array.isArray(value)?value:[value])requirePath(reference);}
    if(metadata['generative-websites']?.catalogue)requirePath(metadata['generative-websites'].catalogue);
    for(const symbol of metadata['generative-websites']?.['wai-adapt']?.symbols??[])requirePath(symbol.path);
    let fence=null;for(const line of parsed.text.split(/\r?\n/u)){const marker=/^\s*(`{3,}|~{3,})/u.exec(line);if(marker){if(fence===null)fence=marker[1][0];else if(marker[1][0]===fence)fence=null;continue;}if(fence)continue;const include=/^\s*\{\{<\s*include\s+([^\s"'{}]+)\s*>\}\}\s*$/u.exec(line);if(include)requirePath(include[1]);else if(/\{\{<\s*include\b/u.test(line))throw Error('unsupported-source-include');const images=[...line.matchAll(/!\[[^\]\n]*\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/gu)];for(const image of images)requirePath(image[1]);if(/!\[/u.test(line.replace(/!\[[^\]\n]*\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/gu,'')))omissions.push({path:'missing/image-'+omissions.length,reason:'An unsupported image dependency syntax needs an explicit reconstruction review',required:true});}
   }
   add(path,bytes,rights);
  }
  if(selectors.size>1)throw Error('archive-installation-namespace');
  for(const path of waiResources)dependencies.push(outputPath(relative(root,path).split(sep).join('/')));
  for(const path of new Set(dependencies))if(!seen.has(path))omissions.push({path,reason:'A supported declared source include, metadata or asset dependency was not selected',required:true});
  const runtime=dirname(fileURLToPath(import.meta.url)),runtimeRights={licence:'Apache-2.0',attribution:'Kai Prince; original software with OpenAI Codex assistance',modifications:'Local experimental source, exact included bytes',ai:'AI-assisted implementation under Kai Prince direction; not independent review'};
  if(cfg['include-runtime']!==false){
   const approved=['translation-candidate.js','translation-native.lua','translation-prepare.ts','translation-private-workspace.js','_extension.yml','LICENSE','NOTICE','package.json','deno.json','config-v1.schema.json','generative-websites.lua','generative-websites.js','generative-websites-browser.js','generative-websites.css','route.js','session.js','navigation.js','features.lua','compile.ts','features-main.js','features-browser.js','features.css','adaptation.js','assertions.js','publication.js','delivery.js','gw-offline-worker.js','oer.js','exercises.js','transparency.js','sandbox-export.js','sandbox-session.js','sandbox-session-ui.js','journey.js','professional.js','professional-main.js','professional-browser.js','controlled-authoring.js','reviewed-realisations.js','controlled-native.js','scenario-candidate.js','wai-symbols.js','activity-data.js','activity.js','activity-progress.js','activity-native.js','activity-ui.js','activity-native.lua','numbas/admission.js','numbas/ui.js','numbas/native-files.js','numbas/preparer.js','numbas/accessibility/adapter.js','numbas/accessibility/adapter.css','numbas/numbas-prepare.ts','numbas/lifecycle.js','numbas/native-plan.js','numbas/hooks.ts','numbas/bootstrap.ts','numbas/native-bridge.ts','numbas/native.lua','numbas/font-notices/newcm-4.1.3/DISTRIBUTOR-NOTICE.txt','numbas/font-notices/newcm-4.1.3/GUST-FONT-LICENSE-1.0.txt','numbas/font-notices/newcm-4.1.3/LPPL-1.3c.txt','numbas/font-notices/newcm-4.1.3/SELECTION-RELOCATION.json','numbas/font-notices/newcm-4.1.3/UPSTREAM-RETRIEVAL.json'];
   const layout=selectors.has('kai-prince-sfhea/generative-websites')?'kai-prince-sfhea/generative-websites':'generative-websites';
   const noticeRights={licence:'See included verbatim licence texts and distributor notice; original terms retained',attribution:'GUST; LaTeX3 Project; Antonis Tsolomitis; MathJax, Inc.; separately labelled distributor records',modifications:'Official licence texts retained verbatim; original copyright notices and exact selection records supplied separately; no font changes',ai:'AI-assisted technical notice/provenance preparation; not legal clearance or upstream endorsement'};
   for(const file of approved)add('_extensions/'+layout+'/'+file,ordinary(runtime,join(runtime,file),1024*1024),file.startsWith('numbas/font-notices/newcm-4.1.3/')?noticeRights:runtimeRights);
  }else omissions.push({path:'_extensions/generative-websites',reason:'The required filter runtime was explicitly omitted',required:true});
  const entrypoints=components.filter(x=>x.path.endsWith('.qmd')&&!x.path.split('/').some((part:string)=>part.startsWith('_'))).map(x=>x.path);if(!entrypoints.length)throw Error('source-entrypoint');
  const selector=selectors.has('kai-prince-sfhea/generative-websites')?'kai-prince-sfhea/generative-websites':'generative-websites';
  const config='project:\n  type: website\n  render:\n'+entrypoints.map((x:string)=>'    - '+JSON.stringify(x)+'\n').join('')+'filters: ['+selector+']\nformat: html\n';
  add('_quarto.yml',new TextEncoder().encode(config),runtimeRights);
  const instructions='Extract all entries into a new empty folder. Use Quarto 1.11.5 or newer, then run quarto render. Only the selected source and included runtime are supplied; no models or reader data. Check the rights and omission manifest before reuse. This local source is experimental.';
  add('RECONSTRUCTION.txt',new TextEncoder().encode(instructions+'\n'),runtimeRights);
  oer={version:1,sourceConsent:true,components,reconstruction:{quarto:'>=1.11.5',entrypoints,instructions},omissions};
 }
 const numbas=await prepareNumbas();
 return{version:1,translations,translationReviewYAML:translations?stringifyYAML({translations:translations.previewConfig}):null,numbas,publicPage,defaults,selection,publication,offline,exercises,activities,reports,sandbox,sandboxSessionMappings,oer,assertionIdentities,languageLinks,scenarioCandidates,scenarioReviewYAML:scenarioCandidates?stringifyYAML({'scenario-candidates':scenarioCandidates.previewConfig}):null,waiSymbols,waiResources,waiReviewYAML:waiSymbols?stringifyYAML({'wai-adapt':waiSymbols.previewConfig}):null,
  controlledInspection:controlledPrepared?.inspection??null,controlledRealisations:controlledPrepared?.realisations??[],controlledReviewYAML:controlledPrepared?.previewConfig?stringifyYAML({'controlled-authoring':controlledPrepared.previewConfig}):null};
}
try{
 const reader=Deno.stdin.readable.getReader();let length=0;const chunks:Uint8Array[]=[];
 while(true){const{done,value}=await reader.read();if(done)break;length+=value.length;if(length>2*1024*1024)throw Error('request-limit');chunks.push(value);}reader.releaseLock();
 const bytes=new Uint8Array(length);let p=0;for(const part of chunks){bytes.set(part,p);p+=part.length;}
 const input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),out=JSON.stringify(await compile(input));if(new TextEncoder().encode(out).length>2*1024*1024)throw Error('response-limit');console.log(out);
}catch{console.error('generative-websites: reviewed feature data is invalid, stale, incomplete or outside its declared public/source limits; check the installed reference');Deno.exit(1);}
