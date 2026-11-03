import {runSim} from 'teardown-kit/runtime.js';
import {CONFIG} from './machine-config.mjs';
import {stateAtTime,evaluateSliderCrank} from './model.mjs';
import {createSliderStage} from './stage.js';

const format=(x,n=1)=>x.toFixed(n);
const DEFAULTS={duration:8,fps:24,theme:'dark',accent:'#ffab76',
  hud:{enabled:false,title:'SLIDER CRANK / 01',subtitle:'MECHANISM STUDIO'},
  director:{enabled:false},
  stages:[{at:0,name:'TDC'},{at:1,name:'POWER / OUT'},{at:2,name:'BDC'},{at:3,name:'RETURN'}]};
runSim(DEFAULTS,({canvas,capture})=>{
 const scene=createSliderStage(canvas);
 const ui=document.createElement('div');ui.id='geneva-ui';
 ui.innerHTML=[
  '<header class="topbar"><div class="brandmark"><i></i><strong>AVANT</strong><span>/ MECHANISM STUDIO</span></div><div class="topref">MECHANICAL STUDIES <b>002 / SLIDER CRANK</b></div></header>',
  '<section class="titlegroup"><div class="eyebrow">KINEMATIC STUDY / MM-002</div><h1>Rotary.<br><em>Linear.</em></h1><p>A rotating crank transformed into<br>reciprocating linear motion.</p></section>',
  '<div class="drawing-mark drawing-left">A <span>DRIVER / CRANK</span></div><div class="drawing-mark drawing-right">B <span>SLIDER / STROKE</span></div>',
  '<aside class="telemetry"><div class="telemetry-header"><div><span class="detail-dash"></span> LIVE KINEMATICS</div><span class="model-tag">IDEAL MODEL</span></div>',
  '<div class="metric metric-lead"><label>PISTON DISPLACEMENT</label><strong id="output-angle">0.0<span> mm</span></strong><small>RELATIVE TO OUTER DEAD CENTER</small></div>',
  '<div class="metrics-two"><div class="metric"><label>CRANK PHASE</label><strong id="input-angle">0<span>°</span></strong></div>',
  '<div class="metric"><label>PISTON SPEED</label><strong id="speed-ratio">0.0<span> mm/s</span></strong></div></div>',
  '<div class="statusbox"><span class="status-led" id="status-led"></span><div><b id="status-name">TOP DEAD CENTER</b>',
  '<small id="status-help">CRANK EXTENDED · ZERO VELOCITY</small></div><div id="station-count">TDC</div></div>',
  '<div class="readout-row"><span>TOTAL STROKE</span><b id="stroke-range"></b></div>',
  '<div class="readout-row"><span>CRANK RADIUS</span><b id="crank-radius"></b></div>',
  '<div class="readout-row"><span>CONNECTING ROD</span><b id="rod-length"></b></div>',
  '<div class="angle-chart"><div class="angle-title"><span>PISTON DISPLACEMENT</span><span>ONE ROTATION</span></div>',
  '<svg viewBox="0 0 268 90" role="img" aria-label="Piston displacement through one crank revolution">',
  '<path class="chart-grid" d="M0 17H268M0 45H268M0 72H268"/>',
  '<path id="chart-path" class="chart-line" d=""/>',
  '<circle id="chart-dot" class="chart-dot" cx="0" cy="17" r="3"/></svg></div>',
  '<div class="metric-foot">Ideal in-line geometry only. No combustion, friction, acceleration load or force simulation.</div></aside>',
  '<section class="controls"><div class="ctl-header"><span>OPERATOR PANEL</span><span id="play-state">● LIVE</span></div>',
  '<div class="ctl-main"><button id="pause" class="ctl-play" aria-label="Pause or play">Ⅱ</button>',
  '<div class="ctl-speed"><div class="range-head"><span>CRANK SPEED</span><b id="speed-value"></b></div>',
  '<input id="rpm" type="range" min="3" max="60" step="1" aria-label="Crank speed in RPM"/></div>',
  '<button id="step-back" class="ctl-btn" title="Step crank backward 15 degrees">−15°</button>',
  '<button id="step-forward" class="ctl-btn" title="Step crank forward 15 degrees">+15°</button></div>',
  '<div class="ctl-options"><button id="top-view">TOP VIEW</button><button id="xray">X-RAY</button>',
  '<button id="explode">EXPLODED</button><span>DRAG TO ORBIT · SCROLL TO ZOOM</span></div></section>',
  '<div class="footer-note">SOURCE / EXACT IDEAL IN-LINE SLIDER-CRANK GEOMETRY · NUMERICAL INPUTS ARE ILLUSTRATIVE</div>'
 ].join('');
 document.getElementById('app').appendChild(ui);
 const $=id=>ui.querySelector('#'+id);
 $('stroke-range').textContent=format(2*CONFIG.crankRadiusMm)+' mm';
 $('crank-radius').textContent=format(CONFIG.crankRadiusMm)+' mm';
 $('rod-length').textContent=format(CONFIG.rodLengthMm)+' mm';
 $('rpm').value=CONFIG.inputRpm;$('speed-value').textContent=CONFIG.inputRpm+' RPM';
 const chart=[];
 for(let i=0;i<=180;i++){
   const s=evaluateSliderCrank(i/180);
   chart.push((i?'L':'M')+format(268*i/180,2)+' '+format(17+55*s.strokeMm/(2*CONFIG.crankRadiusMm),2));
 }
 $('chart-path').setAttribute('d',chart.join(' '));
 const ctl={rpm:CONFIG.inputRpm,offset:0,hold:0,paused:false,view:'oblique',xray:false,explode:false};
 let lastTime=0,lastTurns=0,lastState=stateAtTime(0);
 function paint(s){
  $('output-angle').innerHTML=format(s.strokeMm,1)+'<span> mm</span>';
  $('input-angle').innerHTML=format(s.phaseDeg,0)+'<span>°</span>';
  $('speed-ratio').innerHTML=format(Math.abs(s.velocityMmS),1)+'<span> mm/s</span>';
  const dead=Math.abs(s.velocityMmS)<.2;
  $('status-name').textContent=dead?(s.strokeMm<CONFIG.crankRadiusMm?'TOP DEAD CENTER':'BOTTOM DEAD CENTER'):
    (s.velocityMmS<0?'PISTON / OUTWARD':'PISTON / RETURN');
  $('status-help').textContent=dead?'VELOCITY APPROACHES ZERO':'CRANK AND ROD ARE ENGAGED';
  $('status-led').classList.toggle('engaged',!dead);
  $('station-count').textContent=dead?'DEAD CTR':'IN MOTION';
  $('chart-dot').setAttribute('cx',format(268*((s.turns%1+1)%1),2));
  $('chart-dot').setAttribute('cy',format(17+55*s.strokeMm/(2*CONFIG.crankRadiusMm),2));
 }
 function activate(btn,name){ctl[name]=!ctl[name];$(btn).classList.toggle('selected',ctl[name]);}
 $('pause').addEventListener('click',()=>{
  if(!ctl.paused){ctl.paused=true;ctl.hold=lastTurns;}
  else{ctl.paused=false;ctl.offset=ctl.hold-lastTime*ctl.rpm/60;}
  $('pause').textContent=ctl.paused?'▶':'Ⅱ';$('play-state').textContent=ctl.paused?'● HOLD':'● LIVE';
 });
 $('rpm').addEventListener('input',event=>{
  const next=Number(event.target.value);
  ctl.offset=lastTurns-lastTime*next/60;ctl.rpm=next;
  if(ctl.paused)ctl.hold=lastTurns;
  $('speed-value').textContent=next+' RPM';
 });
 function step(n){
  if(!ctl.paused){ctl.paused=true;ctl.hold=lastTurns;$('pause').textContent='▶';$('play-state').textContent='● HOLD';}
  ctl.hold+=n/24;
 }
 $('step-back').addEventListener('click',()=>step(-1));
 $('step-forward').addEventListener('click',()=>step(1));
 $('top-view').addEventListener('click',()=>{
  ctl.view=ctl.view==='top'?'oblique':'top';
  $('top-view').classList.toggle('selected',ctl.view==='top');
 });
 $('xray').addEventListener('click',()=>activate('xray','xray'));
 $('explode').addEventListener('click',()=>activate('explode','explode'));
 let drag=null;
 canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  scene.setOrbit((e.clientX-drag.x)*.005,-(e.clientY-drag.y)*.004);drag.x=e.clientX;drag.y=e.clientY;
 });
 canvas.addEventListener('pointerup',()=>{drag=null;});
 canvas.addEventListener('pointercancel',()=>{drag=null;});
 canvas.addEventListener('wheel',e=>{e.preventDefault();scene.setZoom(Math.sign(e.deltaY)*.05);},{passive:false});
 window.MECHANISM={
  get snapshot(){return {...lastState};},
  get capabilities(){return {seek:true,live:true,source:'slider-crank',controls:['rpm','pause','step','orbit','zoom','xray','explode']};}
 };
 if(capture)ui.dataset.capture='true';
 return {
  resize:scene.resize,
  render(t){
   lastTime=t;
   const turns=ctl.paused?ctl.hold:ctl.offset+t*ctl.rpm/60;
   lastTurns=turns;lastState=evaluateSliderCrank(turns,{...CONFIG,inputRpm:ctl.rpm});
   scene.render(lastState,ctl);paint(lastState);
   return {stage:'CRANK',rpm:ctl.rpm,strokeMm:lastState.strokeMm};
  }
 };
});
