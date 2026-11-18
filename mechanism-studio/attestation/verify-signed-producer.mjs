#!/usr/bin/env node
/**
 * Strict consumer of future PRODUCER-signed canonical archives, not old audit
 * receipts. The APPROVED COMMIT must come from an independent trust policy.
 * Never emit release readiness, physical certification, or governance approval.
 */
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyProducerArchive} from './producer-archive.mjs';
import {assertLocalSecureGhCli} from './gh-cli-policy.mjs';
import {assertVerifiedProducerAttestationResult} from './producer-provenance-result.mjs';

const REPO='AVANT-ICONIC/skills';
const SIGNER=REPO+'/.github/workflows/mechanism-studio-producer-signer.yml';
const SIGNER_URI='https://github.com/'+SIGNER;
const SOURCE_REF='refs/heads/main';
const COMMIT=/^[0-9a-f]{40}$/;

/** Caller MUST supply source and signer digests pinned by trusted deployment policy. */
export async function verifySignedProducer({
 family,archive,approvedSourceCommit,approvedSignerCommit
}={}){
 if(!COMMIT.test(approvedSourceCommit)||!COMMIT.test(approvedSignerCommit))
  throw Error('PRODUCER_ATTESTATION_INDEPENDENT_COMMIT_POLICY_REQUIRED');
 // No query string, ref override, owner override or plugin URL is accepted.
 const oldArchive=await verifyProducerArchive({family,archive});
 if(oldArchive.status!=='PASS'||oldArchive.releaseReady!==false)
  throw Error('PRODUCER_ATTESTATION_PACKAGE_UNVERIFIED');
 const cli=assertLocalSecureGhCli();
 const path=resolve(archive);
 const digest=createHash('sha256').update(readFileSync(path)).digest('hex');
 if(digest!==oldArchive.archiveSha256)throw Error('PRODUCER_ATTESTATION_ARCHIVE_CHANGED');
 const args=['attestation','verify',path,
  '--repo',REPO,'--signer-workflow',SIGNER,
  '--source-digest',approvedSourceCommit,
  '--signer-digest',approvedSignerCommit,
  '--source-ref',SOURCE_REF,
  '--deny-self-hosted-runners',
  '--predicate-type','https://slsa.dev/provenance/v1',
  '--format','json'];
 const out=spawnSync('gh',args,{shell:false,encoding:'utf8',
  timeout:45000,maxBuffer:2*1024*1024});
 if(out.error||out.status!==0)
  throw Error('PRODUCER_ATTESTATION_CRYPTOGRAPHIC_VERIFICATION_FAILED: '+
   String(out.error?.message||out.stderr||'unknown').slice(0,500));
 let data;
 try{data=JSON.parse(out.stdout)}catch{
  throw Error('PRODUCER_ATTESTATION_OUTPUT_INVALID');
 }
 const checked=assertVerifiedProducerAttestationResult(data,{
  subjectSha256:digest,
  sourceCommit:approvedSourceCommit,
  signerCommit:approvedSignerCommit,
  sourceRef:SOURCE_REF,
  signerWorkflowUri:SIGNER_URI,
  buildTrigger:'workflow_dispatch'
 });
 return Object.freeze({schema:'avant.mechanism-signed-producer-check/1',
  archiveSha256:digest,family,packages:oldArchive.packages,
  subject:'CANONICAL_PRODUCER_TAR',signedProvenance:'VERIFIED',
  sourceCommit:approvedSourceCommit,signerCommit:approvedSignerCommit,
  signerWorkflow:SIGNER,signerSourceRef:SOURCE_REF,
  cliVersion:cli.ghVersion,certificateClaims:checked.result,
  governanceApproval:'NOT_EVALUATED',
  physicalCertification:'NOT_EVALUATED',releaseReady:false});
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 try{
  if(process.argv.length!==6)
   throw Error('Usage: verify-signed-producer.mjs rigid|reviewed ARCHIVE_TAR INDEPENDENT_APPROVED_SOURCE_COMMIT INDEPENDENT_APPROVED_SIGNER_COMMIT');
  console.log(JSON.stringify(await verifySignedProducer({
   family:process.argv[2],archive:process.argv[3],
   approvedSourceCommit:process.argv[4],approvedSignerCommit:process.argv[5]
  }),null,2));
 }catch(e){console.error(e.stack||e);process.exitCode=1;}
}
