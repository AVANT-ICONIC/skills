#!/usr/bin/env node
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {verifyPackage} from './package-example.mjs';
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  try{
    if(process.argv.length!==3)throw new Error('Usage: node scripts/verify.mjs PACKAGE_DIR');
    console.log(JSON.stringify(verifyPackage(process.argv[2]),null,2));
  }catch(e){console.error(String(e.message||e));process.exitCode=1;}
}
