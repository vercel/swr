import { screen } from '@testing-library/react'
import React from 'react'
import { createKey, createResponse, renderWithConfig } from './utils'

describe('useSWR - devtools', () => {
  let useSWR
  beforeEach(() => {
    const middleware =
      useSWRNext =>
      (...args) => {
        const result = useSWRNext(...args)
        return { ...result, data: 'middleware' }
      }
    // @ts-expect-error
    window.__SWR_DEVTOOLS_USE__ = [middleware]
    useSWR = require('swr').default
  })
  it('window.__SWR_DEVTOOLS_USE__ should be set as middlewares', async () => {
    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => createResponse('ok'))
      return <div>data: {data}</div>
    }
    renderWithConfig(<Page />)
    await screen.findByText('data: middleware')
  })
})
