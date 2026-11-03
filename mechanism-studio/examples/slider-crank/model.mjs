/**
 * Ideal in-line slider-crank geometry.
 * x = r cos(theta) + sqrt(l²-r² sin²(theta)).
 * The position is measured from the crank center along the piston axis.
 * https://planex2d.org/docs/examples/slider-crank.html
 * https://cpoli.github.io/engineeringkit/api/mechanical_engineering.html
 * No friction, torque, combustion, bearing loads or collision physics.
 */
import {CONFIG} from './machine-config.mjs';
const TAU=2*Math.PI;
export function evaluateSliderCrank(turns,config=CONFIG){
  const {crankRadiusMm:r,rodLengthMm:l,inputRpm:rpm}=config;
  if(!Number.isFinite(turns)||![r,l,rpm].every(Number.isFinite)||r<=0||l<=r||rpm<=0)
    throw new TypeError('INVALID_KINEMATIC_INPUT');
  const angleRad=turns*TAU,si=Math.sin(angleRad),co=Math.cos(angleRad);
  const root=Math.sqrt(l*l-r*r*si*si);
  const crankX=r*co,crankY=r*si;
  const pistonX=crankX+root;
  const strokeMm=(r+l)-pistonX;
  const rodAngleRad=Math.atan2(-crankY,root);
  const angularVelocityRadS=rpm*TAU/60;
  const velocityMmS=(-r*si-r*r*si*co/root)*angularVelocityRadS;
  return Object.freeze({turns,angleRad,phaseDeg:((turns*360)%360+360)%360,
    crankX,crankY,pistonX,strokeMm,rodAngleRad,
    velocityMmS,angularVelocityRadS,
    strokeTotalMm:2*r,rodLengthMm:l,crankRadiusMm:r,rpm});
}
export function stateAtTime(t,config=CONFIG){
  if(!Number.isFinite(t))throw new TypeError('INVALID_TIME');
  return evaluateSliderCrank(t*config.inputRpm/60,config);
}
