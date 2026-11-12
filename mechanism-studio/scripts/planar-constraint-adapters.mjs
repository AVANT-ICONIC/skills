/** Reviewed graph -> generic point/distance/guide constraints for the audit.
 * These adapters do not drive production rendering or replace exact solvers.
 * Branch selection is an explicit seed; no previous-frame state is used.
 */
import {CONSTRAINT_SCHEMA,solvePlanarConstraints} from './planar-constraint-core.mjs';
const F=(id,x,y)=>({id,fixed:[x,y]});
const V=(id,x,y)=>({id,seed:[x,y]});
const D=(id,a,b,lengthMm)=>({id,kind:'distance',a,b,lengthMm});

export function sliderConstraintProblem(graph, turns) {
  if(graph.mechanism!=='slider-crank'||!Number.isFinite(turns))throw Error('ADAPTER_SLIDER_INPUT_INVALID');
  const get=id=>graph.joints.find(j=>j.id===id);
  const r=get('big-end').anchorA[0],l=get('wrist-pin').anchorA[0];
  const a=turns*2*Math.PI, crankX=r*Math.cos(a),crankY=r*Math.sin(a);
  return {schema:CONSTRAINT_SCHEMA,points:[F('pin',crankX,crankY),V('piston',l,0)],
    constraints:[D('rod','pin','piston',l),
      {id:'guide',kind:'axis',a:'piston',origin:[0,0],direction:[1,0]}]};
}
export function fourBarConstraintProblem(graph, turns, branch) {
  if(graph.mechanism!=='four-bar'||!['open','crossed'].includes(branch)||!Number.isFinite(turns))
    throw Error('ADAPTER_FOUR_BAR_INPUT_INVALID');
  const get=id=>graph.joints.find(j=>j.id===id);
  const d=get('rocker-bearing').anchorA[0],
    a=get('coupler-input').anchorA[0],b=get('coupler-rocker').anchorA[0],
    c=get('coupler-rocker').anchorB[0];
  const theta=turns*2*Math.PI, start=[a*Math.cos(theta),a*Math.sin(theta)],end=[d,0];
  const vx=end[0]-start[0],vy=end[1]-start[1],sep=Math.hypot(vx,vy),sign=branch==='open'?1:-1;
  // Broad seed on chosen signed half-plane, not the analytic circle solution.
  // Cross sign is geometrically meaningful for both four-bar branches.
  const seed=[(start[0]+end[0])/2-sign*(vy/sep)*.7*c,
    (start[1]+end[1])/2+sign*(vx/sep)*.7*c];
  return {schema:CONSTRAINT_SCHEMA,points:[F('input-pin',...start),F('output-bearing',...end),
    V('output-pin',...seed)],constraints:[
     D('coupler','input-pin','output-pin',b),
     D('rocker','output-bearing','output-pin',c)]};
}
export function runIndependentConstraintProof(graph, exactPose, {samples=72,toleranceMm=1e-6}={}) {
  if(!Number.isInteger(samples)||samples<8||samples>1440||!Number.isFinite(toleranceMm)||
    toleranceMm<=0||toleranceMm>1e-3)throw Error('CONSTRAINT_PROOF_PROFILE_INVALID');
  if(!['four-bar','slider-crank'].includes(graph.mechanism))throw Error('CONSTRAINT_PROOF_TOPOLOGY_UNSUPPORTED');
  const branches=graph.mechanism==='four-bar'?['open','crossed']:['positive-root'];
  let maxPoseErrorMm=0,maxResidualMm=0,proofCount=0;
  for(const branch of branches)for(let i=0;i<=samples;i++){
    const turns=i/samples;
    const problem=graph.mechanism==='four-bar'?
      fourBarConstraintProblem(graph,turns,branch):sliderConstraintProblem(graph,turns);
    const result=solvePlanarConstraints(problem,{toleranceMm:toleranceMm*.1});
    if(result.status!=='closed')throw Error('INDEPENDENT_CONSTRAINT_SOLVER_'+result.status+'_'+branch+'_'+i);
    const reference=exactPose(turns,branch),point=graph.mechanism==='four-bar'?
      result.positions['output-pin']:result.positions.piston;
    const expected=graph.mechanism==='four-bar'?
      [reference.outputPin.x,reference.outputPin.y]:[reference.pistonX,0];
    const error=Math.hypot(point[0]-expected[0],point[1]-expected[1]);
    if(error>toleranceMm)throw Error('INDEPENDENT_CONSTRAINT_POSE_MISMATCH_'+branch+'_'+i+'_'+error);
    maxPoseErrorMm=Math.max(maxPoseErrorMm,error);
    maxResidualMm=Math.max(maxResidualMm,result.maxResidualMm);
    proofCount++;
  }
  return {schema:'avant.independent-constraint-proof/1',status:'PASS',
    mechanism:graph.mechanism,samples:proofCount,branches,
    maxPoseErrorMm,maxResidualMm,toleranceMm,
    solver:'damped-point-constraint-gauss-newton/1',
    scope:'local-constraint-root-and-pose-consistency',
    fullAssemblyBranchEnumeration:false,physicalCertification:false};
}
