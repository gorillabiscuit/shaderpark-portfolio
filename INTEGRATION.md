# Shader Park minimal renderer — integration guide (for another Cursor / developer)

Copy everything below the line into a new chat, or use this file as the single source of truth when merging into another app (e.g. a Next.js / portfolio site).

---

## Role

You are integrating **shader-park-core**’s **`sculptToMinimalRenderer`** (WebGL2 **minimal** pipeline), **not** the Three.js `createSculpture` path used on [shaderpark.com](https://shaderpark.com). The APIs and resize behavior are different. Follow this document literally to avoid: (1) mouse only working over a small canvas, (2) a white “card” around the shader, (3) **aspect-ratio distortion** when resizing.

## Reference repo (copy from here)

**SSH clone:**

```bash
git clone git@github.com:gorillabiscuit/shaderpark-portfolio.git
cd shaderpark-portfolio
```

**Files you must understand and likely copy:**

| File | Purpose |
|------|---------|
| `src/lib/shaderParkGlobalMouse.ts` | Makes `mouse` react to the **whole browser viewport**, not only the canvas. |
| `src/components/ShaderParkBackground.tsx` | Correct **hook order**, canvas classes, `sculptToMinimalRenderer` call. |
| `src/shader-park/backgroundSculpt.ts` | The sculpture DSL string (tweak **radii / `_scale` in DSL** to make the form larger—see below). |
| `src/types/shader-park-core.d.ts` | TypeScript shims if the package has no types. |
| `src/App.tsx` | Example: background **sibling** to routes, lazy-loaded, optional route gating. |

**Dependency:** `shader-park-core` (this repo uses `^0.2.8`).

---

## Critical fact: why the sculpture “distorts” when put in a layout box

In `shader-park-core`’s minimal renderer (v0.2.8), **`resizeCanvas` sets the drawing buffer to the full window**:

- `canvas.width = window.innerWidth * devicePixelRatio`
- `canvas.height = window.innerHeight * devicePixelRatio`

The fragment shader’s **`resolution` uniform is also driven from `window.innerWidth/innerHeight`**, not from a small parent div.

So the GPU always renders a **viewport-shaped** image. If your **CSS** forces the `<canvas>` into a **tall narrow column** or any rectangle whose **aspect ratio ≠ the window**, the browser **stretches** that image to fit the box → **oval / squashed sculpture**. This is **not** fixable by “just changing width/height in CSS” without either:

1. **Recommended:** A **full-viewport** canvas (`position: fixed; inset: 0; width: 100%; height: 100%`) behind the layout, with **no** white wrapper—content sits on top with transparent areas where needed, **or**
2. **Alternative:** An **`<iframe>`** whose size is the desired aspect; load an `/embed` route that only contains the canvas so `window` matches the iframe (this repo’s pattern for “sharp GL in a column”), **or**
3. **Heavy:** Fork/patch `shader-park-core` so buffer size and `resolution` follow the canvas element instead of `window` (out of scope for most integrations).

**Do not** fix “small sculpture” by shrinking the canvas element in CSS while leaving the default minimal renderer—buffer is still full window; you only scale the quad and distort.

To make the **object larger in the frame**, change the **sculpt** (SDF radii, or any `_scale` usage in the DSL), not the canvas CSS box.

---

## Critical fact: mouse only works in the white box by default

`sculptToMinimalRenderer` registers:

```js
canvas.addEventListener("pointermove", (e) => {
  const canvasX = (e.pageX - canvas.offsetLeft) * devicePixelRatio;
  const canvasY = (e.pageY - canvas.offsetTop) * devicePixelRatio;
  gl.uniform3f(mouse, 2 * canvasX / canvas.width - 1, 2 * (1 - canvasY / canvas.height) - 1, -0.5);
});
```

So **`mouse` only updates when the pointer is over the canvas** (and events reach it). If the canvas is a small region, interaction is limited to that region.

**Fix:** Use **`installGlobalMouseForShaderParkCanvas(canvas)`** from `shaderParkGlobalMouse.ts`. It **temporarily monkey-patches** `canvas.addEventListener` so that when the library attaches `pointermove`, we instead attach a listener to **`window`**, compute NDC from **`window.innerWidth` / `innerHeight`**, then synthesize **`pageX` / `pageY`** so the library’s math produces the same NDC as if the cursor were mapped across the full viewport.

**Mandatory hook order (if this is wrong, global mouse silently fails):**

```ts
const uninstallGlobal = installGlobalMouseForShaderParkCanvas(canvas)
sculptToMinimalRenderer(canvas, sourceString)
// cleanup: uninstallGlobal() in useEffect return
```

The patch must be installed **before** `sculptToMinimalRenderer` runs, because the library registers `pointermove` during that call.

**Canvas hit-testing:** Keep **`pointer-events: none`** on the canvas so links, buttons, and nav stay clickable; only the **synthetic** pointer path updates uniforms.

---

## Layout checklist (portfolio / marketing site)

1. **One full-viewport canvas** behind everything: e.g. `fixed inset-0 -z-10` (or equivalent), `width/height 100%`, **no** parent with `background: white` clipping the “stage” unless you intend a mask.
2. **Remove the white card:** The gray page background should come from **`body` / main layout CSS**, not from a wrapper `div` around the canvas. The canvas is not a “component card”; it’s a **layer**.
3. **Z-index:** Content sections > canvas. Example: canvas `z-index: -1` or `0` with content at `z-index: 1` with `position: relative`.
4. **Transparency expectations:** The minimal renderer uses an internal `clearColor` close to **white with high alpha** (library default). You may still see a light fog; the **big** white rectangle in screenshots is almost always **HTML layout**, not GL. True glassy transparency usually means **Three.js + alpha** or patching the library—don’t hack random `opacity` on the canvas expecting the raymarch to become invisible.

---

## React integration shape

- Render **`<ShaderParkBackground />` (or equivalent) as a sibling** to your main layout/router outlet—**not** nested inside a single column grid cell next to text, unless you use the **iframe** approach.
- Match this repo: optional **lazy** `import()` + `Suspense` so the main bundle stays small.
- Gate routes: e.g. skip the background on `/embed` or admin pages.

---

## If you truly need the sculpt only in one column

Do **not** rely on a partial-width canvas with the stock minimal renderer without accepting distortion or implementing iframe/patch.

**Practical pattern:** Fullscreen fixed canvas site-wide **or** `<iframe src="/embed" className="w-full h-[min(420px,50vh)] border-0" />` where `/embed` is a minimal page that only mounts the canvas (then `window` = iframe size and mouse mapping is consistent).

---

## Verification checklist

- [ ] Moving the mouse **over the header, hero text, or nav** (not only over the WebGL area) still **drives** the sculpture.
- [ ] **No** aspect distortion: resize the browser window; circles in the sculpt stay **round** (not elliptical).
- [ ] Clicks on “Let’s talk”, nav links, and focusable controls **work** (canvas has `pointer-events: none`).
- [ ] `installGlobalMouseForShaderParkCanvas` runs **before** `sculptToMinimalRenderer`.
- [ ] No unnecessary **white** wrapper `div` around the canvas; page background color is intentional on `body`/layout.

---

## Task for this session

Integrate the Shader Park minimal background into **[TARGET FRAMEWORK / REPO]** using the rules above. Port or merge the four files listed in “Reference repo”. Place the canvas as a **fixed full-viewport layer** behind existing content; wire **global mouse** with the correct order; **do not** fix scale by changing canvas CSS to a small box—adjust **`backgroundSculpt.ts`** radii if the form is too small. If the design demands a strict split layout with GL only on the right, use a **fullscreen canvas** with content layout on top **or** an **iframe embed**—never a squashed partial canvas with the stock renderer.

---

_End of handoff prompt._
