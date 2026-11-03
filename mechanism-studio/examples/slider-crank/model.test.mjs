import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CONFIG} from './machine-config.mjs';
import {evaluateSliderCrank,stateAtTime} from './model.mjs';
const eq=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t,String(a)+' !== '+String(b));
test('dead centers and full stroke are exactly 2r',()=>{
 const s0=evaluateSliderCrank(0),sHalf=evaluateSliderCrank(.5),sOne=evaluateSliderCrank(1);
 eq(s0.pistonX,CONFIG.rodLengthMm+CONFIG.crankRadiusMm);
 eq(s0.strokeMm,0);
 eq(sHalf.pistonX,CONFIG.rodLengthMm-CONFIG.crankRadiusMm);
 eq(sHalf.strokeMm,CONFIG.crankRadiusMm*2);
 eq(sOne.strokeMm,0);
 eq(s0.velocityMmS,0);eq(sHalf.velocityMmS,0);
});
test('quarter turn agrees with independent trigonometric formula',()=>{
 const {rodLengthMm:l,crankRadiusMm:r}=CONFIG;
 const s=evaluateSliderCrank(.25);
 eq(s.pistonX,Math.sqrt(l*l-r*r));eq(s.crankX,0);
 eq(s.strokeMm,r+l-Math.sqrt(l*l-r*r));
});
test('rod maintains exact length over 1000 angles',()=>{
 for(let i=0;i<1000;i++){
  const s=evaluateSliderCrank(i/1000);
  eq(Math.hypot(s.pistonX-s.crankX,s.crankY),CONFIG.rodLengthMm,1e-8);
  assert.ok(s.strokeMm>=-1e-8&&s.strokeMm<=2*CONFIG.crankRadiusMm+1e-8);
 }
});
test('velocity analytic expression agrees with central difference',()=>{
 for(const turns of [.13,.37,.73,.87]){
  const eps=1e-6,dt=eps*60/CONFIG.inputRpm;
  const a=evaluateSliderCrank(turns+eps),b=evaluateSliderCrank(turns-eps),s=evaluateSliderCrank(turns);
  eq(s.velocityMmS,(a.pistonX-b.pistonX)/(2*dt),.001);
 }
});
test('absolute-time seek independent of prior frames',()=>{
 const a=stateAtTime(2.5);stateAtTime(.1);stateAtTime(20);assert.deepEqual(stateAtTime(2.5),a);
});
test('reject malformed config and nonfinite inputs',()=>{
 assert.throws(()=>evaluateSliderCrank(NaN),/INVALID/);
 assert.throws(()=>evaluateSliderCrank(0,{crankRadiusMm:35,rodLengthMm:15,inputRpm:15}),/INVALID/);
 assert.throws(()=>stateAtTime(Infinity),/INVALID/);
});
