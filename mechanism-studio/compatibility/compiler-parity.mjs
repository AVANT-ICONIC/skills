#!/usr/bin/env node
/** Golden comparison against the PR #32 source baseline, not against current
 *  code. Runs all five compiler CLIs without Teardown/npm/browser installation.
 *  This is intentionally separate from film QA and package format validators. */
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256,compareOutputTrees} from '../scripts/portable-receipt.mjs';
const CURRENT=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const REVIEWED=['geneva-four-slot-study.json','slider-crank-study.json','four-bar-study.json'];
const RIGID=['scene.json','slider-rail.json'];
const SNAPSHOT='e952c699fe0f83ceb9b127a469db7bcb8930d667';
function run(cwd,script,args){
 const r=spawnSync(process.execPath,[join(cwd,script),...args],{cwd,encoding:'utf8',timeout:45000,maxBuffer:4*1024*1024});
 if(r.error||r.status!==0)throw Error('COMPAT_CLI_FAILED '+script+' '+String(r.error?.message||r.stderr||r.stdout).slice(-1600));
 return r.stdout.trim();
}
function sameInput(base,now,path){
 const a=sha256(readFileSync(join(base,path))),b=sha256(readFileSync(join(now,path)));
 if(a!==b)throw Error('COMPAT_FIXTURE_CHANGED: '+path);
}
function unchangedFile(base,now,path){
 const a=sha256(readFileSync(join(base,path))),b=sha256(readFileSync(join(now,path)));
 if(a!==b)throw Error('COMPAT_RUNTIME_OR_PACKAGE_SCHEMA_CHANGED: '+path);
}
export function compareLegacyCompilers({baselineRoot, currentRoot=CURRENT}){
 if(!baselineRoot)throw Error('COMPAT_BASELINE_REQUIRED: pass --baseline-dir');
 const baseline=resolve(baselineRoot),current=resolve(currentRoot);
 const work=mkdtempSync(join(tmpdir(),'mechanism-five-compiler-parity-'));
 const rows=[];
 try{
  const listBefore=run(baseline,'mechanism-studio/scripts/compile-request.mjs',['--list']);
  const listAfter=run(current,'mechanism-studio/scripts/compile-request.mjs',['--list']);
  if(listAfter!==listBefore)throw Error('COMPAT_LIST_OUTPUT_CHANGED');
  for(const [family,names,dir,script,arg] of [
   ['reviewed',REVIEWED,'mechanism-studio/requests','mechanism-studio/scripts/compile-request.mjs','--request'],
   ['rigid',RIGID,'mechanism-studio/rigid-scene','mechanism-studio/rigid-scene/compile-scene.mjs',null]
  ])for(const name of names){
   const source=join(dir,name);sameInput(baseline,current,source);
   const slug=name.replace(/\.json$/,'').replace(/[^a-z0-9-]/gi,'-');
   const before=join(work,slug+'-baseline'),after=join(work,slug+'-current'),canonical=join(work,slug+'-canonical');
   const args=output=>arg?[arg,join(current,source),'--out',output]:[join(current,source),output];
   run(baseline,script,args(before));
   run(current,script,args(after));
   run(current,'mechanism-studio/scripts/compile-study.mjs',['--input',join(current,source),'--out',canonical]);
   const old=compareOutputTrees(before,after),unified=compareOutputTrees(before,canonical);
   rows.push({fixture:source,family,files:old.files,bytes:old.bytes,
     oldVsCurrent:old.status,oldVsCanonical:unified.status,treeSha256:old.sha256});
  }
  // The film entrypoints, runtime and package readers must stay identical in
  // phase 1. Exact generated source parity above guards all filmed inputs.
  for(const name of [
   'mechanism-studio/scripts/film-direction.mjs',
   'mechanism-studio/rigid-scene/main.js',
   'mechanism-studio/rigid-scene/stage.js',
   'mechanism-studio/rigid-scene/scene-core.mjs',
   'mechanism-studio/rigid-scene/package-scene.mjs',
   'mechanism-studio/scripts/package-generated.mjs',
   'mechanism-studio/scripts/package-example.mjs',
   'mechanism-studio/scripts/verify-generated.mjs',
   'mechanism-studio/rigid-scene/verify-scene.mjs'])unchangedFile(baseline,current,name);
  return{schema:'avant.mechanism-compiler-parity/1',baselineRevision:SNAPSHOT,
    status:'PASS',fixtures:rows,packageSchemasPreserved:true,filmInputsPreserved:true,
    releaseReady:false};
 }finally{rmSync(work,{recursive:true,force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(process.argv[2]!=='--baseline-dir'||!process.argv[3]||process.argv.length!==4)
    throw Error('Usage: node compiler-parity.mjs --baseline-dir PR32_WORKTREE');
  const result=compareLegacyCompilers({baselineRoot:process.argv[3]});
  console.log(JSON.stringify(result,null,2));
 }catch(error){console.error(error.stack||error);process.exitCode=1;}
}
