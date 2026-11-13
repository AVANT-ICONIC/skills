/** One scene renderer for declarative planar bodies. No topology-specific code. */
import * as THREE from 'three';
const palette={teal:0x3eabb6,copper:0xd39a76,steel:0xb6c9d3,sand:0xb8a289};
const PI=Math.PI;
function cylinder(r,h,material){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,40),material);m.rotation.x=PI/2;return m;}
function barBody(spec,material,z){
 const [x1,y1]=spec.start,[x2,y2]=spec.end;
 const len=Math.hypot(x2-x1,y2-y1),rotation=Math.atan2(y2-y1,x2-x1),w=spec.widthMm;
 const group=new THREE.Group();
 const outline=new THREE.Shape();
 outline.moveTo(0,-w/2);outline.lineTo(len,-w/2);outline.absarc(len,0,w/2,-PI/2,PI/2,false);
 outline.lineTo(0,w/2);outline.absarc(0,0,w/2,PI/2,3*PI/2,false);
 const geo=new THREE.ExtrudeGeometry(outline,{depth:4,bevelEnabled:true,bevelThickness:.65,bevelSize:.55,bevelSegments:2});
 const body=new THREE.Mesh(geo,material);body.rotation.z=rotation;body.position.set(x1,y1,z);group.add(body);
 return group;
}
export function createRigidSceneStage(canvas,sceneSpec){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x08141d);
 scene.add(new THREE.AmbientLight(0xbfd7e4,1.45));
 for(const [color,power,x,y,z] of [[0xe9f5ff,2.6,-100,130,130],[0x6ae4ee,1.8,120,-100,100],[0xffb487,1.1,-75,-90,110]]){
  const l=new THREE.DirectionalLight(color,power);l.position.set(x,y,z);scene.add(l);
 }
 const boardMaterial=new THREE.MeshStandardMaterial({color:0x122b39,roughness:.55,metalness:.57});
 const board=new THREE.Mesh(new THREE.BoxGeometry(sceneSpec.world.extentMm-36,sceneSpec.world.extentMm-70,5),boardMaterial);
 board.position.set(sceneSpec.world.center[0],sceneSpec.world.center[1],-18);scene.add(board);
 const inset=new THREE.Mesh(new THREE.BoxGeometry(sceneSpec.world.extentMm-43,sceneSpec.world.extentMm-77,1),
  new THREE.MeshStandardMaterial({color:0x0d202c,roughness:.66,metalness:.22}));
 inset.position.set(sceneSpec.world.center[0],sceneSpec.world.center[1],-14.5);scene.add(inset);
 const edge=new THREE.LineSegments(new THREE.EdgesGeometry(board.geometry),
  new THREE.LineBasicMaterial({color:0x467586,transparent:true,opacity:.55}));edge.position.copy(board.position);scene.add(edge);
 const materials=Object.fromEntries(Object.entries(palette).map(([k,color])=>
  [k,new THREE.MeshStandardMaterial({color,metalness:.7,roughness:.31})]));
 const hubMat=new THREE.MeshStandardMaterial({color:0xf7a874,metalness:.56,roughness:.3});
 const bodyObjects=new Map(),pins=[];
 const bodies=sceneSpec.bodies.filter(x=>x.geometry);
 for(let i=0;i<bodies.length;i++){
  const b=bodies[i],z=2+(i%3)*4;
  const g=barBody(b.geometry,materials[b.geometry.material],z);scene.add(g);bodyObjects.set(b.id,g);
 }
 for(const joint of sceneSpec.joints){
  const pin=cylinder(4.3,5,hubMat);pin.position.z=16;scene.add(pin);pins.push({joint,pin});
 }
 const cam=new THREE.PerspectiveCamera(32,16/9,.1,1200);
 let orbitX=-.07,orbitY=-.1,zoom=1;
 const transform=(pose,anchor)=>({x:pose[0]+anchor[0]*Math.cos(pose[2])-anchor[1]*Math.sin(pose[2]),
  y:pose[1]+anchor[0]*Math.sin(pose[2])+anchor[1]*Math.cos(pose[2])});
 function setOrbit(dx,dy){orbitX=Math.max(-.55,Math.min(.55,orbitX+dx));orbitY=Math.max(-.42,Math.min(.45,orbitY+dy));}
 function setZoom(delta){zoom=Math.max(.72,Math.min(1.5,zoom+delta));}
 function resize(){const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
  renderer.setPixelRatio(Math.min(1.4,Math.max(.5,devicePixelRatio||1)));
  renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
 function render(s,{filmCamera=null,xray=false,explode=false,view='oblique'}={}){
  if(s?.status!=='closed'||!s.poses)throw Error('RIGID_SCENE_UNSOLVED_POSE');
  const factor=v=>v===true?1:Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
  const xrayFraction=factor(xray),explodeFraction=factor(explode);
  let i=0;for(const b of bodies){const group=bodyObjects.get(b.id),pose=s.poses[b.id];
   group.position.set(pose[0],pose[1],explodeFraction*(3+(i%3)*8));group.rotation.z=pose[2];i++;
   const mat=materials[b.geometry.material];mat.opacity=1-.56*xrayFraction;
   mat.transparent=xrayFraction>0;mat.depthWrite=xrayFraction===0;
  }
  for(const {joint,pin} of pins){const p=transform(s.poses[joint.a],joint.anchorA);
   pin.position.x=p.x;pin.position.y=p.y;pin.position.z=18;}
  const cX=filmCamera?.orbitX??orbitX,cY=filmCamera?.orbitY??(view==='top'?0:orbitY);
  const distance=sceneSpec.world.extentMm*2.15*(filmCamera?.zoom??zoom);
  const target=new THREE.Vector3(sceneSpec.world.center[0],sceneSpec.world.center[1]-18,0);
  cam.position.set(target.x+Math.sin(cX)*distance,target.y+Math.sin(cY)*distance,
   target.z+Math.cos(cX)*Math.cos(cY)*distance);
  cam.lookAt(target);renderer.render(scene,cam);
 }
 resize();return{render,resize,setOrbit,setZoom,renderer};
}
