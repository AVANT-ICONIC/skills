import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GENEVA,evaluateGeneva,modelAtTime} from './model.mjs';
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,String(a)+' != '+String(b));
test('center distance and dwell geometry',()=>{
  near(GENEVA.centerDistanceMm,30*Math.SQRT2);
  near(GENEVA.dwellFraction,.75);
  near(GENEVA.centerDistanceMm*Math.sin(Math.PI/4),GENEVA.crankRadiusMm);
});
test('one input revolution indexes the output 90 degrees',()=>{
  near(evaluateGeneva(-.5).outputAngleRad,0);
  near(evaluateGeneva(.5).outputAngleRad,-Math.PI/2);
  near(evaluateGeneva(1.5).outputAngleRad,-Math.PI);
  near(evaluateGeneva(2.5).outputAngleRad,-3*Math.PI/2);
});
test('smooth zero-speed engagement endpoints',()=>{
  const eps=1e-8,half=1/8;
  for(const k of [-2,-1,0,1,2]){
    near(evaluateGeneva(k-half).outputAngleRad,-k*Math.PI/2);
    near(evaluateGeneva(k+half).outputAngleRad,-(k+1)*Math.PI/2);
    near(evaluateGeneva(k-half+eps).outputAngleRad,evaluateGeneva(k-half).outputAngleRad,1e-6);
    near(evaluateGeneva(k+half-eps).outputAngleRad,evaluateGeneva(k+half).outputAngleRad,1e-6);
    near(evaluateGeneva(k-half+eps).speedRatio,0,1e-6);
    near(evaluateGeneva(k+half-eps).speedRatio,0,1e-6);
  }
});
test('drive pin fits and aligns with radial slot throughout engagement',()=>{
  for(let k=-3;k<=3;k++)for(let i=1;i<90;i++){
    const turns=k-1/8+(i/90)*(1/4);
    const s=evaluateGeneva(turns);
    assert.equal(s.engaged,true);
    near(s.contactAlignmentErrorRad,0);
    assert.ok(s.pinToOutputCenterMm>=GENEVA.slotEndCenterMm+GENEVA.pinRadiusMm-1e-6);
    assert.ok(s.pinToOutputCenterMm<=GENEVA.outputRadiusMm+GENEVA.pinRadiusMm);
  }
});
test('dwell speed is zero and midpoint ratio is -2.41421356',()=>{
  near(evaluateGeneva(0).speedRatio,-(1+Math.SQRT2));
  for(const turns of [-.5,-.3,.2,.3,.7,1.2]){
    const s=evaluateGeneva(turns);
    assert.equal(s.dwell,true);near(s.speedRatio,0);
  }
});
test('absolute frame-time evaluation is independent of call order',()=>{
  const ref=modelAtTime(2.2);
  modelAtTime(3.8);modelAtTime(0);modelAtTime(7.7);
  assert.deepEqual(modelAtTime(2.2),ref);
});
test('bad inputs rejected instead of corrupting scene state',()=>{
  for(const v of [NaN,Infinity,-Infinity])assert.throws(()=>evaluateGeneva(v),/finite/);
  assert.throws(()=>modelAtTime(1,-1),/invalid/);
  assert.throws(()=>modelAtTime(1,0),/invalid/);
});
