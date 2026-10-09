import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { generateTokens } from '../scripts/s5/tokens.mjs';
import { generateCompositions } from '../scripts/s5/composition.mjs';
import { inspectGrammar } from '../scripts/s6/grammar.mjs';
import { auditSvg } from '../scripts/s4/auditor.mjs';
const root=resolve(fileURLToPath(new URL('..', import.meta.url)));
const sample=JSON.parse(readFileSync(join(root,'examples/brief.json'),'utf8'));
const grammar=JSON.parse(readFileSync(join(root,'examples/grammar-input.json'),'utf8'));
const run=(f,args)=>spawnSync(process.execPath,[join(root,'scripts',f),...args],{encoding:'utf8',timeout:15000});
const tmp=()=>mkdtempSync(join(tmpdir(),'geom-public-'));
test('public package truly standalone with all relative module imports',async()=>{
 for(const name of ['s1/geometry.mjs','s2/svg.mjs','s2/topology.mjs','s3/raster.mjs','s4/auditor.mjs','s4/proposals.mjs','s5/composition.mjs','s5/tokens.mjs','s5/preview.mjs','s5/guides.mjs','s6/grammar.mjs']){
  const mod=await import(new URL('../scripts/'+name,import.meta.url));assert.ok(Object.keys(mod).length>0,name);
 }
});
test('safe SVG audit reports source truth without fictitious raster proof',()=>{
 const v=auditSvg('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="#000000"/></svg>');
 assert.equal(v.schema,'geometry-report/1');assert.match(v.sourceDigest,/^[a-f0-9]{64}$/);assert.notEqual(v.verified?.raster,'RENDERED_OBSERVED');
});
test('phi token and three distinct semantic trees execute',()=>{
 const t=generateTokens({}),c=generateCompositions(sample);assert.equal(c.candidates.length,3);
 assert.equal(new Set(c.candidates.map(x=>JSON.stringify(x.tree))).size,3);
 assert.ok(t.manifest.primitives.some(x=>x.id==='gap-card'));
});
test('default spacing: source model matches existing responsive rem token without CSS override',()=>{
 const tokens=generateTokens(),model=generateCompositions(sample),report=inspectGrammar(grammar);
 const primitive=tokens.manifest.primitives.find(x=>x.id==='gap-card');
 assert.equal(primitive.unit,'rem');assert.equal(model.cardGapContract.cssValue,primitive.cssValue);
 assert.equal(model.cardGapContract.referencePx,primitive.actualPx);
 assert.equal(model.cardGapContract.expectedPxAt32Root,Number((primitive.actualPx*2).toFixed(6)));
 assert.ok(model.candidates.every(c=>c.layouts.every(l=>l.negativeSpace.cardGap===primitive.actualPx)));
 assert.equal(report.tokenBridgeProposal.status,'NOT_NEEDED');assert.equal(report.tokenBridgeProposal.css,null);
 assert.ok(report.report.rules.filter(r=>r.kind==='rhythm').every(r=>r.status==='PASS'));
 assert.equal(report.report.exceptionLedger.some(e=>e.id==='cross-lane-card-gap-divergence'),false);
 assert.equal(report.report.verified.browser,'NOT_EVALUATED');
});
test('CLI capability, composition, CSS, HTML, grammar run against actual new files',()=>{
 const dir=tmp();try {
  let r=run('s2/cli.mjs',['capabilities']);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).network,false);
  const input=join(root,'examples/brief.json'),gin=join(root,'examples/grammar-input.json');
  for(const [module,command,source,filename] of [
   ['s5/cli.mjs','compose',input,'composition.json'],['s5/cli.mjs','tokens',join(dir,'token-input.json'),'theme.css'],
   ['s5/cli.mjs','preview',input,'preview.html'],['s6/cli.mjs','grammar',gin,'grammar.json']]) {
   if(command==='tokens')writeFileSync(source,'{}');
   const out=join(dir,filename);r=run(module,[command,source,'--out',out]);assert.equal(r.status,0,command+': '+r.stderr);
   const bytes=readFileSync(out,'utf8');assert.ok(bytes.length>60);if(command==='preview')assert.match(bytes,/<html/);
   if(command==='grammar'){const g=JSON.parse(bytes);assert.equal(g.schema,'geometry-grammar-report/1')}
   r=run(module,[command,source,'--out',out]);assert.notEqual(r.status,0,'no clobber '+command);
  }
 }finally{rmSync(dir,{force:true,recursive:true})}
});
test('stable canonical policy is present and usable offline',()=>{
 const s=readFileSync(join(root,'references/geometry-policy.md'),'utf8');assert.match(s,/L1 Symbol geometry/);assert.match(s,/L5 Design grammar/);
 assert.doesNotMatch(s,/private rehearsal/i);
});
