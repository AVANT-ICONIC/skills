/**
 * Original procedural mechanism sound design. No samples, loops or existing
 * recordings: synthesized motor harmonics and damped dead-centre clicks.
 * Aural illustration, NOT a measured real-world mechanical sound model.
 */
import {writeFileSync} from 'node:fs';

export function synthesizeMechanicalWav({durationSeconds,inputRpm,sampleRate=48000}){
  if(!Number.isInteger(durationSeconds)||durationSeconds<6||durationSeconds>30||
     !Number.isFinite(inputRpm)||inputRpm<3||inputRpm>60||sampleRate!==48000)
    throw new TypeError('AUDIO_PROFILE_UNSUPPORTED');
  const samples=durationSeconds*sampleRate;
  const buf=Buffer.allocUnsafe(44+samples*2);
  buf.write('RIFF',0,'ascii');buf.writeUInt32LE(buf.length-8,4);
  buf.write('WAVE',8,'ascii');buf.write('fmt ',12,'ascii');
  buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);
  buf.writeUInt32LE(sampleRate,24);buf.writeUInt32LE(sampleRate*2,28);
  buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);
  buf.write('data',36,'ascii');buf.writeUInt32LE(samples*2,40);
  const tau=2*Math.PI;
  const tickInterval=30/inputRpm;
  const frequency=80+inputRpm*1.6;
  for(let i=0;i<samples;i++){
    const t=i/sampleRate,clickTime=(t%tickInterval);
    const envelope=Math.exp(-58*clickTime);
    // All waves are original oscillator functions. Clicks mark the two
    // dead-centre instants in each revolution (not combustion events).
    const hum=.039*Math.sin(tau*frequency*t)+.016*Math.sin(tau*frequency*2.01*t);
    const undertone=.022*Math.sin(tau*(frequency/2.3)*t);
    const click=envelope*(.16*Math.sin(tau*440*clickTime)+
      .09*Math.sin(tau*840*clickTime)+.035*Math.sin(tau*1560*clickTime));
    const fade=Math.min(1,t/.22,(durationSeconds-t)/.32);
    const sample=Math.max(-.95,Math.min(.95,(hum+undertone+click)*Math.max(0,fade)));
    buf.writeInt16LE(Math.round(sample*32767),44+i*2);
  }
  return buf;
}
export function writeMechanicalWav(path,settings){
  const buf=synthesizeMechanicalWav(settings);
  writeFileSync(path,buf);
  return {path,bytes:buf.length,sampleRate:48000,channels:1,
    basis:'original-synthesized-illustrative-not-recorded'};
}
