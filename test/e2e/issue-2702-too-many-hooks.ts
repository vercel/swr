import { test, expect } from '@playwright/test'

test.describe('issue 2702', () => {
  test('should not crash with too many hooks', async ({ page }) => {
    // Navigate to the test page
    await page.goto('./issue-2702', { waitUntil: 'networkidle' })

    // Wait for the page to be fully loaded and interactive
    await expect(page.getByText('fetching')).toBeVisible()

    // Verify that the component renders correctly
    await expect(page.getByText('a,b')).toBeVisible()
  })
})
