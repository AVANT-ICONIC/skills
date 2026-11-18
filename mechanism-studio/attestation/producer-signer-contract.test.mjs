import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const signer=readFileSync(new URL('../../.github/workflows/mechanism-studio-producer-signer.yml',import.meta.url),'utf8');
const generation=readFileSync(new URL('../../.github/workflows/mechanism-studio-generation.yml',import.meta.url),'utf8');
const rigid=readFileSync(new URL('../../.github/workflows/mechanism-studio-rigid-scene.yml',import.meta.url),'utf8');
const consumer=readFileSync(new URL('./verify-signed-producer.mjs',import.meta.url),'utf8');
test('reusable signer is not directly invokable by PR, push or untrusted workflow event',()=>{
 assert.match(signer,/^on:\n  workflow_call:/m);
 assert.doesNotMatch(signer,/^  (pull_request|pull_request_target|push|workflow_dispatch):/m);
 assert.match(signer,/EVENT_NAME.*\$\{\{ github\.event_name \}\}/);
 assert.match(signer,/REF_PROTECTED.*\$\{\{ github\.ref_protected \}\}/);
 assert.match(signer,/REF_NAME.*\$\{\{ github\.ref \}\}/);
 assert.match(signer,/workflow_dispatch.*refs\/heads\/main/);
 assert.match(signer,/REF_PROTECTED.*true/);
});
test('signing credentials are isolated to reusable signing job',()=>{
 assert.match(signer,/id-token: write/);
 assert.match(signer,/attestations: write/);
 assert.doesNotMatch(generation,/id-token: write|attestations: write/);
 assert.doesNotMatch(rigid,/id-token: write|attestations: write/);
});
test('signer takes only same-run named artifact and enforces static family/name pair',()=>{
 assert.match(signer,/actions\/download-artifact@v4/);
 assert.doesNotMatch(signer,/run-id:|repository:/);
 assert.match(signer,/rigid:mechanism-studio-producer-rigid/);
 assert.match(signer,/reviewed:mechanism-studio-producer-reviewed/);
 assert.match(signer,/producer-archive\.mjs verify/);
});
test('signer invokes full strict package/certificate consumer, not a weaker parallel check',()=>{
 assert.match(signer,/subject-path: \.producer\/producer-/);
 assert.match(signer,/actions\/attest@v4/);
 assert.match(signer,/node mechanism-studio\/attestation\/verify-signed-producer\.mjs/);
 assert.match(signer,/\$FAMILY" "\$target" "\$GITHUB_SHA" "\$GITHUB_SHA"/);
 assert.match(signer,/certificateClaims": "MATCHED"/);
 assert.match(signer,/governanceApproval": "NOT_EVALUATED"/);
 assert.match(signer,/releaseReady": false/);
 const strictStep=signer.indexOf('node mechanism-studio/attestation/verify-signed-producer.mjs');
 const issue=signer.indexOf('uses: actions/attest@v4');
 const publish=signer.indexOf('name: Export signed TAR and verification receipt');
 assert.ok(issue>=0&&strictStep>issue&&publish>strictStep,
  'full cryptographic+claims verification must run after signing and before publishing');
 assert.match(consumer,/--repo',REPO,'--signer-workflow',SIGNER/);
 assert.match(consumer,/--source-digest',approvedSourceCommit/);
 assert.match(consumer,/--signer-digest',approvedSignerCommit/);
 assert.match(consumer,/--source-ref',SOURCE_REF/);
 assert.match(consumer,/--deny-self-hosted-runners/);
 assert.match(consumer,/--predicate-type','https:\/\/slsa\.dev\/provenance\/v1'/);
 assert.match(consumer,/assertVerifiedProducerAttestationResult/);
});

test('GitHub CLI signer identity check refuses known vulnerable versions before attesting',()=>{
 const gate=signer.indexOf('node mechanism-studio/attestation/gh-cli-policy.mjs');
 const signing=signer.indexOf('uses: actions/attest@v4');
 assert.ok(gate>=0,'required gh version check absent');
 assert.ok(signing>gate,'version gate must run before the signer gets a certificate');
});
