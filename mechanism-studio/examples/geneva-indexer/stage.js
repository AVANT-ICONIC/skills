import * as THREE from 'three';
import {GENEVA} from './model.mjs';

/** Original procedural presentation geometry. All dimensions are millimetres. */
const MAT={
  base:new THREE.MeshStandardMaterial({color:0x152635,metalness:0.64,roughness:0.49}),
  edge:new THREE.MeshStandardMaterial({color:0x30495b,metalness:0.65,roughness:0.34}),
  wheel:new THREE.MeshStandardMaterial({color:0xd8d1b6,metalness:0.78,roughness:0.32}),
  wheelSide:new THREE.MeshStandardMaterial({color:0x837e72,metalness:0.76,roughness:0.43}),
  driver:new THREE.MeshStandardMaterial({color:0x4fa8b8,metalness:0.73,roughness:0.26}),
  driverEdge:new THREE.MeshStandardMaterial({color:0x1e5669,metalness:0.76,roughness:0.29}),
  pin:new THREE.MeshStandardMaterial({color:0xff9b52,metalness:0.51,roughness:0.29}),
  carbon:new THREE.MeshStandardMaterial({color:0x0a151d,metalness:0.33,roughness:0.54}),
  steel:new THREE.MeshStandardMaterial({color:0x91adc2,metalness:0.78,roughness:0.27}),
  signal:new THREE.LineBasicMaterial({color:0x6797ad,transparent:true,opacity:0.38})
};
const PI=Math.PI;
const pt=(angle,r,off=0)=>({x:r*Math.cos(angle)-off*Math.sin(angle),y:r*Math.sin(angle)+off*Math.cos(angle)});
function roundSlotWheelShape(){
  const R=GENEVA.outputRadiusMm,w=GENEVA.radialSlotHalfWidthMm,inner=GENEVA.slotEndCenterMm;
  const a0=-3*PI/4,delta=Math.asin(w/R),s=new THREE.Shape();
  const out=(a,sgn)=>pt(a,Math.sqrt(R*R-w*w),sgn*w);
  const P0=out(a0,-1);s.moveTo(P0.x,P0.y);
  for(let k=0;k<4;k++){
    const a=a0+k*PI/2;
    let p=pt(a,inner,-w);s.lineTo(p.x,p.y);
    for(let j=1;j<=14;j++){
      const phi=-PI/2-j*PI/14;
      const x=inner+w*Math.cos(phi),y=w*Math.sin(phi);
      p=pt(a,x,y);s.lineTo(p.x,p.y);
    }
    p=out(a,1);s.lineTo(p.x,p.y);
    const start=a+delta,end=a+PI/2-delta;
    for(let j=1;j<=20;j++){
      const an=start+(end-start)*j/20;
      s.lineTo(R*Math.cos(an),R*Math.sin(an));
    }
  }
  s.closePath();
  const hole=new THREE.Path();hole.absarc(0,0,3,0,PI*2,true);s.holes.push(hole);
  return s;
}
function cylinder(radius,height,material,z=0){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,48),material);
  mesh.rotation.x=PI/2;mesh.position.z=z;return mesh;
}
function traceCircle(parent,x,y,z,r,material){
  const points=Array.from({length:129},(_,i)=>new THREE.Vector3(x+r*Math.cos(i*PI/64),y+r*Math.sin(i*PI/64),z));
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);
  parent.add(line);return line;
}
export function createGenevaStage(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x0a141e);
  const camera=new THREE.PerspectiveCamera(34,16/9,0.1,400);
  const root=new THREE.Group();scene.add(root);
  scene.add(new THREE.AmbientLight(0xd4e6ff,1.55));
  const key=new THREE.DirectionalLight(0xffffff,3.5);key.position.set(-50,80,110);scene.add(key);
  const rim=new THREE.DirectionalLight(0x37bed1,2.2);rim.position.set(80,-60,60);scene.add(rim);
  const warm=new THREE.DirectionalLight(0xffbd7a,1.2);warm.position.set(-10,-75,70);scene.add(warm);

  const board=new THREE.Mesh(new THREE.BoxGeometry(122,82,4),MAT.base);
  board.position.z=-12;root.add(board);
  const border=new THREE.LineSegments(new THREE.EdgesGeometry(board.geometry),MAT.signal);
  border.position.copy(board.position);root.add(border);
  const inset=new THREE.Mesh(new THREE.BoxGeometry(115,75,.5),MAT.carbon);
  inset.position.z=-9.75;root.add(inset);
  const C=GENEVA.centerDistanceMm,driveX=-C/2,wheelX=C/2;
  const track=new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(driveX,-40,-9),new THREE.Vector3(driveX,40,-9)
  ]),MAT.signal);root.add(track);
  traceCircle(root,driveX,0,-8.9,GENEVA.crankRadiusMm,MAT.signal);
  traceCircle(root,wheelX,0,-8.9,GENEVA.outputRadiusMm+1.9,MAT.signal);

  for(const [x,r] of [[driveX,6],[wheelX,7.5]]){
    const base=cylinder(r,3,MAT.edge,-7.0);base.position.x=x;root.add(base);
    const shaft=cylinder(3.1,12,MAT.steel,-3);shaft.position.x=x;root.add(shaft);
    const washer=cylinder(5,1,MAT.carbon,3.0);washer.position.x=x;root.add(washer);
  }
  const driver=new THREE.Group();driver.position.set(driveX,0,0);root.add(driver);
  driver.add(cylinder(7.3,3,MAT.driverEdge,-4));
  const arm=new THREE.Mesh(new THREE.BoxGeometry(GENEVA.crankRadiusMm,5.6,2.8),MAT.driver);
  arm.position.set(GENEVA.crankRadiusMm/2,0,-4);driver.add(arm);
  for(const x of [8,15,22]){
    const bolt=cylinder(1.15,.8,MAT.steel,-2.2);bolt.position.x=x;driver.add(bolt);
  }
  const crankPin=cylinder(GENEVA.pinRadiusMm,11,MAT.pin,.2);
  crankPin.position.x=GENEVA.crankRadiusMm;driver.add(crankPin);
  const pinCap=cylinder(2.65,.7,MAT.steel,5.8);
  pinCap.position.x=GENEVA.crankRadiusMm;driver.add(pinCap);

  const wheel=new THREE.Group();wheel.position.set(wheelX,0,1);root.add(wheel);
  const wheelGeom=new THREE.ExtrudeGeometry(roundSlotWheelShape(),{
    depth:4,bevelEnabled:true,bevelThickness:.3,bevelSize:.35,
    bevelSegments:2,steps:1,curveSegments:16
  });
  wheelGeom.translate(0,0,-2);
  const plate=new THREE.Mesh(wheelGeom,[MAT.wheel,MAT.wheelSide]);wheel.add(plate);
  wheel.add(cylinder(6.5,1.6,MAT.driverEdge,2.8));
  wheel.add(cylinder(4.4,2,MAT.steel,3.6));
  for(let k=0;k<4;k++){
    const a=-3*PI/4+k*PI/2;
    const bolt=cylinder(1.35,.5,MAT.steel,2.5);
    bolt.position.x=19*Math.cos(a+PI/4);
    bolt.position.y=19*Math.sin(a+PI/4);wheel.add(bolt);
  }
  for(const x of [driveX,wheelX]){
    const datum=cylinder(1.05,.6,MAT.pin,5);datum.position.x=x;root.add(datum);
  }
  let orbitX=0,orbitY=-.13,zoom=1;
  function setOrbit(dx,dy){
    orbitX=Math.max(-.65,Math.min(.65,orbitX+dx));
    orbitY=Math.max(-.62,Math.min(.4,orbitY+dy));
  }
  function setZoom(delta){zoom=Math.max(.7,Math.min(1.35,zoom+delta));}
  function resize(){
    const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
    const ratio=Math.min(Math.max(devicePixelRatio||1,.35),1.65);
    renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  function render(state,{xray=false,exploded=false,view='oblique'}={}){
    driver.rotation.z=state.inputAngleRad;
    wheel.rotation.z=state.outputAngleRad;
    wheel.position.z=exploded?11:1;
    driver.position.z=exploded?-9:0;
    plate.material[0].opacity=xray?.36:1;
    plate.material[0].transparent=xray;
    plate.material[0].depthWrite=!xray;
    const t=view==='top'?0:orbitY,a=orbitX,dist=169*zoom;
    const target=new THREE.Vector3(23,0,-1);
    camera.position.set(target.x+Math.sin(a)*dist,target.y+Math.sin(t)*dist,target.z+Math.cos(a)*Math.cos(t)*dist);
    camera.lookAt(target);
    renderer.render(scene,camera);
  }
  resize();
  return {render,resize,setOrbit,setZoom,renderer};
}
