# Handoff: integrate this Shader Park background into another site

Use this as a prompt for another Cursor session or developer.

---

**Task:** Integrate a Shader Park WebGL2 background from this repo into the target codebase’s main marketing/portfolio layout.

**Clone (SSH):**

```bash
git clone git@github.com:gorillabiscuit/shaderpark-portfolio.git
```

HTTPS (if needed): `https://github.com/gorillabiscuit/shaderpark-portfolio.git`

**What to port (minimal):**

1. **Dependency:** `shader-park-core` (match version from this repo’s `package.json`, or use `^0.2.8`).
2. **Files to copy or merge:**
   - `src/shader-park/backgroundSculpt.ts` — sculpture DSL string.
   - `src/lib/shaderParkGlobalMouse.ts` — patches canvas `addEventListener` so `pointermove` uses **window** + synthetic `pageX`/`pageY` for full-viewport mouse; includes exponential smoothing.
   - `src/components/ShaderParkBackground.tsx` — mounts canvas, calls `installGlobalMouseForShaderParkCanvas(canvas)` **before** `sculptToMinimalRenderer`, uses `pointer-events-none` on the canvas so clicks pass through to UI.
   - `src/types/shader-park-core.d.ts` — if TypeScript complains about the package.
3. **Usage:** Render `ShaderParkBackground` as a **fixed fullscreen layer behind** the existing page (e.g. `z-index` below header/content). On routes that must not show it (e.g. embed-only or heavy admin), skip rendering it.
4. **Constraints:** Do not break existing routing, SEO, or accessibility. Ensure focusable controls stay usable (canvas stays non-interactive; only global pointer drives uniforms).

**Reference implementation:** See `src/App.tsx` in this repo for how the background is gated by route (`/embed` vs `/`).

**Verify:** Build passes; pointer movement visibly affects the sculpt when moving anywhere on the viewport; buttons/links above the canvas still work.
