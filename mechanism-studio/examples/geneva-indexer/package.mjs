#!/usr/bin/env node
/**
 * Package a verified original Geneva CI run using the canonical package
 * verifier. This is a preview exporter, NOT a generic engine or publisher.
 */
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {copyFileSync,existsSync,lstatSync,mkdirSync,readFileSync,renameSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyPackage} from '../../scripts/package-example.mjs';
const HERE=dirname(fileURLToPath(import.meta.url));
const PIN=JSON.parse(readFileSync(resolve(HERE,'../../upstream.lock.json'),'utf8'));
const sha=buf=>createHash('sha256').update(buf).digest('hex');
const FILES=[
  'viewer/index.html','video/film.mp4','preview/poster.png',
  'evidence/report.json','evidence/model.mjs','evidence/sources.md',
  'LICENSES/teardown-MIT.txt','NOTICE'
];
const REQUIRED=[
  'source-build','offline-browser-boot','frame-dwell','frame-engaged',
  'frame-indexed','kinematic-screen-invariants',
  'nonsequential-seek-pixel-reproducibility','operator-controls',
  'browser-no-exceptions-or-remote-requests','encoded-film'
];
function regular(p){
  if(!existsSync(p)||!lstatSync(p).isFile())throw Error('INPUT_INVALID: '+p);
  return p;
}
function cmd(exe,args,cwd){
  const p=spawnSync(exe,args,{cwd,encoding:'utf8',maxBuffer:3*1024*1024,timeout:30000});
  if(p.error||p.status!==0)throw Error('COMMAND_FAILED: '+exe+' '+String(p.error?.message||p.stderr).slice(-400));
  return (p.stdout||'').trim();
}
function digestFile(p){const b=readFileSync(regular(p));return {bytes:b.length,sha256:sha(b)};}
export function packageGeneva({upstream,run,out}){
  const engine=resolve(upstream),src=resolve(run),dst=resolve(out);
  if(existsSync(dst))throw Error('OUTPUT_EXISTS: refusing to overwrite verified or unverified output');
  if(dst===src||dst.startsWith(src+sep)||dst===engine||dst.startsWith(engine+sep))throw Error('OUTPUT_LOCATION_REJECTED');
  if(cmd('git',['rev-parse','HEAD'],engine)!==PIN.revision)throw Error('PIN_MISMATCH');
  if(digestFile(join(engine,'package-lock.json')).sha256!==PIN.packageLockSha256)throw Error('DEPENDENCY_LOCK_MISMATCH');
  const license=readFileSync(regular(join(engine,'LICENSE')),'utf8');
  if(!license.includes('MIT License'))throw Error('UPSTREAM_LICENSE_MISSING');
  const report=JSON.parse(readFileSync(regular(join(src,'report.json')),'utf8'));
  if(report.state!=='PASS'||!REQUIRED.every(id=>report.checks?.some(x=>x.id===id&&x.status==='PASS')))
    throw Error('RUNTIME_EVIDENCE_INCOMPLETE');
  const video=regular(join(src,'geneva-indexer.mp4'));
  const probe=JSON.parse(cmd('ffprobe',['-v','quiet','-show_streams','-of','json',video],engine));
  const stream=probe.streams?.find(x=>x.codec_type==='video');
  if(!stream||stream.codec_name!=='h264'||stream.pix_fmt!=='yuv420p'||Number(stream.nb_frames)!==18)
    throw Error('VIDEO_EVIDENCE_INVALID');
  const outputs={
    'viewer/index.html':join(src,'dist','geneva-indexer.html'),
    'video/film.mp4':video,
    'preview/poster.png':join(src,'engaged.png'),
    'evidence/report.json':join(src,'report.json'),
    'evidence/model.mjs':join(HERE,'model.mjs'),
    'evidence/sources.md':join(HERE,'README.md')
  };
  const staging=dst+'.stage-'+process.pid;
  if(existsSync(staging))throw Error('STAGING_EXISTS');
  try{
    mkdirSync(staging,{recursive:true});
    for(const relative of FILES)mkdirSync(dirname(join(staging,relative)),{recursive:true});
    for(const [relative,input] of Object.entries(outputs))copyFileSync(regular(input),join(staging,relative));
    writeFileSync(join(staging,'LICENSES/teardown-MIT.txt'),license);
    writeFileSync(join(staging,'NOTICE'),[
      'Original AVANT Mechanism Studio Geneva Indexer, idealized kinematic visualization.',
      'Generated with pinned elvarofficial/teardown '+PIN.revision+'.',
      'Teardown source MIT license: LICENSES/teardown-MIT.txt.',
      'Reference-grounding: evidence/sources.md. The output does not embed their diagrams.',
      'Locking cam, dynamic loads, friction, wear and manufacturing validation not modeled.',
      'Three.js and bundled font library licensing requires final distribution review.',
      'Offline browser code is executable JS: only open trusted generated pages.'
    ].join('\n')+'\n');
    const assets=FILES.map(p=>({path:p,...digestFile(join(staging,p))}));
    const manifest={
      schema:'avant.mechanism-package/1',packageId:'geneva-indexer-original-preview',
      tier:'original-preview',releaseReady:false,
      generator:{name:'teardown',repository:PIN.repository,revision:PIN.revision,packageLockSha256:PIN.packageLockSha256},
      model:{classification:'idealized-source-grounded',lockingCam:false,verifiedEngineering:false,slots:4,
        inputCrankRadiusMm:30,centerDistanceMm:30/Math.sin(Math.PI/4),outputStepDeg:90,dwellFraction:.75},
      timebase:{fpsNumerator:6,fpsDenominator:1,frameCount:18,width:stream.width,height:stream.height},
      entrypoints:{viewer:'viewer/index.html',video:'video/film.mp4',poster:'preview/poster.png',evidence:'evidence/report.json'},
      offline:{remoteRequestsObserved:0,fullyOfflineUnverified:true},
      limitations:['Preview capture at 6 fps; not a production film','Positive locking cam not modeled',
        'Physical integrated GPU and process-level sandbox not verified'],
      assets
    };
    writeFileSync(join(staging,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
    const receipt=verifyPackage(staging);
    renameSync(staging,dst);
    return {path:dst,...receipt,videoBytes:statSync(video).size};
  }catch(e){rmSync(staging,{recursive:true,force:true});throw e;}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  try{
    if(process.argv.length!==5)throw Error('Usage: node package.mjs PINNED_UPSTREAM GENEVA_CI_DIR NEW_OUTPUT_DIR');
    console.log(JSON.stringify(packageGeneva({upstream:process.argv[2],run:process.argv[3],out:process.argv[4]}),null,2));
  }catch(e){console.error(String(e.message||e));process.exitCode=1;}
}
