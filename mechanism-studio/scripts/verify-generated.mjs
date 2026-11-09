#!/usr/bin/env node
/** Offline-browser and production-profile evidence for reviewed mechanism recipes. */
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,existsSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {writeMechanicalWav} from './audio.mjs';
const [engineArg,dirArg,outArg]=process.argv.slice(2);
if(!engineArg||!dirArg||!outArg)throw Error('Usage: node verify-generated.mjs UPSTREAM GENERATED_DIR OUTPUT_DIR');
const engine=resolve(engineArg),dir=resolve(dirArg),out=resolve(outArg);
mkdirSync(out,{recursive:true});
const request=JSON.parse(readFileSync(join(dir,'request.json'),'utf8'));
const buildRoot=resolve(process.env.MECHANISM_BUILD_OUT||out);
const html=join(buildRoot,'dist',request.id+'.html');
const hash=b=>createHash('sha256').update(b).digest('hex');
const receipt={schema:'avant.machine-generation-evidence/1',
  requestId:request.id,mechanism:request.mechanism,state:'NOT_EVALUATED',film:request.video,
  checks:[],limitations:['Pinned reviewed recipes only, not arbitrary image-to-CAD',
    'Dimensions may be illustrative even when kinematic equations are sourced',
    'Physical force, friction and certified loads NOT_EVALUATED',
    'CI SwiftShader is not a physical GPU, and network interception is not OS sandbox']};
function run(cmd,args,timeoutMs=120000){
 const r=spawnSync(cmd,args,{cwd:engine,encoding:'utf8',
  env:{...process.env,TEARDOWN_OUT:buildRoot},maxBuffer:8*1024*1024,timeout:timeoutMs});
 if(r.error||r.status!==0)throw Error('COMMAND_FAILED '+cmd+': '+String(r.error?.message||r.stderr).slice(-1500));
 return r.stdout||'';
}
async function check(id,fn){
 const start=Date.now();
 try{const detail=await fn();receipt.checks.push({id,status:'PASS',elapsedMs:Date.now()-start,detail});return detail;}
 catch(e){receipt.checks.push({id,status:'FAIL',elapsedMs:Date.now()-start,error:String(e.message||e)});throw e;}
}
try{
 await check('built-trusted-recipe',()=>{
  assert.ok(existsSync(html));
  const bytes=readFileSync(html);
  assert.ok(bytes.length>80000);
  return {bytes:bytes.length,sha256:hash(bytes)};
 });
 const playwright=createRequire(join(engine,'package.json'))('playwright');
 const browser=await playwright.chromium.launch({headless:true,args:[
  '--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
 ]});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:720},
   deviceScaleFactor:.5,serviceWorkers:'block',acceptDownloads:false});
  const page=await context.newPage(),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route(/https?:\/\//,route=>{remote.push(route.request().url());return route.abort();});
  await page.addInitScript(()=>{window.__CAPTURE=true;});
  await check('offline-browser-boot',async()=>{
   await page.goto(pathToFileURL(html).href,{waitUntil:'load'});
   await page.waitForFunction(()=>window.SIM?.ready,{timeout:45000});
   const meta=await page.evaluate(()=>({fps:window.SIM.fps,duration:window.SIM.duration}));
   assert.equal(meta.fps,request.video.fps);assert.equal(meta.duration,request.video.durationSeconds);
   return meta;
  });
  if(['slider-crank','four-bar'].includes(request.mechanism))await check('director-supported-and-live-isolated',async()=>{
    const director=await page.evaluate(kind=>kind==='four-bar'?window.FOURBAR?.director?.active:window.MECHANISM?.director?.active,request.mechanism);
    assert.equal(director,request.video.direction==='cinematic');
    await page.evaluate(kind=>kind==='four-bar'?window.FOURBAR.director.setEnabled(false):window.MECHANISM.director.setEnabled(false),request.mechanism);
    return {filmDirectionRequested:request.video.direction||'technical',directorOriginallyActive:director,liveControlsIsolated:true};
  });
  const getSnapshot=()=>page.evaluate(kind=>kind==='slider-crank'?window.MECHANISM.snapshot:
   kind==='four-bar'?window.FOURBAR.snapshot:window.GENEVA.snapshot,request.mechanism);
  const snapshots={};const shotHashes={};
  for(const t of [0,2,4,6]){
   await check('seek-frame-'+t,async()=>{
    await page.evaluate(t=>window.SIM.render(t),t);
    snapshots[t]=await getSnapshot();
    const img=await page.screenshot({path:join(out,'frame-'+t+'.png'),timeout:90000,animations:'disabled'});
    assert.ok(img.length>16000,'SCREENSHOT_TOO_SMALL');
    shotHashes[t]=hash(img);
    return {bytes:img.length,hash:shotHashes[t]};
   });
  }
  await check('kinematics-source-agreement',async()=>{
   if(request.mechanism==='slider-crank'){
    const r=request.parameters.crankRadiusMm.value;
    assert.ok(Math.abs(snapshots[0].strokeMm)<1e-8);
    assert.ok(Math.abs(snapshots[2].strokeMm-2*r)<1e-8);
    assert.ok(Math.abs(snapshots[4].strokeMm)<1e-8);
   }else if(request.mechanism==='four-bar'){
    for(const t of [0,2,4,6]){
      const s=snapshots[t];
      assert.equal(s.status,'closed');
      assert.ok(Number.isFinite(s.outputAngleRad));
      assert.ok(Math.max(...Object.values(s.residuals))<1e-8);
      assert.equal(s.branch,'open');
    }
    assert.notEqual(snapshots[0].outputAngleRad,snapshots[2].outputAngleRad);
   }else{
    assert.equal(snapshots[0].dwell,true);
    assert.ok(Math.abs(snapshots[2].outputAngleDeg)<90.000001);
   }
   assert.notEqual(shotHashes[0],shotHashes[2]);
   return {distinctFrames:true,independentInvariants:true};
  });
  await check('nonsequential-frame-reproducibility',async()=>{
   await page.evaluate(()=>window.SIM.render(2));
   const snapshot=await getSnapshot();
   assert.deepEqual(snapshot,snapshots[2]);
   const im=await page.screenshot({timeout:90000,animations:'disabled'});
   assert.equal(hash(im),shotHashes[2]);
   return {frame:2,modelIdentical:true,pixelsIdentical:true};
  });
  await check('live-operator-controls',async()=>{
   await page.locator('#pause').click();
   await page.evaluate(()=>window.SIM.render(2));
   const prev=await getSnapshot();
   await page.locator('#step-forward').click();
   await page.evaluate(()=>window.SIM.render(2));
   const next=await getSnapshot();
   const key=request.mechanism==='slider-crank'?'turns':'inputTurns';
   assert.ok(Math.abs(next[key]-prev[key]-1/24)<1e-10);
   for(const id of ['top-view','xray','explode']){
    await page.locator('#'+id).click();
    assert.equal(await page.locator('#'+id).evaluate(el=>el.classList.contains('selected')),true);
   }
   if(request.mechanism==='four-bar'){
      // Branch toggle must change the real output pin, not only a badge.
      await page.locator('#branch-crossed').click();
      await page.evaluate(()=>window.SIM.render(2));
      const crossed=await getSnapshot();
      assert.equal(crossed.branch,'crossed');
      assert.equal(crossed.status,'closed');
      assert.notDeepEqual(crossed.outputPin,next.outputPin);
      assert.equal(await page.locator('#branch-crossed').getAttribute('aria-pressed'),'true');
      await page.locator('#branch-open').click();
      await page.evaluate(()=>window.SIM.render(2));
      const restored=await getSnapshot();
      assert.equal(restored.branch,'open');
   }
   return {stepTurns:1/24,views:['top-view','xray','explode']};
  });
  if(request.mechanism==='slider-crank'&&request.video.width>=1920){
   await check('full-hd-layout-and-legibility',async()=>{
    await page.setViewportSize({width:1920,height:1080});
    await page.evaluate(()=>window.SIM.render(2));
    const layout=await page.evaluate(()=>{
      const box=name=>{
        const r=document.querySelector(name).getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
      };
      return {telemetry:box('.telemetry'),controls:box('.controls'),
        title:box('.titlegroup'),
        headingPixels:parseFloat(getComputedStyle(document.querySelector('.titlegroup h1')).fontSize),
        headerPixels:parseFloat(getComputedStyle(document.querySelector('.telemetry-header')).fontSize)};
    });
    assert.ok(layout.controls.right<layout.telemetry.left-10,'DASHBOARD_OVERLAP');
    assert.ok(layout.title.right<layout.telemetry.left,'TITLE_TELEMETRY_OVERLAP');
    assert.ok(layout.headingPixels>=64,'TITLE_TOO_SMALL');
    assert.ok(layout.headerPixels>=11,'INSTRUMENT_LABELS_TOO_SMALL');
    assert.ok(layout.controls.bottom<=1080&&layout.telemetry.bottom<=1080,'LAYOUT_OFFSCREEN');
    const png=await page.screenshot({path:join(out,'layout-1080.png'),timeout:90000});
    assert.ok(png.length>20000);
    return layout;
   });
  }
  if(['slider-crank','four-bar'].includes(request.mechanism)&&request.video.direction==='cinematic'){
    await check('actual-cinematic-camera-storyboard',async()=>{
      const frames=[0,1.7,3.3,5.1,6.6,7.7],shots=[],hashes=[],strokes=[];
      await page.evaluate(kind=>kind==='four-bar'?window.FOURBAR.director.setEnabled(true):window.MECHANISM.director.setEnabled(true),request.mechanism);
      for(const [i,t] of frames.entries()){
        await page.evaluate(t=>window.SIM.render(t),t);
        const shot=await page.evaluate(kind=>kind==='four-bar'?window.FOURBAR.director.snapshot:window.MECHANISM.director.snapshot,request.mechanism);
        const mechanics=await getSnapshot();
        const motion=request.mechanism==='four-bar'?mechanics.outputAngleRad:mechanics.strokeMm;
        assert.ok(Number.isFinite(motion),'CINEMA_MECHANISM_NONFINITE');
        if(request.mechanism==='four-bar')assert.equal(mechanics.status,'closed');
        strokes.push(motion);
        assert.ok(shot&&shot.frame>=0&&shot.frame<request.video.fps*request.video.durationSeconds);
        assert.equal(shot.shotNumber,i+1,'SHOT_ORDER');
        assert.equal(shot.totalFrames,request.video.fps*request.video.durationSeconds);
        const png=await page.screenshot({path:join(out,'cinematic-'+i+'.png'),timeout:90000,animations:'disabled'});
        assert.ok(png.length>18000,'CINEMA_FRAME_EMPTY');
        shots.push({t,id:shot.shotId,shotNumber:shot.shotNumber,camera:shot.camera,
          exploded:shot.exploded,xray:shot.xray,motionValue:motion,sha256:hash(png)});
        hashes.push(hash(png));
      }
      assert.equal(new Set(hashes).size,6,'CINEMA_SHOTS_NOT_DISTINCT');
      assert.ok(new Set(strokes.map(x=>x.toFixed(3))).size>=4,'CINEMA_MECHANISM_FROZEN');
      if(request.mechanism==='slider-crank')assert.ok(Math.abs(strokes[0])<1e-8,'CINEMA_START_NOT_TOP_DEAD_CENTER');
      await page.evaluate(()=>window.SIM.render(1.7));
      const replay=await page.screenshot({timeout:90000,animations:'disabled'});
      assert.equal(hash(replay),hashes[1],'CINEMA_NONDETERMINISTIC');
      return {shots,repeatFrameIdentical:true,distinctPhysicalPoses:new Set(strokes.map(x=>x.toFixed(3))).size};
    });
  }
  await check('network-and-console-gate',()=>{assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);return{errors,remote};});
  await context.close();
 }finally{await browser.close();}
 // Real high-quality playback profile: frame-addressed source, H264 720p24.
 if(['slider-crank','four-bar'].includes(request.mechanism)){
  await check('full-film-capture',()=>{
   const film=join(out,'film-video-only.mp4');
   const v=request.video;
   const start=Date.now();
   run('node',['sims/capture.mjs',request.id,'--size',v.width+'x'+v.height,
     '--dpr','1','--fps',String(v.fps),'--from','0','--to',String(v.durationSeconds),
     '--crf','18','--out',film],16*60*1000);
   return{bytes:statSync(film).size,sha256:hash(readFileSync(film)),captureMs:Date.now()-start};
  });
  await check('film-decoder-and-decoded-frames',()=>{
   const video=join(out,'film-video-only.mp4');
   const probe=JSON.parse(run('ffprobe',['-v','quiet','-show_streams','-show_format','-of','json',video]));
   const stream=probe.streams?.find(s=>s.codec_type==='video');
   const expected=request.video;
   assert.equal(stream?.codec_name,'h264');assert.equal(stream.pix_fmt,'yuv420p');
   assert.equal(stream.width,expected.width);assert.equal(stream.height,expected.height);
   assert.equal(Number(stream.nb_frames),expected.fps*expected.durationSeconds);
   assert.equal(stream.avg_frame_rate,expected.fps+'/1');
   const names=[];
   for(const second of [0.5,2.5,4.5,6.5]){
    const file=join(out,'decoded-'+second+'.png');
    run('ffmpeg',['-v','error','-ss',String(second),'-i',video,'-frames:v','1','-y',file],120000);
    const buf=readFileSync(file);assert.ok(buf.length>20000,'DECODED_FRAME_EMPTY');
    names.push({second,bytes:buf.length,sha256:hash(buf)});
   }
   assert.ok(new Set(names.map(x=>x.sha256)).size>=3,'FILM_VISUALLY_STATIC');
   return {codec:stream.codec_name,width:stream.width,height:stream.height,frames:stream.nb_frames,fps:stream.avg_frame_rate,decoded:names};
  });
  await check('original-foley-and-final-film-mux',()=>{
   const video=join(out,'film-video-only.mp4');
   const wav=join(out,'original-mechanical-foley.wav');
   const film=join(out,'film.mp4');
   const sound=writeMechanicalWav(wav,{durationSeconds:request.video.durationSeconds,
     inputRpm:request.parameters.inputRpm.value});
   run('ffmpeg',['-v','error','-y','-i',video,'-i',wav,
      '-c:v','copy','-af','volume=8dB','-c:a','aac','-b:a','160k','-ar','48000',
      '-shortest','-movflags','+faststart',film],240000);
   const probe=JSON.parse(run('ffprobe',['-v','quiet','-show_streams','-show_format','-of','json',film]));
   const v=probe.streams?.find(s=>s.codec_type==='video');
   const a=probe.streams?.find(s=>s.codec_type==='audio');
   assert.equal(v?.codec_name,'h264');assert.equal(v.width,request.video.width);assert.equal(v.height,request.video.height);
   assert.equal(Number(v.nb_frames),request.video.fps*request.video.durationSeconds);
   assert.equal(a?.codec_name,'aac');assert.equal(Number(a.sample_rate),48000);
   assert.ok(Number(probe.format?.duration)>=request.video.durationSeconds-.02);
   return {videoBytes:statSync(film).size,sha256:hash(readFileSync(film)),
      audioCodec:a.codec_name,videoCodec:v.codec_name,sourceSound:sound.basis,
      durationSeconds:Number(probe.format.duration)};
  });
 }
 receipt.state='PASS';
}catch(e){receipt.state='FAIL';receipt.error=String(e.stack||e).slice(0,3500);}
receipt.checks.push({id:'physical-gpu',status:'NOT_EVALUATED',reason:'CI uses software GPU'});
receipt.checks.push({id:'host-sandbox',status:'NOT_EVALUATED',reason:'No OS-level containment proof'});
writeFileSync(join(out,'report.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({state:receipt.state,checks:receipt.checks.map(c=>({id:c.id,status:c.status})),error:receipt.error},null,2));
if(receipt.state!=='PASS')process.exitCode=1;
