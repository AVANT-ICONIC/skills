import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyPortablePackage} from '../scripts/verify-portable.mjs';
import {receiptForTree} from '../scripts/portable-receipt.mjs';
const SKILL=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const pin=JSON.parse(readFileSync(join(SKILL,'upstream.lock.json'),'utf8'));
const sha256=x=>createHash('sha256').update(x).digest('hex');
const inTemp=fn=>async()=>{const root=mkdtempSync(join(tmpdir(),'mechanism-phase3-package-'));try{return await fn(root);}finally{rmSync(root,{recursive:true,force:true});}};
function put(root,path,text){
 const target=join(root,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,text);
}
function assets(root,paths){return paths.map(path=>({path,bytes:readFileSync(join(root,path)).length,sha256:sha256(readFileSync(join(root,path)))}));}
const recipeFiles=['viewer/index.html','video/film.mp4','preview/poster.png','evidence/benchmark.json','LICENSES/teardown-MIT.txt','NOTICE'];
const rigidFiles=['viewer/index.html','video/film.mp4','preview/poster.png','preview/contact-sheet.png','evidence/scene.json','evidence/source-register.json','evidence/report.json','evidence/scene-core.mjs','evidence/rigid-pose-core.mjs','LICENSES/teardown-MIT.txt','NOTICE'];
function makeRecipe(root){
 for(const p of recipeFiles)put(root,p,'fixed fixture content '+p+'\n');
 const m={schema:'avant.mechanism-package/1',packageId:'golden-compat-preview',tier:'compatibility-preview',releaseReady:false,
  generator:{revision:pin.revision,packageLockSha256:pin.packageLockSha256},
  timebase:{frameCount:36,fpsNumerator:6,fpsDenominator:1},
  entrypoints:{viewer:'viewer/index.html',video:'video/film.mp4',poster:'preview/poster.png',evidence:'evidence/benchmark.json'},
  assets:assets(root,recipeFiles)};
 put(root,'manifest.json',JSON.stringify(m,null,2)+'\n');return m;
}
function makeRigid(root){
 const scene=JSON.parse(readFileSync(join(SKILL,'rigid-scene/scene.json'),'utf8'));
 const report={id:scene.id,state:'PASS',releaseReady:false,checks:[
  'chromium-boot','replay-and-branch-interaction','six-unique-physical-poses',
  'editorial-no-panel-overlap','offline-and-errors','real-full-film','decode-and-original-audio'
 ].map(id=>({id,status:'PASS'}))};
 const source={sceneId:scene.id,sourceDocumentsRetrieved:false,certifiedPhysics:false,
  dimensionsProvenance:'illustrative-not-measured',references:scene.references};
 for(const path of rigidFiles)put(root,path,'fixed fixture content '+path+'\n');
 put(root,'evidence/scene.json',JSON.stringify(scene,null,2)+'\n');
 put(root,'evidence/report.json',JSON.stringify(report,null,2)+'\n');
 put(root,'evidence/source-register.json',JSON.stringify(source,null,2)+'\n');
 const m={schema:'avant.rigid-scene-package/1',id:scene.id,tier:'generic-scene-preview',releaseReady:false,
  generator:{revision:pin.revision,packageLockSha256:pin.packageLockSha256},
  film:{width:scene.video.width,height:scene.video.height,frames:scene.video.fps*scene.video.durationSeconds},
  assets:assets(root,rigidFiles)};
 put(root,'manifest.json',JSON.stringify(m,null,2)+'\n');return m;
}
test('both old manifest formats route through the original verifier without changing a byte',inTemp(async root=>{
 for(const [kind,make,expected] of [['recipe',makeRecipe,'avant.mechanism-package/1'],['rigid',makeRigid,'avant.rigid-scene-package/1']]){
  const dir=join(root,kind);mkdirSync(dir);
  const manifest=make(dir),before=receiptForTree(dir);
  const receipt=await verifyPortablePackage(dir);
  assert.equal(receipt.schema,'avant.mechanism-package-verification/1');
  assert.equal(receipt.sourceSchema,expected);
  assert.equal(receipt.status,'PASS');assert.equal(receipt.releaseReady,false);
  assert.equal(receipt.assetsVerified,manifest.assets.length);
  assert.deepEqual(receiptForTree(dir),before);
 }
}));
test('both families reject changed payloads, even with an unchanged valid manifest',inTemp(async root=>{
 for(const [kind,make] of [['recipe',makeRecipe],['rigid',makeRigid]]){
  const dir=join(root,kind);mkdirSync(dir);make(dir);
  put(dir,'viewer/index.html','post-manifest tamper\n');
  await assert.rejects(verifyPortablePackage(dir),/HASH_MISMATCH/);
 }
}));
test('unknown v2 schemas and preview-release promotions fail closed',inTemp(async root=>{
 const baseline=makeRecipe(root);
 for(const modify of [m=>{m.schema='avant.mechanism-package/2';},m=>{m.releaseReady=true;}]){
  const m=structuredClone(baseline);
  modify(m);put(root,'manifest.json',JSON.stringify(m));
  await assert.rejects(verifyPortablePackage(root),/SCHEMA_UNSUPPORTED|PREVIEW_MUST_NOT_CLAIM_RELEASE/);
 }
}));
test('shared entrypoint rejects symlinked payload, manifest and package root',inTemp(async root=>{
 const dir=join(root,'real');mkdirSync(dir);makeRecipe(dir);
 const payload=join(dir,'viewer/index.html');
 const contents=readFileSync(payload);const external=join(root,'external');writeFileSync(external,contents);
 rmSync(payload);symlinkSync(external,payload);
 await assert.rejects(verifyPortablePackage(dir),/UNSAFE_ASSET_ENTRY/);
 rmSync(payload);writeFileSync(payload,contents);
 const manifest=join(dir,'manifest.json'),literal=join(root,'manifest-copy');writeFileSync(literal,readFileSync(manifest));
 rmSync(manifest);symlinkSync(literal,manifest);
 await assert.rejects(verifyPortablePackage(dir),/NONREGULAR_FILE/);
 rmSync(manifest);writeFileSync(manifest,readFileSync(literal));
 const alias=join(root,'alias');symlinkSync(dir,alias,'dir');
 await assert.rejects(verifyPortablePackage(alias),/ROOT_INVALID/);
}));
test('shared entrypoint rejects asset traversal before importing either family verifier',inTemp(async root=>{
 const m=makeRecipe(root);m.assets[0].path='../outside';
 put(root,'manifest.json',JSON.stringify(m));
 await assert.rejects(verifyPortablePackage(root),/UNSAFE_ASSET_PATH/);
}));
