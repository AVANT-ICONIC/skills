import * as THREE from 'three';
import {CONFIG} from './machine-config.mjs';
const PI=Math.PI;
const D=CONFIG.groundLengthMm,A=CONFIG.inputLengthMm,B=CONFIG.couplerLengthMm,C=CONFIG.outputLengthMm;
const materials={
 background:new THREE.MeshStandardMaterial({color:0x102737,metalness:.57,roughness:.46}),
 inset:new THREE.MeshStandardMaterial({color:0x091925,metalness:.32,roughness:.58}),
 input:new THREE.MeshStandardMaterial({color:0x3a9eae,metalness:.73,roughness:.27}),
 coupler:new THREE.MeshStandardMaterial({color:0xc4d2d6,metalness:.75,roughness:.3}),
 rocker:new THREE.MeshStandardMaterial({color:0xcaa980,metalness:.67,roughness:.33}),
 hub:new THREE.MeshStandardMaterial({color:0xffa36f,metalness:.52,roughness:.28}),
 steel:new THREE.MeshStandardMaterial({color:0x567a8d,metalness:.75,roughness:.31}),
 ground:new THREE.MeshStandardMaterial({color:0x233f50,metalness:.7,roughness:.42})
};
function washer(r,h,mat,z){
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,48),mat);
 m.rotation.x=PI/2;m.position.z=z;return m;
}
function beam(length,material,z){
 const g=new THREE.Group();
 const shape=new THREE.Shape();const w=5.8;
 shape.moveTo(0,-w);shape.lineTo(length,-w);
 shape.quadraticCurveTo(length+w,0,length,w);
 shape.lineTo(0,w);shape.quadraticCurveTo(-w,0,0,-w);
 const geom=new THREE.ExtrudeGeometry(shape,{depth:5,bevelEnabled:true,bevelSize:.65,bevelThickness:.6,bevelSegments:2,steps:1});
 geom.translate(0,0,z);
 g.add(new THREE.Mesh(geom,material));
 for(const x of [0,length]){
  const rim=washer(5,6,materials.steel,z+3.5);rim.position.x=x;g.add(rim);
  const pin=washer(2.5,7,materials.hub,z+6);pin.position.x=x;g.add(pin);
 }
 return g;
}
export function createFourBarStage(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x0a141e);
 scene.add(new THREE.AmbientLight(0xc3dff2,1.5));
 for(const [color,power,x,y,z] of [[0xffffff,3.4,-80,110,125],[0x5ee9ed,2.1,140,-85,75],[0xffb588,1.1,-85,-100,85]]){
  const light=new THREE.DirectionalLight(color,power);light.position.set(x,y,z);scene.add(light);
 }
 const assembly=new THREE.Group();assembly.scale.setScalar(.83);assembly.position.set(0,-14,0);scene.add(assembly);
 const board=new THREE.Mesh(new THREE.BoxGeometry(D+125,245,6),materials.background);
 board.position.set(D/2,22,-16);assembly.add(board);
 const inset=new THREE.Mesh(new THREE.BoxGeometry(D+117,236,1),materials.inset);
 inset.position.set(D/2,22,-12);assembly.add(inset);
 const outline=new THREE.LineSegments(new THREE.EdgesGeometry(board.geometry),
  new THREE.LineBasicMaterial({color:0x416f82,transparent:true,opacity:.57}));
 outline.position.copy(board.position);assembly.add(outline);
 const baseline=new THREE.Line(new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-30,0,-10),new THREE.Vector3(D+30,0,-10)]),
  new THREE.LineBasicMaterial({color:0x578394,transparent:true,opacity:.56}));
 assembly.add(baseline);
 for(const x of [0,D]){
  const block=new THREE.Mesh(new THREE.BoxGeometry(25,25,6),materials.ground);
  block.position.set(x,0,-7);assembly.add(block);
  const pivot=washer(9,5,materials.steel,1);pivot.position.x=x;assembly.add(pivot);
  const nut=washer(4,6,materials.hub,9);nut.position.x=x;assembly.add(nut);
 }
 const crank=beam(A,materials.input,5);assembly.add(crank);
 const coupler=beam(B,materials.coupler,12);assembly.add(coupler);
 const rocker=beam(C,materials.rocker,5);assembly.add(rocker);
 const cam=new THREE.PerspectiveCamera(33,16/9,.1,700);
 let orbitX=-.14,orbitY=-.12,zoom=1;
 function setOrbit(dx,dy){
  orbitX=Math.max(-.55,Math.min(.55,orbitX+dx));
  orbitY=Math.max(-.45,Math.min(.4,orbitY+dy));
 }
 function setZoom(step){zoom=Math.max(.7,Math.min(1.38,zoom+step));}
 function resize(){
  const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
  renderer.setPixelRatio(Math.min(1.55,Math.max(.5,devicePixelRatio||1)));
  renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
 }
 function render(state,{filmCamera=null,view='oblique',xray=false,explode=false}={}){
  if(!state?.poses)throw Error('FOUR_BAR_POSE_UNAVAILABLE');
  const weight=v=>v===true?1:(Number.isFinite(v)?Math.max(0,Math.min(1,v)):0);
  const separation=weight(explode),transparency=weight(xray);
  const {input,coupler:rod,rocker:lever}=state.poses;
  crank.position.set(input.x,input.y,-9*separation);crank.rotation.z=input.angleRad;
  coupler.position.set(rod.x,rod.y,12*separation);coupler.rotation.z=rod.angleRad;
  rocker.position.set(lever.x,lever.y,-5*separation);rocker.rotation.z=lever.angleRad;
  materials.coupler.opacity=1-.68*transparency;
  materials.coupler.transparent=transparency>0;materials.coupler.depthWrite=transparency===0;
  const cx=filmCamera?.orbitX??orbitX;
  const cy=filmCamera?.orbitY??(view==='top'?0:orbitY);
  const scale=filmCamera?.zoom??zoom;
  const distance=326*scale,target=new THREE.Vector3(D/2+17,15,-3);
  cam.position.set(target.x+Math.sin(cx)*distance,target.y+Math.sin(cy)*distance,
   target.z+Math.cos(cx)*Math.cos(cy)*distance);
  cam.lookAt(target);renderer.render(scene,cam);
 }
 resize();
 return {render,resize,setOrbit,setZoom,renderer};
}
