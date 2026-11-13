/** One compiler-ingress owner for link-only technical source references.
 *  Profiles intentionally retain pre-consolidation validation and serialization.
 *  This module does not fetch URLs or certify any source contents. */
const LEGACY_ID=/^[a-z][a-z0-9-]{2,63}$/;
const SCENE_ID=/^[a-z][a-z0-9-]{1,63}$/;
const SCENE_KEYS=new Set(['id','type','title','url','redistribution','contentChecked']);
const isObject=value=>value&&typeof value==='object'&&!Array.isArray(value);
export function validateSourceReference(source,{profile}={}){
 if(!['reviewed-recipe','rigid-scene'].includes(profile))throw Error('SOURCE_PROFILE_UNSUPPORTED');
 if(!isObject(source))throw Error(profile==='reviewed-recipe'?'BAD_SOURCE':'SCENE_UNKNOWN_FIELD_reference');
 if(profile==='rigid-scene'&&Object.keys(source).some(key=>!SCENE_KEYS.has(key)))throw Error('SCENE_UNKNOWN_FIELD_reference');
 if(profile==='reviewed-recipe'){
  if(typeof source.id!=='string'||!LEGACY_ID.test(source.id))throw Error('SOURCE_ID_INVALID');
  if(source.type!=='technical-reference')throw Error('SOURCE_TYPE_UNSUPPORTED');
 }
 // URL construction remains deliberately strict. Do not turn an invalid URL
 // into a string, silently replace the scheme or fetch its contents.
 const url=new URL(source.url);
 const unsafeUrl=url.protocol!=='https:'||url.username||url.password||!url.hostname||/(?:^|\.)localhost$/i.test(url.hostname);
 if(profile==='reviewed-recipe'){
  if(unsafeUrl)throw Error('SOURCE_URL_UNSAFE');
  if(source.redistribution!=='link-only')throw Error('SOURCE_REUSE_NOT_APPROVED');
  if(typeof source.title!=='string'||source.title.length<5||source.title.length>180)throw Error('SOURCE_TITLE_INVALID');
  // Preserve exact legacy ordering and URL canonicalization byte for byte.
  return {id:source.id,type:source.type,url:url.href,title:source.title,redistribution:'link-only'};
 }
 if(!SCENE_ID.test(source.id)||source.type!=='technical-reference'||
    source.redistribution!=='link-only'||source.contentChecked!==false||
    typeof source.title!=='string'||source.title.length<10||unsafeUrl)
  throw Error('SCENE_REFERENCE_UNSAFE');
 // The original rigid scene compiler serializes the *input* references,
 // including property order. Do not normalize their output in phase 1.
 return source;
}
export function validateSceneSources(references){
 if(!Array.isArray(references)||references.length<1||references.length>8)throw Error('SCENE_REFERENCES_REQUIRED');
 for(const source of references)validateSourceReference(source,{profile:'rigid-scene'});
 return references;
}
