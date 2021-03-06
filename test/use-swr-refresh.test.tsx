import { act, fireEvent, render, screen } from '@testing-library/react'
import React, { useState } from 'react'
import useSWR, { cache } from '../src'
import { sleep } from './utils'

describe('useSWR - refresh', () => {
  it('should rerender automatically on interval', async () => {
    let count = 0

    function Page() {
      const { data } = useSWR('dynamic-1', () => count++, {
        refreshInterval: 200,
        dedupingInterval: 100
      })
      return <div>count: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: "`)

    // mount
    await screen.findByText('count: 0')

    await act(() => sleep(210)) // update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => sleep(50)) // no update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => sleep(150)) // update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 2"`)
  })

  it('should dedupe requests combined with intervals', async () => {
    let count = 0

    function Page() {
      const { data } = useSWR('dynamic-2', () => count++, {
        refreshInterval: 200,
        dedupingInterval: 300
      })
      return <div>count: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: "`)

    // mount
    await screen.findByText('count: 0')

    await act(() => sleep(210)) // no update (deduped)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 0"`)
    await act(() => sleep(200)) // update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => sleep(200)) // no update (deduped)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => sleep(200)) // update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 2"`)
  })

  it('should update data upon interval changes', async () => {
    let count = 0
    function Page() {
      const [int, setInt] = React.useState(200)
      const { data } = useSWR('/api', () => count++, {
        refreshInterval: int,
        dedupingInterval: 100
      })
      return (
        <div onClick={() => setInt(num => (num < 400 ? num + 100 : 0))}>
          count: {data}
        </div>
      )
    }
    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: "`)

    // mount
    await screen.findByText('count: 0')

    await act(() => sleep(210))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => sleep(50))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => sleep(150))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 2"`)
    fireEvent.click(container.firstElementChild)

    await act(() => sleep(200))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 2"`)

    await act(() => sleep(110))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 3"`)

    await act(() => sleep(310))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 4"`)
    fireEvent.click(container.firstElementChild)
    await act(() => {
      // it will clear 300ms timer and setup a new 400ms timer
      return sleep(300)
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 4"`)
    await act(() => sleep(110))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 5"`)
    fireEvent.click(container.firstElementChild)
    await act(() => {
      // it will clear 400ms timer and stop
      return sleep(110)
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 5"`)
    await act(() => sleep(110))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 5"`)
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
          refreshInterval: shouldPoll ? 200 : 0,
          dedupingInterval: 100,
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
    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count:  0"`
    )

    await screen.findByText('count: 0 1')

    await act(() => sleep(200))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 1 2"`
    )

    await act(() => sleep(200))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 1 2"`
    )

    await act(() => sleep(200))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 1 2"`
    )

    await act(() => sleep(200))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 1 2"`
    )

    fireEvent.click(container.firstElementChild)

    await act(() => {
      // it will setup a new 200ms timer
      return sleep(100)
    })

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 1 0"`
    )

    await act(() => sleep(100))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 2 1"`
    )

    await act(() => sleep(200))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 3 2"`
    )

    await act(() => sleep(200))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 3 2"`
    )

    await act(() => sleep(200))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"count: 3 2"`
    )
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

    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"loading"`)

    await screen.findByText('1')
    expect(fetcher).toBeCalledTimes(1)
    expect(fetcher).toReturnWith({
      timestamp: 1,
      version: '1.0'
    })

    fireEvent.click(container.firstElementChild)
    await act(() => sleep(1))
    expect(fetcher).toBeCalledTimes(2)
    expect(fetcher).toReturnWith({
      timestamp: 2,
      version: '1.0'
    })

    const cachedData = cache.get(key)
    expect(cachedData.timestamp.toString()).toEqual('1')
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"1"`)
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
    const { container } = render(<Page />)

    // initial revalidate
    await act(() => sleep(200))
    expect(fetcherWithToken).toBeCalledTimes(1)

    // first refresh
    await act(() => sleep(100))
    expect(fetcherWithToken).toBeCalledTimes(2)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('0')
    await act(() => sleep(200))

    // second refresh start
    await act(() => sleep(100))
    expect(fetcherWithToken).toBeCalledTimes(3)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('0')
    // change the key during revalidation
    // The second refresh will not start a new timer
    fireEvent.click(container.firstElementChild)

    // first refresh with new key 1
    await act(() => sleep(100))
    expect(fetcherWithToken).toBeCalledTimes(4)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('1')
    await act(() => sleep(210))

    // second refresh with new key 1
    expect(fetcherWithToken).toBeCalledTimes(5)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('1')
  })

  it('the previous interval timer should not call onSuccess callback if key changes too fast', async () => {
    const fetcherWithToken = jest.fn(async token => {
      await sleep(200)
      return token
    })
    const onSuccess = jest.fn((data, key) => {
      return `${data} ${key}`
    })
    function Page() {
      const [count, setCount] = useState(0)
      const { data } = useSWR(`${count.toString()}-hash`, fetcherWithToken, {
        refreshInterval: 100,
        dedupingInterval: 50,
        onSuccess
      })
      return (
        <button
          onClick={() => setCount(count + 1)}
        >{`click me ${data}`}</button>
      )
    }
    const { container } = render(<Page />)

    // initial revalidate
    await act(() => sleep(200))
    expect(fetcherWithToken).toBeCalledTimes(1)
    expect(onSuccess).toBeCalledTimes(1)
    expect(onSuccess).toHaveLastReturnedWith(`0-hash 0-hash`)
    // first refresh
    await act(() => sleep(100))
    expect(fetcherWithToken).toBeCalledTimes(2)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('0-hash')
    await act(() => sleep(200))
    expect(onSuccess).toBeCalledTimes(2)
    expect(onSuccess).toHaveLastReturnedWith(`0-hash 0-hash`)

    // second refresh start
    await act(() => sleep(100))
    expect(fetcherWithToken).toBeCalledTimes(3)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('0-hash')
    // change the key during revalidation
    // The second refresh will not start a new timer
    fireEvent.click(container.firstElementChild)

    // first refresh with new key 1
    await act(() => sleep(100))
    expect(fetcherWithToken).toBeCalledTimes(4)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('1-hash')
    await act(() => sleep(210))
    expect(onSuccess).toBeCalledTimes(3)
    expect(onSuccess).toHaveLastReturnedWith(`1-hash 1-hash`)

    // second refresh with new key 1
    expect(fetcherWithToken).toBeCalledTimes(5)
    expect(fetcherWithToken).toHaveBeenLastCalledWith('1-hash')
  })
})
