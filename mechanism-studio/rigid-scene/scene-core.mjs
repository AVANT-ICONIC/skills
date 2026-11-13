/** A bounded, data-only multi-body scene built on the canonical SE(2) solver. */
import {POSE_SCHEMA,validatePoseSystem,solveRigidPoseConstraints} from './rigid-pose-core.mjs';
const ID=/^[a-z][a-z0-9-]{1,63}$/;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const vec=(x,n)=>Array.isArray(x)&&x.length===n&&x.every(v=>finite(v)&&Math.abs(v)<=1e5);
const fields=(x,allowed,where)=>{
 if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!allowed.includes(k)))throw Error('SCENE_UNKNOWN_FIELD_'+where);
};
const clone=x=>JSON.parse(JSON.stringify(x));
const world=(pose,anchor)=>[pose[0]+anchor[0]*Math.cos(pose[2])-anchor[1]*Math.sin(pose[2]),pose[1]+anchor[0]*Math.sin(pose[2])+anchor[1]*Math.cos(pose[2])];
const mark=(poses,m)=>world(poses[m.body],m.anchor);
export function validateScene(data){
 fields(data,['schema','id','title','subtitle','description','references','dimensionsProvenance','video','world','bodies','joints','markers','branches'],'root');
 if(data.schema!=='avant.rigid-scene/1'||!ID.test(data.id)||data.dimensionsProvenance!=='illustrative-not-measured'||
    ![data.title,data.subtitle,data.description].every(s=>typeof s==='string'&&s.length>=8&&s.length<220))throw Error('SCENE_METADATA_INVALID');
 fields(data.video,['fps','durationSeconds','width','height','direction'],'video');
 if(![24,30].includes(data.video.fps)||![6,8].includes(data.video.durationSeconds)||
   ![[1280,720],[1920,1080]].some(([w,h])=>data.video.width===w&&data.video.height===h)||
   !['technical','cinematic'].includes(data.video.direction))throw Error('SCENE_VIDEO_PROFILE_INVALID');
 fields(data.world,['center','extentMm'],'world');
 if(!vec(data.world.center,2)||!finite(data.world.extentMm)||data.world.extentMm<90||data.world.extentMm>700)throw Error('SCENE_WORLD_INVALID');
 if(!Array.isArray(data.references)||data.references.length<1||data.references.length>8)throw Error('SCENE_REFERENCES_REQUIRED');
 for(const r of data.references){
  fields(r,['id','type','title','url','redistribution','contentChecked'],'reference');
  const url=new URL(r.url);
  if(!ID.test(r.id)||r.type!=='technical-reference'||r.redistribution!=='link-only'||r.contentChecked!==false||
   typeof r.title!=='string'||r.title.length<10||url.protocol!=='https:'||url.username||url.password||
   /(?:^|\.)localhost$/i.test(url.hostname))throw Error('SCENE_REFERENCE_UNSAFE');
 }
 if(!Array.isArray(data.bodies)||data.bodies.length<4||data.bodies.length>9||!Array.isArray(data.joints)||data.joints.length<3||data.joints.length>24)throw Error('SCENE_GRAPH_SIZE_INVALID');
 const ids=new Set(),byId=new Map(),drivers=[];
 for(const b of data.bodies){
  fields(b,['id','role','pose','seedPose','basePose','rpm','phaseRad','geometry'],'body');
  if(!ID.test(b.id)||ids.has(b.id)||!['fixed','driver','free'].includes(b.role))throw Error('SCENE_BODY_INVALID');
  ids.add(b.id);byId.set(b.id,b);
  if(b.role==='fixed'&&(!vec(b.pose,3)||['seedPose','basePose','rpm','phaseRad','geometry'].some(k=>k in b)))throw Error('SCENE_FIXED_BODY_INVALID');
  if(b.role==='driver'){
   if(!vec(b.basePose,3)||!finite(b.rpm)||Math.abs(b.rpm)>60||b.rpm===0||!finite(b.phaseRad)||Math.abs(b.phaseRad)>Math.PI*2||'pose' in b||'seedPose' in b)throw Error('SCENE_DRIVER_INVALID');
   drivers.push(b);
  }
  if(b.role==='free'&&(!vec(b.seedPose,3)||'pose' in b||'basePose' in b||'rpm' in b||'phaseRad' in b))throw Error('SCENE_FREE_BODY_INVALID');
  if(b.role!=='fixed'){
   fields(b.geometry,['start','end','widthMm','material'],'geometry');
   if(!vec(b.geometry.start,2)||!vec(b.geometry.end,2)||
      Math.hypot(b.geometry.end[0]-b.geometry.start[0],b.geometry.end[1]-b.geometry.start[1])<5||
      !finite(b.geometry.widthMm)||b.geometry.widthMm<2||b.geometry.widthMm>18||
      !['teal','copper','steel','sand'].includes(b.geometry.material))throw Error('SCENE_GEOMETRY_INVALID');
  }
 }
 if(drivers.length<1||drivers.length>2||!data.bodies.some(b=>b.role==='fixed')||
   data.bodies.filter(b=>b.role==='free').length<1)throw Error('SCENE_DRIVE_COUNT_INVALID');
 for(const j of data.joints){
  fields(j,['id','type','a','b','anchorA','anchorB','axisA','angleScaleMm'],'joint');
  if(!ID.test(j.id)||j.type!=='revolute'||!ids.has(j.a)||!ids.has(j.b)||j.a===j.b||
    !vec(j.anchorA,2)||!vec(j.anchorB,2)||'axisA' in j||'angleScaleMm' in j)throw Error('SCENE_JOINT_INVALID');
 }
 fields(data.markers,['point','baseA','baseB'],'markers');
 for(const k of ['point','baseA','baseB']){
  const m=data.markers[k];fields(m,['body','anchor'],'marker');
  if(!ids.has(m.body)||!vec(m.anchor,2))throw Error('SCENE_MARKER_INVALID');
 }
 fields(data.branches,['open','crossed'],'branches');
 const free=data.bodies.filter(b=>b.role==='free').map(b=>b.id).sort();
 for(const [name,sgn] of [['open',1],['crossed',-1]]){
  fields(data.branches[name],['sign','seeds'],'branch');
  if(data.branches[name].sign!==sgn||!data.branches[name].seeds||
    Object.keys(data.branches[name].seeds).sort().join('|')!==free.join('|')||
    Object.values(data.branches[name].seeds).some(p=>!vec(p,3)))throw Error('SCENE_BRANCH_INVALID');
 }
 const test=makePoseProblemUnchecked(data,0,'open');
 const meta=validatePoseSystem(test);
 if(meta.unknowns>meta.equations)throw Error('SCENE_UNDERDETERMINED');
 return clone(data);
}
function makePoseProblemUnchecked(data,seconds,branch){
 return {schema:POSE_SCHEMA,bodies:data.bodies.map(b=>{
  if(b.role==='fixed')return{id:b.id,fixedPose:b.pose};
  if(b.role==='driver')return{id:b.id,fixedPose:[b.basePose[0],b.basePose[1],b.basePose[2]+b.phaseRad+seconds*b.rpm*Math.PI*2/60]};
  return{id:b.id,seedPose:data.branches[branch].seeds[b.id]};
 }),joints:data.joints};
}
export function solveSceneAtTime(scene,seconds,{branch='open'}={}){
 if(!finite(seconds)||seconds<0||seconds>60||!['open','crossed'].includes(branch))throw Error('SCENE_TIME_OR_BRANCH_INVALID');
 const data=validateScene(scene);
 const problem=makePoseProblemUnchecked(data,seconds,branch);
 const answer=solveRigidPoseConstraints(problem,{toleranceMm:1e-7,maxIterations:120});
 if(answer.status!=='closed')return{status:answer.status,reason:answer.reason,poses:null,branch,seconds,certifiedPhysics:false};
 const tip=mark(answer.poses,data.markers.point),a=mark(answer.poses,data.markers.baseA),b=mark(answer.poses,data.markers.baseB);
 const orientation=(b[0]-a[0])*(tip[1]-a[1])-(b[1]-a[1])*(tip[0]-a[0]);
 if(data.branches[branch].sign*orientation<=1e-6)throw Error('SCENE_BRANCH_CROSSED');
 return {schema:'avant.rigid-scene-pose/1',status:'closed',branch,seconds,poses:answer.poses,
   tip:{x:tip[0],y:tip[1]},orientation,closureErrorMm:answer.maxResidualMm,
   certifiedPhysics:false};
}
export function sceneDigest(scene){return JSON.stringify(validateScene(scene),null,2)+'\n';}
