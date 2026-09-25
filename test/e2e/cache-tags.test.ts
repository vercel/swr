import { expect, test } from '@playwright/test'

test('revalidates every cache key associated with a tag', async ({ page }) => {
  await page.goto('./cache-tags', { waitUntil: 'networkidle' })

  await expect(page.getByTestId('projects')).toHaveText('/api/projects:0')
  await expect(page.getByTestId('favorites')).toHaveText(
    '/api/projects?favorites=1:0'
  )
  await expect(page.getByTestId('unrelated')).toHaveText('/api/profile:0')

  await page.getByRole('button', { name: 'Invalidate projects' }).click()

  await expect(page.getByTestId('projects')).toHaveText('/api/projects:1')
  await expect(page.getByTestId('favorites')).toHaveText(
    '/api/projects?favorites=1:1'
  )
  await expect(page.getByTestId('unrelated')).toHaveText('/api/profile:0')
})
