/**
 * Experimental planar-constraint core v1. Pure, bounded, zero dependencies.
 * Invariant: constraints carry distances in millimetres; fixed points and
 * variable seeds are explicit; code cannot evaluate user-supplied expressions.
 * Damped Gauss-Newton seeks a root but does NOT prove global uniqueness or
 * impossibility except for provably incompatible two-circle geometry.
 */
export const CONSTRAINT_SCHEMA = 'avant.planar-constraints/1';
const finite = x => typeof x === 'number' && Number.isFinite(x);
const vec2 = x => Array.isArray(x) && x.length === 2 && x.every(v => finite(v) && Math.abs(v) <= 1e5);
const ID = /^[a-z][a-z0-9-]{0,63}$/;
const maxAbs = a => Math.max(0, ...a.map(x => Math.abs(x)));

export function validateConstraintProblem(problem) {
  if (!problem || problem.schema !== CONSTRAINT_SCHEMA || !Array.isArray(problem.points) ||
    !Array.isArray(problem.constraints) || problem.points.length < 2 || problem.points.length > 16 ||
    problem.constraints.length < 1 || problem.constraints.length > 48)
    throw new Error('CONSTRAINT_SCHEMA_INVALID');
  const ids = new Set(), free = [];
  for (const p of problem.points) {
    if (!p || typeof p.id !== 'string' || !ID.test(p.id) || ids.has(p.id) ||
      (p.fixed === undefined) === (p.seed === undefined)) throw new Error('CONSTRAINT_POINT_INVALID');
    if (!vec2(p.fixed ?? p.seed)) throw new Error('CONSTRAINT_COORDINATE_INVALID');
    ids.add(p.id);
    if (p.seed !== undefined) free.push(p.id);
  }
  if (free.length === 0 || free.length > 8) throw new Error('CONSTRAINT_VARIABLE_LIMIT');
  const names = new Set();
  let equationCount = 0;
  for (const c of problem.constraints) {
    if (!c || typeof c.id !== 'string' || !ID.test(c.id) || names.has(c.id) || !ids.has(c.a))
      throw new Error('CONSTRAINT_REFERENCE_INVALID');
    names.add(c.id);
    if (c.kind === 'distance') {
      if (!ids.has(c.b) || c.a === c.b || !finite(c.lengthMm) || c.lengthMm < 0 || c.lengthMm > 1e4)
        throw new Error('CONSTRAINT_DISTANCE_INVALID');
    } else if (c.kind === 'axis') {
      if (!vec2(c.origin) || !vec2(c.direction) ||
          Math.abs(Math.hypot(...c.direction) - 1) > 1e-9)
        throw new Error('CONSTRAINT_AXIS_INVALID');
    } else throw new Error('CONSTRAINT_KIND_UNSUPPORTED');
    equationCount++;
  }
  const variableCount = free.length * 2;
  return Object.freeze({variableCount, equationCount, freeIds: free});
}

function linearSystem(A, b) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let k = 0; k < n; k++) {
    let best = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[best][k])) best = i;
    if (Math.abs(M[best][k]) < 1e-18) return null;
    [M[k], M[best]] = [M[best], M[k]];
    const pivot = M[k][k];
    for (let j = k; j <= n; j++) M[k][j] /= pivot;
    for (let i = 0; i < n; i++) if (i !== k) {
      const factor = M[i][k];
      for (let j = k; j <= n; j++) M[i][j] -= factor * M[k][j];
    }
  }
  return M.map(row => row[n]);
}

function matrixRank(matrix, n, eps = 1e-9) {
  const A = matrix.map(row => [...row]);
  let rank = 0;
  for (let col = 0; col < n && rank < A.length; col++) {
    let pivot = rank;
    for (let row = rank + 1; row < A.length; row++)
      if (Math.abs(A[row][col]) > Math.abs(A[pivot][col])) pivot = row;
    if (Math.abs(A[pivot][col]) < eps) continue;
    [A[rank], A[pivot]] = [A[pivot], A[rank]];
    const div = A[rank][col];
    for (let j = col; j < n; j++) A[rank][j] /= div;
    for (let row = rank + 1; row < A.length; row++) {
      const factor = A[row][col];
      for (let j = col; j < n; j++) A[row][j] -= factor * A[rank][j];
    }
    rank++;
  }
  return rank;
}

function evaluate(problem, free, x) {
  const coordinates = Object.fromEntries(problem.points.map(p => [p.id, [...(p.fixed ?? p.seed)]]));
  for (let i = 0; i < free.length; i++) coordinates[free[i]] = [x[2*i], x[2*i+1]];
  const column = Object.fromEntries(free.map((id,i) => [id,2*i]));
  const residuals = [], J = [];
  for (const c of problem.constraints) {
    const row = Array(x.length).fill(0), a = coordinates[c.a];
    if (c.kind === 'distance') {
      const b = coordinates[c.b], dx = a[0]-b[0], dy = a[1]-b[1];
      const d = Math.hypot(dx,dy);
      residuals.push(d-c.lengthMm);
      if (d > 1e-12) {
        const nx=dx/d, ny=dy/d;
        if (column[c.a] !== undefined) {row[column[c.a]]+=nx;row[column[c.a]+1]+=ny;}
        if (column[c.b] !== undefined) {row[column[c.b]]-=nx;row[column[c.b]+1]-=ny;}
      }
    } else {
      const [ux,uy] = c.direction, nx=-uy,ny=ux;
      residuals.push((a[0]-c.origin[0])*nx+(a[1]-c.origin[1])*ny);
      if (column[c.a] !== undefined) {row[column[c.a]]+=nx;row[column[c.a]+1]+=ny;}
    }
    J.push(row);
  }
  return {coordinates, residuals, J};
}

function certifiedCircleFailure(problem) {
  const free = problem.points.filter(p => p.seed !== undefined);
  const dist = problem.constraints.filter(c => c.kind === 'distance');
  if (free.length !== 1 || dist.length !== 2 || problem.constraints.length !== 2) return null;
  const variable = free[0].id, fixed = new Map(problem.points.filter(p=>p.fixed!==undefined).map(p=>[p.id,p.fixed]));
  const centers=[];
  for (const c of dist) {
    const other = c.a===variable?c.b:c.b===variable?c.a:null;
    if (!other || !fixed.has(other)) return null;
    centers.push({p:fixed.get(other),r:c.lengthMm});
  }
  const d=Math.hypot(centers[0].p[0]-centers[1].p[0],centers[0].p[1]-centers[1].p[1]);
  const [r1,r2]=centers.map(x=>x.r);
  const tol=1e-10*Math.max(1,d,r1,r2);
  if (d<tol) return Math.abs(r1-r2)<=tol ? 'ambiguous' : 'unreachable';
  if (d > r1+r2+tol || d < Math.abs(r1-r2)-tol) return 'unreachable';
  return null;
}

/**
 * @returns status closed|singular|underdetermined|unreachable|ambiguous|unresolved
 * Never treats local optimizer failure as a proof of geometric impossibility.
 */
export function solvePlanarConstraints(problem, {toleranceMm=1e-8,maxIterations=90}={}) {
  const meta=validateConstraintProblem(problem);
  if (!finite(toleranceMm) || toleranceMm<=0 || toleranceMm>1 ||
      !Number.isInteger(maxIterations) || maxIterations<1 || maxIterations>500)
    throw new TypeError('CONSTRAINT_OPTIONS_INVALID');
  const certified=certifiedCircleFailure(problem);
  if (certified) return {schema:'avant.constraint-solution/1',status:certified,
    reason:'PROVEN_CIRCLE_RELATION',positions:null,maxResidualMm:null,iterations:0,
    certifiedPhysics:false};
  if (meta.equationCount<meta.variableCount) return {schema:'avant.constraint-solution/1',
    status:'underdetermined',reason:'TOO_FEW_EQUATIONS',positions:null,maxResidualMm:null,
    iterations:0,certifiedPhysics:false};
  const x=meta.freeIds.flatMap(id=>[...problem.points.find(p=>p.id===id).seed]);
  let lambda=1e-3, count=0;
  let state=evaluate(problem,meta.freeIds,x);
  for (;count < maxIterations;count++) {
    if (maxAbs(state.residuals)<=toleranceMm) break;
    const n=x.length, J=state.J,r=state.residuals;
    const h=Array.from({length:n},()=>Array(n).fill(0));
    const g=Array(n).fill(0);
    for (let i=0;i<r.length;i++) for (let j=0;j<n;j++) {
      g[j]+=J[i][j]*r[i];
      for (let k=0;k<n;k++) h[j][k]+=J[i][j]*J[i][k];
    }
    let accepted=false;
    for (let trial=0;trial<14;trial++) {
      const A=h.map((row,i)=>row.map((v,j)=>v+(i===j?lambda:0)));
      const step=linearSystem(A,g.map(v=>-v));
      if (!step || !step.every(finite)) break;
      const y=x.map((v,i)=>v+step[i]);
      if (!y.every(v=>finite(v)&&Math.abs(v)<=1e6)) break;
      const next=evaluate(problem,meta.freeIds,y);
      const oldCost=r.reduce((sum,v)=>sum+v*v,0);
      const newCost=next.residuals.reduce((sum,v)=>sum+v*v,0);
      if (newCost < oldCost) {
        x.splice(0,x.length,...y);state=next;lambda=Math.max(1e-12,lambda*.3);
        accepted=true;break;
      }
      lambda=Math.min(1e14,lambda*10);
    }
    if (!accepted) break;
  }
  const maxResidualMm=maxAbs(state.residuals);
  const rank=matrixRank(state.J,x.length);
  const closed=maxResidualMm<=toleranceMm;
  const status=closed?(rank<x.length?'singular':'closed'):'unresolved';
  return {schema:'avant.constraint-solution/1',status,
    reason:status==='singular'?'RANK_DEFICIENT_JACOBIAN':status==='unresolved'?'NO_CERTIFIED_ROOT':null,
    positions:closed?state.coordinates:null, maxResidualMm,
    residuals:Object.fromEntries(problem.constraints.map((c,i)=>[c.id,state.residuals[i]])),
    jacobianRank:rank,unknowns:x.length,iterations:count,certifiedPhysics:false};
}
