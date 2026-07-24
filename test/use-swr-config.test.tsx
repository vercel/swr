import { screen, fireEvent } from '@testing-library/react'
import { Suspense, useEffect, useState, act } from 'react'
import type { Middleware } from 'swr'
import useSWR, { SWRConfig, useSWRConfig } from 'swr'
import {
  renderWithConfig,
  createKey,
  createResponse,
  itShouldSkipForReactCanary,
  renderWithGlobalCache,
  sleep
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
    await screen.findByText('data: 1')
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
        // revalidate on the mount and turn to idle
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

  it('should skip initial revalidation when isPaused is true and revalidateOnMount is true', async () => {
    const key = createKey()
    let value = 0
    const fetcher = async () => {
      await sleep(50)
      return value++
    }
    function Page() {
      const [paused, setPaused] = useState(false)
      const { data, isLoading, isValidating } = useSWR(key, fetcher, {
        revalidateOnMount: true,
        refreshInterval: 1,
        isPaused() {
          return true
        }
      })
      return (
        <div onClick={() => setPaused(!paused)}>
          {`data: ${data} | isLoading: ${
            isLoading ? 'yes' : 'no'
          } | isValidating: ${isValidating ? 'yes' : 'no'}`}
        </div>
      )
    }
    renderWithConfig(<Page />)
    // should not revalidate on mount
    screen.getByText('data: undefined | isLoading: no | isValidating: no')
  })

  it('should expose default config as static property on SWRConfig', () => {
    expect(SWRConfig.defaultValue).toBeDefined()
  })

  itShouldSkipForReactCanary(
    'should not revalidate on mount when suspense consumes cacheData',
    async () => {
      const key = createKey()
      const cacheData = { [key]: 'server data' }
      const clientFetcher = jest.fn(() => createResponse('client data'))

      function Page() {
        const { data } = useSWR(key, clientFetcher, { suspense: true })
        return <div>data:{data}</div>
      }

      renderWithGlobalCache(
        <SWRConfig value={{ cacheData }}>
          <Suspense fallback={<div>loading</div>}>
            <Page />
          </Suspense>
        </SWRConfig>
      )

      screen.getByText('data:server data')
      await act(() => sleep(50))
      expect(clientFetcher).toHaveBeenCalledTimes(0)
    }
  )

  itShouldSkipForReactCanary(
    'should not expose the cacheData record on later revalidation',
    async () => {
      const key = createKey()
      const cacheData = { [key]: 'server data' }
      const clientFetcher = jest.fn(() => createResponse('client data'))
      let revalidate = () => Promise.resolve<string | undefined>(undefined)

      function Page() {
        const { data, mutate } = useSWR(key, clientFetcher, {
          suspense: true
        })
        revalidate = mutate
        return <div>data:{data}</div>
      }

      renderWithGlobalCache(
        <SWRConfig value={{ cacheData }}>
          <Suspense fallback={<div>loading</div>}>
            <Page />
          </Suspense>
        </SWRConfig>
      )

      screen.getByText('data:server data')
      await act(() => sleep(10))
      await act(() => revalidate())

      await screen.findByText('data:client data')
      expect(clientFetcher).toHaveBeenCalledTimes(1)
    }
  )

  it('should use cacheData in default mode without calling the client fetcher', async () => {
    const key = createKey()
    const cacheData = { [key]: createResponse('server data') }
    const clientFetcher = jest.fn(() => createResponse('client data'))

    function Page() {
      const { data, isLoading } = useSWR(key, clientFetcher)
      return <div>data:{`${data}:${isLoading}`}</div>
    }

    renderWithGlobalCache(
      <SWRConfig value={{ cacheData }}>
        <Page />
      </SWRConfig>
    )

    screen.getByText('data:undefined:true')
    await screen.findByText('data:server data:false')
    expect(clientFetcher).toHaveBeenCalledTimes(0)
  })

  it('should expose the default config from useSWRConfig', () => {
    let config

    function Page() {
      config = useSWRConfig()
      return null
    }

    renderWithGlobalCache(<Page />)
    expect(SWRConfig.defaultValue).toEqual(config)
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

  it('should ignore parent config when value is functional', async () => {
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
          value={parentConfig => ({
            dedupingInterval: 2 + parentConfig.dedupingInterval,
            fallback: { a: 2, c: 2 },
            use: [middleware2]
          })}
        >
          <Page />
        </SWRConfig>
      </SWRConfig>
    )

    expect(config.dedupingInterval).toEqual(3)
    expect(config.refreshInterval).toEqual(undefined)
    expect(config.fallback).toEqual({ a: 2, c: 2 })
    expect(config.use).toEqual([middleware2])
  })

  it('should not occur error when fallback is undefined', async () => {
    const key = createKey()
    const fetcher = () => 'data'

    function Page() {
      const { data } = useSWR(key)
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />, {
      fetcher,
      fallback: undefined
    })
    // hydration
    screen.getByText('data:')
    // mount
    await screen.findByText('data: data')
  })
})
