#!/usr/bin/env node
/**
 * Exact archived Phase-2 package acceptance. No regeneration or network calls:
 * the CI workflow supplies the named artifacts from their immutable run IDs.
 * This script does not bless or attest archived producer identity.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,rmSync,writeFileSync,lstatSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {verifyWithProofIndex} from '../scripts/verify-proof-index.mjs';
import {receiptForTree} from '../scripts/portable-receipt.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fixed=[
 {relative:'dual-drive-linkage-study-004',schema:'avant.rigid-scene-package/1',
  expectedId:'dual-drive-linkage-study-004',hash:'da5753a7d59f434c17207310c44d5455bdc28732b86dc0da24c80e92c147921f',
  assets:11,report:'evidence/report.json',check:'real-full-film'},
 {relative:'single-drive-rail-study-005',schema:'avant.rigid-scene-package/1',
  expectedId:'single-drive-rail-study-005',hash:'7853224957b8c8f971c3444fa5cb4d35742147f01d19d8b316ea0de90bd96467',
  assets:11,report:'evidence/report.json',check:'prismatic-rail-and-closure'},
 {relative:'.',schema:'avant.mechanism-package/1',
  expectedId:'slider-crank-study-002',hash:'b87a7c34cb6f509fd4a842b1d6793f0ac5a86fa5cec52419f2593518b1f0c707',
  assets:12,report:'evidence/report.json',check:'full-film-capture'}
];
function buildIndex(packageDir,entry){
 const manifestBytes=readFileSync(join(packageDir,'manifest.json'));
 assert.equal(sha(manifestBytes),entry.hash,'FROZEN_MANIFEST_SHA_MISMATCH '+entry.expectedId);
 const m=JSON.parse(manifestBytes);
 assert.equal(m.schema,entry.schema);
 assert.equal(m.packageId??m.id,entry.expectedId);
 assert.equal(m.releaseReady,false);
 assert.equal(m.assets.length,entry.assets);
 const a=m.assets.find(x=>x.path===entry.report);
 assert.ok(a,'FROZEN_EVIDENCE_MISSING');
 return {schema:'avant.mechanism-proof-index/1',
  subject:{sourceSchema:m.schema,packageId:entry.expectedId,manifestSha256:entry.hash,
   assetCount:entry.assets,releaseReady:false},
  references:[{id:'archived-proof-check',domain:'render-reproducibility',
   assetPath:entry.report,assetSha256:a.sha256,legacyCheckId:entry.check,
   assessment:'REPORTED',evaluator:'legacy-report',method:'manifest-hash-and-check-id'}],
  originAssurance:'UNATTESTED',physicalCertification:'NOT_EVALUATED',hostIsolation:'NOT_EVALUATED'};
}
async function assertFails(cb,pattern,reason){
 await assert.rejects(cb,pattern,reason);
}
export async function verifyPhase2Archives(rigidRoot,recipeRoot){
 const temporary=mkdtempSync(join(tmpdir(),'mechanism-proof-real-artifacts-'));
 const results=[];
 try{
  for(let i=0;i<fixed.length;i++){
   const entry=fixed[i],root=resolve(i<2?join(rigidRoot,entry.relative):recipeRoot);
   assert.equal(lstatSync(root).isDirectory(),true);
   const before=receiptForTree(root);
   const index=buildIndex(root,entry);
   const indexPath=join(temporary,'index-'+i+'.json');
   const write=v=>writeFileSync(indexPath,JSON.stringify(v,null,2)+'\n');
   write(index);
   const received=await verifyWithProofIndex({packageDirectory:root,
    indexFile:indexPath,policy:'require-index-consistency'});
   assert.equal(received.package.sourceSchema,entry.schema);
   assert.equal(received.package.packageId,entry.expectedId);
   assert.equal(received.package.assetsVerified,entry.assets);
   assert.equal(received.indexBinding,'BOUND');
   assert.equal(received.referencesChecked,1);
   assert.equal(received.originAssurance,'UNATTESTED');
   assert.equal(received.physicalCertification,'NOT_EVALUATED');
   assert.equal(received.hostIsolation,'NOT_EVALUATED');
   assert.equal(received.releaseReady,false);
   // Negative checks run against ORIGINAL CI bytes, not fabricated fixtures.
   const mutate=(apply)=>{const copy=structuredClone(index);apply(copy);write(copy);};
   mutate(x=>{x.subject.manifestSha256='0'.repeat(64);});
   await assertFails(()=>verifyWithProofIndex({packageDirectory:root,
    indexFile:indexPath,policy:'require-index-consistency'}),/SUBJECT_MISMATCH/,'stale manifest digest');
   mutate(x=>{x.references[0].assetSha256='0'.repeat(64);});
   await assertFails(()=>verifyWithProofIndex({packageDirectory:root,
    indexFile:indexPath,policy:'require-index-consistency'}),/ASSET_BINDING_MISMATCH/,'unrelated evidence');
   mutate(x=>{x.references[0].assessment='REPLAYED';});
   await assertFails(()=>verifyWithProofIndex({packageDirectory:root,
    indexFile:indexPath,policy:'require-index-consistency'}),/REPLAY_NOT_IMPLEMENTED/,'faked replay');
   mutate(x=>{x.originAssurance='ATTESTED';});
   await assertFails(()=>verifyWithProofIndex({packageDirectory:root,
    indexFile:indexPath,policy:'require-index-consistency'}),/UNSUPPORTED_ASSURANCE_OR_SCHEMA/,'fake signature');
   assert.equal((await verifyWithProofIndex({packageDirectory:root,
    indexFile:indexPath,policy:'legacy-only'})).indexBinding,'NOT_EVALUATED');
   assert.deepEqual(receiptForTree(root),before,'ARCHIVED_PACKAGE_MUTATED');
   results.push({packageId:entry.expectedId,sourceSchema:entry.schema,
    manifestSha256:entry.hash,assetsVerified:entry.assets,
    format:'genuine-Phase2-CI-archive',binding:'BOUND',originAssurance:'UNATTESTED',
    negativeChecks:4,status:'PASS'});
  }
  // Explicit cross-package replay attempt between two real distinct topologies.
  const wrong=join(temporary,'cross-package.json');
  writeFileSync(wrong,JSON.stringify(buildIndex(join(rigidRoot,fixed[0].relative),fixed[0])));
  await assertFails(()=>verifyWithProofIndex({packageDirectory:join(rigidRoot,fixed[1].relative),
   indexFile:wrong,policy:'require-index-consistency'}),/SUBJECT_MISMATCH/,'cross-package index replay');
  return {schema:'avant.phase3b-archive-acceptance/1',status:'PASS',sourceRunIds:[43441706721,43436842938],
   archivesChecked:3,assetsVerified:results.reduce((n,x)=>n+x.assetsVerified,0),crossReplayRejected:true,results};
 }finally{rmSync(temporary,{recursive:true,force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname){
 try{
  if(process.argv.length!==4)throw Error('Usage: node phase3b-real-artifacts.mjs RIGID_ARCHIVE_DIR RECIPE_ARCHIVE_DIR');
  const value=await verifyPhase2Archives(process.argv[2],process.argv[3]);
  console.log(JSON.stringify(value,null,2));
 }catch(e){console.error(e.stack||e);process.exitCode=1;}
}
