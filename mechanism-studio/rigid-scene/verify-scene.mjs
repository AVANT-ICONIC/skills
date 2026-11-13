#!/usr/bin/env node
/** Real browser, controls, exact seeks, decoded video and original audio evidence. */
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {writeMechanicalWav} from '../scripts/audio.mjs';
const [engineArg,generatedArg,buildArg,outArg]=process.argv.slice(2);
if(!engineArg||!generatedArg||!buildArg||!outArg)throw Error('Usage: node verify-scene.mjs PINNED_ENGINE GENERATED_DIR BUILD_ROOT EVIDENCE_DIR');
const engine=resolve(engineArg),generated=resolve(generatedArg),build=resolve(buildArg),out=resolve(outArg);
mkdirSync(out,{recursive:true});const scene=JSON.parse(readFileSync(join(generated,'scene.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const record={schema:'avant.rigid-scene-evidence/1',id:scene.id,state:'NOT_EVALUATED',checks:[],releaseReady:false,
 limitations:['Not physical forces/collision/solid interference','Sources not independently fetched','CI SwiftShader is not a physical GPU','Browser request blocking is not a host sandbox']};
const run=(cmd,args,timeout=240000)=>{const p=spawnSync(cmd,args,{cwd:engine,encoding:'utf8',timeout,maxBuffer:8*1024*1024,env:{...process.env,TEARDOWN_OUT:build}});
 if(p.status!==0||p.error)throw Error('COMMAND_FAILED '+cmd+': '+String(p.error?.message||p.stderr).slice(-1600));return p.stdout||'';};
async function gate(id,callback){try{const detail=await callback();record.checks.push({id,status:'PASS',detail});return detail;}
 catch(e){record.checks.push({id,status:'FAIL',error:String(e.message||e)});throw e;}}
try{
 const html=join(build,'dist',scene.id+'.html');
 await gate('trusted-build-html',()=>{const b=readFileSync(html);assert.ok(b.length>80000);return{sha256:hash(b),bytes:b.length};});
 const browser=await createRequire(join(engine,'package.json'))('playwright').chromium.launch({headless:true,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext({viewport:{width:scene.video.width,height:scene.video.height},deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route(/https?:\/\//,route=>{remote.push(route.request().url());return route.abort();});
  await page.addInitScript(()=>{window.__CAPTURE=true;});
  await gate('chromium-boot',async()=>{await page.goto(pathToFileURL(html).href,{waitUntil:'load'});await page.waitForFunction(()=>window.SIM?.ready&&window.RIGID_SCENE?.snapshot,{timeout:60000});
   const v=await page.evaluate(()=>({fps:SIM.fps,duration:SIM.duration,capabilities:RIGID_SCENE.capabilities}));
   assert.equal(v.fps,scene.video.fps);assert.equal(v.duration,scene.video.durationSeconds);
   assert.equal(v.capabilities.noNamedKinematicSolver,true);return v;});
  const snapshots=[],images=[];const seconds=[0,1,2,3,4,5];
  for(let i=0;i<seconds.length;i++)await gate('physical-pose-'+i,async()=>{
   const t=seconds[i];await page.evaluate(t=>window.SIM.render(t),t);
   const s=await page.evaluate(()=>window.RIGID_SCENE.snapshot);
   assert.equal(s.status,'closed');assert.equal(s.branch,'open');assert.ok(s.closureErrorMm<=1e-7);
   assert.equal(Object.keys(s.poses).length,scene.bodies.length);snapshots.push(s);
   const b=await page.screenshot({path:join(out,'shot-'+i+'.png'),timeout:90000,animations:'disabled'});
   assert.ok(b.length>25000);images.push(hash(b));return{tip:s.tip,error:s.closureErrorMm,sha256:hash(b)};
  });
  await gate('six-unique-physical-poses',()=>{
   const axis=scene.joints.some(j=>j.type==='prismatic')?'x':'y';
   const count=new Set(snapshots.map(s=>s.tip[axis].toFixed(4))).size;
   assert.ok(count>=4,'MECHANISM_POSES_FROZEN_'+axis);
   assert.equal(new Set(images).size,6);
   return{varyingAxis:axis,distinctValues:count};
  });
  if(scene.joints.some(j=>j.type==='prismatic'))await gate('prismatic-rail-and-closure',async()=>{
   const guides=scene.joints.filter(j=>j.type==='prismatic');
   assert.equal(guides.length,1);
   const g=guides[0];
   const transform=(pose,anchor)=>[
     pose[0]+anchor[0]*Math.cos(pose[2])-anchor[1]*Math.sin(pose[2]),
     pose[1]+anchor[0]*Math.sin(pose[2])+anchor[1]*Math.cos(pose[2])
   ];
   for(const snap of snapshots){
     const a=transform(snap.poses[g.a],g.anchorA);
     const b=transform(snap.poses[g.b],g.anchorB);
     const theta=snap.poses[g.a][2],dir=[
       Math.cos(theta)*g.axisA[0]-Math.sin(theta)*g.axisA[1],
       Math.sin(theta)*g.axisA[0]+Math.cos(theta)*g.axisA[1]
     ];
     const lateral=Math.abs((b[0]-a[0])*(-dir[1])+(b[1]-a[1])*dir[0]);
     assert.ok(lateral<1e-6,'RAIL_OFF_AXIS');
     assert.ok(Math.abs(Math.sin(snap.poses[g.b][2]-theta))<1e-6,'RAIL_ROTATION_DRIFT');
   }
   const ui=await page.evaluate(()=>({
      primary:document.querySelector('#tip-y')?.closest('.metric')?.querySelector('label')?.textContent,
      joints:document.querySelector('.readout')?.textContent
   }));
   assert.equal(ui.primary,'SLIDER POSITION / X');
   assert.ok(ui.joints.includes('3 / 1'),'PRISMATIC_JOINT_COUNT_NOT_RENDERED');
   return{guides:guides.length,frames:snapshots.length,axisVerified:true,ui};
  });
  await gate('replay-and-branch-interaction',async()=>{
   await page.evaluate(()=>SIM.render(2));const replay=await page.screenshot({animations:'disabled'});assert.equal(hash(replay),images[2]);
   // Capture-mode film locks branch choice; disable director to exercise live selection.
   await page.evaluate(()=>RIGID_SCENE.director.setEnabled(false));
   await page.locator('#crossed').click();await page.evaluate(()=>SIM.render(2));
   const crossed=await page.evaluate(()=>RIGID_SCENE.snapshot);assert.equal(crossed.branch,'crossed');assert.equal(crossed.status,'closed');
   if(scene.joints.some(j=>j.type==='prismatic')){
     const png=await page.screenshot({path:join(out,'crossed-prismatic.png'),animations:'disabled'});
     assert.notEqual(hash(png),images[2],'PRISMATIC_BRANCH_VISUAL_IDENTICAL');
     assert.equal(await page.locator('#crossed').textContent(),'REVERSED');
   }
   assert.ok(Math.hypot(crossed.tip.x-snapshots[2].tip.x,crossed.tip.y-snapshots[2].tip.y)>20);
   await page.locator('#open').click();await page.evaluate(()=>SIM.render(2));
   assert.equal((await page.evaluate(()=>RIGID_SCENE.snapshot)).branch,'open');
   for(const id of ['top','xray','explode']){await page.locator('#'+id).click();assert.equal(await page.locator('#'+id).evaluate(el=>el.classList.contains('selected')),true);}
   return{repeatedPixelsIdentical:true,differentBranches:true};
  });
  await gate('editorial-no-panel-overlap',async()=>{
   await page.evaluate(()=>{window.RIGID_SCENE.director.setEnabled(true);window.SIM.render(2);});
   const v=await page.evaluate(()=>{
    const bbox=id=>{const r=document.querySelector(id).getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
    return{title:bbox('.title'),eyebrow:bbox('.title .eyebrow'),heading:bbox('.title h1'),description:bbox('.title p'),panel:bbox('.telemetry'),controls:bbox('.controls'),caption:bbox('.film-caption')};});
   assert.ok(v.title.right<v.panel.left);assert.ok(v.controls.right<v.panel.left);
   assert.ok(v.caption.left<v.controls.left&&v.caption.bottom<v.controls.top);
   // Full child positioning matters: a parent box can pass while its content spills sideways.
   assert.ok(Math.abs(v.eyebrow.left-v.title.left)<3,'INTRO_EYEBROW_WRAPPED_IN_COLUMN');
   assert.ok(Math.abs(v.heading.left-v.title.left)<3,'INTRO_HEADING_IN_SECOND_COLUMN');
   assert.ok(Math.abs(v.description.left-v.title.left)<3,'INTRO_COPY_IN_THIRD_COLUMN');
   assert.ok(v.heading.top>=v.eyebrow.bottom-2&&v.description.top>=v.heading.bottom-2,'INTRO_NOT_VERTICALLY_STACKED');
   assert.ok(v.caption.top>=v.description.bottom+8,'FILM_CAPTION_OVERLAPS_DESCRIPTION');
   assert.ok(v.panel.bottom<=scene.video.height);return v;
  });
  await gate('offline-and-errors',()=>{assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);return{pageErrors:errors,remoteRequests:remote};});
  await context.close();
 }finally{await browser.close();}
 await gate('real-full-film',()=>{
  const movie=join(out,'film-video-only.mp4'),v=scene.video;
  run('node',['sims/capture.mjs',scene.id,'--size',v.width+'x'+v.height,'--dpr','1','--fps',String(v.fps),'--from','0','--to',String(v.durationSeconds),'--crf','18','--out',movie],18*60*1000);
  return{bytes:statSync(movie).size,sha256:hash(readFileSync(movie))};
 });
 await gate('decode-and-original-audio',()=>{
  const video=join(out,'film-video-only.mp4'),wav=join(out,'mechanical-foley.wav'),movie=join(out,'film.mp4');
  writeMechanicalWav(wav,{durationSeconds:scene.video.durationSeconds,inputRpm:Math.abs(scene.bodies.find(b=>b.role==='driver').rpm)});
  run('ffmpeg',['-v','error','-y','-i',video,'-i',wav,'-c:v','copy','-af','volume=8dB','-c:a','aac','-b:a','160k','-ar','48000','-shortest','-movflags','+faststart',movie]);
  const probe=JSON.parse(run('ffprobe',['-v','error','-show_format','-show_streams','-of','json',movie]));
  const v=probe.streams.find(x=>x.codec_type==='video'),a=probe.streams.find(x=>x.codec_type==='audio');
  assert.equal(v.codec_name,'h264');assert.equal(v.pix_fmt,'yuv420p');assert.equal(v.width,scene.video.width);assert.equal(v.height,scene.video.height);
  assert.equal(Number(v.nb_frames),scene.video.durationSeconds*scene.video.fps);assert.equal(a.codec_name,'aac');assert.equal(Number(a.sample_rate),48000);
  for(const sec of [0.5,2.5,4.5]){const dest=join(out,'decoded-'+sec+'.png');run('ffmpeg',['-v','error','-ss',String(sec),'-i',movie,'-frames:v','1','-y',dest]);assert.ok(statSync(dest).size>20000);}
  return{sha256:hash(readFileSync(movie)),bytes:statSync(movie).size,frames:v.nb_frames,codec:v.codec_name,audio:a.codec_name};
 });
 record.state='PASS';
}catch(e){record.state='FAIL';record.error=String(e.stack||e).slice(0,3200);}
record.checks.push({id:'hardware-gpu',status:'NOT_EVALUATED'});record.checks.push({id:'host-sandbox',status:'NOT_EVALUATED'});
writeFileSync(join(out,'report.json'),JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({state:record.state,checks:record.checks.map(x=>({id:x.id,status:x.status})),error:record.error},null,2));
if(record.state!=='PASS')process.exitCode=1;
