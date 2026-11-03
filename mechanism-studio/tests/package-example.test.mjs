import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync,symlinkSync,writeFileSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {checkProbe,verifyPackage,packageExample} from '../scripts/package-example.mjs';

const h=b=>createHash('sha256').update(b).digest('hex');
function fixture(fn){
 const dir=mkdtempSync(path.join(tmpdir(),'mechanism-package-test-'));
 const paths=['viewer/index.html','video/film.mp4','preview/poster.png','evidence/benchmark.json','LICENSES/teardown-MIT.txt','NOTICE'];
 try{
  const assets=paths.map(p=>{const b=Buffer.from('fixture:'+p);const full=path.join(dir,p);mkdirSync(path.dirname(full),{recursive:true});writeFileSync(full,b);return{path:p,bytes:b.length,sha256:h(b)};});
  const m={schema:'avant.mechanism-package/1',packageId:'test-stage0-preview',tier:'compatibility-preview',releaseReady:false,
   generator:{revision:'a91262ac1109051e014662d42ecb0b7bc1f113b1',packageLockSha256:'39297ac60ef6ae04a93f4716c6bbd6ae48bbd3f116e583d6700274a113012b1e'},
   timebase:{fpsNumerator:6,fpsDenominator:1,frameCount:6},
   entrypoints:{viewer:'viewer/index.html',video:'video/film.mp4',poster:'preview/poster.png',evidence:'evidence/benchmark.json'},assets};
  const save=()=>writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(m));
  save();return fn({dir,m,save});
 }finally{rmSync(dir,{recursive:true,force:true});}
}
test('valid versioned package has six verified assets',()=>fixture(({dir})=>{
 const x=verifyPackage(dir);assert.equal(x.verified,true);assert.equal(x.files,6);assert.equal(x.releaseReady,false);
}));
test('bit-level tamper is detected',()=>fixture(({dir})=>{
 writeFileSync(path.join(dir,'viewer/index.html'),'modified');
 assert.throws(()=>verifyPackage(dir),/ASSET_HASH_MISMATCH/);
}));
test('path traversal and fake completeness are rejected',()=>fixture(({dir,m,save})=>{
 m.assets[0].path='../outside.html';save();assert.throws(()=>verifyPackage(dir),/PATH_REJECTED/);
 m.assets[0].path='viewer/index.html';m.assets.pop();save();assert.throws(()=>verifyPackage(dir),/ASSET_TABLE_INVALID/);
}));
test('unknown schema and misleading release claim are rejected',()=>fixture(({dir,m,save})=>{
 m.schema='avant.mechanism-package/2';save();assert.throws(()=>verifyPackage(dir),/SCHEMA_REJECTED/);
 m.schema='avant.mechanism-package/1';m.releaseReady=true;save();assert.throws(()=>verifyPackage(dir),/PREVIEW_MUST_NOT_CLAIM_RELEASE/);
}));
test('symlink output artifact is not accepted',()=>fixture(({dir,m,save})=>{
 const target=path.join(dir,'outside');writeFileSync(target,'fixture:viewer/index.html');
 const link=path.join(dir,'viewer/index.html');
 unlinkSync(link);symlinkSync(target,link);save();
 assert.throws(()=>verifyPackage(dir),/INPUT_NOT_REGULAR_FILE/);
}));
test('symlinked parent directory cannot escape package root',()=>fixture(({dir,m,save})=>{
 const viewer=path.join(dir,'viewer');
 const outside=path.join(dir,'outside-viewer');
 mkdirSync(outside);
 writeFileSync(path.join(outside,'index.html'),'fixture:viewer/index.html');
 rmSync(viewer,{recursive:true,force:true});
 symlinkSync(outside,viewer,'dir');
 save();
 assert.throws(()=>verifyPackage(dir),/PACKAGE_DIRECTORY_REJECTED/);
}));
test('original preview shares hash verification and requires honest model classification',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'mechanism-original-test-'));
 try{
  const paths=['viewer/index.html','video/film.mp4','preview/poster.png',
    'evidence/report.json','evidence/model.mjs','evidence/sources.md',
    'LICENSES/teardown-MIT.txt','NOTICE'];
  const assets=paths.map(p=>{
   const b=Buffer.from('original fixture '+p),file=path.join(dir,p);
   mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,b);
   return {path:p,bytes:b.length,sha256:h(b)};
  });
  const m={
   schema:'avant.mechanism-package/1',packageId:'geneva-test-original',
   tier:'original-preview',releaseReady:false,
   model:{classification:'idealized-source-grounded',lockingCam:false,verifiedEngineering:false},
   generator:{revision:'a91262ac1109051e014662d42ecb0b7bc1f113b1',
    packageLockSha256:'39297ac60ef6ae04a93f4716c6bbd6ae48bbd3f116e583d6700274a113012b1e'},
   timebase:{fpsNumerator:6,fpsDenominator:1,frameCount:18},
   entrypoints:{viewer:paths[0],video:paths[1],poster:paths[2],evidence:paths[3]},assets
  };
  const save=()=>writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(m));
  save();assert.equal(verifyPackage(dir).files,8);
  m.model.lockingCam=true;save();
  assert.throws(()=>verifyPackage(dir),/MODEL_PROVENANCE_INVALID/);
  m.model.lockingCam=false;save();
  writeFileSync(path.join(dir,'evidence/model.mjs'),'tampered');
  assert.throws(()=>verifyPackage(dir),/ASSET_HASH_MISMATCH/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('strict ffprobe metadata interpretation',()=>{
 const sample={streams:[{codec_type:'video',codec_name:'h264',pix_fmt:'yuv420p',nb_frames:'6',avg_frame_rate:'6/1',width:640,height:360}]};
 assert.deepEqual(checkProbe(sample),{fpsNumerator:6,fpsDenominator:1,frameCount:6,width:640,height:360});
 assert.throws(()=>checkProbe({streams:[{...sample.streams[0],codec_name:'vp9'}]}),/VIDEO_INVALID/);
 assert.throws(()=>checkProbe({streams:[{...sample.streams[0],avg_frame_rate:'0/0'}]}),/VIDEO_FPS_INVALID/);
});
test('reject unexpected machine before touching disk',()=>{
 assert.throws(()=>packageExample({machine:'anything',upstream:'/missing',run:'/missing',out:'/missing'}),/MACHINE_UNSUPPORTED/);
});


test('source-grounded film packages verify integrity, embedded brief and timebase',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'mechanism-generated-test-'));
 try{
  const names=['viewer/index.html','video/film.mp4','preview/poster.png',
   'preview/contact-sheet.png','evidence/report.json','evidence/request.json',
   'evidence/source-register.json','evidence/model.mjs','LICENSES/teardown-MIT.txt','NOTICE'];
  const content={
   'evidence/request.json':JSON.stringify({schema:'avant.mechanism-request/1',id:'slider-study-test',
    mechanism:'slider-crank',references:[{id:'reference'}],
    video:{fps:24,durationSeconds:8,width:1280,height:720}}),
   'evidence/source-register.json':JSON.stringify({requestId:'slider-study-test',sourcesFetched:false,
    physicalCertification:false})
  };
  const assets=names.map(name=>{
   const bytes=Buffer.from(content[name]||'tested:'+name),file=path.join(dir,name);
   mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,bytes);
   return {path:name,bytes:bytes.length,sha256:h(bytes)};
  });
  const m={schema:'avant.mechanism-package/1',packageId:'slider-study-test',tier:'generated-study-preview',
   releaseReady:false,model:{classification:'reference-grounded',verifiedEngineering:false,mechanism:'slider-crank'},
   generator:{revision:'a91262ac1109051e014662d42ecb0b7bc1f113b1',
    packageLockSha256:'39297ac60ef6ae04a93f4716c6bbd6ae48bbd3f116e583d6700274a113012b1e'},
   timebase:{fpsNumerator:24,fpsDenominator:1,frameCount:192,width:1280,height:720},
   entrypoints:{viewer:names[0],video:names[1],poster:names[2],evidence:names[4]},assets};
  const save=()=>writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(m));
  save();assert.equal(verifyPackage(dir).files,10);
  m.timebase.frameCount=191;save();assert.throws(()=>verifyPackage(dir),/FILM_REQUEST_MISMATCH/);
  m.timebase.frameCount=192;m.model.verifiedEngineering=true;save();
  assert.throws(()=>verifyPackage(dir),/MODEL_PROVENANCE_INVALID/);
  m.model.verifiedEngineering=false;save();
  writeFileSync(path.join(dir,'evidence/source-register.json'),'{}');
  assert.throws(()=>verifyPackage(dir),/ASSET_HASH_MISMATCH/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
