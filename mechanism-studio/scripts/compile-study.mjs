#!/usr/bin/env node
/** Canonical compiler entrypoint. Legacy backends remain format owners until
 *  their generated trees and film/package evidence are proven interchangeable. */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
const ROUTES=Object.freeze({
 'avant.mechanism-request/1':'reviewed-recipe',
 'avant.rigid-scene/1':'rigid-scene'
});
export function compileStudy({study,out,handlers}){
 if(!study||typeof study!=='object'||Array.isArray(study))throw Error('STUDY_INPUT_INVALID');
 const route=ROUTES[study.schema];
 if(!route)throw Error('STUDY_SCHEMA_UNSUPPORTED');
 const handler=handlers?.[route];
 if(typeof handler!=='function')throw Error('STUDY_ROUTE_HANDLER_MISSING: '+route);
 return handler(route==='reviewed-recipe'?{request:study,out}:{scene:study,out});
}
export function listStudyCompilers(){return {...ROUTES};}
export async function compileStudyFromSource({study,out}){
 const route=ROUTES[study?.schema];
 if(!route)throw Error('STUDY_SCHEMA_UNSUPPORTED');
 const handler=route==='reviewed-recipe'
  ?(await import('./compile-request.mjs')).compileRequest
  :(await import('../rigid-scene/compile-scene.mjs')).compileScene;
 return compileStudy({study,out,handlers:{[route]:handler}});
}
async function runCli(){
 const {values}=parseArgs({options:{input:{type:'string'},out:{type:'string'},list:{type:'boolean'}},strict:true});
 if(values.list){console.log(JSON.stringify(listStudyCompilers()));return;}
 if(!values.input||!values.out)throw Error('Usage: node compile-study.mjs --input STUDY_JSON --out NEW_DIRECTORY');
 const study=JSON.parse(readFileSync(resolve(values.input),'utf8'));
 const result=await compileStudyFromSource({study,out:values.out});
 console.log(JSON.stringify(result,null,2));
}
// Run only after ESM evaluation finishes; a top-level awaited dynamic import
// deadlocks when legacy compiler modules import this shared dispatcher.
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 void runCli().catch(error=>{console.error(String(error.message||error));process.exitCode=1;});
