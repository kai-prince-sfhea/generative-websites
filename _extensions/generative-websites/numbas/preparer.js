// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// No downloads/install hooks. Consume separately acquired official package folders.
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {rename,rmdir} from 'node:fs/promises';
import {parseDeliveryJSON} from '../delivery.js';
import {object,text,ordinaryPath,scanEntry,inspectNumbasPackage,validateNumbasOptions,canonical,sha,freeze,fail} from './admission.js';
import {physical,readTree,inventory,freshTree,writeNew,createParents,removeOwned,inside} from './native-files.js';
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true}),noticeNames=['LICENSE','LICENSE.txt','LICENSE.md','LICENCE','LICENCE.txt','LICENCE.md','NOTICE','NOTICE.txt'];
const configScript=`<script>
// Local MathJax paths prepared by the original GW Numbas adapter.
const gwNumbasLocalURL = path => new URL(path, document.baseURI).href.replace(/\\/$/, '');
Object.assign(MathJax.loader.paths, {fonts: gwNumbasLocalURL('./vendor'), font: gwNumbasLocalURL('./vendor/mathjax-newcm-font'), 'mathjax-newcm': gwNumbasLocalURL('./vendor/mathjax-newcm-font')});
MathJax.output = Object.assign({}, MathJax.output, {font: 'mathjax-newcm', fontPath: gwNumbasLocalURL('./vendor/%%FONT%%-font')});
MathJax.options = Object.assign({}, MathJax.options, {worker: {path: gwNumbasLocalURL('./vendor/mathjax/sre'), maps: gwNumbasLocalURL('./vendor/mathjax/sre/mathmaps'), worker: 'speech-worker.js', debug: false}});
</script>
`;
const fontSelect=(path)=>['svg','chtml','svg.js','chtml.js','package.json',...noticeNames].includes(path.split('/')[0]);
const supplementalPrefix='GW-DISTRIBUTOR-NOTICES/newcm-4.1.3';
// Distributor additions are separate from upstream notices and original font
// bytes. Admit only this finite installed set, regardless of font eligibility.
const supplementalPins=Object.freeze([
 {path:'DISTRIBUTOR-NOTICE.txt',bytes:2467,sha256:'87f42c225ddb92a2f284ab32c10633acc57dbed4e2a37d55bb507fcff4461f30'},
 {path:'GUST-FONT-LICENSE-1.0.txt',bytes:1417,sha256:'5eb61bb836bb1845ef668717cb15b382e997748ce2629e4388cc5e4c3fa4e433'},
 {path:'LPPL-1.3c.txt',bytes:19102,sha256:'3d262cdf34dafa6955f703c634a8c238ec44109bc8dd6ef34fb7aa54809f7e66'},
 {path:'SELECTION-RELOCATION.json',bytes:63968,sha256:'615dd8d2b2fbc7cc1ad4e8e9abb45e88ac59f53d9ba9394232d226179a48baa8'},
 {path:'UPSTREAM-RETRIEVAL.json',bytes:2500,sha256:'f8c3300da8556e86ded101282a5ea14ab7489ece2898bcfc96103e1a959bb396'}
]);
const knownFontInventorySha256='1ceaeed12213f0fc32957cef82bbd75d106d01c032ee7b9f28f341afd6da1620';
const accessibilityPrefix='GW-NUMBAS-ACCESSIBILITY';
const accessibilityPins=Object.freeze({'adapter.js':'3f32985252f5e6a10a8a657d927c8de413e06796ba8d2648c5cac3a1b2c47b73','adapter.css':'a65269a00690c62a99058bc0e6654efec38c61197852c53da77884ab56c38e3b'});
const supportedEngine=Object.freeze({'numbas.js':'fe53eeea0a9ed8f465568e8a0f85064d5cc80be7f469f4084be2629785346bc0','numbas.css':'ae3a080dd18ed1a1a1b0ba684c7885b837dc2d0b354679cad0d2e3d2bcde8072'});
const supportedTemplates='f75ce668976f082d001c4343b333ff482c067c338e43e6bea59d89a021d45322';
async function installedAccessibility(cryptoObject){
 const root=join(dirname(fileURLToPath(import.meta.url)),'accessibility'),files=await readTree(root,{maxFiles:2,maxBytes:65536}),rows=await inventory(files,cryptoObject);
 if(rows.length!==2||rows.some(row=>accessibilityPins[row.path]!==row.sha256))fail('accessibility-asset-integrity');
 return{root,files,rows};
}
async function templateFingerprint(html,cryptoObject){
 const scan=scanEntry(html),rows=[];
 for(const tag of scan.tags.filter(tag=>tag.name==='template'&&!tag.closing&&tag.templateDepth===0)){
  const close=scan.tags.find(end=>end.name==='template'&&end.closing&&end.templateDepth===1&&end.start>tag.start);if(!close)fail('unsupported-native-template');
  rows.push({id:tag.attrs.id,sha256:await sha(encoder.encode(html.slice(tag.start,close.end)),cryptoObject)});
 }
 return{scan,sha256:await sha(encoder.encode(canonical(rows)),cryptoObject)};
}
function localEntry(html,{adapter=false}={}){
 const scan=scanEntry(html),loaders=scan.scripts.filter(item=>/^https:\/\/cdn\.jsdelivr\.net\/npm\/mathjax@(?:4|4\.1\.3)\/tex-svg\.js$/u.test(item.tag.attrs.src??''));
 if(loaders.length!==1||loaders[0].tag.templateDepth!==0||loaders[0].content.trim())fail('unsupported-mathjax-loader');
 const loader=loaders[0].tag;let result=html.slice(0,loader.start)+configScript+'<script type="text/javascript" src="vendor/mathjax/tex-svg.js">'+html.slice(loader.end);
 if(adapter){const head=scanEntry(result).tags.find(tag=>tag.name==='head'&&tag.closing&&tag.templateDepth===0);if(!head)fail('missing-entry-head');result=result.slice(0,head.start)+`<link rel="stylesheet" href="${accessibilityPrefix}/adapter.css">\n<script type="module" src="${accessibilityPrefix}/adapter.js"></script>\n`+result.slice(head.start);}
 return result;
}
async function installedFontSupplement(cryptoObject){
 const root=join(dirname(fileURLToPath(import.meta.url)),'font-notices','newcm-4.1.3'),files=await readTree(root,{maxFiles:5,maxBytes:100000}),rows=await inventory(files,cryptoObject);
 if(canonical(rows)!==canonical(supplementalPins))fail('font-notice-integrity');
 return{root,files,rows};
}
function packageMetadata(files,expected){const bytes=files.find(file=>file.path==='package.json')?.bytes;if(!bytes||bytes.length>65536)fail('package-metadata-missing');const data=parseDeliveryJSON(decoder.decode(bytes),{maxBytes:65536});if(data.name!==expected||data.version!=='4.1.3'||data.license!=='Apache-2.0')fail('unsupported-local-mathjax-package');return {name:data.name,version:data.version,license:data.license,...(typeof data.gitHead==='string'?{declaredGitHead:data.gitHead}:{}),packageJsonSha256:null};}
export async function prepareLocalNumbas(request,{cryptoObject=globalThis.crypto}={}){
 object(request,['root','source','output','mathjax','font','options']);request={...request,options:validateNumbasOptions(request.options)};if(request.options.path!==request.output)fail('preparation-output-identity');const root=resolve(text(request.root,4096));ordinaryPath(request.source);ordinaryPath(request.output);const source=resolve(root,request.source),output=resolve(root,request.output),mathjax=resolve(text(request.mathjax,4096)),font=resolve(text(request.font,4096));if(!inside(root,source)||!inside(root,output)||inside(source,output)||inside(output,source)||inside(output,mathjax)||inside(output,font))fail('preparation-path-overlap');await physical(root,source,{directory:true});if(await physical(root,output,{directory:true}))fail('destination-exists');
 const original=await readTree(source),mathjaxFiles=await readTree(mathjax),fontFiles=await readTree(font,{select:fontSelect}),supplement=await installedFontSupplement(cryptoObject),accessibility=await installedAccessibility(cryptoObject);const originals=await inventory(original,cryptoObject),mathjaxInventory=await inventory(mathjaxFiles,cryptoObject),fontInventory=await inventory(fontFiles,cryptoObject),mathjaxMetadata=packageMetadata(mathjaxFiles,'mathjax'),fontMetadata=packageMetadata(fontFiles,'@mathjax/mathjax-newcm-font');
 if(original.some(file=>file.path.toLowerCase()==='gw-distributor-notices'||file.path.toLowerCase().startsWith('gw-distributor-notices/')))fail('font-notice-path-collision');
 if(original.some(file=>file.path.toLowerCase()===accessibilityPrefix.toLowerCase()||file.path.toLowerCase().startsWith(accessibilityPrefix.toLowerCase()+'/')))fail('accessibility-path-collision');
 const knownFont=fontInventory.length===188&&await sha(encoder.encode(canonical(fontInventory)),cryptoObject)===knownFontInventorySha256;
 mathjaxMetadata.packageJsonSha256=mathjaxInventory.find(row=>row.path==='package.json').sha256;fontMetadata.packageJsonSha256=fontInventory.find(row=>row.path==='package.json').sha256;
 if(!mathjaxFiles.some(f=>f.path==='tex-svg.js')||!mathjaxFiles.some(f=>f.path==='sre/speech-worker.js')||!fontFiles.some(f=>f.path==='svg.js')||!fontFiles.some(f=>f.path==='chtml.js')||!mathjaxFiles.some(f=>noticeNames.includes(f.path)))fail('local-package-incomplete');
 const entry=original.find(file=>file.path==='index.html');if(!entry)fail('missing-entry');const html=decoder.decode(entry.bytes),scan=scanEntry(html),seededOriginal=original.find(file=>file.path==='seeded-index.html');
 const entries=[{path:'index.html',html},{path:'seeded-index.html',html:seededOriginal?decoder.decode(seededOriginal.bytes):html.slice(0,scan.exam.start)+`<numbas-exam storage="none" seed="${request.options.seed}">`+html.slice(scan.exam.end)}];
 const observedEngine=Object.fromEntries(Object.keys(supportedEngine).map(path=>[path,originals.find(row=>row.path===path)?.sha256??null]));const engineSupported=Object.entries(supportedEngine).every(([path,hash])=>observedEngine[path]===hash);const observedTemplates=[];
 for(const item of entries){try{const observed=await templateFingerprint(item.html,cryptoObject);item.supported=engineSupported&&observed.sha256===supportedTemplates&&observed.scan.source===scan.source;observedTemplates.push({path:item.path,sha256:observed.sha256,status:item.supported?'applied-supported-template':'not-applied-unrecognized-engine-or-template'});}catch{item.supported=false;observedTemplates.push({path:item.path,status:'not-applied-unrecognized-entry-structure'});}}
 const files=original.map(file=>({path:file.path,bytes:new Uint8Array(file.bytes)}));
 for(const item of entries){
  const observation=observedTemplates.find(row=>row.path===item.path);let rewritten;
  try{
   rewritten=localEntry(item.html,{adapter:item.supported});
   if(item.supported){const preparedScan=scanEntry(rewritten),script=preparedScan.scripts.some(row=>row.tag.attrs.type==='module'&&row.tag.attrs.src===accessibilityPrefix+'/adapter.js'),style=preparedScan.tags.some(tag=>!tag.closing&&tag.name==='link'&&tag.attrs.rel==='stylesheet'&&tag.attrs.href===accessibilityPrefix+'/adapter.css');if(!script||!style)fail('accessibility-entry-resource-closure');}
  }catch(cause){
   if(item.path==='index.html')throw cause;
   item.supported=false;observation.status='not-applied-entry-preparation-failed';observation.reason=typeof cause?.code==='string'?cause.code:'unavailable-entry-preparation';rewritten=item.html;
  }
  const existing=files.find(file=>file.path===item.path);if(existing)existing.bytes=encoder.encode(rewritten);else files.push({path:item.path,bytes:encoder.encode(rewritten)});
 }
 const supported=entries.some(item=>item.supported),allSupported=entries.every(item=>item.supported);
 if(supported)for(const file of accessibility.files)files.push({path:accessibilityPrefix+'/'+file.path,bytes:new Uint8Array(file.bytes)});
 for(const file of mathjaxFiles)files.push({path:'vendor/mathjax/'+file.path,bytes:new Uint8Array(file.bytes)});for(const file of fontFiles)files.push({path:'vendor/mathjax-newcm-font/'+file.path,bytes:new Uint8Array(file.bytes)});
 if(knownFont)for(const file of supplement.files)files.push({path:supplementalPrefix+'/'+file.path,bytes:new Uint8Array(file.bytes)});
 const fontNotices=fontFiles.filter(file=>noticeNames.includes(file.path)).map(f=>f.path),distributorSupplement={status:knownFont?'applied-to-exact-known-selection':'not-applied-unrecognized-selection',origin:'distributor-supplied-not-upstream',selectedFontInventorySha256:await sha(encoder.encode(canonical(fontInventory)),cryptoObject),...(knownFont?{matchedFiles:188,woff2Files:105,files:supplement.rows.map(row=>({...row,path:supplementalPrefix+'/'+row.path}))}:{}),qualification:'Verbatim official licence texts and exact selection/embedded-notice records only. Complete LPPL Work/source-build history and redistribution rights are not established.'},provenance={version:1,kind:'gw-numbas-local-preparation',extensionVersion:'0.0.13',accessibility:{profile:'numbas-11.0-numberentry-dom-v1',adapterRevision:3,status:allSupported?'applied-to-exact-supported-engine-and-templates':supported?'partially-applied-recognized-entries':'not-applied-unrecognized-engine-or-template',engine:observedEngine,templates:observedTemplates,assets:supported?accessibility.rows.map(row=>({...row,path:accessibilityPrefix+'/'+row.path})):[],qualification:'Owned external DOM relationships only. Native listeners, scoring, vendor bytes and templates retained; not accessibility or upstream acceptance.'},source:{files:originals},libraries:[{...mathjaxMetadata,files:mathjaxInventory},{...fontMetadata,files:fontInventory,noticeStatus:fontNotices.length?'source-supplied-notice-retained':'upstream-package-notice-missing',sourceSuppliedNotices:fontNotices,distributorSupplement}],changes:['Entry MathJax loaders localized and fixed-seed entry created when absent; native templates, engine, stylesheet and question bytes retained.',supported?'Exact supported engine/templates receive separately inventoried external DOM adapter and heading CSS.':'Unknown engine/template retained without the DOM adapter; no accessibility repair is claimed.',...(knownFont?['Separately labelled distributor notice/licence records added for an exact known unchanged 188-file font selection; upstream missing-notice status retained.']:['Known-font distributor supplement was not applied to this unrecognized/custom font selection; no known copyright receipt is inherited.'])],qualification:'Exact separately supplied package metadata and bytes, not upstream authentication or licence clearance. Missing upstream font notices remain unresolved; no source provenance is invented.'};
 files.push({path:'GW-NUMBAS-PREPARATION.json',bytes:encoder.encode(JSON.stringify(provenance,null,2)+'\n')});const inspected=await inspectNumbasPackage({options:request.options,files},{cryptoObject});if(inspected.status!=='inspectable')fail('prepared-package-not-inspectable');const rows=await inventory(files,cryptoObject);await freshTree(source,originals);await freshTree(mathjax,mathjaxInventory);await freshTree(font,fontInventory,{select:fontSelect});await freshTree(supplement.root,supplement.rows,{cryptoObject});await freshTree(accessibility.root,accessibility.rows,{cryptoObject});
 // Existing raw export and libraries remain unchanged. Only a new sibling output is committed.
 await createParents(root,dirname(output));const stage=join(dirname(output),'.gw-numbas-preparing-'+cryptoObject.randomUUID());await createParents(root,stage);let written=[];
 try{for(const file of files){await writeNew(root,join(stage,...file.path.split('/')),file.bytes);written.push(rows.find(row=>row.path===file.path));}const staged=await inventory(await readTree(stage),cryptoObject);if(canonical(staged)!==canonical(rows))fail('preparation-copy-changed');await freshTree(source,originals);await freshTree(mathjax,mathjaxInventory);await freshTree(font,fontInventory,{select:fontSelect});await freshTree(supplement.root,supplement.rows,{cryptoObject});await freshTree(accessibility.root,accessibility.rows,{cryptoObject});if(await physical(root,output,{directory:true}))fail('destination-exists');await rename(stage,output);written=[];
 }finally{if(written.length)await removeOwned(root,stage,[...written].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0),{cryptoObject});else if(await physical(root,stage,{directory:true}))await rmdir(stage);}
 return freeze({version:1,status:'prepared-local-unreviewed',output:request.output,inventory:rows,sourceDigest:inspected.sourceDigest,reviewDraft:inspected.reviewDraft,preparation:provenance,qualification:'Local byte/resource preparation only; no runtime/browser, CSP, accessibility, learning, author review or redistribution acceptance.'});
}

export function parsePreparerArgs(args){if(!Array.isArray(args)||args.length>20)fail('preparer-arguments');const map={};for(let i=0;i<args.length;i+=2){const key=args[i],value=args[i+1];if(!['--root','--source','--output','--mathjax','--font','--id','--label','--seed','--question-licence','--question-attribution'].includes(key)||map[key]!==undefined||typeof value!=='string')fail('preparer-arguments');map[key]=value;}for(const key of ['--root','--source','--output','--mathjax','--font','--id','--label','--seed','--question-licence','--question-attribution'])if(map[key]===undefined)fail('preparer-arguments');return {root:map['--root'],source:map['--source'],output:map['--output'],mathjax:map['--mathjax'],font:map['--font'],options:{id:map['--id'],label:map['--label'],path:map['--output'],version:'11.0',seed:map['--seed'],questionRights:{licence:map['--question-licence'],attribution:map['--question-attribution']}}};}
