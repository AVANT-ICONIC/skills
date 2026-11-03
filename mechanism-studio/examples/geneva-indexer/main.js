import {runSim} from 'teardown-kit/runtime.js';
import {createGenevaStage} from './stage.js';
import {DEG,GENEVA,evaluateGeneva} from './model.mjs';

/** One authored model for both interactive HTML and arbitrary-time film. */
const DEFAULTS={
  duration:8,fps:30,theme:'dark',accent:'#f2a56a',
  hud:{enabled:false,title:'GENEVA / 04',subtitle:'MECHANISM STUDIO'},
  director:{enabled:false},
  stages:[{at:0,name:'DWELL'},{at:1.88,name:'ENTER'},{at:2.5,name:'INDEX'},{at:3.13,name:'EXIT'}]
};
const fmt=(v,d=1)=>Number(v).toFixed(d);
runSim(DEFAULTS,({canvas,capture})=>{
  const stage=createGenevaStage(canvas);
  const ui=document.createElement('div');ui.id='geneva-ui';
  ui.innerHTML=[
    '<header class="topbar"><div class="brandmark"><i></i><strong>AVANT</strong><span>/ MECHANISM STUDIO</span></div><div class="topref">MECHANICAL STUDIES <b>001 / GENEVA</b></div></header>',
    '<section class="titlegroup"><div class="eyebrow">KINEMATIC STUDY / MM-001</div><h1>Motion,<br><em>Interrupted.</em></h1><p>A continuous crank. Four precise stations.<br>One remarkably elegant mechanical pause.</p></section>',
    '<div class="drawing-mark drawing-left">A <span>DRIVER / 360°</span></div><div class="drawing-mark drawing-right">B <span>OUTPUT / 90°</span></div>',
    '<aside class="telemetry"><div class="telemetry-header"><div><span class="detail-dash"></span> LIVE KINEMATICS</div><span class="model-tag">IDEALIZED MODEL</span></div>',
    '<div class="metric metric-lead"><label>OUTPUT ROTATION</label><strong id="output-angle">0.0<span>°</span></strong><small>FOUR-STATION GENEVA WHEEL</small></div>',
    '<div class="metrics-two"><div class="metric"><label>INPUT PHASE</label><strong id="input-angle">180<span>°</span></strong></div><div class="metric"><label>SPEED RATIO</label><strong id="speed-ratio">0.00<span>×</span></strong></div></div>',
    '<div class="statusbox"><span class="status-led" id="status-led"></span><div><b id="status-name">DWELL / HELD*</b><small id="status-help">IDEALIZED INDEX HOLD</small></div><div id="station-count">01 / 04</div></div>',
    '<div class="readout-row"><span>INDEX / CYCLE</span><b>90.00°</b></div><div class="readout-row"><span>DRIVER DWELL</span><b>75.0%</b></div><div class="readout-row"><span>CENTER DISTANCE</span><b>42.43 mm</b></div>',
    '<div class="angle-chart"><div class="angle-title"><span>OUTPUT DISPLACEMENT</span><span>1 REVOLUTION</span></div><svg viewBox="0 0 268 90" role="img" aria-label="Four-slot Geneva indexing displacement graph"><path class="chart-grid" d="M0 17H268M0 45H268M0 72H268"/><path id="chart-path" class="chart-line" d=""/><circle id="chart-dot" class="chart-dot" cx="0" cy="74" r="3"/></svg></div>',
    '<div class="metric-foot">* Dwell imposed by an ideal kinematic constraint. Physical locking cam not modeled.</div></aside>',
    '<section class="controls"><div class="ctl-header"><span>OPERATOR PANEL</span><span id="play-state">● LIVE</span></div>',
    '<div class="ctl-main"><button id="pause" class="ctl-play" aria-label="Pause or play">Ⅱ</button><div class="ctl-speed"><div class="range-head"><span>DRIVER SPEED</span><b id="speed-value">12 RPM</b></div>',
    '<input id="rpm" type="range" min="3" max="30" value="12" step="1" aria-label="Driver speed in revolutions per minute"/></div>',
    '<button id="step-back" class="ctl-btn" title="Step backward 15 degrees">−15°</button><button id="step-forward" class="ctl-btn" title="Step forward 15 degrees">+15°</button></div>',
    '<div class="ctl-options"><button id="top-view">TOP VIEW</button><button id="xray">X-RAY</button><button id="explode">EXPLODED</button><span>DRAG TO ORBIT · SCROLL TO ZOOM</span></div></section>',
    '<div class="footer-note">SOURCE / IDEAL EXTERNAL GENEVA KINEMATICS · ILLUSTRATIVE GEOMETRY · NOT ENGINEERING CERTIFICATION</div>'
  ].join('');
  document.getElementById('app').appendChild(ui);
  const $=id=>ui.querySelector('#'+id);
  const ctl={rpm:GENEVA.inputRpm,offset:-.5,paused:false,hold:-.5,view:'oblique',xray:false,explode:false};
  let lastTime=0,lastTurns=-.5,lastState=evaluateGeneva(-.5);
  const points=[];
  for(let i=0;i<=180;i++){
    const inputTurns=-.5+i/180;
    const output=evaluateGeneva(inputTurns).outputAngleRad;
    const x=i/180*268,y=74+output/(Math.PI/2)*53;
    points.push((i?'L':'M')+fmt(x,2)+' '+fmt(y,2));
  }
  $('chart-path').setAttribute('d',points.join(' '));
  function updateReadouts(s){
    $('input-angle').innerHTML=fmt(((s.phaseRad*DEG)%360+360)%360,0)+'<span>°</span>';
    $('output-angle').innerHTML=fmt(s.outputAngleDeg,1)+'<span>°</span>';
    $('speed-ratio').innerHTML=fmt(Math.abs(s.speedRatio),2)+'<span>×</span>';
    $('status-name').textContent=s.engaged?'INDEXING / ENGAGED':'DWELL / HELD*';
    $('status-help').textContent=s.engaged?'PIN DRIVING THE RADIAL SLOT':'OUTPUT STATIONARY (IDEAL)';
    $('status-led').classList.toggle('engaged',s.engaged);
    $('station-count').textContent=String(((s.completedSteps%4)+4)%4+1).padStart(2,'0')+' / 04';
    const rel=((s.inputTurns+.5)%1+1)%1;
    const baseCycle=Math.floor(s.inputTurns+.5);
    const cx=268*rel,cy=74+(s.outputAngleRad+baseCycle*Math.PI/2)/(Math.PI/2)*53;
    $('chart-dot').setAttribute('cx',fmt(cx,2));$('chart-dot').setAttribute('cy',fmt(cy,2));
  }
  function select(btn,field){ctl[field]=!ctl[field];$(btn).classList.toggle('selected',ctl[field]);}
  $('pause').addEventListener('click',()=>{
    if(!ctl.paused){ctl.paused=true;ctl.hold=lastTurns;}
    else{ctl.paused=false;ctl.offset=ctl.hold-lastTime*ctl.rpm/60;}
    $('pause').textContent=ctl.paused?'▶':'Ⅱ';
    $('play-state').textContent=ctl.paused?'● HOLD':'● LIVE';
  });
  $('rpm').addEventListener('input',e=>{
    const n=Number(e.target.value);
    ctl.offset=lastTurns-lastTime*n/60;ctl.rpm=n;
    if(ctl.paused)ctl.hold=lastTurns;
    $('speed-value').textContent=n+' RPM';
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
  $('xray').addEventListener('click',()=>select('xray','xray'));
  $('explode').addEventListener('click',()=>select('explode','explode'));
  let mouse=null;
  canvas.addEventListener('pointerdown',e=>{
    mouse={x:e.clientX,y:e.clientY,id:e.pointerId};
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!mouse||mouse.id!==e.pointerId)return;
    stage.setOrbit((e.clientX-mouse.x)*.005,(e.clientY-mouse.y)*-.004);
    mouse.x=e.clientX;mouse.y=e.clientY;
  });
  canvas.addEventListener('pointerup',()=>{mouse=null;});
  canvas.addEventListener('pointercancel',()=>{mouse=null;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();stage.setZoom(Math.sign(e.deltaY)*.045);},{passive:false});
  window.GENEVA={
    get snapshot(){return {...lastState};},
    get capabilities(){return {seek:true,live:true,controls:['rpm','hold','step','orbit','zoom','xray','explode'],lockingCam:false};}
  };
  if(capture)ui.dataset.capture='true';
  return {
    resize:stage.resize,
    render(t){
      lastTime=t;
      const turns=ctl.paused?ctl.hold:ctl.offset+t*ctl.rpm/60;
      lastTurns=turns;
      const state=evaluateGeneva(turns);
      lastState=state;
      stage.render(state,ctl);
      updateReadouts(state);
      return {stage:state.engaged?'INDEX':'DWELL',rpm:ctl.rpm};
    }
  };
});
