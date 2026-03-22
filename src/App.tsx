import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { SculptControlPanel } from '@/components/SculptControlPanel'
import { SculptControlsProvider } from '@/context/sculpt-controls-context'
import { isAppMainShaderRoute } from '@/lib/shaderParkAppRoutes'
import { EmbedPage } from '@/pages/EmbedPage'
import { HomePage } from '@/pages/HomePage'

const AppShaderDock = lazy(() => import('@/components/AppShaderDock'))

function App() {
  const { pathname } = useLocation()
  const isEmbed = pathname === '/embed'
  /** Home only: keeps `lazy(() => import('@/components/AppShaderDock'))` off content routes. */
  const showMainShader = !isEmbed && isAppMainShaderRoute(pathname)

  return (
    <>
      {!isEmbed ? (
        <SculptControlsProvider>
          {showMainShader ? (
            <>
              <Suspense fallback={null}>
                <AppShaderDock />
              </Suspense>
              <SculptControlPanel />
            </>
          ) : null}
        </SculptControlsProvider>
      ) : null}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/embed" element={<EmbedPage />} />
      </Routes>
    </>
  )
}

export default App
