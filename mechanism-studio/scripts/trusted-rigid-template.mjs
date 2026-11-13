/**
 * Canonical checked-in rigid-scene renderer source owner.
 * Legacy rigid-scene/{main,model,stage,style,scene-core} paths are Git symlinks,
 * never separately maintained renderer copies. This is NOT a code-signature.
 */
import {copyFileSync,lstatSync,readlinkSync,realpathSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const SKILL=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const RIGID_TEMPLATE_FILES=Object.freeze(['main.js','model.mjs','stage.js','style.css','scene-core.mjs']);
export const TRUSTED_RIGID_TEMPLATE_DIRECTORY=join(SKILL,'templates','rigid-scene');
/** Return a verified single source owner for all five renderer files. */
export function assertTrustedRigidTemplate({skillRoot=SKILL}={}){
 const root=resolve(skillRoot),template=join(root,'templates','rigid-scene');
 for(const name of RIGID_TEMPLATE_FILES){
  const original=join(root,'rigid-scene',name),canonical=join(template,name);
  let meta,facade;
  try{meta=lstatSync(canonical);facade=lstatSync(original);}
  catch{throw Error('TRUSTED_TEMPLATE_FILE_MISSING: '+name);}
  if(!meta.isFile()||meta.isSymbolicLink())throw Error('TRUSTED_TEMPLATE_SOURCE_NOT_REGULAR: '+name);
  if(!facade.isSymbolicLink()||readlinkSync(original)!=='../templates/rigid-scene/'+name)
   throw Error('TRUSTED_TEMPLATE_LEGACY_FACADE_INVALID: '+name);
  if(realpathSync(original)!==realpathSync(canonical))
   throw Error('TRUSTED_TEMPLATE_FACADE_TARGET_MISMATCH: '+name);
 }
 return {directory:template,files:RIGID_TEMPLATE_FILES.length,owner:'mechanism-studio/templates/rigid-scene'};
}
export function copyTrustedRigidTemplate(destination){
 const {directory}=assertTrustedRigidTemplate();
 for(const name of RIGID_TEMPLATE_FILES)copyFileSync(join(directory,name),join(destination,name));
 return RIGID_TEMPLATE_FILES.length;
}
