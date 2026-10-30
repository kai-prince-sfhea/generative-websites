// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// CLI-only ordinary-file boundary; never imported by the reader/browser runtime.
import {existsSync,lstatSync,realpathSync,writeFileSync} from 'node:fs';
import {dirname,isAbsolute,join,relative,resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {platform} from 'node:os';
import {Buffer} from 'node:buffer';
export const REVIEWED_TRANSLATION_TRANSPORT_SHA256='254cdc60d00cb9104442caaf486a2d6d4dd6210d14c872532f5f92bb3fd910d0';
const fail=()=>{throw Error('generative-websites: explicit local translation candidate could not be prepared; private workspace, output path or reviewed transport boundary is invalid');};
const equalPath=(a,b)=>platform()==='win32'?a.toLowerCase()===b.toLowerCase():a===b;
const inside=(base,path)=>{const r=relative(base,path);return r===''||!isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+sep);};
export function ordinaryTranslationPath(base,path,{directory=false,maxBytes=262144}={}){
 base=resolve(base);path=resolve(path);if(!inside(base,path))fail();const initial=lstatSync(base);if(initial.isSymbolicLink()||!initial.isDirectory()||!equalPath(resolve(realpathSync(base)),base))fail();let cursor=base;
 for(const part of relative(base,path).split(sep).filter(Boolean)){cursor=join(cursor,part);if(lstatSync(cursor).isSymbolicLink())fail();}
 const info=lstatSync(path);if(directory?!info.isDirectory():!info.isFile()||info.size>maxBytes)fail();return path;
}
export function admitTranslationWorkspace(project,workspace){
 if(typeof workspace!=='string'||!isAbsolute(workspace))fail();const root=resolve(project),work=resolve(workspace);ordinaryTranslationPath(root,root,{directory:true});ordinaryTranslationPath(work,work,{directory:true});
 if(inside(root,work)||inside(work,root)||work.split(/[\\/]/u).some(part=>['.git','.quarto','_site','_book','_extensions','node_modules'].includes(part.toLowerCase())))fail();for(let cursor=work;;cursor=dirname(cursor)){if(existsSync(join(cursor,'.git')))fail();if(dirname(cursor)===cursor)break;}return work;
}
export function admitTranslationTransport(bytes){const digest=createHash('sha256').update(bytes).digest('hex');if(digest!==REVIEWED_TRANSLATION_TRANSPORT_SHA256)fail();return digest;}
export function buildTranslationWireSchema(segmentIds){
 if(!Array.isArray(segmentIds)||segmentIds.length<1||segmentIds.length>128||new Set(segmentIds).size!==segmentIds.length||segmentIds.some(id=>typeof id!=='string'||!/^s[0-9]{3}$/u.test(id)))fail();
 // Some local grammar converters reject maxLength:4000 before sampling because
 // they expand it into too many repetitions. The response/token budgets and
 // authoritative 4000-character host validation remain in force independently.
 return{type:'object',additionalProperties:false,required:['version','segments'],properties:{version:{type:'integer',enum:[1]},segments:{type:'array',minItems:segmentIds.length,maxItems:segmentIds.length,items:{type:'object',additionalProperties:false,required:['id','text'],properties:{id:{type:'string',enum:[...segmentIds]},text:{type:'string',minLength:1}}}}}};
}
export function writePrivateTranslationJSON({project,workspace,path,contents}){
 const work=admitTranslationWorkspace(project,workspace),output=resolve(path);if(!inside(work,output)||!output.endsWith('.json')||existsSync(output)||typeof contents!=='string'||Buffer.byteLength(contents)>262144)fail();ordinaryTranslationPath(work,dirname(output),{directory:true});
 // Recheck the exact ordinary parent and external/Git ancestry after all awaited
 // work, directly beside the exclusive write. A changed nested junction fails.
 admitTranslationWorkspace(project,workspace);ordinaryTranslationPath(work,dirname(output),{directory:true});writeFileSync(output,contents,{flag:'wx'});return output;
}
