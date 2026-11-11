#!/usr/bin/env node
/**
 * Deterministic source-grounded request compiler. Copies only reviewed,
 * checked-in recipe modules; never evaluates user-provided code or downloads URLs.
 * Supported families are deliberately finite: Geneva, slider-crank, four-bar.
 */
import {copyFileSync,existsSync,mkdirSync,readFileSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve,sep,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {makeMechanismGraph,makeGraphModule,graphDigestInput} from './mechanism-graph.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ID=/^[a-z][a-z0-9-]{2,63}$/;
const PARAMS={
  'geneva-4':{},
  'four-bar':{
    groundLengthMm:{min:40,max:250},inputLengthMm:{min:10,max:90},
    couplerLengthMm:{min:30,max:220},outputLengthMm:{min:30,max:190},inputRpm:{min:3,max:60}
  },
  'slider-crank':{
    crankRadiusMm:{min:10,max:60},
    rodLengthMm:{min:25,max:300},
    inputRpm:{min:3,max:60}
  }
};
const ALLOWED_STATUS=new Set(['measured','sourced','derived','assumed','illustrative']);
const ALLOWED_FIELDS=new Set(['schema','id','mechanism','description','classification','references','parameters','video','assemblyBranch']);
const toObject=(x,name)=>{
  if(!x||typeof x!=='object'||Array.isArray(x))throw Error('BAD_'+name);
  return x;
};
function validatePathLocation(base,target){
  const abs=resolve(target);
  if(abs===base||abs.startsWith(base+sep))throw Error('OUTPUT_WITHIN_SKILL_SOURCE_REJECTED');
  if(existsSync(abs))throw Error('OUTPUT_EXISTS');
  return abs;
}
function checkSource(source){
  const s=toObject(source,'SOURCE');
  if(typeof s.id!=='string'||!ID.test(s.id))throw Error('SOURCE_ID_INVALID');
  if(s.type!=='technical-reference')throw Error('SOURCE_TYPE_UNSUPPORTED');
  const link=new URL(s.url);
  if(link.protocol!=='https:'||link.username||link.password||!link.hostname||/(?:^|\.)localhost$/i.test(link.hostname))throw Error('SOURCE_URL_UNSAFE');
  if(s.redistribution!=='link-only')throw Error('SOURCE_REUSE_NOT_APPROVED');
  if(typeof s.title!=='string'||s.title.length<5||s.title.length>180)throw Error('SOURCE_TITLE_INVALID');
  return {id:s.id,type:s.type,url:link.href,title:s.title,redistribution:'link-only'};
}
function param(raw,name,{min,max},ids){
  const p=toObject(raw,'PARAM_'+name);
  if(!Number.isFinite(p.value)||p.value<min||p.value>max)throw Error('PARAM_RANGE_'+name);
  if(p.unit!==(name==='inputRpm'?'rpm':'mm'))throw Error('PARAM_UNIT_'+name);
  if(!ALLOWED_STATUS.has(p.provenance))throw Error('PARAM_PROVENANCE_'+name);
  if(typeof p.note!=='string'||p.note.trim().length<10||p.note.length>300)throw Error('PARAM_NOTE_'+name);
  if(['sourced','measured','derived'].includes(p.provenance)&&(!Array.isArray(p.sourceIds)||!p.sourceIds.length||p.sourceIds.some(x=>!ids.has(x))))
    throw Error('PARAM_EVIDENCE_'+name);
  return {value:p.value,unit:p.unit,provenance:p.provenance,note:p.note.trim(),sourceIds:p.sourceIds||[]};
}
export function validateRequest(input){
  const x=toObject(input,'REQUEST');
  if(Object.keys(x).some(k=>!ALLOWED_FIELDS.has(k)))throw Error('REQUEST_UNKNOWN_FIELD');
  if(x.schema!=='avant.mechanism-request/1')throw Error('REQUEST_SCHEMA_UNSUPPORTED');
  if(typeof x.id!=='string'||!ID.test(x.id))throw Error('REQUEST_ID_INVALID');
  if(!Object.hasOwn(PARAMS,x.mechanism))throw Error('MECHANISM_UNSUPPORTED');
  if(x.classification!=='reference-grounded')throw Error('CLASSIFICATION_UNSUPPORTED');
  if(typeof x.description!=='string'||x.description.trim().length<20||x.description.length>600)throw Error('DESCRIPTION_INVALID');
  if(!Array.isArray(x.references)||!x.references.length||x.references.length>12)throw Error('REFERENCE_REQUIRED');
  const refs=x.references.map(checkSource),ids=new Set(refs.map(r=>r.id));
  if(ids.size!==refs.length)throw Error('DUPLICATE_SOURCE_ID');
  const template=PARAMS[x.mechanism];
  const raw=toObject(x.parameters,'PARAMETERS');
  if(Object.keys(raw).sort().join(',')!==Object.keys(template).sort().join(','))throw Error('PARAMETER_SET_UNSUPPORTED');
  const params=Object.fromEntries(Object.entries(template).map(([name,limits])=>[name,param(raw[name],name,limits,ids)]));
  if(x.mechanism==='four-bar'){
    if(!['open','crossed'].includes(x.assemblyBranch))throw Error('FOUR_BAR_BRANCH_REQUIRED');
    const {groundLengthMm:d,inputLengthMm:a,couplerLengthMm:b,outputLengthMm:c}=Object.fromEntries(
      Object.entries(params).map(([k,v])=>[k,v.value]));
    const lo=Math.abs(d-a),hi=d+a;
    if(!(lo>Math.abs(b-c)+1e-7&&hi<b+c-1e-7))
      throw Error('FOUR_BAR_FULL_CYCLE_UNSAFE');
  }else if(x.assemblyBranch!==undefined)throw Error('BRANCH_ONLY_FOR_FOUR_BAR');
  if(x.mechanism==='slider-crank'){
    const r=params.crankRadiusMm.value,l=params.rodLengthMm.value;
    if(l<2.2*r||l>5*r)throw Error('ROD_RATIO_UNSAFE');
  }
  const video=toObject(x.video,'VIDEO');
  const direction=video.direction??'technical';
  if(!['cinematic','technical'].includes(direction))throw Error('VIDEO_DIRECTION_UNSUPPORTED');
  if(![24,25,30].includes(video.fps)||!Number.isInteger(video.durationSeconds)||video.durationSeconds<6||video.durationSeconds>30||
    ![[1280,720],[1920,1080]].some(([w,h])=>video.width===w&&video.height===h))throw Error('VIDEO_PROFILE_UNSUPPORTED');
  const normalized={
    schema:x.schema,id:x.id,mechanism:x.mechanism,
    ...(x.mechanism==='four-bar'?{assemblyBranch:x.assemblyBranch}:{}),
    description:x.description.trim(),classification:x.classification,
    references:refs,parameters:params,
    video:{fps:video.fps,durationSeconds:video.durationSeconds,width:video.width,height:video.height,direction}
  };
  return Object.freeze(normalized);
}
/** Canonical serialization shared by compiler and audited model input. */
export function makeMachineConfig(normalized){
  const values=['slider-crank','four-bar'].includes(normalized.mechanism)
    ?{...Object.fromEntries(Object.entries(normalized.parameters).map(([k,v])=>[k,v.value])),
       ...(normalized.mechanism==='four-bar'?{assemblyBranch:normalized.assemblyBranch}:{}),video:normalized.video}
    :{video:normalized.video};
  const prefix=['slider-crank','four-bar'].includes(normalized.mechanism)
    ?'/* Verified typed configuration. No dynamically sourced code. */'
    :'/* Verified film profile, no executable user source. */';
  return prefix+'\nexport const CONFIG=Object.freeze('+JSON.stringify(values,null,2)+');\n';
}
export function compileRequest({request,out}){
  const normalized=validateRequest(request);
  const dest=validatePathLocation(ROOT,out);
  const inputDirectory=join(ROOT,'examples',
    normalized.mechanism==='geneva-4'?'geneva-indexer':normalized.mechanism);
  const paths=['main.js','model.mjs','stage.js'];
  const generated=dest+'.stage-'+process.pid;
  if(existsSync(generated))throw Error('STAGING_ALREADY_EXISTS');
  try{
    mkdirSync(generated,{recursive:true});
    for(const name of paths)copyFileSync(join(inputDirectory,name),join(generated,name));
    // One canonical director is copied, not a second independent recipe engine.
    copyFileSync(join(ROOT,'scripts/film-direction.mjs'),join(generated,'film-direction.mjs'));
    copyFileSync(join(ROOT,'scripts/mechanism-graph.mjs'),join(generated,'mechanism-graph.mjs'));
    copyFileSync(join(ROOT,'scripts/fourbar-solver.mjs'),join(generated,'fourbar-solver.mjs'));
    const graph=makeMechanismGraph(normalized);
    writeFileSync(join(generated,'machine-graph.mjs'),makeGraphModule(graph));
    writeFileSync(join(generated,'mechanism-graph.json'),graphDigestInput(graph));
    const baseCSS=readFileSync(join(ROOT,'examples/geneva-indexer/style.css'),'utf8');
    const css=normalized.mechanism!=='geneva-4'
      ?baseCSS+'\n'+readFileSync(join(inputDirectory,'style.css'),'utf8')
      :baseCSS;
    writeFileSync(join(generated,'style.css'),css);
    writeFileSync(join(generated,'machine-config.mjs'),makeMachineConfig(normalized));
    writeFileSync(join(generated,'request.json'),JSON.stringify(normalized,null,2)+'\n');
    writeFileSync(join(generated,'source-register.json'),JSON.stringify({
      requestId:normalized.id,classification:normalized.classification,
      references:normalized.references,parameters:normalized.parameters,
      modelStatus:'idealized-kinematics',sourcesFetched:false,
      sourceImagesRedistributed:false,physicalCertification:false
    },null,2)+'\n');
    writeFileSync(join(generated,'README.md'),
      '# '+normalized.id+'\n\nGenerated from the reviewed '+normalized.mechanism+
      ' recipe. Input/reference data is in request.json and source-register.json. '+
      'Reference links are evidence metadata only; no download or source interpretation was performed.\n\n'+
      'This illustrative mechanism is not engineering-certified. Run actual model/browser/video gates separately.\n');
    renameSync(generated,dest);
    return {directory:dest,id:normalized.id,mechanism:normalized.mechanism,
      files:13,
      film:normalized.video,sourceCount:normalized.references.length,
      buildVerified:false,renderVerified:false,releaseReady:false};
  }catch(e){rmSync(generated,{recursive:true,force:true});throw e;}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  try{
    const {values}=parseArgs({options:{request:{type:'string'},out:{type:'string'},list:{type:'boolean'}},strict:true});
    if(values.list){console.log(JSON.stringify({mechanisms:Object.keys(PARAMS)}));}
    else if(!values.request||!values.out)throw Error('Usage: node compile-request.mjs --request FILE --out NEW_DIRECTORY');
    else console.log(JSON.stringify(compileRequest({request:JSON.parse(readFileSync(resolve(values.request),'utf8')),out:values.out}),null,2));
  }catch(e){console.error(String(e.message||e));process.exitCode=1;}
}
