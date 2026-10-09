#!/usr/bin/env node
// Portable S6 T60 cross-lane grammar report generator, offline no-clobber.
import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { inspectGrammar } from './grammar.mjs';
const error=(code,msg)=>{const e=new Error(msg);e.code=code;throw e};
export async function run(argv){const [op,input,...rest]=argv;
 if(op!=='grammar'||!input||rest.length!==2||rest[0]!=='--out'||!rest[1])error('INVALID_ARGUMENT','Usage: grammar INPUT.json --out NEW.json');
 const source=resolve(input),target=resolve(rest[1]);if(source===target)error('PATH_COLLISION','Refuse source overwrite');
 const raw=await readFile(source,'utf8');if(raw.length>200000)error('LIMIT_EXCEEDED','Input too large');
 const result=inspectGrammar(JSON.parse(raw)).report;
 try{await stat(target);error('OUTPUT_EXISTS','Output exists')}catch(e){if(e.code!=='ENOENT')throw e}
 await writeFile(target,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 return {status:'CREATED',target,digest:result.sourceDigest,verdict:result.verdict};
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))run(process.argv.slice(2)).then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(JSON.stringify({code:e.code??'INPUT_ERROR',message:e.message}));process.exitCode=2});
