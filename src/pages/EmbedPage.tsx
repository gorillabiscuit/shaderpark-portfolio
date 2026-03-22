import { lazy, Suspense } from 'react'
import { sculptSourceForScene } from '@/lib/shaderParkRenderSettings'

const embedSculptSource = sculptSourceForScene(1)

const ShaderParkBackground = lazy(() =>
  import('@/components/ShaderParkBackground').then((m) => ({ default: m.ShaderParkBackground })),
)

/**
 * Minimal page for iframe embeds: light background matches a typical portfolio hero.
 * Use when embedding this app in another site so `window` size = iframe size (correct GL resolution).
 */
export function EmbedPage() {
  return (
    <div className="fixed inset-0 bg-[#f4f4f2]">
      <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-neutral-200/80" aria-hidden />}>
        <ShaderParkBackground variant="inline" sculptSource={embedSculptSource} />
      </Suspense>
    </div>
  )
}
