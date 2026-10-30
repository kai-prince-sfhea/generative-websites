// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Original private filesystem boundary shared by preparer/publication prototypes.
import {lstat,realpath,readdir,readFile,mkdir,writeFile,rename,unlink,rmdir} from 'node:fs/promises';
import {resolve,relative,join,dirname,isAbsolute,sep} from 'node:path';
import {NUMBAS_LIMITS,ordinaryPath,sha,canonical,fail} from './admission.js';
const same=(a,b)=>sep==='\\'?a.toLowerCase()===b.toLowerCase():a===b;
export const inside=(base,path)=>{const part=relative(resolve(base),resolve(path));return part===''||!isAbsolute(part)&&part!=='..'&&!part.startsWith('..'+sep);};
export async function physical(base,path,{directory=false,create=false}={}){
 base=resolve(base);path=resolve(path);if(!inside(base,path))fail('filesystem-confinement');const root=await lstat(base);if(!root.isDirectory()||root.isSymbolicLink()||!same(await realpath(base),base))fail('linked-or-invalid-root');let cursor=base;
 for(const [at,part]of relative(base,path).split(sep).filter(Boolean).entries()){cursor=join(cursor,part);let item;try{item=await lstat(cursor);}catch(error){if(error.code!=='ENOENT')throw error;if(!create)return null;await mkdir(cursor);item=await lstat(cursor);}const last=cursor===path;if(item.isSymbolicLink()||!same(await realpath(cursor),cursor)||(!last||directory)&&!item.isDirectory()||last&&!directory&&!item.isFile())fail('linked-or-invalid-component');}
 return path;
}
export async function readOrdinary(base,path,maxBytes=NUMBAS_LIMITS.fileBytes){if(!await physical(base,path))fail('ordinary-file-missing');const before=await lstat(path);if(before.size>maxBytes)fail('ordinary-file-budget');const bytes=new Uint8Array(await readFile(path)),after=await lstat(path);if(bytes.length!==before.size||before.size!==after.size||before.ino!==after.ino||before.mtimeMs!==after.mtimeMs)fail('ordinary-file-changed');return bytes;}
export async function readTree(base,{select=()=>true,maxFiles=NUMBAS_LIMITS.files,maxBytes=NUMBAS_LIMITS.totalBytes}={}){
 base=resolve(base);await physical(base,base,{directory:true});const files=[];let total=0,nodes=0;async function walk(dir=''){const entries=await readdir(join(base,dir),{withFileTypes:true});if(entries.length>4096)fail('directory-budget');for(const entry of entries.sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){if(++nodes>8192)fail('directory-budget');const path=dir?dir+'/'+entry.name:entry.name;ordinaryPath(path);if(!select(path,entry.isDirectory()))continue;const absolute=join(base,...path.split('/'));if(entry.isSymbolicLink())fail('linked-source');if(entry.isDirectory()){await physical(base,absolute,{directory:true});await walk(path);}else{const bytes=await readOrdinary(base,absolute);if(files.length>=maxFiles||(total+=bytes.length)>maxBytes)fail('source-tree-budget');files.push({path,bytes});}}}await walk();return files;
}
export async function inventory(files,cryptoObject){const rows=[];for(const file of files)rows.push({path:file.path,bytes:file.bytes.length,sha256:await sha(file.bytes,cryptoObject)});return rows.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);}
export async function freshTree(root,expected,options={}){const files=await readTree(root,options);if(canonical(await inventory(files,options.cryptoObject))!==canonical(expected))fail('source-tree-changed');}
export async function createParents(root,path){if(!inside(root,path))fail('filesystem-confinement');await physical(root,path,{directory:true,create:true});}
export async function writeNew(root,path,bytes){if(!inside(root,path))fail('filesystem-confinement');await createParents(root,dirname(path));if(await physical(root,path))fail('destination-exists');await writeFile(path,bytes,{flag:'wx'});await physical(root,path);}
export async function atomicJSON(root,path,value,cryptoObject=globalThis.crypto){await createParents(root,dirname(path));const temporary=path+'.pending-'+cryptoObject.randomUUID();try{await writeNew(root,temporary,new TextEncoder().encode(JSON.stringify(value)+'\n'));if(await physical(root,path))await physical(root,path);await rename(temporary,path);}finally{if(await physical(root,temporary))await unlink(temporary);}}
// Missing files are accepted only for a durable pending/retiring ownership intent.
// Every surviving byte, name and directory must still match that exact inventory.
export async function assertOwnedTree(root,folder,rows,{cryptoObject=globalThis.crypto,allowMissing=false}={}){
 if(!await physical(root,folder,{directory:true})){if(allowMissing)return [];fail('owned-inventory-changed');}
 const files=await readTree(folder),actual=await inventory(files,cryptoObject),expected=new Map(rows.map(row=>[row.path,row]));
 if(actual.some(row=>canonical(row)!==canonical(expected.get(row.path)))||!allowMissing&&canonical(actual)!==canonical(rows))fail('owned-inventory-changed');
 const directories=new Set([folder]);for(const file of rows){let parent=dirname(join(folder,...file.path.split('/')));while(inside(folder,parent)){directories.add(parent);if(parent===folder)break;parent=dirname(parent);}}
 // Empty, unowned directories must refuse before the first deletion too.
 async function checkDirectories(dir){for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.isDirectory()){const child=join(dir,entry.name);if(!directories.has(child))fail('owned-inventory-changed');await physical(root,child,{directory:true});await checkDirectories(child);}}}await checkDirectories(folder);return files;
}
// Delete exact, byte-checked owned files only. Never recursive-remove a computed tree.
export async function removeOwned(root,folder,rows,{cryptoObject=globalThis.crypto,allowMissing=false}={}){
 const files=await assertOwnedTree(root,folder,rows,{cryptoObject,allowMissing}),directories=new Set([folder]);for(const row of rows){let parent=dirname(join(folder,...row.path.split('/')));while(inside(folder,parent)){directories.add(parent);if(parent===folder)break;parent=dirname(parent);}}
 for(const file of files){const path=join(folder,...file.path.split('/'));await physical(root,path);await unlink(path);}for(const path of [...directories].sort((a,b)=>b.length-a.length)){if(await physical(root,path,{directory:true}))await rmdir(path);}
}
