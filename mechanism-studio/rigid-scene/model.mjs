/** The same trusted entrypoint evaluates any validated rigid-scene graph. */
import {SCENE} from './scene-data.mjs';
import {solveSceneAtTime} from './scene-core.mjs';
export {SCENE};
export const evaluateAtTime=(t,opts={})=>solveSceneAtTime(SCENE,t,opts);
