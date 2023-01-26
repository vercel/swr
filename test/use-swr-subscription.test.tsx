import React from 'react'
import { act, screen } from '@testing-library/react'
import { sleep, renderWithConfig } from './utils'
import useSWRSubscription from 'swr/subscription'

describe('useSWRSubscription', () => {
  it('should update state when fetcher is a subscription', async () => {
    const swrKey = 'sub-0'
    let intervalId
    let res = 0
    function subscribe(key, { next }) {
      intervalId = setInterval(() => {
        if (res === 3) {
          const err = new Error(key + 'error')
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
    await act(() => sleep(100))
    screen.getByText(`${swrKey}error`)
    clearInterval(intervalId)
    await sleep(100)
    screen.getByText(`${swrKey}error`)
  })
})
