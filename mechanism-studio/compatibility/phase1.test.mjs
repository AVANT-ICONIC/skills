import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdtempSync,readFileSync,rmSync,writeFileSync,symlinkSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {validateSourceReference,validateSceneSources} from '../scripts/source-validation.mjs';
import {compileToNewDirectory} from '../scripts/compiler-io.mjs';
import {compareOutputTrees,receiptForTree} from '../scripts/portable-receipt.mjs';
import {compileStudy,listStudyCompilers} from '../scripts/compile-study.mjs';
import {compileScene} from '../rigid-scene/compile-scene.mjs';
const recipe={id:'engineering-ref',type:'technical-reference',title:'Reference source',url:'https://Example.org:443/study',redistribution:'link-only'};
const rigid={...recipe,title:'A technical reference',contentChecked:false};
const clone=x=>structuredClone(x);
const inTemp=fn=>()=>{const dir=mkdtempSync(join(tmpdir(),'mechanism-phase1-'));try{return fn(dir);}finally{rmSync(dir,{recursive:true,force:true});}};
test('legacy reference profile keeps exact normalized fields and property order',()=>{
 assert.deepEqual(validateSourceReference(recipe,{profile:'reviewed-recipe'}),{
  id:'engineering-ref',type:'technical-reference',url:'https://example.org/study',title:'Reference source',redistribution:'link-only'});
 const extra={...recipe,contentChecked:true,ignoredField:'legacy-format-tolerated'};
 assert.deepEqual(validateSourceReference(extra,{profile:'reviewed-recipe'}),validateSourceReference(recipe,{profile:'reviewed-recipe'}));
 assert.throws(()=>validateSourceReference({...recipe,type:'unknown',url:'bad'},{profile:'reviewed-recipe'}),/SOURCE_TYPE_UNSUPPORTED/);
 assert.throws(()=>validateSourceReference({...recipe,redistribution:'copyable'},{profile:'reviewed-recipe'}),/SOURCE_REUSE_NOT_APPROVED/);
 assert.throws(()=>validateSourceReference({...recipe,title:'A'},{profile:'reviewed-recipe'}),/SOURCE_TITLE_INVALID/);
 assert.throws(()=>validateSourceReference(null,{profile:'reviewed-recipe'}),/BAD_SOURCE/);
 assert.throws(()=>validateSourceReference({...recipe,id:12345},{profile:'reviewed-recipe'}),/SOURCE_ID_INVALID/);
});
test('rigid source references retain source order and contentChecked=false',()=>{
 assert.equal(validateSourceReference(rigid,{profile:'rigid-scene'}),rigid);
 assert.equal(validateSceneSources([rigid])[0],rigid);
 assert.throws(()=>validateSourceReference({...rigid,contentChecked:true},{profile:'rigid-scene'}),/SCENE_REFERENCE_UNSAFE/);
 assert.throws(()=>validateSourceReference({...rigid,script:'code'},{profile:'rigid-scene'}),/SCENE_UNKNOWN_FIELD_reference/);
 assert.throws(()=>validateSceneSources([]),/SCENE_REFERENCES_REQUIRED/);
 assert.throws(()=>validateSourceReference(rigid,{profile:'unknown'}),/SOURCE_PROFILE_UNSUPPORTED/);
});
test('shared safe URL checks reject credentials, http and localhost for both profiles',()=>{
 for(const profile of ['reviewed-recipe','rigid-scene'])for(const url of ['http://example.org','https://test:pass@example.org/study','https://localhost','https://sub.localhost/path']){
  const source={...(profile==='rigid-scene'?rigid:recipe),url};
  assert.throws(()=>validateSourceReference(source,{profile}),/SOURCE_URL_UNSAFE|SCENE_REFERENCE_UNSAFE/);
 }
});
test('one atomic staging owner preserves custom error labels and cleans failed builds',inTemp(dir=>{
 const base=join(dir,'sources');mkdirSync(base);
 const dest=join(dir,'emitted');
 const messages={within:'INSIDE_ROOT',exists:'TARGET_EXISTS',staging:'STAGING_EXISTS'};
 assert.throws(()=>compileToNewDirectory({out:join(base,'bad'),sourceRoot:base,errors:messages,build(){}}),/INSIDE_ROOT/);
 assert.throws(()=>compileToNewDirectory({out:dest,sourceRoot:base,errors:messages,build(stage){writeFileSync(join(stage,'partial'),'x');throw Error('BUILD_FAIL');}}),/BUILD_FAIL/);
 assert.equal(existsSync(dest+'.stage-'+process.pid),false);
 const result=compileToNewDirectory({out:dest,sourceRoot:base,errors:messages,build(stage,target){writeFileSync(join(stage,'asset'),'exact');return{target};}});
 assert.equal(result.target,dest);assert.equal(readFileSync(join(dest,'asset'),'utf8'),'exact');
 assert.throws(()=>compileToNewDirectory({out:dest,sourceRoot:base,errors:messages,build(){}}),/TARGET_EXISTS/);
}));
test('portable receipt rejects any changed output bytes, files or symlinks',inTemp(dir=>{
 const one=join(dir,'a'),two=join(dir,'b');mkdirSync(one);mkdirSync(two);
 for(const p of [one,two])writeFileSync(join(p,'byte.txt'),'exact');
 assert.equal(compareOutputTrees(one,two).files,1);
 writeFileSync(join(two,'byte.txt'),'altered');assert.throws(()=>compareOutputTrees(one,two),/COMPILER_OUTPUT_DRIFT/);
 writeFileSync(join(two,'byte.txt'),'exact');symlinkSync(join(two,'byte.txt'),join(two,'link'));
 assert.throws(()=>receiptForTree(two),/RECEIPT_UNSAFE_ENTRY/);
}));
test('canonical dispatch rejects unknown schemas and invokes an explicitly approved backend',()=>{
 assert.deepEqual(Object.keys(listStudyCompilers()).sort(),['avant.mechanism-request/1','avant.rigid-scene/1']);
 assert.throws(()=>compileStudy({study:{schema:'fake'},out:'/tmp/x'}),/STUDY_SCHEMA_UNSUPPORTED/);
 assert.throws(()=>compileStudy({study:{schema:'avant.rigid-scene/1'},out:'/tmp/x'}),/STUDY_ROUTE_HANDLER_MISSING/);
 const out=compileStudy({study:{schema:'avant.rigid-scene/1'},out:'ignored',handlers:{'rigid-scene':({scene,out})=>scene.schema+'@'+out}});
 assert.equal(out,'avant.rigid-scene/1@ignored');
});
test('new canonical route and old scene backend produce byte-identical rigid scene output for both topologies',inTemp(dir=>{
 for(const filename of ['scene.json','slider-rail.json']){
  const scene=JSON.parse(readFileSync(new URL('../rigid-scene/'+filename,import.meta.url)));
  const a=join(dir,filename+'-old'),b=join(dir,filename+'-new');
  compileScene({scene,out:a});
  compileStudy({study:scene,out:b,handlers:{'rigid-scene':compileScene}});
  assert.equal(compareOutputTrees(a,b).status,'PASS');
 }
}));
