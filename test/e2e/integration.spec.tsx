import { test, expect } from '@playwright/experimental-ct-react'
import React, { Profiler } from 'react'
import { createKey } from '../common-utils'
import NestedRender from './components/swr-nested-render'
import Provider from './__fixture__/Provider'
test.use({ viewport: { width: 500, height: 500 } })

test.describe('SWR integration', () => {
  test('Nested SWR hook should only do loading once', async ({ mount }) => {
    const key = createKey()
    let count = 0
    const component = await mount(
      <Provider>
        <Profiler
          id={key}
          onRender={() => {
            count += 1
          }}
        >
          <NestedRender swrKey={key}></NestedRender>
        </Profiler>
      </Provider>
    )
    await expect(component).toContainText('loading')
    await expect(component).toContainText(key)
    expect(count).toEqual(2)
  })
})
