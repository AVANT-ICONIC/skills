#!/usr/bin/env node
/** Exact-format verifier for an archived-build review report, NOT a film origin proof. */
import {readFileSync,lstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const FROZEN=Object.freeze([
 {packageId:'dual-drive-linkage-study-004',sourceSchema:'avant.rigid-scene-package/1',
  manifestSha256:'da5753a7d59f434c17207310c44d5455bdc28732b86dc0da24c80e92c147921f',assetsVerified:11},
 {packageId:'single-drive-rail-study-005',sourceSchema:'avant.rigid-scene-package/1',
  manifestSha256:'7853224957b8c8f971c3444fa5cb4d35742147f01d19d8b316ea0de90bd96467',assetsVerified:11},
 {packageId:'slider-crank-study-002',sourceSchema:'avant.mechanism-package/1',
  manifestSha256:'b87a7c34cb6f509fd4a842b1d6793f0ac5a86fa5cec52419f2593518b1f0c707',assetsVerified:12}
]);
const expected=(obj,fields,label)=>{
 if(!obj||Array.isArray(obj)||typeof obj!=='object'||
  Object.keys(obj).length!==fields.length||fields.some(k=>!Object.hasOwn(obj,k)))
  throw Error('ARCHIVE_AUDIT_FIELDS_INVALID: '+label);
};
function parseStrictJson(bytes){
 const raw=bytes.toString('utf8'),stack=[];
 // Detect duplicate object keys including their \uXXXX-escaped spellings.
 for(let i=0;i<raw.length;i++){
  if(raw[i]==='{'||raw[i]==='['){stack.push({type:raw[i],seen:new Set()});continue;}
  if(raw[i]==='}'||raw[i]===']'){stack.pop();continue;}
  if(raw[i]!=='"')continue;
  const begin=i;
  for(i=i+1;i<raw.length;i++){
   if(raw[i]==='\\'){i++;continue;}
   if(raw[i]==='"')break;
  }
  if(i>=raw.length)throw Error('ARCHIVE_AUDIT_JSON_UNTERMINATED');
  let cursor=i+1;
  while(cursor<raw.length&&/\s/.test(raw[cursor]))cursor++;
  if(raw[cursor]===':'&&stack.at(-1)?.type==='{'){
   const key=JSON.parse(raw.slice(begin,i+1)),seen=stack.at(-1).seen;
   if(seen.has(key))throw Error('ARCHIVE_AUDIT_DUPLICATE_JSON_KEY: '+key);
   seen.add(key);
  }
 }
 return JSON.parse(raw);
}
export function checkArchiveAuditReceipt(file){
 const path=resolve(file),stat=lstatSync(path);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size<2||stat.size>32768)
  throw Error('ARCHIVE_AUDIT_NONREGULAR_OR_UNBOUNDED');
 const receipt=parseStrictJson(readFileSync(path));
 expected(receipt,['schema','status','sourceRunIds','archivesChecked','assetsVerified',
  'crossReplayRejected','results'],'receipt');
 if(receipt.schema!=='avant.phase3b-archive-acceptance/1'||receipt.status!=='PASS'||
  !Array.isArray(receipt.sourceRunIds)||receipt.sourceRunIds.length!==2||
  receipt.sourceRunIds[0]!==43441706721||receipt.sourceRunIds[1]!==43436842938||
  receipt.archivesChecked!==3||receipt.assetsVerified!==34||
  receipt.crossReplayRejected!==true||
  !Array.isArray(receipt.results)||receipt.results.length!==3)
  throw Error('ARCHIVE_AUDIT_SUMMARY_INVALID');
 for(let i=0;i<3;i++){
  const row=receipt.results[i],wanted=FROZEN[i];
  expected(row,['packageId','sourceSchema','manifestSha256','assetsVerified','format',
   'binding','originAssurance','negativeChecks','status'],'result-'+i);
  for(const key of Object.keys(wanted))
   if(row[key]!==wanted[key])throw Error('ARCHIVE_AUDIT_FROZEN_RESULT_MISMATCH: '+wanted.packageId+' '+key);
  if(row.format!=='genuine-Phase2-CI-archive'||row.binding!=='BOUND'||
   row.originAssurance!=='UNATTESTED'||row.negativeChecks!==4||row.status!=='PASS')
   throw Error('ARCHIVE_AUDIT_ASSURANCE_INVALID: '+wanted.packageId);
 }
 return Object.freeze({schema:'avant.phase3c-archive-receipt-check/1',
  status:'PASS',originalArchives:3,assetsVerified:34,originalBuildOrigin:'UNATTESTED',
  sourceRunIds:[43441706721,43436842938],releaseReady:false});
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 try{
  if(process.argv.length!==3)throw Error('Usage: node check-archive-receipt.mjs REVIEW_RECEIPT_JSON');
  console.log(JSON.stringify(checkArchiveAuditReceipt(process.argv[2]),null,2));
 }catch(e){console.error(String(e.message||e));process.exitCode=1;}
}
