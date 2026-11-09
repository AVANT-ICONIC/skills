/**
 * Mechanism Graph v1: declarative 2D bodies, joints and numerical constraints.
 * One supported closed-form graph evaluator: inline slider-crank. Geneva is
 * represented, but retains its separately verified kinematics until a graph
 * solver is proven. This is not an arbitrary CAD or force solver.
 */
import {FOUR_BAR_SOLVER,solveFourBarGeometry,classifyFourBar} from './fourbar-solver.mjs';
const TAU=Math.PI*2;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const item=(id,role)=>({id,role});
const REV=(id,a,b,anchorA,anchorB)=>({id,type:'revolute',a,b,anchorA,anchorB});
const PRISM=(id,a,b,axis)=>({id,type:'prismatic',a,b,axis});
const pair=(x,y)=>[x,y];
const clone=o=>JSON.parse(JSON.stringify(o));

export const GRAPH_SCHEMA='avant.mechanism-graph/1';
export const SLIDER_SOLVER='inline-slider-crank-positive-root/1';
export const GENEVA_SOLVER='geneva-four-slot-ideal-deferred/1';
export {FOUR_BAR_SOLVER};

export function makeSliderGraph({id='slider-crank-preview',crankRadiusMm:r,rodLengthMm:l,inputRpm:rpm,sourceIds=[]}){
 if(!finite(r)||!finite(l)||!finite(rpm)||r<=0||l<=r||rpm<=0)
  throw new TypeError('GRAPH_DIMENSIONS_INVALID');
 const graph={
  schema:GRAPH_SCHEMA,id,mechanism:'slider-crank',plane:'xy',unit:'mm',certifiedPhysics:false,
  solver:SLIDER_SOLVER,
  bodies:[item('ground','fixed'),item('crank','rotor'),item('rod','rigid-link'),item('piston','slider')],
  joints:[
   REV('main-bearing','ground','crank',pair(0,0),pair(0,0)),
   REV('big-end','crank','rod',pair(r,0),pair(0,0)),
   REV('wrist-pin','rod','piston',pair(l,0),pair(0,0)),
   PRISM('piston-guide','ground','piston',pair(1,0))
  ],
  drive:{joint:'main-bearing',kind:'uniform-rotation',rpm},
  constraints:[
   {id:'rod-closure',kind:'distance',jointA:'big-end',jointB:'wrist-pin',lengthMm:l},
   {id:'piston-axis',kind:'axis',joint:'piston-guide',yMm:0},
   {id:'stroke',kind:'travel',body:'piston',totalMm:2*r}
  ],
  parameters:{crankRadiusMm:r,rodLengthMm:l,inputRpm:rpm},
  provenance:{sourceIds:[...sourceIds],externalDocumentsVerified:false,dimensionalCertification:false}
 };
 validateMechanismGraph(graph);
 return graph;
}
export function makeGenevaGraph({id='geneva-four-slot-study',sourceIds=[]}={}){
 const r=30,c=r/Math.sin(Math.PI/4);
 const graph={
  schema:GRAPH_SCHEMA,id,mechanism:'geneva-4',plane:'xy',unit:'mm',certifiedPhysics:false,
  solver:GENEVA_SOLVER,
  bodies:[item('ground','fixed'),item('driver','rotor'),item('wheel','intermittent-rotor')],
  joints:[
   REV('driver-axis','ground','driver',pair(0,0),pair(0,0)),
   REV('wheel-axis','ground','wheel',pair(c,0),pair(0,0)),
   {id:'drive-pin',type:'intermittent-pin-slot',a:'driver',b:'wheel',radiusMm:r,slotCount:4}
  ],
  drive:{joint:'driver-axis',kind:'uniform-rotation',rpm:12},
  constraints:[
   {id:'step-angle',kind:'index-step',body:'wheel',angleRad:Math.PI/2},
   {id:'ideal-dwell',kind:'ideal-dwell',body:'wheel',fraction:.75,lockingCamModeled:false}
  ],
  parameters:{slots:4,crankRadiusMm:r,centerDistanceMm:c,pinRadiusMm:2,
   radialSlotHalfWidthMm:2.4,slotEndCenterMm:9.5,outputRadiusMm:34,inputRpm:12},
  provenance:{sourceIds:[...sourceIds],externalDocumentsVerified:false,dimensionalCertification:false}
 };
 validateMechanismGraph(graph);
 return graph;
}

/** Four pin-jointed rigid links. Ground and input pivot are collinear in XY. */
export function makeFourBarGraph({
 id='four-bar-crank-rocker',groundLengthMm:d,inputLengthMm:a,
 couplerLengthMm:b,outputLengthMm:c,inputRpm:rpm,assemblyBranch='open',sourceIds=[]
}){
 const params={groundLengthMm:d,inputLengthMm:a,couplerLengthMm:b,outputLengthMm:c,inputRpm:rpm};
 if(![d,a,b,c,rpm].every(n=>finite(n)&&n>0)||rpm>120||
  !['open','crossed'].includes(assemblyBranch))
   throw new TypeError('GRAPH_FOUR_BAR_PARAMETERS_INVALID');
 // The current interactive film requires an uninterrupted 360-degree driver.
 // Individual singular/unreachable poses remain available via diagnostic solver.
 if(!classifyFourBar(params).noToggleThroughoutFullTurn)
   throw new Error('GRAPH_FOUR_BAR_CONTINUOUS_ROTATION_UNSUPPORTED');
 const graph={
  schema:GRAPH_SCHEMA,id,mechanism:'four-bar',plane:'xy',unit:'mm',
  certifiedPhysics:false,solver:FOUR_BAR_SOLVER,assemblyBranch,
  bodies:[item('ground','fixed'),item('input','rotor'),item('coupler','rigid-link'),item('rocker','rocking-output')],
  joints:[
   REV('input-bearing','ground','input',pair(0,0),pair(0,0)),
   REV('coupler-input','input','coupler',pair(a,0),pair(0,0)),
   REV('coupler-rocker','coupler','rocker',pair(b,0),pair(c,0)),
   REV('rocker-bearing','ground','rocker',pair(d,0),pair(0,0))
  ],
  drive:{joint:'input-bearing',kind:'uniform-rotation',rpm},
  constraints:[
   {id:'loop-closure',kind:'four-revolute-closure',toleranceMm:1e-8},
   {id:'branch',kind:'intersection-branch',value:assemblyBranch},
   {id:'full-turn',kind:'continuous-driver',noToggle:true}
  ],
  parameters:params,
  provenance:{sourceIds:[...sourceIds],externalDocumentsVerified:false,dimensionalCertification:false}
 };
 validateMechanismGraph(graph);
 return graph;
}

export function makeMechanismGraph(request){
 if(!request||typeof request!=='object'||typeof request.id!=='string'||!Array.isArray(request.references))
  throw new TypeError('GRAPH_REQUEST_INVALID');
 const sourceIds=request.references.map(x=>x.id);
 if(request.mechanism==='geneva-4')return makeGenevaGraph({id:request.id,sourceIds});
 if(request.mechanism==='four-bar'){
  const p=request.parameters;
  if(!p||!['groundLengthMm','inputLengthMm','couplerLengthMm','outputLengthMm','inputRpm'].every(k=>finite(p[k]?.value)))
   throw new TypeError('GRAPH_PARAMETERS_INVALID');
  return makeFourBarGraph({id:request.id,
   groundLengthMm:p.groundLengthMm.value,inputLengthMm:p.inputLengthMm.value,
   couplerLengthMm:p.couplerLengthMm.value,outputLengthMm:p.outputLengthMm.value,
   inputRpm:p.inputRpm.value,assemblyBranch:request.assemblyBranch,sourceIds});
 }
 if(request.mechanism==='slider-crank'){
  const p=request.parameters;
  if(!p||!['crankRadiusMm','rodLengthMm','inputRpm'].every(k=>finite(p[k]?.value)))
   throw new TypeError('GRAPH_PARAMETERS_INVALID');
  return makeSliderGraph({id:request.id,crankRadiusMm:p.crankRadiusMm.value,
   rodLengthMm:p.rodLengthMm.value,inputRpm:p.inputRpm.value,sourceIds});
 }
 throw new TypeError('GRAPH_MECHANISM_UNSUPPORTED');
}
function checkJoint(j,parts){
 if(!j||typeof j.id!=='string'||!parts.has(j.a)||!parts.has(j.b)||j.a===j.b)
  throw new Error('GRAPH_DANGLING_JOINT');
 if(j.type==='revolute'){
  if(![j.anchorA,j.anchorB].every(v=>Array.isArray(v)&&v.length===2&&v.every(finite)))
   throw new Error('GRAPH_BAD_REVOLUTE_ANCHOR');
 }else if(j.type==='prismatic'){
  if(!Array.isArray(j.axis)||j.axis.length!==2||!j.axis.every(finite)||
    Math.abs(Math.hypot(...j.axis)-1)>1e-10)throw new Error('GRAPH_BAD_PRISMATIC_AXIS');
 }else if(j.type==='intermittent-pin-slot'){
  if(!finite(j.radiusMm)||j.radiusMm<=0||j.slotCount!==4)throw new Error('GRAPH_BAD_INTERMITTENT_PIN');
 }else throw new Error('GRAPH_UNSUPPORTED_JOINT');
}
const expectIDs=(values,expected,reason)=>{
 if(values.length!==expected.length||new Set(values).size!==values.length||
   values.slice().sort().join('|')!==expected.slice().sort().join('|'))throw new Error(reason);
};
export function validateMechanismGraph(graph){
 if(!graph||graph.schema!==GRAPH_SCHEMA||graph.unit!=='mm'||graph.plane!=='xy'||
  graph.certifiedPhysics!==false||!Array.isArray(graph.bodies)||!Array.isArray(graph.joints)||
  !Array.isArray(graph.constraints)||typeof graph.id!=='string'||!/^[a-z][a-z0-9-]{2,63}$/.test(graph.id)||
  graph.provenance?.externalDocumentsVerified!==false||graph.provenance?.dimensionalCertification!==false||
  !Array.isArray(graph.provenance?.sourceIds))
  throw new Error('GRAPH_SCHEMA_INVALID');
 const partIds=graph.bodies.map(x=>x.id);
 if(partIds.some(x=>typeof x!=='string')||new Set(partIds).size!==partIds.length||
    graph.bodies.some(b=>typeof b.role!=='string'))throw new Error('GRAPH_DUPLICATE_BODY');
 const ids=graph.joints.map(x=>x.id);
 if(new Set(ids).size!==ids.length)throw new Error('GRAPH_DUPLICATE_JOINT');
 const bodySet=new Set(partIds);
 graph.joints.forEach(j=>checkJoint(j,bodySet));
 if(!ids.includes(graph.drive?.joint)||graph.drive.kind!=='uniform-rotation'||
    !finite(graph.drive.rpm)||graph.drive.rpm<=0||graph.drive.rpm>120)
    throw new Error('GRAPH_DRIVE_INVALID');
 if(graph.mechanism==='slider-crank'){
  if(graph.solver!==SLIDER_SOLVER)throw new Error('GRAPH_SOLVER_UNSUPPORTED');
  expectIDs(partIds,['ground','crank','rod','piston'],'GRAPH_SLIDER_TOPOLOGY');
  expectIDs(ids,['main-bearing','big-end','wrist-pin','piston-guide'],'GRAPH_SLIDER_TOPOLOGY');
  const get=id=>graph.joints.find(j=>j.id===id);
  const r=get('big-end'),l=get('wrist-pin'),axis=get('piston-guide'),bearing=get('main-bearing');
  if(bearing.type!=='revolute'||bearing.a!=='ground'||bearing.b!=='crank'||
    r.type!=='revolute'||r.a!=='crank'||r.b!=='rod'||
    l.type!=='revolute'||l.a!=='rod'||l.b!=='piston'||
    axis.type!=='prismatic'||axis.a!=='ground'||axis.b!=='piston'||
    JSON.stringify(axis.axis)!=='[1,0]'||
    r.anchorA[1]!==0||r.anchorB[0]!==0||r.anchorB[1]!==0||
    l.anchorA[1]!==0||l.anchorB[0]!==0||l.anchorB[1]!==0||
    bearing.anchorA.some(x=>x!==0)||bearing.anchorB.some(x=>x!==0)||
    r.anchorA[0]<=0||l.anchorA[0]<=r.anchorA[0])
    throw new Error('GRAPH_SLIDER_CONSTRAINT_INVALID');
  const p=graph.parameters;
  if(!p||!finite(p.crankRadiusMm)||!finite(p.rodLengthMm)||!finite(p.inputRpm)||
    Math.abs(p.crankRadiusMm-r.anchorA[0])>1e-9||
    Math.abs(p.rodLengthMm-l.anchorA[0])>1e-9||
    p.inputRpm!==graph.drive.rpm||
    !Array.isArray(graph.constraints)||graph.constraints.length!==3)
    throw new Error('GRAPH_SLIDER_NUMERIC_CONFLICT');
  const closure=graph.constraints.find(x=>x.id==='rod-closure');
  const rail=graph.constraints.find(x=>x.id==='piston-axis');
  const stroke=graph.constraints.find(x=>x.id==='stroke');
  if(closure?.kind!=='distance'||closure.jointA!=='big-end'||closure.jointB!=='wrist-pin'||
    closure.lengthMm!==p.rodLengthMm||
    rail?.kind!=='axis'||rail.joint!=='piston-guide'||rail.yMm!==0||
    stroke?.kind!=='travel'||stroke.body!=='piston'||stroke.totalMm!==2*p.crankRadiusMm||
    graph.drive.joint!=='main-bearing')
    throw new Error('GRAPH_SLIDER_NUMERIC_CONFLICT');
 }else if(graph.mechanism==='four-bar'){
  if(graph.solver!==FOUR_BAR_SOLVER||!['open','crossed'].includes(graph.assemblyBranch))
   throw new Error('GRAPH_FOUR_BAR_SOLVER_OR_BRANCH_INVALID');
  expectIDs(partIds,['ground','input','coupler','rocker'],'GRAPH_FOUR_BAR_TOPOLOGY');
  expectIDs(ids,['input-bearing','coupler-input','coupler-rocker','rocker-bearing'],'GRAPH_FOUR_BAR_TOPOLOGY');
  const get=id=>graph.joints.find(j=>j.id===id);
  const input=get('input-bearing'),first=get('coupler-input'),second=get('coupler-rocker'),rocker=get('rocker-bearing');
  if(input.type!=='revolute'||input.a!=='ground'||input.b!=='input'||
   first.type!=='revolute'||first.a!=='input'||first.b!=='coupler'||
   second.type!=='revolute'||second.a!=='coupler'||second.b!=='rocker'||
   rocker.type!=='revolute'||rocker.a!=='ground'||rocker.b!=='rocker'||
   input.anchorA.some(n=>n!==0)||input.anchorB.some(n=>n!==0)||
   first.anchorB.some(n=>n!==0)||
   rocker.anchorB.some(n=>n!==0)||
   first.anchorA[1]!==0||second.anchorA[1]!==0||
   second.anchorB[1]!==0||rocker.anchorA[1]!==0||
   first.anchorA[0]<=0||second.anchorA[0]<=0||
   second.anchorB[0]<=0||rocker.anchorA[0]<=0||
   graph.drive.joint!=='input-bearing')
   throw new Error('GRAPH_FOUR_BAR_TOPOLOGY_INVALID');
  const p=graph.parameters;
  if(!p||p.groundLengthMm!==rocker.anchorA[0]||p.inputLengthMm!==first.anchorA[0]||
   p.couplerLengthMm!==second.anchorA[0]||p.outputLengthMm!==second.anchorB[0]||
   p.inputRpm!==graph.drive.rpm||graph.constraints.length!==3||
   graph.constraints.find(x=>x.id==='loop-closure')?.kind!=='four-revolute-closure'||
   graph.constraints.find(x=>x.id==='loop-closure')?.toleranceMm!==1e-8||
   graph.constraints.find(x=>x.id==='branch')?.kind!=='intersection-branch'||
   graph.constraints.find(x=>x.id==='branch')?.value!==graph.assemblyBranch||
   graph.constraints.find(x=>x.id==='full-turn')?.kind!=='continuous-driver'||
   graph.constraints.find(x=>x.id==='full-turn')?.noToggle!==true||
   !classifyFourBar(p).noToggleThroughoutFullTurn)
   throw new Error('GRAPH_FOUR_BAR_CONSTRAINT_INVALID');
 }else if(graph.mechanism==='geneva-4'){
  if(graph.solver!==GENEVA_SOLVER)throw new Error('GRAPH_SOLVER_UNSUPPORTED');
  expectIDs(partIds,['ground','driver','wheel'],'GRAPH_GENEVA_TOPOLOGY');
  expectIDs(ids,['driver-axis','wheel-axis','drive-pin'],'GRAPH_GENEVA_TOPOLOGY');
  if(graph.joints.find(j=>j.id==='drive-pin')?.type!=='intermittent-pin-slot'||
    graph.parameters?.slots!==4||
    Math.abs(graph.parameters.centerDistanceMm-graph.parameters.crankRadiusMm/Math.sin(Math.PI/4))>1e-10||
    graph.constraints.find(x=>x.id==='ideal-dwell')?.lockingCamModeled!==false)
   throw new Error('GRAPH_GENEVA_CONSTRAINT_INVALID');
 }else throw new Error('GRAPH_MECHANISM_UNSUPPORTED');
 return {schema:graph.schema,mechanism:graph.mechanism,bodies:graph.bodies.length,joints:graph.joints.length,solver:graph.solver};
}
export function solvePlanarGraph(graph,turns,{rpm,branch}={}){
 if(!finite(turns))throw new TypeError('GRAPH_TIME_INVALID');
 validateMechanismGraph(graph);
 if(graph.solver===FOUR_BAR_SOLVER){
  const p=graph.parameters;
  const chosen=branch??graph.assemblyBranch;
  const solved=solveFourBarGeometry(p,turns,{branch:chosen,rpm:rpm??graph.drive.rpm});
  return {...solved,graphId:graph.id,physicsCertification:false,
    state:solved.status==='closed'?{
      turns,inputAngleRad:solved.inputAngleRad,phaseDeg:((turns*360)%360+360)%360,
      outputAngleRad:solved.outputAngleRad,couplerAngleRad:solved.couplerAngleRad,
      transmissionAngleDeg:solved.transmissionAngleDeg,
      angularSpeedRatio:solved.angularSpeedRatio,
      inputPin:solved.inputPin,outputPin:solved.outputPin,
      branch:chosen,assemblyStatus:solved.status,
      rpm:rpm??graph.drive.rpm
    }:null};
 }
 if(graph.solver!==SLIDER_SOLVER)throw new Error('GRAPH_SOLVER_NOT_IMPLEMENTED');
 const r=graph.joints.find(x=>x.id==='big-end').anchorA[0];
 const l=graph.joints.find(x=>x.id==='wrist-pin').anchorA[0];
 const speed=rpm??graph.drive.rpm;
 if(!finite(speed)||speed<=0||speed>120)throw new TypeError('GRAPH_RPM_INVALID');
 const angleRad=turns*TAU,co=Math.cos(angleRad),si=Math.sin(angleRad);
 const crankX=r*co,crankY=r*si;
 const run=Math.sqrt(l*l-crankY*crankY);
 const pistonX=crankX+run;
 const rodAngleRad=Math.atan2(-crankY,run);
 const angularVelocityRadS=speed*TAU/60;
 const velocityMmS=(-r*si-r*r*si*co/run)*angularVelocityRadS;
 const poses={
  ground:{x:0,y:0,angleRad:0},
  crank:{x:0,y:0,angleRad},
  rod:{x:crankX,y:crankY,angleRad:rodAngleRad},
  piston:{x:pistonX,y:0,angleRad:0}
 };
 const rodEndX=crankX+l*Math.cos(rodAngleRad);
 const rodEndY=crankY+l*Math.sin(rodAngleRad);
 const residuals={
  'rod-closure':Math.abs(Math.hypot(pistonX-crankX,crankY)-l),
  'wrist-pin':Math.hypot(rodEndX-pistonX,rodEndY),
  'piston-axis':Math.abs(poses.piston.y),
  'crank-radius':Math.abs(Math.hypot(crankX,crankY)-r)
 };
 const state={turns,angleRad,phaseDeg:((turns*360)%360+360)%360,
  crankX,crankY,pistonX,strokeMm:(r+l)-pistonX,rodAngleRad,
  velocityMmS,angularVelocityRadS,strokeTotalMm:2*r,rodLengthMm:l,
  crankRadiusMm:r,rpm:speed};
 return {schema:'avant.mechanism-pose/1',graphId:graph.id,solver:graph.solver,
  poses,state,residuals,physicsCertification:false};
}
export function makeGraphModule(graph){
 validateMechanismGraph(graph);
 return '/* Generated from validated graph data; no user-authored source executed. */\n'+
  'export const GRAPH=Object.freeze('+JSON.stringify(graph,null,2)+');\n';
}
export function graphDigestInput(graph){
 validateMechanismGraph(graph);
 return JSON.stringify(graph,null,2)+'\n';
}
