// Original installed CLI draft. No network/software installation/author script.
import {prepareLocalNumbas,parsePreparerArgs} from './preparer.js';
try {
 if(Deno.args.length===1&&Deno.args[0]==='--help'){
   console.log('quarto run <installed-extension>/numbas-prepare.ts --root <project> --source <relative-export-folder> --output <new-relative-local-folder> --mathjax <separately-extracted-mathjax-4.1.3-package> --font <separately-extracted-newcm-font-4.1.3-package> --id <native-id> --label <label> --seed <fixed-seed> --question-licence <declared-licence> --question-attribution <actual-attribution>');
   console.log('No network, package installation or author JavaScript. Output must be new. Preparation does not approve source, rights, host CSP or accessibility.');
   Deno.exit(0);
 }
 const result=await prepareLocalNumbas(parsePreparerArgs(Deno.args));
 console.log(JSON.stringify(result,null,2));
 console.log('\nUnreviewed preparation complete. Inspect the original question, runtime and third-party notices before copying the generated review map into YAML. Missing upstream notices remain unresolved.');
} catch(error) {
 const failure=error as {code?:unknown};
 console.error('generative-websites Numbas preparation refused: '+(typeof failure?.code==='string'?failure.code:'preparation-failed'));
 Deno.exit(1);
}
