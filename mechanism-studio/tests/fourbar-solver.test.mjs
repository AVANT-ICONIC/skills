import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classifyFourBar,solveFourBarGeometry} from '../scripts/fourbar-solver.mjs';
const good={groundLengthMm:120,inputLengthMm:35,couplerLengthMm:110,outputLengthMm:90,inputRpm:12};
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t,String(a)+' != '+String(b));

test('strict Grashof crank-rocker travels every phase in both branches with rigid closure',()=>{
 const c=classifyFourBar(good);
 assert.equal(c.grashof,'strict');assert.equal(c.fullDriverRotationPossible,true);
 assert.equal(c.noToggleThroughoutFullTurn,true);
 for(let i=0;i<1440;i++){
  const a=solveFourBarGeometry(good,i/1440,{branch:'open'});
  const b=solveFourBarGeometry(good,i/1440,{branch:'crossed'});
  assert.equal(a.status,'closed');assert.equal(b.status,'closed');
  for(const v of Object.values(a.residuals))near(v,0);
  for(const v of Object.values(b.residuals))near(v,0);
  near(a.intersectionHeightMm,b.intersectionHeightMm);
  assert.notDeepEqual(a.outputPin,b.outputPin);
  assert.ok(Number.isFinite(a.angularSpeedRatio));
 }
});
test('open and crossed select opposite signed circle intersections without history',()=>{
 const a=solveFourBarGeometry(good,.1234,{branch:'open'});
 const b=solveFourBarGeometry(good,.1234,{branch:'crossed'});
 const vx=a.anchorOutput.x-a.inputPin.x,vy=a.anchorOutput.y-a.inputPin.y;
 const signed=q=>vx*(q.outputPin.y-q.inputPin.y)-vy*(q.outputPin.x-q.inputPin.x);
 assert.ok(signed(a)>0);assert.ok(signed(b)<0);
 solveFourBarGeometry(good,.9);solveFourBarGeometry(good,-.7);
 assert.deepEqual(solveFourBarGeometry(good,.1234,{branch:'open'}),a);
});
test('unreachable positions are explicit, not NaN or fake closure',()=>{
 const bad={groundLengthMm:100,inputLengthMm:55,couplerLengthMm:30,outputLengthMm:20,inputRpm:12};
 const s=solveFourBarGeometry(bad,.5);
 assert.equal(s.status,'unreachable');assert.equal(s.poses,null);
 assert.equal(s.reason,'LINKAGE_CANNOT_CLOSE');
});
test('tangent circle intersections are singular and two branches converge',()=>{
 const c={groundLengthMm:100,inputLengthMm:50,couplerLengthMm:80,outputLengthMm:70,inputRpm:12};
 const a=solveFourBarGeometry(c,.5,{branch:'open'});
 const b=solveFourBarGeometry(c,.5,{branch:'crossed'});
 assert.equal(a.status,'singular');assert.equal(a.angularSpeedRatio,null);
 near(a.intersectionHeightMm,0,1e-7);
 near(a.outputPin.x,b.outputPin.x,1e-7);near(a.outputPin.y,b.outputPin.y,1e-7);
});
test('coincident circle centers are explicitly ambiguous',()=>{
 const c={groundLengthMm:50,inputLengthMm:50,couplerLengthMm:80,outputLengthMm:80,inputRpm:12};
 const s=solveFourBarGeometry(c,0);
 assert.equal(s.status,'ambiguous');assert.equal(s.poses,null);
});
test('reject malformed angles, branch names and lengths',()=>{
 assert.throws(()=>solveFourBarGeometry(good,NaN),/INPUT_INVALID/);
 assert.throws(()=>solveFourBarGeometry(good,0,{branch:'banana'}),/BRANCH_UNSUPPORTED/);
 assert.throws(()=>solveFourBarGeometry({...good,outputLengthMm:-1},0),/INPUT_INVALID/);
});

test('coincident circle centers with unequal radii are unreachable, not ambiguous',()=>{
 const c={groundLengthMm:50,inputLengthMm:50,couplerLengthMm:80,outputLengthMm:70,inputRpm:12};
 const s=solveFourBarGeometry(c,0);
 assert.equal(s.status,'unreachable');
 assert.equal(s.reason,'COINCIDENT_CIRCLES_DIFFERENT_RADII');
 assert.equal(s.poses,null);
});
test('analytic rocker angular-speed ratio matches a central finite difference in both branches',()=>{
 for(const branch of ['open','crossed'])for(const turns of [.1,.25,.4,.65,.8]){
  const h=1e-6;
  const mid=solveFourBarGeometry(good,turns,{branch});
  const hi=solveFourBarGeometry(good,turns+h,{branch});
  const lo=solveFourBarGeometry(good,turns-h,{branch});
  const delta=Math.atan2(Math.sin(hi.outputAngleRad-lo.outputAngleRad),
   Math.cos(hi.outputAngleRad-lo.outputAngleRad));
  near(mid.angularSpeedRatio,delta/(4*Math.PI*h),1e-6);
 }
});
