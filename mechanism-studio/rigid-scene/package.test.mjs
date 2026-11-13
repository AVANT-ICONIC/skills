import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyScenePackage} from './package-scene.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const scene=JSON.parse(readFileSync(join(root,'scene.json'),'utf8'));
const h=b=>createHash('sha256').update(b).digest('hex');
const names=['viewer/index.html','video/film.mp4','preview/poster.png','preview/contact-sheet.png','evidence/scene.json','evidence/source-register.json','evidence/report.json','evidence/scene-core.mjs','evidence/rigid-pose-core.mjs','LICENSES/teardown-MIT.txt','NOTICE'];
test('portable package rejects missing signed checks, altered hashes and false source verification',()=>{
 const dir=mkdtempSync(join(tmpdir(),'rigid-scene-package-'));
 try{
  const checks=['chromium-boot','replay-and-branch-interaction','six-unique-physical-poses','editorial-no-panel-overlap','offline-and-errors','real-full-film','decode-and-original-audio'].map(id=>({id,status:'PASS'}));
  const content={
   'evidence/scene.json':JSON.stringify(scene),
   'evidence/source-register.json':JSON.stringify({sceneId:scene.id,references:scene.references,sourceDocumentsRetrieved:false,certifiedPhysics:false,dimensionsProvenance:'illustrative-not-measured'}),
   'evidence/report.json':JSON.stringify({id:scene.id,state:'PASS',releaseReady:false,checks})
  };
  const assets=names.map(path=>{const bytes=Buffer.from(content[path]||'example:'+path);const dest=join(dir,path);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,bytes);return{path,bytes:bytes.length,sha256:h(bytes)};});
  const manifest={schema:'avant.rigid-scene-package/1',tier:'generic-scene-preview',id:scene.id,releaseReady:false,
   generator:{revision:'a91262ac1109051e014662d42ecb0b7bc1f113b1',packageLockSha256:'39297ac60ef6ae04a93f4716c6bbd6ae48bbd3f116e583d6700274a113012b1e'},
   film:{width:1280,height:720,fps:24,frames:144},assets};
  const save=()=>writeFileSync(join(dir,'manifest.json'),JSON.stringify(manifest));save();
  assert.equal(verifyScenePackage(dir).assets,11);
  manifest.film.frames=143;save();assert.throws(()=>verifyScenePackage(dir),/TIMEBASE_MISMATCH/);manifest.film.frames=144;save();
  manifest.releaseReady=true;save();assert.throws(()=>verifyScenePackage(dir),/MANIFEST_INVALID/);manifest.releaseReady=false;save();
  const reportFile=join(dir,'evidence/report.json');writeFileSync(reportFile,JSON.stringify({id:scene.id,state:'PASS',releaseReady:false,checks:checks.slice(1)}));
  assert.throws(()=>verifyScenePackage(dir),/HASH_MISMATCH/);
  const updated=readFileSync(reportFile);const a=manifest.assets.find(x=>x.path==='evidence/report.json');a.bytes=updated.length;a.sha256=h(updated);save();
  assert.throws(()=>verifyScenePackage(dir),/GATE_MISSING/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
