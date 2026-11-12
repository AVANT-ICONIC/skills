import {test} from 'node:test';
import assert from 'node:assert/strict';
import {POSE_SCHEMA,solveRigidPoseConstraints,enumerateRigidPoseBranches} from '../scripts/rigid-pose-core.mjs';
import {poseSystemFromGraph,enumerateFourBarRigidBranches} from '../scripts/rigid-pose-adapters.mjs';
const PI=Math.PI,near=(a,b,t=1e-5)=>assert.ok(Math.abs(a-b)<t,`${a} ≠ ${b}`);
const rev=(id,a,b,anchorA,anchorB)=>({id,type:'revolute',a,b,anchorA,anchorB});
const F=(id,...fixedPose)=>({id,fixedPose}),V=(id,...seedPose)=>({id,seedPose});
const schema=(bodies,joints)=>({schema:POSE_SCHEMA,bodies,joints});
const fourGraph={mechanism:'four-bar',bodies:[{id:'ground'},{id:'input'},{id:'coupler'},{id:'rocker'}],joints:[
 rev('input-bearing','ground','input',[0,0],[0,0]),rev('coupler-input','input','coupler',[35,0],[0,0]),
 rev('coupler-rocker','coupler','rocker',[110,0],[90,0]),rev('rocker-bearing','ground','rocker',[120,0],[0,0])]};
const sliderGraph={mechanism:'slider-crank',bodies:[{id:'ground'},{id:'crank'},{id:'rod'},{id:'piston'}],joints:[
 rev('main-bearing','ground','crank',[0,0],[0,0]),rev('big-end','crank','rod',[32,0],[0,0]),
 rev('wrist-pin','rod','piston',[105,0],[0,0]),{id:'piston-guide',type:'prismatic',a:'ground',b:'piston',axis:[1,0]}]};
function analytic4(t,sign){const th=t*2*PI,p=[35*Math.cos(th),35*Math.sin(th)],q=[120,0],dx=q[0]-p[0],dy=q[1]-p[1],d=Math.hypot(dx,dy),x=(110*110-90*90+d*d)/(2*d),h=Math.sqrt(110*110-x*x);return[p[0]+x*dx/d-sign*h*dy/d,p[1]+x*dy/d+sign*h*dx/d];}
function world(p,a){return[p[0]+a[0]*Math.cos(p[2])-a[1]*Math.sin(p[2]),p[1]+a[0]*Math.sin(p[2])+a[1]*Math.cos(p[2])];}

test('four-bar two branches from generic rigid joints at many angles',()=>{
 for(let i=0;i<=120;i++)for(const [branch,sign] of [['open',1],['crossed',-1]]){
  const t=i/120,problem=poseSystemFromGraph(fourGraph,t,{branch});
  const sol=solveRigidPoseConstraints(problem);
  assert.equal(sol.status,'closed',`${branch} ${i}: ${sol.status}`);
  const p=world(sol.poses.coupler,[110,0]),exact=analytic4(t,sign);
  near(p[0],exact[0]);near(p[1],exact[1]);assert.ok(sol.maxResidualMm<1e-7);
 }
});
test('slider rigid graph reproduces piston motion and leaves prismatic orientation fixed',()=>{
 for(let i=0;i<=120;i++){
  const t=i/120,sol=solveRigidPoseConstraints(poseSystemFromGraph(sliderGraph,t));
  assert.equal(sol.status,'closed',`${i}: ${sol.status}`);
  const a=2*PI*t,expected=32*Math.cos(a)+Math.sqrt(105**2-(32*Math.sin(a))**2);
  near(sol.poses.piston[0],expected);near(sol.poses.piston[1],0);
  near(sol.poses.piston[2],0);
 }
});
test('explicit different seeds enumerate two rigid-body branches, not a secret continuous state',()=>{
 const e=enumerateFourBarRigidBranches(fourGraph,.22);
 assert.equal(e.solutions.length,2,JSON.stringify(e.failures));
 assert.equal(e.globalCompletenessProved,false);
});
test('backward seek deterministic and independent of previous solve',()=>{
 const p=poseSystemFromGraph(fourGraph,.31,{branch:'crossed'}),a=solveRigidPoseConstraints(p);
 solveRigidPoseConstraints(poseSystemFromGraph(fourGraph,.71));
 assert.deepEqual(solveRigidPoseConstraints(p),a);
});
test('underdetermined free body refuses to assert a unique pose',()=>{
 const g=schema([F('ground',0,0,0),V('free',1,2,0)],[rev('j','ground','free',[0,0],[0,0])]);
 assert.equal(solveRigidPoseConstraints(g).status,'underdetermined');
});
test('unsupported and forged rigid joints fail validation before numerical solve',()=>{
 const p=poseSystemFromGraph(fourGraph,.2);
 const copy=()=>structuredClone(p);
 assert.throws(()=>{const x=copy();x.joints[0].type='magic';solveRigidPoseConstraints(x)},/POSE_JOINT_KIND_UNSUPPORTED/);
 assert.throws(()=>{const x=copy();x.joints[0].b='ghost';solveRigidPoseConstraints(x)},/POSE_JOINT_INVALID/);
 assert.throws(()=>{const x=copy();x.bodies[2].seedPose[1]=Infinity;solveRigidPoseConstraints(x)},/POSE_BODY_INVALID/);
});
test('near-tangent roots never produce NaN or claim guaranteed branch enumeration',()=>{
 const g=schema([F('a',0,0,0),F('b',2,0,0),V('rod',1,0,0)],[
  rev('left','a','rod',[0,0],[0,0]),rev('right','b','rod',[0,0],[0,0])]);
 const r=solveRigidPoseConstraints(g);
 assert.ok(['underdetermined','singular','unresolved'].includes(r.status));
 assert.equal(r.certifiedPhysics,false);
});
test('generic SE2 audit agrees with independent four-bar and slider analytic outputs',async()=>{
 const {proofRigidGraph}=await import('../scripts/rigid-pose-adapters.mjs');
 const four=proofRigidGraph(fourGraph,(turns,branch)=>{const [x,y]=analytic4(turns,branch==='open'?1:-1);return {outputPin:{x,y}}},{samples:48});
 assert.equal(four.status,'PASS');assert.equal(four.samples,98);
 assert.ok(four.maxPoseErrorMm<1e-5);
 const slider=proofRigidGraph(sliderGraph,t=>{const a=2*PI*t;return {pistonX:32*Math.cos(a)+Math.sqrt(105**2-(32*Math.sin(a))**2)}},{samples:48});
 assert.equal(slider.status,'PASS');assert.equal(slider.samples,49);
});
test('branch seeds select both mathematical assemblies over entire crank rotation',()=>{
 for(let i=0;i<=40;i++){
  const e=enumerateFourBarRigidBranches(fourGraph,i/40);
  assert.equal(e.solutions.length,2,`at ${i}: ${JSON.stringify(e.failures)}`);
 }
});
test('SE2 constraints handle an unseen 2-body pinned rotor without named mechanism',()=>{
 const g=schema([F('base',0,0,0),F('actuator',0,0,.37),V('lever',.5,.3,.1)],
  [rev('drive','base','actuator',[0,0],[0,0]),rev('pinned','actuator','lever',[50,0],[0,0]),
   {id:'guide',type:'prismatic',a:'base',b:'lever',anchorA:[0,0],anchorB:[0,0],axisA:[1,0],angleScaleMm:50}]);
 const r=solveRigidPoseConstraints(g);
 assert.equal(r.status,'unresolved'); // driven 50 mm crank cannot be on y=0 unless theta=0
});

test('SE2 joint closure is invariant under rotated and translated world coordinates',()=>{
 const base=poseSystemFromGraph(fourGraph,.19,{branch:'open'});
 const solved=solveRigidPoseConstraints(base);assert.equal(solved.status,'closed');
 const angle=.47,c=Math.cos(angle),sn=Math.sin(angle),dx=74,dy=-33;
 const transform=p=>[dx+c*p[0]-sn*p[1],dy+sn*p[0]+c*p[1],p[2]+angle];
 const shifted=structuredClone(base);
 for(const body of shifted.bodies){
  if(body.fixedPose)body.fixedPose=transform(body.fixedPose);
  if(body.seedPose)body.seedPose=transform(body.seedPose);
 }
 const other=solveRigidPoseConstraints(shifted);assert.equal(other.status,'closed');
 for(const id of Object.keys(solved.poses)){
  const expected=transform(solved.poses[id]),actual=other.poses[id];
  near(expected[0],actual[0]);near(expected[1],actual[1]);
  near(Math.sin(expected[2]-actual[2]),0);
 }
});
test('exact four-bar toggle is singular, with rank-deficient joint Jacobian',()=>{
 const tangent={mechanism:'four-bar',bodies:fourGraph.bodies,joints:[
  rev('input-bearing','ground','input',[0,0],[0,0]),
  rev('coupler-input','input','coupler',[50,0],[0,0]),
  rev('coupler-rocker','coupler','rocker',[80,0],[70,0]),
  rev('rocker-bearing','ground','rocker',[100,0],[0,0])]};
 const problem=poseSystemFromGraph(tangent,.5,{branch:'open'});
 const x=solveRigidPoseConstraints(problem,{seeds:{coupler:[-50,0,0],rocker:[100,0,PI]}});
 assert.equal(x.status,'singular');assert.equal(x.jacobianRank,5);
 near(x.maxResidualMm,0,1e-10);
});
