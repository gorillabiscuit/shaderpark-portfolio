/**
 * Shader Park sculpture source (JavaScript DSL), compiled by shader-park-core.
 *
 * `input(default, min, max)` — the uniform name is the `var` id (do not pass a string name;
 * the preprocessor prepends it). Values are updated via `updateUniforms` in ShaderParkBackground.
 * `_scale` is the minimal renderer’s global sculpt scale (not an `input()`).
 *
 * Material grading uses `glslFuncES3`: the JS-side `mix()` helper is float-only, so HSV + contrast
 * run in GLSL. `fresnel()` adds view-dependent rim (see Shader Park material docs).
 *
 * Raymarch cost: tune via `buildBackgroundSculptSource` (geometry quality, max iterations, step size)
 * — see Shader Park global settings docs.
 */
/** Scene 1 — torus sculpture (original background). */
const SCENE_1_BODY = `
var uMatR = input(0.6235294117647059, 0, 1);
var uMatG = input(0.9411764705882353, 0, 1);
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

/** One yellow hollow shell + two side box cuts (local origin = object center). */
const SCENE_2_SHELL_CSG = `
  fresnel(0.12);
  color(yellowR, yellowG, yellowB);
  metal(0.05);
  shine(0.48);
  sphere(ringOuter);
  difference();
  sphere(ringInner);
  difference();
  shape(function() {
    displace(blueCenterX, 0, 0);
    box(cutHalfX, cutHalfY, cutHalfZ);
  })();
  difference();
  shape(function() {
    displace(greenCenterX, 0, 0);
    box(cutHalfX, cutHalfY, cutHalfZ);
  })();
`.trim()

/**
 * Scene 2 — Three hollow shells, `blend(mergeK)` like scene 1. Same CSG, fixed 90° so notch pairs align
 * with **X** (default), **Z** (`rotateY(π/2)`), and **Y** (`rotateZ(π/2)`). Each axis adds `nsin` wobble on top
 * of `mult(speed, time)` so rotation **speeds up and slows down** smoothly (no `if(time)` branching).
 * Base rates and wobble amplitudes are **4×** prior values (+300% peak linear speed vs earlier tuning).
 * **Mouse:** tune **`s2MouseInfluence`** — scales `s2Msx` / `s2Msy` (incl. Z roll mix).
 * **Programmatic spin:** tune **`s2ProgRotScale`** (1 = full speed); `0.6` = 40% slower than baseline rates.
 */
const SCENE_2_RING_BODY = `
var uMatR = input(0.6235294117647059, 0, 1);
var uMatG = input(0.9411764705882353, 0, 1);
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

var ringOuter = 0.29;
var ringInner = 0.275;
var slabGap = mult(0.05, mult(2.0, ringOuter));
var cutHalfX = 0.42;
var cutHalfY = 0.42;
var cutHalfZ = 0.42;
var blueCenterX = add(slabGap, cutHalfX);
var greenCenterX = mult(-1.0, add(slabGap, cutHalfX));

var yellowR = 1.0;
var yellowG = 0.92;
var yellowB = 0.08;

var breatheA = nsin(mult(0.85, time));
var breatheB = nsin(mult(1.35, add(time, 1.2)));
var overlap = mult(breatheA, breatheB);
var mergeK = add(0.05, mult(0.22, overlap));

var s2ProgRotScale = 0.6;
var s2MouseInfluence = 4.0;
var s2Msx = mult(s2MouseInfluence, mouse.x);
var s2Msy = mult(s2MouseInfluence, mouse.y);

shape(function() {
  displace(uPosX, uPosY, uPosZ);
  shape(function() {
    rotateX(add(add(add(mult(mult(s2ProgRotScale, 1.48), time), 0.89), mult(mult(s2ProgRotScale, 0.96), nsin(mult(0.53, time)))), s2Msy));
    rotateY(add(add(add(mult(mult(s2ProgRotScale, -2.12), time), 2.17), mult(mult(s2ProgRotScale, 1.24), nsin(mult(0.41, add(time, 1.83))))), mult(-1.0, s2Msx)));
    rotateZ(add(add(add(mult(mult(s2ProgRotScale, 1.16), time), 4.03), mult(mult(s2ProgRotScale, 0.8), nsin(mult(0.67, add(time, 2.51))))), add(mult(0.55, s2Msx), mult(0.55, s2Msy))));
${SCENE_2_SHELL_CSG}
  })();
  blend(mergeK);
  shape(function() {
    rotateY(mult(0.5, PI));
    rotateX(add(add(add(mult(mult(s2ProgRotScale, 2.44), time), 3.41), mult(mult(s2ProgRotScale, 1.08), nsin(mult(0.48, add(time, 0.7))))), s2Msy));
    rotateY(add(add(add(mult(mult(s2ProgRotScale, 1.76), time), 1.05), mult(mult(s2ProgRotScale, 0.88), nsin(mult(0.71, add(time, 4.2))))), mult(-1.0, s2Msx)));
    rotateZ(add(add(add(mult(mult(s2ProgRotScale, -1.24), time), 5.22), mult(mult(s2ProgRotScale, 1.32), nsin(mult(0.39, add(time, 1.1))))), add(mult(0.55, s2Msx), mult(0.55, s2Msy))));
${SCENE_2_SHELL_CSG}
  })();
  blend(mergeK);
  shape(function() {
    rotateZ(mult(0.5, PI));
    rotateX(add(add(add(mult(mult(s2ProgRotScale, -1.64), time), 5.67), mult(mult(s2ProgRotScale, 1.04), nsin(mult(0.56, add(time, 3.3))))), s2Msy));
    rotateY(add(add(add(mult(mult(s2ProgRotScale, 2.32), time), 3.88), mult(mult(s2ProgRotScale, 0.76), nsin(mult(0.62, add(time, 5.1))))), mult(-1.0, s2Msx)));
    rotateZ(add(add(add(mult(mult(s2ProgRotScale, 1.88), time), 0.31), mult(mult(s2ProgRotScale, 1.16), nsin(mult(0.44, add(time, 2.7))))), add(mult(0.55, s2Msx), mult(0.55, s2Msy))));
${SCENE_2_SHELL_CSG}
  })();
})();
`.trim()

/** Scene 3 — literal original phase-palette slab snippet. */
const SCENE_3_BODY = `
let s = getSpace();
const sz = 0.5 + nsin(time) * 0.2;

const complexDiv = (a, b) => {
  const dm = 1.0 / (b.x * b.x + b.y * b.y);
  return dm * vec2(
    a.x * b.x + a.y * b.y,
    a.y * b.x - a.x * b.y
  );
};

function palette(t, a, b, c, d) {
  return a + b * cos(c * t + d);
}

const lineCount = 9.0;
const spacing = 0.22;
const strength = 2;

let phi = 0.0;
for (let i = 0.0; i < lineCount; i += 1.0) {
  const xoff = (i - (lineCount - 1.0) * 0.5) * spacing;

  const a = vec2(s.x - xoff, s.y - sz);
  const b = vec2(s.x - xoff, s.y + sz);
  const q = complexDiv(a, b);

  phi += strength * atan(q.y, q.x) + 0.35 * i * sin(time * 0.9);
}

phi = phi / lineCount;

const angle = sin(time * 0.84) * phi + 3.0 * sin(time);

const v = palette(
  angle,
  vec3(0.50, 0.52, 0.53),
  vec3(0.46, 0.22, 0.35),
  vec3(0.82, 0.84, 0.65),
  vec3(0.53, 0.23, 0.22)
);

color(v);
box(vec3(5.0, 5.0, 0.01));
`.trim()

/** Scene 4 — same palette stack as scene 3, but φ stacks four concentric rings (not vertical slits). */
const SCENE_4_BODY = `
let s = getSpace();
const tm = time * 0.5;
var uS4Pal0R = input(0.50, 0, 1);
var uS4Pal0G = input(0.52, 0, 1);
var uS4Pal0B = input(0.53, 0, 1);
var uS4Pal1R = input(0.46, 0, 1);
var uS4Pal1G = input(0.22, 0, 1);
var uS4Pal1B = input(0.35, 0, 1);
var uS4Pal2R = input(0.82, 0, 1);
var uS4Pal2G = input(0.84, 0, 1);
var uS4Pal2B = input(0.65, 0, 1);
var uS4Pal3R = input(0.53, 0, 1);
var uS4Pal3G = input(0.23, 0, 1);
var uS4Pal3B = input(0.22, 0, 1);
const mx = mouse.x * 0.95;
const my = mouse.y * 0.75;
const mm = sqrt(mx * mx + my * my);
const sz = 0.5 + nsin(tm + mx * 0.8 + my * 0.8) * (0.08 + mm * 0.18);

const complexDiv = (a, b) => {
  const dm = 1.0 / (b.x * b.x + b.y * b.y);
  return dm * vec2(
    a.x * b.x + a.y * b.y,
    a.y * b.x - a.x * b.y
  );
};

function palette(t, a, b, c, d) {
  return a + b * cos(c * t + d);
}

const ringCount = 4.0;
const ringSpacing = 0.55;
const ringStart = 0.35;
const strength = 2;

const r = sqrt(s.x * s.x + s.y * s.y);

let phi = 0.0;
for (let i = 0.0; i < ringCount; i += 1.0) {
  const ri = ringStart + i * ringSpacing;
  const dr = r - ri;

  const a = vec2(dr, s.y - sz);
  const b = vec2(dr, s.y + sz);
  const q = complexDiv(a, b);

  phi += strength * atan(q.y, q.x) + 0.35 * i * sin(tm * 0.9);
}

phi = phi / ringCount;

const angle =
  sin(tm * 0.84) * phi +
  3.0 * sin(tm) +
  mx * 0.55 +
  my * 0.42;

const v = palette(
  angle,
  vec3(uS4Pal0R, uS4Pal0G, uS4Pal0B),
  vec3(uS4Pal1R, uS4Pal1G, uS4Pal1B),
  vec3(uS4Pal2R, uS4Pal2G, uS4Pal2B),
  vec3(uS4Pal3R, uS4Pal3G, uS4Pal3B)
);

lightDirection(0.42 + mx * 0.22, 0.52 + my * 0.2, 0.5);
fresnel(0.12 + abs(mx) * 0.16 + abs(my) * 0.14);
metal(0.1);
shine(0.42);
color(v);
box(vec3(5.0, 5.0, 0.01));
`.trim()

export type BackgroundSculptRaymarchOpts = {
  geometryQuality: number
  maxIterations: number
  /** Omit to use Shader Park default step size. */
  stepSize?: number
}

export function buildBackgroundSculptSource(opts: BackgroundSculptRaymarchOpts): string {
  const stepLine =
    opts.stepSize != null && opts.stepSize > 0
      ? `setStepSize(${opts.stepSize});`
      : ''
  return `
setGeometryQuality(${opts.geometryQuality});
setMaxIterations(${opts.maxIterations});
${stepLine}
${SCENE_1_BODY}
`.trim()
}

export function buildScene2CircleSculptSource(opts: BackgroundSculptRaymarchOpts): string {
  const stepLine =
    opts.stepSize != null && opts.stepSize > 0
      ? `setStepSize(${opts.stepSize});`
      : ''
  return `
setGeometryQuality(${opts.geometryQuality});
setMaxIterations(${opts.maxIterations});
${stepLine}
${SCENE_2_RING_BODY}
`.trim()
}

export function buildScene3PaletteSculptSource(opts: BackgroundSculptRaymarchOpts): string {
  const stepLine =
    opts.stepSize != null && opts.stepSize > 0
      ? `setStepSize(${opts.stepSize});`
      : ''
  return `
setGeometryQuality(${opts.geometryQuality});
setMaxIterations(${opts.maxIterations});
${stepLine}
${SCENE_3_BODY}
`.trim()
}

export function buildScene4PaletteSculptSource(opts: BackgroundSculptRaymarchOpts): string {
  const stepLine =
    opts.stepSize != null && opts.stepSize > 0
      ? `setStepSize(${opts.stepSize});`
      : ''
  return `
setGeometryQuality(${opts.geometryQuality});
setMaxIterations(${opts.maxIterations});
${stepLine}
${SCENE_4_BODY}
`.trim()
}

/**
 * Raymarch cost tiers (Shader Park `setGeometryQuality` / `setMaxIterations` / `setStepSize`).
 * **Low** is aggressive for GPU/battery; **high** is the previous flagship defaults (88 / 420 / 0.85).
 */
export const SCULPT_RAYMARCH_PRESETS = {
  /** Extreme budget tier — expect banding, softer edges, possible holes in tight CSG. */
  low: { geometryQuality: 12, maxIterations: 48, stepSize: 0.993 },
  balanced: { geometryQuality: 48, maxIterations: 248, stepSize: 0.9 },
  high: { geometryQuality: 88, maxIterations: 420, stepSize: 0.85 },
} as const satisfies Record<string, BackgroundSculptRaymarchOpts>

export type SculptRaymarchPresetId = keyof typeof SCULPT_RAYMARCH_PRESETS

/** Default sculpt string for fallbacks (e.g. ShaderParkBackground): scene 1, low tier. */
export const backgroundSculptSource = buildBackgroundSculptSource(SCULPT_RAYMARCH_PRESETS.low)
