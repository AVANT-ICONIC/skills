#!/usr/bin/env node
/**
 * Package an already-rendered, pinned Teardown example into a portable
 * INTEROPERABILITY PREVIEW. Does not execute generated JS or fetch/install code.
 */
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {copyFileSync,existsSync,lstatSync,mkdirSync,readFileSync,renameSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

const HERE=dirname(fileURLToPath(import.meta.url));
const PIN=JSON.parse(readFileSync(resolve(HERE,'../upstream.lock.json'),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const VALID_ID=/^[a-z][a-z0-9-]{1,63}$/;
const EXPECTED_CHECKS=[
  'T0.1-pin-and-license','T0.3-build-live-and-film',
  'T0.4-seek-v8-film','T0.4-seek-cessna-film',
  'T0.4-seek-v8-live','T0.4-seek-cessna-live',
  'T0.3-capture-v8-film','T0.3-capture-cessna-film'
];
const FILES=[
  ['viewer/index.html','html'],
  ['video/film.mp4','mp4'],
  ['preview/poster.png','png'],
  ['evidence/benchmark.json','json'],
  ['LICENSES/teardown-MIT.txt','license'],
  ['NOTICE','notice']
];
const ORIGINAL_FILES=[
  ['viewer/index.html','html'],
  ['video/film.mp4','mp4'],
  ['preview/poster.png','png'],
  ['evidence/report.json','json'],
  ['evidence/model.mjs','source'],
  ['evidence/sources.md','text'],
  ['LICENSES/teardown-MIT.txt','license'],
  ['NOTICE','notice']
];
const GENERATED_FILES=[
  ['viewer/index.html','html'],
  ['video/film.mp4','mp4'],
  ['preview/poster.png','png'],
  ['preview/contact-sheet.png','png'],
  ['evidence/report.json','json'],
  ['evidence/request.json','json'],
  ['evidence/source-register.json','json'],
  ['evidence/model-audit.json','json'],
  ['evidence/model.mjs','source'],
  ['LICENSES/teardown-MIT.txt','license'],
  ['NOTICE','notice']
];
function exec(cmd,args,cwd){
  const r=spawnSync(cmd,args,{cwd,encoding:'utf8',timeout:30000,maxBuffer:1000000});
  if(r.error||r.status!==0)throw Error('DEPENDENCY_ERROR: '+cmd+' '+(r.stderr||r.error?.message||'').slice(-500));
  return r.stdout.trim();
}
function regular(path){
  if(!existsSync(path)||!lstatSync(path).isFile())throw Error('INPUT_NOT_REGULAR_FILE: '+path);
  return path;
}
function safePackageFile(root,rel){
  validateRelative(rel);
  if(!lstatSync(root).isDirectory())throw Error('PACKAGE_ROOT_REJECTED');
  let current=root;
  for(const component of rel.split('/').slice(0,-1)){
    current=join(current,component);
    if(!lstatSync(current).isDirectory())throw Error('PACKAGE_DIRECTORY_REJECTED: '+rel);
  }
  return join(root,rel);
}
function checkedDigest(path){
  const buffer=readFileSync(regular(path));return {bytes:buffer.length,sha256:sha(buffer)};
}
function validateRelative(p){
  if(typeof p!=='string'||p.includes('\\')||p.includes('//')||p.startsWith('/')||p.split('/').some(x=>!x||x==='.'||x==='..')||isAbsolute(p))throw Error('PATH_REJECTED: '+p);
  return p;
}
export function verifyPackage(folder){
  const root=resolve(folder);
  const file=regular(join(root,'manifest.json'));
  const m=JSON.parse(readFileSync(file,'utf8'));
  if(m.schema!=='avant.mechanism-package/1'||!['compatibility-preview','original-preview','generated-study-preview'].includes(m.tier))throw Error('SCHEMA_REJECTED');
  const expected=m.tier==='original-preview'?ORIGINAL_FILES:m.tier==='generated-study-preview'?GENERATED_FILES:FILES;
  if(m.tier==='original-preview'&&(m.model?.classification!=='idealized-source-grounded'||m.model?.lockingCam!==false||m.model?.verifiedEngineering!==false))throw Error('MODEL_PROVENANCE_INVALID');
  if(m.tier==='generated-study-preview'&&
    (m.model?.classification!=='reference-grounded'||m.model?.verifiedEngineering!==false))
    throw Error('MODEL_PROVENANCE_INVALID');
  if(!VALID_ID.test(m.packageId))throw Error('PACKAGE_ID_REJECTED');
  if(m.generator?.revision!==PIN.revision||m.generator?.packageLockSha256!==PIN.packageLockSha256)throw Error('UPSTREAM_REJECTED');
  if(!Array.isArray(m.assets)||m.assets.length!==expected.length)throw Error('ASSET_TABLE_INVALID');
  const names=m.assets.map(a=>validateRelative(a.path));
  if(new Set(names).size!==expected.length||expected.some(([name])=>!names.includes(name)))throw Error('ASSET_TABLE_INCOMPLETE');
  for(const item of m.assets){
    const actual=checkedDigest(safePackageFile(root,item.path));
    if(actual.bytes!==item.bytes||actual.sha256!==item.sha256)throw Error('ASSET_HASH_MISMATCH: '+item.path);
  }
  if(m.tier==='generated-study-preview'){
    const request=JSON.parse(readFileSync(safePackageFile(root,'evidence/request.json'),'utf8'));
    const sources=JSON.parse(readFileSync(safePackageFile(root,'evidence/source-register.json'),'utf8'));
    if(request.id!==m.packageId||request.schema!=='avant.mechanism-request/1'||
      !Array.isArray(request.references)||request.references.length<1||
      sources.requestId!==request.id||sources.sourcesFetched!==false||
      sources.physicalCertification!==false||request.mechanism!==m.model.mechanism)
      throw Error('SOURCE_MANIFEST_MISMATCH');
    const modelAudit=JSON.parse(readFileSync(safePackageFile(root,'evidence/model-audit.json'),'utf8'));
    if(modelAudit.schema!=='avant.mechanism-model-audit/1'||modelAudit.requestId!==request.id||
      modelAudit.mechanism!==request.mechanism||modelAudit.status!=='PASS'||
      modelAudit.scientificSourceVerification!=='NOT_EVALUATED'||
      modelAudit.sourceDocumentsRetrieved!==false||modelAudit.certifiedPhysics!==false||
      !Array.isArray(modelAudit.claims)||modelAudit.claims.length<3||
      modelAudit.claims.some(c=>c.status!=='PASS'))
      throw Error('MODEL_AUDIT_MISMATCH');
    if(request.video?.fps!==m.timebase?.fpsNumerator||
      request.video?.durationSeconds*request.video?.fps!==m.timebase?.frameCount||
      request.video?.width!==m.timebase?.width||
      request.video?.height!==m.timebase?.height)
      throw Error('FILM_REQUEST_MISMATCH');
  }
  const required=['viewer','video','poster','evidence'];
  for(const k of required){
    if(!names.includes(m.entrypoints?.[k]))throw Error('ENTRYPOINT_MISSING: '+k);
  }
  if(!Number.isInteger(m.timebase?.frameCount)||m.timebase.frameCount<=0||!Number.isInteger(m.timebase.fpsNumerator)||m.timebase.fpsNumerator<=0||m.timebase.fpsDenominator!==1)throw Error('TIMEBASE_INVALID');
  if(m.releaseReady!==false)throw Error('PREVIEW_MUST_NOT_CLAIM_RELEASE');
  return {packageId:m.packageId,files:names.length,verified:true,releaseReady:false};
}
export function checkProbe(p){
  const v=p.streams?.find(x=>x.codec_type==='video');
  if(!v||v.codec_name!=='h264'||v.pix_fmt!=='yuv420p'||!Number.isInteger(Number(v.nb_frames))||Number(v.nb_frames)<1)throw Error('VIDEO_INVALID');
  const [num,den]=String(v.avg_frame_rate).split('/').map(Number);
  if(!num||!den||!Number.isInteger(num)||!Number.isInteger(den))throw Error('VIDEO_FPS_INVALID');
  return {fpsNumerator:num,fpsDenominator:den,frameCount:Number(v.nb_frames),width:v.width,height:v.height};
}
export function packageExample({upstream,run,machine,out}){
  if(!['v8','cessna'].includes(machine))throw Error('MACHINE_UNSUPPORTED: '+machine);
  const dst=resolve(out),src=resolve(run),engine=resolve(upstream);
  if(dst===src||dst.startsWith(src+'/')||dst===engine||dst.startsWith(engine+'/'))throw Error('OUTPUT_LOCATION_REJECTED');
  if(existsSync(dst))throw Error('OUTPUT_EXISTS: preserving existing package');
  const rev=exec('git',['rev-parse','HEAD'],engine);
  if(rev!==PIN.revision)throw Error('UPSTREAM_PIN_MISMATCH');
  const lock=checkedDigest(join(engine,'package-lock.json'));
  if(lock.sha256!==PIN.packageLockSha256)throw Error('UPSTREAM_LOCK_MISMATCH');
  const upstreamLicense=readFileSync(regular(join(engine,'LICENSE')),'utf8');
  if(!upstreamLicense.includes('MIT License'))throw Error('UPSTREAM_LICENSE_MISSING');
  const report=JSON.parse(readFileSync(regular(join(src,'report.json')),'utf8'));
  if(report.state!=='PASS'||!EXPECTED_CHECKS.every(id=>report.checks?.some(c=>c.id===id&&c.status==='PASS')))throw Error('BENCHMARK_EVIDENCE_INCOMPLETE');
  const video=regular(join(src,machine+'-film.mp4'));
  const p=checkProbe(JSON.parse(exec('ffprobe',['-v','quiet','-show_streams','-of','json',video],engine)));
  const assetInputs={
    'viewer/index.html':regular(join(src,'upstream-dist','dist',machine+'-live.html')),
    'video/film.mp4':video,
    'preview/poster.png':regular(join(src,machine+'-live-1.png')),
    'evidence/benchmark.json':regular(join(src,'report.json'))
  };
  const stage=dst+'.stage-'+process.pid;
  if(existsSync(stage))throw Error('STAGING_EXISTS');
  try{
    mkdirSync(stage,{recursive:true});
    for(const [name] of FILES)mkdirSync(dirname(join(stage,name)),{recursive:true});
    for(const [name,input] of Object.entries(assetInputs))copyFileSync(input,join(stage,name));
    writeFileSync(join(stage,'LICENSES/teardown-MIT.txt'),upstreamLicense);
    writeFileSync(join(stage,'NOTICE'),[
      'Mechanism Studio compatibility preview. Not a production-quality engineering validation.',
      'Upstream: elvarofficial/teardown '+PIN.revision+' (MIT, see LICENSES/teardown-MIT.txt).',
      'Runtime dependencies include Three.js and bundled font resources; check their respective licenses before public redistribution.',
      'Physics values and imagery are illustrative except where independently verified in evidence/benchmark.json.',
      'No external reference images or third-party music are deliberately packed.',
      'WARNING: generated HTML executes JavaScript. Open only trusted examples in an isolated browser.'
    ].join('\n')+'\n');
    const assets=FILES.map(([name])=>({path:name,...checkedDigest(join(stage,name))}));
    const manifest={
      schema:'avant.mechanism-package/1',
      packageId:machine+'-stage0-preview',
      tier:'compatibility-preview',releaseReady:false,
      generator:{name:'teardown',repository:PIN.repository,revision:PIN.revision,packageLockSha256:PIN.packageLockSha256},
      model:{classification:'upstream-example',verifiedEngineering:false},
      timebase:p,
      entrypoints:{viewer:'viewer/index.html',video:'video/film.mp4',poster:'preview/poster.png',evidence:'evidence/benchmark.json'},
      offline:{externalRequestsObserved:0,fullyOfflineUnverified:true},
      limitations:['Short 6 fps CI capture; not final production film','No independent physical GPU benchmark','No process-level sandbox proof','Rights inventory and full visual QA not yet complete'],
      assets
    };
    writeFileSync(join(stage,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
    verifyPackage(stage);
    renameSync(stage,dst);
    return {path:dst,...verifyPackage(dst),video:p};
  }catch(error){rmSync(stage,{recursive:true,force:true});throw error;}
}
function usage(){
  return 'Usage: node scripts/package-example.mjs --upstream PINNED_DIR --run STAGE0_ARTIFACT_DIR --machine v8|cessna --out NEW_DIR';
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  try{
    const {values}=parseArgs({options:{upstream:{type:'string'},run:{type:'string'},machine:{type:'string'},out:{type:'string'},help:{type:'boolean'}},strict:true});
    if(values.help){console.log(usage());process.exitCode=0;}
    else if(!values.upstream||!values.run||!values.machine||!values.out)throw Error(usage());
    else console.log(JSON.stringify(packageExample(values),null,2));
  }catch(error){console.error(String(error.message||error));process.exitCode=1;}
}
