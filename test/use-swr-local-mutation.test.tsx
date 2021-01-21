import { act, render, screen, fireEvent } from '@testing-library/react'
import React, { useEffect, useState } from 'react'
import useSWR, { mutate, cache } from '../src'
import { sleep } from './utils'

describe('useSWR - local mutation', () => {
  it('should trigger revalidation programmatically', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-7', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)

    // mount
    await screen.findByText('data: 0')

    act(() => {
      // mutate and revalidate
      mutate('dynamic-7')
    })
    await act(() => sleep(1))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should trigger revalidation programmatically within a dedupingInterval', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-12', () => value++, {
        dedupingInterval: 2000
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')

    act(() => {
      // trigger revalidation
      mutate('dynamic-12')
    })
    await act(() => sleep(1))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should mutate the cache and revalidate', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-8', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)

    //mount
    await screen.findByText('data: 0')

    act(() => {
      // mutate and revalidate
      mutate('dynamic-8', 'mutate')
    })
    await act(() => sleep(1))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
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
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)

    //mount
    await screen.findByText('data: 0')
    act(() => {
      // mutate and revalidate
      mutate('dynamic-13')
    })
    await act(() => sleep(1))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should mutate the cache and revalidate in async', async () => {
    function Page() {
      const { data } = useSWR(
        'dynamic-9',
        () => new Promise(res => setTimeout(() => res('truth'), 200)),
        { dedupingInterval: 0 }
      )
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    //mount
    await screen.findByText('data: truth')

    act(() => {
      // mutate and revalidate
      mutate('dynamic-9', 'local')
    })
    await act(() => sleep(1))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"data: local"`
    )

    await act(() => sleep(200)) // recovers

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"data: truth"`
    )
  })

  it('should support async mutation with promise', async () => {
    function Page() {
      const { data } = useSWR('mutate-promise', () => 0, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.textContent).toMatchInlineSnapshot(`"data: "`)

    //mount
    await screen.findByText('data: 0')
    await act(() => sleep(1))
    await act(() => {
      // mutate and revalidate
      return mutate(
        'mutate-promise',
        new Promise(res => setTimeout(() => res(999), 100)),
        false
      )
    })
    await act(() => sleep(110))
    expect(container.textContent).toMatchInlineSnapshot(`"data: 999"`)
  })

  it('should support async mutation with async function', async () => {
    function Page() {
      const { data } = useSWR('mutate-async-fn', () => 0, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.textContent).toMatchInlineSnapshot(`"data: "`)

    //mount
    await screen.findByText('data: 0')

    await act(() => {
      // mutate and revalidate
      return mutate(
        'mutate-async-fn',
        async () => new Promise(res => setTimeout(() => res(999), 100)),
        false
      )
    })
    await act(() => sleep(110))

    expect(container.textContent).toMatchInlineSnapshot(`"data: 999"`)
  })

  it('should trigger on mutation without data', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-14', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)

    //mount
    await screen.findByText('data: 0')

    act(() => {
      // trigger revalidation
      mutate('dynamic-14')
    })
    await act(() => sleep(1))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should call function as data passing current cached value', async () => {
    // prefill cache with data
    cache.set('dynamic-15', 'cached data')
    const callback = jest.fn()
    await mutate('dynamic-15', callback)
    expect(callback).toHaveBeenCalledWith('cached data')
  })

  it('should call function with undefined if key not cached', async () => {
    const increment = jest.fn(currentValue =>
      currentValue == null ? undefined : currentValue + 1
    )

    await mutate('dynamic-15.1', increment, false)

    expect(increment).toHaveBeenCalledTimes(1)
    expect(increment).toHaveBeenLastCalledWith(undefined)
    expect(increment).toHaveLastReturnedWith(undefined)

    cache.set('dynamic-15.1', 42)

    await mutate('dynamic-15.1', increment, false)

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
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    //mount
    await screen.findByText('data: fetched')
    // call bound mutate
    fireEvent.click(container.firstElementChild)
    // expect new updated value (after a tick)
    await act(async () => await 0)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"data: mutated"`
    )
  })

  it('should ignore in flight requests when mutating', async () => {
    // set it to 1
    act(() => {
      mutate('mutate-2', 1)
    })

    function Section() {
      const { data } = useSWR(
        'mutate-2',
        () => new Promise(res => setTimeout(() => res(2), 200))
      )
      return <div>{data}</div>
    }

    const { container } = render(<Section />)

    expect(container.textContent).toMatchInlineSnapshot(`"1"`) // directly from cache
    await act(() => sleep(150)) // still suspending
    act(() => {
      mutate('mutate-2', 3)
    }) // set it to 3. this will drop the ongoing request
    await act(async () => await 0)
    expect(container.textContent).toMatchInlineSnapshot(`"3"`)
    await act(() => sleep(100))
    expect(container.textContent).toMatchInlineSnapshot(`"3"`)
  })

  it('should ignore in flight mutations when calling another async mutate', async () => {
    let value = 'off'
    function Page() {
      const { data } = useSWR(
        'mutate-3',
        () => new Promise(res => setTimeout(() => res(value), 200))
      )

      return <div>{data}</div>
    }

    const { container } = render(<Page />)

    await act(() => sleep(250))
    expect(container.textContent).toMatchInlineSnapshot(`"off"`) // Initial state

    act(() => {
      mutate('mutate-3', 'on', false)
    })

    // Validate local state is now "on"
    await act(async () => await 0)
    expect(container.textContent).toMatchInlineSnapshot(`"on"`)

    // Simulate toggling "on"
    await act(async () => {
      expect(
        mutate(
          'mutate-3',
          new Promise(res =>
            setTimeout(() => {
              value = 'on'
              res('on')
            }, 200)
          ),
          false
        )
      ).resolves.toBe('on')
    })

    act(() => {
      mutate('mutate-3', 'off', false)
    })

    // Validate local state is now "off"
    await act(async () => await 0)
    expect(container.textContent).toMatchInlineSnapshot(`"off"`)

    // Simulate toggling "off"
    await act(async () => {
      expect(
        mutate(
          'mutate-3',
          new Promise(res =>
            setTimeout(() => {
              value = 'off'
              res('off')
            }, 400)
          ),
          false
        )
      ).resolves.toBe('off')
    })

    // Wait for toggling "on" promise to resolve, but the "on" mutation is cancelled
    await act(() => sleep(210))
    expect(container.textContent).toMatchInlineSnapshot(`"off"`)

    // Wait for toggling "off" promise to resolve
    await act(() => sleep(210))
    expect(container.textContent).toMatchInlineSnapshot(`"off"`)
  })

  it('null is stringified when found inside an array', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR([null], () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    //mount
    await screen.findByText('data: 0')
    act(() => {
      // trigger revalidation
      mutate([null])
    })
    await act(() => sleep(1))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should return promise from mutate without data', async () => {
    let value = 0
    function Page() {
      const { data } = useSWR('dynamic-18', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')
    let promise
    await act(() => {
      promise = mutate('dynamic-18')
      return promise
    })
    expect(promise).toBeInstanceOf(Promise) // mutate returns a promise
    expect(promise).resolves.toBe(1) // the return value should be the new cache
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should update error in cache when mutate failed with error', async () => {
    const value = 0
    const key = 'mutate-4'
    const message = 'mutate-error'
    function Page() {
      const { data, error } = useSWR(key, () => value)
      return <div>{error ? error.message : `data: ${data}`}</div>
    }
    const { container } = render(<Page />)
    //mount
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

    const [, , keyErr] = cache.serializeKey(key)
    let cacheError = cache.get(keyErr)
    expect(cacheError.message).toMatchInlineSnapshot(`"${message}"`)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"${message}"`
    )
    // if mutate succeed, error should be cleared
    await act(async () => {
      return mutate(key, value, false)
    })
    cacheError = cache.get(keyErr)
    expect(cacheError).toMatchInlineSnapshot(`undefined`)
  })

  it('should keep the `mutate` function referential equal', async () => {
    const refs = []

    function Section() {
      const [key, setKey] = useState(null)
      const { data, mutate: boundMutate } = useSWR(
        key,
        () => new Promise(res => setTimeout(() => res(1), 10))
      )

      useEffect(() => {
        const timeout = setTimeout(() => setKey('mutate-5'), 100)
        return () => clearTimeout(timeout)
      }, [])

      refs.push(boundMutate)
      return <div>{data}</div>
    }

    render(<Section />)
    await act(() => sleep(120))
    act(() => {
      mutate('mutate-5', 2)
    })
    await act(() => sleep(50))

    // check all `setSize`s are referential equal.
    for (let ref of refs) {
      expect(ref).toEqual(refs[0])
    }
  })

  it('should dedupe synchronous mutations', async () => {
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
    expect(renderRecivedValues).toEqual([undefined, 0, 2])
  })
})
