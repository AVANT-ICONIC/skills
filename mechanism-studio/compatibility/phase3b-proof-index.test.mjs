import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {cpSync,mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyWithProofIndex} from '../scripts/verify-proof-index.mjs';
import {receiptForTree} from '../scripts/portable-receipt.mjs';
const SKILL=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const pin=JSON.parse(readFileSync(join(SKILL,'upstream.lock.json'),'utf8'));
const digest=x=>createHash('sha256').update(x).digest('hex');
const recipeFiles=['viewer/index.html','video/film.mp4','preview/poster.png',
 'evidence/benchmark.json','LICENSES/teardown-MIT.txt','NOTICE'];
const rigidFiles=['viewer/index.html','video/film.mp4','preview/poster.png','preview/contact-sheet.png',
 'evidence/scene.json','evidence/source-register.json','evidence/report.json',
 'evidence/scene-core.mjs','evidence/rigid-pose-core.mjs','LICENSES/teardown-MIT.txt','NOTICE'];
function put(root,p,content){
 const f=join(root,p);mkdirSync(dirname(f),{recursive:true});writeFileSync(f,content);
}
function digestAssets(root,paths){return paths.map(path=>({
 path,bytes:readFileSync(join(root,path)).length,sha256:digest(readFileSync(join(root,path)))}));}
const fixture=fn=>async()=>{
 const dir=mkdtempSync(join(tmpdir(),'phase3b-index-'));
 try{await fn(dir);}finally{rmSync(dir,{recursive:true,force:true});}
};
function recipe(root,id='immutable-compat-preview'){
 for(const p of recipeFiles)put(root,p,'illustrative fixture: '+p+'\n');
 put(root,'evidence/benchmark.json',JSON.stringify({state:'PASS',checks:[
  {id:'frame-verified',status:'PASS'}]},null,2)+'\n');
 const manifest={schema:'avant.mechanism-package/1',packageId:id,tier:'compatibility-preview',
  releaseReady:false,generator:{revision:pin.revision,packageLockSha256:pin.packageLockSha256},
  timebase:{frameCount:36,fpsNumerator:6,fpsDenominator:1},
  entrypoints:{viewer:'viewer/index.html',video:'video/film.mp4',poster:'preview/poster.png',evidence:'evidence/benchmark.json'},
  assets:digestAssets(root,recipeFiles)};
 put(root,'manifest.json',JSON.stringify(manifest,null,2)+'\n');return manifest;
}
function rigid(root){
 for(const p of rigidFiles)put(root,p,'illustrative fixture: '+p+'\n');
 const scene=JSON.parse(readFileSync(join(SKILL,'rigid-scene/scene.json'),'utf8'));
 const report={id:scene.id,state:'PASS',releaseReady:false,checks:[
  'chromium-boot','replay-and-branch-interaction','six-unique-physical-poses',
  'editorial-no-panel-overlap','offline-and-errors','real-full-film','decode-and-original-audio'
 ].map(id=>({id,status:'PASS'}))};
 put(root,'evidence/scene.json',JSON.stringify(scene,null,2)+'\n');
 put(root,'evidence/report.json',JSON.stringify(report,null,2)+'\n');
 put(root,'evidence/source-register.json',JSON.stringify({sceneId:scene.id,
  sourceDocumentsRetrieved:false,certifiedPhysics:false,
  dimensionsProvenance:'illustrative-not-measured',references:scene.references},null,2)+'\n');
 const manifest={schema:'avant.rigid-scene-package/1',id:scene.id,tier:'generic-scene-preview',
  releaseReady:false,generator:{revision:pin.revision,packageLockSha256:pin.packageLockSha256},
  film:{width:scene.video.width,height:scene.video.height,
   frames:scene.video.fps*scene.video.durationSeconds},assets:digestAssets(root,rigidFiles)};
 put(root,'manifest.json',JSON.stringify(manifest,null,2)+'\n');return manifest;
}
function makeIndex(root,{asset,check}={}){
 const m=JSON.parse(readFileSync(join(root,'manifest.json')));
 const chosen=asset??(m.schema==='avant.mechanism-package/1'?'evidence/benchmark.json':'evidence/report.json');
 const legacyCheckId=check??(m.schema==='avant.mechanism-package/1'?'frame-verified':'chromium-boot');
 return {schema:'avant.mechanism-proof-index/1',
  subject:{sourceSchema:m.schema,packageId:m.packageId??m.id,
   manifestSha256:digest(readFileSync(join(root,'manifest.json'))),
   assetCount:m.assets.length,releaseReady:false},
  references:[{id:'recorded-render',domain:'render-reproducibility',assetPath:chosen,
   assetSha256:m.assets.find(a=>a.path===chosen)?.sha256,
   legacyCheckId,assessment:'REPORTED',evaluator:'legacy-report',
   method:'manifest-hash-and-check-id'}],
  originAssurance:'UNATTESTED',physicalCertification:'NOT_EVALUATED',hostIsolation:'NOT_EVALUATED'};
}
async function check(root,sidecar,policy='require-index-consistency'){
 return verifyWithProofIndex({packageDirectory:root,indexFile:sidecar,policy});
}
test('both legacy formats: detached proof bindings PASS without writing package data',fixture(async d=>{
 for(const [kind,build] of [['recipe',recipe],['rigid',rigid]]){
  const folder=join(d,kind);mkdirSync(folder);build(folder);
  const before=receiptForTree(folder);
  const indexFile=join(d,kind+'.json');writeFileSync(indexFile,JSON.stringify(makeIndex(folder),null,2)+'\n');
  const receipt=await check(folder,indexFile);
  assert.equal(receipt.indexBinding,'BOUND');assert.equal(receipt.referencesChecked,1);
  assert.equal(receipt.originAssurance,'UNATTESTED');
  assert.equal(receipt.package.sourceSchema,JSON.parse(readFileSync(join(folder,'manifest.json'))).schema);
  assert.equal(receipt.releaseReady,false);
  assert.deepEqual(receiptForTree(folder),before);
 }
}));
test('legacy-only policy ignores even a malicious sidecar; require-index refuses absence',fixture(async d=>{
 const folder=join(d,'recipe');mkdirSync(folder);recipe(folder);
 const optional=await check(folder,join(d,'missing.json'),'legacy-only');
 assert.equal(optional.indexBinding,'NOT_EVALUATED');
 await assert.rejects(check(folder),/PROOF_INDEX_REQUIRED/);
 await assert.rejects(check(folder,join(d,'missing.json')),/ENOENT/);
 await assert.rejects(check(folder,null,'require-trusted-origin'),/TRUSTED_ORIGIN_UNAVAILABLE/);
}));
test('foreign/stale index cannot bind to different package identity',fixture(async d=>{
 const a=join(d,'a'),b=join(d,'b');mkdirSync(a);mkdirSync(b);
 recipe(a,'compat-foo');recipe(b,'compat-bar');
 const f=join(d,'old.json');writeFileSync(f,JSON.stringify(makeIndex(a)));
 await assert.rejects(check(b,f),/SUBJECT_MISMATCH/);
}));
test('bit-identical copied package accepts same content identity, not trusted origin',fixture(async d=>{
 const a=join(d,'a'),b=join(d,'b');mkdirSync(a);recipe(a);cpSync(a,b,{recursive:true});
 const index=join(d,'copied.json');writeFileSync(index,JSON.stringify(makeIndex(a)));
 const r=await check(b,index);assert.equal(r.indexBinding,'BOUND');
 assert.equal(r.originAssurance,'UNATTESTED');
}));
test('consistently rehashed forged package/index can only claim internal integrity',fixture(async d=>{
 const a=join(d,'a');mkdirSync(a);recipe(a);
 put(a,'viewer/index.html','attacker modified but still package-consistent');
 const m=JSON.parse(readFileSync(join(a,'manifest.json')));
 m.assets=digestAssets(a,recipeFiles);put(a,'manifest.json',JSON.stringify(m,null,2)+'\n');
 const index=join(d,'forged.json');writeFileSync(index,JSON.stringify(makeIndex(a)));
 const r=await check(a,index);
 assert.equal(r.indexBinding,'BOUND');assert.equal(r.originAssurance,'UNATTESTED');
}));
test('wrong or changed asset fails; a regenerated index cannot override original manifest hashes',fixture(async d=>{
 const folder=join(d,'a');mkdirSync(folder);recipe(folder);
 const idx=join(d,'index.json');writeFileSync(idx,JSON.stringify(makeIndex(folder)));
 put(folder,'viewer/index.html','tampered payload');
 await assert.rejects(check(folder,idx),/ASSET_HASH_MISMATCH/);
}));
test('raw manifest bytes, not JSON reserialization, are authoritative',fixture(async d=>{
 const folder=join(d,'a');mkdirSync(folder);recipe(folder);
 const idx=join(d,'index.json');writeFileSync(idx,JSON.stringify(makeIndex(folder)));
 const m=JSON.parse(readFileSync(join(folder,'manifest.json')));
 put(folder,'manifest.json',JSON.stringify(m)+'\n');
 await assert.rejects(check(folder,idx),/SUBJECT_MISMATCH/);
}));
test('unknown schemas, self-asserted attestation and extra fields are refused',fixture(async d=>{
 const folder=join(d,'a');mkdirSync(folder);recipe(folder);
 const idx=join(d,'index.json'),baseline=makeIndex(folder);
 for(const mutation of [
  x=>{x.schema='avant.mechanism-proof-index/2';},
  x=>{x.originAssurance='ATTESTED';},
  x=>{x.signature='SELF-SIGNED-AND-TRUST-ME';},
  x=>{x.subject.sourceSchema='avant.rigid-scene-package/1';}
 ]){
  const changed=structuredClone(baseline);mutation(changed);writeFileSync(idx,JSON.stringify(changed));
  await assert.rejects(check(folder,idx),/UNSUPPORTED_ASSURANCE_OR_SCHEMA|FIELDS_INVALID|SUBJECT_MISMATCH/);
 }
}));
test('duplicate reference IDs and duplicate JSON object fields are rejected',fixture(async d=>{
 const folder=join(d,'a');mkdirSync(folder);recipe(folder);
 const idx=join(d,'index.json'),m=makeIndex(folder);
 m.references.push({...m.references[0]});
 writeFileSync(idx,JSON.stringify(m));await assert.rejects(check(folder,idx),/DUPLICATE_OR_INVALID_ID/);
 writeFileSync(idx,JSON.stringify(makeIndex(folder)).replace('"originAssurance":"UNATTESTED"','"originAssurance":"UNATTESTED","originAssurance":"UNATTESTED"'));
 await assert.rejects(check(folder,idx),/DUPLICATE_FIELD/);
}));
test('unsupported replay assertions, safety claims and fake check identifiers fail closed',fixture(async d=>{
 const folder=join(d,'a');mkdirSync(folder);rigid(folder);
 const idx=join(d,'index.json'),baseline=makeIndex(folder);
 for(const [edit,reason] of [
  [x=>{x.references[0].assessment='REPLAYED';},/REPLAY_NOT_IMPLEMENTED/],
  [x=>{x.references[0].domain='physical-safety';},/UNSUPPORTED_CERTIFICATION/],
  [x=>{x.references[0].legacyCheckId='nonexistent-proof';},/REPORTED_CHECK_MISSING/],
  [x=>{x.references[0].assetPath='evidence/rigid-pose-core.mjs';},/EVIDENCE_UNSUPPORTED/],
  [x=>{x.references[0].assetSha256='0'.repeat(64);},/ASSET_BINDING_MISMATCH/]
 ]){
  const m=structuredClone(baseline);edit(m);writeFileSync(idx,JSON.stringify(m));
  await assert.rejects(check(folder,idx),reason);
 }
}));
test('index must be detached, regular, bounded and never reached via symlink',fixture(async d=>{
 const folder=join(d,'a');mkdirSync(folder);recipe(folder);
 const idx=join(d,'index.json'),serialized=JSON.stringify(makeIndex(folder));writeFileSync(idx,serialized);
 const nested=join(folder,'in-package.json');writeFileSync(nested,serialized);
 await assert.rejects(check(folder,nested),/MUST_BE_DETACHED/);
 const link=join(d,'sidecar-link.json');symlinkSync(idx,link);
 await assert.rejects(check(folder,link),/UNSAFE_SIDECAR_PATH/);
 const parentLink=join(d,'link-dir');symlinkSync(folder,parentLink,'dir');
 await assert.rejects(check(folder,join(parentLink,'in-package.json')),/UNSAFE_SIDECAR_PATH/);
 writeFileSync(idx,' '.repeat(65537));
 await assert.rejects(check(folder,idx),/FILE_INVALID/);
}));
test('unsupported policy and missing subject fields cannot pass',fixture(async d=>{
 const folder=join(d,'a');mkdirSync(folder);recipe(folder);
 const idx=join(d,'index.json'),m=makeIndex(folder);
 delete m.subject.manifestSha256;writeFileSync(idx,JSON.stringify(m));
 await assert.rejects(check(folder,idx),/FIELDS_MISSING/);
 await assert.rejects(check(folder,idx,'accept-everything'),/POLICY_UNSUPPORTED/);
}));
