/* Default example graph; compiled studies use a validated data-only graph. */
import {CONFIG} from './machine-config.mjs';
import {makeSliderGraph} from './mechanism-graph.mjs';
export const GRAPH=makeSliderGraph({id:'slider-crank-preview',crankRadiusMm:CONFIG.crankRadiusMm,rodLengthMm:CONFIG.rodLengthMm,inputRpm:CONFIG.inputRpm});
