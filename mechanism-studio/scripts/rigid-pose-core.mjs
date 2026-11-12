/** Experimental planar SE(2) pose constraints. Numerical root finding, not physics. */
export const POSE_SCHEMA='avant.rigid-pose-constraints/1';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const vec=(x,n)=>Array.isArray(x)&&x.length===n&&x.every(v=>finite(v)&&Math.abs(v)<=1e5);
const id=x=>typeof x==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(x);
const err=s=>{throw Error('POSE_'+s)};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const mx=x=>Math.max(0,...x.map(Math.abs));
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);

export function validatePoseSystem(g){
 if(!g||g.schema!==POSE_SCHEMA||!Array.isArray(g.bodies)||!Array.isArray(g.joints)||
  g.bodies.length<2||g.bodies.length>9||g.joints.length<1||g.joints.length>24)err('SCHEMA_INVALID');
 const names=new Set(),free=[];
 for(const b of g.bodies){
  if(!b||!id(b.id)||names.has(b.id)||own(b,'fixedPose')===own(b,'seedPose')||
   !vec(b.fixedPose??b.seedPose,3))err('BODY_INVALID');
  names.add(b.id);if(own(b,'seedPose'))free.push(b.id);
 }
 if(!free.length||free.length>5)err('FREE_BODY_LIMIT');
 const jnames=new Set();let eq=0;
 for(const j of g.joints){
  if(!j||!id(j.id)||jnames.has(j.id)||!names.has(j.a)||!names.has(j.b)||j.a===j.b||
   !vec(j.anchorA,2)||!vec(j.anchorB,2))err('JOINT_INVALID');
  jnames.add(j.id);
  if(j.type==='revolute')eq+=2;
  else if(j.type==='prismatic'){
   const fixed=g.bodies.find(b=>b.id===j.a);
   if(!own(fixed,'fixedPose')||!vec(j.axisA,2)||Math.abs(Math.hypot(...j.axisA)-1)>1e-10||
    !finite(j.angleScaleMm)||j.angleScaleMm<1||j.angleScaleMm>10000)err('PRISMATIC_INVALID');
   eq+=2;
  }else err('JOINT_KIND_UNSUPPORTED');
 }
 return {freeIds:free,unknowns:free.length*3,equations:eq};
}
function solveLinear(A,b){
 const n=b.length,M=A.map((r,i)=>[...r,b[i]]);
 for(let k=0;k<n;k++){
  let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[pivot][k]))pivot=i;
  if(Math.abs(M[pivot][k])<1e-15)return null;
  [M[k],M[pivot]]=[M[pivot],M[k]];
  const v=M[k][k];for(let j=k;j<=n;j++)M[k][j]/=v;
  for(let i=0;i<n;i++)if(i!==k){const a=M[i][k];for(let j=k;j<=n;j++)M[i][j]-=a*M[k][j];}
 }
 return M.map(r=>r[n]);
}
function rank(A,n){
 const M=A.map(x=>x.slice()),norm=Math.max(1,...M.flat().map(Math.abs));let r=0;
 for(let c=0;c<n&&r<M.length;c++){
  let piv=r;for(let i=r+1;i<M.length;i++)if(Math.abs(M[i][c])>Math.abs(M[piv][c]))piv=i;
  if(Math.abs(M[piv][c])<1e-9*norm)continue;
  [M[r],M[piv]]=[M[piv],M[r]];
  for(let i=r+1;i<M.length;i++){let a=M[i][c]/M[r][c];for(let j=c;j<n;j++)M[i][j]-=a*M[r][j];}
  r++;
 }return r;
}
function rotated(p,local){const [x,y,t]=p,c=Math.cos(t),s=Math.sin(t);return [x+c*local[0]-s*local[1],y+s*local[0]+c*local[1]];}
function gradient(p,local){const t=p[2],c=Math.cos(t),s=Math.sin(t);return [-s*local[0]-c*local[1],c*local[0]-s*local[1]];}
function evaluate(g,free,x){
 const poses=Object.fromEntries(g.bodies.map(b=>[b.id,[...(b.fixedPose??b.seedPose)]]));
 free.forEach((b,i)=>{poses[b]=x.slice(3*i,3*i+3)});
 const col=Object.fromEntries(free.map((b,i)=>[b,3*i]));
 const residuals=[],J=[];
 const add=(value,jac)=>{residuals.push(value);J.push(jac)};
 for(const j of g.joints){
  const pa=poses[j.a],pb=poses[j.b],a=rotated(pa,j.anchorA),b=rotated(pb,j.anchorB);
  const da=gradient(pa,j.anchorA),db=gradient(pb,j.anchorB);
  const rows=[Array(x.length).fill(0),Array(x.length).fill(0)];
  if(col[j.a]!==undefined){const k=col[j.a];rows[0][k]+=1;rows[1][k+1]+=1;rows[0][k+2]+=da[0];rows[1][k+2]+=da[1];}
  if(col[j.b]!==undefined){const k=col[j.b];rows[0][k]-=1;rows[1][k+1]-=1;rows[0][k+2]-=db[0];rows[1][k+2]-=db[1];}
  if(j.type==='revolute'){
   add(a[0]-b[0],rows[0]);add(a[1]-b[1],rows[1]);
  }else{
   const t=pa[2],u=j.axisA,normal=[-Math.sin(t)*u[0]-Math.cos(t)*u[1],Math.cos(t)*u[0]-Math.sin(t)*u[1]];
   const lateral=Array(x.length).fill(0),angular=Array(x.length).fill(0);
   for(let k=0;k<x.length;k++)lateral[k]=normal[0]*rows[0][k]+normal[1]*rows[1][k];
   if(col[j.b]!==undefined)angular[col[j.b]+2]-=j.angleScaleMm;
   // Residual is A - B, so the angular gradient is negative for body B.
   add(normal[0]*(a[0]-b[0])+normal[1]*(a[1]-b[1]),lateral);
   add(j.angleScaleMm*wrap(pa[2]-pb[2]),angular);
  }
 }
 return {poses,residuals,J};
}
export function solveRigidPoseConstraints(problem,{toleranceMm=1e-7,maxIterations=100,seeds={}}={}){
 const meta=validatePoseSystem(problem);
 if(!finite(toleranceMm)||toleranceMm<=0||toleranceMm>1e-2||
  !Number.isInteger(maxIterations)||maxIterations<1||maxIterations>500||
  !seeds||typeof seeds!=='object'||Object.keys(seeds).some(k=>!meta.freeIds.includes(k)||!vec(seeds[k],3)))
  throw new TypeError('POSE_OPTIONS_INVALID');
 if(meta.equations<meta.unknowns)return {schema:'avant.rigid-pose-solution/1',status:'underdetermined',reason:'TOO_FEW_EQUATIONS',poses:null,maxResidualMm:null,iterations:0,certifiedPhysics:false};
 const x=meta.freeIds.flatMap(k=>seeds[k]??problem.bodies.find(b=>b.id===k).seedPose);
 let lambda=1e-3,state=evaluate(problem,meta.freeIds,x),iterations=0;
 for(;iterations<maxIterations;iterations++){
  if(mx(state.residuals)<=toleranceMm)break;
  const n=x.length,H=Array.from({length:n},()=>Array(n).fill(0)),G=Array(n).fill(0);
  for(let i=0;i<state.residuals.length;i++)for(let j=0;j<n;j++){
   G[j]+=state.J[i][j]*state.residuals[i];for(let k=0;k<n;k++)H[j][k]+=state.J[i][j]*state.J[i][k];
  }
  const cost=state.residuals.reduce((a,b)=>a+b*b,0);let accepted=false;
  for(let trial=0;trial<18;trial++){
   const step=solveLinear(H.map((r,i)=>r.map((v,j)=>v+(i===j?lambda:0))),G.map(v=>-v));
   if(!step||!step.every(finite))break;
   const y=x.map((v,i)=>i%3===2?wrap(v+step[i]):v+step[i]);
   if(!y.every(v=>finite(v)&&Math.abs(v)<1e6))break;
   const next=evaluate(problem,meta.freeIds,y),newCost=next.residuals.reduce((a,b)=>a+b*b,0);
   if(newCost<cost){x.splice(0,x.length,...y);state=next;lambda=Math.max(1e-12,lambda*.33);accepted=true;break;}
   lambda=Math.min(1e14,lambda*8);
  }
  if(!accepted)break;
 }
 const maxResidualMm=mx(state.residuals),solved=maxResidualMm<=toleranceMm;
 const jacobianRank=rank(state.J,meta.unknowns);
 const status=solved?(jacobianRank<meta.unknowns?'singular':'closed'):'unresolved';
 return {schema:'avant.rigid-pose-solution/1',status,reason:status==='singular'?'RANK_DEFICIENT_JACOBIAN':status==='unresolved'?'NO_CERTIFIED_ROOT':null,
  poses:solved?state.poses:null,maxResidualMm,
  residuals:Object.fromEntries(problem.joints.flatMap((j,i)=>[[j.id+'-x',state.residuals[2*i]],[j.id+'-y',state.residuals[2*i+1]]])),
  jacobianRank,unknowns:meta.unknowns,iterations,certifiedPhysics:false};
}
export function enumerateRigidPoseBranches(problem,{seedSets,markers,toleranceMm=1e-7}={}){
 validatePoseSystem(problem);
 if(!Array.isArray(seedSets)||!seedSets.length||seedSets.length>24||!Array.isArray(markers)||!markers.length||markers.length>4)
  throw Error('POSE_BRANCH_REQUEST_INVALID');
 const ids=new Set(problem.bodies.map(b=>b.id));
 for(const m of markers)if(!ids.has(m.body)||!vec(m.anchor,2))throw Error('POSE_BRANCH_MARKER_INVALID');
 const candidates=[],failures=[];
 for(let i=0;i<seedSets.length;i++){
  const solution=solveRigidPoseConstraints(problem,{toleranceMm,seeds:seedSets[i]});
  if(!['closed','singular'].includes(solution.status)){failures.push({seed:i,status:solution.status});continue;}
  const key=markers.flatMap(m=>rotated(solution.poses[m.body],m.anchor));
  if(!candidates.some(c=>Math.hypot(...c.key.map((v,j)=>v-key[j]))<Math.max(toleranceMm*10,1e-5)))
   candidates.push({seed:i,key,solution});
 }
 return {schema:'avant.rigid-pose-branches/1',status:candidates.length?'partial':'unresolved',
  solutions:candidates,failures,globalCompletenessProved:false,certifiedPhysics:false};
}
