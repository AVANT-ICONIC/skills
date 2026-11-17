import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {checkArchiveAuditReceipt} from './check-archive-receipt.mjs';
import {verifySignedAuditReceipt} from './verify-signed-audit.mjs';
const cases=[
 ['dual-drive-linkage-study-004','avant.rigid-scene-package/1','da5753a7d59f434c17207310c44d5455bdc28732b86dc0da24c80e92c147921f',11],
 ['single-drive-rail-study-005','avant.rigid-scene-package/1','7853224957b8c8f971c3444fa5cb4d35742147f01d19d8b316ea0de90bd96467',11],
 ['slider-crank-study-002','avant.mechanism-package/1','b87a7c34cb6f509fd4a842b1d6793f0ac5a86fa5cec52419f2593518b1f0c707',12]
];
const valid=()=>({schema:'avant.phase3b-archive-acceptance/1',status:'PASS',
 sourceRunIds:[43441706721,43436842938],archivesChecked:3,
 assetsVerified:34,crossReplayRejected:true,
 results:cases.map(([packageId,sourceSchema,manifestSha256,assetsVerified])=>
  ({packageId,sourceSchema,manifestSha256,assetsVerified,format:'genuine-Phase2-CI-archive',
   binding:'BOUND',originAssurance:'UNATTESTED',negativeChecks:4,status:'PASS'}))});
const inTemp=fn=>()=>{const dir=mkdtempSync(join(tmpdir(),'mechanism-audit-attest-'));
 const file=join(dir,'report.json');
 const write=x=>writeFileSync(file,typeof x==='string'?x:JSON.stringify(x));
 try{return fn({dir,file,write});}finally{rmSync(dir,{recursive:true,force:true});}};
test('strict synthetic receipt matches frozen archives but never claims build origin',inTemp(({file,write})=>{
 write(valid());const output=checkArchiveAuditReceipt(file);
 assert.equal(output.status,'PASS');
 assert.equal(output.assetsVerified,34);
 assert.equal(output.originalBuildOrigin,'UNATTESTED');
 assert.equal(output.releaseReady,false);
}));
test('wrong run IDs, rejected cross replay, asset count and forged assurance fail',inTemp(({file,write})=>{
 for(const patch of [
  x=>x.sourceRunIds.reverse(),
  x=>{x.crossReplayRejected=false;},
  x=>{x.assetsVerified=35;},
  x=>{x.results[0].originAssurance='ATTESTED';},
  x=>{x.results[0].binding='UNBOUND';},
  x=>{x.results[2].negativeChecks=0;}
 ]){
  const r=valid();patch(r);write(r);
  assert.throws(()=>checkArchiveAuditReceipt(file),/ARCHIVE_AUDIT_/);
 }
}));
test('foreign, reordered or stale package hashes cannot be signed as original review',inTemp(({file,write})=>{
 for(const patch of [
  x=>x.results.reverse(),
  x=>{x.results[0].manifestSha256='0'.repeat(64);},
  x=>{x.results[1].sourceSchema='avant.mechanism-package/1';},
  x=>{x.results[2].packageId='another-study';}
 ]){
  const r=valid();patch(r);write(r);
  assert.throws(()=>checkArchiveAuditReceipt(file),/ARCHIVE_AUDIT_FROZEN_RESULT_MISMATCH/);
 }
}));
test('unknown fields, missing assertions and duplicate object keys fail',inTemp(({file,write})=>{
 const v=valid();
 v.trustedBuildOrigin=true;write(v);
 assert.throws(()=>checkArchiveAuditReceipt(file),/FIELDS_INVALID/);
 delete v.trustedBuildOrigin;delete v.results[0].status;write(v);
 assert.throws(()=>checkArchiveAuditReceipt(file),/FIELDS_INVALID/);
 write(JSON.stringify(valid()).replace('"status":"PASS"','"status":"PASS","status":"PASS"'));
 assert.throws(()=>checkArchiveAuditReceipt(file),/DUPLICATE_JSON_KEY/);
 write(JSON.stringify(valid()).replace('"status":"PASS"','"sta\\u0074us":"PASS","status":"PASS"'));
 assert.throws(()=>checkArchiveAuditReceipt(file),/DUPLICATE_JSON_KEY/);
}));
test('unbounded and symlinked signed receipt paths are rejected',inTemp(({dir,file,write})=>{
 write(valid());
 const alias=join(dir,'link.json');symlinkSync(file,alias);
 assert.throws(()=>checkArchiveAuditReceipt(alias),/NONREGULAR_OR_UNBOUNDED/);
 write('x'.repeat(32769));
 assert.throws(()=>checkArchiveAuditReceipt(file),/NONREGULAR_OR_UNBOUNDED/);
}));
test('pinned signer SHA and ref are mandatory, before calling gh',inTemp(({file,write})=>{
 write(valid());
 assert.throws(()=>verifySignedAuditReceipt(file,'any'),/EXPECTED_COMMIT_REQUIRED/);
 assert.throws(()=>verifySignedAuditReceipt(file,'0'.repeat(40),'refs/heads/main'),/SIGNER_REF_UNTRUSTED/);
}));
