import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileRequest,validateRequest} from '../scripts/compile-request.mjs';

const BASE=resolve(fileURLToPath(new URL('../requests/',import.meta.url)));
const slider=JSON.parse(readFileSync(join(BASE,'slider-crank-study.json'),'utf8'));
const geneva=JSON.parse(readFileSync(join(BASE,'geneva-four-slot-study.json'),'utf8'));
const clone=o=>JSON.parse(JSON.stringify(o));
test('both reviewed recipe briefs parse and preserve source provenance',()=>{
 for(const data of [slider,geneva]){
  const valid=validateRequest(data);
  assert.equal(valid.classification,'reference-grounded');
  assert.ok(valid.references.length>0);
  assert.ok([1280,1920].includes(valid.video.width));assert.equal(valid.video.height,valid.video.width*9/16);
 }
 assert.equal(validateRequest(slider).parameters.crankRadiusMm.value,32);
 assert.deepEqual(validateRequest(geneva).parameters,{});
});
test('missing, duplicate and unrelated sources fail closed',()=>{
 const a=clone(slider);a.references=[];assert.throws(()=>validateRequest(a),/REFERENCE_REQUIRED/);
 const b=clone(slider);b.references.push(b.references[0]);assert.throws(()=>validateRequest(b),/DUPLICATE_SOURCE_ID/);
 const c=clone(slider);c.references[0].url='file:///etc/passwd';assert.throws(()=>validateRequest(c),/SOURCE_URL_UNSAFE/);
 const d=clone(slider);d.references[0].url='https://localhost/private';assert.throws(()=>validateRequest(d),/SOURCE_URL_UNSAFE/);
});
test('unsafe physical assumptions cannot bypass the request contract',()=>{
 const a=clone(slider);a.parameters.rodLengthMm.value=40;assert.throws(()=>validateRequest(a),/ROD_RATIO_UNSAFE/);
 const b=clone(slider);b.parameters.crankRadiusMm.value=NaN;assert.throws(()=>validateRequest(b),/PARAM_RANGE/);
 const c=clone(slider);c.parameters.crankRadiusMm.provenance='measured';assert.throws(()=>validateRequest(c),/PARAM_EVIDENCE/);
 const d=clone(slider);d.parameters.rodLengthMm.unit='cm';assert.throws(()=>validateRequest(d),/PARAM_UNIT/);
 const e=clone(slider);e.parameters.inputRpm.note='';assert.throws(()=>validateRequest(e),/PARAM_NOTE/);
});
test('unsupported machines and arbitrary code parameters never reach templates',()=>{
 const a=clone(slider);a.mechanism='combustion-rocket';assert.throws(()=>validateRequest(a),/MECHANISM_UNSUPPORTED/);
 const b=clone(geneva);b.parameters={eval:'process.env'};assert.throws(()=>validateRequest(b),/PARAMETER_SET_UNSUPPORTED/);
 const c=clone(slider);c.scripts=['rm','-rf','/'];assert.throws(()=>validateRequest(c),/REQUEST_UNKNOWN_FIELD/);
});
test('film dimensions and timebase must use supported profile',()=>{
 const a=clone(slider);a.video.fps=7;assert.throws(()=>validateRequest(a),/VIDEO_PROFILE_UNSUPPORTED/);
 const b=clone(slider);b.video.width=1536;assert.throws(()=>validateRequest(b),/VIDEO_PROFILE_UNSUPPORTED/);
 const c=clone(slider);c.video.durationSeconds=50;assert.throws(()=>validateRequest(c),/VIDEO_PROFILE_UNSUPPORTED/);
});
test('compiler generates two isolated reproducible folders with real config',()=>{
 const d=mkdtempSync(join(tmpdir(),'mechanism-compiler-'));
 try{
  for(const data of [slider,geneva]){
   const out=join(d,data.id);
   const receipt=compileRequest({request:data,out});
   assert.equal(receipt.releaseReady,false);
   assert.equal(receipt.files,8);
   for(const name of ['main.js','stage.js','model.mjs','style.css','machine-config.mjs','request.json','source-register.json','README.md']){
    assert.ok(existsSync(join(out,name)),name);
   }
   const config=readFileSync(join(out,'machine-config.mjs'),'utf8');
   assert.ok(config.includes('"durationSeconds": 8'));
   assert.ok(config.includes('"fps": '+data.video.fps));
   const sources=JSON.parse(readFileSync(join(out,'source-register.json'),'utf8'));
   assert.equal(sources.sourcesFetched,false);
   assert.equal(sources.physicalCertification,false);
   assert.throws(()=>compileRequest({request:data,out}),/OUTPUT_EXISTS/);
  }
 }finally{rmSync(d,{recursive:true,force:true});}
});
