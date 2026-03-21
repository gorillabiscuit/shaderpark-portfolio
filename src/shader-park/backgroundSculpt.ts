/**
 * Shader Park sculpture source (JavaScript DSL), compiled by shader-park-core.
 *
 * `input(default, min, max)` — the uniform name is the `var` id (do not pass a string name;
 * the preprocessor prepends it). Values are updated via `updateUniforms` in ShaderParkBackground.
 * `_scale` is the minimal renderer’s global sculpt scale (not an `input()`).
 *
 * Material grading uses `glslFuncES3`: the JS-side `mix()` helper is float-only, so HSV + contrast
 * run in GLSL. `fresnel()` adds view-dependent rim (see Shader Park material docs).
 */
export const backgroundSculptSource = `
setGeometryQuality(88);
setMaxIterations(420);

var uMatR = input(0.796078431372549, 0, 1);
var uMatG = input(1, 0, 1);
var uMatB = input(0.058823529411764705, 0, 1);

var uHueShift = input(0.025, -1, 1);
var uSat = input(1.37, 0, 2);
var uValue = input(1.92, 0, 2);
var uContrast = input(1.6, 0.35, 2.2);
var uAmbient = input(0.015, 0, 0.35);
var uRim = input(0, 0, 1);

var uMetal = input(0.67, 0, 1);
var uShine = input(0.66, 0, 1);
var uBallMetal = input(0.69, 0, 1);

var uPosX = input(0, -0.85, 0.85);
var uPosY = input(0, -0.85, 0.85);
var uPosZ = input(0, -0.85, 0.85);

var spMatAdjust = glslFuncES3(\`
vec3 spMatAdjust(vec3 rgb, float hueShift, float satMul, float valMul, float contrast, float ambient) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(rgb.bg, K.wz), vec4(rgb.gb, K.xy), step(rgb.b, rgb.g));
  vec4 q = mix(vec4(p.xyw, rgb.r), vec4(rgb.r, p.yzx), step(p.x, rgb.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  vec3 hsv = vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  hsv.x = fract(hsv.x + hueShift + 1.0);
  hsv.y = clamp(hsv.y * satMul, 0.0, 1.0);
  hsv.z = clamp(hsv.z * valMul, 0.0, 1.0);
  vec3 seg = clamp(abs(mod(hsv.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  vec3 rgbOut = hsv.z * mix(vec3(1.0), seg, hsv.y);
  rgbOut = clamp((rgbOut - 0.5) * contrast + 0.5, 0.0, 1.0);
  rgbOut = clamp(rgbOut + vec3(ambient), 0.0, 1.0);
  return rgbOut;
}
\`);

var matRgb = spMatAdjust(vec3(uMatR, uMatG, uMatB), uHueShift, uSat, uValue, uContrast, uAmbient);

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
  fresnel(uRim);
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
  fresnel(uRim);
  color(matRgb);
  torus(innerR, innerTube);
  intersect();
  setSDF(getSpace().y);
})();

blend(mergeK);

shape(function() {
  displace(uPosX, uPosY, uPosZ);
  fresnel(uRim);
  color(matRgb);
  metal(uBallMetal);
  sphere(ballR);
})();
`.trim()
