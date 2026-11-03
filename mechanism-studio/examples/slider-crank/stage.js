import * as THREE from 'three';
import {CONFIG} from './machine-config.mjs';
const PI=Math.PI,{crankRadiusMm:R,rodLengthMm:L}=CONFIG;
const materials={
  board:new THREE.MeshStandardMaterial({color:0x172e3b,roughness:.46,metalness:.58}),
  carbon:new THREE.MeshStandardMaterial({color:0x0b1d2b,roughness:.61,metalness:.35}),
  rail:new THREE.MeshStandardMaterial({color:0x4e788b,roughness:.32,metalness:.79}),
  crank:new THREE.MeshStandardMaterial({color:0x4a9dad,roughness:.25,metalness:.76}),
  rod:new THREE.MeshStandardMaterial({color:0xbeced4,roughness:.26,metalness:.82}),
  rodEdge:new THREE.MeshStandardMaterial({color:0x546e81,roughness:.38,metalness:.75}),
  piston:new THREE.MeshStandardMaterial({color:0xd7c6a5,roughness:.29,metalness:.76,transparent:false,opacity:1}),
  orange:new THREE.MeshStandardMaterial({color:0xfca970,roughness:.25,metalness:.58}),
  dark:new THREE.MeshStandardMaterial({color:0x203946,roughness:.38,metalness:.7})
};
function round(radius,thickness,material,z=0){
 const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,thickness,52),material);
 m.rotation.x=PI/2;m.position.z=z;return m;
}
function line(parent,points,color=0x37586a){
 const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color,transparent:true,opacity:.55}));
 parent.add(l);return l;
}
export function createSliderStage(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.19;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x0a141e);
 scene.add(new THREE.AmbientLight(0xc9e2f0,1.45));
 for(const [color,power,x,y,z] of [[0xffffff,3.0,-60,90,105],[0x4ed1db,2.6,90,-50,80],[0xffb27a,1.3,-90,-50,70]]){
  const lamp=new THREE.DirectionalLight(color,power);lamp.position.set(x,y,z);scene.add(lamp);
 }
 const holder=new THREE.Group();
 // Keep the mechanism fully visible between editorial title, telemetry and operator console.
 holder.scale.setScalar(.73);holder.position.set(32,6,0);scene.add(holder);
 const board=new THREE.Mesh(new THREE.BoxGeometry(L+2*R+60,98,6),materials.board);
 board.position.set((L+R)/2-6,0,-13);holder.add(board);
 const inset=new THREE.Mesh(new THREE.BoxGeometry(L+2*R+54,91,.7),materials.carbon);
 inset.position.copy(board.position);inset.position.z=-9.5;holder.add(inset);
 const border=new THREE.LineSegments(new THREE.EdgesGeometry(board.geometry),
   new THREE.LineBasicMaterial({color:0x557d8d,transparent:true,opacity:.53}));
 border.position.copy(board.position);holder.add(border);
 const ticks=[];
 for(let x=-R-7;x<L+R+18;x+=10)ticks.push([x,-38,-8.8],[x,-36,-8.8]);
 for(let i=0;i<ticks.length;i+=2)line(holder,[ticks[i],ticks[i+1]]);
 for(const y of [-20,20]){
  const rail=new THREE.Mesh(new THREE.BoxGeometry(2*R+52,3.6,3.5),materials.rail);
  rail.position.set(L, y,-2.5);holder.add(rail);
  const groove=new THREE.Mesh(new THREE.BoxGeometry(2*R+51,1,.7),materials.orange);
  groove.position.set(L,y,0);groove.material=materials.rail;holder.add(groove);
 }
 const crankGroup=new THREE.Group();holder.add(crankGroup);
 const disc=round(R+8,3.5,materials.crank,0);crankGroup.add(disc);
 const hub=round(8,4.4,materials.dark,3);crankGroup.add(hub);
 const shaft=round(3,7,materials.orange,6);crankGroup.add(shaft);
 const arm=new THREE.Mesh(new THREE.BoxGeometry(R,6.5,2.8),materials.rod);
 arm.position.set(R/2,0,4);crankGroup.add(arm);
 const crankPin=round(5,8,materials.orange,7);
 crankPin.position.x=R;crankGroup.add(crankPin);
 for(let k=0;k<8;k++){
  const a=2*PI*k/8;const bolt=round(1.2,1,materials.rodEdge,2.2);
  bolt.position.set((R-5)*Math.cos(a),(R-5)*Math.sin(a),0);crankGroup.add(bolt);
 }
 const rodGroup=new THREE.Group();holder.add(rodGroup);
 const bar=new THREE.Mesh(new THREE.BoxGeometry(L,6.4,4.1),materials.rod);
 bar.position.set(L/2,0,0);rodGroup.add(bar);
 const insetBar=new THREE.Mesh(new THREE.BoxGeometry(L-20,1.2,1),materials.rodEdge);
 insetBar.position.set(L/2,0,2.65);rodGroup.add(insetBar);
 for(const x of [0,L]){
  const eye=round(7.2,5.6,materials.rod,1);eye.position.x=x;rodGroup.add(eye);
  const bearing=round(3.2,6.2,materials.dark,4.7);bearing.position.x=x;rodGroup.add(bearing);
 }
 const pistonGroup=new THREE.Group();holder.add(pistonGroup);
 const piston=new THREE.Mesh(new THREE.BoxGeometry(29,31,12),materials.piston);
 piston.position.set(0,0,4.8);pistonGroup.add(piston);
 for(const y of [-11,11]){
  const edge=new THREE.Mesh(new THREE.BoxGeometry(29,2.1,1.2),materials.rodEdge);
  edge.position.set(0,y,11.5);pistonGroup.add(edge);
 }
 const gudgeon=round(5.7,2.5,materials.dark,12);
 pistonGroup.add(gudgeon);
 const centerMark=round(2.1,3,materials.orange,14);pistonGroup.add(centerMark);
 const guides=new THREE.Mesh(new THREE.BoxGeometry(2*R+65,1.2,.6),materials.orange);
 guides.position.set(L,0,-5.4);holder.add(guides);
 const axis=new THREE.PerspectiveCamera(31,16/9,.1,700);
 let orbitX=0,orbitY=-.12,zoom=1;
 function resize(){
   const width=Math.max(1,innerWidth),height=Math.max(1,innerHeight);
   renderer.setPixelRatio(Math.min(1.65,Math.max(.35,devicePixelRatio||1)));
   renderer.setSize(width,height,false);axis.aspect=width/height;axis.updateProjectionMatrix();
 }
 function setOrbit(dx,dy){orbitX=Math.max(-.58,Math.min(.58,orbitX+dx));orbitY=Math.max(-.43,Math.min(.43,orbitY+dy));}
 function setZoom(delta){zoom=Math.max(.70,Math.min(1.4,zoom+delta));}
 function render(state,{xray=false,explode=false,view='oblique'}={}){
  crankGroup.rotation.z=state.angleRad;
  rodGroup.position.set(state.crankX,state.crankY,explode?20:8);
  rodGroup.rotation.z=state.rodAngleRad;
  crankGroup.position.z=explode?-13:0;
  pistonGroup.position.set(state.pistonX,0,explode?27:0);
  materials.piston.opacity=xray?.37:1;materials.piston.transparent=!!xray;materials.piston.depthWrite=!xray;
  const angle=view==='top'?0:orbitY,d=288*zoom,target=new THREE.Vector3((L+R)/2,-12,-2);
  axis.position.set(target.x+Math.sin(orbitX)*d,target.y+Math.sin(angle)*d,target.z+Math.cos(orbitX)*Math.cos(angle)*d);
  axis.lookAt(target);
  renderer.render(scene,axis);
 }
 resize();
 return {resize,render,setOrbit,setZoom,renderer};
}
