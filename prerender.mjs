/**
 * Post-build prerender for static hosting (S3 + CloudFront).
 * Uses @prerenderer/prerenderer + Puppeteer. WebGL (Shader Park) may not match
 * runtime output; HTML shell + meta still benefits crawlers.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Prerenderer from '@prerenderer/prerenderer'
import Renderer from '@prerenderer/renderer-puppeteer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.resolve(__dirname, 'dist')
const routes = ['/', '/embed']

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/index.html missing — run `npm run build` first.')
  process.exit(1)
}

const prerenderer = new Prerenderer({
  staticDir: dist,
  renderer: new Renderer({
    headless: true,
    renderAfterTime: 800,
  }),
})

await prerenderer.initialize()

try {
  const rendered = await prerenderer.renderRoutes(routes)
  for (const { route, html } of rendered) {
    const outDir = route === '/' ? dist : path.join(dist, route.replace(/^\//, ''))
    fs.mkdirSync(outDir, { recursive: true })
    const file = path.join(outDir, 'index.html')
    fs.writeFileSync(file, html.trim(), 'utf8')
    console.log('wrote', path.relative(__dirname, file))
  }
} finally {
  await prerenderer.destroy()
}
