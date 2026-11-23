/**
 * Strict SECOND-LAYER inspection of an attestation ALREADY cryptographically
 * verified by a patched `gh attestation verify` invocation.
 * This does not validate certificates, signatures, Sigstore trust roots or
 * transparency timestamps itself. Its result is NOT a release authorization.
 */
const DIGEST=/^[a-f0-9]{64}$/;
const SHA=/^[a-f0-9]{40}$/;
const EXPECTED_REPO='AVANT-ICONIC/skills';
const EXPECTED_REPO_URI='https://github.com/'+EXPECTED_REPO;
const PREDICATE='https://slsa.dev/provenance/v1';

export function assertVerifiedProducerAttestationResult(results,{
 subjectSha256,sourceCommit,signerCommit,sourceRef,signerWorkflowUri,buildTrigger
}={}){
 if(!DIGEST.test(subjectSha256)||!SHA.test(sourceCommit)||!SHA.test(signerCommit)||
    typeof sourceRef!=='string'||!/^refs\/heads\/[a-z0-9][a-z0-9\/_-]*$/.test(sourceRef)||
    typeof signerWorkflowUri!=='string'||
    !/^https:\/\/github\.com\/AVANT-ICONIC\/skills\/\.github\/workflows\/[A-Za-z0-9-]+\.yml$/.test(signerWorkflowUri)||
    !['push','workflow_dispatch'].includes(buildTrigger))
   throw Error('PRODUCER_ATTESTATION_EXPECTATIONS_INVALID');
 if(!Array.isArray(results)||!results.length)
   throw Error('PRODUCER_ATTESTATION_VERIFIER_OUTPUT_INVALID');
 const validated=results.find(entry=>{
   const r=entry?.verificationResult;
   const c=r?.signature?.certificate;
   if(!c||typeof c!=='object'||Array.isArray(c))return false;
   return Array.isArray(r?.verifiedTimestamps)&&r.verifiedTimestamps.length>0&&
     r.verifiedIdentity?.runnerEnvironment==='github-hosted'&&
     c.runnerEnvironment==='github-hosted'&&
     c.githubWorkflowRepository===EXPECTED_REPO&&
     c.sourceRepositoryURI===EXPECTED_REPO_URI&&
     c.sourceRepositoryDigest===sourceCommit&&
     c.githubWorkflowSHA===sourceCommit&&
     c.sourceRepositoryRef===sourceRef&&
     c.githubWorkflowRef===sourceRef&&
     c.buildSignerURI===signerWorkflowUri+'@'+sourceRef&&
     c.buildSignerDigest===signerCommit&&
     c.buildTrigger===buildTrigger&&
     r.statement?.predicateType===PREDICATE&&
     Array.isArray(r.statement.subject)&&
     r.statement.subject.some(subject=>subject?.digest?.sha256===subjectSha256);
 });
 if(!validated)throw Error('PRODUCER_ATTESTATION_VERIFIED_CERTIFICATE_CLAIMS_MISMATCH');
 return Object.freeze({schema:'avant.producer-attestation-claims-check/1',
   result:'MATCHED',subjectSha256,sourceCommit,signerCommit,sourceRef,
   signerWorkflowUri,runner:'github-hosted',
   buildTrigger,releaseReady:false});
}
