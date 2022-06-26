import { screen } from '@testing-library/react'
import React from 'react'

describe('useSWR - devtools', () => {
  let useSWR, createKey, createResponse, renderWithConfig
  beforeEach(() => {
    const middleware =
      useSWRNext =>
      (...args) => {
        const result = useSWRNext(...args)
        return { ...result, data: 'middleware' }
      }
    // @ts-expect-error
    window.__SWR_DEVTOOLS_USE__ = [middleware]
    ;({ createKey, createResponse, renderWithConfig } = require('./utils'))
    useSWR = require('swr').default
  })
  it('window.__SWR_DEVTOOLS_USE__ should be set as middleware', async () => {
    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => createResponse('ok'))
      return <div>data: {data}</div>
    }
    renderWithConfig(<Page />)
    await screen.findByText('data: middleware')
  })
  it('window.__SWR_DEVTOOLS_REACT__ should be the same reference with React', () => {
    // @ts-expect-error
    expect(window.__SWR_DEVTOOLS_REACT__).toBe(React)
  })
})
