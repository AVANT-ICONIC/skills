#!/usr/bin/env node
/**
 * Audits one compiled, REVIEWED mechanism recipe before browser execution.
 * Proves reproducible template+configuration identity and independent numeric
 * invariants; DOES NOT fetch or certify the source reference URL's content.
 */
import {readFileSync,lstatSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {validateRequest,makeMachineConfig} from './compile-request.mjs';
import {makeMechanismGraph,graphDigestInput,makeGraphModule,solvePlanarGraph} from './mechanism-graph.mjs';
import {solveFourBarGeometry,classifyFourBar} from './fourbar-solver.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const SHA=b=>createHash('sha256').update(b).digest('hex');
function safeRead(path){
  if(!lstatSync(path).isFile())throw Error('AUDIT_SOURCE_NOT_REGULAR: '+path);
  return readFileSync(path);
}
function requireExact(generated,reference,name){
  const actual=safeRead(join(generated,name)),expected=safeRead(reference);
  if(SHA(actual)!==SHA(expected))throw Error('AUDIT_TEMPLATE_CHANGED: '+name);
  return SHA(actual);
}
const near=(a,b,tolerance,id)=>{
  if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>tolerance)
    throw Error('AUDIT_NUMERIC_INVARIANT: '+id+' actual='+a+' expected='+b);
  return Math.abs(a-b);
};
function sliderProof(model,config,referenceId){
  const {crankRadiusMm:r,rodLengthMm:l,inputRpm:rpm}=config;
  let maxClosure=0,maxFormula=0,maxStrokeExceeded=0;
  for(let f=0;f<=1440;f++){
    const turns=f/1440,s=model.evaluateSliderCrank(turns,config);
    const angle=turns*2*Math.PI;
    const expectedX=r*Math.cos(angle)+Math.sqrt(l*l-r*r*Math.sin(angle)**2);
    const closure=Math.abs(Math.hypot(s.pistonX-s.crankX,s.crankY)-l);
    maxClosure=Math.max(maxClosure,closure);
    maxFormula=Math.max(maxFormula,Math.abs(s.pistonX-expectedX));
    maxStrokeExceeded=Math.max(maxStrokeExceeded,Math.max(0,-s.strokeMm,s.strokeMm-2*r));
  }
  near(maxClosure,0,1e-8,'slider.rigid-rod');
  near(maxFormula,0,1e-8,'slider.position-formula');
  near(maxStrokeExceeded,0,1e-8,'slider.stroke-bounds');
  const a=model.evaluateSliderCrank(0,config);
  const b=model.evaluateSliderCrank(.5,config);
  near(a.strokeMm,0,1e-8,'slider.top-dead-center');
  near(b.strokeMm,2*r,1e-8,'slider.bottom-dead-center');
  near(a.velocityMmS,0,1e-8,'slider.top-zero-velocity');
  near(b.velocityMmS,0,1e-8,'slider.bottom-zero-velocity');
  return [
    {id:'slider-rigid-link-closure',referenceIds:[referenceId],
     observation:'max absolute rod-length error over 1441 poses',unit:'mm',
     measured:maxClosure,tolerance:1e-8,status:'PASS'},
    {id:'slider-analytic-position',referenceIds:[referenceId],
     observation:'max piston position error against independently evaluated relation',unit:'mm',
     measured:maxFormula,tolerance:1e-8,status:'PASS'},
    {id:'slider-stroke-and-dead-centers',referenceIds:[referenceId],
     observation:'bound violation and zero-velocity dead-center checks',unit:'mm',
     measured:maxStrokeExceeded,tolerance:1e-8,status:'PASS'}
  ];
}
function genevaProof(model,referenceId){
  const p=model.GENEVA;
  near(p.centerDistanceMm,p.crankRadiusMm/Math.sin(Math.PI/4),1e-10,'geneva.center-distance');
  let engaged=0,maxAlignment=0,maxDistanceViolation=0;
  const samples=1440;
  for(let f=0;f<samples;f++){
    const t=-.5+f/samples,s=model.evaluateGeneva(t);
    if(!s.engaged)continue;
    engaged++;
    maxAlignment=Math.max(maxAlignment,Math.abs(s.contactAlignmentErrorRad));
    maxDistanceViolation=Math.max(maxDistanceViolation,
       Math.max(0,p.slotEndCenterMm+p.pinRadiusMm-s.pinToOutputCenterMm));
  }
  near(maxAlignment,0,1e-8,'geneva.slot-pin-collinearity');
  near(maxDistanceViolation,0,1e-8,'geneva.pin-slot-clearance');
  const dwell=1-engaged/samples;
  near(dwell,.75,.005,'geneva.dwell-share');
  near(model.evaluateGeneva(.5).outputAngleRad,-Math.PI/2,1e-8,'geneva.quarter-turn');
  near(model.evaluateGeneva(1.5).outputAngleRad,-Math.PI,1e-8,'geneva.half-turn');
  return [
    {id:'geneva-pin-slot-collinearity',referenceIds:[referenceId],
     observation:'max pin-slot angular deviation over sampled engagement',unit:'rad',
     measured:maxAlignment,tolerance:1e-8,status:'PASS'},
    {id:'geneva-ideal-dwell-share',referenceIds:[referenceId],
     observation:'fraction of input turns with idealized output dwell',unit:'fraction',
     measured:dwell,expected:.75,tolerance:.005,status:'PASS'},
    {id:'geneva-90-degree-index',referenceIds:[referenceId],
     observation:'one exact quarter turn per crank revolution',unit:'rad',
     measured:model.evaluateGeneva(.5).outputAngleRad,expected:-Math.PI/2,
     tolerance:1e-8,status:'PASS'}
  ];
}
function fourBarProof(model,graph,referenceId){
 const p=graph.parameters;
 const eps=1e-8;
 let maxClosure=0,maxPoseDiff=0,maxSignedError=0,minHeight=Infinity;
 const branches=['open','crossed'];
 const snapshots=[];
 for(const branch of branches)for(let i=0;i<=1440;i++){
  const t=i/1440;
  const graphPose=solvePlanarGraph(graph,t,{branch});
  const actual=model.evaluateFourBar(t,{branch});
  if(graphPose.status!=='closed'||actual.status!=='closed')
   throw Error('AUDIT_FOUR_BAR_POSE_NOT_CLOSED: '+branch+' '+i);
  const a=graphPose.inputPin,b=graphPose.outputPin,o={x:p.groundLengthMm,y:0};
  const length=(u,v)=>Math.hypot(u.x-v.x,u.y-v.y);
  const closure=Math.max(
   Math.abs(length({x:0,y:0},a)-p.inputLengthMm),
   Math.abs(length(a,b)-p.couplerLengthMm),
   Math.abs(length(o,b)-p.outputLengthMm));
  maxClosure=Math.max(maxClosure,closure);
  maxPoseDiff=Math.max(maxPoseDiff,Math.abs(actual.outputPin.x-b.x),Math.abs(actual.outputPin.y-b.y));
  const cross=(o.x-a.x)*(b.y-a.y)-(o.y-a.y)*(b.x-a.x);
  const sign=branch==='open'?1:-1;
  maxSignedError=Math.max(maxSignedError,Math.max(0,-sign*cross));
  minHeight=Math.min(minHeight,graphPose.intersectionHeightMm);
  if(i===0)snapshots.push({branch,x:b.x,y:b.y});
 }
 if(maxClosure>eps||maxPoseDiff>eps||maxSignedError>eps||!(minHeight>eps)||
    Math.hypot(snapshots[0].x-snapshots[1].x,snapshots[0].y-snapshots[1].y)<eps)
   throw Error('AUDIT_FOUR_BAR_GEOMETRY_FAILED');
 if(!classifyFourBar(p).noToggleThroughoutFullTurn)
   throw Error('AUDIT_FOUR_BAR_NOT_CONTINUOUS');
 return [
  {id:'four-bar-loop-closure',referenceIds:[referenceId],
    observation:'worst independent link closure residual across 2882 poses',unit:'mm',
    measured:maxClosure,tolerance:eps,status:'PASS'},
  {id:'four-bar-render-pose',referenceIds:[referenceId],
    observation:'max difference between delivered model and graph output',unit:'mm',
    measured:maxPoseDiff,tolerance:eps,status:'PASS'},
  {id:'four-bar-dual-branch',referenceIds:[referenceId],
    observation:'signed circle-intersection branch violation',unit:'mm2',
    measured:maxSignedError,tolerance:eps,status:'PASS'}
 ];
}

export async function auditGenerated(generated){
  const directory=resolve(generated);
  const request=validateRequest(JSON.parse(safeRead(join(directory,'request.json'))));
  const register=JSON.parse(safeRead(join(directory,'source-register.json')));
  if(register.requestId!==request.id||register.sourcesFetched!==false||
    register.physicalCertification!==false||
    JSON.stringify(register.references)!==JSON.stringify(request.references)||
    JSON.stringify(register.parameters)!==JSON.stringify(request.parameters))
    throw Error('AUDIT_SOURCE_REGISTER_MISMATCH');
  const recipe=join(ROOT,'examples',request.mechanism==='geneva-4'?'geneva-indexer':request.mechanism);
  const fingerprints={};
  for(const name of ['main.js','model.mjs','stage.js']){
    fingerprints[name]=requireExact(directory,join(recipe,name),name);
  }
  fingerprints['film-direction.mjs']=requireExact(directory,join(ROOT,'scripts/film-direction.mjs'),'film-direction.mjs');
  fingerprints['mechanism-graph.mjs']=requireExact(directory,join(ROOT,'scripts/mechanism-graph.mjs'),'mechanism-graph.mjs');
  fingerprints['fourbar-solver.mjs']=requireExact(directory,join(ROOT,'scripts/fourbar-solver.mjs'),'fourbar-solver.mjs');
  const graph=makeMechanismGraph(request);
  const expectedGraph=Buffer.from(graphDigestInput(graph));
  const graphSource=safeRead(join(directory,'mechanism-graph.json'));
  if(SHA(expectedGraph)!==SHA(graphSource))throw Error('AUDIT_MACHINE_GRAPH_MISMATCH');
  fingerprints['mechanism-graph.json']=SHA(graphSource);
  const compiledGraph=Buffer.from(makeGraphModule(graph));
  const graphModule=safeRead(join(directory,'machine-graph.mjs'));
  if(SHA(compiledGraph)!==SHA(graphModule))throw Error('AUDIT_GRAPH_MODULE_MISMATCH');
  fingerprints['machine-graph.mjs']=SHA(graphModule);
  const sharedStyle=safeRead(join(ROOT,'examples/geneva-indexer/style.css'));
  const expectedStyle=request.mechanism!=='geneva-4'
    ?Buffer.concat([sharedStyle,Buffer.from('\n'),safeRead(join(recipe,'style.css'))])
    :sharedStyle;
  const actualStyle=safeRead(join(directory,'style.css'));
  if(SHA(actualStyle)!==SHA(expectedStyle))throw Error('AUDIT_TEMPLATE_CHANGED: style.css');
  fingerprints['style.css']=SHA(actualStyle);
  const expected=Buffer.from(makeMachineConfig(request));
  const actual=safeRead(join(directory,'machine-config.mjs'));
  if(SHA(expected)!==SHA(actual))throw Error('AUDIT_MACHINE_CONFIG_MISMATCH');
  fingerprints['machine-config.mjs']=SHA(actual);
  const model=await import(pathToFileURL(join(directory,'model.mjs')).href);
  const config=request.mechanism==='geneva-4'?undefined:
    {...Object.fromEntries(Object.entries(request.parameters).map(([k,v])=>[k,v.value])),
      ...(request.mechanism==='four-bar'?{assemblyBranch:request.assemblyBranch}:{}),video:request.video};
  const evidence=request.mechanism==='slider-crank'
    ?sliderProof(model,config,request.references[0].id)
    :request.mechanism==='four-bar'?fourBarProof(model,graph,request.references[0].id)
    :genevaProof(model,request.references[0].id);
  if(request.mechanism==='slider-crank'){
    for(let i=0;i<=360;i++){
      const actual=solvePlanarGraph(graph,i/360).state;
      const delivered=model.evaluateSliderCrank(i/360,config);
      near(actual.pistonX,delivered.pistonX,1e-9,'slider.graph-vs-render-pose');
    }
  }else if(request.mechanism==='geneva-4'){
    const p=model.GENEVA;
    for(const name of ['slots','crankRadiusMm','centerDistanceMm','pinRadiusMm'])
      near(graph.parameters[name],p[name],1e-10,'geneva.graph-default-'+name);
  }
  return {
    schema:'avant.mechanism-model-audit/1',requestId:request.id,mechanism:request.mechanism,
    status:'PASS',scope:'reviewed-recipe-integrity-and-internal-kinematics',
    scientificSourceVerification:'NOT_EVALUATED',sourceDocumentsRetrieved:false,
    certifiedPhysics:false,files:fingerprints,
    mechanismGraph:{schema:graph.schema,sha256:SHA(graphSource),solver:graph.solver,
      bodies:graph.bodies.length,joints:graph.joints.length,
      runtimeDriven:request.mechanism!=='geneva-4',
      limitations:request.mechanism==='geneva-4'?['Graph describes Geneva topology; existing independently verified solver remains authoritative']:[]},
    references:request.references.map(x=>({id:x.id,url:x.url,redistribution:x.redistribution,
      contentChecked:false})),claims:evidence,
    assumptions:Object.entries(request.parameters).filter(([,p])=>['assumed','illustrative'].includes(p.provenance)).map(([id,p])=>({id,value:p.value,unit:p.unit})),
    caveats:['No reference URL was fetched or semantically checked by this auditor',
      'Analytic model closure does not certify mechanical loads or manufacturability',
      'Only hash-matched reviewed recipes are executed, never arbitrary uploaded JavaScript']
  };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [input,out]=process.argv.slice(2);
  try{
    if(!input||!out)throw Error('Usage: node audit-model.mjs GENERATED_DIR OUTPUT_JSON');
    const result=await auditGenerated(input);
    writeFileSync(resolve(out),JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify({status:result.status,mechanism:result.mechanism,
      claims:result.claims.length,sourcesRetrieved:false,verifiedModels:Object.keys(result.files).length}));
  }catch(e){console.error(String(e.stack||e));process.exitCode=1;}
}
