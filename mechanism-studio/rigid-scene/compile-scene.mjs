#!/usr/bin/env node
/** Emits only reviewed visual source and a schema-validated declarative scene. */
import {copyFileSync,existsSync,mkdirSync,readFileSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,resolve,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateScene,sceneDigest} from './scene-core.mjs';
const ROOT=dirname(fileURLToPath(import.meta.url));
const SKILL=resolve(ROOT,'..');
const TEMPLATE=['main.js','model.mjs','stage.js','style.css','scene-core.mjs'];
const CANON=[['rigid-pose-core.mjs',join(SKILL,'scripts/rigid-pose-core.mjs')],
 ['film-direction.mjs',join(SKILL,'scripts/film-direction.mjs')]];
export function compileScene({scene,out}){
 const validated=validateScene(scene),dest=resolve(out);
 if(dest===SKILL||dest.startsWith(SKILL+sep)||existsSync(dest))throw Error('SCENE_OUTPUT_UNSAFE_OR_EXISTS');
 const temp=dest+'.stage-'+process.pid;
 if(existsSync(temp))throw Error('SCENE_STAGING_EXISTS');
 try{
  mkdirSync(temp,{recursive:true});
  for(const name of TEMPLATE)copyFileSync(join(ROOT,name),join(temp,name));
  for(const [name,from] of CANON)copyFileSync(from,join(temp,name));
  writeFileSync(join(temp,'scene-data.mjs'),
   '/* Checked, data-only rigid joint graph. */\nexport const SCENE=Object.freeze('+JSON.stringify(validated,null,2)+');\n');
  writeFileSync(join(temp,'scene.json'),sceneDigest(validated));
  writeFileSync(join(temp,'source-register.json'),JSON.stringify({schema:'avant.rigid-scene-sources/1',
   sceneId:validated.id,references:validated.references,dimensionsProvenance:validated.dimensionsProvenance,
   sourceDocumentsRetrieved:false,sourceImagesRedistributed:false,certifiedPhysics:false},null,2)+'\n');
  writeFileSync(join(temp,'README.md'),`# ${validated.id}\n\nGenerated from the reusable declarative rigid-joint renderer.\nNo five-bar kinematic formula exists in these files. The scene is data-only and source references have not been retrieved or validated.\n\nNot approved for physical fabrication, loading, collision or safety analysis. releaseReady=false.\n`);
  renameSync(temp,dest);
  return {id:validated.id,path:dest,files:TEMPLATE.length+CANON.length+4,
   graphBodies:validated.bodies.length,graphJoints:validated.joints.length,
   runtime:'generic-se2',sourcesVerified:false,releaseReady:false};
 }catch(e){rmSync(temp,{recursive:true,force:true});throw e;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{if(process.argv.length!==4)throw Error('Usage: node compile-scene.mjs SCENE_JSON NEW_OUTPUT_DIR');
  console.log(JSON.stringify(compileScene({scene:JSON.parse(readFileSync(resolve(process.argv[2]),'utf8')),out:process.argv[3]})));}
 catch(e){console.error(e.stack||e);process.exitCode=1;}
}
