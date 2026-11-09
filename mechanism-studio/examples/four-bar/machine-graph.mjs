/* Default graph. Compiler replaces this with a reviewed serialized graph. */
import {CONFIG} from './machine-config.mjs';
import {makeFourBarGraph} from './mechanism-graph.mjs';
export const GRAPH=makeFourBarGraph({id:'four-bar-crank-rocker-study-003',...CONFIG});
