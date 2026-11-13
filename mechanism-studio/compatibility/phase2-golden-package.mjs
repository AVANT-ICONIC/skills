/**
 * The sole allowed package-verifier change in phase 2: resolve reviewed
 * renderer source from the canonical regular file, not its legacy Git symlink.
 * All other code bytes, including manifest schema/evidence checks, must
 * remain identical to frozen PR32.
 */
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const source='mechanism-studio/rigid-scene/package-scene.mjs';
const oldImport="import {validateScene} from './scene-core.mjs';";
const addedImport=oldImport+"\nimport {assertTrustedRigidTemplate} from '../scripts/trusted-rigid-template.mjs';";
const oldReference=`  const reference=name==='rigid-pose-core.mjs'||name==='film-direction.mjs'
   ?join(HERE,'../scripts',name):join(HERE,name);`;
const newReference=`  const reference=name==='rigid-pose-core.mjs'||name==='film-direction.mjs'
   ?join(HERE,'../scripts',name):join(assertTrustedRigidTemplate().directory,name);`;
export function assertLegacyRigidPackageContract(baseline,current){
 const old=readFileSync(join(baseline,source),'utf8');
 if(!old.includes(oldImport)||!old.includes(oldReference))
  throw Error('PHASE2_BASELINE_PACKAGE_VERIFIER_UNRECOGNIZED');
 const expected=old.replace(oldImport,addedImport).replace(oldReference,newReference);
 const actual=readFileSync(join(current,source),'utf8');
 if(actual!==expected)throw Error('PHASE2_PACKAGE_READER_CONTRACT_DRIFT');
 return{schema:'avant.rigid-package-source-parity/1',status:'PASS',allowedDiffs:2,manifestChanged:false};
}
