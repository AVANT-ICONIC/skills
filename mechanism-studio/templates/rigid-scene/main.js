/** Data-only multi-body assembly viewer; not a mechanism-specific renderer. */
import {runSim} from 'teardown-kit/runtime.js';
import {SCENE,evaluateAtTime} from './model.mjs';
import {createRigidSceneStage} from './stage.js';
import {evaluateFilmDirection} from './film-direction.mjs';
const video=SCENE.video;
runSim({duration:video.durationSeconds,fps:video.fps,theme:'dark',accent:'#dda37c',
 hud:{enabled:false,title:'GENERIC RIGID SCENE',subtitle:'MECHANISM STUDIO'},
 director:{enabled:false},stages:[{at:0,name:'INTRO'},{at:2,name:'CLOSURE'},{at:4,name:'JOINTS'}]},({canvas,capture})=>{
 const stage=createRigidSceneStage(canvas,SCENE),ui=document.createElement('div');ui.id='ui';
 const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const words=SCENE.title.split('. '),title=words.length===2?escape(words[0])+'.<br><em>'+escape(words[1])+'</em>':escape(SCENE.title);
 ui.innerHTML=`<header><div class="brand"><i></i><b>AVANT</b><span>/ MECHANISM STUDIO</span></div><strong>SE(2) JOINT GRAPH / ${SCENE.id.split('-').at(-1)}</strong></header>
 <section class="title"><div class="eyebrow">${SCENE.subtitle.replaceAll('<','&lt;')}</div><h1>${title}</h1><p>Geometry from declarative rigid joints.<br>No mechanism-specific pose equation.</p></section>
 <aside class="telemetry"><div class="head">LIVE CONSTRAINTS <b>GRAPH SOLVER</b></div><div class="metric"><label>END EFFECTOR / Y</label><strong id="tip-y">0.0 <small>mm</small></strong></div>
 <div class="pair"><div><label>END EFFECTOR / X</label><strong id="tip-x">0.0</strong></div><div><label>ASSEMBLY BRANCH</label><strong id="branch-label">OPEN</strong></div></div>
 <div class="readout"><span>REVOLUTE JOINTS</span><b>${SCENE.joints.length}</b></div><div class="readout"><span>RIGID BODIES</span><b>${SCENE.bodies.length}</b></div>
 <div class="readout"><span>MAX CLOSURE ERROR</span><b id="error">0</b></div><div class="status"><i></i><b id="status">CLOSED LOOP</b></div>
 <p class="footnote">Illustrative lengths. Sources linked but not independently verified. Force, torque and collisions not simulated.</p></aside>
 <section class="controls"><div class="ctl-head">OPERATOR PANEL <b id="play-state">● LIVE</b></div><div class="ctl-row"><button id="pause">Ⅱ</button><button id="back">−15°</button><button id="forward">+15°</button><label>ASSEMBLY</label><button id="open" class="selected">OPEN</button><button id="crossed">CROSSED</button></div>
 <div class="ctl-bottom"><button id="top">TOP VIEW</button><button id="xray">X-RAY</button><button id="explode">EXPLODED</button><span>DRAG ORBIT · SCROLL ZOOM</span></div></section>
 <div class="film-caption" id="film"><span>SE(2) MOTION STUDY</span><strong id="caption"></strong><small id="frame"></small></div>
 <div class="footer">SOURCE-REGISTERED / IDEAL JOINT CONSTRAINTS / NON-CERTIFIED</div>`;
 document.getElementById('app').appendChild(ui);
 const $=id=>ui.querySelector('#'+id);
 const motor=Math.abs(SCENE.bodies.find(b=>b.role==='driver').rpm);
 const guideScene=SCENE.joints.some(j=>j.type==='prismatic');
 const readableBranch=name=>SCENE.branchLabels?.[name]||name.toUpperCase();
 const markerAxis=guideScene?'x':'y';
 const jointCounts={revolute:SCENE.joints.filter(j=>j.type==='revolute').length,prismatic:SCENE.joints.filter(j=>j.type==='prismatic').length};
 $('tip-y').closest('.metric').querySelector('label').textContent=guideScene?'SLIDER POSITION / X':'END EFFECTOR / Y';
 $('tip-x').closest('div').querySelector('label').textContent=guideScene?'VERTICAL DEVIATION / Y':'END EFFECTOR / X';
 ui.querySelector('.readout span').textContent='REVOLUTE / PRISMATIC';
 ui.querySelector('.readout b').textContent=jointCounts.revolute+' / '+jointCounts.prismatic;
 for(const name of ['open','crossed'])$(name).textContent=readableBranch(name);
 const control={branch:'open',paused:false,hold:0,offset:0,view:'oblique',xray:false,explode:false};
 const film={active:!!capture&&video.direction==='cinematic',last:null};
 let lastTime=0,lastSeconds=0,last=evaluateAtTime(0,{branch:'open'});
 function paint(s){$('tip-y').innerHTML=s.tip[markerAxis].toFixed(1)+' <small>mm</small>';
  $('tip-x').textContent=s.tip[markerAxis==='y'?'x':'y'].toFixed(1);$('error').textContent=s.closureErrorMm.toExponential(1)+' mm';
  $('branch-label').textContent=readableBranch(s.branch);$('status').textContent=s.status.toUpperCase()+' LOOP';}
 function setBranch(branch){if(film.active||!['open','crossed'].includes(branch))return false;
  control.branch=branch;for(const id of ['open','crossed'])$(id).classList.toggle('selected',id===branch);return true;}
 for(const b of ['open','crossed'])$(b).addEventListener('click',()=>setBranch(b));
 $('pause').addEventListener('click',()=>{if(!control.paused){control.paused=true;control.hold=lastSeconds;}else{control.paused=false;control.offset=control.hold-lastTime;}
  $('pause').textContent=control.paused?'▶':'Ⅱ';$('play-state').textContent=control.paused?'● HOLD':'● LIVE';});
 function step(n){if(!control.paused){control.paused=true;control.hold=lastSeconds;$('pause').textContent='▶';$('play-state').textContent='● HOLD';}control.hold+=n/motor*60/24;}
 $('back').addEventListener('click',()=>step(-1));$('forward').addEventListener('click',()=>step(1));
 $('top').addEventListener('click',()=>{control.view=control.view==='top'?'oblique':'top';$('top').classList.toggle('selected',control.view==='top');});
 for(const id of ['xray','explode'])$(id).addEventListener('click',()=>{control[id]=!control[id];$(id).classList.toggle('selected',control[id]);});
 let drag=null;canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;stage.setOrbit((e.clientX-drag.x)*.005,-(e.clientY-drag.y)*.004);drag.x=e.clientX;drag.y=e.clientY;});
 canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 canvas.addEventListener('wheel',e=>{e.preventDefault();stage.setZoom(Math.sign(e.deltaY)*.05);},{passive:false});
 window.RIGID_SCENE={get snapshot(){return {...last,poses:JSON.parse(JSON.stringify(last.poses||{}))};},
  setBranch,get capabilities(){return{declarativeJoints:true,noNamedKinematicSolver:true,seek:true,live:true,branches:['open','crossed']};},
  director:{get active(){return film.active;},get snapshot(){return film.last;},setEnabled(v){film.active=!!v;return film.active;}}};
 return {resize:stage.resize,render(t){lastTime=t;const time=film.active?t:control.paused?control.hold:control.offset+t;
  lastSeconds=time;last=evaluateAtTime(time,{branch:film.active?'open':control.branch});
  if(last.status!=='closed')throw Error('RIGID_SCENE_UNRESOLVED_FRAME_'+last.status);
  const shot=film.active?evaluateFilmDirection(t,video):null;film.last=shot;
  stage.render(last,shot?{filmCamera:shot.camera,xray:shot.xray,explode:shot.exploded}:control);
  paint(last);$('film').dataset.on=String(!!shot);if(shot){$('caption').textContent=shot.caption;$('frame').textContent=(shot.frame+1)+' / '+shot.totalFrames;}
  return {stage:'CLOSED',branch:last.branch,tipX:last.tip.x,tipY:last.tip.y};}};
});
