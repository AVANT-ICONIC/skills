import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {compileScene} from './compile-scene.mjs';
const scene=JSON.parse(readFileSync(fileURLToPath(new URL('./scene.json',import.meta.url)),'utf8'));
test('compile data-only scene and import same runtime for previously unseen mechanism',async()=>{
 const root=mkdtempSync(join(tmpdir(),'rigid-scene-test-'));try{
  const out=join(root,scene.id);const receipt=compileScene({scene,out});
  assert.equal(receipt.releaseReady,false);assert.equal(receipt.runtime,'generic-se2');
  for(const f of ['main.js','stage.js','model.mjs','style.css','scene-core.mjs','rigid-pose-core.mjs','scene-data.mjs','scene.json','source-register.json'])assert.ok(existsSync(join(out,f)));
  const m=await import(pathToFileURL(join(out,'model.mjs')).href);
  assert.equal(m.evaluateAtTime(2).status,'closed');
  assert.ok(Math.abs(m.evaluateAtTime(2).tip.y-m.evaluateAtTime(2,{branch:'crossed'}).tip.y)>30);
  assert.throws(()=>compileScene({scene,out}),/OUTPUT_UNSAFE_OR_EXISTS/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
