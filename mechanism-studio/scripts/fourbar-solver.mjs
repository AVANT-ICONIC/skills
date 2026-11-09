/**
 * Circle-intersection solver for an ideal planar RRRR four-bar linkage.
 * No frame history. The two sign-selected mathematical intersections are
 * explicit, and unreachable or tangent configurations are not disguised.
 * All lengths in mm, angle and position in radians and mm.
 */
const TAU = Math.PI * 2;
const finite = n => typeof n === 'number' && Number.isFinite(n);
const cross = (u, v) => u.x * v.y - u.y * v.x;
const dist = (u, v) => Math.hypot(u.x - v.x, u.y - v.y);

export const FOUR_BAR_SOLVER = 'planar-four-bar-circle-intersection/1';
export const FOUR_BAR_BRANCHES = Object.freeze(['open', 'crossed']);

export function classifyFourBar({groundLengthMm: d, inputLengthMm: a, couplerLengthMm: b, outputLengthMm: c}) {
  if (![d, a, b, c].every(n => finite(n) && n > 0)) throw new TypeError('FOUR_BAR_LENGTH_INVALID');
  const sorted = [d, a, b, c].sort((x, y) => x - y);
  const grashofMarginMm = sorted[1] + sorted[2] - sorted[0] - sorted[3];
  const closureMarginMm = sorted[0] + sorted[1] + sorted[2] - sorted[3];
  const minPivotSeparation = Math.abs(d - a);
  const maxPivotSeparation = d + a;
  const minReach = Math.abs(b - c);
  const maxReach = b + c;
  const scale = Math.max(d, a, b, c);
  const tolerance = 1e-10 * scale;
  return Object.freeze({
    grashof: grashofMarginMm > tolerance ? 'strict' : grashofMarginMm < -tolerance ? 'non-grashof' : 'change-point',
    grashofMarginMm, closureMarginMm,
    assemblableAtSomeAngle: closureMarginMm >= -tolerance,
    fullDriverRotationPossible: minPivotSeparation >= minReach - tolerance && maxPivotSeparation <= maxReach + tolerance,
    noToggleThroughoutFullTurn: minPivotSeparation > minReach + tolerance && maxPivotSeparation < maxReach - tolerance,
    minPivotSeparationMm: minPivotSeparation, maxPivotSeparationMm: maxPivotSeparation
  });
}

export function solveFourBarGeometry(config, inputTurns, {branch = 'open', rpm = config.inputRpm} = {}) {
  const {groundLengthMm: d, inputLengthMm: a, couplerLengthMm: b, outputLengthMm: c} = config || {};
  if (![d, a, b, c].every(n => finite(n) && n > 0) || !finite(inputTurns) || !finite(rpm) || rpm <= 0 || rpm > 120)
    throw new TypeError('FOUR_BAR_INPUT_INVALID');
  if (!FOUR_BAR_BRANCHES.includes(branch)) throw new TypeError('FOUR_BAR_BRANCH_UNSUPPORTED');
  const theta = inputTurns * TAU;
  const o2 = {x: 0, y: 0}, o4 = {x: d, y: 0};
  const p2 = {x: a * Math.cos(theta), y: a * Math.sin(theta)};
  const v = {x: o4.x - p2.x, y: o4.y - p2.y};
  const e = Math.hypot(v.x, v.y);
  const tolerance = Math.max(d, a, b, c) * 1e-10;
  const common = {schema: 'avant.mechanism-pose/1', solver: FOUR_BAR_SOLVER,
    inputTurns, branch, inputAngleRad: theta, anchorInput: o2,
    anchorOutput: o4, inputPin: p2, classification: classifyFourBar(config),
    certifiedPhysics: false};
  if (e <= tolerance) {
    // Coincident circle centers admit infinitely many solutions when b === c.
    return {...common, status: 'ambiguous', reason: 'COINCIDENT_CIRCLE_CENTERS',
      outputPin: null, poses: null, residuals: null, angularSpeedRatio: null};
  }
  const lower = Math.abs(b - c), upper = b + c;
  if (e < lower - tolerance || e > upper + tolerance) {
    return {...common, status: 'unreachable', reason: 'LINKAGE_CANNOT_CLOSE',
      pivotSeparationMm: e, reachableRangeMm: [lower, upper],
      outputPin: null, poses: null, residuals: null, angularSpeedRatio: null};
  }
  const along = (b * b - c * c + e * e) / (2 * e);
  const square = b * b - along * along;
  if (square < -tolerance * Math.max(1, b)) {
    return {...common, status: 'unreachable', reason: 'NEGATIVE_INTERSECTION_DISCRIMINANT',
      outputPin: null, poses: null, residuals: null, angularSpeedRatio: null};
  }
  const height = Math.sqrt(Math.max(0, square));
  const unit = {x: v.x / e, y: v.y / e};
  const sign = branch === 'open' ? 1 : -1;
  const p3 = {x: p2.x + along * unit.x - sign * height * unit.y,
    y: p2.y + along * unit.y + sign * height * unit.x};
  const couplerAngleRad = Math.atan2(p3.y - p2.y, p3.x - p2.x);
  const outputAngleRad = Math.atan2(p3.y, p3.x - d);
  const u3 = {x: (p3.x - p2.x) / b, y: (p3.y - p2.y) / b};
  const u4 = {x: (p3.x - d) / c, y: p3.y / c};
  const jacobian = cross(u3, u4);
  const singular = height <= tolerance || Math.abs(jacobian) <= 1e-10;
  const omega = rpm * TAU / 60;
  const angularSpeedRatio = singular ? null : (a * Math.sin(couplerAngleRad - theta)) /
    (c * Math.sin(couplerAngleRad - outputAngleRad));
  const separation = Math.acos(Math.max(-1, Math.min(1, u3.x * u4.x + u3.y * u4.y)));
  const residuals = {
    inputLinkMm: Math.abs(dist(o2, p2) - a),
    couplerLinkMm: Math.abs(dist(p2, p3) - b),
    outputLinkMm: Math.abs(dist(o4, p3) - c),
    groundLinkMm: Math.abs(dist(o2, o4) - d)
  };
  const poses = {ground: {x: 0, y: 0, angleRad: 0},
    input: {x: 0, y: 0, angleRad: theta},
    coupler: {x: p2.x, y: p2.y, angleRad: couplerAngleRad},
    rocker: {x: d, y: 0, angleRad: outputAngleRad}};
  return {...common, status: singular ? 'singular' : 'closed',
    reason: singular ? 'TOGGLE_DEGENERACY' : null,
    branchDistinct: !singular, pivotSeparationMm: e, reachableRangeMm: [lower, upper],
    outputPin: p3, poses, residuals,
    couplerAngleRad, outputAngleRad, transmissionAngleDeg: separation * 180 / Math.PI,
    intersectionHeightMm: height, jacobian,
    angularSpeedRatio, outputAngularVelocityRadS: singular ? null : omega * angularSpeedRatio};
}
