/**
 * @jest-environment node
 */

// Do not lint the return value destruction for `renderToString`
/* eslint-disable testing-library/render-result-naming-convention */

import { renderToString } from 'react-dom/server'
import useSWR, { SWRConfig } from 'swr'
import useSWRImmutable from 'swr/immutable'
import { IS_SERVER, initCache } from 'swr/_internal'
import { createKey } from './utils'

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

  it.each([undefined, 'second cache'])(
    'should render its own cache after another provider mutates the same key (%s)',
    async initialValue => {
      const key = createKey()
      const firstCache = new Map([[key, { data: 'first cache' }]])
      const [, mutate] = initCache(firstCache)
      await mutate(key, 'updated first cache', false)

      const secondCache = new Map(
        initialValue ? [[key, { data: initialValue }]] : []
      )

      function Page() {
        const { data } = useSWR(key, null)
        return <p>{data || 'empty'}</p>
      }

      const html = renderToString(
        <SWRConfig value={{ provider: () => secondCache }}>
          <Page />
        </SWRConfig>
      )

      expect(html).toBe(`<p>${initialValue || 'empty'}</p>`)
    }
  )

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
