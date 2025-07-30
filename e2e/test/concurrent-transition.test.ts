/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test'

test.describe('concurrent rendering transitions', () => {
  test('should pause when changing the key inside a transition', async ({
    page
  }) => {
    // Navigate to the test page
    await page.goto('./concurrent-transition', { waitUntil: 'networkidle' })

    // Wait for page to be fully loaded and interactive
    await expect(page.getByTestId('pending-state')).toContainText('isPending:0')

    // Wait for initial data to load
    await expect(page.getByTestId('data-content')).toContainText(
      'data:initial-key'
    )

    // Ensure the component is in a stable state before triggering transition
    await page.waitForTimeout(100)

    // Click to trigger transition
    await page.getByTestId('transition-trigger').click()

    // Verify transition starts - isPending becomes true
    await expect(page.getByTestId('pending-state')).toContainText('isPending:1')

    // During transition: data should still show old value (this is the key behavior)
    // In React 19, this behavior should be more consistent
    await expect(page.getByTestId('data-content')).toContainText(
      'data:initial-key'
    )

    // Wait for transition to complete
    await expect(page.getByTestId('pending-state')).toContainText('isPending:0')
    await expect(page.getByTestId('data-content')).toContainText('data:new-key')
  })
})
