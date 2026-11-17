import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertSecureGhCliVersion,MIN_GH_VERSION} from './gh-cli-policy.mjs';

test('patched GitHub CLI versions are accepted with exact output format',()=>{
 assert.equal(MIN_GH_VERSION,'2.102.0');
 for(const version of ['2.102.0','2.104.0','2.999.0','3.0.0']){
  const result=assertSecureGhCliVersion('gh version '+version+' (2026-11-17)\nhttps://github.com/cli/cli/releases/tag/v'+version);
  assert.equal(result.status,'PASS');
  assert.equal(result.ghVersion,version);
 }
});
test('all reported affected versions and older version ranges fail closed',()=>{
 for(const version of ['2.51.0','2.99.9','2.100.0','2.101.0','2.101.1','1.999.0']){
  assert.throws(()=>assertSecureGhCliVersion('gh version '+version+' (2026-11-17)'),/GH_CLI_VULNERABLE_SIGNER_WORKFLOW_MATCH/);
 }
});
test('unrecognized output and prerelease labels cannot downgrade secure version gate',()=>{
 for(const v of [
  'gh version 2.104.0-rc1 (2026-11-17)',
  'gh version 2.104.0malicious (2026-11-17)',
  'gh version 2.104.0',
  'gh version v2.104.0 (2026-11-17)',
  'other cli version 2.104.0 (2026)',
  'gh version 2.104 (2026)',
  '',
  'gh version 2.101.0 (2026)\ngh version 2.104.0 (2026)'
 ]){
  if(v.startsWith('gh version 2.101.0')){
   assert.throws(()=>assertSecureGhCliVersion(v),/VULNERABLE/);
  }else{
   assert.throws(()=>assertSecureGhCliVersion(v),/UNRECOGNIZED/);
  }
 }
});
