// S6 T60: portable cross-lane design-grammar coordinator, no external dependencies.
// Grammar checks are evidence-specific: mathematical facts never imply aesthetics.
import { digest } from '../s1/geometry.mjs';
import { auditDocument, auditSvg } from '../s4/auditor.mjs';
import { generateCompositions, FAMILIES } from '../s5/composition.mjs';
import { generateTokens } from '../s5/tokens.mjs';

export const GRAMMAR_SCHEMA = 'geometry-grammar/1';
const fail = (code, path, message) => {const e=new Error(message);e.code=code;e.path=path;throw e};
const object = v => v!==null && typeof v==='object' && !Array.isArray(v);
const boxWithin = (child,parent) => child.x>=parent.x-1e-7 && child.y>=parent.y-1e-7 && child.x+child.width<=parent.x+parent.width+1e-7 && child.y+child.height<=parent.y+parent.height+1e-7;
function paths(n,base='') {const path=base+'/'+n.role;return [path,...n.children.flatMap(x=>paths(x,path))]}
const rule=(id,kind,status,details,hard=false)=>({id,kind,status,hard,details});

/**
 * Default spacing: source model uses the existing responsive gap-card rem token.
 * An exact default match needs no CSS patch. Custom token/model mismatches
 * remain reversible proposals, never owner-approved browser changes.
 */
export function proposeCardGapBridge(candidates,tokens){
 const primitive=tokens.manifest.primitives.find(x=>x.id==='gap-card');
 if(!primitive)return {status:'NOT_EVALUATED',reason:'No gap-card primitive to reconcile',css:null};
 const gaps=candidates.flatMap(c=>c.layouts.map(l=>l.negativeSpace.cardGap));
 if(!gaps.length||gaps.some(x=>!Number.isFinite(x)||x<=0||x>1000))return {status:'UNSUPPORTED',reason:'Invalid or missing layout card gap',css:null};
 const fixed=gaps[0];
 if(gaps.some(x=>Math.abs(x-fixed)>1e-6))return {status:'NEEDS_MANUAL_DECISION',reason:'Different layout families declare incompatible card gaps',css:null,declaredGapsPx:[...new Set(gaps)]};
 if(Math.abs(fixed-primitive.actualPx)<=0.01)return {status:'NOT_NEEDED',css:null,token:'gap-card',declaredGapPx:fixed,tokenActualPx:primitive.actualPx};
 const value=Number(fixed.toFixed(6));
 const css=`/* Proposed only; requires owner approval and browser checks, not applied. */\n:root { --geo-gap-card: ${value}px; }\n`;
 const data={schema:'geometry-token-bridge/1',status:'PENDING_OWNER_REVIEW',source:'S5 declared layout model, not actual DOM',token:'gap-card',layoutDeclaredPx:value,sourceTokenDesiredPx:primitive.desiredPx,sourceTokenActualPx:primitive.actualPx,deltaPx:Number((value-primitive.actualPx).toFixed(6)),kind:'declared-fixed-spacing-exception',reason:'Custom spacing options diverge from default reference-root composition spacing; do not apply CSS automatically',applied:false,css,browserReverification:'NOT_EVALUATED',ownerApproval:'NOT_GIVEN'};
 return {...data,proposalDigest:digest(data)};
}

export function inspectGrammar(input){
 if(!object(input)||input.schema!==GRAMMAR_SCHEMA)fail('INVALID_SCHEMA','schema','Expected geometry-grammar/1');
 if(!object(input.composition))fail('INVALID_INPUT','composition','Missing semantic composition brief');
 if(input.tokens!==undefined&&!object(input.tokens))fail('INVALID_INPUT','tokens','Expected bounded token options object');
 if(input.svg!==undefined&&input.native!==undefined)fail('INVALID_INPUT','geometry','Choose SVG or native geometry, not both');
 if(input.svg!==undefined&&(typeof input.svg!=='string'||input.svg.length>100000))fail('INVALID_INPUT','svg','Expected bounded inert SVG string');
 if(input.referenceLock!==undefined&&!object(input.referenceLock))fail('INVALID_INPUT','referenceLock','Expected reference-lock object');
 const lock=input.referenceLock??null;
 if(lock){if(!FAMILIES.includes(lock.family))fail('INVALID_REFERENCE','referenceLock.family','Reference family is not supported');
  if(lock.treeDigest!==undefined&&!/^[a-f0-9]{64}$/.test(lock.treeDigest))fail('INVALID_REFERENCE','referenceLock.treeDigest','Expected source tree SHA-256');
  if(input.composition.referenceFamily!==undefined&&input.composition.referenceFamily!==lock.family)fail('REFERENCE_CONFLICT','composition.referenceFamily','Requested variation contradicts locked reference');
 }
 const brief=lock?{...input.composition,referenceFamily:lock.family}:input.composition;
 const compositions=generateCompositions(brief), tokens=generateTokens(input.tokens??{});
 const candidates=compositions.candidates;
 const tokenBridgeProposal=proposeCardGapBridge(candidates,tokens);
 const rules=[],seen=new Set();
 const gapToken=tokens.manifest.primitives.find(x=>x.id==='gap-card')??null;
 for(const c of candidates){
  const signature=digest(paths(c.tree));
  if(seen.has(signature))rules.push(rule(`vary:${c.family}`,'vary','FAIL',{code:'STRUCTURE_DUPLICATE',treeDigest:signature},true));
  else rules.push(rule(`vary:${c.family}`,'vary','PASS',{family:c.family,treeDigest:signature,semanticTreeNodes:c.treeNodeCount}));
  seen.add(signature);
  if(lock&&lock.treeDigest&&lock.treeDigest!==digest(c.tree))rules.push(rule(`reference:${c.family}`,'reference-lock','FAIL',{code:'REFERENCE_TREE_DRIFT',actual:digest(c.tree),expected:lock.treeDigest},true));
  else if(lock)rules.push(rule(`reference:${c.family}`,'reference-lock','PASS',{family:c.family,treeDigest:digest(c.tree)},true));
  for(const l of c.layouts){
   const tag=`${c.family}@${l.viewport}`;
   const allInFrame=[l.copy,l.media,...l.cards].every(b=>boxWithin(b,l.frame));
   // Layered composition intentionally permits overlap, not out-of-frame invisible content.
   rules.push(rule(`safe-zone:${tag}`,'safeZone',allInFrame?'PASS':'FAIL',{viewport:l.viewport,frame:l.frame,cardCount:l.cards.length,failed:'region outside measurable declared frame'},true));
   const mobile=l.mode==='stacked';
   const safeReflow=!mobile||(l.exceptions.some(e=>e.id==='narrow-reflow')&&l.copy.width===l.frame.width&&l.media.width===l.frame.width);
   rules.push(rule(`mobile-reflow:${tag}`,'content-first',safeReflow?'PASS':'FAIL',{viewport:l.viewport,mode:l.mode,recordedExceptions:l.exceptions.map(e=>e.id)},true));
   const measure=l.rule;
   rules.push(rule(`split:${tag}`,'split',!measure?'NOT_APPLICABLE':measure.rule==='diagonal-canon'?'PASS':Number.isFinite(measure.residual)&&measure.residual<=1e-8?'PASS':'FAIL',{declared:measure?.rule??null,target:measure?.target??null,actual:measure?.actual??null,residual:measure?.residual??null,provenance:measure?.provenance??null,note:measure?.note??null},!!measure));
   const relation=mobile?'shared-mobile-frame':c.family==='editorial-centered'?'symmetric-centered-copy':c.family==='media-lead'?'leading-media-edge':'diagonal-descending-media';
   const aligned=mobile?(Math.abs(l.copy.x-l.media.x)<1e-7&&Math.abs(l.copy.width-l.media.width)<1e-7):c.family==='editorial-centered'?Math.abs((l.copy.x-l.frame.x)-(l.frame.x+l.frame.width-l.copy.x-l.copy.width))<1e-6:c.family==='media-lead'?Math.abs(l.media.x-l.frame.x)<1e-7:l.media.y>l.copy.y&&l.media.x>l.copy.x;
   rules.push(rule(`align:${tag}`,'align',aligned?'PASS':'FAIL',{relation,provenance:'declared-layout-model',actual:{copyX:l.copy.x,copyWidth:l.copy.width,mediaX:l.media.x,mediaY:l.media.y},pixelAlign:'NOT_EVALUATED'},true));
   rules.push(rule(`focal:${tag}`,'focal','NOT_EVALUATED',{frame:'layout-declared-media-placement',imageSaliency:'NOT_EVALUATED',noDecorativeSpiralProof:true}));
   const gap=l.negativeSpace.cardGap,tokenGap=gapToken?.actualPx??null,gapMismatch=tokenGap!==null&&Math.abs(gap-tokenGap)>0.01;
   rules.push(rule(`rhythm:${tag}`,'rhythm',!gapToken?'NOT_EVALUATED':gapMismatch?'INDETERMINATE':'PASS',{spacing:gap,unit:'CSS px',tokenPrimitive:'gap-card',tokenDesiredPx:tokenGap,deltaPx:gapMismatch?Number((gap-tokenGap).toFixed(6)):0,source:'declared-layout-model',computedDomValue:'NOT_EVALUATED',notes:gapMismatch?'Explicit S5 layout and S5 token values differ; do not claim a shared exact rhythm':'Declared rhythm token matches'}));
   rules.push(rule(`negative-space:${tag}`,'negativeSpace','INDETERMINATE',{measurement:l.negativeSpace.nonCoveredAreaLowerBoundEstimate,accuracy:l.negativeSpace.accuracy,exactUnion:'NOT_EVALUATED'}));
  }
 }
 if(!lock && candidates.length!==3)rules.push(rule('vary:family-count','vary','FAIL',{count:candidates.length},true));
 if(lock && candidates.length!==1)rules.push(rule('reference:family-count','reference-lock','FAIL',{count:candidates.length},true));
 for(const p of tokens.manifest.primitives){rules.push(rule(`token:${p.id}`,'token','PASS',{category:p.category,formula:'basePx * phi^power',provenance:p.source.provenance,desiredPx:p.desiredPx,actualPx:p.actualPx,unit:p.unit,exceptionIds:tokens.manifest.exceptions.filter(e=>e.token===p.id).map(e=>e.id)}));}
 let geometry=null;
 if(input.native!==undefined) geometry=auditDocument(input.native);
 if(input.svg!==undefined) geometry=auditSvg(input.svg,{mode:input.svgMode??'logo-standard'});
 if(geometry){
  rules.push(rule('geometry:actual-topology','topology',['NEEDS_WORK','INVALID_INPUT','UNSUPPORTED'].includes(geometry.verdict)?'FAIL':geometry.topology?'PASS':'NOT_EVALUATED',{artifactType:geometry.artifactType,verdict:geometry.verdict,topology:geometry.topology?.status??'NOT_EVALUATED',sourceDigest:geometry.sourceDigest,scope:'supported-S2-only'},true));
  for(const h of geometry.inferred??[])rules.push(rule(`hypothesis:${h.id}`,'inferred-proportion','INDETERMINATE',{provenance:'inferred',actual:h.actual,target:h.target,relativeResidual:h.relativeResidual,proofOfOriginalIntent:'NOT_ESTABLISHED'}));
  for(const c of geometry.constraints??[])rules.push(rule(`declared:${c.id}`,'declared-constraint',c.status==='PASS'?'PASS':c.status==='FAIL'?'FAIL':'INDETERMINATE',{provenance:c.provenance??'declared',unit:c.measureUnits??null,residual:c.absoluteResidual??null,featureId:c.id},c.severity==='hard'));
 }else rules.push(rule('geometry:source','topology','NOT_EVALUATED',{reason:'No logo/SVG input supplied',notRequiredToEvaluateComposition:true}));
 const failures=rules.filter(r=>r.hard&&r.status==='FAIL');
 const report={schema:'geometry-grammar-report/1',sourceDigest:digest(input),policy:'L1-symbol L2-composition L3-audit L4-tokens L5-grammar',referenceLocked:Boolean(lock),candidateFamilies:candidates.map(x=>x.family),candidateTreeHashes:candidates.map(x=>digest(x.tree)),compositionInputDigest:compositions.inputDigest,tokenManifestDigest:tokens.digest,rhythmBridgeProposal:tokenBridgeProposal,geometrySourceDigest:geometry?.sourceDigest??null,requiredChecks:rules.length,hardFailures:failures.map(r=>r.id),rules,exceptionLedger:[...tokens.manifest.exceptions,...(gapToken&&candidates.some(c=>c.layouts.some(l=>Math.abs(l.negativeSpace.cardGap-gapToken.actualPx)>0.01))?[{id:'cross-lane-card-gap-divergence',kind:'soft-rule-mismatch',declaredToken:'gap-card',tokenActualPx:gapToken.actualPx,layoutDeclaredGapPx:candidates[0].layouts[0].negativeSpace.cardGap,reason:'Custom token gap diverges from default reference-root composition model',status:'NEEDS_DECISION'}]:[]),...candidates.flatMap(c=>c.layouts.flatMap(l=>l.exceptions.map(e=>({...e,family:c.family}))))],verdict:failures.length?'NEEDS_WORK':'PASS_TECHNICAL_PARTIAL',verified:{math:'SOURCE_CHECKED',browser:'NOT_EVALUATED',raster:'NOT_EVALUATED',creativeRecognition:'NOT_EVALUATED',humanApproval:'NOT_GIVEN',referenceVisualFidelity:'NOT_EVALUATED'},limitations:['No automatic assessment of actual content meaning, focus image saliency or user brand identity','No real browser/PNG check is performed by this grammar coordinator','S2 non-general curved booleans and white-painted counters remain explicit limitations','Layout whitespace estimate is not exact union area'],independentGauntlet:true};
 return {report,compositions,tokens,tokenBridgeProposal};
}
