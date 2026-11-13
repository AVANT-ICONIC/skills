#!/usr/bin/env node
/** Hash-checked standalone rigid-scene delivery; not a certified engineering output. */
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {copyFileSync,existsSync,lstatSync,mkdirSync,readFileSync,renameSync,rmSync,writeFileSync,statSync} from 'node:fs';
import {dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {validateScene} from './scene-core.mjs';
const HERE=dirname(fileURLToPath(import.meta.url));
const PIN=JSON.parse(readFileSync(join(HERE,'../upstream.lock.json'),'utf8'));
const hash=x=>createHash('sha256').update(x).digest('hex');
const files=['viewer/index.html','video/film.mp4','preview/poster.png','preview/contact-sheet.png',
 'evidence/scene.json','evidence/source-register.json','evidence/report.json',
 'evidence/scene-core.mjs','evidence/rigid-pose-core.mjs','LICENSES/teardown-MIT.txt','NOTICE'];
const regular=p=>{if(!existsSync(p)||!lstatSync(p).isFile())throw Error('PACKAGE_FILE_NOT_REGULAR: '+p);return p;};
const digest=p=>{const b=readFileSync(regular(p));return{sha256:hash(b),bytes:b.length};};
function call(cmd,args,cwd){const r=spawnSync(cmd,args,{cwd,encoding:'utf8',timeout:120000,maxBuffer:5*1024*1024});if(r.error||r.status!==0)throw Error('PACKAGE_COMMAND_FAILED '+cmd+': '+String(r.stderr||r.error).slice(-1000));return r.stdout;}
export function verifyScenePackage(root){
 const r=resolve(root),manifest=JSON.parse(readFileSync(regular(join(r,'manifest.json')),'utf8'));
 if(manifest.schema!=='avant.rigid-scene-package/1'||manifest.tier!=='generic-scene-preview'||manifest.releaseReady!==false||
   manifest.generator?.revision!==PIN.revision||manifest.generator?.packageLockSha256!==PIN.packageLockSha256||
   manifest.assets?.length!==files.length||manifest.assets.some((a,i)=>a.path!==files[i]))throw Error('PACKAGE_MANIFEST_INVALID');
 for(const asset of manifest.assets){if(asset.path.includes('..')||asset.path.startsWith('/'))throw Error('PACKAGE_PATH_INVALID');
  const actual=digest(join(r,asset.path));if(actual.sha256!==asset.sha256||actual.bytes!==asset.bytes)throw Error('PACKAGE_HASH_MISMATCH: '+asset.path);}
 const scene=validateScene(JSON.parse(readFileSync(join(r,'evidence/scene.json'),'utf8')));
 const report=JSON.parse(readFileSync(join(r,'evidence/report.json'),'utf8'));
 const source=JSON.parse(readFileSync(join(r,'evidence/source-register.json'),'utf8'));
 if(scene.id!==manifest.id||report.id!==manifest.id||report.state!=='PASS'||report.releaseReady!==false||
    source.sceneId!==scene.id||source.sourceDocumentsRetrieved!==false||source.certifiedPhysics!==false||
    source.dimensionsProvenance!=='illustrative-not-measured'||
    JSON.stringify(source.references)!==JSON.stringify(scene.references))throw Error('PACKAGE_EVIDENCE_MISMATCH');
 const essential=['chromium-boot','replay-and-branch-interaction','six-unique-physical-poses','editorial-no-panel-overlap','offline-and-errors','real-full-film','decode-and-original-audio'];
 if(scene.joints.some(j=>j.type==='prismatic'))essential.push('prismatic-rail-and-closure');
 for(const id of essential
  if(!report.checks.some(c=>c.id===id&&c.status==='PASS'))throw Error('PACKAGE_GATE_MISSING: '+id);
 if(manifest.film.frames!==scene.video.fps*scene.video.durationSeconds||
   manifest.film.width!==scene.video.width||manifest.film.height!==scene.video.height)throw Error('PACKAGE_TIMEBASE_MISMATCH');
 return{id:scene.id,assets:files.length,releaseReady:false,status:'PASS'};
}
export function packageScene({upstream,generated,evidence,build,out}){
 const engine=resolve(upstream),src=resolve(generated),ev=resolve(evidence),dst=resolve(out),built=resolve(build);
 if(existsSync(dst)||[engine,src,ev,built].some(root=>dst===root||dst.startsWith(root+sep)))throw Error('PACKAGE_DESTINATION_UNSAFE');
 if(call('git',['rev-parse','HEAD'],engine).trim()!==PIN.revision||digest(join(engine,'package-lock.json')).sha256!==PIN.packageLockSha256)throw Error('PACKAGE_UNPINNED_DEPENDENCY');
 const scene=validateScene(JSON.parse(readFileSync(regular(join(src,'scene.json')),'utf8')));
 const report=JSON.parse(readFileSync(regular(join(ev,'report.json')),'utf8'));
 if(report.state!=='PASS'||report.id!==scene.id)throw Error('PACKAGE_UNVERIFIED_RENDER');
 // Source files in the generated folder must be the exact reviewed source from this repository.
 for(const name of ['main.js','stage.js','model.mjs','style.css','scene-core.mjs','rigid-pose-core.mjs','film-direction.mjs']){
  const reference=name==='rigid-pose-core.mjs'||name==='film-direction.mjs'
   ?join(HERE,'../scripts',name):join(HERE,name);
  if(digest(reference).sha256!==digest(join(src,name)).sha256)throw Error('PACKAGE_UNREVIEWED_SOLVER: '+name);
 }
 // The compiled data module must be exactly the validated scene, not user-authored code.
 const expected='/* Checked, data-only rigid joint graph. */\nexport const SCENE=Object.freeze('+
   JSON.stringify(scene,null,2)+');\n';
 if(digest(join(src,'scene-data.mjs')).sha256!==hash(Buffer.from(expected)))
   throw Error('PACKAGE_UNREVIEWED_SCENE_MODULE');
 const staging=dst+'.stage-'+process.pid;
 if(existsSync(staging))throw Error('PACKAGE_STAGING_EXISTS');
 try{
  mkdirSync(staging,{recursive:true});for(const path of files)mkdirSync(dirname(join(staging,path)),{recursive:true});
  const map={
   'viewer/index.html':join(built,'dist',scene.id+'.html'),
   'video/film.mp4':join(ev,'film.mp4'),
   'preview/poster.png':join(ev,'decoded-2.5.png'),
   'evidence/scene.json':join(src,'scene.json'),
   'evidence/source-register.json':join(src,'source-register.json'),
   'evidence/report.json':join(ev,'report.json'),
   'evidence/scene-core.mjs':join(src,'scene-core.mjs'),
   'evidence/rigid-pose-core.mjs':join(src,'rigid-pose-core.mjs')
  };
  for(const [target,from] of Object.entries(map))copyFileSync(regular(from),join(staging,target));
  const args=['-v','error','-y'];for(let i=0;i<6;i++)args.push('-i',regular(join(ev,'shot-'+i+'.png')));
  args.push('-filter_complex','[0:v]scale=640:360[a];[1:v]scale=640:360[b];[2:v]scale=640:360[c];[3:v]scale=640:360[d];[4:v]scale=640:360[e];[5:v]scale=640:360[f];[a][b][c][d][e][f]xstack=inputs=6:layout=0_0|640_0|1280_0|0_360|640_360|1280_360[v]','-map','[v]','-frames:v','1',join(staging,'preview/contact-sheet.png'));
  call('ffmpeg',args,engine);
  const license=readFileSync(regular(join(engine,'LICENSE')),'utf8');if(!license.includes('MIT License'))throw Error('PACKAGE_UPSTREAM_LICENSE_INVALID');
  writeFileSync(join(staging,'LICENSES/teardown-MIT.txt'),license);
  writeFileSync(join(staging,'NOTICE'),`AVANT Mechanism Studio: ${scene.id}\nOriginal data-driven SE(2) scene renderer and kinematic equations.\nPinned Teardown ${PIN.revision}; original MIT license in LICENSES.\nSource URLs were not independently fetched or verified. Geometry illustrative.\nNot a global-branch-completeness claim, certified CAD, load/collision simulation or host sandbox.\nreleaseReady=false\n`);
  const manifest={schema:'avant.rigid-scene-package/1',id:scene.id,tier:'generic-scene-preview',releaseReady:false,
   generator:{repository:PIN.repository,revision:PIN.revision,packageLockSha256:PIN.packageLockSha256},
   solver:{schema:'avant.rigid-pose-constraints/1',machineSpecific:false,globalBranchCompletenessProved:false,certifiedPhysics:false},
   film:{width:scene.video.width,height:scene.video.height,fps:scene.video.fps,frames:scene.video.fps*scene.video.durationSeconds,audio:'original-synthesized-AAC-48kHz'},
   assets:files.map(path=>({path,...digest(join(staging,path))}))};
  writeFileSync(join(staging,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  const receipt=verifyScenePackage(staging);renameSync(staging,dst);return{...receipt,path:dst};
 }catch(e){rmSync(staging,{recursive:true,force:true});throw e;}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 try{if(process.argv.length===3&&process.argv[2]==='--help')console.log('Usage: node package-scene.mjs PINNED_ENGINE GENERATED EVIDENCE BUILD NEW_PACKAGE or --verify PACKAGE');
 else if(process.argv[2]==='--verify')console.log(JSON.stringify(verifyScenePackage(process.argv[3])));
 else if(process.argv.length===7)console.log(JSON.stringify(packageScene({upstream:process.argv[2],generated:process.argv[3],evidence:process.argv[4],build:process.argv[5],out:process.argv[6]})));
 else throw Error('PACKAGE_ARGUMENTS_INVALID');}
 catch(e){console.error(e.stack||e);process.exitCode=1;}
}
