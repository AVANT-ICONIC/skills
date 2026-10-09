// S4: compare and propose. Never writes a file, approves identity changes, or promotes variants.
import {audit, auditDocument, auditSvg} from './auditor.mjs';
import {proposeVoidCircleShift} from '../s3/optical.mjs';
const die=(code,message)=>{const e=new Error(message);e.code=code;throw e};
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function compareCandidate(original,candidate,{kind='document',expectedSourceDigest,expectedCandidateDigest,mode='logo-standard'}={}){
 if(!sha(expectedSourceDigest))die('BASELINE_DIGEST_REQUIRED','Require explicit baseline digest for comparison');
 if(!['document','svg'].includes(kind))die('INVALID_INPUT','Comparisons require known document or SVG provenance');
 const base=audit(original,{kind,mode});if(base.sourceDigest!==expectedSourceDigest)die('BASELINE_DIGEST_MISMATCH','Source bytes/revision do not match approved comparison baseline');
 const next=audit(candidate,{kind,mode});if(expectedCandidateDigest!==undefined&&(!sha(expectedCandidateDigest)||expectedCandidateDigest!==next.sourceDigest))die('CANDIDATE_DIGEST_MISMATCH','Candidate bytes/revision changed');
 const worsened=next.constraints.filter(c=>c.severity==='hard'&&c.status==='FAIL'&&base.constraints.some(b=>b.id===c.id&&b.status==='FAIL'&&c.absoluteResidual>b.absoluteResidual+Math.max(1e-12,b.tolerance)));const beforeHard=new Set(base.summary.hardFailureIds),afterHard=new Set(next.summary.hardFailureIds),newHard=[...afterHard].filter(x=>!beforeHard.has(x));
 const baseTopo=base.topology,candidateTopo=next.topology;const lostHoles=baseTopo&&candidateTopo&&candidateTopo.holes<baseTopo.holes;
 const lostComponents=baseTopo&&candidateTopo&&baseTopo.status==='PASS'&&candidateTopo.status!=='PASS';
 const missingTopology=!!baseTopo&&!candidateTopo;
 const topoChanges=baseTopo&&candidateTopo?{components:{before:baseTopo.components,after:candidateTopo.components},holes:{before:baseTopo.holes,after:candidateTopo.holes}}:null;
 const unsupported=['UNSUPPORTED','INVALID_INPUT'].includes(next.verdict);const newDiagnosticFailures=next.diagnostics.filter(x=>x.status==='FAIL'&&!base.diagnostics.some(y=>y.code===x.code&&y.featureId===x.featureId));
 const regressionReasons=[...worsened.map(x=>({code:'EXISTING_HARD_RESIDUAL_WORSENED',featureId:x.id})),...newDiagnosticFailures.map(x=>({code:'NEW_DIAGNOSTIC_FAILURE',featureId:x.featureId,diagnosticCode:x.code})),...(base.verdict==='PASS_TECHNICAL'&&next.verdict==='NEEDS_WORK'?[{code:'TECHNICAL_ACCEPTANCE_LOST'}]:[]),...newHard.map(id=>({code:'NEW_HARD_FAILURE',featureId:id})),...(lostHoles?[{code:'NEGATIVE_SPACE_HOLE_LOST',before:baseTopo.holes,after:candidateTopo.holes}]:[]),...(lostComponents?[{code:'TOPOLOGY_REGRESSION',before:baseTopo.status,after:candidateTopo.status}]:[]),...(missingTopology?[{code:'TOPOLOGY_UNVERIFIED'}]:[]),...(unsupported?[{code:'CANDIDATE_UNSUPPORTED',status:next.verdict}]:[])];
 if(['UNSUPPORTED','INVALID_INPUT'].includes(base.verdict))die('BASELINE_UNVERIFIABLE','Cannot promote a candidate against an unverified source baseline');const compared=base.artifactType===next.artifactType&&base.sourceDigest!==next.sourceDigest;
 return {schema:'geometry-comparison/1',baselineDigest:base.sourceDigest,candidateDigest:next.sourceDigest,kind,sourceImmutable:true,diffExists:compared,hardConstraints:{before:base.summary.hardFailureIds,after:next.summary.hardFailureIds,newHardFailureIds:newHard},topology:topoChanges,regressionReasons,verdict:regressionReasons.length?'REJECT_REGRESSION':!compared?'NO_CHANGE':'PENDING_OWNER_REVIEW',ownerApproval:'NOT_GIVEN',visualComparison:'NOT_EVALUATED',pixelDifference:'NOT_EVALUATED',originalReport:base,candidateReport:next};
}
export function proposeRadius(original,{expectedSourceDigest,shapeId,newRadius,reason,ruleId}={}){
 if(!sha(expectedSourceDigest)||!shapeId||!ruleId||typeof reason!=='string'||!reason.trim()||reason.length>300)die('INVALID_PROPOSAL','Require baseline digest, existing shape, rule id and rationale');
 if(typeof newRadius!=='number'||!Number.isFinite(newRadius)||newRadius<=0||newRadius>1e9)die('INVALID_PROPOSAL','Positive finite radius required');
 const originalBytes=JSON.stringify(original);const base=auditDocument(original);if(base.sourceDigest!==expectedSourceDigest)die('BASELINE_DIGEST_MISMATCH','Source digest does not match original');
 const beforeShape=original.shapes?.find(s=>s.id===shapeId);if(!beforeShape||beforeShape.kind!=='circle')die('UNSUPPORTED_GEOMETRY','S4 only permits circle radius proposal in native document');
 if(newRadius===beforeShape.radius)die('INVALID_PROPOSAL','Proposed radius is unchanged');
 const candidate=structuredClone(original);const shape=candidate.shapes.find(s=>s.id===shapeId);shape.radius=newRadius;
 const comparison=compareCandidate(original,candidate,{kind:'document',expectedSourceDigest});
 return {schema:'geometry-proposal/1',status:comparison.verdict==='REJECT_REGRESSION'?'REJECTED_REGRESSION':'PROPOSED_UNAPPROVED',original, candidate,change:{shapeId,field:'radius',before:beforeShape.radius,after:newRadius,delta:newRadius-beforeShape.radius,units:original.units,reason,ruleId},sourceDigest:base.sourceDigest,candidateDigest:comparison.candidateDigest,comparison,ownerApproval:'NOT_GIVEN',originalUnchanged:JSON.stringify(original)===originalBytes};
}
export function proposeSvgVoidShift(originalSvg,{expectedSourceDigest,...options}={}){
 if(!sha(expectedSourceDigest))die('BASELINE_DIGEST_REQUIRED','Source digest required');
 const before=auditSvg(originalSvg);if(before.sourceDigest!==expectedSourceDigest)die('BASELINE_DIGEST_MISMATCH','Source bytes changed');
 const proposed=proposeVoidCircleShift(originalSvg,options);
 const comparison=compareCandidate(originalSvg,proposed.candidateSvg,{kind:'svg',expectedSourceDigest});
 return {schema:'geometry-proposal/1',status:comparison.verdict==='REJECT_REGRESSION'?'REJECTED_REGRESSION':'PROPOSED_UNAPPROVED',original:originalSvg,candidate:proposed.candidateSvg,change:proposed.record.change,sourceDigest:before.sourceDigest,candidateDigest:comparison.candidateDigest,comparison,reason:options.reason,ownerApproval:'NOT_GIVEN',opticalLedger:proposed.record};
}
