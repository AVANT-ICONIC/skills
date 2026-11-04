/**
 * Inline slider-crank adapter to the canonical declarative kinematic graph.
 * Pose of each rigid body is solved from its reviewed joint constraints.
 * Forces, wear, combustion and manufacturing tolerances are not modeled.
 */
import {CONFIG} from './machine-config.mjs';
import {GRAPH} from './machine-graph.mjs';
import {makeSliderGraph,solvePlanarGraph} from './mechanism-graph.mjs';

/** Absolute driver turns, no mutable previous-frame state. */
export function evaluateSliderCrank(turns,config=CONFIG){
 const {crankRadiusMm:r,rodLengthMm:l,inputRpm:rpm}=config||{};
 if(!Number.isFinite(turns)||![r,l,rpm].every(Number.isFinite)||
   r<=0||l<=r||rpm<=0)throw new TypeError('INVALID_KINEMATIC_INPUT');
 // Reuse the compiled graph for all ordinary film frames. An explicitly
 // supplied alternative valid geometry is compiled to the same graph schema.
 const g=(r===GRAPH.parameters.crankRadiusMm&&l===GRAPH.parameters.rodLengthMm)
   ?GRAPH:makeSliderGraph({id:GRAPH.id,crankRadiusMm:r,rodLengthMm:l,inputRpm:rpm,
      sourceIds:GRAPH.provenance.sourceIds});
 const solved=solvePlanarGraph(g,turns,{rpm});
 return Object.freeze(solved.state);
}
export function stateAtTime(t,config=CONFIG){
 if(!Number.isFinite(t))throw new TypeError('INVALID_TIME');
 return evaluateSliderCrank(t*config.inputRpm/60,config);
}
