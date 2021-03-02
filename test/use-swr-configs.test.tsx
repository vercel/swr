import { act, render, screen, fireEvent } from '@testing-library/react'
import React, { useEffect, useState } from 'react'
import useSWR, { mutate, SWRConfig } from '../src'
import { sleep } from './utils'

describe('useSWR - configs', () => {
  it('should read the config fallback from the context', async () => {
    let value = 0
    const fetcher = () => value++

    function Section() {
      const { data } = useSWR('config-0')
      return <div>data: {data}</div>
    }
    function Page() {
      // config provider
      return (
        <SWRConfig
          value={{ fetcher, refreshInterval: 100, dedupingInterval: 0 }}
        >
          <Section />
        </SWRConfig>
      )
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')
    await act(() => sleep(110)) // update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
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
        refreshInterval: 200,
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
    const { container } = render(<Page />)

    await screen.findByText('data: 0')
    await act(async () => await 0)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 0"`)
    revalidate()
    await act(async () => await 0)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 0"`)
    revalidate()
    fireEvent.click(container.firstElementChild)
    await act(async () => await 0)
    revalidate()
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 0"`)
    await act(async () => await 0)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
    fireEvent.click(container.firstElementChild)
    await act(async () => sleep(400))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })
})
