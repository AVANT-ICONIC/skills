#!/usr/bin/env node
/**
 * Reject GitHub CLI attestation verification versions affected by
 * GHSA-wjmr-j3rp-mh2g (workflow path prefix accepted as trusted signer).
 * Fixed upstream in gh v2.102.0. A signature is NOT a release authorization.
 */
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const MIN_GH_VERSION='2.102.0';
function tuple(s){
 if(typeof s!=='string'||!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(s))
  throw Error('GH_CLI_VERSION_UNRECOGNIZED');
 return s.split('.').map(Number);
}
export function assertSecureGhCliVersion(versionOutput){
 if(typeof versionOutput!=='string')throw Error('GH_CLI_VERSION_UNRECOGNIZED');
 const first=versionOutput.trimStart().split('\n')[0].trim();
 const match=/^gh version ([0-9]+\.[0-9]+\.[0-9]+) \(/.exec(first);
 if(!match)throw Error('GH_CLI_VERSION_UNRECOGNIZED');
 const got=tuple(match[1]),min=tuple(MIN_GH_VERSION);
 const cmp=got[0]-min[0]||got[1]-min[1]||got[2]-min[2];
 if(cmp<0)throw Error('GH_CLI_VULNERABLE_SIGNER_WORKFLOW_MATCH: require >= '+MIN_GH_VERSION+', found '+match[1]);
 return Object.freeze({schema:'avant.mechanism-gh-cli-version-check/1',
  ghVersion:match[1],minimumVersion:MIN_GH_VERSION,status:'PASS'});
}
export function assertLocalSecureGhCli(){
 const proc=spawnSync('gh',['--version'],{encoding:'utf8',shell:false,timeout:10000,maxBuffer:8192});
 if(proc.error||proc.status!==0)
  throw Error('GH_CLI_UNAVAILABLE_OR_UNTRUSTED: '+String(proc.error?.message||proc.stderr||'unknown').slice(0,120));
 return assertSecureGhCliVersion(proc.stdout);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 try{
  if(process.argv.length!==2)throw Error('Usage: node gh-cli-policy.mjs');
  console.log(JSON.stringify(assertLocalSecureGhCli(),null,2));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
