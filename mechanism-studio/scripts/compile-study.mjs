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
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const {values}=parseArgs({options:{input:{type:'string'},out:{type:'string'},list:{type:'boolean'}},strict:true});
  if(values.list)console.log(JSON.stringify(listStudyCompilers()));
  else if(!values.input||!values.out)throw Error('Usage: node compile-study.mjs --input STUDY_JSON --out NEW_DIRECTORY');
  else console.log(JSON.stringify(await compileStudyFromSource({study:JSON.parse(readFileSync(resolve(values.input),'utf8')),out:values.out}),null,2));
 }catch(error){console.error(String(error.message||error));process.exitCode=1;}
}
