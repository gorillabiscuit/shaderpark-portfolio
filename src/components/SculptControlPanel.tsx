import { Copy, Moon, Pause, Play, SlidersHorizontal, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import type { BackgroundAppearanceMode } from '@/config/backgroundTheme'
import {
  sculptBreakpointLabel,
  useSculptControls,
} from '@/context/sculpt-controls-context'
import { buildSculptClipboardPayload, hexToRgb01 } from '@/lib/sculptControls'
import {
  activeViewportBreakpoint,
  VIEWPORT_BREAKPOINT_ORDER,
} from '@/lib/viewportBreakpoint'

function rgb01ToHex(r: number, g: number, b: number): string {
  const to = (x: number) =>
    Math.max(0, Math.min(255, Math.round(x * 255)))
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

function RangeRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        <span className="tabular-nums text-xs text-muted-foreground">{value.toFixed(3)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-primary"
      />
    </div>
  )
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-input bg-background p-0.5"
        />
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
      </div>
    </div>
  )
}

export function SculptControlPanel() {
  const { setTheme } = useTheme()
  const {
    backgroundAppearanceMode,
    perBreakpoint,
    panelsByTheme,
    editBreakpoint,
    setEditBreakpoint,
    liveBreakpoint,
    patchEditSlice,
    patchBreakpointSliceForTheme,
    resetEditSlice,
    sculptPanelOpen,
    setSculptPanelOpen,
    timePaused,
    setTimePaused,
  } = useSculptControls()

  const copySettingsJson = () => {
    const payload = buildSculptClipboardPayload(perBreakpoint, editBreakpoint)
    const text = JSON.stringify(payload, null, 2)
    void navigator.clipboard.writeText(text).then(
      () =>
        toast.success('Copied sculpt settings', {
          description: `Appearance from “${editBreakpoint}”; transforms for all breakpoints.`,
        }),
      () => toast.error('Could not copy to clipboard'),
    )
  }

  const slice = perBreakpoint[editBreakpoint]

  const matHex = rgb01ToHex(slice.uMatR, slice.uMatG, slice.uMatB)

  const setBgForTheme = (mode: BackgroundAppearanceMode, hex: string) => {
    patchBreakpointSliceForTheme(mode, editBreakpoint, { bgColor: hex })
  }

  return (
    <Drawer
      direction="right"
      open={sculptPanelOpen}
      onOpenChange={(next) => {
        setSculptPanelOpen(next)
        if (next) setEditBreakpoint(activeViewportBreakpoint(window.innerWidth))
      }}
      shouldScaleBackground={false}
      setBackgroundColorOnScale={false}
      modal={false}
    >
      <div
        data-vaul-no-drag
        className="fixed bottom-4 right-4 z-50 flex flex-row-reverse gap-2 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8"
      >
        <DrawerTrigger asChild>
          <Button type="button" size="sm" variant="secondary" className="shadow-md">
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">Sculpt</span>
          </Button>
        </DrawerTrigger>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="shadow-md"
          aria-label={timePaused ? 'Resume animation' : 'Pause animation'}
          onClick={() => setTimePaused((p) => !p)}
        >
          {timePaused ? <Play className="size-4" /> : <Pause className="size-4" />}
          <span className="hidden sm:inline">{timePaused ? 'Play' : 'Pause'}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="shadow-md"
          aria-label={
            backgroundAppearanceMode === 'light'
              ? 'Switch to dark theme'
              : 'Switch to light theme'
          }
          onClick={() => setTheme(backgroundAppearanceMode === 'light' ? 'dark' : 'light')}
        >
          {backgroundAppearanceMode === 'light' ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
          <span className="hidden sm:inline">
            {backgroundAppearanceMode === 'light' ? 'Dark' : 'Light'}
          </span>
        </Button>
      </div>
      <DrawerContent side="right" className="gap-0 p-0">
        <div data-vaul-no-drag className="flex h-full min-h-0 flex-1 flex-col">
        <DrawerHeader className="shrink-0 border-b border-border px-4 py-4 text-left sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <DrawerTitle>Sculpt &amp; background</DrawerTitle>
              <DrawerDescription className="text-left">
                Material sliders use the active site theme (
                <span className="font-medium text-foreground">{backgroundAppearanceMode}</span>
                ); background colors below can be set for both dark and light. The canvas uses the
                preset for your current viewport:{' '}
                <span className="font-medium text-foreground">{liveBreakpoint}</span>{' '}
                ({sculptBreakpointLabel(liveBreakpoint)}).
                {editBreakpoint !== liveBreakpoint && sculptPanelOpen ? (
                  <span className="mt-1 block text-amber-600 dark:text-amber-400">
                    You are editing {editBreakpoint} — changes apply when the viewport matches that
                    tier.
                  </span>
                ) : null}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label="Close panel"
              >
                <X className="size-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <div className="mb-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Edit preset for
            </p>
            <div className="flex flex-wrap gap-1.5">
              {VIEWPORT_BREAKPOINT_ORDER.map((id) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={editBreakpoint === id ? 'default' : 'outline'}
                  className="text-xs"
                  onClick={() => setEditBreakpoint(id)}
                >
                  {id}
                  <span className="ml-1 hidden text-[0.65rem] opacity-70 lg:inline">
                    {sculptBreakpointLabel(id)}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <section className="grid gap-4">
              <h3 className="text-sm font-semibold">Material &amp; color</h3>
              <ColorRow
                label="Surface color"
                value={matHex}
                onChange={(hex) => {
                  const { r, g, b } = hexToRgb01(hex)
                  patchEditSlice({ uMatR: r, uMatG: g, uMatB: b })
                }}
              />
              <RangeRow
                label="Metal (global)"
                min={0}
                max={1}
                step={0.01}
                value={slice.uMetal}
                onChange={(uMetal) => patchEditSlice({ uMetal })}
              />
              <RangeRow
                label="Shine"
                min={0}
                max={1}
                step={0.01}
                value={slice.uShine}
                onChange={(uShine) => patchEditSlice({ uShine })}
              />
              <RangeRow
                label="Metal (ball)"
                min={0}
                max={1}
                step={0.01}
                value={slice.uBallMetal}
                onChange={(uBallMetal) => patchEditSlice({ uBallMetal })}
              />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Grade (HSV / contrast / rim)
              </h4>
              <RangeRow
                label="Hue shift"
                min={-1}
                max={1}
                step={0.005}
                value={slice.uHueShift}
                onChange={(uHueShift) => patchEditSlice({ uHueShift })}
              />
              <RangeRow
                label="Saturation"
                min={0}
                max={2}
                step={0.01}
                value={slice.uSat}
                onChange={(uSat) => patchEditSlice({ uSat })}
              />
              <RangeRow
                label="Brightness (value)"
                min={0}
                max={2}
                step={0.01}
                value={slice.uValue}
                onChange={(uValue) => patchEditSlice({ uValue })}
              />
              <RangeRow
                label="Contrast"
                min={0.35}
                max={2.2}
                step={0.01}
                value={slice.uContrast}
                onChange={(uContrast) => patchEditSlice({ uContrast })}
              />
              <RangeRow
                label="Ambient lift"
                min={0}
                max={0.35}
                step={0.005}
                value={slice.uAmbient}
                onChange={(uAmbient) => patchEditSlice({ uAmbient })}
              />
              <RangeRow
                label="Rim (fresnel)"
                min={0}
                max={1}
                step={0.01}
                value={slice.uRim}
                onChange={(uRim) => patchEditSlice({ uRim })}
              />
            </section>

            <section className="grid gap-4">
              <h3 className="text-sm font-semibold">Transform</h3>
              <RangeRow
                label="Scale"
                min={0.25}
                max={2.5}
                step={0.01}
                value={slice._scale}
                onChange={(_scale) => patchEditSlice({ _scale })}
              />
              <RangeRow
                label="Position X"
                min={-0.85}
                max={0.85}
                step={0.005}
                value={slice.uPosX}
                onChange={(uPosX) => patchEditSlice({ uPosX })}
              />
              <RangeRow
                label="Position Y"
                min={-0.85}
                max={0.85}
                step={0.005}
                value={slice.uPosY}
                onChange={(uPosY) => patchEditSlice({ uPosY })}
              />
              <RangeRow
                label="Position Z"
                min={-0.85}
                max={0.85}
                step={0.005}
                value={slice.uPosZ}
                onChange={(uPosZ) => patchEditSlice({ uPosZ })}
              />
            </section>

            <section className="grid gap-4 lg:col-span-2">
              <h3 className="text-sm font-semibold">Background</h3>
              <p className="text-xs text-muted-foreground">
                Per breakpoint tab above: each color drives WebGL clear (ray misses) and the CSS
                plate for that appearance. With the panel open, clear color previews the active
                theme’s preset for the tab you are editing.
              </p>
              <ColorRow
                label="Color (dark mode)"
                value={panelsByTheme.dark[editBreakpoint].bgColor}
                onChange={(hex) => setBgForTheme('dark', hex)}
              />
              <ColorRow
                label="Color (light mode)"
                value={panelsByTheme.light[editBreakpoint].bgColor}
                onChange={(hex) => setBgForTheme('light', hex)}
              />
            </section>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border px-4 py-3 sm:px-5">
          <Button type="button" variant="secondary" size="sm" onClick={copySettingsJson}>
            <Copy className="size-4" />
            Copy settings
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={resetEditSlice}>
            Reset {editBreakpoint} to defaults
          </Button>
        </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
