import { act, fireEvent, screen } from '@testing-library/react'
import React, { useState } from 'react'
import useSWR, { SWRConfig } from 'swr'
import { createKey, renderWithConfig, sleep } from './utils'

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

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => count++, {
        refreshInterval: 200,
        dedupingInterval: 100
      })
      return <div>count: {data}</div>
    }

    renderWithConfig(<Page />)

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

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => count++, {
        refreshInterval: 100,
        dedupingInterval: 500
      })
      return <div>count: {data}</div>
    }

    renderWithConfig(<Page />)

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
    const key = createKey()
    function Page() {
      const [int, setInt] = React.useState(100)
      const { data } = useSWR(key, () => count++, {
        refreshInterval: int,
        dedupingInterval: 50
      })
      return (
        <div onClick={() => setInt(num => (num < 200 ? num + 50 : 0))}>
          count: {data}
        </div>
      )
    }

    renderWithConfig(<Page />)
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
    const key = createKey()
    function Page() {
      const [flag, setFlag] = useState(0)
      const shouldPoll = flag < STOP_POLLING_THRESHOLD
      const { data } = useSWR(key, () => count++, {
        refreshInterval: shouldPoll ? 100 : 0,
        dedupingInterval: 50,
        onSuccess() {
          setFlag(value => value + 1)
        }
      })
      return (
        <div onClick={() => setFlag(0)}>
          count: {data} {flag}
        </div>
      )
    }

    renderWithConfig(<Page />)
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
    const key = createKey()
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

    let customCache

    function App() {
      return (
        <SWRConfig
          value={{
            provider: () => {
              return (customCache = new Map())
            }
          }}
        >
          <Page />
        </SWRConfig>
      )
    }

    renderWithConfig(<App />)

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
    const key = createKey()
    const fetcherWithToken = jest.fn(async token => {
      await sleep(200)
      return token
    })
    function Page() {
      const [count, setCount] = useState(0)
      const { data } = useSWR(`${key}-${count}`, fetcherWithToken, {
        refreshInterval: 100,
        dedupingInterval: 50
      })
      return (
        <button
          onClick={() => setCount(count + 1)}
        >{`click me ${data}`}</button>
      )
    }

    renderWithConfig(<Page />)

    // initial revalidate
    await act(() => advanceTimers(200))
    expect(fetcherWithToken).toBeCalledTimes(1)

    // first refresh
    await act(() => advanceTimers(100))
    expect(fetcherWithToken).toBeCalledTimes(2)
    expect(fetcherWithToken).toHaveBeenLastCalledWith(`${key}-0`)
    await act(() => advanceTimers(200))

    // second refresh start
    await act(() => advanceTimers(100))
    expect(fetcherWithToken).toBeCalledTimes(3)
    expect(fetcherWithToken).toHaveBeenLastCalledWith(`${key}-0`)
    // change the key during revalidation
    // The second refresh will not start a new timer
    fireEvent.click(screen.getByText(`click me ${key}-0`))

    // first refresh with new key 1
    await act(() => advanceTimers(100))
    expect(fetcherWithToken).toBeCalledTimes(4)
    expect(fetcherWithToken).toHaveBeenLastCalledWith(`${key}-1`)
    await act(() => advanceTimers(200))

    // second refresh with new key 1
    await act(() => advanceTimers(100))
    expect(fetcherWithToken).toBeCalledTimes(5)
    expect(fetcherWithToken).toHaveBeenLastCalledWith(`${key}-1`)
  })

  it('should not call onSuccess from the previous interval if key has changed', async () => {
    const fetcherWithToken = jest.fn(async token => {
      await sleep(100)
      return token
    })
    const onSuccess = jest.fn((data, key) => {
      return `${data} ${key}`
    })
    const key = createKey()
    function Page() {
      const [count, setCount] = useState(0)
      const { data } = useSWR(`${count.toString()}-${key}`, fetcherWithToken, {
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

    renderWithConfig(<Page />)

    // initial revalidate
    await act(() => advanceTimers(100))
    expect(fetcherWithToken).toBeCalledTimes(1)
    expect(onSuccess).toBeCalledTimes(1)
    expect(onSuccess).toHaveLastReturnedWith(`0-${key} 0-${key}`)
    // first refresh
    await act(() => advanceTimers(50))
    expect(fetcherWithToken).toBeCalledTimes(2)
    expect(fetcherWithToken).toHaveBeenLastCalledWith(`0-${key}`)
    await act(() => advanceTimers(100))
    expect(onSuccess).toBeCalledTimes(2)
    expect(onSuccess).toHaveLastReturnedWith(`0-${key} 0-${key}`)

    // second refresh start
    await act(() => advanceTimers(50))
    expect(fetcherWithToken).toBeCalledTimes(3)
    expect(fetcherWithToken).toHaveBeenLastCalledWith(`0-${key}`)
    // change the key during revalidation
    // The second refresh will not start a new timer
    fireEvent.click(screen.getByText(`click me 0-${key}`))

    // first refresh with new key 1
    await act(() => advanceTimers(50))
    expect(fetcherWithToken).toBeCalledTimes(4)
    expect(fetcherWithToken).toHaveBeenLastCalledWith(`1-${key}`)
    await act(() => advanceTimers(100))
    expect(onSuccess).toBeCalledTimes(3)
    expect(onSuccess).toHaveLastReturnedWith(`1-${key} 1-${key}`)

    // second refresh with new key 1
    await act(() => advanceTimers(50))
    expect(fetcherWithToken).toBeCalledTimes(5)
    expect(fetcherWithToken).toHaveBeenLastCalledWith(`1-${key}`)
  })

  it('should allow using function as an interval', async () => {
    let count = 0

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => count++, {
        refreshInterval: () => 200,
        dedupingInterval: 100
      })
      return <div>count: {data}</div>
    }

    renderWithConfig(<Page />)

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

  it('should pass updated data to refreshInterval', async () => {
    let count = 1

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => count++, {
        refreshInterval: updatedCount => updatedCount * 1000,
        dedupingInterval: 100
      })
      return <div>count: {data}</div>
    }

    renderWithConfig(<Page />)

    // hydration
    screen.getByText('count:')

    // mount
    await screen.findByText('count: 1')

    await act(() => advanceTimers(1000)) // updated after 1s
    screen.getByText('count: 2')
    await act(() => advanceTimers(1000)) // no update
    screen.getByText('count: 2')
    await act(() => advanceTimers(1000)) // updated after 2s
    screen.getByText('count: 3')
    await act(() => advanceTimers(2000)) // no update
    screen.getByText('count: 3')
    await act(() => advanceTimers(1000)) // updated after 3s
    screen.getByText('count: 4')
  })
})
