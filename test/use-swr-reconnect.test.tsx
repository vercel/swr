import { screen, fireEvent, createEvent, act } from '@testing-library/react'
import React from 'react'
import useSWR from 'swr'
import {
  nextTick as waitForNextTick,
  renderWithConfig,
  createKey
} from './utils'

describe('useSWR - reconnect', () => {
  it('should revalidate on reconnect by default', async () => {
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

    // trigger reconnect
    await act(async () => {
      fireEvent(window, createEvent('offline', window))
      fireEvent(window, createEvent('online', window))
    })

    await screen.findByText('data: 1')
  })

  it("shouldn't revalidate on reconnect when revalidateOnReconnect is false", async () => {
    let value = 0

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0,
        revalidateOnReconnect: false
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    // mount
    await screen.findByText('data: 0')

    await waitForNextTick()

    // trigger reconnect
    await act(async () => {
      fireEvent(window, createEvent('offline', window))
      fireEvent(window, createEvent('online', window))
    })

    // should not be revalidated
    screen.getByText('data: 0')
  })

  it("shouldn't revalidate on reconnect when isOnline is returning false", async () => {
    let value = 0

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0,
        isOnline: () => false
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    // mount
    await screen.findByText('data: 0')

    await waitForNextTick()

    // trigger reconnect
    await act(async () => {
      fireEvent(window, createEvent('offline', window))
      fireEvent(window, createEvent('online', window))
    })

    // should not be revalidated
    screen.getByText('data: 0')
  })
})
