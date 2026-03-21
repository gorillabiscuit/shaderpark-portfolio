import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import App from './App'

vi.mock('@/components/ShaderParkBackground', () => ({
  ShaderParkBackground: () => null,
}))

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
      </ThemeProvider>
    </QueryProvider>
  )
}

describe('App', () => {
  it('renders', () => {
    const { asFragment } = render(<App />, { wrapper: AllProviders })
    expect(asFragment().childNodes.length).toBeGreaterThan(0)
  })
})
