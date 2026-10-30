// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Explicit installed author command. Render/Preview never invokes this file.
import {parse as parseYAML} from 'stdlib/yaml';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,relative,join,dirname,sep,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {verifyTranslationSource,applyTranslationSegments,buildTranslationCandidate,buildTranslationPrompt} from './translation-candidate.js';
import {parseDeliveryJSON} from './delivery.js';
import {admitTranslationWorkspace,ordinaryTranslationPath,admitTranslationTransport,writePrivateTranslationJSON,buildTranslationWireSchema} from './translation-private-workspace.js';
const fail=()=>{throw Error('generative-websites: explicit local translation candidate could not be prepared; check the installed Knowledge Graph Extraction companion, loopback model configuration, source packet and new output path');};
const sha=(v:string|Uint8Array)=>createHash('sha256').update(v).digest('hex');
const args=new Map<string,string>();for(let at=0;at<Deno.args.length;at+=2){const key=Deno.args[at],value=Deno.args[at+1];if(!['--root','--workspace','--source','--output','--language','--id','--revision','--config'].includes(key)||!value||args.has(key))fail();args.set(key,value);}for(const key of ['--workspace','--source','--output','--language','--id','--config'])if(!args.has(key))fail();
if(!isAbsolute(args.get('--workspace')!))fail();const root=resolve(args.get('--root')??'.'),work=resolve(args.get('--workspace')!);
admitTranslationWorkspace(root,work);
function ordinary(path:string,directory=false,base=root){return ordinaryTranslationPath(base,path,{directory});}
const sourcePath=ordinary(resolve(work,args.get('--source')!),false,work),configPath=ordinary(resolve(work,args.get('--config')!),false,work),output=resolve(work,args.get('--output')!);ordinary(dirname(output),true,work);if(!sourcePath.endsWith('.json')||!/[.](?:ya?ml|json)$/iu.test(configPath)||!output.endsWith('.json')||existsSync(output))fail();
const sourceBytes=readFileSync(sourcePath),source=await verifyTranslationSource(parseDeliveryJSON(sourceBytes.toString('utf8'),{maxBytes:262144}));
const configBytes=readFileSync(configPath),config=parseYAML(configBytes.toString('utf8'));
const extensions=join(root,'_extensions');ordinary(extensions,true);const candidates=[join(extensions,'knowledge-graph-extraction','local-generation.ts')];for(const entry of readdirSync(extensions,{withFileTypes:true})){if(entry.isSymbolicLink())fail();if(entry.isDirectory()&&entry.name!=='knowledge-graph-extraction')candidates.push(join(extensions,entry.name,'knowledge-graph-extraction','local-generation.ts'));if(candidates.length>65)fail();}
const found=candidates.filter(path=>existsSync(path));if(found.length!==1)fail();const transport=ordinary(found[0]),transportBytes=readFileSync(transport),transportSha256=admitTranslationTransport(transportBytes),module=await import(pathToFileURL(transport).href+'?gw-translation='+transportSha256);if(typeof module.parseLocalGenerationConfig!=='function'||typeof module.generateLocalJSON!=='function'||admitTranslationTransport(readFileSync(ordinary(transport)))!==transportSha256)fail();
const checked=module.parseLocalGenerationConfig(config),targetId=args.get('--id')!,targetRevision=args.get('--revision')??'v1';
const validatedTarget=await buildTranslationCandidate(source,{id:targetId,revision:targetRevision,language:args.get('--language'),projection:source.projection,provenance:{kind:'author-supplied'}}),targetLanguage=validatedTarget.target.language,requestId=sha(JSON.stringify({source:source.source,targetLanguage,targetId,targetRevision,nonce:crypto.randomUUID()}));
const schema=buildTranslationWireSchema(source.segments.map((s:any)=>s.id));
const prompt=await buildTranslationPrompt(source,targetLanguage);
const response=await module.generateLocalJSON(checked,prompt,schema,{requestId}),parsed=parseDeliveryJSON(response.text,{maxBytes:262144});if(parsed?.version!==1||Object.keys(parsed).some(k=>!['version','segments'].includes(k)))fail();const projection=applyTranslationSegments(source.projection,parsed.segments),candidate=await buildTranslationCandidate(source,{id:targetId,revision:targetRevision,language:targetLanguage,projection,provenance:{kind:'local-model-candidate',agent:'Knowledge Graph Extraction local-generation.ts',model:checked.model,requestSha256:sha(JSON.stringify({prompt,schema})),outputSha256:sha(response.text),transportSha256,qualification:'Explicit loopback model request. The server model label and transport provenance do not independently attest model weights, faithful translation, author review or approval.'}});
if(sha(readFileSync(ordinary(sourcePath,false,work)))!==sha(sourceBytes)||sha(readFileSync(ordinary(configPath,false,work)))!==sha(configBytes)||admitTranslationTransport(readFileSync(ordinary(transport)))!==transportSha256||existsSync(output))fail();writePrivateTranslationJSON({project:root,workspace:work,path:output,contents:JSON.stringify(candidate,null,2)+'\n'});
console.log(JSON.stringify({version:1,status:'unreviewed-candidate-written-in-private-workspace',output:relative(work,output).split(sep).join('/'),candidateSha256:candidate.candidateSha256,requestId,transportSha256,transportProvenance:response.provenance,qualification:candidate.qualification}));
