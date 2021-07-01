import { act, fireEvent, render, screen } from '@testing-library/react'
import React, { useState } from 'react'
import useSWR, { createCache, SWRConfig } from '../src'
import { sleep } from './utils'

// This has to be an async function to wait a microtask to flush updates
const advanceTimers = async (ms: number) => jest.advanceTimersByTime(ms)

// This test heavily depends on setInterval/setTimeout timers, which makes tests slower and flaky.
// So we use Jest's fake timers
describe('useSWR - refresh', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })
  afterAll(() => {
    jest.useRealTimers()
  })
  it('should rerender automatically on interval', async () => {
    let count = 0

    function Page() {
      const { data } = useSWR('dynamic-1', () => count++, {
        refreshInterval: 200,
        dedupingInterval: 100
      })
      return <div>count: {data}</div>
    }

    render(<Page />)

    // hydration
    screen.getByText('count:')

    // mount
    await screen.findByText('count: 0')

    await act(() => advanceTimers(200)) // update
    screen.getByText('count: 1')
    await act(() => advanceTimers(50)) // no update
    screen.getByText('count: 1')
    await act(() => advanceTimers(150)) // update
    screen.getByText('count: 2')
  })

  it('should dedupe requests combined with intervals', async () => {
    let count = 0

    function Page() {
      const { data } = useSWR('dynamic-2', () => count++, {
        refreshInterval: 100,
        dedupingInterval: 500
      })
      return <div>count: {data}</div>
    }

    render(<Page />)

    // hydration
    screen.getByText('count:')

    // mount
    await screen.findByText('count: 0')

    await act(() => advanceTimers(100)) // no update (deduped)
    screen.getByText('count: 0')
    await act(() => advanceTimers(400)) // reach dudupingInterval
    await act(() => advanceTimers(100)) // update
    screen.getByText('count: 1')
    await act(() => advanceTimers(100)) // no update (deduped)
    screen.getByText('count: 1')
    await act(() => advanceTimers(400)) // reach dudupingInterval
    await act(() => advanceTimers(100)) // update
    screen.getByText('count: 2')
  })

  it('should update data upon interval changes', async () => {
    let count = 0
    function Page() {
      const [int, setInt] = React.useState(100)
      const { data } = useSWR('/api', () => count++, {
        refreshInterval: int,
        dedupingInterval: 50
      })
      return (
        <div onClick={() => setInt(num => (num < 200 ? num + 50 : 0))}>
          count: {data}
        </div>
      )
    }

    render(<Page />)
    screen.getByText('count:')

    // mount
    await screen.findByText('count: 0')

    await act(() => advanceTimers(100))
    screen.getByText('count: 1')
    await act(() => advanceTimers(50))
    screen.getByText('count: 1')
    await act(() => advanceTimers(50))
    screen.getByText('count: 2')
    fireEvent.click(screen.getByText('count: 2'))

    await act(() => advanceTimers(100))

    screen.getByText('count: 2')

    await act(() => advanceTimers(50))

    screen.getByText('count: 3')

    await act(() => advanceTimers(150))
    screen.getByText('count: 4')
    fireEvent.click(screen.getByText('count: 4'))
    await act(() => {
      // it will clear 150ms timer and setup a new 200ms timer
      return advanceTimers(150)
    })
    screen.getByText('count: 4')
    await act(() => advanceTimers(50))
    screen.getByText('count: 5')
    fireEvent.click(screen.getByText('count: 5'))
    await act(() => {
      // it will clear 200ms timer and stop
      return advanceTimers(50)
    })
    screen.getByText('count: 5')
    await act(() => advanceTimers(50))
    screen.getByText('count: 5')
  })

  it('should update data upon interval changes -- changes happened during revalidate', async () => {
    let count = 0
    const STOP_POLLING_THRESHOLD = 2
    function Page() {
      const [flag, setFlag] = useState(0)
      const shouldPoll = flag < STOP_POLLING_THRESHOLD
      const { data } = useSWR(
        '/interval-changes-during-revalidate',
        () => count++,
        {
          refreshInterval: shouldPoll ? 100 : 0,
          dedupingInterval: 50,
          onSuccess() {
            setFlag(value => value + 1)
          }
        }
      )
      return (
        <div onClick={() => setFlag(0)}>
          count: {data} {flag}
        </div>
      )
    }

    render(<Page />)
    screen.getByText('count: 0')

    await screen.findByText('count: 0 1')

    await act(() => advanceTimers(100))

    screen.getByText('count: 1 2')

    await act(() => advanceTimers(100))
    screen.getByText('count: 1 2')

    await act(() => advanceTimers(100))
    screen.getByText('count: 1 2')

    await act(() => advanceTimers(100))
    screen.getByText('count: 1 2')

    fireEvent.click(screen.getByText('count: 1 2'))

    await act(() => {
      // it will setup a new 100ms timer
      return advanceTimers(50)
    })

    screen.getByText('count: 1 0')

    await act(() => advanceTimers(50))

    screen.getByText('count: 2 1')

    await act(() => advanceTimers(100))

    screen.getByText('count: 3 2')

    await act(() => advanceTimers(100))

    screen.getByText('count: 3 2')

    await act(() => advanceTimers(100))

    screen.getByText('count: 3 2')
  })

  it('should allow use custom compare method', async () => {
    let count = 0
    const key = 'dynamic-11'
    const fetcher = jest.fn(() => ({
      timestamp: ++count,
      version: '1.0'
    }))
    function Page() {
      const { data, mutate: change } = useSWR(key, fetcher, {
        compare: function compare(a, b) {
          if (a === b) {
            return true
          }
          if (!a || !b) {
            return false
          }
          return a.version === b.version
        }
      })

      if (!data) {
        return <div>loading</div>
      }
      return <button onClick={() => change()}>{data.timestamp}</button>
    }

    const customCache = new Map()
    const { cache } = createCache(customCache)
    render(
      <SWRConfig value={{ cache }}>
        <Page />
      </SWRConfig>
    )

    screen.getByText('loading')

    await screen.findByText('1')
    expect(fetcher).toBeCalledTimes(1)
    expect(fetcher).toReturnWith({
      timestamp: 1,
      version: '1.0'
    })

    fireEvent.click(screen.getByText('1'))
    await act(() => advanceTimers(1))
    expect(fetcher).toBeCalledTimes(2)
    expect(fetcher).toReturnWith({
      timestamp: 2,
      version: '1.0'
    })

    const cachedData = customCache.get(key)
    expect(cachedData.timestamp.toString()).toEqual('1')
    screen.getByText('1')
  })

  it('should not let the previous interval timer to set new timer if key changes too fast', async () => {
    const fetcherWithToken = jest.fn(async token => {
      await sleep(200)
      return token
    })
    function Page() {
      const [count, setCount] = useState(0)
      const { data } = useSWR(count.toString(), fetcherWithToken, {
        refreshInterval: 100,
        dedupingInterval: 50
      })
      return (
        <button
          onClick={() => setCount(count + 1)}
        >{`click me ${data}`}</button>
      )
    }

    render(<Page />)

    // initial revalidate
    await act(() => advanceTimers(200))
    expect(fetcherWithToken).toBeCalledTimes(1)

    // first refresh
    await act(() => advanceTimers(100))
    expect(fetcherWithToken).toBeCalledTimes(2)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('0')
    await act(() => advanceTimers(200))

    // second refresh start
    await act(() => advanceTimers(100))
    expect(fetcherWithToken).toBeCalledTimes(3)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('0')
    // change the key during revalidation
    // The second refresh will not start a new timer
    fireEvent.click(screen.getByText('click me 0'))

    // first refresh with new key 1
    await act(() => advanceTimers(100))
    expect(fetcherWithToken).toBeCalledTimes(4)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('1')
    await act(() => advanceTimers(200))

    // second refresh with new key 1
    await act(() => advanceTimers(100))
    expect(fetcherWithToken).toBeCalledTimes(5)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('1')
  })

  it('should not call onSuccess from the previous interval if key has changed', async () => {
    const fetcherWithToken = jest.fn(async token => {
      await sleep(100)
      return token
    })
    const onSuccess = jest.fn((data, key) => {
      return `${data} ${key}`
    })
    function Page() {
      const [count, setCount] = useState(0)
      const { data } = useSWR(`${count.toString()}-hash`, fetcherWithToken, {
        refreshInterval: 50,
        dedupingInterval: 25,
        onSuccess
      })
      return (
        <button
          onClick={() => setCount(count + 1)}
        >{`click me ${data}`}</button>
      )
    }

    render(<Page />)

    // initial revalidate
    await act(() => advanceTimers(100))
    expect(fetcherWithToken).toBeCalledTimes(1)
    expect(onSuccess).toBeCalledTimes(1)
    expect(onSuccess).toHaveLastReturnedWith(`0-hash 0-hash`)
    // first refresh
    await act(() => advanceTimers(50))
    expect(fetcherWithToken).toBeCalledTimes(2)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('0-hash')
    await act(() => advanceTimers(100))
    expect(onSuccess).toBeCalledTimes(2)
    expect(onSuccess).toHaveLastReturnedWith(`0-hash 0-hash`)

    // second refresh start
    await act(() => advanceTimers(50))
    expect(fetcherWithToken).toBeCalledTimes(3)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('0-hash')
    // change the key during revalidation
    // The second refresh will not start a new timer
    fireEvent.click(screen.getByText('click me 0-hash'))

    // first refresh with new key 1
    await act(() => advanceTimers(50))
    expect(fetcherWithToken).toBeCalledTimes(4)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('1-hash')
    await act(() => advanceTimers(100))
    expect(onSuccess).toBeCalledTimes(3)
    expect(onSuccess).toHaveLastReturnedWith(`1-hash 1-hash`)

    // second refresh with new key 1
    await act(() => advanceTimers(50))
    expect(fetcherWithToken).toBeCalledTimes(5)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('1-hash')
  })
})
