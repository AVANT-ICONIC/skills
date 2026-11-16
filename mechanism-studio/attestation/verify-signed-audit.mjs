#!/usr/bin/env node
/** Verify a GitHub/Sigstore-signed review receipt; NEVER infer original build origin. */
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkArchiveAuditReceipt} from './check-archive-receipt.mjs';

const REPO='AVANT-ICONIC/skills';
const SIGNER='AVANT-ICONIC/skills/.github/workflows/mechanism-studio-phase3c-audit.yml';
const REF='refs/heads/feat/mechanism-studio-audit-attestation-phase3c-20261116';
const COMMIT=/^[0-9a-f]{40}$/;

/**
 * The expected source commit/ref are explicitly supplied by an INDEPENDENT
 * trusted caller. They are not taken from the receipt or a user-supplied bundle.
 * 'gh' validates the Sigstore certificate, timestamp, repo and signer identity.
 */
export function verifySignedAuditReceipt(file,expectedSignerSha,expectedSignerRef=REF){
 if(typeof expectedSignerSha!=='string'||!COMMIT.test(expectedSignerSha))
  throw Error('ARCHIVE_ATTESTATION_EXPECTED_COMMIT_REQUIRED');
 if(expectedSignerRef!==REF)
  throw Error('ARCHIVE_ATTESTATION_SIGNER_REF_UNTRUSTED');
 const path=resolve(file);
 checkArchiveAuditReceipt(path);
 const digest=createHash('sha256').update(readFileSync(path)).digest('hex');
 const argv=['attestation','verify',path,'--repo',REPO,
  '--signer-workflow',SIGNER,
  '--source-digest',expectedSignerSha,'--source-ref',expectedSignerRef,
  '--format','json'];
 // No shell. The installed gh binary and trust roots are part of the
 // verifier's trusted environment, not user-supplied package metadata.
 const out=spawnSync('gh',argv,{shell:false,encoding:'utf8',timeout:45000,maxBuffer:2*1024*1024});
 if(out.error||out.status!==0)
  throw Error('ARCHIVE_ATTESTATION_CRYPTOGRAPHIC_VERIFICATION_FAILED: '+
   String(out.error?.message||out.stderr||'unknown failure').slice(0,1000));
 let entries;
 try{entries=JSON.parse(out.stdout);}catch{throw Error('ARCHIVE_ATTESTATION_VERIFIER_OUTPUT_INVALID');}
 if(!Array.isArray(entries)||entries.length<1||entries.some(x=>!x?.verificationResult?.statement))
  throw Error('ARCHIVE_ATTESTATION_VERIFIER_OUTPUT_INVALID');
 const matched=entries.some(x=>x.verificationResult.statement.subject?.some(subject=>
  subject.digest?.sha256===digest));
 if(!matched)throw Error('ARCHIVE_ATTESTATION_SUBJECT_MISMATCH');
 return Object.freeze({schema:'avant.phase3c-signed-archive-audit/1',
  auditReceiptSignature:'VERIFIED',authenticatedSigner:REPO+'/'+SIGNER.split('/').at(-1),
  signerSourceSha:expectedSignerSha,signerSourceRef:expectedSignerRef,
  auditReceiptSha256:digest,originalArchives:3,assetsVerified:34,
  originalBuildOrigin:'UNATTESTED',physicalCertification:'NOT_EVALUATED',
  hostIsolation:'NOT_EVALUATED',releaseReady:false});
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 try{
  if(process.argv.length<4||process.argv.length>5)
   throw Error('Usage: node verify-signed-audit.mjs RECEIPT_JSON EXPECTED_SIGNER_SOURCE_SHA [EXPECTED_SIGNER_SOURCE_REF]');
  console.log(JSON.stringify(verifySignedAuditReceipt(process.argv[2],process.argv[3],process.argv[4]),null,2));
 }catch(e){console.error(String(e.message||e));process.exitCode=1;}
}
