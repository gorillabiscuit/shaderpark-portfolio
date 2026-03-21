import path from 'node:path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
      'shader-park-core': path.resolve(
        process.cwd(),
        'node_modules/shader-park-core/dist/shader-park-core.esm.js',
      ),
    },
  },
})
