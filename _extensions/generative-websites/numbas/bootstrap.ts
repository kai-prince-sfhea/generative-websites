// Original installed/namespaced hook locator, encoded by the private build helper.
// A data-module command avoids Quarto 1.11.5's unquoted hook path rebasing.
import {pathToFileURL} from 'node:url';
import {join,resolve} from 'node:path';
import {readdir,lstat,realpath} from 'node:fs/promises';
const stage=Deno.args[0];if(!['prepare','finalize'].includes(stage))throw Error('generative-websites: Numbas hook stage unavailable');
const base=join(await Deno.realPath(Deno.cwd()),'_extensions'),candidates=[join(base,'generative-websites')];
for(const entry of await readdir(base,{withFileTypes:true})){if(entry.isDirectory()&&!entry.isSymbolicLink()&&entry.name!=='generative-websites')candidates.push(join(base,entry.name,'generative-websites'));if(candidates.length>65)throw Error('generative-websites: installed extension inventory exceeds limit');}
const found=[];for(const candidate of candidates){try{const file=join(candidate,'numbas','hooks.ts');if((await lstat(candidate)).isDirectory()&&!(await lstat(candidate)).isSymbolicLink()&&(await lstat(file)).isFile()&&!(await lstat(file)).isSymbolicLink()&&!(await lstat(join(candidate,'numbas'))).isSymbolicLink()&&resolve(await realpath(file)).toLowerCase()===resolve(file).toLowerCase()&&resolve(await realpath(candidate)).toLowerCase()===resolve(candidate).toLowerCase())found.push(file);}catch{}}
if(found.length!==1)throw Error('generative-websites: expected one installed Numbas hook; remove duplicate installations');await import(pathToFileURL(found[0]).href+'?stage='+stage);
