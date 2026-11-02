#!/usr/bin/env node
/**
 * Stage 0 compatibility benchmark for the immutable upstream teardown revision.
 * No clone, install, upstream edit, or automatic network operation.
 */
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,readFileSync,writeFileSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import os from 'node:os';

const PIN=JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../mechanism-studio/upstream.lock.json'),'utf8'));
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

export function nominalRackTravel(teeth=32,moduleMm=4){
  if(!Number.isFinite(teeth)||!Number.isFinite(moduleMm)||teeth<=0||moduleMm<=0) throw new TypeError('positive finite gear parameters required');
  return Math.PI*teeth*moduleMm/2;
}
export function validateUpstream(directory,actualCommit){
  if(!/^[0-9a-f]{40}$/.test(actualCommit)||actualCommit!==PIN.revision) throw new Error('PIN_MISMATCH: expected '+PIN.revision+', got '+actualCommit);
  const f=path.join(directory,'package-lock.json');
  if(!existsSync(f))throw new Error('LOCK_MISSING: package-lock.json');
  const actual=sha256(readFileSync(f));
  if(actual!==PIN.packageLockSha256)throw new Error('LOCK_MISMATCH: expected '+PIN.packageLockSha256+', got '+actual);
  const pkg=JSON.parse(readFileSync(path.join(directory,'package.json'),'utf8'));
  if(pkg.license!=='MIT')throw new Error('LICENSE_MISMATCH: '+pkg.license);
  if(!readFileSync(path.join(directory,'LICENSE'),'utf8').includes('MIT License'))throw new Error('LICENSE_MISSING');
  return {revision:actualCommit,packageLockSha256:actual,license:'MIT'};
}
export function checkVideoProbe(probe,{width,height,fps,frames}){
  const video=probe.streams?.find(s=>s.codec_type==='video');
  if(!video)throw new Error('VIDEO_MISSING: ffprobe found no video stream');
  if(video.codec_name!=='h264'||video.pix_fmt!=='yuv420p')throw new Error('VIDEO_CODEC: H.264 yuv420p expected');
  if(video.width!==width||video.height!==height)throw new Error('VIDEO_SIZE: unexpected dimensions');
  const [n,d]=String(video.avg_frame_rate).split('/').map(Number);
  if(!d||Math.abs(n/d-fps)>0.00001)throw new Error('VIDEO_FPS: unexpected frame rate');
  if(Number(video.nb_frames)!==frames)throw new Error('VIDEO_FRAMES: expected '+frames+', got '+video.nb_frames);
  return {codec:video.codec_name,pixelFormat:video.pix_fmt,width,height,fps,frames};
}
function run(cmd,args,cwd,env={}){
  const result=spawnSync(cmd,args,{cwd,env:{...process.env,...env},encoding:'utf8',maxBuffer:24*1024*1024,timeout:240000});
  if(result.error||result.status!==0)throw new Error('COMMAND_FAILED: '+cmd+' '+args.join(' ')+'\n'+(result.error?.message||'')+'\n'+(result.stderr?.slice(-5000)||'')+'\n'+(result.stdout?.slice(-1500)||''));
  return (result.stdout||'').trim();
}
async function record(report,id,func){
  const start=Date.now();
  try{const details=await func();report.checks.push({id,status:'PASS',elapsedMs:Date.now()-start,details});return details;}
  catch(error){report.checks.push({id,status:'FAIL',elapsedMs:Date.now()-start,error:String(error.message||error)});throw error;}
}
async function inspectPage(browser,html,out,name,isFilm){
  const context=await browser.newContext({viewport:{width:isFilm?1600:800,height:isFilm?900:450},deviceScaleFactor:1,serviceWorkers:'block',acceptDownloads:false});
  const requests=[];
  await context.route(/https?:\/\//,route=>{requests.push(route.request().url());return route.abort();});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__CAPTURE=true;});
  await page.goto(pathToFileURL(html).href,{waitUntil:'load'});
  let surface,times,hashes,deterministic;
  if(isFilm){
    await page.waitForFunction(()=>window.SIM?.ready===true,{timeout:30000});
    surface=await page.evaluate(()=>({duration:window.SIM.duration,fps:window.SIM.fps,renderType:typeof window.SIM.render}));
    if(surface.renderType!=='function')throw new Error(name+': missing SIM.render(t)');
    // Software WebGL on CI cannot sustain the upstream's 4096px shadows and AO.
    // Adjust only observable stage quality, never the physical model or upstream source.
    await page.evaluate(()=>{const stage=window.V8||window.CS;stage?.setQuality?.({samples:0,ao:false,shadow:512});stage?.resize?.(1600,900,0.25);});
    times=[0.5,0,1,0.5];hashes=[];
    for(let i=0;i<times.length;i++){
      await page.evaluate(t=>window.SIM.render(t),times[i]);
      const screenshot=await page.screenshot({path:path.join(out,name+'-'+i+'.png'),timeout:90000,animations:'disabled'});
      hashes.push(sha256(screenshot));
    }
    deterministic=hashes[0]===hashes[3];
  }else{
    // Live pages use their own runLive() loop and do not expose window.SIM.
    await page.waitForFunction(()=>document.querySelector('#gl')&&document.querySelector('.tourchip'),{timeout:30000});
    const controls=await page.evaluate(()=>document.querySelectorAll('.bt,.tb,.hit').length);
    if(controls===0)throw new Error(name+': no live controls');
    surface={renderType:'live-loop',controls};times=['initial','interaction'];hashes=[];deterministic=null;
    await page.waitForTimeout(350);
    hashes.push(sha256(await page.screenshot({path:path.join(out,name+'-0.png')})));
    await page.locator('.bt,.tb,.hit').first().click({timeout:5000});
    hashes.push(sha256(await page.screenshot({path:path.join(out,name+'-1.png')})));
  }
  const gpu=await page.evaluate(()=>{const c=document.querySelector('canvas');const gl=c?.getContext('webgl2');if(!gl)return 'unavailable';const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'masked';}).catch(()=> 'unavailable');
  await context.close();
  if(errors.length)throw new Error(name+': browser exceptions: '+errors.join('; ').slice(0,500));
  if(requests.length)throw new Error(name+': unexpected remote requests: '+requests.slice(0,3).join(', '));
  if(isFilm&&!deterministic)throw new Error(name+': nonsequential seek mismatch '+hashes[0]+' != '+hashes[3]);
  return {surface,gpu,times,hashes,deterministic,blockedExternalRequests:requests.length,images:times.map((_,i)=>name+'-'+i+'.png')};
}
export async function main(args=process.argv.slice(2)){
  if(args.includes('--help')){console.log('Usage: node benchmark.mjs --upstream PATH --output PATH (prepared pinned checkout)');return 0;}
  const get=flag=>args[args.indexOf(flag)+1];
  if(!args.includes('--upstream')||!args.includes('--output')||!get('--upstream')||!get('--output')){console.error('ERROR: --upstream PATH and --output PATH required');return 2;}
  const upstream=path.resolve(get('--upstream')),out=path.resolve(get('--output'));
  mkdirSync(out,{recursive:true});
  const report={schema:'avant.mechanism-upstream-benchmark/1',state:'NOT_EVALUATED',upstream:PIN.repository,revision:PIN.revision,environment:{node:process.version,platform:process.platform,arch:process.arch,cpus:os.cpus().length},checks:[]};
  let status=1;
  try{
    const gitCommit=run('git',['rev-parse','HEAD'],upstream);
    await record(report,'T0.1-pin-and-license',()=>validateUpstream(upstream,gitCommit));
    await record(report,'T0.5-nominal-rack-geometry',()=>{
      const computedMm=nominalRackTravel();
      if(Math.abs(computedMm-201)>0.1)throw new Error('GEOMETRY: rack travel differs from nominal 201mm by >0.1mm');
      return {teeth:32,moduleMm:4,computedMm,nominalMm:201,deviationMm:computedMm-201};
    });
    const dist=path.join(out,'upstream-dist');
    await record(report,'T0.3-build-live-and-film',()=>{
      const stdout=run('node',['sims/build.mjs','v8-live','v8-film','cessna-live','cessna-film'],upstream,{TEARDOWN_OUT:dist});
      const sizes={};
      for(const name of ['v8-live','v8-film','cessna-live','cessna-film']){
        const f=path.join(dist,'dist',name+'.html');
        if(!existsSync(f))throw new Error('HTML_MISSING: '+f);
        sizes[name]={bytes:statSync(f).size,sha256:sha256(readFileSync(f))};
      }
      return {output:stdout.slice(-1200),sizes};
    });
    const playwright=createRequire(path.join(upstream,'package.json'))('playwright');
    const browser=await playwright.chromium.launch({headless:true,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    try{
      for(const [name,film] of [['v8-film',true],['cessna-film',true],['v8-live',false],['cessna-live',false]]){
        await record(report,'T0.4-seek-'+name,()=>inspectPage(browser,path.join(dist,'dist',name+'.html'),out,name,film));
      }
    }finally{await browser.close();}
    for(const name of ['v8-film','cessna-film']){
      await record(report,'T0.3-capture-'+name,()=>{
        const video=path.join(out,name+'.mp4');
        run('node',['sims/capture.mjs',name,'--size','1600x900','--dpr','0.4','--fps','6','--from','0','--to','1','--out',video],upstream,{TEARDOWN_OUT:dist});
        const probe=JSON.parse(run('ffprobe',['-v','quiet','-show_streams','-of','json',video],upstream));
        return {...checkVideoProbe(probe,{width:640,height:360,fps:6,frames:6}),bytes:statSync(video).size,sha256:sha256(readFileSync(video))};
      });
    }
    report.state='PASS';status=0;
  }catch(error){report.state='FAIL';report.error=String(error.message||error).slice(0,4000);}
  report.checks.push({id:'T0.7-integrated-GPU-measurement',status:'NOT_EVALUATED',reason:'Hosted CI is not physical integrated GPU test hardware.'});
  report.checks.push({id:'T0.6-process-isolation',status:'NOT_EVALUATED',reason:'Browser request routing does not provide OS-level network containment.'});
  writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({state:report.state,checks:report.checks.map(x=>({id:x.id,status:x.status})),report:path.join(out,'report.json'),error:report.error},null,2));
  return status;
}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href)process.exitCode=await main();
