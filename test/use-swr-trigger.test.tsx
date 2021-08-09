import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import useSWRTrigger from 'swr/trigger'
import { createKey, sleep } from './utils'

const waitForNextTick = () => act(() => sleep(1))

describe('useSWR - trigger', () => {
  it('should return data after triggering', async () => {
    const key = createKey()

    function Page() {
      const { data, trigger } = useSWRTrigger(key, () => 'data')
      return <button onClick={() => trigger()}>{data || 'pending'}</button>
    }

    render(<Page />)

    // mount
    await screen.findByText('pending')

    fireEvent.click(screen.getByText('pending'))
    await waitForNextTick()

    screen.getByText('data')
  })

  it('should trigger request with correct args', async () => {
    const key = createKey()
    const fetcher = jest.fn(() => 'data')

    function Page() {
      const { data, trigger } = useSWRTrigger(key, fetcher)
      return (
        <button onClick={() => trigger('arg1', 'arg2')}>
          {data || 'pending'}
        </button>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('pending')

    fireEvent.click(screen.getByText('pending'))
    await waitForNextTick()

    screen.getByText('data')

    expect(fetcher).toHaveBeenCalled()
    expect(fetcher.mock.calls.length).toBe(1)
    expect(fetcher.mock.calls[0]).toEqual([key, 'arg1', 'arg2'])
  })

  it('should call `onSuccess` event', async () => {
    const key = createKey()
    const onSuccess = jest.fn()

    function Page() {
      const { data, trigger } = useSWRTrigger(key, () => 'data', {
        onSuccess
      })
      return <button onClick={() => trigger()}>{data || 'pending'}</button>
    }

    render(<Page />)

    // mount
    await screen.findByText('pending')

    fireEvent.click(screen.getByText('pending'))
    await waitForNextTick()

    screen.getByText('data')

    expect(onSuccess).toHaveBeenCalled()
  })
})
