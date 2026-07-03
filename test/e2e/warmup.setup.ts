import { test as setup } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// In dev mode routes are compiled on demand, which makes the first visit to
// each page slow enough to break tests that assert transient states (suspense
// fallbacks, pre-hydration UI). Request every route once so the tests run
// against already-compiled pages with production-like timing.

const siteDir = path.join(__dirname, 'site')

function collectAppRoutes(dir: string, prefix = ''): string[] {
  const routes: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const route = `${prefix}/${entry.name}`
    const child = path.join(dir, entry.name)
    if (fs.existsSync(path.join(child, 'page.tsx'))) {
      routes.push(route)
    }
    routes.push(...collectAppRoutes(child, route))
  }
  return routes
}

function collectPageRoutes(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.tsx') && !f.startsWith('_'))
    .map(f => `/${f.replace(/\.tsx$/, '')}`)
}

setup('warm up the dev server', async ({ request }) => {
  setup.setTimeout(180 * 1000)
  const routes = [
    '/',
    ...collectAppRoutes(path.join(siteDir, 'app')),
    ...collectPageRoutes(path.join(siteDir, 'pages'))
  ]
  await Promise.all(routes.map(route => request.get(route)))
})
