import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateScene,solveSceneAtTime} from './scene-core.mjs';
import {POSE_SCHEMA} from './rigid-pose-core.mjs';
const scene=JSON.parse(readFileSync(fileURLToPath(new URL('./scene.json',import.meta.url)),'utf8'));
const clone=o=>JSON.parse(JSON.stringify(o));
const near=(x,y,eps=1e-5)=>assert.ok(Math.abs(x-y)<eps,`${x}≠${y}`);
const TAU=2*Math.PI;
const world=(p,a)=>[p[0]+a[0]*Math.cos(p[2])-a[1]*Math.sin(p[2]),p[1]+a[0]*Math.sin(p[2])+a[1]*Math.cos(p[2])];
test('one declarative scene contains full rigid-body joints with no formula name',()=>{
 const s=validateScene(scene);assert.equal(s.schema,'avant.rigid-scene/1');
 assert.equal(s.bodies.length,5);assert.equal(s.joints.length,5);
 assert.ok(!JSON.stringify(s).includes('fivebar-solver'));
 assert.equal(s.dimensionsProvenance,'illustrative-not-measured');
});
test('two assembly branches close at arbitrary absolute times with no history',()=>{
 for(const branch of ['open','crossed'])for(let frame=0;frame<=144;frame++){
  const t=frame/24,s=solveSceneAtTime(scene,t,{branch});assert.equal(s.status,'closed');
  assert.ok(s.closureErrorMm<1e-7);assert.ok(s.branch===branch);
  const u=world(s.poses.linka,[96,0]),v=world(s.poses.linkb,[96,0]);
  near(u[0],v[0]);near(u[1],v[1]);near(s.tip.x,u[0]);near(s.tip.y,u[1]);
 }
});
test('branch selection yields geometrically different tool tips',()=>{
 for(const t of [0,.3,1.1,2.6,5.8]){
  const up=solveSceneAtTime(scene,t,{branch:'open'}),down=solveSceneAtTime(scene,t,{branch:'crossed'});
  assert.ok(Math.hypot(up.tip.x-down.tip.x,up.tip.y-down.tip.y)>30);
  assert.ok(up.orientation>0);assert.ok(down.orientation<0);
 }
});
test('frame seeking is entirely order independent',()=>{
 const a=solveSceneAtTime(scene,2.25);
 for(const t of [5.5,0,1.3,5.9])solveSceneAtTime(scene,t,{branch:'crossed'});
 assert.deepEqual(solveSceneAtTime(scene,2.25),a);
});
test('changing declarative lengths changes poses with same compiled renderer',()=>{
 const other=clone(scene);
 for(const b of other.bodies){
  if(b.geometry?.end?.[0]===96)b.geometry.end[0]=102;
 }
 const tip=other.joints.find(j=>j.id==='tool-tip');tip.anchorA[0]=102;tip.anchorB[0]=102;
 const a=solveSceneAtTime(scene,1.75),b=solveSceneAtTime(other,1.75);
 assert.equal(b.status,'closed');
 assert.ok(Math.hypot(a.tip.x-b.tip.x,a.tip.y-b.tip.y)>2);
});
test('forged script, unsafe reference and malformed joints rejected',()=>{
 const p=clone(scene);p.evaluate='process.env';assert.throws(()=>validateScene(p),/UNKNOWN_FIELD/);
 const q=clone(scene);q.references[0].url='file:///etc/passwd';assert.throws(()=>validateScene(q),/REFERENCE_UNSAFE/);
 const r=clone(scene);r.joints[4].b='stranger';assert.throws(()=>validateScene(r),/SCENE_JOINT_INVALID/);
 const z=clone(scene);z.branches.crossed.sign=1;assert.throws(()=>validateScene(z),/SCENE_BRANCH_INVALID/);
});
test('unknown mechanism does not require any hardcoded family metadata',()=>{
 const s=clone(scene);s.id='demonstrator-with-new-label';s.title='Different topology test';
 const result=solveSceneAtTime(s,2.1);assert.equal(result.status,'closed');
});
test('reference provenance does not masquerade as externally verified',()=>{
 assert.ok(scene.references.every(x=>x.contentChecked===false));
 const p=clone(scene);p.references[0].contentChecked=true;assert.throws(()=>validateScene(p),/REFERENCE_UNSAFE/);
});

test('rendered rigid bars cannot diverge from declared local joint anchors',()=>{
 const forged=clone(scene);forged.bodies.find(b=>b.id==='linka').geometry.end[0]+=6;
 assert.throws(()=>validateScene(forged),/GEOMETRY_ANCHOR_MISMATCH/);
});
