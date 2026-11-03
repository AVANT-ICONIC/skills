import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {synthesizeMechanicalWav} from '../scripts/audio.mjs';
const H=b=>createHash('sha256').update(b).digest('hex');

test('synthesized foley is deterministic, 48 kHz, mono PCM16 with correct duration',()=>{
 const opts={durationSeconds:8,inputRpm:15};
 const a=synthesizeMechanicalWav(opts),b=synthesizeMechanicalWav(opts);
 assert.equal(H(a),H(b));
 assert.equal(a.toString('ascii',0,4),'RIFF');
 assert.equal(a.toString('ascii',8,12),'WAVE');
 assert.equal(a.readUInt16LE(20),1);
 assert.equal(a.readUInt16LE(22),1);
 assert.equal(a.readUInt32LE(24),48000);
 assert.equal(a.readUInt16LE(34),16);
 assert.equal(a.length,44+8*48000*2);
 assert.ok(Math.abs(a.readInt16LE(44))<2);
});
test('sound changes with actual motor speed, rejects invalid profiles',()=>{
 assert.notEqual(H(synthesizeMechanicalWav({durationSeconds:6,inputRpm:12})),
  H(synthesizeMechanicalWav({durationSeconds:6,inputRpm:24})));
 for(const settings of [{durationSeconds:0,inputRpm:12},{durationSeconds:45,inputRpm:12},
   {durationSeconds:8,inputRpm:Infinity},{durationSeconds:8,inputRpm:15,sampleRate:22050}])
  assert.throws(()=>synthesizeMechanicalWav(settings),/AUDIO_PROFILE_UNSUPPORTED/);
});
