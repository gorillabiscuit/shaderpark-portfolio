import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
      'shader-park-core': path.resolve(
        'node_modules/shader-park-core/dist/shader-park-core.esm.js',
      ),
    },
  },
})
