import { expect, test } from '@playwright/test'

test.describe('suspense infinite get key', () => {
  test('updates the data when key changes under suspense', async ({ page }) => {
    await page.goto('./suspense-infinite/get-key', { waitUntil: 'commit' })

    await expect(page.getByTestId('data')).toHaveText('data: A1,A2,A3')

    await page.getByRole('button', { name: 'mutate' }).click()

    await expect(page.getByTestId('data')).toHaveText('data: B1,B2,B3')
  })
})
