import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { SculptControlPanel } from '@/components/SculptControlPanel'
import { SculptControlsProvider } from '@/context/sculpt-controls-context'
import { EmbedPage } from '@/pages/EmbedPage'
import { HomePage } from '@/pages/HomePage'

const AppShaderDock = lazy(() => import('@/components/AppShaderDock'))

function App() {
  const isEmbed = useLocation().pathname === '/embed'

  return (
    <>
      {!isEmbed && (
        <SculptControlsProvider>
          <Suspense fallback={null}>
            <AppShaderDock />
          </Suspense>
          <SculptControlPanel />
        </SculptControlsProvider>
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/embed" element={<EmbedPage />} />
      </Routes>
    </>
  )
}

export default App
