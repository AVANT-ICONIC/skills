/** Idealized four-slot external Geneva indexing drive.
 * Independently derived from classical pin-slot geometry.
 * https://planex2d.org/docs/examples/geneva-drive.html
 * https://catalogimages.wiley.com/images/db/pdf/9781119054337.excerpt.pdf
 * Physical locking cam is intentionally NOT modeled.
 */
export const GENEVA=Object.freeze({
  slots:4,crankRadiusMm:30,pinRadiusMm:2,radialSlotHalfWidthMm:2.4,
  slotEndCenterMm:9.5,outputRadiusMm:34,inputRpm:12,
  centerDistanceMm:30/Math.sin(Math.PI/4),
  engagementHalfAngleRad:Math.PI/4,outputStepRad:Math.PI/2,dwellFraction:0.75
});
const TAU=Math.PI*2;
export const DEG=180/Math.PI;
export const wrapAngle=x=>Math.atan2(Math.sin(x),Math.cos(x));
/** Pure evaluation: inputTurns denotes absolute input revolutions. */
export function evaluateGeneva(inputTurns){
  if(!Number.isFinite(inputTurns))throw new TypeError('inputTurns must be finite');
  const {crankRadiusMm:r,centerDistanceMm:c,engagementHalfAngleRad:half}=GENEVA;
  const raw=inputTurns*TAU;
  const cycle=Math.floor((raw+Math.PI)/TAU);
  const phase=raw-cycle*TAU;
  const engaged=Math.abs(phase)<half;
  let outputAngleRad,rateRatio=0;
  if(phase<=-half)outputAngleRad=-cycle*Math.PI/2;
  else if(phase>=half)outputAngleRad=-(cycle+1)*Math.PI/2;
  else{
    const x=r*Math.cos(phase)-c,y=r*Math.sin(phase);
    const pinDirection=Math.atan2(y,x)-(phase>=0?TAU:0);
    outputAngleRad=-cycle*Math.PI/2+pinDirection+3*Math.PI/4;
    rateRatio=(r*r-c*r*Math.cos(phase))/(x*x+y*y);
  }
  const pinLocalX=r*Math.cos(phase),pinLocalY=r*Math.sin(phase);
  const wheelPinX=pinLocalX-c,wheelPinY=pinLocalY;
  const pinDist=Math.hypot(wheelPinX,wheelPinY);
  const activeSlot=((cycle%GENEVA.slots)+GENEVA.slots)%GENEVA.slots;
  const slotWorldAngle=-3*Math.PI/4+activeSlot*Math.PI/2+outputAngleRad;
  const contactError=engaged?wrapAngle(Math.atan2(wheelPinY,wheelPinX)-slotWorldAngle):null;
  return Object.freeze({
    inputTurns,inputAngleRad:raw,phaseRad:phase,cycle,outputAngleRad,
    outputAngleDeg:outputAngleRad*DEG,engaged,dwell:!engaged,
    step:GENEVA.outputStepRad,completedSteps:cycle+(phase>=half?1:0),
    activeSlot,pinLocalX,pinLocalY,pinToOutputCenterMm:pinDist,
    speedRatio:rateRatio,contactAlignmentErrorRad:contactError
  });
}
/** Film starts in the middle of a dwell with the pin pointing away. */
export function modelAtTime(seconds,inputRpm=GENEVA.inputRpm,offsetTurns=-.5){
  if(!Number.isFinite(seconds)||!Number.isFinite(inputRpm)||inputRpm<=0||inputRpm>120||!Number.isFinite(offsetTurns))
    throw new TypeError('invalid time or rpm');
  return evaluateGeneva(offsetTurns+seconds*inputRpm/60);
}
