import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateFilmDirection,validateFilmDirection} from '../scripts/film-direction.mjs';
const FILM={fps:30,durationSeconds:8,width:1920,height:1080};
const seek=n=>evaluateFilmDirection(n/FILM.fps,FILM);
test('cinematic frames are deterministic in arbitrary seek order',()=>{
 const before=seek(144);
 for(const i of [239,0,99,22,170,144])evaluateFilmDirection(i/30,FILM);
 assert.deepEqual(seek(144),before);
 assert.equal(seek(144).frame,144);
 assert.equal(seek(0).frame,0);
 assert.equal(seek(99999).frame,239);
});
test('five named shot phases and bounded real camera coordinates',()=>{
 const receipt=validateFilmDirection(FILM);
 assert.equal(receipt.frames,240);
 assert.ok(receipt.shots>=5);
 for(let i=0;i<receipt.frames;i++){
  const c=seek(i);
  assert.ok(c.camera.zoom>=.8&&c.camera.zoom<=1.2);
  assert.ok(c.camera.orbitX>=-.5&&c.camera.orbitX<=.5);
  assert.ok(c.camera.orbitY>=-.5&&c.camera.orbitY<=.5);
  assert.ok(c.exploded>=0&&c.exploded<=1);
  assert.ok(c.xray>=0&&c.xray<=1);
  assert.ok(c.caption.length>10);
 }
});
test('camera transitions are smooth, without frame-to-frame jumping',()=>{
 let prev=seek(0);
 for(let f=1;f<240;f++){
  const p=seek(f);
  for(const k of ['zoom','orbitX','orbitY'])
   assert.ok(Math.abs(p.camera[k]-prev.camera[k])<.025,k+' jumped at '+f);
  assert.ok(Math.abs(p.exploded-prev.exploded)<.055,'explode jumped '+f);
  assert.ok(Math.abs(p.xray-prev.xray)<.055,'xray jumped '+f);
  prev=p;
 }
});
test('director supports each known film frame rate and duration',()=>{
 for(const fps of [24,25,30])for(const durationSeconds of [6,8,30]){
  const result=validateFilmDirection({fps,durationSeconds});
  assert.equal(result.frames,fps*durationSeconds);
  assert.equal(result.first.frame,0);
  assert.equal(result.last.frame,fps*durationSeconds-1);
 }
});
test('invalid timestamps and unsafe profiles are rejected',()=>{
 assert.throws(()=>evaluateFilmDirection(NaN,FILM),/FILM_DIRECTION_PROFILE_INVALID/);
 assert.throws(()=>evaluateFilmDirection(0,{fps:0,durationSeconds:8}),/FILM_DIRECTION_PROFILE_INVALID/);
 assert.throws(()=>evaluateFilmDirection(Infinity,FILM),/FILM_DIRECTION_PROFILE_INVALID/);
 assert.throws(()=>evaluateFilmDirection(0,{fps:29.9,durationSeconds:8}),/FILM_DIRECTION_PROFILE_INVALID/);
});
