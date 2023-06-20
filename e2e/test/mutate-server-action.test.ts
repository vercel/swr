/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test'

test.skip('mutate-server-action', async ({ page }) => {
  await page.goto('./mutate-server-action')
  await page.getByRole('button', { name: 'mutate' }).click()
  await expect(page.getByText('isMutating: true')).toBeVisible()
  await expect(page.getByText('data: ')).toBeVisible()
  await page.waitForTimeout(500)
  await expect(page.getByText('isMutating: false')).toBeVisible()
  await expect(page.getByText('data: 10086')).toBeVisible()
})
