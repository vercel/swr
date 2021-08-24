import { act, render, screen, fireEvent } from '@testing-library/react'
import React, { useEffect, useState } from 'react'
import useSWR, { mutate, useSWRConfig, SWRConfig } from 'swr'
import { serialize } from '../src/utils/serialize'
import { createResponse, sleep, nextTick, createKey } from './utils'

describe('useSWR - local mutation', () => {
  it('should trigger revalidation programmatically', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-7', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    render(<Page />)
    // hydration
    screen.getByText('data:')

    // mount
    await screen.findByText('data: 0')

    act(() => {
      // mutate and revalidate
      mutate('dynamic-7')
    })
    await screen.findByText('data: 1')
  })

  it('should share local state when no fetcher is specified', async () => {
    const useSharedState = (key, fallbackData) => {
      const { data: state, mutate: setState } = useSWR(key, { fallbackData })
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
    render(<Page />)
    const root = screen.getByText('huozhi:gardener')
    fireEvent.click(root)
    await screen.findByText('@huozhi:chef')
  })

  it('should trigger revalidation programmatically within a dedupingInterval', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-12', () => value++, {
        dedupingInterval: 2000
      })
      return <div>data: {data}</div>
    }

    render(<Page />)
    // hydration
    screen.getByText('data:')

    // mount
    await screen.findByText('data: 0')

    act(() => {
      // trigger revalidation
      mutate('dynamic-12')
    })
    await screen.findByText('data: 1')
  })

  it('should mutate the cache and revalidate', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-8', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    render(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: 0')

    act(() => {
      // mutate and revalidate
      mutate('dynamic-8', 'mutate')
    })
    await screen.findByText('data: 1')
  })

  it('should dedupe extra requests after mutation', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-13', () => value++, {
        dedupingInterval: 2000
      })
      useSWR('dynamic-13', () => value++, {
        dedupingInterval: 2000
      })
      return <div>data: {data}</div>
    }

    render(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: 0')
    act(() => {
      // mutate and revalidate
      mutate('dynamic-13')
    })
    await screen.findByText('data: 1')
  })

  it('should mutate the cache and revalidate in async', async () => {
    function Page() {
      const { data } = useSWR('dynamic-9', () => createResponse('truth'), {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    render(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: truth')

    act(() => {
      // mutate and revalidate
      mutate('dynamic-9', 'local')
    })

    await screen.findByText('data: local')

    // recovers
    await screen.findByText('data: truth')
  })

  it('should support async mutation with promise', async () => {
    function Page() {
      const { data } = useSWR('mutate-promise', () => 0, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    render(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: 0')

    await nextTick()
    await act(() => {
      // mutate and revalidate
      return mutate('mutate-promise', createResponse(999), false)
    })
    await screen.findByText('data: 999')
  })

  it('should support async mutation with async function', async () => {
    function Page() {
      const { data } = useSWR('mutate-async-fn', () => 0, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    render(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: 0')

    await nextTick()
    await act(() => {
      // mutate and revalidate
      return mutate('mutate-async-fn', async () => createResponse(999), false)
    })
    await screen.findByText('data: 999')
  })

  it('should trigger on mutation without data', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-14', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    render(<Page />)
    // hydration
    screen.getByText('data:')

    //mount
    await screen.findByText('data: 0')

    act(() => {
      // trigger revalidation
      mutate('dynamic-14')
    })
    await screen.findByText('data: 1')
  })

  it('should call function as data passing current cached value', async () => {
    let globalMutate

    function Page() {
      globalMutate = useSWRConfig().mutate
      const { data } = useSWR('dynamic-14', null)
      return <div>data: {data}</div>
    }

    function App() {
      // Prefill the cache with data
      return (
        <SWRConfig
          value={{ provider: () => new Map([['dynamic-15', 'cached data']]) }}
        >
          <Page />
        </SWRConfig>
      )
    }

    render(<App />)

    const callback = jest.fn()
    await globalMutate('dynamic-15', callback)
    expect(callback).toHaveBeenCalledWith('cached data')
  })

  it('should call function with undefined if key not cached', async () => {
    let globalCache, globalMutate

    function App() {
      const { cache, mutate: mutate_ } = useSWRConfig()
      globalCache = cache
      globalMutate = mutate_
      return null
    }

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <App />
      </SWRConfig>
    )

    const increment = jest.fn(currentValue =>
      currentValue == null ? undefined : currentValue + 1
    )

    await globalMutate('dynamic-15.1', increment, false)

    expect(increment).toHaveBeenCalledTimes(1)
    expect(increment).toHaveBeenLastCalledWith(undefined)
    expect(increment).toHaveLastReturnedWith(undefined)

    globalCache.set('dynamic-15.1', 42)

    await globalMutate('dynamic-15.1', increment, false)

    expect(increment).toHaveBeenCalledTimes(2)
    expect(increment).toHaveBeenLastCalledWith(42)
    expect(increment).toHaveLastReturnedWith(43)
  })

  it('should return results of the mutation', async () => {
    // returns the data if promise resolved
    expect(mutate('dynamic-16', Promise.resolve('data'))).resolves.toBe('data')

    // throw the error if promise rejected
    expect(
      mutate('dynamic-16', Promise.reject(new Error('error')))
    ).rejects.toBeInstanceOf(Error)
  })

  it('should get bound mutate from useSWR', async () => {
    function Page() {
      // eslint-disable-next-line no-shadow
      const { data, mutate: boundMutate } = useSWR(
        'dynamic-17',
        () => 'fetched'
      )
      return (
        <div onClick={() => boundMutate('mutated', false)}>data: {data}</div>
      )
    }

    render(<Page />)
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
    // set it to 1
    act(() => {
      mutate('mutate-2', 1)
    })

    function Section() {
      const { data } = useSWR('mutate-2', () =>
        createResponse(2, { delay: 150 })
      )
      return <div>{data}</div>
    }

    render(<Section />)
    screen.getByText('1') // directly from cache
    await act(() => sleep(100)) // still suspending
    act(() => {
      mutate('mutate-2', 3)
    }) // set it to 3. this will drop the ongoing request

    await screen.findByText('3')

    await act(() => sleep(100))
    screen.getByText('3')
  })

  it('should ignore in flight mutations when calling another async mutate', async () => {
    let value = 'off'
    function Page() {
      const { data } = useSWR('mutate-3', () =>
        createResponse(value, { delay: 100 })
      )

      return <div>{data}</div>
    }

    render(<Page />)

    await screen.findByText('off') // Initial state

    act(() => {
      mutate('mutate-3', 'on', false)
    })
    // Validate local state is now "on"
    await screen.findByText('on')

    // Simulate toggling "on"
    await act(async () => {
      expect(
        mutate(
          'mutate-3',
          () => {
            value = 'on'
            return createResponse('on', { delay: 100 })
          },
          false
        )
      ).resolves.toBe('on')
    })

    act(() => {
      mutate('mutate-3', 'off', false)
    })

    // Validate local state is now "off"
    await screen.findByText('off')

    // Simulate toggling "off"
    await act(async () => {
      expect(
        mutate(
          'mutate-3',
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
    let value = 0

    function Page() {
      const { data } = useSWR([null], () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    render(<Page />)
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
    let value = 0
    function Page() {
      const { data } = useSWR('dynamic-18', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    render(<Page />)
    screen.getByText('data:')

    // mount
    await screen.findByText('data: 0')

    let promise
    await act(() => {
      promise = mutate('dynamic-18')
      return promise
    })
    expect(promise).toBeInstanceOf(Promise) // mutate returns a promise
    expect(promise).resolves.toBe(1) // the return value should be the new cache
    screen.getByText('data: 1')
  })

  it('should update error in cache when mutate failed with error', async () => {
    const value = 0
    const key = 'mutate-4'
    const message = 'mutate-error'

    let globalCache, globalMutate
    function Page() {
      const { cache, mutate: mutate_ } = useSWRConfig()
      globalCache = cache
      globalMutate = mutate_
      const { data, error } = useSWR(key, () => value)
      return <div>{error ? error.message : `data: ${data}`}</div>
    }

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <Page />
      </SWRConfig>
    )

    // Mount
    await screen.findByText('data: 0')
    await act(async () => {
      // mutate error will be thrown, add try catch to avoid crashing
      try {
        await globalMutate(
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
    let cacheError = globalCache.get(keyErr)
    expect(cacheError.message).toMatchInlineSnapshot(`"${message}"`)

    // if mutate throws an error synchronously, the cache shouldn't be updated
    expect(globalCache.get(keyData)).toBe(value)

    // if mutate succeed, error should be cleared
    await act(() => globalMutate(key, value, false))
    cacheError = globalCache.get(keyErr)
    expect(cacheError).toMatchInlineSnapshot(`undefined`)
  })

  it('should keep the `mutate` function referential equal', async () => {
    const refs = []

    function Section() {
      const [key, setKey] = useState(null)
      const { data, mutate: boundMutate } = useSWR(key, () => createResponse(1))

      useEffect(() => {
        const timeout = setTimeout(() => setKey('mutate-5'), 50)
        return () => clearTimeout(timeout)
      }, [])

      refs.push(boundMutate)
      return <div>{data}</div>
    }

    render(<Section />)
    await act(() => sleep(100))
    act(() => {
      mutate('mutate-5', 2)
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

    function Component() {
      const { data, mutate: boundMutate } = useSWR('mutate-6', () => 0)

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

    render(<Component />)

    await act(() => sleep(50))
    expect(mutationRecivedValues).toEqual([0, 1])
    expect(renderRecivedValues).toEqual([undefined, 0, 1, 2])
  })

  it('async mutation case 1 (startAt <= MUTATION_TS[key])', async () => {
    let result = 0
    const fetcher = jest.fn(createResponse)
    function Component() {
      const { data, mutate: boundMutate } = useSWR(
        'mutate-7',
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

    render(<Component />)
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
    let result = 0
    const fetcher = jest.fn(createResponse)
    function Component() {
      const [key, setKey] = useState(null)
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
          'mutate-8',
          async () => {
            result += 1
            return createResponse(result, {
              delay: 200
            })
          },
          false
        )
        setKey('mutate-8')
      }, [])
      return (
        <div>{data !== undefined ? `data: ${data.toString()}` : 'loading'}</div>
      )
    }

    render(<Component />)
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
    let result = 0
    const fetcher = jest.fn(createResponse)
    function Component() {
      const [key, setKey] = useState(null)
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
        setKey('mutate-9')
        mutate(
          'mutate-9',
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

    render(<Component />)
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
    render(<Page />)
    screen.getByText('false')
  })
})
