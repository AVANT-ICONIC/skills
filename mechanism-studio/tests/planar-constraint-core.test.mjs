import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CONSTRAINT_SCHEMA,validateConstraintProblem,solvePlanarConstraints} from '../scripts/planar-constraint-core.mjs';
const close=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const F=(id,x,y)=>({id,fixed:[x,y]});
const V=(id,x,y)=>({id,seed:[x,y]});
const D=(id,a,b,lengthMm)=>({id,kind:'distance',a,b,lengthMm});
const A=(id,a,origin=[0,0],direction=[1,0])=>({id,kind:'axis',a,origin,direction});
const graph=(points,constraints)=>({schema:CONSTRAINT_SCHEMA,points,constraints});
function intersection(a,b,r1,r2){
 const d=Math.hypot(b[0]-a[0],b[1]-a[1]);
 const foot=(r1*r1-r2*r2+d*d)/(2*d),height=Math.sqrt(r1*r1-foot*foot);
 const ux=(b[0]-a[0])/d,uy=(b[1]-a[1])/d;
 return [[a[0]+ux*foot-uy*height,a[1]+uy*foot+ux*height],
 [a[0]+ux*foot+uy*height,a[1]+uy*foot-ux*height]];
}
function circleProblem(A1,B1,r1,r2,seed){return graph([F('start',...A1),F('end',...B1),V('joint',...seed)],
 [D('link-one','start','joint',r1),D('link-two','end','joint',r2)]);}
test('closed 4-bar loop both branches: 181 positions independently match analytic geometry',()=>{
 let count=0,max=0;
 for(let i=0;i<=180;i++){
  const angle=i/180*Math.PI*2;
  const a=[35*Math.cos(angle),35*Math.sin(angle)],b=[120,0];
  const answers=intersection(a,b,110,90);
  for(const expected of answers){
   const p=circleProblem(a,b,110,90,[expected[0]+1.5,expected[1]-.8]);
   const solution=solvePlanarConstraints(p);
   assert.equal(solution.status,'closed',`frame ${i}: ${JSON.stringify(solution)}`);
   close(solution.positions.joint[0],expected[0],1e-6);
   close(solution.positions.joint[1],expected[1],1e-6);
   max=Math.max(max,solution.maxResidualMm);count++;
  }
 }
 assert.equal(count,362);assert.ok(max<1e-8);
});
test('slider-crank from fixed crank pin, rigid rod and prismatic axis',()=>{
 for(let i=0;i<91;i++){
  const theta=i/90*Math.PI*2,crank=[32*Math.cos(theta),32*Math.sin(theta)];
  const pistonX=crank[0]+Math.sqrt(105**2-crank[1]**2);
  const p=graph([F('crank',...crank),V('piston',pistonX+6,3)],
   [D('connecting-rod','crank','piston',105),A('linear-guide','piston')]);
  const s=solvePlanarConstraints(p);
  assert.equal(s.status,'closed',JSON.stringify(s));
  close(s.positions.piston[0],pistonX);close(s.positions.piston[1],0);
 }
});
test('five-bar dual-actuator circle joint (new unseen topology) two branches',()=>{
 // This is not a slider-crank or four-bar configuration: two independently
 // driven arms share one floating output pivot via independent couplers.
 const left=[50*Math.cos(.75),50*Math.sin(.75)];
 const right=[140+45*Math.cos(2.3),45*Math.sin(2.3)];
 const branches=intersection(left,right,80,95);
 for(const expected of branches){
  const p=circleProblem(left,right,80,95,[expected[0]+2,expected[1]+1]);
  const a=solvePlanarConstraints(p);
  assert.equal(a.status,'closed');
  close(a.positions.joint[0],expected[0]);close(a.positions.joint[1],expected[1]);
 }
 assert.ok(Math.hypot(branches[0][0]-branches[1][0],branches[0][1]-branches[1][1])>20);
});
test('two distinct unknown joints solved from FOUR independent distance links',()=>{
 const a=[0,0],b=[100,0],c=[150,60],p=[43,56],q=[104,96];
 const dist=(x,y)=>Math.hypot(x[0]-y[0],x[1]-y[1]);
 const prob=graph([F('a',...a),F('b',...b),F('c',...c),V('p',p[0]+.5,p[1]-1),V('q',q[0]-1,q[1]+.5)],
  [D('ap','a','p',dist(a,p)),D('bp','b','p',dist(b,p)),
   D('pq','p','q',dist(p,q)),D('cq','c','q',dist(c,q))]);
 const s=solvePlanarConstraints(prob);
 assert.equal(s.status,'closed',JSON.stringify(s));
 close(s.positions.p[0],p[0]);close(s.positions.p[1],p[1]);
 close(s.positions.q[0],q[0]);close(s.positions.q[1],q[1]);
 assert.equal(s.unknowns,4);assert.equal(s.jacobianRank,4);
});
test('singular tangent two circle configuration is reported, not silently called closed',()=>{
 const s=solvePlanarConstraints(circleProblem([0,0],[2,0],1,1,[1,0]));
 assert.equal(s.status,'singular');assert.equal(s.reason,'RANK_DEFICIENT_JACOBIAN');
 assert.equal(s.jacobianRank,1);
});
test('provably impossible two-circle geometries fail fast without claiming a root',()=>{
 for(const p of [circleProblem([0,0],[10,0],2,3,[3,3]),
                  circleProblem([0,0],[0,0],2,3,[1,1])]){
  const s=solvePlanarConstraints(p);
  assert.equal(s.status,'unreachable');assert.equal(s.positions,null);
  assert.equal(s.iterations,0);
 }
 const ambiguous=solvePlanarConstraints(circleProblem([0,0],[0,0],2,2,[2,0]));
 assert.equal(ambiguous.status,'ambiguous');
});
test('insufficient equations explicitly underdetermined',()=>{
 const p=graph([F('start',0,0),V('joint',30,10)],[D('len','start','joint',32)]);
 assert.equal(solvePlanarConstraints(p).status,'underdetermined');
});
test('explicit branch seeds remain reproducible in nonsequential solve order',()=>{
 const a=[25,40],b=[120,0],branches=intersection(a,b,110,90);
 const p0=circleProblem(a,b,110,90,branches[0]);
 const p1=circleProblem(a,b,110,90,branches[1]);
 const before=solvePlanarConstraints(p0);
 solvePlanarConstraints(p1);solvePlanarConstraints(p0);solvePlanarConstraints(p1);
 assert.deepEqual(solvePlanarConstraints(p0),before);
});
test('unsafe data and unsupported constraint behavior fail closed',()=>{
 const p=circleProblem([0,0],[100,0],75,80,[30,50]);
 assert.throws(()=>validateConstraintProblem({...p,constraints:[{...p.constraints[0],kind:'javascript'}]}),/CONSTRAINT_KIND_UNSUPPORTED/);
 assert.throws(()=>validateConstraintProblem({...p,points:[p.points[0],p.points[0],p.points[2]]}),/CONSTRAINT_POINT_INVALID/);
 assert.throws(()=>validateConstraintProblem({...p,points:[p.points[0],{...p.points[1],fixed:[Infinity,1]},p.points[2]]}),/CONSTRAINT_COORDINATE_INVALID/);
 assert.throws(()=>solvePlanarConstraints(p,{maxIterations:0}),/CONSTRAINT_OPTIONS_INVALID/);
 assert.throws(()=>solvePlanarConstraints(p,{toleranceMm:Infinity}),/CONSTRAINT_OPTIONS_INVALID/);
});
