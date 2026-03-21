/**
 * Shader Park sculpture source (JavaScript DSL), compiled by shader-park-core.
 *
 * Half-tori + sphere: base motion from time; pointer adds rotation offsets (similar
 * in spirit to shaderpark.com’s front-page sculpts using input(hover) for rotate,
 * though their site uses Three.js + OrbitControls + smoothed uniforms). Color #C9F010.
 */
export const backgroundSculptSource = `
setGeometryQuality(88);
setMaxIterations(420);

metal(0.52);
shine(0.38);

var breatheA = nsin(mult(0.85, time));
var breatheB = nsin(mult(1.35, add(time, 1.2)));
var overlap = mult(breatheA, breatheB);

var outerR = add(0.34, mult(0.11, breatheA));
var outerTube = add(0.07, mult(0.045, breatheB));

var innerR = add(0.17, mult(0.11, breatheB));
var innerTube = add(0.048, mult(0.038, breatheA));

var ballR = add(0.048, mult(0.095, overlap));

var mergeK = add(0.05, mult(0.22, overlap));

// NDC-ish mouse from global pointer mapping: subtle extra tilt on top of time
var mx = mult(0.95, mouse.x);
var my = mult(0.75, mouse.y);

shape(function() {
  rotateY(add(mult(0.72, time), mx));
  rotateZ(add(mult(0.48, time), mult(0.35, my)));
  color(vec3(201/255, 240/255, 16/255));
  torus(outerR, outerTube);
  intersect();
  setSDF(mult(-1, getSpace().y));
})();

blend(mergeK);

shape(function() {
  rotateX(add(mult(-0.62, time), my));
  rotateY(add(PI * 0.5, mult(0.4, mx)));
  rotateZ(mult(0.58, time));
  color(vec3(201/255, 240/255, 16/255));
  torus(innerR, innerTube);
  intersect();
  setSDF(getSpace().y);
})();

blend(mergeK);

shape(function() {
  color(vec3(201/255, 240/255, 16/255));
  metal(0.78);
  sphere(ballR);
})();
`.trim()
