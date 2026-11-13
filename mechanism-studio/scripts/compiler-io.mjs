/** Shared atomic output staging for both established compiler formats.
 *  The caller owns payload/format; this owner owns path guards and lifecycle. */
import {existsSync,mkdirSync,renameSync,rmSync} from 'node:fs';
import {resolve,sep} from 'node:path';
export function compileToNewDirectory({out,sourceRoot,errors,build}){
 const dest=resolve(out),root=resolve(sourceRoot);
 if(dest===root||dest.startsWith(root+sep))throw Error(errors.within);
 if(existsSync(dest))throw Error(errors.exists);
 const staging=dest+'.stage-'+process.pid;
 if(existsSync(staging))throw Error(errors.staging);
 try{
  mkdirSync(staging,{recursive:true});
  const receipt=build(staging,dest);
  renameSync(staging,dest);
  return receipt;
 }catch(error){rmSync(staging,{recursive:true,force:true});throw error;}
}
