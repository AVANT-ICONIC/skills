import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifySignedProducer} from './verify-signed-producer.mjs';

const SHA='a'.repeat(40);
test('source SHA and reusable signer SHA are independently mandatory before reading archive',async()=>{
 for(const opts of [
  {family:'rigid',archive:'/not-found.tar'},
  {family:'rigid',archive:'/not-found.tar',approvedSourceCommit:SHA},
  {family:'rigid',archive:'/not-found.tar',approvedSignerCommit:SHA},
  {family:'rigid',archive:'/not-found.tar',approvedSourceCommit:'main',approvedSignerCommit:SHA},
  {family:'rigid',archive:'/not-found.tar',approvedSourceCommit:SHA,approvedSignerCommit:'main'},
  {family:'rigid',archive:'/not-found.tar',approvedSourceCommit:SHA,approvedSignerCommit:'b'.repeat(39)}
 ])await assert.rejects(verifySignedProducer(opts),/INDEPENDENT_COMMIT_POLICY_REQUIRED/);
});
test('both approved pins do not bypass original package/TAR verification',async()=>{
 await assert.rejects(verifySignedProducer({
  family:'rigid',archive:'/nonexistent/untrusted.tar',
  approvedSourceCommit:SHA,approvedSignerCommit:SHA
 }),/ENOENT/);
 await assert.rejects(verifySignedProducer({
  family:'something-else',archive:'/nonexistent/untrusted.tar',
  approvedSourceCommit:SHA,approvedSignerCommit:SHA
 }),/PRODUCER_FAMILY_UNSUPPORTED/);
});
test('consumer pins exact OIDC identity, source/signer digest, protected ref, cloud runners',()=>{
 const src=readFileSync(new URL('./verify-signed-producer.mjs',import.meta.url),'utf8');
 assert.match(src,/const SOURCE_REF='refs\/heads\/main'/);
 assert.match(src,/--repo',REPO,'--signer-workflow',SIGNER/);
 assert.match(src,/--source-digest',approvedSourceCommit/);
 assert.match(src,/--signer-digest',approvedSignerCommit/);
 assert.match(src,/--source-ref',SOURCE_REF/);
 assert.match(src,/--deny-self-hosted-runners/);
 assert.match(src,/--predicate-type','https:\/\/slsa\.dev\/provenance\/v1'/);
 assert.match(src,/assertLocalSecureGhCli\(\)/);
 assert.match(src,/governanceApproval:'NOT_EVALUATED'/);
 assert.match(src,/releaseReady:false/);
});
