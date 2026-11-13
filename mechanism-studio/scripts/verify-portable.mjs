#!/usr/bin/env node
/**
 * Additive, read-only package router for the two existing Mechanism Studio
 * preview formats. The original format-specific verifiers remain authoritative.
 * This is not a v2 schema, a schema migration, a signature or a release gate.
 */
import {lstatSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const RECEIPT_SCHEMA='avant.mechanism-package-verification/1';
const MAX_MANIFEST_BYTES=1024*1024;
const MAX_ASSETS=64;
const ACCEPTED=Object.freeze(['avant.mechanism-package/1','avant.rigid-scene-package/1']);

function regular(path){
 const meta=lstatSync(path);
 if(!meta.isFile()||meta.isSymbolicLink())throw Error('PORTABLE_PACKAGE_NONREGULAR_FILE: '+path);
 return meta;
}
function auditAsset(root,rel){
 if(typeof rel!=='string'||rel.length<1||rel.length>512||rel.includes('\\')||
    rel.startsWith('/')||rel.includes('//')||rel.split('/').some(s=>!s||s==='.'||s==='..'))
  throw Error('PORTABLE_PACKAGE_UNSAFE_ASSET_PATH');
 const parts=rel.split('/');
 let next=root;
 for(let i=0;i<parts.length;i++){
  next=join(next,parts[i]);
  const stat=lstatSync(next);
  if(stat.isSymbolicLink()||(i===parts.length-1?!stat.isFile():!stat.isDirectory()))
   throw Error('PORTABLE_PACKAGE_UNSAFE_ASSET_ENTRY: '+rel);
 }
}
/**
 * Verify without rewriting manifests, package bytes or legacy verification APIs.
 * Dynamically load only the selected verifier, avoiding unnecessary cross-family
 * module dependencies (notably the repository-side rigid template symlinks).
 */
export async function verifyPortablePackage(folder){
 const root=resolve(folder);
 const dir=lstatSync(root);
 if(!dir.isDirectory()||dir.isSymbolicLink())throw Error('PORTABLE_PACKAGE_ROOT_INVALID');
 const manifestFile=join(root,'manifest.json');
 const stat=regular(manifestFile);
 if(stat.size>MAX_MANIFEST_BYTES)throw Error('PORTABLE_PACKAGE_MANIFEST_TOO_LARGE');
 const manifest=JSON.parse(readFileSync(manifestFile,'utf8'));
 if(!manifest||typeof manifest!=='object'||Array.isArray(manifest)||
    !ACCEPTED.includes(manifest.schema))throw Error('PORTABLE_PACKAGE_SCHEMA_UNSUPPORTED');
 if(!Array.isArray(manifest.assets)||manifest.assets.length<1||manifest.assets.length>MAX_ASSETS)
  throw Error('PORTABLE_PACKAGE_ASSET_TABLE_INVALID');
 for(const a of manifest.assets) auditAsset(root,a?.path);
 let legacy;
 if(manifest.schema==='avant.mechanism-package/1'){
  const {verifyPackage}=await import('./package-example.mjs');
  legacy=verifyPackage(root);
 }else{
  const {verifyScenePackage}=await import('../rigid-scene/package-scene.mjs');
  legacy=verifyScenePackage(root);
 }
 if(legacy.releaseReady!==false||!(legacy.verified===true||legacy.status==='PASS'))
  throw Error('PORTABLE_PACKAGE_LEGACY_VERIFICATION_INCOMPLETE');
 return Object.freeze({schema:RECEIPT_SCHEMA,sourceSchema:manifest.schema,
  packageId:legacy.packageId??legacy.id,tier:manifest.tier,
  assetsVerified:legacy.files??legacy.assets,status:'PASS',releaseReady:false});
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 try{
  if(process.argv.length!==3)throw Error('Usage: node scripts/verify-portable.mjs PACKAGE_DIR');
  console.log(JSON.stringify(await verifyPortablePackage(process.argv[2]),null,2));
 }catch(e){console.error(String(e.message||e));process.exitCode=1;}
}
