import { act, screen, fireEvent } from '@testing-library/react'
import React, { useEffect } from 'react'
import useSWR from 'swr'
import {
  createResponse,
  createKey,
  sleep,
  renderWithConfig,
  nextTick
} from './utils'

describe('useSWR - loading', () => {
  it('should return validating state', async () => {
    let renderCount = 0
    const key = createKey()
    function Page() {
      const { data, isValidating } = useSWR(key, () => createResponse('data'))
      renderCount++
      return (
        <div>
          hello, {data}, {isValidating ? 'validating' : 'ready'}
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('hello, , validating')

    await screen.findByText('hello, data, ready')
    //    data       isValidating
    // -> undefined, true
    // -> data,      false
    expect(renderCount).toEqual(2)
  })

  it('should return loading state', async () => {
    let renderCount = 0
    const key = createKey()
    function Page() {
      const { data, isLoading } = useSWR(key, () => createResponse('data'))
      renderCount++
      return (
        <div>
          hello, {data}, {isLoading ? 'loading' : 'ready'}
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('hello, , loading')

    await screen.findByText('hello, data, ready')
    //    data       isLoading
    // -> undefined, true
    // -> data,      false
    expect(renderCount).toEqual(2)
  })

  it('should avoid extra rerenders', async () => {
    let renderCount = 0
    const key = createKey()
    function Page() {
      // we never access `isValidating`, so it will not trigger rerendering
      const { data } = useSWR(key, () => createResponse('data'))
      renderCount++
      return <div>hello, {data}</div>
    }

    renderWithConfig(<Page />)

    await screen.findByText('hello, data')
    //    data
    // -> undefined
    // -> data
    expect(renderCount).toEqual(2)
  })

  it('should avoid extra rerenders while fetching', async () => {
    let renderCount = 0,
      dataLoaded = false

    const key = createKey()
    function Page() {
      // we never access anything
      useSWR(key, async () => {
        const res = await createResponse('data')
        dataLoaded = true
        return res
      })
      renderCount++
      return <div>hello</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('hello')

    await act(() => sleep(100)) // wait
    // it doesn't re-render, but fetch was triggered
    expect(renderCount).toEqual(1)
    expect(dataLoaded).toEqual(true)
  })

  it('should avoid extra rerenders is the data is the `same`', async () => {
    let renderCount = 0,
      initialDataLoaded = false,
      mutationDataLoaded = false

    const key = createKey()
    function Page() {
      const { data, mutate } = useSWR(
        key,
        async () => {
          const res = await createResponse({ greeting: 'hello' })
          initialDataLoaded = true
          return res
        },
        { fallbackData: { greeting: 'hello' } }
      )

      useEffect(() => {
        const timeout = setTimeout(
          () =>
            mutate(async () => {
              const res = await createResponse({ greeting: 'hello' })
              mutationDataLoaded = true
              return res
            }),
          200
        )

        return () => clearTimeout(timeout)
      }, [mutate])

      renderCount++
      return <div>{data?.greeting}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('hello')

    await act(() => sleep(1000)) // wait
    // it doesn't re-render, but fetch was triggered
    expect(initialDataLoaded).toEqual(true)
    expect(mutationDataLoaded).toEqual(true)
    expect(renderCount).toEqual(1)
  })

  it('should return enumerable object', async () => {
    // If the returned object is enumerable, we can use the spread operator
    // to deconstruct all the keys.

    function Page() {
      const swr = useSWR(createKey())
      return (
        <div>
          {Object.keys({ ...swr })
            .sort()
            .join(',')}
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('data,error,isLoading,isValidating,mutate')
  })

  it('should sync validating states', async () => {
    const key = createKey()
    const fetcher = jest.fn()

    function Foo() {
      const { isValidating } = useSWR(key, async () => {
        fetcher()
        return 'foo'
      })
      return isValidating ? <>validating</> : <>stopped</>
    }

    function Page() {
      return (
        <>
          <Foo />,<Foo />
        </>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('validating,validating')
    await nextTick()
    screen.getByText('stopped,stopped')
    expect(fetcher).toBeCalledTimes(1)
  })

  it('should sync all validating states if errored', async () => {
    const key = createKey()

    function Foo() {
      const { isValidating } = useSWR(key, async () => {
        throw new Error(key)
      })

      return isValidating ? <>validating</> : <>stopped</>
    }

    function Page() {
      return (
        <>
          <Foo />,<Foo />
        </>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('validating,validating')
    await nextTick()
    screen.getByText('stopped,stopped')
  })

  it('should sync all validating states if errored but paused', async () => {
    const key = createKey()
    let paused = false

    function Foo() {
      const { isValidating } = useSWR(key, {
        isPaused: () => paused,
        fetcher: async () => {
          await sleep(50)
          throw new Error(key)
        },
        dedupingInterval: 0
      })

      return isValidating ? <>validating</> : <>stopped</>
    }

    function Page() {
      const [mountSecondRequest, setMountSecondRequest] = React.useState(false)
      return (
        <>
          <Foo />,{mountSecondRequest ? <Foo /> : null}
          <br />
          <button onClick={() => setMountSecondRequest(true)}>start</button>
        </>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('validating,')
    await act(() => sleep(70))
    screen.getByText('stopped,')

    fireEvent.click(screen.getByText('start'))
    await act(() => sleep(20))
    screen.getByText('validating,validating')

    // Pause before it resolves
    paused = true
    await act(() => sleep(50))

    // They should both stop
    screen.getByText('stopped,stopped')
  })

  it('should not trigger loading state when revalidating', async () => {
    const key = createKey()
    let renderCount = 0
    function Page() {
      const { isLoading, isValidating, mutate } = useSWR(key, () =>
        createResponse('data', { delay: 10 })
      )
      renderCount++
      return (
        <div>
          <div>
            {isLoading ? 'loading' : 'ready'},
            {isValidating ? 'validating' : 'ready'}
          </div>
          <button onClick={() => mutate()}>revalidate</button>
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('loading,validating')
    await screen.findByText('ready,ready')

    fireEvent.click(screen.getByText('revalidate'))
    screen.getByText('ready,validating')
    await screen.findByText('ready,ready')

    // isValidating: true -> false -> true -> false
    expect(renderCount).toBe(4)
  })

  it('should trigger loading state when changing the key', async () => {
    function Page() {
      const [key, setKey] = React.useState(createKey)
      const { isLoading, isValidating } = useSWR(key, () =>
        createResponse('data', { delay: 10 })
      )
      return (
        <div>
          <div>
            {isLoading ? 'loading' : 'ready'},
            {isValidating ? 'validating' : 'ready'}
          </div>
          <button onClick={() => setKey(createKey())}>update key</button>
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('loading,validating')
    await screen.findByText('ready,ready')

    fireEvent.click(screen.getByText('update key'))
    screen.getByText('loading,validating')
    await screen.findByText('ready,ready')
  })
})
