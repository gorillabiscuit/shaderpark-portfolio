import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { EmbedPage } from '@/pages/EmbedPage'
import { HomePage } from '@/pages/HomePage'

const ShaderParkBackground = lazy(() =>
  import('@/components/ShaderParkBackground').then((m) => ({ default: m.ShaderParkBackground })),
)

function App() {
  const isEmbed = useLocation().pathname === '/embed'

  return (
    <>
      {!isEmbed && (
        <Suspense fallback={null}>
          <ShaderParkBackground variant="fullscreen" />
        </Suspense>
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/embed" element={<EmbedPage />} />
      </Routes>
    </>
  )
}

export default App
