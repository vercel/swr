import React from 'react'
import { act, screen } from '@testing-library/react'
import { sleep, renderWithConfig, createKey } from './utils'

import useSWRSubscription from 'swr/subscription'
import useSWR from 'swr'

describe('useSWRSubscription', () => {
  it('should update the state', async () => {
    const swrKey = createKey()

    let intervalId
    let res = 0
    function subscribe(key, { next }) {
      intervalId = setInterval(() => {
        if (res === 3) {
          const err = new Error(key)
          next(err)
        } else {
          next(undefined, key + res)
        }
        res++
      }, 100)

      return () => {}
    }

    function Page() {
      const { data, error } = useSWRSubscription(swrKey, subscribe, {
        fallbackData: 'fallback'
      })
      return (
        <>
          <div data-testid="data">{'data:' + data}</div>
          <div data-testid="error">
            {'error:' + (error ? error.message : '')}
          </div>
        </>
      )
    }

    renderWithConfig(<Page />)
    await act(() => sleep(10))
    screen.getByText(`data:fallback`)
    screen.getByText('error:')
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}0`)
    screen.getByText('error:')
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}1`)
    screen.getByText('error:')
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}2`)
    screen.getByText('error:')
    await act(() => sleep(100))
    // error occurred, error arrives instead of data 3
    screen.getByText(`data:${swrKey}2`)
    screen.getByText(`error:${swrKey}`)
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}4`)
    screen.getByText('error:')
    clearInterval(intervalId)
    await sleep(100)
    screen.getByText(`error:`)
  })

  it('should pass the origin keys', async () => {
    const swrKey = createKey()
    let intervalId
    let res = 0
    function subscribe(key, { next }) {
      intervalId = setInterval(() => {
        if (res === 3) {
          const err = new Error(key)
          next(err)
        } else {
          next(undefined, key[0] + res)
        }
        res++
      }, 100)

      return () => {}
    }

    function Page() {
      const { data, error } = useSWRSubscription([swrKey], subscribe, {
        fallbackData: 'fallback'
      })
      return (
        <>
          <div data-testid="data">{'data:' + data}</div>
          <div data-testid="error">
            {'error:' + (error ? error.message : '')}
          </div>
        </>
      )
    }
    renderWithConfig(<Page />)
    await act(() => sleep(10))
    screen.getByText(`data:fallback`)
    screen.getByText('error:')
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}0`)
    screen.getByText('error:')
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}1`)
    screen.getByText('error:')
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}2`)
    screen.getByText('error:')
    await act(() => sleep(100))
    // error occurred, error arrives instead of data 3
    screen.getByText(`data:${swrKey}2`)
    screen.getByText(`error:${swrKey}`)
    await act(() => sleep(100))
    screen.getByText(`data:${swrKey}4`)
    screen.getByText('error:')
    clearInterval(intervalId)
    await sleep(100)
    screen.getByText(`error:`)
  })

  it('should deduplicate subscriptions', async () => {
    const swrKey = createKey()

    let subscriptionCount = 0

    function subscribe(key, { next }) {
      ++subscriptionCount
      let res = 0
      const intervalId = setInterval(() => {
        if (res === 3) {
          const err = new Error(key + 'error')
          next(err)
        } else {
          next(undefined, key + res)
        }
        res++
      }, 100)

      return () => {
        clearInterval(intervalId)
      }
    }

    function Page() {
      const { data, error } = useSWRSubscription(swrKey, subscribe, {
        fallbackData: 'fallback'
      })
      useSWRSubscription(swrKey, subscribe)
      useSWRSubscription(swrKey, subscribe)

      return <div>{error ? error.message : data}</div>
    }

    renderWithConfig(<Page />)
    await act(() => sleep(10))
    screen.getByText(`fallback`)
    await act(() => sleep(100))
    screen.getByText(`${swrKey}0`)
    await act(() => sleep(100))
    screen.getByText(`${swrKey}1`)
    await act(() => sleep(100))
    screen.getByText(`${swrKey}2`)

    expect(subscriptionCount).toBe(1)
  })

  it('should not conflict with useSWR state', async () => {
    const swrKey = createKey()

    function subscribe(key, { next }) {
      let res = 0
      const intervalId = setInterval(() => {
        if (res === 3) {
          const err = new Error(key + 'error')
          next(err)
        } else {
          next(undefined, key + res)
        }
        res++
      }, 100)

      return () => {
        clearInterval(intervalId)
      }
    }

    function Page() {
      const { data, error } = useSWRSubscription(swrKey, subscribe, {
        fallbackData: 'fallback'
      })
      const { data: swrData } = useSWR(swrKey, () => 'swr')
      return (
        <div>
          {swrData}:{error ? error.message : data}
        </div>
      )
    }

    renderWithConfig(<Page />)
    await act(() => sleep(10))
    screen.getByText(`swr:fallback`)
    await act(() => sleep(100))
    screen.getByText(`swr:${swrKey}0`)
    await act(() => sleep(100))
    screen.getByText(`swr:${swrKey}1`)
    await act(() => sleep(100))
    screen.getByText(`swr:${swrKey}2`)
  })
})
