import { act, screen, fireEvent } from '@testing-library/react'
import React, { useEffect, useState } from 'react'
import useSWR, { SWRConfig, useSWRConfig, Middleware } from 'swr'
import {
  sleep,
  renderWithConfig,
  createKey,
  renderWithGlobalCache
} from './utils'

describe('useSWR - configs', () => {
  it('should read the config fallback from the context', async () => {
    let value = 0
    const INTERVAL = 100
    const fetcher = () => value++
    const key = createKey()

    function Page() {
      const { data } = useSWR(key)
      return <div>data: {data}</div>
    }
    renderWithConfig(<Page />, {
      fetcher,
      refreshInterval: INTERVAL,
      dedupingInterval: 0
    })
    // hydration
    screen.getByText('data:')
    // mount
    await screen.findByText('data: 0')

    // wait for the refresh interval
    await act(() => sleep(INTERVAL * 1.5))
    screen.getByText('data: 1')
  })

  it('should stop revalidations when config.isPaused returns true', async () => {
    const key = createKey()
    let value = 0
    const fetcher = () => {
      if (value === 2) throw new Error()
      return value++
    }
    let mutate

    function Page() {
      const [paused, setPaused] = useState(false)
      const {
        data,
        error,
        mutate: _mutate
      } = useSWR(key, fetcher, {
        revalidateOnMount: true,
        refreshInterval: 1,
        isPaused() {
          return paused
        }
      })
      mutate = _mutate

      useEffect(() => {
        // revalidate on mount and turn to idle
        setPaused(true)
      }, [])

      return (
        <div onClick={() => setPaused(!paused)}>
          {error ? error : `data: ${data}`}
        </div>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText('data: 0')

    // should not be revalidated
    await act(() => mutate())
    screen.getByText('data: 0')
    await act(() => mutate())
    screen.getByText('data: 0')

    // enable isPaused
    fireEvent.click(screen.getByText('data: 0'))
    // should be revalidated
    await act(() => mutate())
    screen.getByText('data: 1')

    // disable isPaused
    fireEvent.click(screen.getByText('data: 1'))
    // should not be revalidated
    await act(() => mutate())
    screen.getByText('data: 1')
    await act(() => mutate())
    screen.getByText('data: 1')
  })

  it('should expose default config as static property on SWRConfig', () => {
    expect(SWRConfig.default).toBeDefined()
  })

  it('should expose the default config from useSWRConfig', () => {
    let config

    function Page() {
      config = useSWRConfig()
      return null
    }

    renderWithGlobalCache(<Page />)
    expect(SWRConfig.default).toEqual(config)
  })

  it('should expose the correctly extended config from useSWRConfig', () => {
    let config

    function Page() {
      config = useSWRConfig()
      return null
    }

    const middleware1: Middleware = useSWRNext => (k, f, c) =>
      useSWRNext(k, f, c)
    const middleware2: Middleware = useSWRNext => (k, f, c) =>
      useSWRNext(k, f, c)

    renderWithConfig(
      <SWRConfig
        value={{
          dedupingInterval: 1,
          refreshInterval: 1,
          fallback: { a: 1, b: 1 },
          use: [middleware1]
        }}
      >
        <SWRConfig
          value={{
            dedupingInterval: 2,
            fallback: { a: 2, c: 2 },
            use: [middleware2]
          }}
        >
          <Page />
        </SWRConfig>
      </SWRConfig>
    )

    expect(config.dedupingInterval).toEqual(2)
    expect(config.refreshInterval).toEqual(1)
    expect(config.fallback).toEqual({ a: 2, b: 1, c: 2 })
    expect(config.use).toEqual([middleware1, middleware2])
  })
})
