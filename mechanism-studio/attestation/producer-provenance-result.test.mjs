import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertVerifiedProducerAttestationResult as inspect} from './producer-provenance-result.mjs';

const source='56fcc1e8f8a264782d8ba07ebd1101e051361d3b';
const signer=source;
const subject='df61d95efb02f6051d02f3d727e9ccb5b7b4c1fdde0b33200646ee675a4d3858';
const ref='refs/heads/feat/mechanism-studio-producer-provenance-phase4-20261117';
const workflow='https://github.com/AVANT-ICONIC/skills/.github/workflows/mechanism-studio-phase4-repack-pilot.yml';
const opts=()=>({subjectSha256:subject,sourceCommit:source,signerCommit:signer,
 sourceRef:ref,signerWorkflowUri:workflow,buildTrigger:'push'});
const received=()=>[{verificationResult:{
 verifiedIdentity:{runnerEnvironment:'github-hosted'},
 signature:{certificate:{
  runnerEnvironment:'github-hosted',
  githubWorkflowRepository:'AVANT-ICONIC/skills',
  sourceRepositoryURI:'https://github.com/AVANT-ICONIC/skills',
  sourceRepositoryDigest:source,githubWorkflowSHA:source,
  sourceRepositoryRef:ref,githubWorkflowRef:ref,
  buildSignerURI:workflow+'@'+ref,buildSignerDigest:signer,buildTrigger:'push'
 }},
 verifiedTimestamps:[{type:'tlog',timestamp:1795000000}],
 statement:{predicateType:'https://slsa.dev/provenance/v1',
  subject:[{name:'producer-rigid.tar',digest:{sha256:subject}}]}
}}];
test('modeled after actual GitHub CLI v2.103.3 pilot result: all claims must match',()=>{
 const x=inspect(received(),opts());
 assert.equal(x.result,'MATCHED');
 assert.equal(x.sourceCommit,source);
 assert.equal(x.signerCommit,signer);
 assert.equal(x.releaseReady,false);
});
test('every certificate and verified identity field is bound, not just existence',()=>{
 const changes=[
  x=>x.verificationResult.signature.certificate.githubWorkflowRepository='another/repo',
  x=>x.verificationResult.signature.certificate.sourceRepositoryURI='https://github.com/another/repo',
  x=>x.verificationResult.signature.certificate.sourceRepositoryDigest='0'.repeat(40),
  x=>x.verificationResult.signature.certificate.githubWorkflowSHA='0'.repeat(40),
  x=>x.verificationResult.signature.certificate.sourceRepositoryRef='refs/heads/main',
  x=>x.verificationResult.signature.certificate.githubWorkflowRef='refs/heads/main',
  x=>x.verificationResult.signature.certificate.buildSignerURI=workflow+'-spoof@'+ref,
  x=>x.verificationResult.signature.certificate.buildSignerDigest='0'.repeat(40),
  x=>x.verificationResult.signature.certificate.buildTrigger='workflow_dispatch',
  x=>x.verificationResult.signature.certificate.runnerEnvironment='self-hosted',
  x=>x.verificationResult.verifiedIdentity.runnerEnvironment='self-hosted',
  x=>x.verificationResult.verifiedTimestamps=[],
  x=>x.verificationResult.statement.predicateType='another/predicate',
  x=>x.verificationResult.statement.subject[0].digest.sha256='0'.repeat(64)
 ];
 for(const change of changes){
  const entries=received();change(entries[0]);
  assert.throws(()=>inspect(entries,opts()),/VERIFIED_CERTIFICATE_CLAIMS_MISMATCH/);
 }
});
test('require one complete signed statement, not a mishmash of partial entries',()=>{
 const records=received();
 const first=structuredClone(records[0]),other=structuredClone(records[0]);
 first.verificationResult.statement.subject[0].digest.sha256='f'.repeat(64);
 other.verificationResult.signature.certificate.buildSignerDigest='0'.repeat(40);
 assert.throws(()=>inspect([first,other],opts()),/VERIFIED_CERTIFICATE_CLAIMS_MISMATCH/);
});
test('invalid expected source and signer identities fail even with valid-looking output',()=>{
 for(const alteration of [
  x=>{x.sourceCommit='wrong';},
  x=>{x.signerCommit='0'.repeat(39);},
  x=>{x.subjectSha256='abcd';},
  x=>{x.sourceRef='refs/tags/v1';},
  x=>{x.signerWorkflowUri='https://attacker.example/workflow.yml';},
  x=>{x.signerWorkflowUri='https://github.com/AVANT-ICONIC/skills/.github/workflows/fake.yml@refs/heads/main';},
  x=>{x.buildTrigger='pull_request_target';}
 ]){
  const expected=opts();alteration(expected);
  assert.throws(()=>inspect(received(),expected),/EXPECTATIONS_INVALID/);
 }
});
test('non-array or certificate-less results cannot be treated as verified',()=>{
 assert.throws(()=>inspect({},opts()),/VERIFIER_OUTPUT_INVALID/);
 assert.throws(()=>inspect([],opts()),/VERIFIER_OUTPUT_INVALID/);
 assert.throws(()=>inspect([{verificationResult:{}}],opts()),/VERIFIED_CERTIFICATE_CLAIMS_MISMATCH/);
});
