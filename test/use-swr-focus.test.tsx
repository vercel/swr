import { act, fireEvent, screen } from '@testing-library/react'
import React, { useState } from 'react'
import useSWR from 'swr'
import {
  sleep,
  nextTick as waitForNextTick,
  focusOn,
  renderWithConfig,
  createKey
} from './utils'

const focusWindow = () => focusOn(window)

describe('useSWR - focus', () => {
  it('should revalidate on focus by default', async () => {
    let value = 0
    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')
    // mount
    await screen.findByText('data: 0')

    await waitForNextTick()
    // trigger revalidation
    await focusWindow()

    await screen.findByText('data: 1')
  })

  it("shouldn't revalidate on focus when revalidateOnFocus is false", async () => {
    let value = 0

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0,
        revalidateOnFocus: false
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    // mount
    await screen.findByText('data: 0')

    await waitForNextTick()
    // trigger revalidation
    await focusWindow()
    // should not be revalidated
    screen.getByText('data: 0')
  })

  it('revalidateOnFocus should be stateful', async () => {
    let value = 0

    const key = createKey()
    function Page() {
      const [revalidateOnFocus, toggle] = useState(false)
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0,
        revalidateOnFocus,
        focusThrottleInterval: 0
      })
      return <div onClick={() => toggle(s => !s)}>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    // mount
    await screen.findByText('data: 0')

    await waitForNextTick()
    // trigger revalidation
    await focusWindow()
    // data should not change
    screen.getByText('data: 0')

    // change revalidateOnFocus to true
    fireEvent.click(screen.getByText('data: 0'))
    // trigger revalidation
    await focusWindow()
    // data should update
    await screen.findByText('data: 1')

    await waitForNextTick()
    // trigger revalidation
    await focusWindow()
    // data should update
    await screen.findByText('data: 2')

    await waitForNextTick()
    // change revalidateOnFocus to false
    fireEvent.click(screen.getByText('data: 2'))
    // trigger revalidation
    await focusWindow()
    // data should not change
    screen.getByText('data: 2')
  })

  it('focusThrottleInterval should work', async () => {
    let value = 0

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0,
        revalidateOnFocus: true,
        focusThrottleInterval: 50
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    // mount
    await screen.findByText('data: 0')

    await waitForNextTick()
    // trigger revalidation
    await focusWindow()
    // still in throttling interval
    await act(() => sleep(20))
    // should be throttled
    await focusWindow()
    await screen.findByText('data: 1')
    // wait for focusThrottleInterval
    await act(() => sleep(100))

    // trigger revalidation again
    await focusWindow()
    await screen.findByText('data: 2')
  })

  it('focusThrottleInterval should be stateful', async () => {
    let value = 0

    const key = createKey()
    function Page() {
      const [focusThrottleInterval, setInterval] = useState(50)
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0,
        revalidateOnFocus: true,
        focusThrottleInterval
      })
      return <div onClick={() => setInterval(s => s + 100)}>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    // mount
    await screen.findByText('data: 0')

    await waitForNextTick()
    // trigger revalidation
    await focusWindow()
    // wait for throttle interval
    await act(() => sleep(100))
    // trigger revalidation
    await focusWindow()
    await screen.findByText('data: 2')

    await waitForNextTick()
    // increase focusThrottleInterval
    fireEvent.click(screen.getByText('data: 2'))
    // wait for throttle interval
    await act(() => sleep(100))
    // trigger revalidation
    await focusWindow()
    // wait for throttle interval
    await act(() => sleep(100))
    // should be throttled
    await focusWindow()
    await screen.findByText('data: 3')

    // wait for throttle interval
    await act(() => sleep(150))
    // trigger revalidation
    await focusWindow()
    // wait for throttle intervals
    await act(() => sleep(150))
    // trigger revalidation
    await focusWindow()
    await waitForNextTick()
    await screen.findByText('data: 5')
  })

  it('should revalidate on focus even with custom cache', async () => {
    let value = 0

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => value++, {
        revalidateOnFocus: true,
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')
    await screen.findByText('data: 0')
    await waitForNextTick()
    await focusWindow()
    await screen.findByText('data: 1')
  })
})
