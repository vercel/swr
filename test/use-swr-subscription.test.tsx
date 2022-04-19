import React from 'react'
import { act, screen } from '@testing-library/react'
import { sleep, renderWithConfig } from './utils'
import useSWRSubscription from 'swr/unstable_subscription'

describe('useSWRSubscription', () => {
  it('should update state when fetcher is a subscription', async () => {
    const key = 'sub-0'
    let intervalId
    let res = 0
    function subscribe(_key, { next }) {
      intervalId = setInterval(() => {
        if (res === 3) {
          const err = new Error(_key + 'error')
          next(err)
        } else {
          next(undefined, _key + res)
        }
        res++
      }, 100)

      return () => {}
    }

    function Page() {
      const { data, error } = useSWRSubscription(key, subscribe, {
        fallbackData: 'fallback'
      })
      return <div>{error ? error.message : data}</div>
    }

    renderWithConfig(<Page />)
    await act(() => sleep(10))
    screen.getByText(`fallback`)
    await act(() => sleep(100))
    screen.getByText(`${key}0`)
    await act(() => sleep(100))
    screen.getByText(`${key}1`)
    await act(() => sleep(100))
    screen.getByText(`${key}2`)
    await act(() => sleep(100))
    screen.getByText(`${key}error`)
    clearInterval(intervalId)
    await sleep(100)
    screen.getByText(`${key}error`)
  })
})
