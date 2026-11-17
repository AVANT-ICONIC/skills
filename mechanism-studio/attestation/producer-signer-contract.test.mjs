import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const signer=readFileSync(new URL('../../.github/workflows/mechanism-studio-producer-signer.yml',import.meta.url),'utf8');
const generation=readFileSync(new URL('../../.github/workflows/mechanism-studio-generation.yml',import.meta.url),'utf8');
const rigid=readFileSync(new URL('../../.github/workflows/mechanism-studio-rigid-scene.yml',import.meta.url),'utf8');
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
test('signature is over TAR itself and source/workflow identity is verified',()=>{
 assert.match(signer,/subject-path: \.producer\/producer-/);
 assert.match(signer,/actions\/attest@v4/);
 assert.match(signer,/gh attestation verify/);
 assert.match(signer,/--repo AVANT-ICONIC\/skills/);
 assert.match(signer,/--signer-workflow AVANT-ICONIC\/skills\/\.github\/workflows\/mechanism-studio-producer-signer\.yml/);
 assert.match(signer,/--source-digest "\$GITHUB_SHA"/);
 assert.match(signer,/--signer-digest "\$GITHUB_SHA"/);
 assert.match(signer,/--source-ref "\$GITHUB_REF"/);
});

test('GitHub CLI signer identity check refuses known vulnerable versions before attesting',()=>{
 const gate=signer.indexOf('node mechanism-studio/attestation/gh-cli-policy.mjs');
 const signing=signer.indexOf('uses: actions/attest@v4');
 assert.ok(gate>=0,'required gh version check absent');
 assert.ok(signing>gate,'version gate must run before the signer gets a certificate');
});
