import { test, expect } from '@playwright/test'

const warningForKey = (key: string) =>
  `Missing pre-initiated data for serialized key "${key}" during server-side rendering. Data fethcing should be initiated on the server and provided to SWR via fallback data. You can set "strictServerPrefetchWarning: false" to disable this warning.`

test.describe('strictServerPrefetchWarning', () => {
  test('warns on hydration when data is missing', async ({ page }) => {
    const warnings: string[] = []

    page.on('console', msg => {
      if (msg.type() !== 'warning') return
      const text = msg.text()
      if (text.includes('Missing pre-initiated data')) {
        warnings.push(text)
      }
    })

    await page.goto('./server-prefetch-warning', { waitUntil: 'commit' })
    await expect(page.getByTestId('hydration-state')).toHaveText('hydrated')

    await expect.poll(() => warnings.length).toBe(2)
    expect(warnings).toEqual(
      expect.arrayContaining([warningForKey('ssr:1'), warningForKey('ssr:2')])
    )
    expect(warnings).toHaveLength(2)
  })
})
