// Original narrow bridge for explicit disabled-feature retirement observations.
import {stageNumbasPage} from './lifecycle.js';
import {parseDeliveryJSON} from '../delivery.js';
try{let length=0;const chunks=[];for await(const part of Deno.stdin.readable){if((length+=part.length)>2097152)throw Error('request-budget');chunks.push(part);}const bytes=new Uint8Array(length);let at=0;for(const part of chunks){bytes.set(part,at);at+=part.length;}const request=parseDeliveryJSON(new TextDecoder('utf-8',{fatal:true}).decode(bytes),{maxBytes:2097152});console.log(JSON.stringify(await stageNumbasPage(request)));}
catch(error){console.error('generative-websites Numbas source observation refused: '+(typeof (error as {code?:unknown})?.code==='string'?(error as {code:string}).code:'source-observation-invalid'));Deno.exit(1);}
