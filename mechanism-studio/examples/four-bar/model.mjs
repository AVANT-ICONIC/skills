/** Ideal four-bar crank-rocker. Body poses derive from graph revolute anchors. */
import {CONFIG} from './machine-config.mjs';
import {GRAPH} from './machine-graph.mjs';
import {solvePlanarGraph} from './mechanism-graph.mjs';
export function evaluateFourBar(turns,{branch=CONFIG.assemblyBranch,rpm=CONFIG.inputRpm}={}){
 if(!Number.isFinite(turns))throw new TypeError('FOUR_BAR_TIME_INVALID');
 const solved=solvePlanarGraph(GRAPH,turns,{branch,rpm});
 if(solved.status!=='closed'){
  return Object.freeze({inputTurns:turns,status:solved.status,reason:solved.reason,
   branch,poses:solved.poses,outputPin:solved.outputPin,
   certifiedPhysics:false});
 }
 return Object.freeze({...solved.state,inputTurns:turns,status:solved.status,
  reason:null,branch,poses:solved.poses,residuals:solved.residuals,
  intersectionHeightMm:solved.intersectionHeightMm,
  grashof:solved.classification.grashof,certifiedPhysics:false});
}
export const stateAtTime=(seconds,options={})=>{
 if(!Number.isFinite(seconds))throw new TypeError('FOUR_BAR_TIME_INVALID');
 return evaluateFourBar(seconds*(options.rpm??CONFIG.inputRpm)/60,options);
};
