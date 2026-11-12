/** Translate reviewed mechanism body/joint graphs into independent SE(2) constraints. */
import {POSE_SCHEMA,solveRigidPoseConstraints,enumerateRigidPoseBranches} from './rigid-pose-core.mjs';
const TAU=2*Math.PI;
const anchor=(g,id)=>g.joints.find(j=>j.id===id);
const signed=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const R=(x,y,t)=>[x,y,t];
function estimateFourbar(g,turns,sign){
 const r=anchor(g,'coupler-input').anchorA[0],d=anchor(g,'rocker-bearing').anchorA[0];
 const b=anchor(g,'coupler-rocker').anchorA[0],c=anchor(g,'coupler-rocker').anchorB[0];
 const theta=turns*TAU,p=[r*Math.cos(theta),r*Math.sin(theta)],o=[d,0];
 const dx=o[0]-p[0],dy=o[1]-p[1],sep=Math.hypot(dx,dy);
 const z=Math.min(b,c)*.9,point=[(p[0]+o[0])/2-sign*dy/sep*z,(p[1]+o[1])/2+sign*dx/sep*z];
 return {coupler:R(...p,Math.atan2(point[1]-p[1],point[0]-p[0])),
  rocker:R(...o,Math.atan2(point[1]-o[1],point[0]-o[0]))};
}
export function poseSystemFromGraph(graph,turns,{branch='open'}={}){
 if(!graph||!['slider-crank','four-bar'].includes(graph.mechanism)||!Number.isFinite(turns))throw Error('POSE_ADAPTER_UNSUPPORTED');
 const theta=turns*TAU, fixed={ground:R(0,0,0)};
 const estimated={};
 if(graph.mechanism==='slider-crank'){
  fixed.crank=R(0,0,theta);
  const r=anchor(graph,'big-end').anchorA[0],l=anchor(graph,'wrist-pin').anchorA[0];
  estimated.rod=R(r*Math.cos(theta),r*Math.sin(theta),-.2);
  estimated.piston=R(r*Math.cos(theta)+l,0,0);
 }else{
  if(!['open','crossed'].includes(branch))throw Error('POSE_ADAPTER_BRANCH_UNSUPPORTED');
  fixed.input=R(0,0,theta);
  Object.assign(estimated,estimateFourbar(graph,turns,branch==='open'?1:-1));
 }
 const bodies=graph.bodies.map(b=>fixed[b.id]?{id:b.id,fixedPose:fixed[b.id]}:
  estimated[b.id]?{id:b.id,seedPose:estimated[b.id]}:null);
 if(bodies.includes(null))throw Error('POSE_ADAPTER_BODY_UNSUPPORTED');
 const joints=graph.joints.map(j=>{
  if(j.type==='revolute')return {id:j.id,type:'revolute',a:j.a,b:j.b,anchorA:j.anchorA,anchorB:j.anchorB};
  if(j.type==='prismatic')return {id:j.id,type:'prismatic',a:j.a,b:j.b,
   anchorA:[0,0],anchorB:[0,0],axisA:j.axis,angleScaleMm:50};
  throw Error('POSE_ADAPTER_JOINT_UNSUPPORTED');
 });
 return {schema:POSE_SCHEMA,bodies,joints};
}
export function proofRigidGraph(graph,pose,{samples=24,toleranceMm=1e-5}={}){
 if(!Number.isInteger(samples)||samples<8||samples>144||!(toleranceMm>0&&toleranceMm<1e-2))throw Error('POSE_PROOF_PROFILE_INVALID');
 const branches=graph.mechanism==='four-bar'?['open','crossed']:['positive-root'];
 let count=0,maxPoseErrorMm=0,maxResidualMm=0;
 for(const branch of branches)for(let i=0;i<=samples;i++){
  const turns=i/samples;
  const problem=poseSystemFromGraph(graph,turns,{branch:graph.mechanism==='four-bar'?branch:'open'});
  const solved=solveRigidPoseConstraints(problem,{toleranceMm:toleranceMm*.01});
  if(solved.status!=='closed')throw Error('POSE_PROOF_ROOT_'+branch+'_'+i+'_'+solved.status);
  const expected=pose(turns,branch);
  const target=graph.mechanism==='four-bar'?expected.outputPin:{x:expected.pistonX,y:0};
  const body=graph.mechanism==='four-bar'?solved.poses.coupler:solved.poses.piston;
  const pin=graph.mechanism==='four-bar'?anchor(graph,'coupler-rocker').anchorA:[0,0];
  const x=body[0]+pin[0]*Math.cos(body[2])-pin[1]*Math.sin(body[2]);
  const y=body[1]+pin[0]*Math.sin(body[2])+pin[1]*Math.cos(body[2]);
  const error=Math.hypot(x-target.x,y-target.y);
  if(error>toleranceMm)throw Error('POSE_PROOF_DISAGREEMENT_'+branch+'_'+i+'_'+error);
  if(graph.mechanism==='four-bar'){
   const o=[anchor(graph,'rocker-bearing').anchorA[0],0];
   const input=[anchor(graph,'coupler-input').anchorA[0]*Math.cos(turns*TAU),anchor(graph,'coupler-input').anchorA[0]*Math.sin(turns*TAU)];
   const orient=signed(input,o,[x,y]);
   if((branch==='open'?orient:-orient)<=0)throw Error('POSE_PROOF_BRANCH_CROSSED_'+branch+'_'+i);
  }
  maxPoseErrorMm=Math.max(maxPoseErrorMm,error);maxResidualMm=Math.max(maxResidualMm,solved.maxResidualMm);count++;
 }
 return {schema:'avant.independent-rigid-pose-proof/1',status:'PASS',mechanism:graph.mechanism,branches,
  samples:count,maxPoseErrorMm,maxResidualMm,toleranceMm,
  scope:'independent-se2-joint-closure-oracle',globalAssemblyEnumeration:false,
  certifiedPhysics:false};
}
export function enumerateFourBarRigidBranches(graph,turns){
 const problem=poseSystemFromGraph(graph,turns,{branch:'open'});
 const open=estimateFourbar(graph,turns,1),crossed=estimateFourbar(graph,turns,-1);
 const b=anchor(graph,'coupler-rocker').anchorA;
 return enumerateRigidPoseBranches(problem,{seedSets:[open,crossed],markers:[{body:'coupler',anchor:b}]});
}
