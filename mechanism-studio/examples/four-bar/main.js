import {runSim} from 'teardown-kit/runtime.js';
import {CONFIG} from './machine-config.mjs';
import {evaluateFourBar} from './model.mjs';
import {createFourBarStage} from './stage.js';
import {evaluateFilmDirection} from './film-direction.mjs';

const opts={duration:CONFIG.video.durationSeconds,fps:CONFIG.video.fps,theme:'dark',accent:'#f3ae7a',
 hud:{enabled:false,title:'FOUR BAR / 01',subtitle:'MECHANISM STUDIO'},
 director:{enabled:false},stages:[{at:0,name:'INPUT'},{at:2,name:'COUPLER'},{at:4,name:'ROCKER'},{at:6,name:'CYCLE'}]};
const fmt=(n,d=1)=>Number(n).toFixed(d);
runSim(opts,({canvas,capture})=>{
 const stage=createFourBarStage(canvas);
 const ui=document.createElement('div');ui.id='fourbar-ui';ui.innerHTML=[
  '<header class="topbar"><div class="brandmark"><i></i><strong>AVANT</strong><span>/ MECHANISM STUDIO</span></div><div class="topref">MECHANICAL STUDIES <b>003 / FOUR BAR</b></div></header>',
  '<section class="titlegroup"><div class="eyebrow">KINEMATIC STUDY / MM-003</div><h1>One input.<br><em>Two realities.</em></h1><p>Four rigid links. One closed loop.<br>Two valid assembly branches.</p></section>',
  '<div class="drawing-mark drawing-left">A <span>INPUT CRANK</span></div><div class="drawing-mark drawing-right">B <span>OUTPUT ROCKER</span></div>',
  '<aside class="telemetry"><div class="telemetry-header"><div><span class="detail-dash"></span> LOOP CLOSURE</div><span class="model-tag">IDEAL 2D SOLVER</span></div>',
  '<div class="metric metric-lead"><label>OUTPUT ROCKER ANGLE</label><strong id="output-angle">0.0<span>°</span></strong><small>FROM POSITIVE X AXIS</small></div>',
  '<div class="metrics-two"><div class="metric"><label>CRANK PHASE</label><strong id="input-angle">0<span>°</span></strong></div>',
  '<div class="metric"><label>TRANSMISSION ANGLE</label><strong id="speed-ratio">0<span>°</span></strong></div></div>',
  '<div class="statusbox"><span class="status-led engaged" id="status-led"></span><div><b id="status-name">LOOP CLOSED</b>',
  '<small id="status-help">ALL FOUR PIVOTS COINCIDENT AT JOINTS</small></div><div id="station-count">OPEN</div></div>',
  '<div class="readout-row"><span>INPUT / COUPLER</span><b id="link-one"></b></div>',
  '<div class="readout-row"><span>ROCKER / GROUND</span><b id="link-two"></b></div>',
  '<div class="readout-row"><span>MAX CLOSURE ERROR</span><b id="closure-error">0 mm</b></div>',
  '<div class="angle-chart"><div class="angle-title"><span>ROCKER OUTPUT ANGLE</span><span>ONE INPUT TURN</span></div>',
  '<svg viewBox="0 0 268 90" role="img" aria-label="Four-bar output angle through one crank revolution">',
  '<path class="chart-grid" d="M0 17H268M0 45H268M0 72H268"/><path id="chart-path" class="chart-line" d=""/>',
  '<circle id="chart-dot" class="chart-dot" cx="0" cy="45" r="3"/></svg></div>',
  '<div class="metric-foot">Branch names select opposite circle intersections; not a guarantee of collision-free assembly. Physical forces and link interference not modeled.</div></aside>',
  '<section class="controls"><div class="ctl-header"><span>OPERATOR PANEL</span><span id="play-state">● LIVE</span></div>',
  '<div class="ctl-main"><button id="pause" class="ctl-play" aria-label="Pause or play">Ⅱ</button>',
  '<div class="ctl-speed"><div class="range-head"><span>CRANK SPEED</span><b id="speed-value"></b></div>',
  '<input id="rpm" type="range" min="3" max="60" step="1" aria-label="Input speed in RPM"/></div>',
  '<button id="step-back" class="ctl-btn" title="Step crank backward 15 degrees">−15°</button>',
  '<button id="step-forward" class="ctl-btn" title="Step crank forward 15 degrees">+15°</button></div>',
  '<div class="branch-controls"><span>ASSEMBLY BRANCH</span>',
  '<button id="branch-open" class="selected" aria-pressed="true">OPEN</button>',
  '<button id="branch-crossed" aria-pressed="false">CROSSED</button></div>',
  '<div class="ctl-options"><button id="top-view">TOP VIEW</button><button id="xray">X-RAY</button>',
  '<button id="explode">EXPLODED</button><span>DRAG TO ORBIT · SCROLL TO ZOOM</span></div></section>',
  '<div id="film-director" aria-hidden="true"><span>CINEMATIC MOTION STUDY</span><strong id="film-caption"></strong><small id="film-frame"></small></div>',
  '<div class="footer-note">FOUR-BAR POSITION CLOSURE / LINK LENGTHS ILLUSTRATIVE · SOURCES LINKED, NOT INDEPENDENTLY VERIFIED</div>'
 ].join('');
 document.getElementById('app').appendChild(ui);
 const $=id=>ui.querySelector('#'+id);
 $('link-one').textContent=CONFIG.inputLengthMm+' / '+CONFIG.couplerLengthMm+' mm';
 $('link-two').textContent=CONFIG.outputLengthMm+' / '+CONFIG.groundLengthMm+' mm';
 $('rpm').value=CONFIG.inputRpm;$('speed-value').textContent=CONFIG.inputRpm+' RPM';
 const controls={rpm:CONFIG.inputRpm,paused:false,hold:0,offset:0,
  branch:CONFIG.assemblyBranch,view:'oblique',xray:false,explode:false};
 const film={active:!!capture&&CONFIG.video.direction==='cinematic',last:null};
 let lastTime=0,lastTurns=0,lastState=evaluateFourBar(0);
 let range=[Infinity,-Infinity];
 const samples=Array.from({length:121},(_,i)=>evaluateFourBar(i/120,{branch:CONFIG.assemblyBranch}));
 for(const p of samples)if(p.status==='closed'){
  range[0]=Math.min(range[0],p.outputAngleRad);
  range[1]=Math.max(range[1],p.outputAngleRad);
 }
 function paintPlot(){
  const angles=Array.from({length:121},(_,i)=>evaluateFourBar(i/120,{branch:controls.branch}));
  const low=Math.min(...angles.map(s=>s.outputAngleRad));
  const high=Math.max(...angles.map(s=>s.outputAngleRad)),span=Math.max(1e-8,high-low);
  ui.dataset.plotMin=String(low);ui.dataset.plotMax=String(high);
  $('chart-path').setAttribute('d',angles.map((s,i)=>
   (i?'L':'M')+fmt(268*i/120,2)+' '+fmt(73-56*(s.outputAngleRad-low)/span,2)).join(' '));
 }
 paintPlot();
 function paint(s){
  const ok=s.status==='closed';
  $('output-angle').innerHTML=ok?fmt(s.outputAngleRad*180/Math.PI,1)+'<span>°</span>':'N/A';
  $('input-angle').innerHTML=fmt(((s.inputAngleRad||0)*180/Math.PI%360+360)%360,0)+'<span>°</span>';
  $('speed-ratio').innerHTML=ok?fmt(s.transmissionAngleDeg,1)+'<span>°</span>':'N/A';
  $('status-name').textContent=ok?'LOOP CLOSED':s.status.toUpperCase();
  $('status-help').textContent=ok?'FOUR JOINTS SATISFY LENGTH CONSTRAINTS':(s.reason||'INVALID CONFIGURATION');
  $('status-led').classList.toggle('engaged',ok);
  $('station-count').textContent=s.branch.toUpperCase();
  $('closure-error').textContent=ok?Math.max(...Object.values(s.residuals)).toExponential(1)+' mm':'N/A';
  if(ok){
   const low=Number(ui.dataset.plotMin),high=Number(ui.dataset.plotMax);
   const fraction=Math.max(0,Math.min(1,(s.outputAngleRad-low)/Math.max(1e-8,high-low)));
   $('chart-dot').setAttribute('cx',fmt(268*((s.inputTurns%1+1)%1),2));
   $('chart-dot').setAttribute('cy',fmt(73-56*fraction,2));
  }
 }
 function setBranch(branch){
  if(film.active)return false;
  controls.branch=branch;
  for(const name of ['open','crossed']){
   $('branch-'+name).classList.toggle('selected',name===branch);
   $('branch-'+name).setAttribute('aria-pressed',String(name===branch));
  }
  paintPlot();
  return true;
 }
 $('branch-open').addEventListener('click',()=>setBranch('open'));
 $('branch-crossed').addEventListener('click',()=>setBranch('crossed'));
 $('pause').addEventListener('click',()=>{
  if(!controls.paused){controls.paused=true;controls.hold=lastTurns;}
  else{controls.paused=false;controls.offset=controls.hold-lastTime*controls.rpm/60;}
  $('pause').textContent=controls.paused?'▶':'Ⅱ';
  $('play-state').textContent=controls.paused?'● HOLD':'● LIVE';
 });
 $('rpm').addEventListener('input',e=>{
  const next=Number(e.target.value);
  controls.offset=lastTurns-lastTime*next/60;controls.rpm=next;
  if(controls.paused)controls.hold=lastTurns;
  $('speed-value').textContent=next+' RPM';
 });
 function step(n){
  if(!controls.paused){controls.paused=true;controls.hold=lastTurns;
   $('pause').textContent='▶';$('play-state').textContent='● HOLD';}
  controls.hold+=n/24;
 }
 $('step-back').addEventListener('click',()=>step(-1));
 $('step-forward').addEventListener('click',()=>step(1));
 $('top-view').addEventListener('click',()=>{
  controls.view=controls.view==='top'?'oblique':'top';
  $('top-view').classList.toggle('selected',controls.view==='top');
 });
 for(const id of ['xray','explode'])$(''+id).addEventListener('click',()=>{
  controls[id]=!controls[id];$(id).classList.toggle('selected',controls[id]);
 });
 let pointer=null;
 canvas.addEventListener('pointerdown',e=>{
  pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);
 });
 canvas.addEventListener('pointermove',e=>{
  if(!pointer||e.pointerId!==pointer.id)return;
  stage.setOrbit(.005*(e.clientX-pointer.x),-.004*(e.clientY-pointer.y));
  pointer.x=e.clientX;pointer.y=e.clientY;
 });
 canvas.addEventListener('pointerup',()=>{pointer=null;});
 canvas.addEventListener('pointercancel',()=>{pointer=null;});
 canvas.addEventListener('wheel',e=>{e.preventDefault();stage.setZoom(Math.sign(e.deltaY)*.05);},{passive:false});
 window.FOURBAR={
  get snapshot(){return {...lastState};},
  get capabilities(){return{seek:true,live:true,branchSelection:true,
   cinematicDirection:true,controls:['rpm','pause','step','branch','orbit','zoom','xray','explode']};},
  setBranch,
  director:{get active(){return film.active;},get snapshot(){return film.last?{...film.last}:null;},
   setEnabled(value){film.active=!!value;return film.active;}}
 };
 if(capture)ui.dataset.capture='true';
 return {resize:stage.resize,render(t){
  lastTime=t;
  const turns=film.active?t*CONFIG.inputRpm/60:
   controls.paused?controls.hold:controls.offset+t*controls.rpm/60;
  lastTurns=turns;
  lastState=evaluateFourBar(turns,{branch:film.active?CONFIG.assemblyBranch:controls.branch,
   rpm:film.active?CONFIG.inputRpm:controls.rpm});
  const direction=film.active?evaluateFilmDirection(t,CONFIG.video):null;
  film.last=direction;
  if(lastState.status==='closed')stage.render(lastState,direction?{
   ...controls,filmCamera:direction.camera,xray:direction.xray,explode:direction.exploded}:controls);
  paint(lastState);
  $('film-director').dataset.enabled=direction?'true':'false';
  if(direction){$('film-caption').textContent=direction.caption;
   $('film-frame').textContent=String(direction.frame+1).padStart(3,'0')+' / '+direction.totalFrames;}
  return {stage:lastState.status,rpm:CONFIG.inputRpm,branch:lastState.branch};
 }};
});
