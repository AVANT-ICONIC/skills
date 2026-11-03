#!/usr/bin/env node
/** Executed only on prepared, pinned upstream in an ephemeral CI machine. */
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const [upstreamArg,outputArg]=process.argv.slice(2);
if(!upstreamArg||!outputArg)throw Error('Usage: node smoke.mjs PINNED_UPSTREAM OUTPUT_DIRECTORY');
const upstream=path.resolve(upstreamArg),out=path.resolve(outputArg);
mkdirSync(out,{recursive:true});
const html=path.join(out,'dist','geneva-indexer.html');
const report={schema:'avant.mechanism-original-geneva-smoke/1',state:'NOT_EVALUATED',
  environment:{node:process.version,platform:process.platform,cpus:os.cpus().length},
  source:'mechanism-studio/examples/geneva-indexer',
  limitations:[
    'Physical locking cam, contact forces and friction not modeled',
    'Software WebGL CI is not representative of hardware GPU performance',
    'Generated-JS OS-level containment and physical engineering validation not evaluated'
  ],checks:[]};
const digest=data=>createHash('sha256').update(data).digest('hex');
async function check(id,fn){
  const start=Date.now();
  try{const details=await fn();report.checks.push({id,status:'PASS',elapsedMs:Date.now()-start,details});return details;}
  catch(e){report.checks.push({id,status:'FAIL',elapsedMs:Date.now()-start,error:String(e)});throw e;}
}
function run(cmd,args,env={}){
  const r=spawnSync(cmd,args,{cwd:upstream,env:{...process.env,...env},
    encoding:'utf8',timeout:600000,maxBuffer:6*1024*1024});
  if(r.error||r.status!==0)throw Error(cmd+' '+args.join(' ')+' failed: '+String(r.error?.message||r.stderr).slice(-2000));
  return r.stdout||'';
}
try{
  await check('source-build',()=>{
    assert.ok(existsSync(html));
    const data=readFileSync(html);
    assert.ok(data.length>50000,'bundled viewer suspiciously small');
    return {bytes:data.length,sha256:digest(data)};
  });
  const require=createRequire(path.join(upstream,'package.json'));
  const {chromium}=require('playwright');
  const browser=await chromium.launch({headless:true,args:[
    '--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
  ]});
  try{
    const context=await browser.newContext({viewport:{width:1280,height:720},
      deviceScaleFactor:.5,serviceWorkers:'block',acceptDownloads:false});
    const page=await context.newPage(),pageErrors=[],networkRequests=[];
    page.on('pageerror',e=>pageErrors.push(e.message));
    await context.route(/https?:\/\//,route=>{networkRequests.push(route.request().url());return route.abort();});
    await page.addInitScript(()=>{window.__CAPTURE=true;});
    await check('offline-browser-boot',async()=>{
      await page.goto(pathToFileURL(html).href,{waitUntil:'load'});
      await page.waitForFunction(()=>window.SIM?.ready&&window.GENEVA?.snapshot,{timeout:45000});
      const capabilities=await page.evaluate(()=>window.GENEVA.capabilities);
      assert.ok(capabilities.seek&&capabilities.live);
      assert.equal(capabilities.lockingCam,false);
      return {capabilities,networkRequests:networkRequests.length};
    });
    const snapshots={};
    const screenshots=[];
    for(const [name,t] of [['dwell',.4],['engaged',2.5],['indexed',3.8]]){
      await check('frame-'+name,async()=>{
        await page.evaluate(t=>window.SIM.render(t),t);
        const s=await page.evaluate(()=>window.GENEVA.snapshot);
        snapshots[name]=s;
        const shot=await page.screenshot({path:path.join(out,name+'.png'),timeout:90000,animations:'disabled'});
        assert.ok(shot.length>12000,'blank or invalid screenshot');
        screenshots.push({name,t,sha256:digest(shot),bytes:shot.length});
        return {outputAngleDeg:s.outputAngleDeg,engaged:s.engaged,bytes:shot.length};
      });
    }
    await check('kinematic-screen-invariants',()=>{
      assert.equal(snapshots.dwell.dwell,true);
      assert.equal(snapshots.engaged.engaged,true);
      assert.ok(Math.abs(snapshots.engaged.outputAngleDeg+45)<.001);
      assert.ok(Math.abs(snapshots.engaged.contactAlignmentErrorRad)<1e-8);
      assert.equal(snapshots.indexed.dwell,true);
      assert.ok(Math.abs(snapshots.indexed.outputAngleDeg+90)<.001);
      assert.notEqual(screenshots[0].sha256,screenshots[1].sha256);
      assert.notEqual(screenshots[1].sha256,screenshots[2].sha256);
      return screenshots;
    });
    await check('nonsequential-seek-pixel-reproducibility',async()=>{
      await page.evaluate(()=>window.SIM.render(2.5));
      const rerender=await page.screenshot({timeout:90000,animations:'disabled'});
      const s=await page.evaluate(()=>window.GENEVA.snapshot);
      assert.deepEqual(s,snapshots.engaged);
      assert.equal(digest(rerender),screenshots[1].sha256);
      return {sha256:digest(rerender),sameModel:true,samePixels:true};
    });
    await check('operator-controls',async()=>{
      await page.locator('#pause').click();
      await page.evaluate(()=>window.SIM.render(2.5));
      const before=await page.evaluate(()=>window.GENEVA.snapshot.inputTurns);
      await page.locator('#step-forward').click();
      await page.evaluate(()=>window.SIM.render(2.5));
      const after=await page.evaluate(()=>window.GENEVA.snapshot.inputTurns);
      assert.ok(Math.abs(after-before-1/24)<1e-9);
      for(const id of ['top-view','xray','explode']){
        await page.locator('#'+id).click();
        assert.ok(await page.locator('#'+id).evaluate(x=>x.classList.contains('selected')));
      }
      await page.locator('#rpm').evaluate(el=>{el.value='18';el.dispatchEvent(new Event('input',{bubbles:true}));});
      assert.equal(await page.locator('#speed-value').textContent(),'18 RPM');
      await page.evaluate(()=>window.SIM.render(2.5));
      const shot=await page.screenshot({path:path.join(out,'controls.png'),timeout:90000});
      assert.ok(shot.length>12000);
      return {stepTurns:after-before,controls:['step','top-view','xray','explode','rpm']};
    });
    await check('browser-no-exceptions-or-remote-requests',()=>{
      assert.deepEqual(pageErrors,[]);
      assert.deepEqual(networkRequests,[]);
      return {pageErrors:0,remoteRequests:0};
    });
    await context.close();
  }finally{await browser.close();}
  await check('encoded-film',()=>{
    const dest=path.join(out,'geneva-indexer.mp4');
    run('node',['sims/capture.mjs','geneva-indexer',
      '--size','1280x720','--dpr','0.5','--fps','6','--from','0','--to','3',
      '--out',dest],{TEARDOWN_OUT:out});
    const probed=JSON.parse(run('ffprobe',['-v','quiet','-show_streams','-of','json',dest]));
    const stream=probed.streams?.find(s=>s.codec_type==='video');
    assert.equal(stream?.codec_name,'h264');assert.equal(stream.pix_fmt,'yuv420p');
    assert.equal(stream.width,640);assert.equal(stream.height,360);
    assert.equal(Number(stream.nb_frames),18);
    return {bytes:statSync(dest).size,sha256:digest(readFileSync(dest)),frameCount:18,codec:stream.codec_name};
  });
  report.state='PASS';
}catch(e){report.state='FAIL';report.error=String(e.stack||e).slice(0,4000);}
report.checks.push({id:'physical-locking-cam',status:'NOT_EVALUATED',reason:'Not modeled; idealized dwell.'});
report.checks.push({id:'hardware-gpu-and-process-isolation',status:'NOT_EVALUATED',reason:'Ephemeral software GPU is not physical-GPU or OS isolation proof.'});
writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({state:report.state,checks:report.checks.map(c=>({id:c.id,status:c.status})),error:report.error},null,2));
if(report.state!=='PASS')process.exitCode=1;
