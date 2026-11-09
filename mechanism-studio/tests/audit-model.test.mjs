import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath as fromFileURL} from 'node:url';
import {compileRequest} from '../scripts/compile-request.mjs';
import {auditGenerated} from '../scripts/audit-model.mjs';
const HERE=fromFileURL(new URL('../requests/',import.meta.url));
const slider=JSON.parse(readFileSync(join(HERE,'slider-crank-study.json'),'utf8'));
const geneva=JSON.parse(readFileSync(join(HERE,'geneva-four-slot-study.json'),'utf8'));
const fourbar=JSON.parse(readFileSync(join(HERE,'four-bar-study.json'),'utf8'));
const temp=fn=>async()=>{
 const dir=mkdtempSync(join(tmpdir(),'mechanism-claim-proof-'));
 try{return await fn(dir);}finally{rmSync(dir,{recursive:true,force:true});}
};
test('three distinct trusted mechanism families pass independent sampled kinematic claims',temp(async dir=>{
 for(const request of [slider,geneva,fourbar]){
  const out=join(dir,request.id);
  compileRequest({request,out});
  const result=await auditGenerated(out);
  assert.equal(result.status,'PASS');
  assert.equal(result.scientificSourceVerification,'NOT_EVALUATED');
  assert.equal(result.sourceDocumentsRetrieved,false);
  assert.equal(result.certifiedPhysics,false);
  assert.ok(result.claims.length>=3);
  assert.ok(result.claims.every(c=>c.status==='PASS'&&c.referenceIds?.length));
  assert.equal(result.references.length,request.references.length);
  assert.equal(result.files['model.mjs'].length,64);
 }
}));
test('modified kinematic model is rejected before any dynamic module import',temp(async dir=>{
 const output=join(dir,'slider');
 compileRequest({request:slider,out:output});
 writeFileSync(join(output,'model.mjs'),'throw Error("SHOULD_NEVER_EXECUTE");\n');
 await assert.rejects(auditGenerated(output),/AUDIT_TEMPLATE_CHANGED: model.mjs/);
}));
test('unreviewed CSS is rejected before model or WebGL execution',temp(async dir=>{
 const output=join(dir,'slider');
 compileRequest({request:slider,out:output});
 const css=join(output,'style.css');
 writeFileSync(css,readFileSync(css,'utf8')+'\n@import url("https://untrusted.example/track.css");');
 await assert.rejects(auditGenerated(output),/AUDIT_TEMPLATE_CHANGED: style.css/);
}));
test('forged numeric configuration is rejected before module evaluation',temp(async dir=>{
 const output=join(dir,'slider');
 compileRequest({request:slider,out:output});
 const file=join(output,'machine-config.mjs');
 writeFileSync(file,readFileSync(file,'utf8')+'\n// hidden mutation');
 await assert.rejects(auditGenerated(output),/AUDIT_MACHINE_CONFIG_MISMATCH/);
}));
test('tampered citations and physical claims are rejected',temp(async dir=>{
 const output=join(dir,'slider');
 compileRequest({request:slider,out:output});
 const file=join(output,'source-register.json');
 const x=JSON.parse(readFileSync(file,'utf8'));x.sourcesFetched=true;
 writeFileSync(file,JSON.stringify(x));
 await assert.rejects(auditGenerated(output),/AUDIT_SOURCE_REGISTER_MISMATCH/);
}));
test('nondefault dimensions are verified as mathematics, never as measurements',temp(async dir=>{
 const req=structuredClone(slider);req.id='slider-variant-audit';
 req.parameters.crankRadiusMm.value=24;
 req.parameters.rodLengthMm.value=80;
 req.parameters.inputRpm.value=18;
 const output=join(dir,'variant');compileRequest({request:req,out:output});
 const result=await auditGenerated(output);
 assert.equal(result.status,'PASS');
 assert.ok(result.assumptions.some(x=>x.id==='crankRadiusMm'&&x.value===24));
 assert.ok(result.claims.some(x=>x.id==='slider-rigid-link-closure'&&x.measured<1e-8));
}));

test('reviewed four-bar model audit proves two non-collapsed branches and rigid link closure',temp(async dir=>{
 const out=join(dir,'four-bar');compileRequest({request:fourbar,out});
 const result=await auditGenerated(out);
 assert.equal(result.mechanism,'four-bar');
 assert.equal(result.mechanismGraph.runtimeDriven,true);
 assert.equal(result.mechanismGraph.bodies,4);
 assert.equal(result.mechanismGraph.joints,4);
 assert.ok(result.claims.some(c=>c.id==='four-bar-loop-closure'&&c.measured<1e-8));
 assert.ok(result.claims.some(c=>c.id==='four-bar-dual-branch'&&c.measured<1e-8));
 assert.equal(result.sourceDocumentsRetrieved,false);
}));
test('edited four-bar graph branch and solver code fail before executing generated modules',temp(async dir=>{
 const out=join(dir,'four-bar');compileRequest({request:fourbar,out});
 const graphPath=join(out,'mechanism-graph.json');
 const graph=JSON.parse(readFileSync(graphPath,'utf8'));graph.assemblyBranch='crossed';
 writeFileSync(graphPath,JSON.stringify(graph));
 await assert.rejects(auditGenerated(out),/AUDIT_MACHINE_GRAPH_MISMATCH/);
}));
