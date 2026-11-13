/** Canonical byte-level parity receipts; does not alter legacy manifests. */
import {createHash} from 'node:crypto';
import {readdirSync,lstatSync,readFileSync} from 'node:fs';
import {join,relative,resolve,sep} from 'node:path';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export function digestRegularFile(path){
 if(!lstatSync(path).isFile())throw Error('RECEIPT_NONREGULAR_FILE: '+path);
 const bytes=readFileSync(path);
 return {sha256:sha256(bytes),bytes:bytes.length};
}
export function receiptForTree(directory){
 const root=resolve(directory),output=[];
 function visit(dir){
  for(const item of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'))){
   const p=join(dir,item.name);
   if(item.isDirectory())visit(p);
   else if(item.isFile())output.push({path:relative(root,p).split(sep).join('/'),...digestRegularFile(p)});
   else throw Error('RECEIPT_UNSAFE_ENTRY: '+p);
  }
 }
 visit(root);
 return Object.freeze(output);
}
export function compareOutputTrees(reference,current){
 const baseline=receiptForTree(reference),candidate=receiptForTree(current);
 if(JSON.stringify(baseline)!==JSON.stringify(candidate)){
  const mismatch=baseline.find((item,i)=>JSON.stringify(item)!==JSON.stringify(candidate[i]))||candidate[baseline.length];
  throw Error('COMPILER_OUTPUT_DRIFT: '+(mismatch?.path||'file-count'));
 }
 return {status:'PASS',files:baseline.length,bytes:baseline.reduce((n,x)=>n+x.bytes,0),sha256:sha256(Buffer.from(JSON.stringify(baseline)))};
}
