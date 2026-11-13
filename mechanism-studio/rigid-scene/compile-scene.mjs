#!/usr/bin/env node
/** Emits only reviewed visual source and a schema-validated declarative scene. */
import {copyFileSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateScene,sceneDigest} from './scene-core.mjs';
import {validateSceneSources} from '../scripts/source-validation.mjs';
import {compileToNewDirectory} from '../scripts/compiler-io.mjs';
import {compileStudy} from '../scripts/compile-study.mjs';
const ROOT=dirname(fileURLToPath(import.meta.url));
const SKILL=resolve(ROOT,'..');
const TEMPLATE=['main.js','model.mjs','stage.js','style.css','scene-core.mjs'];
const CANON=[['rigid-pose-core.mjs',join(SKILL,'scripts/rigid-pose-core.mjs')],
 ['film-direction.mjs',join(SKILL,'scripts/film-direction.mjs')]];
export function compileScene({scene,out}){
 const validated=validateScene(scene);
 // Preserve the bundled runtime validator and historical error precedence.
 validateSceneSources(validated.references);
 return compileToNewDirectory({out,sourceRoot:SKILL,errors:{
  within:'SCENE_OUTPUT_UNSAFE_OR_EXISTS',exists:'SCENE_OUTPUT_UNSAFE_OR_EXISTS',staging:'SCENE_STAGING_EXISTS'
 },build:(temp,dest)=>{
  for(const name of TEMPLATE)copyFileSync(join(ROOT,name),join(temp,name));
  for(const [name,from] of CANON)copyFileSync(from,join(temp,name));
  writeFileSync(join(temp,'scene-data.mjs'),
   '/* Checked, data-only rigid joint graph. */\nexport const SCENE=Object.freeze('+JSON.stringify(validated,null,2)+');\n');
  writeFileSync(join(temp,'scene.json'),sceneDigest(validated));
  writeFileSync(join(temp,'source-register.json'),JSON.stringify({schema:'avant.rigid-scene-sources/1',
   sceneId:validated.id,references:validated.references,dimensionsProvenance:validated.dimensionsProvenance,
   sourceDocumentsRetrieved:false,sourceImagesRedistributed:false,certifiedPhysics:false},null,2)+'\n');
  writeFileSync(join(temp,'README.md'),`# ${validated.id}\n\nGenerated from the reusable declarative rigid-joint renderer.\nNo five-bar kinematic formula exists in these files. The scene is data-only and source references have not been retrieved or validated.\n\nNot approved for physical fabrication, loading, collision or safety analysis. releaseReady=false.\n`);
  return {id:validated.id,path:dest,files:TEMPLATE.length+CANON.length+4,
   graphBodies:validated.bodies.length,graphJoints:validated.joints.length,
   runtime:'generic-se2',sourcesVerified:false,releaseReady:false};
 }});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{if(process.argv.length!==4)throw Error('Usage: node compile-scene.mjs SCENE_JSON NEW_OUTPUT_DIR');
  const study=JSON.parse(readFileSync(resolve(process.argv[2]),'utf8'));
  const result=study?.schema==='avant.rigid-scene/1'?compileStudy({study,out:process.argv[3],handlers:{'rigid-scene':compileScene}}):compileScene({scene:study,out:process.argv[3]});
  console.log(JSON.stringify(result));}
 catch(e){console.error(e.stack||e);process.exitCode=1;}
}
