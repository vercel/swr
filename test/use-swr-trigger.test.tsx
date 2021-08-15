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
      const { data, trigger } = useSWRTrigger([key, 'arg0'], fetcher)
      return (
        <button onClick={() => trigger('arg1', 'arg2')}>
          {data || 'pending'}
        </button>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('pending')
    expect(fetcher).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('pending'))
    await waitForNextTick()

    screen.getByText('data')

    expect(fetcher).toHaveBeenCalled()
    expect(fetcher.mock.calls.length).toBe(1)
    expect(fetcher.mock.calls[0]).toEqual([key, 'arg0', 'arg1', 'arg2'])
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

  it('should call `onError` event', async () => {
    const key = createKey()
    const onError = jest.fn()

    function Page() {
      const { data, error, trigger } = useSWRTrigger(
        key,
        async () => {
          await sleep(10)
          throw new Error('error!')
        },
        {
          onError
        }
      )
      return (
        <button onClick={trigger}>
          {data || (error ? error.message : 'pending')}
        </button>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('pending')
    fireEvent.click(screen.getByText('pending'))

    await screen.findByText('error!')
    expect(onError).toHaveBeenCalled()
  })

  it('should return `isValidating` state correctly', async () => {
    const key = createKey()

    function Page() {
      const { data, trigger, isValidating } = useSWRTrigger(key, async () => {
        await sleep(10)
        return 'data'
      })
      return (
        <button onClick={trigger}>
          state:{(isValidating ? 'pending' : data) || ''}
        </button>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('state:')
    fireEvent.click(screen.getByText('state:'))

    await screen.findByText('state:pending')
    await screen.findByText('state:data')
  })

  it('should send `onError` and `onSuccess` events', async () => {
    const key = createKey()
    const onSuccess = jest.fn()
    const onError = jest.fn()

    let arg = false

    function Page() {
      const { data, error, trigger } = useSWRTrigger(
        key,
        async (_, shouldReturnValue) => {
          await sleep(10)
          if (shouldReturnValue) return 'data'
          throw new Error('error')
        },
        {
          onSuccess,
          onError
        }
      )
      return (
        <button onClick={() => trigger(arg)}>
          {data || (error ? error.message : 'pending')}
        </button>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('pending')
    fireEvent.click(screen.getByText('pending'))

    await screen.findByText('error')
    expect(onError).toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()

    arg = true
    fireEvent.click(screen.getByText('error'))
    await screen.findByText('data')
    expect(onSuccess).toHaveBeenCalled()
  })
})
