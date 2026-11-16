#!/usr/bin/env node
/**
 * Optional, detached Phase 3b proof index. Verifies only *internal bindings*.
 * An index is UNATTESTED even when it exactly matches a legacy package.
 * No writer, code execution, source retrieval, migration or trust-key handling.
 */
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import {isAbsolute,join,parse,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyPortablePackage} from './verify-portable.mjs';

export const PROOF_INDEX_SCHEMA='avant.mechanism-proof-index/1';
const RESULT_SCHEMA='avant.mechanism-proof-index-result/1';
const MAX_INDEX_BYTES=64*1024;
const MAX_REPORT_BYTES=1024*1024;
const MAX_REFS=32;
const ID=/^[a-z][a-z0-9-]{0,63}$/;
const HASH=/^[0-9a-f]{64}$/;
const CHECK_ID=/^[A-Za-z][A-Za-z0-9_.-]{0,79}$/;
const DOMAINS=new Set(['package-integrity','model-consistency','render-reproducibility',
 'source-provenance','physical-safety','host-isolation']);
const REPORT_FILES=new Set(['evidence/report.json','evidence/benchmark.json']);
// A check's reported success must belong to its claimed domain. Unknown checks
// are not promoted to arbitrary proof categories, even when the report says PASS.
const REPORTED_CHECKS={
 'avant.mechanism-package/1':{
  'render-reproducibility':new Set([
   'T0.3-build-live-and-film','T0.4-seek-v8-film','T0.4-seek-cessna-film',
   'T0.3-capture-v8-film','T0.3-capture-cessna-film',
   'offline-browser-boot','nonsequential-frame-reproducibility',
   'full-hd-layout-and-legibility','actual-cinematic-camera-storyboard',
   'full-film-capture','film-decoder-and-decoded-frames',
   'original-foley-and-final-film-mux']),
  'model-consistency':new Set(['kinematics-source-agreement'])
 },
 'avant.rigid-scene-package/1':{
  'render-reproducibility':new Set([
   'trusted-build-html','chromium-boot','replay-and-branch-interaction',
   'six-unique-physical-poses','editorial-no-panel-overlap',
   'offline-and-errors','real-full-film','decode-and-original-audio',
   'prismatic-rail-and-closure']),
  'model-consistency':new Set(['six-unique-physical-poses','prismatic-rail-and-closure'])
 }
};
const EVIDENCE_FILES={
 'avant.mechanism-package/1':new Set([
  'evidence/benchmark.json','evidence/report.json','evidence/request.json',
  'evidence/source-register.json','evidence/model-audit.json',
  'evidence/mechanism-graph.json']),
 'avant.rigid-scene-package/1':new Set([
  'evidence/scene.json','evidence/source-register.json','evidence/report.json'])
};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const keys=(value,allowed,label)=>{
 if(!value||typeof value!=='object'||Array.isArray(value)||
  Object.keys(value).some(x=>!allowed.includes(x)))
  throw Error('PROOF_INDEX_FIELDS_INVALID: '+label);
};
const exactly=(value,required,optional,label)=>{
 keys(value,[...required,...optional],label);
 if(required.some(k=>!Object.hasOwn(value,k)))
  throw Error('PROOF_INDEX_FIELDS_MISSING: '+label);
};
function parseUniqueJson(buffer,label){
 const raw=buffer.toString('utf8'),stack=[];
 // JSON.parse itself validates syntax. This scanner additionally rejects duplicate
 // object keys (including equivalent Unicode escapes) before any field lookup.
 for(let i=0;i<raw.length;i++){
  const ch=raw[i];
  if(ch==='{'||ch==='['){stack.push({kind:ch,seen:new Set()});continue;}
  if(ch==='}'||ch===']'){stack.pop();continue;}
  if(ch!=='"')continue;
  const start=i;
  i++;
  for(;i<raw.length;i++){
   if(raw[i]==='\\'){i++;continue;}
   if(raw[i]==='"')break;
  }
  if(i>=raw.length)throw Error('PROOF_INDEX_JSON_INVALID: '+label);
  let k=i+1;while(/\s/.test(raw[k]??'')&&k<raw.length)k++;
  if(raw[k]===':'&&stack.at(-1)?.kind==='{'){
   const decoded=JSON.parse(raw.slice(start,i+1));
   const seen=stack.at(-1).seen;
   if(seen.has(decoded))throw Error('PROOF_INDEX_DUPLICATE_FIELD: '+label+'.'+decoded);
   seen.add(decoded);
  }
 }
 return JSON.parse(raw);
}
function boundedRegular(path,max,reason){
 const s=lstatSync(path);
 if(!s.isFile()||s.isSymbolicLink()||s.size<1||s.size>max)
  throw Error(reason);
 return readFileSync(path);
}
function noSymlinkComponents(path){
 const full=resolve(path),parts=full.slice(parse(full).root.length).split(sep).filter(Boolean);
 let current=parse(full).root;
 for(let i=0;i<parts.length;i++){
  current=join(current,parts[i]);
  const s=lstatSync(current);
  if(s.isSymbolicLink()||(i===parts.length-1?!s.isFile():!s.isDirectory()))
   throw Error('PROOF_INDEX_UNSAFE_SIDECAR_PATH');
 }
 return full;
}
const within=(parent,child)=>{
 const rel=relative(parent,child);
 return rel===''||(!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel));
};
function readDetachedIndex(indexFile,packageDirectory){
 if(typeof indexFile!=='string'||!indexFile.trim())
  throw Error('PROOF_INDEX_REQUIRED');
 const sidecar=noSymlinkComponents(indexFile);
 const packageRoot=realpathSync(resolve(packageDirectory));
 if(within(packageRoot,realpathSync(sidecar)))
  throw Error('PROOF_INDEX_MUST_BE_DETACHED');
 return parseUniqueJson(boundedRegular(sidecar,MAX_INDEX_BYTES,'PROOF_INDEX_FILE_INVALID'),'index');
}
function assertSubject(index,manifest,legacy,manifestBytes){
 exactly(index.subject,['sourceSchema','packageId','manifestSha256','assetCount','releaseReady'],[],'subject');
 const subject=index.subject;
 if(subject.sourceSchema!==legacy.sourceSchema||
  subject.packageId!==legacy.packageId||
  !HASH.test(subject.manifestSha256)||subject.manifestSha256!==hash(manifestBytes)||
  subject.assetCount!==legacy.assetsVerified||subject.releaseReady!==false)
  throw Error('PROOF_INDEX_SUBJECT_MISMATCH');
 if(manifest.schema!==subject.sourceSchema)throw Error('PROOF_INDEX_SCHEMA_MISMATCH');
}
function validateReference(ref,manifest,packageDirectory,used){
 exactly(ref,['id','domain','assetPath','assetSha256','assessment','evaluator','method'],['legacyCheckId'],'reference');
 if(typeof ref.id!=='string'||!ID.test(ref.id)||used.has(ref.id))
  throw Error('PROOF_INDEX_DUPLICATE_OR_INVALID_ID');
 used.add(ref.id);
 if(!DOMAINS.has(ref.domain)||!EVIDENCE_FILES[manifest.schema].has(ref.assetPath)||
    !HASH.test(ref.assetSha256))
  throw Error('PROOF_INDEX_EVIDENCE_UNSUPPORTED');
 const matching=manifest.assets.filter(a=>a.path===ref.assetPath);
 if(matching.length!==1||matching[0].sha256!==ref.assetSha256)
  throw Error('PROOF_INDEX_ASSET_BINDING_MISMATCH');
 const actual=boundedRegular(join(packageDirectory,ref.assetPath),MAX_REPORT_BYTES,'PROOF_INDEX_EVIDENCE_FILE_INVALID');
 if(hash(actual)!==ref.assetSha256)throw Error('PROOF_INDEX_ASSET_HASH_MISMATCH');
 if(ref.domain==='host-isolation'||ref.domain==='physical-safety'){
  if(ref.assessment!=='NOT_EVALUATED')throw Error('PROOF_INDEX_UNSUPPORTED_CERTIFICATION');
 }
 if(ref.assessment==='REPLAYED')throw Error('PROOF_INDEX_REPLAY_NOT_IMPLEMENTED');
 if(ref.assessment==='NOT_EVALUATED'){
  if(ref.evaluator!=='none'||ref.method!=='not-evaluated'||Object.hasOwn(ref,'legacyCheckId'))
   throw Error('PROOF_INDEX_ASSESSMENT_INVALID');
 }else if(ref.assessment==='REPORTED'){
  if(!REPORT_FILES.has(ref.assetPath)||ref.evaluator!=='legacy-report'||
     ref.method!=='manifest-hash-and-check-id'||typeof ref.legacyCheckId!=='string'||
     !CHECK_ID.test(ref.legacyCheckId))
   throw Error('PROOF_INDEX_ASSESSMENT_INVALID');
  if(!REPORTED_CHECKS[manifest.schema]?.[ref.domain]?.has(ref.legacyCheckId))
   throw Error('PROOF_INDEX_CHECK_DOMAIN_MISMATCH');
  const report=parseUniqueJson(actual,'evidence report');
  if(!Array.isArray(report?.checks)||
     !report.checks.some(c=>c.id===ref.legacyCheckId&&c.status==='PASS'))
   throw Error('PROOF_INDEX_REPORTED_CHECK_MISSING');
 }else throw Error('PROOF_INDEX_ASSESSMENT_INVALID');
}
export async function verifyWithProofIndex({packageDirectory,indexFile,policy='legacy-only'}={}){
 if(!['legacy-only','require-index-consistency','require-trusted-origin'].includes(policy))
  throw Error('PROOF_INDEX_POLICY_UNSUPPORTED');
 if(policy==='require-trusted-origin')throw Error('PROOF_INDEX_TRUSTED_ORIGIN_UNAVAILABLE');
 if(typeof packageDirectory!=='string'||!packageDirectory.trim())
  throw Error('PROOF_INDEX_PACKAGE_REQUIRED');
 // Re-run original verifier first: an index NEVER overrides the old proof checks.
 const legacy=await verifyPortablePackage(packageDirectory);
 const base={schema:RESULT_SCHEMA,package:legacy,originAssurance:'UNATTESTED',
  physicalCertification:'NOT_EVALUATED',hostIsolation:'NOT_EVALUATED',releaseReady:false};
 if(policy==='legacy-only')return Object.freeze({...base,indexBinding:'NOT_EVALUATED',referencesChecked:0});
 const index=readDetachedIndex(indexFile,packageDirectory);
 exactly(index,['schema','subject','references','originAssurance','physicalCertification','hostIsolation'],[],'index');
 if(index.schema!==PROOF_INDEX_SCHEMA||index.originAssurance!=='UNATTESTED'||
    index.physicalCertification!=='NOT_EVALUATED'||index.hostIsolation!=='NOT_EVALUATED')
  throw Error('PROOF_INDEX_UNSUPPORTED_ASSURANCE_OR_SCHEMA');
 if(!Array.isArray(index.references)||index.references.length<1||index.references.length>MAX_REFS)
  throw Error('PROOF_INDEX_REFERENCES_INVALID');
 const root=resolve(packageDirectory);
 const manifestBytes=boundedRegular(join(root,'manifest.json'),1024*1024,'PROOF_INDEX_MANIFEST_INVALID');
 const manifest=parseUniqueJson(manifestBytes,'manifest');
 assertSubject(index,manifest,legacy,manifestBytes);
 const used=new Set();
 for(const ref of index.references)validateReference(ref,manifest,root,used);
 return Object.freeze({...base,indexBinding:'BOUND',referencesChecked:index.references.length});
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 try{
  const [policy,packageDirectory,indexFile]=process.argv.slice(2);
  if(!policy||!packageDirectory||process.argv.length<4||process.argv.length>5)
   throw Error('Usage: node scripts/verify-proof-index.mjs legacy-only|require-index-consistency PACKAGE_DIR [DETACHED_INDEX_JSON]');
  console.log(JSON.stringify(await verifyWithProofIndex({policy,packageDirectory,indexFile}),null,2));
 }catch(e){console.error(String(e.message||e));process.exitCode=1;}
}
