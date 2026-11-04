/**
 * Frame-addressable, mechanism-agnostic cinematic direction.
 * No mutable timeline cursor, clocks, randomness, user-supplied JS or audio.
 * Each camera pose is evaluated from integer frame + verified film profile.
 */
export const SHOTS = Object.freeze([
  Object.freeze({at:0,id:'overview',caption:'01 / MECHANISM OVERVIEW',
    camera:Object.freeze({orbitX:-.16,orbitY:-.10,zoom:1.08}),explode:0,xray:0}),
  Object.freeze({at:.19,id:'drive',caption:'02 / ROTARY INPUT',
    camera:Object.freeze({orbitX:.14,orbitY:-.18,zoom:.91}),explode:0,xray:0}),
  Object.freeze({at:.39,id:'geometry',caption:'03 / MOTION GEOMETRY',
    camera:Object.freeze({orbitX:-.06,orbitY:.04,zoom:.89}),explode:0,xray:0}),
  Object.freeze({at:.61,id:'assembly',caption:'04 / ASSEMBLY RELATIONSHIP',
    camera:Object.freeze({orbitX:-.32,orbitY:-.22,zoom:1.04}),explode:.88,xray:0}),
  Object.freeze({at:.79,id:'section',caption:'05 / INTERNAL MOTION',
    camera:Object.freeze({orbitX:.12,orbitY:.10,zoom:.99}),explode:.08,xray:.70}),
  Object.freeze({at:1,id:'overview',caption:'06 / COMPLETE MOTION',
    camera:Object.freeze({orbitX:-.16,orbitY:-.10,zoom:1.08}),explode:0,xray:0})
]);
const keys=['orbitX','orbitY','zoom'];
const lerp=(a,b,s)=>a+(b-a)*s;
export function evaluateFilmDirection(seconds,video){
  if(!video||!Number.isInteger(video.fps)||video.fps<=0||
    !Number.isInteger(video.durationSeconds)||video.durationSeconds<=0||
    !Number.isFinite(seconds))throw new TypeError('FILM_DIRECTION_PROFILE_INVALID');
  const total=video.fps*video.durationSeconds;
  const frame=Math.max(0,Math.min(total-1,Math.round(seconds*video.fps)));
  const norm=frame/total;
  let i=SHOTS.length-2;
  for(let j=0;j<SHOTS.length-1;j++){
    if(norm<SHOTS[j+1].at){i=j;break;}
  }
  const left=SHOTS[i],right=SHOTS[i+1];
  const raw=Math.max(0,Math.min(1,(norm-left.at)/(right.at-left.at)));
  const eased=raw*raw*(3-2*raw);
  const camera=Object.fromEntries(keys.map(k=>[k,lerp(left.camera[k],right.camera[k],eased)]));
  return Object.freeze({schema:'avant.mechanism-film-direction/1',
    frame,totalFrames:total,shotId:left.id,shotNumber:i+1,
    caption:left.caption,camera:Object.freeze(camera),
    exploded:lerp(left.explode,right.explode,eased),
    xray:lerp(left.xray,right.xray,eased),
    progress:raw});
}
export function validateFilmDirection(video){
  const points=[];
  for(let f=0;f<video.fps*video.durationSeconds;f++){
    const state=evaluateFilmDirection(f/video.fps,video);
    if(!keys.every(k=>Number.isFinite(state.camera[k]))||
      !Number.isFinite(state.exploded)||!Number.isFinite(state.xray)||
      state.exploded<0||state.exploded>1||state.xray<0||state.xray>1)
      throw new Error('FILM_DIRECTION_UNSAFE_FRAME_'+f);
    points.push(state);
  }
  return Object.freeze({frames:points.length,shots:new Set(points.map(x=>x.shotNumber)).size,
    first:points[0],last:points.at(-1)});
}
