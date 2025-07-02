import { test, expect } from '@playwright/test'

test.describe('performance', () => {
  test('should render expensive component within 1 second after checkbox click', async ({
    page
  }) => {
    // Navigate to the perf page
    await page.goto('./perf', { waitUntil: 'load' })

    // Inject performance measurement into the page
    await page.evaluate(() => {
      const checkboxInput = document.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement
      let expensiveComponentContainer: HTMLElement | null = null
      const targetChildCount = 10_000
      let startTime = 0

      // Track when React starts and completes rendering
      const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          const addedNodes = Array.from(mutation.addedNodes)
          for (const node of addedNodes) {
            if (node instanceof HTMLElement) {
              const h2 = node.querySelector?.('h2')
              if (h2?.textContent === 'Expensive Component') {
                expensiveComponentContainer = node
                console.log('Found Expensive Component container')
              }
            }
          }

          if (expensiveComponentContainer) {
            const renderedComponents =
              expensiveComponentContainer.querySelectorAll('div > div').length

            if (renderedComponents % 1000 === 0 && renderedComponents > 0) {
              console.log(`Rendered ${renderedComponents} components...`)
            }

            if (renderedComponents >= targetChildCount) {
              console.log(`All ${renderedComponents} components rendered!`)

              // Use requestAnimationFrame to ensure the browser has painted
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  // Double RAF to ensure we're after the paint
                  window.performance.mark('expensive-component-painted')
                  const paintTime = performance.now() - startTime
                  console.log(
                    `Total time including paint: ${paintTime.toFixed(2)}ms`
                  )
                })
              })

              observer.disconnect()
            }
          }
        }
      })

      observer.observe(document.body, { childList: true, subtree: true })

      // Capture more precise timing
      checkboxInput.addEventListener(
        'click',
        () => {
          startTime = performance.now()
          window.performance.mark('state-change-start')
          console.log('Checkbox clicked, state change started')
        },
        { once: true }
      )
    })

    // Find and click the checkbox
    const checkbox = page.locator('input[type="checkbox"]')
    await checkbox.click()

    // Wait for the expensive component to be fully rendered
    const expensiveComponentHeading = page.locator(
      'h2:has-text("Expensive Component")'
    )
    await expect(expensiveComponentHeading).toBeVisible({ timeout: 60_000 })

    // Wait for all components and paint to complete
    await page.waitForFunction(
      () => {
        return (
          window.performance.getEntriesByName('expensive-component-painted')
            .length > 0
        )
      },
      { timeout: 5000 }
    )

    // Get the render time from state change to paint
    const renderTime = await page.evaluate(() => {
      const startMark =
        window.performance.getEntriesByName('state-change-start')[0]
      const paintMark = window.performance.getEntriesByName(
        'expensive-component-painted'
      )[0]

      if (!startMark || !paintMark) {
        throw new Error('Performance marks not found')
      }

      return paintMark.startTime - startMark.startTime
    })

    // Assert that the rendering took less than 1 second (1000ms)
    expect(renderTime).toBeLessThan(1000)
  })
})
