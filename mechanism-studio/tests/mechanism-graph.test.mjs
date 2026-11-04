import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import {makeMechanismGraph,makeSliderGraph,makeGenevaGraph,
  validateMechanismGraph,solvePlanarGraph,makeGraphModule,graphDigestInput} from '../scripts/mechanism-graph.mjs';
import {evaluateSliderCrank} from '../examples/slider-crank/model.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const slider=JSON.parse(readFileSync(join(here,'../requests/slider-crank-study.json'),'utf8'));
const geneva=JSON.parse(readFileSync(join(here,'../requests/geneva-four-slot-study.json'),'utf8'));
const close=(a,b,tol=1e-8)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,String(a)+' != '+String(b));

test('two source-backed briefs produce finite declarative graph topology',()=>{
 for(const req of [slider,geneva]){
  const g=makeMechanismGraph(req);
  const report=validateMechanismGraph(g);
  assert.equal(report.mechanism,req.mechanism);
  assert.equal(g.schema,'avant.mechanism-graph/1');
  assert.equal(g.certifiedPhysics,false);
  assert.equal(g.unit,'mm');
  assert.deepEqual(g.provenance.sourceIds,req.references.map(x=>x.id));
  assert.equal(g.provenance.externalDocumentsVerified,false);
  assert.ok(g.bodies.length>=3);
  assert.ok(g.joints.length>=3);
  assert.match(makeGraphModule(g),/export const GRAPH/);
  assert.deepEqual(JSON.parse(graphDigestInput(g)),g);
 }
});
test('graph constraints actually drive slider poses and all rigid link closures',()=>{
 const g=makeMechanismGraph(slider),r=g.parameters.crankRadiusMm,l=g.parameters.rodLengthMm;
 for(let i=0;i<=1440;i++){
  const turns=i/1440;
  const p=solvePlanarGraph(g,turns);
  const s=p.state;
  close(s.pistonX,r*Math.cos(turns*2*Math.PI)+Math.sqrt(l*l-r*r*Math.sin(turns*2*Math.PI)**2));
  close(Math.hypot(s.pistonX-s.crankX,s.crankY),l);
  close(p.poses.rod.x,s.crankX);
  close(p.poses.piston.y,0);
  close(p.poses.piston.x,s.pistonX);
  for(const value of Object.values(p.residuals))close(value,0);
  const runtime=evaluateSliderCrank(turns);
  close(s.pistonX,runtime.pistonX);
  close(s.rodAngleRad,runtime.rodAngleRad);
 }
});
test('changing only graph joint lengths changes pose, not merely manifest text',()=>{
 const a=makeSliderGraph({crankRadiusMm:24,rodLengthMm:80,inputRpm:18});
 const b=makeSliderGraph({crankRadiusMm:32,rodLengthMm:105,inputRpm:15});
 const s1=solvePlanarGraph(a,.5);
 const s2=solvePlanarGraph(b,.5);
 close(s1.state.strokeMm,48);
 close(s2.state.strokeMm,64);
 assert.notEqual(s1.state.pistonX,s2.state.pistonX);
 assert.equal(s1.solver,'inline-slider-crank-positive-root/1');
});
test('absolute time and backwards seeks cannot change graph outputs',()=>{
 const g=makeMechanismGraph(slider);
 const baseline=solvePlanarGraph(g,.35);
 solvePlanarGraph(g,1.4);solvePlanarGraph(g,0);solvePlanarGraph(g,-2.3);
 assert.deepEqual(solvePlanarGraph(g,.35),baseline);
});
test('malformed and disconnected topology fails before numerical solve',()=>{
 const g=makeMechanismGraph(slider);
 const edit=fn=>{const x=structuredClone(g);fn(x);return x;};
 assert.throws(()=>validateMechanismGraph(edit(x=>x.joints[2].b='ghost')),/GRAPH_DANGLING_JOINT/);
 assert.throws(()=>validateMechanismGraph(edit(x=>x.joints[1].anchorA[0]=-5)),/GRAPH_SLIDER_CONSTRAINT_INVALID/);
 assert.throws(()=>validateMechanismGraph(edit(x=>x.joints[3].axis=[1,1])),/GRAPH_BAD_PRISMATIC_AXIS/);
 assert.throws(()=>validateMechanismGraph(edit(x=>x.joints.push(x.joints[0]))),/GRAPH_DUPLICATE_JOINT/);
 assert.throws(()=>validateMechanismGraph(edit(x=>x.constraints[0].lengthMm+=3)),/GRAPH_SLIDER_NUMERIC_CONFLICT/);
 assert.throws(()=>validateMechanismGraph(edit(x=>x.certifiedPhysics=true)),/GRAPH_SCHEMA_INVALID/);
 assert.throws(()=>solvePlanarGraph(g,NaN),/GRAPH_TIME_INVALID/);
 assert.throws(()=>solvePlanarGraph(g,0,{rpm:0}),/GRAPH_RPM_INVALID/);
});
test('Geneva graph honestly declares deferred solver and idealized physical lock',()=>{
 const g=makeMechanismGraph(geneva);
 assert.equal(g.mechanism,'geneva-4');
 assert.equal(g.solver,'geneva-four-slot-ideal-deferred/1');
 assert.equal(g.constraints.find(x=>x.id==='ideal-dwell').lockingCamModeled,false);
 assert.throws(()=>solvePlanarGraph(g,.4),/GRAPH_SOLVER_NOT_IMPLEMENTED/);
 const edit=structuredClone(g);edit.constraints.find(x=>x.id==='ideal-dwell').lockingCamModeled=true;
 assert.throws(()=>validateMechanismGraph(edit),/GRAPH_GENEVA_CONSTRAINT_INVALID/);
});
