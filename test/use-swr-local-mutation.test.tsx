import { act, screen, fireEvent } from '@testing-library/react'
import React, { useEffect, useState } from 'react'
import useSWR, { mutate as globalMutate, useSWRConfig } from 'swr'
import { serialize } from '../src/utils/serialize'
import {
  createResponse,
  sleep,
  nextTick,
  createKey,
  renderWithConfig,
  renderWithGlobalCache
} from './utils'

describe('useSWR - local mutation', () => {
  it('should trigger revalidation programmatically', async () => {
    let value = 0,
      mutate
    const key = createKey()
    function Page() {
      mutate = useSWRConfig().mutate
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

    act(() => {
      // mutate and revalidate
      mutate(key)
    })
    await screen.findByText('data: 1')
  })

  it('should share local state when no fetcher is specified', async () => {
    const baseKey = createKey()
    const useSharedState = (key, fallbackData) => {
      const { data: state, mutate: setState } = useSWR(`${baseKey}--${key}`, {
        fallbackData
      })
      return [state, setState]
    }

    function Page() {
      const [name, setName] = useSharedState('name', 'huozhi')
      const [job, setJob] = useSharedState('job', 'gardener')

      return (
        <span
          onClick={() => {
            setName('@huozhi')
            setJob('chef')
          }}
        >
          {name}:{job}
        </span>
      )
    }
    renderWithConfig(<Page />)
    const root = screen.getByText('huozhi:gardener')
    fireEvent.click(root)
    await screen.findByText('@huozhi:chef')
  })

  it('should trigger revalidation programmatically within a dedupingInterval', async () => {
    let value = 0,
      mutate

    const key = createKey()
    function Page() {
      mutate = useSWRConfig().mutate
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 2000
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    // mount
    await screen.findByText('data: 0')

    act(() => {
      // trigger revalidation
      mutate(key)
    })
    await screen.findByText('data: 1')
  })

  it('should mutate the cache and revalidate', async () => {
    let value = 0,
      mutate

    const key = createKey()
    function Page() {
      mutate = useSWRConfig().mutate
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: 0')

    act(() => {
      // mutate and revalidate
      mutate(key, 'mutate')
    })
    await screen.findByText('data: 1')
  })

  it('should dedupe extra requests after mutation', async () => {
    let value = 0,
      mutate

    const key = createKey()
    function Page() {
      mutate = useSWRConfig().mutate
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 2000
      })

      useSWR(key, () => value++, {
        dedupingInterval: 2000
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: 0')
    act(() => {
      // mutate and revalidate
      mutate(key)
    })
    await screen.findByText('data: 1')
  })

  it('should mutate the cache and revalidate in async', async () => {
    let mutate
    const key = createKey()
    function Page() {
      mutate = useSWRConfig().mutate
      const { data } = useSWR(key, () => createResponse('truth'), {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: truth')

    act(() => {
      // mutate and revalidate
      mutate(key, 'local')
    })

    await screen.findByText('data: local')

    // recovers
    await screen.findByText('data: truth')
  })

  it('should support async mutation with promise', async () => {
    let mutate
    const key = createKey()
    function Page() {
      mutate = useSWRConfig().mutate
      const { data } = useSWR(key, () => 0, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: 0')

    await nextTick()
    await act(() => {
      // mutate and revalidate
      return mutate(key, createResponse(999), false)
    })
    await screen.findByText('data: 999')
  })

  it('should support async mutation with async function', async () => {
    let mutate
    const key = createKey()
    function Page() {
      mutate = useSWRConfig().mutate
      const { data } = useSWR(key, () => 0, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: 0')

    await nextTick()
    await act(() => {
      // mutate and revalidate
      return mutate(key, async () => createResponse(999), false)
    })
    await screen.findByText('data: 999')
  })

  it('should trigger on mutation without data', async () => {
    let value = 0,
      mutate

    const key = createKey()
    function Page() {
      mutate = useSWRConfig().mutate
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: 0')

    act(() => {
      // trigger revalidation
      mutate(key)
    })
    await screen.findByText('data: 1')
  })

  it('should call function as data passing current cached value', async () => {
    let mutate

    const key = createKey()
    function Page() {
      mutate = useSWRConfig().mutate
      const { data } = useSWR(key, null)
      return <div>data: {data}</div>
    }

    // Prefill the cache with data
    renderWithConfig(<Page />, {
      provider: () => new Map([[key, 'cached data']])
    })

    const callback = jest.fn()
    await act(() => mutate(key, callback))
    expect(callback).toHaveBeenCalledWith('cached data')
  })

  it('should call function with undefined if key not cached', async () => {
    let cache, mutate

    function App() {
      const { cache: cache_, mutate: mutate_ } = useSWRConfig()
      cache = cache_
      mutate = mutate_
      return null
    }

    renderWithConfig(<App />)

    const increment = jest.fn(currentValue =>
      currentValue == null ? undefined : currentValue + 1
    )

    const key = createKey()
    await mutate(key, increment, false)

    expect(increment).toHaveBeenCalledTimes(1)
    expect(increment).toHaveBeenLastCalledWith(undefined)
    expect(increment).toHaveLastReturnedWith(undefined)

    cache.set(key, 42)

    await mutate(key, increment, false)

    expect(increment).toHaveBeenCalledTimes(2)
    expect(increment).toHaveBeenLastCalledWith(42)
    expect(increment).toHaveLastReturnedWith(43)
  })

  it('should return results of the mutation', async () => {
    const key = createKey()
    // returns the data if promise resolved
    expect(globalMutate(key, Promise.resolve('data'))).resolves.toBe('data')

    // throw the error if promise rejected
    expect(
      globalMutate(key, Promise.reject(new Error('error')))
    ).rejects.toBeInstanceOf(Error)
  })

  it('should get bound mutate from useSWR', async () => {
    const key = createKey()
    function Page() {
      // eslint-disable-next-line no-shadow
      const { data, mutate: boundMutate } = useSWR(key, () => 'fetched')
      return (
        <div onClick={() => boundMutate('mutated', false)}>data: {data}</div>
      )
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: fetched')

    // call bound mutate
    fireEvent.click(screen.getByText('data: fetched'))
    // expect new updated value (after a tick)
    await screen.findByText('data: mutated')
  })

  it('should ignore in flight requests when mutating', async () => {
    const key = createKey()
    // set it to 1
    act(() => {
      globalMutate(key, 1)
    })

    function Section() {
      const { data } = useSWR(key, () => createResponse(2, { delay: 150 }))
      return <div>{data}</div>
    }

    renderWithGlobalCache(<Section />)
    screen.getByText('1') // directly from cache
    await act(() => sleep(100)) // still suspending
    act(() => {
      globalMutate(key, 3)
    }) // set it to 3. this will drop the ongoing request

    await screen.findByText('3')

    await act(() => sleep(100))
    screen.getByText('3')
  })

  it('should ignore in flight mutations when calling another async mutate', async () => {
    let value = 'off',
      mutate
    const key = createKey()
    function Page() {
      mutate = useSWRConfig().mutate
      const { data } = useSWR(key, () => createResponse(value, { delay: 100 }))

      return <div>{data}</div>
    }

    renderWithConfig(<Page />)

    await screen.findByText('off') // Initial state

    act(() => {
      mutate(key, 'on', false)
    })
    // Validate local state is now "on"
    await screen.findByText('on')

    // Simulate toggling "on"
    await act(async () => {
      expect(
        mutate(
          key,
          () => {
            value = 'on'
            return createResponse('on', { delay: 100 })
          },
          false
        )
      ).resolves.toBe('on')
    })

    act(() => {
      mutate(key, 'off', false)
    })

    // Validate local state is now "off"
    await screen.findByText('off')

    // Simulate toggling "off"
    await act(async () => {
      expect(
        mutate(
          key,
          () => {
            value = 'off'
            return createResponse('off', { delay: 100 })
          },
          false
        )
      ).resolves.toBe('off')
    })

    // Wait for toggling "on" promise to resolve, but the "on" mutation is cancelled
    await act(() => sleep(50))
    screen.getByText('off')

    // Wait for toggling "off" promise to resolve
    await act(() => sleep(100))
    screen.getByText('off')
  })

  it('null is stringified when found inside an array', async () => {
    let value = 0,
      mutate

    function Page() {
      mutate = useSWRConfig().mutate
      const { data } = useSWR([null], () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: 0')

    act(() => {
      // trigger revalidation
      mutate([null])
    })
    await screen.findByText('data: 1')
  })

  it('should return promise from mutate without data', async () => {
    let value = 0,
      mutate
    const key = createKey()
    function Page() {
      mutate = useSWRConfig().mutate
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    // mount
    await screen.findByText('data: 0')

    let promise
    await act(() => {
      promise = mutate(key)
      return promise
    })
    expect(promise).toBeInstanceOf(Promise) // mutate returns a promise
    expect(promise).resolves.toBe(1) // the return value should be the new cache
    screen.getByText('data: 1')
  })

  it('should update error in cache when mutate failed with error', async () => {
    const value = 0
    const key = createKey()
    const message = 'mutate-error'

    let cache, mutate
    function Page() {
      const { cache: cache_, mutate: mutate_ } = useSWRConfig()
      cache = cache_
      mutate = mutate_
      const { data, error } = useSWR(key, () => value)
      return <div>{error ? error.message : `data: ${data}`}</div>
    }

    renderWithConfig(<Page />)

    // Mount
    await screen.findByText('data: 0')
    await act(async () => {
      // mutate error will be thrown, add try catch to avoid crashing
      try {
        await mutate(
          key,
          () => {
            throw new Error(message)
          },
          false
        )
      } catch (e) {
        // do nothing
      }
    })

    screen.getByText(message)
    const [keyData, , keyErr] = serialize(key)
    let cacheError = cache.get(keyErr)
    expect(cacheError.message).toMatchInlineSnapshot(`"${message}"`)

    // if mutate throws an error synchronously, the cache shouldn't be updated
    expect(cache.get(keyData)).toBe(value)

    // if mutate succeed, error should be cleared
    await act(() => mutate(key, value, false))
    cacheError = cache.get(keyErr)
    expect(cacheError).toMatchInlineSnapshot(`undefined`)
  })

  it('should keep the `mutate` function referential equal', async () => {
    const refs = []

    let mutate
    const updatedKey = createKey()
    function Section() {
      mutate = useSWRConfig().mutate
      const [key, setKey] = useState(null)
      const { data, mutate: boundMutate } = useSWR(key, () => createResponse(1))

      useEffect(() => {
        const timeout = setTimeout(() => setKey(updatedKey), 50)
        return () => clearTimeout(timeout)
      }, [])

      refs.push(boundMutate)
      return <div>{data}</div>
    }

    renderWithConfig(<Section />)
    await act(() => sleep(100))
    act(() => {
      mutate(updatedKey, 2)
    })
    await act(() => sleep(50))

    // check all `setSize`s are referential equal.
    for (const ref of refs) {
      expect(ref).toEqual(refs[0])
    }
  })

  // https://github.com/vercel/swr/pull/1003
  it('should not dedupe synchronous mutations', async () => {
    const mutationRecivedValues = []
    const renderRecivedValues = []

    const key = createKey()
    function Component() {
      const { data, mutate: boundMutate } = useSWR(key, () => 0)

      useEffect(() => {
        setTimeout(() => {
          // let's mutate twice, synchronously
          boundMutate(v => {
            mutationRecivedValues.push(v) // should be 0
            return 1
          }, false)
          boundMutate(v => {
            mutationRecivedValues.push(v) // should be 1
            return 2
          }, false)
        }, 1)
        // the mutate function is guaranteed to be the same reference
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      renderRecivedValues.push(data) // should be 0 -> 2, never render 1 in between
      return null
    }

    renderWithConfig(<Component />)

    await act(() => sleep(50))
    expect(mutationRecivedValues).toEqual([0, 1])
    expect(renderRecivedValues).toEqual([undefined, 0, 1, 2])
  })

  it('async mutation case 1 (startAt <= MUTATION_TS[key])', async () => {
    let result = 0
    const key = createKey()
    const fetcher = jest.fn(createResponse)
    function Component() {
      const { data, mutate: boundMutate } = useSWR(
        key,
        () =>
          fetcher(0, {
            delay: 300
          }),
        {
          dedupingInterval: 200
        }
      )
      return (
        <div
          onClick={() => {
            boundMutate(async () => {
              result += 1
              return createResponse(result, {
                delay: 100
              })
            }, false)
          }}
        >
          {data !== undefined ? `data: ${data.toString()}` : 'loading'}
        </div>
      )
    }

    renderWithConfig(<Component />)
    screen.getByText('loading')

    await act(() => sleep(50))

    fireEvent.click(screen.getByText('loading'))

    await act(() => sleep(100))
    // mutate success
    await screen.findByText('data: 1')

    await act(() => sleep(150))
    // fetcher result should be ignored
    expect(fetcher).toBeCalledTimes(1)
    await screen.findByText('data: 1')
  })

  it('async mutation case 2 (startAt <= MUTATION_END_TS[key])', async () => {
    let result = 0,
      mutate
    const fetcher = jest.fn(createResponse)
    const updatedKey = createKey()
    function Component() {
      const [key, setKey] = useState(null)
      mutate = useSWRConfig().mutate
      const { data } = useSWR(
        key,
        () =>
          fetcher(0, {
            delay: 400
          }),
        {
          dedupingInterval: 200
        }
      )
      useEffect(() => {
        mutate(
          updatedKey,
          async () => {
            result += 1
            return createResponse(result, {
              delay: 200
            })
          },
          false
        )
        setKey(updatedKey)
      }, [])
      return (
        <div>{data !== undefined ? `data: ${data.toString()}` : 'loading'}</div>
      )
    }

    renderWithConfig(<Component />)
    screen.getByText('loading')

    // mutate success
    await act(() => sleep(200))
    fireEvent.click(screen.getByText('data: 1'))

    // fetcher result should be ignored
    await act(() => sleep(200))
    expect(fetcher).toBeCalledTimes(1)
    await screen.findByText('data: 1')
  })

  it('async mutation case 3 (MUTATION_END_TS[key] === 0)', async () => {
    let result = 0,
      mutate
    const fetcher = jest.fn(createResponse)
    const updatedKey = createKey()
    function Component() {
      const [key, setKey] = useState(null)
      mutate = useSWRConfig().mutate
      const { data } = useSWR(
        key,
        () =>
          fetcher(0, {
            delay: 100
          }),
        {
          dedupingInterval: 200
        }
      )
      useEffect(() => {
        setKey(updatedKey)
        mutate(
          updatedKey,
          async () => {
            result += 1
            return createResponse(result, { delay: 200 })
          },
          false
        )
      }, [])
      return (
        <div>{data !== undefined ? `data: ${data.toString()}` : 'loading'}</div>
      )
    }

    renderWithConfig(<Component />)
    screen.getByText('loading')

    // fetcher result should be ignored
    await act(() => sleep(100))
    expect(fetcher).toBeCalledTimes(1)
    screen.getByText('loading')

    // mutate success
    await act(() => sleep(100))
    await screen.findByText('data: 1')
  })

  it('isValidating should be false when no fetcher is provided', async () => {
    const key = createKey()
    function Page() {
      const { isValidating } = useSWR(key)
      return <p>{isValidating.toString()}</p>
    }
    renderWithConfig(<Page />)
    screen.getByText('false')
  })

  it('bound mutate should always use the latest key', async () => {
    const key = createKey()
    const fetcher = jest.fn(() => 'data')
    function Page() {
      const [ready, setReady] = useState(false)
      const { mutate: boundMutate } = useSWR(ready ? key : null, fetcher)
      return (
        <div>
          <button onClick={() => setReady(true)}>set ready</button>
          <button onClick={() => boundMutate()}>mutate</button>
        </div>
      )
    }
    renderWithConfig(<Page />)
    screen.getByText('set ready')

    expect(fetcher).toBeCalledTimes(0)

    // it should trigger the fetch
    fireEvent.click(screen.getByText('set ready'))
    await act(() => sleep(10))
    expect(fetcher).toBeCalledTimes(1)

    // it should trigger the fetch again
    fireEvent.click(screen.getByText('mutate'))
    await act(() => sleep(10))
    expect(fetcher).toBeCalledTimes(2)
  })

  it('should reset isValidating after mutate', async () => {
    const key = createKey()
    function Data() {
      const { data, isValidating } = useSWR(key, () =>
        createResponse('data', { delay: 30 })
      )
      const { cache } = useSWRConfig()
      const [, , , keyValidating] = serialize(key)
      const cacheIsValidating = cache.get(keyValidating) || false
      return (
        <>
          <p>data:{data}</p>
          <p>isValidating:{isValidating.toString()}</p>
          <p>cache:validating:{cacheIsValidating.toString()}</p>
        </>
      )
    }

    function Page() {
      const { mutate: boundMutate } = useSWR(key, () =>
        createResponse('data', { delay: 30 })
      )
      const [visible, setVisible] = useState(false)

      return (
        <div>
          <button onClick={() => boundMutate(() => 'data', false)}>
            preload
          </button>
          <button onClick={() => setVisible(true)}>show</button>
          {visible && <Data />}
        </div>
      )
    }
    renderWithConfig(<Page />)

    fireEvent.click(screen.getByText('preload'))
    await act(() => sleep(20))
    fireEvent.click(screen.getByText('show'))
    screen.getByText('data:data')
    screen.getByText('isValidating:true')
    await act(() => sleep(20))
    screen.getByText('data:data')
    screen.getByText('isValidating:false')
  })

  it('should be able to mutate data to undefined', async () => {
    const key = createKey()
    function Page() {
      const { data, mutate } = useSWR(key, () => 'foo')
      return (
        <>
          <div>data: {String(data)}</div>
          <button onClick={() => mutate(undefined, false)}>mutate</button>
        </>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText('data: foo')

    fireEvent.click(screen.getByText('mutate'))
    await screen.findByText('data: undefined')
  })

  it('should be able to mutate data to undefined asynchronously', async () => {
    const key = createKey()
    function Page() {
      const { data, mutate } = useSWR(key, () => 'foo')
      return (
        <>
          <div>data: {String(data)}</div>
          <button
            onClick={() =>
              mutate(
                () => new Promise(res => setTimeout(() => res(undefined), 10)),
                false
              )
            }
          >
            mutate
          </button>
        </>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText('data: foo')

    fireEvent.click(screen.getByText('mutate'))
    await screen.findByText('data: undefined')
  })

  // https://github.com/vercel/swr/issues/482
  it('should be able to deduplicate multiple mutate calls', async () => {
    const key = createKey()
    const loggedData = []

    function Page() {
      const { data, mutate } = useSWR(key, () => 'foo')

      useEffect(() => {
        async function startMutation() {
          await sleep(10)
          mutate('sync1', false)
          mutate(createResponse('async1', { delay: 50 }), false)
          await sleep(10)
          mutate('sync2', false)
          mutate(createResponse('async2', { delay: 50 }), false)
          await sleep(10)
          mutate('sync3', false)
          mutate(createResponse('async3', { delay: 50 }), false)
        }

        startMutation()
      }, [])

      loggedData.push(data)
      return null
    }

    renderWithConfig(<Page />)
    await act(() => sleep(200))

    // Only "async3" is left and others were deduped.
    expect(loggedData).toEqual([
      undefined,
      'foo',
      'sync1',
      'sync2',
      'sync3',
      'async3'
    ])
  })
})
