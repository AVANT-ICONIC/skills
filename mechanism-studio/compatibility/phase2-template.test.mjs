import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,symlinkSync,readFileSync,writeFileSync,lstatSync,unlinkSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {assertTrustedRigidTemplate,RIGID_TEMPLATE_FILES} from '../scripts/trusted-rigid-template.mjs';
import {compileScene} from '../rigid-scene/compile-scene.mjs';
const SKILL=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const scene=JSON.parse(readFileSync(join(SKILL,'rigid-scene/scene.json'),'utf8'));
const slider=JSON.parse(readFileSync(join(SKILL,'rigid-scene/slider-rail.json'),'utf8'));
const temporary=fn=>()=>{const dir=mkdtempSync(join(tmpdir(),'trusted-template-check-'));try{return fn(dir);}finally{rmSync(dir,{recursive:true,force:true});}};
function shadow(root){
 mkdirSync(join(root,'rigid-scene'),{recursive:true});
 mkdirSync(join(root,'templates/rigid-scene'),{recursive:true});
 for(const name of RIGID_TEMPLATE_FILES){
  writeFileSync(join(root,'templates/rigid-scene',name),'trusted canonical bytes: '+name+'\n');
  symlinkSync('../templates/rigid-scene/'+name,join(root,'rigid-scene',name));
 }
}
test('one canonical implementation per template; legacy paths are symlink facades',()=>{
 const receipt=assertTrustedRigidTemplate();
 assert.equal(receipt.files,5);
 assert.equal(receipt.owner,'mechanism-studio/templates/rigid-scene');
 for(const name of RIGID_TEMPLATE_FILES){
  const entry=join(SKILL,'rigid-scene',name),canonical=join(receipt.directory,name);
  assert.equal(lstatSync(entry).isSymbolicLink(),true,name);
  assert.equal(lstatSync(canonical).isFile(),true,name);
  assert.deepEqual(readFileSync(entry),readFileSync(canonical),name);
 }
});
test('both different rigid topologies compile from byte-identical trusted renderer',temporary(dir=>{
 const results=[];
 for(const data of [scene,slider]){
  const out=join(dir,data.id),receipt=compileScene({scene:data,out});
  assert.equal(receipt.files,11);
  for(const name of RIGID_TEMPLATE_FILES)
   assert.deepEqual(readFileSync(join(out,name)),readFileSync(join(SKILL,'templates/rigid-scene',name)));
  results.push(out);
 }
 for(const name of RIGID_TEMPLATE_FILES)
  assert.deepEqual(readFileSync(join(results[0],name)),readFileSync(join(results[1],name)),name);
}));
test('legacy facade cannot be replaced with a regular source file',temporary(dir=>{
 shadow(dir);const p=join(dir,'rigid-scene/stage.js');unlinkSync(p);writeFileSync(p,'bad injected source');
 assert.throws(()=>assertTrustedRigidTemplate({skillRoot:dir}),/TRUSTED_TEMPLATE_LEGACY_FACADE_INVALID/);
}));
test('legacy facade symlink cannot redirect outside canonical template',temporary(dir=>{
 shadow(dir);const p=join(dir,'rigid-scene/main.js');unlinkSync(p);symlinkSync('/tmp/untrusted-source.js',p);
 assert.throws(()=>assertTrustedRigidTemplate({skillRoot:dir}),/TRUSTED_TEMPLATE_LEGACY_FACADE_INVALID/);
}));
test('canonical implementation must be a real regular file, not an arbitrary symlink',temporary(dir=>{
 shadow(dir);const p=join(dir,'templates/rigid-scene/style.css');unlinkSync(p);symlinkSync('/etc/hosts',p);
 assert.throws(()=>assertTrustedRigidTemplate({skillRoot:dir}),/TRUSTED_TEMPLATE_SOURCE_NOT_REGULAR/);
}));
test('missing or swapped legacy ownership fails before delivery',temporary(dir=>{
 shadow(dir);const p=join(dir,'rigid-scene/model.mjs');unlinkSync(p);symlinkSync('../templates/rigid-scene/stage.js',p);
 assert.throws(()=>assertTrustedRigidTemplate({skillRoot:dir}),/TRUSTED_TEMPLATE_LEGACY_FACADE_INVALID/);
}));
