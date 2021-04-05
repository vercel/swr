import { act, fireEvent, render, screen } from '@testing-library/react'
import React, { useState } from 'react'
import useSWR, { createCache, SWRConfig } from '../src'
import { sleep, createKey } from './utils'

describe('useSWR - cache', () => {
  it('should be able to update the cache', async () => {
    const fetcher = _key => 'res:' + _key
    const keys = [createKey(), createKey()]

    function Section() {
      const [index, setIndex] = useState(0)
      const { data } = useSWR(keys[index], fetcher)

      return <div onClick={() => setIndex(1)}>{data}</div>
    }

    const customCache = new Map()
    const { cache } = createCache(customCache)
    const { container } = render(
      <SWRConfig value={{ cache }}>
        <Section />
      </SWRConfig>
    )
    await screen.findByText(fetcher(keys[0]))

    expect(customCache.get(keys[1])).toBe(undefined)
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(10))

    expect(customCache.get(keys[0])).toBe(fetcher(keys[0]))
    expect(customCache.get(keys[1])).toBe(fetcher(keys[1]))
  })

  it('should be able to read from the initial cache with updates', async () => {
    const key = createKey()
    const renderedValues = []
    const fetcher = () =>
      new Promise(res => setTimeout(res, 100, 'updated value'))

    function Page() {
      const { data } = useSWR(key, fetcher)
      renderedValues.push(data)
      return <div>{data}</div>
    }

    const customCache = new Map([[key, 'cached value']])
    const { cache } = createCache(customCache)
    render(
      <SWRConfig value={{ cache }}>
        <Page />
      </SWRConfig>
    )
    screen.getByText('cached value')
    await screen.findByText('updated value')
    expect(renderedValues.length).toBe(2)
  })
})
