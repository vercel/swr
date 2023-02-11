import { act, fireEvent, render, screen } from '@testing-library/react'
import React, { useState } from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { createKey, sleep, nextTick } from './utils'

const waitForNextTick = () => act(() => sleep(1))

describe('useSWR - remote mutation', () => {
  it('should return data after triggering', async () => {
    const key = createKey()

    function Page() {
      const { data, trigger } = useSWRMutation(key, () => 'data')
      return <button onClick={() => trigger()}>{data || 'pending'}</button>
    }

    render(<Page />)

    // mount
    await screen.findByText('pending')

    fireEvent.click(screen.getByText('pending'))
    await waitForNextTick()

    screen.getByText('data')
  })

  it('should return data from `trigger`', async () => {
    const key = createKey()

    function Page() {
      const [data, setData] = React.useState(null)
      const { trigger } = useSWRMutation(key, () => 'data')
      return (
        <button
          onClick={async () => {
            setData(await trigger())
          }}
        >
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
  })

  it('should trigger request with the correct argument signature', async () => {
    const key = createKey()
    const fetcher = jest.fn((_, __: { arg: string }) => 'data')

    function Page() {
      const { data, trigger } = useSWRMutation([key, 'arg0'], fetcher)
      return (
        <button onClick={() => trigger('arg1')}>{data || 'pending'}</button>
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
    expect(fetcher.mock.calls[0]).toEqual([[key, 'arg0'], { arg: 'arg1' }])
  })

  it('should call `onSuccess` event', async () => {
    const key = createKey()
    const onSuccess = jest.fn()

    function Page() {
      const { data, trigger } = useSWRMutation(key, () => 'data', {
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

  it('should support configuring `onSuccess` with trigger', async () => {
    const key = createKey()
    const onSuccess = jest.fn()

    function Page() {
      const { data, trigger } = useSWRMutation(key, () => 'data')
      return (
        <button onClick={() => trigger(null, { onSuccess })}>
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

    expect(onSuccess).toHaveBeenCalled()
  })

  it('should call `onError` event and throw', async () => {
    const key = createKey()
    const onError = jest.fn()
    const onInplaceError = jest.fn()

    function Page() {
      const { data, error, trigger } = useSWRMutation(
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
        <button onClick={() => trigger().catch(onInplaceError)}>
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
    expect(onInplaceError).toHaveBeenCalled()
  })

  it('should call `onError` event and skip throwing the error when `throwOnError` is disabled', async () => {
    const key = createKey()
    const onError = jest.fn()
    const onInplaceError = jest.fn()

    function Page() {
      const { data, error, trigger } = useSWRMutation(
        key,
        async () => {
          await sleep(10)
          throw new Error('error!')
        },
        {
          onError,
          throwOnError: false
        }
      )
      return (
        <button onClick={() => trigger().catch(onInplaceError)}>
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
    expect(onInplaceError).not.toHaveBeenCalled()
  })

  it('should return `isMutating` state correctly', async () => {
    const key = createKey()

    function Page() {
      const { data, trigger, isMutating } = useSWRMutation(key, async () => {
        await sleep(10)
        return 'data'
      })
      return (
        <button onClick={trigger}>
          state:{(isMutating ? 'pending' : data) || ''}
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
      const { data, error, trigger } = useSWRMutation(
        key,
        async (_, { arg: shouldReturnValue }: { arg: boolean }) => {
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
        <button onClick={() => trigger(arg).catch(() => {})}>
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

  it('should not dedupe trigger requests', async () => {
    const key = createKey()
    const fn = jest.fn()

    function Page() {
      const { trigger } = useSWRMutation(key, async () => {
        fn()
        await sleep(10)
        return 'data'
      })
      return <button onClick={trigger}>trigger</button>
    }

    render(<Page />)

    // mount
    await screen.findByText('trigger')
    expect(fn).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('trigger'))
    expect(fn).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('trigger'))
    fireEvent.click(screen.getByText('trigger'))
    fireEvent.click(screen.getByText('trigger'))
    expect(fn).toHaveBeenCalledTimes(4)
  })

  it('should share the cache with `useSWR` when `populateCache` is enabled', async () => {
    const key = createKey()

    function Page() {
      const { data } = useSWR(key)
      const { trigger } = useSWRMutation(key, async () => {
        await sleep(10)
        return 'data'
      })
      return (
        <div>
          <button onClick={() => trigger(undefined, { populateCache: true })}>
            trigger
          </button>
          <div>data:{data || 'none'}</div>
        </div>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('data:none')

    fireEvent.click(screen.getByText('trigger'))
    await screen.findByText('data:data')
  })

  it('should not read the cache from `useSWR`', async () => {
    const key = createKey()

    function Page() {
      useSWR(key, () => 'data')
      const { data } = useSWRMutation(key, () => 'wrong!')
      return <div>data:{data || 'none'}</div>
    }

    render(<Page />)

    // mount
    await screen.findByText('data:none')
  })

  it('should be able to populate the cache for `useSWR`', async () => {
    const key = createKey()

    function Page() {
      const { data } = useSWR(key, () => 'data')
      const { trigger } = useSWRMutation(
        key,
        (_, { arg }: { arg: string }) => arg
      )
      return (
        <div onClick={() => trigger('updated!', { populateCache: true })}>
          data:{data || 'none'}
        </div>
      )
    }

    render(<Page />)

    await screen.findByText('data:none')

    // mount
    await screen.findByText('data:data')

    // mutate
    fireEvent.click(screen.getByText('data:data'))
    await screen.findByText('data:updated!')
  })

  it('should be able to populate the cache with a transformer', async () => {
    const key = createKey()

    function Page() {
      const { data } = useSWR(key, () => 'data')
      const { trigger } = useSWRMutation(
        key,
        (_, { arg }: { arg: string }) => arg
      )
      return (
        <div
          onClick={() =>
            trigger('updated!', {
              populateCache: (v, current) => v + ':' + current
            })
          }
        >
          data:{data || 'none'}
        </div>
      )
    }

    render(<Page />)

    await screen.findByText('data:none')

    // mount
    await screen.findByText('data:data')

    // mutate
    fireEvent.click(screen.getByText('data:data'))
    await screen.findByText('data:updated!:data')
  })

  it('should not trigger request when mutating from shared hooks', async () => {
    const key = createKey()
    const fn = jest.fn(() => 'data')

    function Page() {
      useSWRMutation(key, fn)
      const { mutate } = useSWR(key)
      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('mutate')

    fireEvent.click(screen.getByText('mutate'))

    await act(() => sleep(50))
    expect(fn).not.toHaveBeenCalled()
  })

  it('should not trigger request when key changes', async () => {
    const key = createKey()
    const fn = jest.fn(() => 'data')

    function Page() {
      const [k, setK] = React.useState(key)
      useSWRMutation(k, fn)
      return (
        <div>
          <button onClick={() => setK(key + '_new')}>update key</button>
        </div>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('update key')

    fireEvent.click(screen.getByText('update key'))

    await act(() => sleep(50))
    expect(fn).not.toHaveBeenCalled()
  })

  it('should prevent race conditions with `useSWR`', async () => {
    const key = createKey()
    const logger = jest.fn()

    function Page() {
      const { data } = useSWR(key, async () => {
        await sleep(10)
        return 'foo'
      })
      const { trigger } = useSWRMutation(key, async () => {
        await sleep(20)
        return 'bar'
      })

      logger(data)

      return (
        <div>
          <button
            onClick={() =>
              trigger(undefined, { revalidate: false, populateCache: true })
            }
          >
            trigger
          </button>
          <div>data:{data || 'none'}</div>
        </div>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('data:none')

    fireEvent.click(screen.getByText('trigger'))
    await act(() => sleep(50))
    await screen.findByText('data:bar')

    // It should never render `foo`.
    expect(logger).not.toHaveBeenCalledWith('foo')
  })

  it('should revalidate after mutating by default', async () => {
    const key = createKey()
    const logger = jest.fn()

    function Page() {
      const { data } = useSWR(
        key,
        async () => {
          await sleep(10)
          return 'foo'
        },
        { revalidateOnMount: false }
      )
      const { trigger } = useSWRMutation(key, async () => {
        await sleep(20)
        return 'bar'
      })

      logger(data)

      return (
        <div>
          <button onClick={() => trigger(undefined)}>trigger</button>
          <div>data:{data || 'none'}</div>
        </div>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('data:none')

    fireEvent.click(screen.getByText('trigger'))
    await act(() => sleep(50))

    // It triggers revalidation
    await screen.findByText('data:foo')

    // It should never render `bar` since we never populate the cache.
    expect(logger).not.toHaveBeenCalledWith('bar')
  })

  it('should revalidate after populating the cache', async () => {
    const key = createKey()
    const logger = jest.fn()

    function Page() {
      const { data } = useSWR(
        key,
        async () => {
          await sleep(20)
          return 'foo'
        },
        { revalidateOnMount: false }
      )
      const { trigger } = useSWRMutation(key, async () => {
        await sleep(20)
        return 'bar'
      })

      logger(data)

      return (
        <div>
          <button onClick={() => trigger(undefined, { populateCache: true })}>
            trigger
          </button>
          <div>data:{data || 'none'}</div>
        </div>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('data:none')

    fireEvent.click(screen.getByText('trigger'))

    // Cache is updated
    await screen.findByText('data:bar')

    // A revalidation is triggered
    await screen.findByText('data:foo')
  })

  it('should be able to turn off auto revalidation', async () => {
    const key = createKey()
    const logger = jest.fn()

    function Page() {
      const { data } = useSWR(
        key,
        async () => {
          await sleep(10)
          return 'foo'
        },
        { revalidateOnMount: false }
      )
      const { trigger } = useSWRMutation(
        key,
        async () => {
          await sleep(20)
          return 'bar'
        },
        { revalidate: false, populateCache: true }
      )

      logger(data)

      return (
        <div>
          <button onClick={() => trigger(undefined)}>trigger</button>
          <div>data:{data || 'none'}</div>
        </div>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('data:none')

    fireEvent.click(screen.getByText('trigger'))
    await act(() => sleep(50))

    // It should not trigger revalidation
    await screen.findByText('data:bar')

    // It should never render `foo`.
    expect(logger).not.toHaveBeenCalledWith('foo')
  })

  it('should be able to configure auto revalidation from trigger', async () => {
    const key = createKey()
    const logger = jest.fn()

    function Page() {
      const { data } = useSWR(
        key,
        async () => {
          await sleep(10)
          return 'foo'
        },
        { revalidateOnMount: false }
      )
      const { trigger } = useSWRMutation(
        key,
        async () => {
          await sleep(20)
          return 'bar'
        },
        { populateCache: true }
      )

      logger(data)

      return (
        <div>
          <button onClick={() => trigger(undefined, { revalidate: false })}>
            trigger1
          </button>
          <button onClick={() => trigger(undefined, { revalidate: true })}>
            trigger2
          </button>
          <div>data:{data || 'none'}</div>
        </div>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('data:none')

    fireEvent.click(screen.getByText('trigger1'))
    await act(() => sleep(50))

    // It should not trigger revalidation
    await screen.findByText('data:bar')

    // It should never render `foo`.
    expect(logger).not.toHaveBeenCalledWith('foo')

    fireEvent.click(screen.getByText('trigger2'))
    await act(() => sleep(50))

    // It should trigger revalidation
    await screen.findByText('data:foo')
  })

  it('should be able to reset the state', async () => {
    const key = createKey()

    function Page() {
      const { data, trigger, reset } = useSWRMutation(key, async () => {
        return 'data'
      })

      return (
        <div>
          <button onClick={trigger}>trigger</button>
          <button onClick={reset}>reset</button>
          <div>data:{data || 'none'}</div>
        </div>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('data:none')

    fireEvent.click(screen.getByText('trigger'))

    // Cache is updated
    await screen.findByText('data:data')

    // reset
    fireEvent.click(screen.getByText('reset'))
    await screen.findByText('data:none')
  })

  it('should prevent race condition if reset the state', async () => {
    const key = createKey()
    const onSuccess = jest.fn()

    function Page() {
      const { data, trigger, reset } = useSWRMutation(key, async () => {
        await sleep(10)
        return 'data'
      })

      return (
        <div>
          <button onClick={() => trigger(undefined, { onSuccess })}>
            trigger
          </button>
          <button onClick={reset}>reset</button>
          <div>data:{data || 'none'}</div>
        </div>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('data:none')

    // start mutation
    fireEvent.click(screen.getByText('trigger'))

    // reset, before it ends
    fireEvent.click(screen.getByText('reset'))

    await act(() => sleep(30))
    await screen.findByText('data:none')
  })

  it('should prevent race condition if triggered multiple times', async () => {
    const key = createKey()
    const logger = []

    let id = 0
    function Page() {
      const { data, trigger } = useSWRMutation(key, async () => {
        await sleep(10)
        return id++
      })

      logger.push(data)

      return <button onClick={trigger}>trigger</button>
    }

    render(<Page />)

    // Mount
    await screen.findByText('trigger')

    // Start mutation multiple times, to break the previous one
    fireEvent.click(screen.getByText('trigger')) // 0
    await act(() => sleep(5))
    fireEvent.click(screen.getByText('trigger')) // 1
    await act(() => sleep(5))
    fireEvent.click(screen.getByText('trigger')) // 2
    await act(() => sleep(20))

    // Shouldn't have intermediate states
    expect(logger).toEqual([undefined, 2])
  })

  it('should error if no mutator is given', async () => {
    const key = createKey()
    const catchError = jest.fn()

    function Page() {
      const { trigger } = useSWRMutation(key, null)

      return (
        <div>
          <button onClick={() => trigger().catch(catchError)}>trigger</button>
        </div>
      )
    }

    render(<Page />)

    fireEvent.click(screen.getByText('trigger'))
    await nextTick()
    expect(catchError).toBeCalled()
  })

  it('should support optimistic updates', async () => {
    const key = createKey()

    function Page() {
      const { data } = useSWR(key, async () => {
        await sleep(10)
        return ['foo']
      })
      const { trigger } = useSWRMutation(
        key,
        async (_, { arg }: { arg: string }) => {
          await sleep(20)
          return arg.toUpperCase()
        }
      )

      return (
        <div>
          <button
            onClick={() =>
              trigger<typeof data>('bar', {
                optimisticData: current => [...current, 'bar'],
                populateCache: (added, current) => [...current, added],
                revalidate: false
              })
            }
          >
            trigger
          </button>
          <div>data:{JSON.stringify(data)}</div>
        </div>
      )
    }

    render(<Page />)

    // mount
    await screen.findByText('data:["foo"]')

    // optimistic update
    fireEvent.click(screen.getByText('trigger'))
    await screen.findByText('data:["foo","bar"]')
    await act(() => sleep(50))
    await screen.findByText('data:["foo","BAR"]')

    // 2nd check
    fireEvent.click(screen.getByText('trigger'))
    await screen.findByText('data:["foo","BAR","bar"]')
    await act(() => sleep(50))
    await screen.findByText('data:["foo","BAR","BAR"]')
  })

  it('should clear error after successful trigger', async () => {
    const key = createKey()

    let arg = false

    function Page() {
      const { error, trigger } = useSWRMutation(
        key,
        async (_, { arg: shouldReturnValue }: { arg: boolean }) => {
          await sleep(10)
          if (shouldReturnValue) return ['foo']
          throw new Error('error')
        }
      )

      return (
        <div>
          <button onClick={() => trigger(arg).catch(() => {})}>trigger</button>
          <div>Error: {error ? error.message : 'none'}</div>
        </div>
      )
    }

    render(<Page />)

    fireEvent.click(screen.getByText('trigger'))
    await screen.findByText('Error: error')

    arg = true

    fireEvent.click(screen.getByText('trigger'))
    await screen.findByText('Error: none')
  })

  it('should always use the latest fetcher', async () => {
    const key = createKey()

    function Page() {
      const [count, setCount] = useState(0)
      const { data, trigger } = useSWRMutation(key, () => count)

      return (
        <div>
          <button
            onClick={() => {
              setCount(c => c + 1)
            }}
          >
            ++
          </button>
          <button
            onClick={() => {
              trigger()
            }}
          >
            trigger
          </button>
          <div>
            data:{data},count:{count}
          </div>
        </div>
      )
    }

    render(<Page />)

    await screen.findByText('data:,count:0')
    fireEvent.click(screen.getByText('trigger'))
    await screen.findByText('data:0,count:0')

    fireEvent.click(screen.getByText('++'))
    await screen.findByText('data:0,count:1')

    fireEvent.click(screen.getByText('trigger'))
    await screen.findByText('data:1,count:1')
  })
})
