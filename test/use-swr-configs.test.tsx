import { act, render, screen, fireEvent } from '@testing-library/react'
import React, { useEffect, useState } from 'react'
import useSWR, { mutate, SWRConfig } from '../src'
import { sleep } from './utils'

describe('useSWR - configs', () => {
  it('should read the config fallback from the context', async () => {
    let value = 0
    const INTERVAL = 100
    const fetcher = () => value++

    function Section() {
      const { data } = useSWR('config-0')
      return <div>data: {data}</div>
    }
    function Page() {
      // config provider
      return (
        <SWRConfig
          value={{ fetcher, refreshInterval: INTERVAL, dedupingInterval: 0 }}
        >
          <Section />
        </SWRConfig>
      )
    }
    render(<Page />)
    // hydration
    screen.getByText('data:')
    // mount
    await screen.findByText('data: 0')

    // wait for the refresh interval
    await act(() => sleep(INTERVAL * 1.5))
    screen.getByText('data: 1')
  })

  it('should stop revalidations when config.isPaused returns true', async () => {
    const key = 'config-1'
    let value = 0
    const fetcher = () => {
      if (value === 2) throw new Error()
      return value++
    }
    const revalidate = () => mutate(key)

    function Page() {
      const [paused, setPaused] = useState(false)
      const { data, error } = useSWR(key, fetcher, {
        revalidateOnMount: true,
        refreshInterval: 1,
        isPaused() {
          return paused
        }
      })

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

    render(<Page />)
    await screen.findByText('data: 0')

    // should not be revalidated
    await act(() => revalidate())
    screen.getByText('data: 0')
    await act(() => revalidate())
    screen.getByText('data: 0')

    // enable isPaused
    fireEvent.click(screen.getByText('data: 0'))
    // should be revalidated
    await act(() => revalidate())
    screen.getByText('data: 1')

    // disable isPaused
    fireEvent.click(screen.getByText('data: 1'))
    // should not be revalidated
    await act(() => revalidate())
    screen.getByText('data: 1')
    await act(() => revalidate())
    screen.getByText('data: 1')
  })

  it('should expose default config as static property on SWRConfig', () => {
    expect(SWRConfig.default).toBeDefined()
  })
})
