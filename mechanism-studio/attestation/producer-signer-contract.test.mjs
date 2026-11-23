import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
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
 assert.match(signer,/CALLER_REPOSITORY.*\$\{\{ github\.repository \}\}/);
 assert.match(signer,/CALLER_WORKFLOW_REF.*\$\{\{ github\.workflow_ref \}\}/);
 assert.match(signer,/CALLER_WORKFLOW_SHA.*\$\{\{ github\.workflow_sha \}\}/);
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

/**
 * Execute the REAL first-step Bash guard in isolation with simulated native
 * GitHub context. No token, signing job, external network or film needed.
 */
const firstStep=signer.split('      - name: Reject any unprotected ref, PR run or unexpected artifact\n')[1]
 ?.split('      - uses: actions/checkout@v4\n')[0];
const firstStepBash=firstStep?.split('        run: |\n')[1]
 ?.split('\n').filter(line=>line.trim())
 .map(line=>line.startsWith('          ')?line.slice(10):line).join('\n');
const SHA='a'.repeat(40);
const baseEnvironment=()=>({
 EVENT_NAME:'workflow_dispatch',
 REF_NAME:'refs/heads/main',
 REF_PROTECTED:'true',
 CALLER_REPOSITORY:'AVANT-ICONIC/skills',
 CALLER_WORKFLOW_REF:'AVANT-ICONIC/skills/.github/workflows/mechanism-studio-rigid-scene.yml@refs/heads/main',
 CALLER_WORKFLOW_SHA:SHA,
 SOURCE_SHA:SHA,
 INPUT_FAMILY:'rigid',
 INPUT_ARTIFACT:'mechanism-studio-producer-rigid'
});
const runFirstStep=env=>spawnSync('bash',['--noprofile','--norc','-e','-o','pipefail','-c',firstStepBash],{
 encoding:'utf8',timeout:5000,
 env:{PATH:process.env.PATH, ...env}
});
test('actual Bash gate accepts only exact rigid and reviewed producers under protected manual main',()=>{
 assert.ok(firstStepBash?.includes('CALLER_WORKFLOW_REF'),'guard script must be extracted');
 const rigid=runFirstStep(baseEnvironment());
 assert.equal(rigid.status,0,rigid.stderr+' '+rigid.stdout);
 const reviewed=baseEnvironment();
 reviewed.INPUT_FAMILY='reviewed';
 reviewed.INPUT_ARTIFACT='mechanism-studio-producer-reviewed';
 reviewed.CALLER_WORKFLOW_REF='AVANT-ICONIC/skills/.github/workflows/mechanism-studio-generation.yml@refs/heads/main';
 const result=runFirstStep(reviewed);
 assert.equal(result.status,0,result.stderr+' '+result.stdout);
});
test('actual Bash gate blocks wrong callers, repository, source, ref, protection and trigger',()=>{
 const cases=[
  ['unprotected', {REF_PROTECTED:'false'}],
  ['wrong branch', {REF_NAME:'refs/heads/release'}],
  ['tag ref', {REF_NAME:'refs/tags/main'}],
  ['PR invocation', {EVENT_NAME:'pull_request'}],
  ['push invocation', {EVENT_NAME:'push'}],
  ['foreign repository', {CALLER_REPOSITORY:'attacker/skills'}],
  ['invalid source SHA', {SOURCE_SHA:'not-a-sha'}],
  ['different workflow SHA', {CALLER_WORKFLOW_SHA:'b'.repeat(40)}],
  ['wrong caller', {CALLER_WORKFLOW_REF:'AVANT-ICONIC/skills/.github/workflows/other.yml@refs/heads/main'}],
  ['lookalike caller path', {CALLER_WORKFLOW_REF:'AVANT-ICONIC/skills/.github/workflows/mechanism-studio-rigid-scene.yml.evil@refs/heads/main'}],
  ['lookalike caller branch', {CALLER_WORKFLOW_REF:'AVANT-ICONIC/skills/.github/workflows/mechanism-studio-rigid-scene.yml@refs/heads/main-malicious'}],
  ['wrong artifact family', {INPUT_FAMILY:'reviewed'}],
  ['wrong artifact name', {INPUT_ARTIFACT:'mechanism-studio-producer-reviewed'}],
  ['empty caller identity', {CALLER_WORKFLOW_REF:''}],
  ['empty caller sha', {CALLER_WORKFLOW_SHA:''}]
 ];
 for(const [name,changes] of cases){
  const result=runFirstStep({...baseEnvironment(),...changes});
  assert.notEqual(result.status,0,'allowed '+name);
  assert.match(result.stdout+result.stderr,/SIGNER_BLOCKED/,'no explicit block for '+name);
 }
});
test('the reviewed family cannot use rigid caller identity and vice versa',()=>{
 const wrong=baseEnvironment();
 wrong.INPUT_FAMILY='reviewed';
 wrong.INPUT_ARTIFACT='mechanism-studio-producer-reviewed';
 assert.notEqual(runFirstStep(wrong).status,0);
 const other=baseEnvironment();
 other.CALLER_WORKFLOW_REF='AVANT-ICONIC/skills/.github/workflows/mechanism-studio-generation.yml@refs/heads/main';
 assert.notEqual(runFirstStep(other).status,0);
});
