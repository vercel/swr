/**
 * @jest-environment node
 */

import React from 'react'
import { renderToString } from 'react-dom/server'
import useSWR from '../src'
import { createKey } from './utils'

describe('useSWR', () => {
  it('should render fallback if provided on server side', async () => {
    const key = createKey()
    const useData = () => useSWR(key, k => k, { fallbackData: 'fallback' })

    function Page() {
      const { data } = useData()
      return <p>{data}</p>
    }

    const string = renderToString(<Page />)
    expect(string).toContain('fallback')
  })

  it('should not revalidate on server side', async () => {
    let value = 0
    const key = createKey()
    const useData = () => useSWR(key, () => value++)

    function Page() {
      const { data } = useData()
      return <p>{data || 'empty'}</p>
    }

    const string = renderToString(<Page />)
    expect(string).toContain('empty')
  })
})
