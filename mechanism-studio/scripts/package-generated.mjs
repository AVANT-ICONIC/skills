#!/usr/bin/env node
/**
 * Pack a verified source-brief machine after full deterministic capture.
 * No network fetch, installs or arbitrary generated source evaluation.
 */
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {copyFileSync,existsSync,lstatSync,mkdirSync,readFileSync,renameSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyPackage} from './package-example.mjs';
const HERE=dirname(fileURLToPath(import.meta.url));
const PIN=JSON.parse(readFileSync(resolve(HERE,'../upstream.lock.json'),'utf8'));
const hash=data=>createHash('sha256').update(data).digest('hex');
const EXPECTED_CHECKS=[
 'built-trusted-recipe','offline-browser-boot','seek-frame-0','seek-frame-2',
 'seek-frame-4','seek-frame-6','kinematics-source-agreement',
 'nonsequential-frame-reproducibility','live-operator-controls',
 'network-and-console-gate','full-film-capture',
 'film-decoder-and-decoded-frames','original-foley-and-final-film-mux'
];
const FILES=[
 'viewer/index.html','video/film.mp4','preview/poster.png','preview/contact-sheet.png',
 'evidence/report.json','evidence/request.json','evidence/source-register.json',
 'evidence/model.mjs','LICENSES/teardown-MIT.txt','NOTICE'
];
function regular(p){if(!existsSync(p)||!lstatSync(p).isFile())throw Error('INPUT_NOT_REGULAR: '+p);return p;}
function digest(p){const b=readFileSync(regular(p));return {bytes:b.length,sha256:hash(b)};}
function run(cmd,args,cwd,timeout=120000){
 const r=spawnSync(cmd,args,{cwd,encoding:'utf8',timeout,maxBuffer:3*1024*1024});
 if(r.error||r.status!==0)throw Error('COMMAND_FAILED: '+cmd+': '+String(r.error?.message||r.stderr).slice(-700));
 return r.stdout||'';
}
function contactSheet(inputs,output,engine){
 if(![4,6].includes(inputs.length))throw Error('CONTACT_SHEET_COUNT_UNSUPPORTED');
 const names=['a','b','c','d','e','f'].slice(0,inputs.length);
 const args=['-v','error','-y'];
 for(const p of inputs)args.push('-i',p);
 const stack=names.map((n,i)=>'['+i+':v]scale=640:360['+n+']').join(';');
 const layout=inputs.length===6
  ?'0_0|640_0|1280_0|0_360|640_360|1280_360'
  :'0_0|640_0|0_360|640_360';
 const filter=stack+';'+names.map(n=>'['+n+']').join('')+
   'xstack=inputs='+inputs.length+':layout='+layout+'[v]';
 args.push('-filter_complex',filter,'-map','[v]','-frames:v','1',output);
 run('ffmpeg',args,engine);
}
export function packageGenerated({upstream,generated,evidence,build,out}){
 const root=resolve(upstream),src=resolve(generated),ev=resolve(evidence),bld=resolve(build),dest=resolve(out);
 if(existsSync(dest))throw Error('OUTPUT_EXISTS');
 for(const path of [root,src,ev,bld])if(dest===path||dest.startsWith(path+sep))throw Error('OUTPUT_WITHIN_SOURCE_REJECTED');
 if(run('git',['rev-parse','HEAD'],root).trim()!==PIN.revision)throw Error('UPSTREAM_REVISION_REJECTED');
 if(digest(join(root,'package-lock.json')).sha256!==PIN.packageLockSha256)throw Error('UPSTREAM_LOCK_REJECTED');
 const license=readFileSync(regular(join(root,'LICENSE')),'utf8');
 if(!license.includes('MIT License'))throw Error('UPSTREAM_LICENSE_REJECTED');
 const request=JSON.parse(readFileSync(regular(join(src,'request.json')),'utf8'));
 const sources=JSON.parse(readFileSync(regular(join(src,'source-register.json')),'utf8'));
 if(request.id!==sources.requestId||sources.sourcesFetched!==false||sources.physicalCertification!==false)
   throw Error('SOURCING_RECEIPT_INVALID');
 const receipt=JSON.parse(readFileSync(regular(join(ev,'report.json')),'utf8'));
 if(receipt.state!=='PASS'||receipt.requestId!==request.id||receipt.mechanism!==request.mechanism||
   !EXPECTED_CHECKS.every(id=>receipt.checks?.some(x=>x.id===id&&x.status==='PASS')))
   throw Error('FILM_RECEIPT_INCOMPLETE');
 if(request.video.width>=1920&&!receipt.checks.some(x=>x.id==='full-hd-layout-and-legibility'&&x.status==='PASS'))
   throw Error('FULL_HD_LAYOUT_EVIDENCE_MISSING');
 if(request.video.direction==='cinematic'&&!receipt.checks.some(x=>
     x.id==='actual-cinematic-camera-storyboard'&&x.status==='PASS'))
   throw Error('CINEMATIC_FRAME_EVIDENCE_MISSING');
 const film=regular(join(ev,'film.mp4'));
 const streams=JSON.parse(run('ffprobe',['-v','error','-show_streams','-of','json',film],root)).streams;
 const video=streams.find(x=>x.codec_type==='video'),audio=streams.find(x=>x.codec_type==='audio');
 if(video?.codec_name!=='h264'||video.pix_fmt!=='yuv420p'||video.width!==request.video.width||
    video.height!==request.video.height||Number(video.nb_frames)!==request.video.durationSeconds*request.video.fps||
    audio?.codec_name!=='aac'||Number(audio.sample_rate)!==48000)
   throw Error('AV_METADATA_INVALID');
 const stage=dest+'.stage-'+process.pid;
 if(existsSync(stage))throw Error('STAGING_EXISTS');
 try{
  mkdirSync(stage,{recursive:true});
  for(const name of FILES)mkdirSync(dirname(join(stage,name)),{recursive:true});
  const input={
   'viewer/index.html':join(bld,'dist',request.id+'.html'),
   'video/film.mp4':film,
   'preview/poster.png':join(ev,'decoded-2.5.png'),
   'evidence/report.json':join(ev,'report.json'),
   'evidence/request.json':join(src,'request.json'),
   'evidence/source-register.json':join(src,'source-register.json'),
   'evidence/model.mjs':join(src,'model.mjs')
  };
  for(const [target,from] of Object.entries(input))copyFileSync(regular(from),join(stage,target));
  const cinematic=request.video.direction==='cinematic';
  const samples=cinematic
    ?[0,1,2,3,4,5].map(i=>regular(join(ev,'cinematic-'+i+'.png')))
    :[.5,2.5,4.5,6.5].map(t=>regular(join(ev,'decoded-'+t+'.png')));
  contactSheet(samples,join(stage,'preview/contact-sheet.png'),root);
  writeFileSync(join(stage,'LICENSES/teardown-MIT.txt'),license);
  writeFileSync(join(stage,'NOTICE'),[
   'AVANT Mechanism Studio original generated study: '+request.id,
   'Original kinematics template and original synthesized illustrative foley.',
   'Pin: '+PIN.repository+' at '+PIN.revision+'. License in LICENSES.',
   'Physics equations/source URLs are metadata in evidence/source-register.json.',
   'Reference links are NOT fetched, independently verified or bundled.',
   'Numeric dimensions labeled assumed/illustrative are not physical measurements.',
   'No strength/load/friction/thermal/manufacturing or safety certification.',
   'Release status: INTEROPERABILITY AND FILM PREVIEW; hardware GPU and OS isolation NOT_EVALUATED.'
  ].join('\n')+'\n');
  const assets=FILES.map(name=>({path:name,...digest(join(stage,name))}));
  const manifest={
   schema:'avant.mechanism-package/1',packageId:request.id,tier:'generated-study-preview',releaseReady:false,
   generator:{name:'teardown',repository:PIN.repository,revision:PIN.revision,packageLockSha256:PIN.packageLockSha256},
   model:{classification:'reference-grounded',verifiedEngineering:false,mechanism:request.mechanism,
     sourceCount:request.references.length,provenance:'source-register-only-no-remote-retrieval'},
   timebase:{fpsNumerator:request.video.fps,fpsDenominator:1,
     frameCount:request.video.fps*request.video.durationSeconds,
     width:request.video.width,height:request.video.height,
     audio:'original-synthesized-illustrative-aac-48000hz',
     cameraDirection:request.video.direction||'technical'},
   entrypoints:{viewer:'viewer/index.html',video:'video/film.mp4',
     poster:'preview/poster.png',evidence:'evidence/report.json'},
   offline:{remoteRequestsObserved:0,hardwareGpuUnverified:true,hostSandboxUnverified:true},
   limitations:['Illustrative dimensions, not physical certification',
     'No automatic source verification or source imagery transfer',
     'Hardware GPU, real-mobile and host isolation not evaluated'],
   assets
  };
  writeFileSync(join(stage,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  const verified=verifyPackage(stage);
  renameSync(stage,dest);
  return {path:dest,...verified,video:{bytes:statSync(film).size,fps:request.video.fps,
    seconds:request.video.durationSeconds}};
 }catch(e){rmSync(stage,{recursive:true,force:true});throw e;}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 try{
  if(process.argv.length!==7)throw Error('Usage: node package-generated.mjs PINNED_UPSTREAM GENERATED_DIR EVIDENCE_DIR BUILD_ROOT NEW_DIR');
  console.log(JSON.stringify(packageGenerated({
    upstream:process.argv[2],generated:process.argv[3],evidence:process.argv[4],
    build:process.argv[5],out:process.argv[6]
  }),null,2));
 }catch(e){console.error(String(e.message||e));process.exitCode=1;}
}
