import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runIndependentConstraintProof} from './planar-constraint-adapters.mjs';
const pi=Math.PI;
const sliderGraph={mechanism:'slider-crank',joints:[
 {id:'big-end',anchorA:[32,0]},{id:'wrist-pin',anchorA:[105,0]}]};
const fourGraph={mechanism:'four-bar',joints:[
 {id:'rocker-bearing',anchorA:[120,0]},
 {id:'coupler-input',anchorA:[35,0]},
 {id:'coupler-rocker',anchorA:[110,0],anchorB:[90,0]}]};
const sliderExact=turns=>{const t=turns*2*pi;return {pistonX:32*Math.cos(t)+Math.sqrt(105**2-(32*Math.sin(t))**2)}};
const fourExact=(turns,branch)=>{
 const t=turns*2*pi,start=[35*Math.cos(t),35*Math.sin(t)],end=[120,0];
 const dx=end[0]-start[0],dy=end[1]-start[1],e=Math.hypot(dx,dy);
 const x=(110**2-90**2+e**2)/(2*e),h=Math.sqrt(110**2-x**2);
 const ux=dx/e,uy=dy/e,sign=branch==='open'?1:-1;
 return {outputPin:{x:start[0]+x*ux-sign*h*uy,y:start[1]+x*uy+sign*h*ux}};
};
test('generic constraint core independently checks exact slider poses across 73 phases',()=>{
 const p=runIndependentConstraintProof(sliderGraph,sliderExact);
 assert.equal(p.status,'PASS');assert.equal(p.samples,73);
 assert.ok(p.maxPoseErrorMm<1e-6);
});
test('generic constraint core independently checks both four-bar branches across 146 poses',()=>{
 const p=runIndependentConstraintProof(fourGraph,fourExact);
 assert.equal(p.status,'PASS');assert.equal(p.samples,146);
 assert.deepEqual(p.branches,['open','crossed']);
 assert.ok(p.maxPoseErrorMm<1e-6);
});
test('a tampered production pose is rejected by independent generic equations',()=>{
 assert.throws(()=>runIndependentConstraintProof(fourGraph,(t,b)=>{
  const s=fourExact(t,b);s.outputPin.x+=.01;return s;
 }),/INDEPENDENT_CONSTRAINT_POSE_MISMATCH/);
});
