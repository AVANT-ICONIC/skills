import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {validateScene,solveSceneAtTime} from './scene-core.mjs';
import {compileScene} from './compile-scene.mjs';
const slider=JSON.parse(readFileSync(fileURLToPath(new URL('./slider-rail.json',import.meta.url)),'utf8'));
const fivebar=JSON.parse(readFileSync(fileURLToPath(new URL('./scene.json',import.meta.url)),'utf8'));
const clone=x=>structuredClone(x);
const world=(pose,p)=>[pose[0]+p[0]*Math.cos(pose[2])-p[1]*Math.sin(pose[2]),pose[1]+p[0]*Math.sin(pose[2])+p[1]*Math.cos(pose[2])];
const close=(a,b,epsilon=1e-6)=>assert.ok(Math.abs(a-b)<epsilon,`${a} != ${b}`);

test('same scene schema validates two genuinely different joint topologies',()=>{
 const a=validateScene(fivebar),b=validateScene(slider);
 assert.equal(a.joints.length,5);assert.ok(a.joints.every(x=>x.type==='revolute'));
 assert.equal(b.joints.length,4);assert.equal(b.joints.filter(x=>x.type==='revolute').length,3);
 assert.equal(b.joints.filter(x=>x.type==='prismatic').length,1);
 assert.equal(a.bodies.filter(x=>x.role==='driver').length,2);
 assert.equal(b.bodies.filter(x=>x.role==='driver').length,1);
 assert.equal(b.dimensionsProvenance,'illustrative-not-measured');
 assert.ok(b.references.every(x=>x.contentChecked===false));
});
test('prismatic slider matches independently evaluated closed-form motion on both branches for full turn',()=>{
 const r=28,l=96;
 for(const branch of ['open','crossed'])for(let frame=0;frame<=144;frame++){
  const t=frame/24,theta=t*10*2*Math.PI/60,sgn=branch==='open'?1:-1;
  const s=solveSceneAtTime(slider,t,{branch});
  assert.equal(s.status,'closed',`${branch} frame ${frame}`);
  const expected=r*Math.cos(theta)+sgn*Math.sqrt(l*l-r*r*Math.sin(theta)**2);
  close(s.tip.x,expected);
  close(s.tip.y,0);
  close(s.poses.carriage[1],0);
  close(Math.sin(s.poses.carriage[2]),0);
  assert.ok(s.closureErrorMm<1e-7);
  const tipA=world(s.poses.rod,[96,0]),tipB=world(s.poses.carriage,[0,0]);
  close(tipA[0],tipB[0]);close(tipA[1],tipB[1]);
  assert.ok(sgn*s.orientation>0);
 }
});
test('branch control changes actual solved piston displacement without previous-frame history',()=>{
 const extended=solveSceneAtTime(slider,2.3,{branch:'open'}),reversed=solveSceneAtTime(slider,2.3,{branch:'crossed'});
 assert.ok(extended.tip.x-reversed.tip.x>160);
 solveSceneAtTime(slider,5.5,{branch:'crossed'});
 assert.deepEqual(solveSceneAtTime(slider,2.3,{branch:'open'}),extended);
});
test('safe compiler emits byte-identical generic renderer for both topologies',async()=>{
 const root=mkdtempSync(join(tmpdir(),'rigid-two-topology-'));
 try{
  const first=join(root,'first'),second=join(root,'second');
  compileScene({scene:fivebar,out:first});compileScene({scene:slider,out:second});
  for(const name of ['stage.js','main.js','model.mjs','scene-core.mjs','rigid-pose-core.mjs','style.css']){
   assert.deepEqual(readFileSync(join(first,name)),readFileSync(join(second,name)),name);
  }
  const a=await import(pathToFileURL(join(first,'model.mjs')).href);
  const b=await import(pathToFileURL(join(second,'model.mjs')).href);
  assert.equal(a.evaluateAtTime(1.2).status,'closed');
  assert.equal(b.evaluateAtTime(1.2).status,'closed');
  assert.notEqual(a.SCENE.joints.length,b.SCENE.joints.length);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('forged/prismatic-invalid guide axes, driver/fixed attachments and non-anchor geometry rejected',()=>{
 const a=clone(slider);a.joints.find(x=>x.type==='prismatic').axisA=[0.7,0.7];
 assert.throws(()=>validateScene(a),/SCENE_PRISMATIC_INVALID/);
 const b=clone(slider);b.joints.find(x=>x.type==='prismatic').a='rod';
 assert.throws(()=>validateScene(b),/SCENE_PRISMATIC_INVALID/);
 const c=clone(slider);c.joints.find(x=>x.type==='prismatic').angleScaleMm=-1;
 assert.throws(()=>validateScene(c),/SCENE_PRISMATIC_INVALID/);
 const d=clone(slider);d.bodies.find(x=>x.id==='carriage').geometry.end=[14,22];
 assert.throws(()=>validateScene(d),/SCENE_GEOMETRY_ANCHOR_MISMATCH/);
 const e=clone(slider);e.branches.open.metric='eval';
 assert.throws(()=>validateScene(e),/SCENE_BRANCH_METRIC_INVALID/);
 const f=clone(slider);f.branches.crossed.axis=[1,1];
 assert.throws(()=>validateScene(f),/SCENE_BRANCH_AXIS_INVALID/);
 const g=clone(slider);g.branchLabels.open='<script>';
 assert.throws(()=>validateScene(g),/SCENE_BRANCH_LABELS_INVALID/);
});

test('bounded declarative presentation rejects absurd plate and camera values',()=>{
 const bad=clone(slider);bad.world.boardHeightMm=500;
 assert.throws(()=>validateScene(bad),/SCENE_WORLD_INVALID/);
 const strange=clone(slider);strange.world.cameraDistanceFactor=0.02;
 assert.throws(()=>validateScene(strange),/SCENE_WORLD_INVALID/);
 assert.doesNotThrow(()=>validateScene(fivebar));
});
