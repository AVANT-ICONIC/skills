import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,mkdtempSync,mkdirSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createProducerArchive,verifyProducerArchive} from './producer-archive.mjs';
import {receiptForTree} from '../scripts/portable-receipt.mjs';
const HERE=dirname(fileURLToPath(import.meta.url)),SKILL=resolve(HERE,'..');
const PIN=JSON.parse(readFileSync(join(SKILL,'upstream.lock.json'),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const put=(root,name,value)=>{
 const path=join(root,name);mkdirSync(dirname(path),{recursive:true});
 writeFileSync(path,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
};
const digest=(root,paths)=>paths.map(path=>{const b=readFileSync(join(root,path));return {path,bytes:b.length,sha256:sha(b)};});
const recipeAssets=['viewer/index.html','video/film.mp4','preview/poster.png',
 'evidence/benchmark.json','LICENSES/teardown-MIT.txt','NOTICE'];
function recipe(dir,id){
 for(const file of recipeAssets)put(dir,file,'synthetic-test-only: '+file+'\n');
 const m={schema:'avant.mechanism-package/1',packageId:id,tier:'compatibility-preview',
  releaseReady:false,generator:{revision:PIN.revision,packageLockSha256:PIN.packageLockSha256},
  timebase:{frameCount:36,fpsNumerator:6,fpsDenominator:1},
  entrypoints:{viewer:'viewer/index.html',video:'video/film.mp4',
   poster:'preview/poster.png',evidence:'evidence/benchmark.json'},
  assets:digest(dir,recipeAssets)};
 put(dir,'manifest.json',m);
}
const rigidAssets=['viewer/index.html','video/film.mp4','preview/poster.png',
 'preview/contact-sheet.png','evidence/scene.json','evidence/source-register.json',
 'evidence/report.json','evidence/scene-core.mjs','evidence/rigid-pose-core.mjs',
 'LICENSES/teardown-MIT.txt','NOTICE'];
function rigid(dir,kind){
 for(const file of rigidAssets)put(dir,file,'synthetic-test-only: '+file+'\n');
 const scene=JSON.parse(readFileSync(join(SKILL,'rigid-scene',kind),'utf8'));
 const checks=['chromium-boot','replay-and-branch-interaction','six-unique-physical-poses',
  'editorial-no-panel-overlap','offline-and-errors','real-full-film','decode-and-original-audio'];
 if(scene.joints.some(j=>j.type==='prismatic'))checks.push('prismatic-rail-and-closure');
 put(dir,'evidence/scene.json',scene);
 put(dir,'evidence/report.json',{id:scene.id,state:'PASS',releaseReady:false,
  checks:checks.map(id=>({id,status:'PASS'}))});
 put(dir,'evidence/source-register.json',{sceneId:scene.id,sourceDocumentsRetrieved:false,
  certifiedPhysics:false,dimensionsProvenance:'illustrative-not-measured',
  references:scene.references});
 put(dir,'manifest.json',{schema:'avant.rigid-scene-package/1',id:scene.id,
  tier:'generic-scene-preview',releaseReady:false,
  generator:{revision:PIN.revision,packageLockSha256:PIN.packageLockSha256},
  film:{width:scene.video.width,height:scene.video.height,
   frames:scene.video.fps*scene.video.durationSeconds},assets:digest(dir,rigidAssets)});
}
const withTemp=fn=>async()=>{
 const dir=mkdtempSync(join(tmpdir(),'mechanism-producer-pilot-'));
 try{await fn(dir);}finally{rmSync(dir,{recursive:true,force:true});}
};
function makeFixtures(dir,family){
 const roots=[join(dir,'first'),join(dir,'second')];
 for(const root of roots)mkdirSync(root);
 if(family==='rigid'){
  rigid(roots[0],'scene.json');rigid(roots[1],'slider-rail.json');
 }else{
  recipe(roots[0],'slider-crank-study-002');recipe(roots[1],'four-bar-crank-rocker-study-003');
 }
 return roots;
}
test('reviewed producer: deterministic USTAR and independent roundtrip preserve source packages',withTemp(async dir=>{
 const roots=makeFixtures(dir,'reviewed');
 const before=roots.map(receiptForTree);
 const one=join(dir,'one.tar'),two=join(dir,'two.tar');
 const result=await createProducerArchive({family:'reviewed',packageDirs:roots,out:one});
 const verify=await verifyProducerArchive({family:'reviewed',archive:one});
 await createProducerArchive({family:'reviewed',packageDirs:[...roots].reverse(),out:two});
 assert.deepEqual(readFileSync(one),readFileSync(two));
 assert.equal(verify.archiveSha256,result.archiveSha256);
 assert.equal(verify.packages.length,2);
 assert.equal(verify.status,'PASS');
 assert.equal(verify.originAssurance,'UNATTESTED');
 assert.equal(verify.signature,'NOT_EVALUATED');
 assert.equal(verify.releaseReady,false);
 roots.forEach((r,i)=>assert.deepEqual(receiptForTree(r),before[i]));
}));
test('rigid producer: both graph-driven topologies preserved and verified',withTemp(async dir=>{
 const roots=makeFixtures(dir,'rigid'),archive=join(dir,'rigid.tar');
 const p=await createProducerArchive({family:'rigid',packageDirs:roots,out:archive});
 const v=await verifyProducerArchive({family:'rigid',archive});
 assert.equal(v.archiveSha256,p.archiveSha256);
 assert.deepEqual(v.packages.map(x=>x.id).sort(),['dual-drive-linkage-study-004','single-drive-rail-study-005']);
 assert.equal(v.packages.reduce((n,x)=>n+x.assets,0),22);
}));
test('tar bytes change and a forged source manifest never become trusted',withTemp(async dir=>{
 const roots=makeFixtures(dir,'reviewed'),archive=join(dir,'real.tar');
 await createProducerArchive({family:'reviewed',packageDirs:roots,out:archive});
 const payload=readFileSync(archive);
 const modified=Buffer.from(payload);
 const location=modified.indexOf(Buffer.from('synthetic-test-only'));
 assert.ok(location>=0);
 modified[location]^=0x01;
 const bad=join(dir,'bad.tar');writeFileSync(bad,modified);
 await assert.rejects(verifyProducerArchive({family:'reviewed',archive:bad}),/HASH_MISMATCH/);
}));
test('noncanonical header, reordered files, trailing bytes and truncation fail closed',withTemp(async dir=>{
 const roots=makeFixtures(dir,'reviewed'),archive=join(dir,'real.tar');
 await createProducerArchive({family:'reviewed',packageDirs:roots,out:archive});
 const original=readFileSync(archive),bad=join(dir,'bad.tar');
 const patch=fn=>{const b=Buffer.from(original);fn(b);writeFileSync(bad,b);};
 patch(b=>{b[100]=0x37;});
 await assert.rejects(verifyProducerArchive({family:'reviewed',archive:bad}),/NONCANONICAL_HEADER/);
 patch(b=>{b[b.length-1024]=0x61;});
 await assert.rejects(verifyProducerArchive({family:'reviewed',archive:bad}),/TRAILER_INVALID/);
 writeFileSync(bad,original.subarray(0,original.length-512));
 await assert.rejects(verifyProducerArchive({family:'reviewed',archive:bad}),/TRUNCATED|TRAILER_INVALID/);
}));
test('unexpected files, symlinks, duplicate packages and wrong family fail before output',withTemp(async dir=>{
 const roots=makeFixtures(dir,'reviewed'),archive=join(dir,'bad.tar');
 put(roots[0],'unsafe-extra.js','extra source');
 await assert.rejects(createProducerArchive({family:'reviewed',packageDirs:roots,out:archive}),
  /UNLISTED_FILES/);assert.equal(existsSync(archive),false);
 rmSync(join(roots[0],'unsafe-extra.js'));
 symlinkSync(join(roots[0],'NOTICE'),join(roots[0],'unsafe-link'));
 await assert.rejects(createProducerArchive({family:'reviewed',packageDirs:roots,out:archive}),
  /RECEIPT_UNSAFE_ENTRY/);assert.equal(existsSync(archive),false);
 rmSync(join(roots[0],'unsafe-link'));
 await assert.rejects(createProducerArchive({family:'reviewed',packageDirs:[roots[0],roots[0]],out:archive}),
  /OUTPUT_UNSAFE/);
 await assert.rejects(createProducerArchive({family:'rigid',packageDirs:roots,out:archive}),
  /PACKAGE_SET_MISMATCH/);
}));
test('refuses overwrites and destinations nested inside source packages',withTemp(async dir=>{
 const roots=makeFixtures(dir,'reviewed');
 const out=join(roots[0],'embedded.tar');
 await assert.rejects(createProducerArchive({family:'reviewed',packageDirs:roots,out}),/OUTPUT_UNSAFE/);
 const existing=join(dir,'exists.tar');writeFileSync(existing,'existing');
 await assert.rejects(createProducerArchive({family:'reviewed',packageDirs:roots,out:existing}),/OUTPUT_UNSAFE/);
 assert.equal(readFileSync(existing,'utf8'),'existing');
}));
