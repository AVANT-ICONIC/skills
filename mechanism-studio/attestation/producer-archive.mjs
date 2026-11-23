#!/usr/bin/env node
/**
 * Canonical, read-only-to-sources USTAR packaging for *future* producer outputs.
 * NOT an attestation or trusted release. A signer must authenticate this exact
 * .tar subject from the original producing CI run with independently pinned policy.
 */
import {createHash} from 'node:crypto';
import {existsSync,lstatSync,linkSync,mkdtempSync,mkdirSync,readdirSync,readFileSync,realpathSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename,dirname,isAbsolute,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyPortablePackage} from '../scripts/verify-portable.mjs';
import {receiptForTree} from '../scripts/portable-receipt.mjs';

const BLOCK=512,MAX_ARCHIVE=256*1024*1024,MAX_FILE=128*1024*1024,MAX_ENTRIES=80;
const HASH=b=>createHash('sha256').update(b).digest('hex');
const EXPECTED=Object.freeze({
 rigid:{schema:'avant.rigid-scene-package/1',ids:['dual-drive-linkage-study-004','single-drive-rail-study-005']},
 reviewed:{schema:'avant.mechanism-package/1',ids:['four-bar-crank-rocker-study-003','slider-crank-study-002']}
});
const FAMILY_NAMES=Object.freeze(Object.keys(EXPECTED));
const safeRel=rel=>typeof rel==='string'&&/^[A-Za-z0-9._/-]+$/.test(rel)&&
 !rel.startsWith('/')&&!rel.includes('//')&&rel.split('/').every(s=>s!=='.'&&s!=='..'&&s.length>0);
const inside=(parent,child)=>{
 const rel=relative(parent,child);
 return rel===''||(!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel));
};
/**
 * Resolve the ACTUAL destination even when the intended directory does not yet
 * exist. A symlinked ancestor must not route a nominally external TAR into an
 * original package, where even a no-clobber creation would mutate source data.
 */
function canonicalDestination(output){
 let dir=dirname(output),missing=[];
 while(!existsSync(dir)){
  const upper=dirname(dir);
  if(upper===dir)throw Error('PRODUCER_OUTPUT_UNSAFE');
  missing.unshift(basename(dir));dir=upper;
 }
 if(!statSync(dir).isDirectory())throw Error('PRODUCER_OUTPUT_UNSAFE');
 return resolve(realpathSync(dir),...missing,basename(output));
}
function assertSafeOutput(roots,output){
 if(existsSync(output))throw Error('PRODUCER_OUTPUT_UNSAFE');
 const target=canonicalDestination(output);
 const realRoots=roots.map(root=>realpathSync(root));
 if(realRoots.some(root=>inside(root,target)||inside(target,root)))
  throw Error('PRODUCER_OUTPUT_UNSAFE');
}
function familySpec(family){
 if(!Object.hasOwn(EXPECTED,family))throw Error('PRODUCER_FAMILY_UNSUPPORTED');
 return EXPECTED[family];
}
/**
 * Metadata-only preflight BEFORE legacy verifiers read/hashes package assets.
 * Otherwise a valid-looking manifest with an enormous or unlisted sparse file
 * could exhaust memory before the MAX_ARCHIVE check at TAR serialization.
 * Counts both packages together, including manifests, but not directories.
 */
function preflightSourceFolders(roots){
 let files=0,folders=0,tarBytes=BLOCK*2;
 function visit(path,depth){
  if(depth>24)throw Error('PRODUCER_SOURCE_DEPTH_EXCEEDED');
  const stat=lstatSync(path);
  if(stat.isSymbolicLink())throw Error('PRODUCER_SOURCE_NONREGULAR');
  if(stat.isDirectory()){
   folders++;
   if(folders>MAX_ENTRIES*8)throw Error('PRODUCER_SOURCE_DIRS_EXCEEDED');
   for(const name of readdirSync(path))visit(join(path,name),depth+1);
   return;
  }
  if(!stat.isFile())throw Error('PRODUCER_SOURCE_NONREGULAR');
  if(stat.size>MAX_FILE)throw Error('PRODUCER_SOURCE_FILE_TOO_LARGE');
  files++;
  if(files>MAX_ENTRIES)throw Error('PRODUCER_SOURCE_ENTRIES_EXCEEDED');
  tarBytes+=BLOCK+Math.ceil(stat.size/BLOCK)*BLOCK;
  if(tarBytes>MAX_ARCHIVE)throw Error('PRODUCER_SOURCE_TOTAL_TOO_LARGE');
 }
 for(const root of roots)visit(root,0);
 return Object.freeze({files,tarBytes});
}
function sourceFiles(root,legacy){
 const tree=receiptForTree(root);
 const manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
 const expected=['manifest.json',...manifest.assets.map(a=>a.path)];
 if(expected.length!==tree.length||
   expected.some(x=>!tree.some(y=>y.path===x)))throw Error('PRODUCER_PACKAGE_UNLISTED_FILES');
 if(legacy.releaseReady!==false||manifest.releaseReady!==false)throw Error('PRODUCER_PACKAGE_NOT_PREVIEW');
 return tree;
}
function octal(num,width){
 if(!Number.isSafeInteger(num)||num<0)throw Error('PRODUCER_TAR_SIZE_UNSAFE');
 const value=num.toString(8);
 if(value.length>width-1)throw Error('PRODUCER_TAR_SIZE_TOO_LARGE');
 return value.padStart(width-1,'0')+'\0';
}
function header(name,size){
 if(typeof name!=='string'||!safeRel(name)||name.length>100||
    !/^[\x20-\x7e]+$/.test(name))throw Error('PRODUCER_TAR_NAME_UNSAFE');
 const h=Buffer.alloc(BLOCK);
 h.write(name,0,100,'ascii');
 h.write('0000644\0',100,8,'ascii');
 h.write('0000000\0',108,8,'ascii');
 h.write('0000000\0',116,8,'ascii');
 h.write(octal(size,12),124,12,'ascii');
 h.write('00000000000\0',136,12,'ascii');
 h.fill(0x20,148,156);
 h.write('0',156,1,'ascii');
 h.write('ustar\0',257,6,'ascii');
 h.write('00',263,2,'ascii');
 let sum=0;for(const byte of h)sum+=byte;
 h.write(sum.toString(8).padStart(6,'0')+'\0 ',148,8,'ascii');
 return h;
}
function assertArchiveFile(path){
 const s=lstatSync(path);
 if(!s.isFile()||s.isSymbolicLink()||s.size<BLOCK*2||
    s.size>MAX_ARCHIVE||s.size%BLOCK!==0)throw Error('PRODUCER_TAR_NONREGULAR_OR_BOUNDED');
}
function parseTar(bytes){
 if(bytes.length<1024||bytes.length>MAX_ARCHIVE||bytes.length%BLOCK)
  throw Error('PRODUCER_TAR_SIZE_INVALID');
 const files=[],names=new Set();
 let cursor=0,previous='';
 while(cursor<bytes.length-1024){
  const h=bytes.subarray(cursor,cursor+BLOCK);
  if(h.every(v=>v===0))break;
  const end=h.indexOf(0);
  if(end<1||end>100)throw Error('PRODUCER_TAR_HEADER_INVALID');
  const name=h.subarray(0,end).toString('ascii');
  const sizeText=h.subarray(124,135).toString('ascii');
  if(!/^[0-7]{11}$/.test(sizeText))throw Error('PRODUCER_TAR_HEADER_INVALID');
  const size=parseInt(sizeText,8);
  if(size>MAX_FILE||!h.equals(header(name,size)))throw Error('PRODUCER_TAR_NONCANONICAL_HEADER');
  if(names.has(name)||name<=previous)throw Error('PRODUCER_TAR_DUPLICATE_OR_UNSORTED');
  names.add(name);previous=name;
  if(files.length>=MAX_ENTRIES)throw Error('PRODUCER_TAR_ENTRIES_EXCEEDED');
  const boundary=cursor+BLOCK+Math.ceil(size/BLOCK)*BLOCK;
  if(boundary>bytes.length-1024)throw Error('PRODUCER_TAR_TRUNCATED');
  const payload=bytes.subarray(cursor+BLOCK,cursor+BLOCK+size);
  const padding=bytes.subarray(cursor+BLOCK+size,boundary);
  if(padding.some(v=>v!==0))throw Error('PRODUCER_TAR_PADDING_INVALID');
  files.push({name,bytes:payload});
  cursor=boundary;
 }
 if(bytes.length-cursor!==1024||bytes.subarray(cursor).some(v=>v!==0))
  throw Error('PRODUCER_TAR_TRAILER_INVALID');
 return files;
}
function validateIds(receipts,family){
 const target=familySpec(family);
 if(receipts.length!==target.ids.length||
    receipts.some(r=>r.sourceSchema!==target.schema)||
    JSON.stringify(receipts.map(r=>r.packageId).sort())!==JSON.stringify(target.ids))
  throw Error('PRODUCER_PACKAGE_SET_MISMATCH');
}
export async function createProducerArchive({family,packageDirs,out}){
 const target=familySpec(family);
 if(!Array.isArray(packageDirs)||packageDirs.length!==target.ids.length||
    typeof out!=='string'||!out.trim())throw Error('PRODUCER_PACKAGE_ARGUMENTS_INVALID');
 const output=resolve(out),roots=packageDirs.map(x=>resolve(x));
 if(new Set(roots).size!==roots.length)
  throw Error('PRODUCER_OUTPUT_UNSAFE');
 assertSafeOutput(roots,output);
 preflightSourceFolders(roots);
 const receipts=[],entries=[];
 for(const root of roots){
  const legacy=await verifyPortablePackage(root),tree=sourceFiles(root,legacy);
  receipts.push(legacy);
  for(const item of tree){
   const name=legacy.packageId+'/'+item.path;
   if(!safeRel(name)||name.length>100)throw Error('PRODUCER_TAR_NAME_UNSAFE');
   const content=readFileSync(join(root,item.path));
   if(content.length>MAX_FILE||HASH(content)!==item.sha256)
    throw Error('PRODUCER_SOURCE_CHANGED_DURING_PACK');
   entries.push({name,bytes:content});
  }
 }
 validateIds(receipts,family);
 entries.sort((a,b)=>Buffer.compare(Buffer.from(a.name),Buffer.from(b.name)));
 if(entries.length>MAX_ENTRIES)throw Error('PRODUCER_TAR_ENTRIES_EXCEEDED');
 const parts=[];
 for(const item of entries){
  parts.push(header(item.name,item.bytes.length),item.bytes);
  const pad=(BLOCK-item.bytes.length%BLOCK)%BLOCK;
  if(pad)parts.push(Buffer.alloc(pad));
 }
 parts.push(Buffer.alloc(1024));
 const all=Buffer.concat(parts);
 if(all.length>MAX_ARCHIVE)throw Error('PRODUCER_TAR_SIZE_INVALID');
 const stage=output+'.stage-'+process.pid;
 if(existsSync(stage))throw Error('PRODUCER_STAGE_EXISTS');
 try{
  mkdirSync(dirname(output),{recursive:true});
  // Recheck after mkdir: a pre-existing parent link may have changed while
  // verifying source packages. This is not an adversarial-filesystem sandbox.
  assertSafeOutput(roots,output);
  writeFileSync(stage,all,{flag:'wx',mode:0o600});
  // link() is atomic no-clobber: unlike rename(), it refuses an output file
  // created concurrently after existsSync(). Stage and output share a directory.
  linkSync(stage,output);
  rmSync(stage);
  return {schema:'avant.mechanism-producer-archive/1',family,
   archiveSha256:HASH(all),bytes:all.length,packages:receipts.map(r=>r.packageId).sort(),
   originAssurance:'UNATTESTED',releaseReady:false};
 }catch(e){rmSync(stage,{force:true});throw e;}
}
export async function verifyProducerArchive({family,archive}){
 familySpec(family);
 const path=resolve(archive);assertArchiveFile(path);
 const all=readFileSync(path),files=parseTar(all);
 const temp=mkdtempSync(join(tmpdir(),'mechanism-produced-package-'));
 try{
  const ids=new Set();
  for(const {name,bytes} of files){
   const slash=name.indexOf('/');
   if(slash<1)throw Error('PRODUCER_TAR_NAME_UNSAFE');
   const id=name.slice(0,slash),rel=name.slice(slash+1);
   if(!/^[a-z][a-z0-9-]{1,63}$/.test(id)||!safeRel(rel))
    throw Error('PRODUCER_TAR_NAME_UNSAFE');
   ids.add(id);
   const dest=join(temp,id,rel);
   mkdirSync(dirname(dest),{recursive:true});
   writeFileSync(dest,bytes,{flag:'wx',mode:0o600});
  }
  const receipts=[];
  for(const id of [...ids].sort()){
   const root=join(temp,id),legacy=await verifyPortablePackage(root);
   if(legacy.packageId!==id)throw Error('PRODUCER_PACKAGE_ID_MISMATCH');
   sourceFiles(root,legacy);receipts.push(legacy);
  }
  validateIds(receipts,family);
  return {schema:'avant.mechanism-producer-archive-verification/1',
   status:'PASS',family,archiveSha256:HASH(all),bytes:all.length,
   packages:receipts.map(r=>({id:r.packageId,schema:r.sourceSchema,assets:r.assetsVerified})),
   originAssurance:'UNATTESTED',signature:'NOT_EVALUATED',
   physicalCertification:'NOT_EVALUATED',hostIsolation:'NOT_EVALUATED',releaseReady:false};
 }finally{rmSync(temp,{recursive:true,force:true});}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 try{
  const [command,family,...args]=process.argv.slice(2);
  if(command==='pack'&&args.length===3)console.log(JSON.stringify(await createProducerArchive({
   family,packageDirs:args.slice(1),out:args[0]}),null,2));
  else if(command==='verify'&&args.length===1)console.log(JSON.stringify(
   await verifyProducerArchive({family,archive:args[0]}),null,2));
  else throw Error('Usage: producer-archive.mjs pack FAMILY OUT_DIR.tar PACKAGE_DIR PACKAGE_DIR | verify FAMILY ARCHIVE.tar');
 }catch(e){console.error(e.stack||e);process.exitCode=1;}
}
