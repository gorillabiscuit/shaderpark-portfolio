import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import './index.css'
import App from './App.tsx'

// StrictMode omitted: shader-park-core minimal renderer has no public dispose; see .cursor/rules/shader-park.mdc

createRoot(document.getElementById('root')!).render(
  <QueryProvider>
    <ThemeProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  </QueryProvider>,
)
