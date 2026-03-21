/**
 * Shader Park sculpture source (JavaScript DSL), compiled by shader-park-core.
 *
 * `input(default, min, max)` — the uniform name is the `var` id (do not pass a string name;
 * the preprocessor prepends it). Values are updated via `updateUniforms` in ShaderParkBackground.
 * `_scale` is the minimal renderer’s global sculpt scale (not an `input()`).
 */
export const backgroundSculptSource = `
setGeometryQuality(88);
setMaxIterations(420);

var uMatR = input(0.7882353, 0, 1);
var uMatG = input(0.9411765, 0, 1);
var uMatB = input(0.0627451, 0, 1);
var matRgb = vec3(uMatR, uMatG, uMatB);

var uMetal = input(0.52, 0, 1);
var uShine = input(0.38, 0, 1);
var uBallMetal = input(0.78, 0, 1);

var uPosX = input(0, -0.85, 0.85);
var uPosY = input(0, -0.85, 0.85);
var uPosZ = input(0, -0.85, 0.85);

metal(uMetal);
shine(uShine);

var breatheA = nsin(mult(0.85, time));
var breatheB = nsin(mult(1.35, add(time, 1.2)));
var overlap = mult(breatheA, breatheB);

var outerR = add(0.34, mult(0.11, breatheA));
var outerTube = add(0.07, mult(0.045, breatheB));

var innerR = add(0.17, mult(0.11, breatheB));
var innerTube = add(0.048, mult(0.038, breatheA));

var ballR = add(0.048, mult(0.095, overlap));

var mergeK = add(0.05, mult(0.22, overlap));

var mx = mult(0.95, mouse.x);
var my = mult(0.75, mouse.y);

shape(function() {
  displace(uPosX, uPosY, uPosZ);
  rotateY(add(mult(0.72, time), mx));
  rotateZ(add(mult(0.48, time), mult(0.35, my)));
  color(matRgb);
  torus(outerR, outerTube);
  intersect();
  setSDF(mult(-1, getSpace().y));
})();

blend(mergeK);

shape(function() {
  displace(uPosX, uPosY, uPosZ);
  rotateX(add(mult(-0.62, time), my));
  rotateY(add(PI * 0.5, mult(0.4, mx)));
  rotateZ(mult(0.58, time));
  color(matRgb);
  torus(innerR, innerTube);
  intersect();
  setSDF(getSpace().y);
})();

blend(mergeK);

shape(function() {
  displace(uPosX, uPosY, uPosZ);
  color(matRgb);
  metal(uBallMetal);
  sphere(ballR);
})();
`.trim()
