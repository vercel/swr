/**
 * @jest-environment node
 */

// Do not lint the return value destruction for `renderToString`
/* eslint-disable testing-library/render-result-naming-convention */

import React from 'react'
import { renderToString } from 'react-dom/server'
import useSWR from '../core'
import useSWRImmutable from '../immutable'
import { createKey } from './utils'
import { IS_SERVER } from '../_internal/utils/env'

describe('useSWR', () => {
  it('env IS_SERVER is true in node env', () => {
    expect(IS_SERVER).toBe(true)
  })

  it('should render fallback if provided on server side', async () => {
    const key = createKey()
    const useData = () => useSWR(key, k => k, { fallbackData: 'fallback' })

    function Page() {
      const { data } = useData()
      return <p>{data}</p>
    }

    const html = renderToString(<Page />)
    expect(html).toContain('fallback')
  })

  it('should not revalidate useSWRImmutable on server side', async () => {
    const key = createKey()
    const useData = () => useSWRImmutable(key, k => k)

    function Page() {
      const { data } = useData()
      return <p>{data || 'empty'}</p>
    }

    const html = renderToString(<Page />)
    expect(html).toContain('empty')
  })
})
