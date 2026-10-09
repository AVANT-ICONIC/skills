// S5: deterministic, typed φ-led tokens. No third-party runtime dependencies.
import { PHI, digest } from '../s1/geometry.mjs';
export const TOKEN_SCHEMA = 'geometry-tokens/1';
function fail(code, field, reason) {const e = new Error(reason);e.code=code;e.field=field;throw e}
function finite(x,field,{min=-1e7,max=1e7}={}){if(typeof x!=='number'||!Number.isFinite(x)||x<min||x>max)fail('INVALID_VALUE',field,'Expected finite bounded number');return x}
function ident(s,f){if(typeof s!=='string'||!/^[a-z][a-z0-9-]{0,55}$/.test(s))fail('INVALID_ID',f,'Expected CSS-safe lowercase id');return s}
function round(n){return Number(n.toFixed(6))}
function cssUnit(px,unit){return unit==='rem'?`${round(px/16)}rem`:`${round(px)}px`}
function cssName(s){return `--geo-${s}`}
const categories=['font','space','radius','target','container'];
const DEFAULTS=[
 {id:'type-caption',category:'font',base:16,power:-1,min:13,max:16,unit:'rem'},
 {id:'type-body',category:'font',base:16,power:0,min:16,max:24,unit:'rem'},
 {id:'type-title',category:'font',base:16,power:2,min:25,max:48,unit:'rem'},
 {id:'type-display',category:'font',base:16,power:3,min:30,max:56,unit:'rem'},
 {id:'gap-xs',category:'space',base:8,power:0,min:4,max:20,unit:'rem'},
 {id:'gap-card',category:'space',base:8,power:1,min:10,max:26,unit:'rem'},
 {id:'gap-section',category:'space',base:16,power:2,min:24,max:64,unit:'rem'},
 {id:'radius-card',category:'radius',base:8,power:1,min:8,max:22,unit:'rem'},
 {id:'radius-modal',category:'radius',base:8,power:1,min:8,max:24,unit:'rem'},
 {id:'target-button',category:'target',base:24,power:1,min:44,max:60,unit:'px'},
 {id:'container-modal',category:'container',base:320,power:1,min:280,max:560,unit:'px'}
];
export function generateTokens(input={}){
 if(input===null||typeof input!=='object'||Array.isArray(input))fail('INVALID_INPUT','input','Token options must be an object');
 const list=input.specs??DEFAULTS;if(!Array.isArray(list)||!list.length||list.length>96)fail('INVALID_INPUT','specs','Expected 1..96 tokens');
 const seen=new Set(),exceptions=[];const primitives=list.map((s,i)=>{
  const id=ident(s.id,'specs.'+i+'.id');if(seen.has(id))fail('DUPLICATE_ID',id,'Duplicate token');seen.add(id);
  if(!categories.includes(s.category))fail('INVALID_CATEGORY',id,'Unknown category');
  const base=finite(s.base,id+'.base',{min:0.01,max:100000}),power=finite(s.power,id+'.power',{min:-8,max:8});
  const min=finite(s.min??0,id+'.min',{min:0,max:100000}),max=finite(s.max??100000,id+'.max',{min:0,max:100000});
  if(min>max)fail('INVALID_BOUNDS',id,'min > max');
  const unit=s.unit??'rem';if(!['px','rem'].includes(unit))fail('INVALID_UNIT',id,'px/rem only');
  const desired=base*PHI**power,value=Math.min(max,Math.max(min,desired));
  if(s.category==='target'&&value<24)fail('UNSAFE_TARGET',id,'Interactive minimum 24 CSS px without exception');
  if(s.category==='font'&&id==='type-body'&&value<16)fail('UNSAFE_BODY_TEXT',id,'Body min 16 CSS px in this product policy');
  const reason=value!==desired?(desired<min?'minimum-functional-bound':'maximum-usability-bound'):null;
  if(reason)exceptions.push({id:'override-'+id,token:id,kind:reason,desired:round(desired),actual:round(value),delta:round(value-desired),rule:`${base} * phi^${power}`,source:'explicit-token-bounds'});
  return {id,category:s.category,source:{base,power,family:'phi-power',unit:'px',provenance:'declared'},desiredPx:round(desired),actualPx:round(value),minPx:min,maxPx:max,unit,cssValue:cssUnit(value,unit)};
 });
 const semantic=input.semantic??{'body-size':'type-body','caption-size':'type-caption','heading-size':'type-title','display-size':'type-display','card-gap':'gap-card','section-gap':'gap-section','card-radius':'radius-card','modal-radius':'radius-modal','button-min-height':'target-button','modal-width':'container-modal'};
 if(!semantic||typeof semantic!=='object'||Array.isArray(semantic))fail('INVALID_INPUT','semantic','Object mapping required');
 const lookup=new Map(primitives.map(t=>[t.id,t]));const aliases=Object.entries(semantic).map(([name,primitive])=>{ident(name,'semantic');if(!lookup.has(primitive))fail('UNKNOWN_TOKEN',name,'Unknown primitive');return {name,primitive,cssValue:`var(${cssName(primitive)})`}});
 const lines=[':root {',...primitives.map(t=>`  ${cssName(t.id)}: ${t.cssValue};`),...aliases.map(a=>`  ${cssName(a.name)}: ${a.cssValue};`),' }'];
 // Container query units must have a query container. rem fallback remains valid when cqw unsupported.
 lines.push('.geo-query-container { container-type: inline-size; }');
 lines.push('.geo-query-fluid { padding-inline: var(--geo-card-gap, 1rem); }');
 lines.push('@supports (width: 1cqw) { .geo-query-fluid { padding-inline: clamp(0.5rem, 3cqw, 2rem); } }');
 const manifest={schema:TOKEN_SCHEMA,formula:'basePx * phi^power',phi:PHI,referenceRootFontPx:16,primitives,aliases,exceptions,containerQuery:{eligibleAncestorSelector:'.geo-query-container',unit:'cqw',relativeTo:'nearest eligible ancestor inline-size',example400px3cqw:12,example1920px3cqw:57.6,fallback:'var(--geo-card-gap, 1rem)'},claims:{cssComputedValues:'NOT_EVALUATED',wcagConformance:'NOT_EVALUATED'}};
 return {manifest:Object.freeze(manifest),css:lines.join('\n')+'\n',digest:digest(manifest)};
}
