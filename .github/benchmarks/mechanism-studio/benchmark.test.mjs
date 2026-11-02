import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {nominalRackTravel,validateUpstream,checkVideoProbe,main} from './benchmark.mjs';

test('Cessna rack distance is geometric and 201 mm is rounded',()=>{
  assert.ok(Math.abs(nominalRackTravel()-201.0619298297)<1e-7);
  assert.throws(()=>nominalRackTravel(0,4),/positive finite/);
  assert.throws(()=>nominalRackTravel(32,NaN),/positive finite/);
});
test('pin validation rejects wrong revision without file access',()=>{
  assert.throws(()=>validateUpstream('/missing','0000000000000000000000000000000000000000'),/PIN_MISMATCH/);
});
test('pin validation rejects tampered dependency lock',()=>{
  const d=mkdtempSync(path.join(tmpdir(),'mechanism-pin-'));
  try{
    writeFileSync(path.join(d,'package-lock.json'),'{}');
    assert.throws(()=>validateUpstream(d,'a91262ac1109051e014662d42ecb0b7bc1f113b1'),/LOCK_MISMATCH/);
  }finally{rmSync(d,{recursive:true,force:true});}
});
test('ffprobe checks video timebase, pixel format and frame count',()=>{
  const opts={width:640,height:360,fps:24,frames:24};
  const video={codec_type:'video',codec_name:'h264',pix_fmt:'yuv420p',width:640,height:360,avg_frame_rate:'24/1',nb_frames:'24'};
  assert.equal(checkVideoProbe({streams:[video]},opts).frames,24);
  assert.throws(()=>checkVideoProbe({streams:[{...video,nb_frames:'23'}]},opts),/VIDEO_FRAMES/);
  assert.throws(()=>checkVideoProbe({streams:[{...video,pix_fmt:'yuv444p'}]},opts),/VIDEO_CODEC/);
  assert.throws(()=>checkVideoProbe({streams:[]},opts),/VIDEO_MISSING/);
});
test('read-only help and missing arguments do not install or fetch',async()=>{
  assert.equal(await main(['--help']),0);
  assert.equal(await main([]),2);
});
