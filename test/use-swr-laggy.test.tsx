import { screen, act, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'

import { createKey, createResponse, renderWithConfig, sleep } from './utils'

describe('useSWR - keep previous data', () => {
  it('should keep previous data when key changes when `keepPreviousData` is enabled', async () => {
    const loggedData = []
    const fetcher = k => createResponse(k, { delay: 50 })
    function App() {
      const [key, setKey] = useState(createKey())
      const { data: laggedData } = useSWR(key, fetcher, {
        keepPreviousData: true
      })
      loggedData.push([key, laggedData])
      return <button onClick={() => setKey(createKey())}>change key</button>
    }

    renderWithConfig(<App />)
    await act(() => sleep(100))
    fireEvent.click(screen.getByText('change key'))
    await act(() => sleep(100))

    const key1 = loggedData[0][0]
    const key2 = loggedData[2][0]
    expect(loggedData).toEqual([
      [key1, undefined],
      [key1, key1],
      [key2, key1],
      [key2, key2]
    ])
  })

  it('should keep previous data when sharing the cache', async () => {
    const loggedData = []
    const fetcher = k => createResponse(k, { delay: 50 })
    function App() {
      const [key, setKey] = useState(createKey())

      const { data } = useSWR(key, fetcher)
      const { data: laggedData } = useSWR(key, fetcher, {
        keepPreviousData: true
      })

      loggedData.push([key, data, laggedData])
      return <button onClick={() => setKey(createKey())}>change key</button>
    }

    renderWithConfig(<App />)
    await act(() => sleep(100))
    fireEvent.click(screen.getByText('change key'))
    await act(() => sleep(100))

    const key1 = loggedData[0][0]
    const key2 = loggedData[2][0]
    expect(loggedData).toEqual([
      [key1, undefined, undefined],
      [key1, key1, key1],
      [key2, undefined, key1],
      [key2, key2, key2]
    ])
  })

  it('should keep previous data even if there is fallback data', async () => {
    const loggedData = []
    const fetcher = k => createResponse(k, { delay: 50 })
    function App() {
      const [key, setKey] = useState(createKey())

      const { data } = useSWR(key, fetcher, {
        fallbackData: 'fallback'
      })
      const { data: laggedData } = useSWR(key, fetcher, {
        keepPreviousData: true,
        fallbackData: 'fallback'
      })

      loggedData.push([key, data, laggedData])
      return <button onClick={() => setKey(createKey())}>change key</button>
    }

    renderWithConfig(<App />)
    await act(() => sleep(100))
    fireEvent.click(screen.getByText('change key'))
    await act(() => sleep(100))

    const key1 = loggedData[0][0]
    const key2 = loggedData[2][0]
    expect(loggedData).toEqual([
      [key1, 'fallback', 'fallback'],
      [key1, key1, key1],
      [key2, 'fallback', key1],
      [key2, key2, key2]
    ])
  })

  it('should always return the latest data', async () => {
    const loggedData = []
    const fetcher = k => createResponse(k, { delay: 50 })
    function App() {
      const [key, setKey] = useState(createKey())
      const { data: laggedData, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true
      })
      loggedData.push([key, laggedData])
      return (
        <>
          <button onClick={() => setKey(createKey())}>change key</button>
          <button onClick={() => mutate('mutate')}>mutate</button>
        </>
      )
    }

    renderWithConfig(<App />)
    await act(() => sleep(100))
    fireEvent.click(screen.getByText('change key'))
    await act(() => sleep(100))
    fireEvent.click(screen.getByText('mutate'))
    await act(() => sleep(100))

    const key1 = loggedData[0][0]
    const key2 = loggedData[2][0]
    expect(loggedData).toEqual([
      [key1, undefined],
      [key1, key1],
      [key2, key1],
      [key2, key2],
      [key2, 'mutate'],
      [key2, key2]
    ])
  })

  it('should keep previous data for the useSWRInfinite hook', async () => {
    const loggedData = []
    const fetcher = k => createResponse(k, { delay: 50 })
    function App() {
      const [key, setKey] = useState(createKey())

      const { data } = useSWRInfinite(() => key, fetcher, {
        keepPreviousData: true
      })

      loggedData.push([key, data])
      return <button onClick={() => setKey(createKey())}>change key</button>
    }

    renderWithConfig(<App />)
    await act(() => sleep(100))
    fireEvent.click(screen.getByText('change key'))
    await act(() => sleep(100))

    const key1 = loggedData[0][0]
    const key2 = loggedData[2][0]
    expect(loggedData).toEqual([
      [key1, undefined],
      [key1, [key1]],
      [key2, [key1]],
      [key2, [key2]]
    ])
  })

  it('should support changing the `keepPreviousData` option', async () => {
    const loggedData = []
    const fetcher = k => createResponse(k, { delay: 50 })
    let keepPreviousData = false
    function App() {
      const [key, setKey] = useState(createKey())
      const { data: laggedData } = useSWR(key, fetcher, {
        keepPreviousData
      })
      loggedData.push([key, laggedData])
      return <button onClick={() => setKey(createKey())}>change key</button>
    }

    renderWithConfig(<App />)
    await act(() => sleep(100))
    fireEvent.click(screen.getByText('change key'))
    await act(() => sleep(100))
    keepPreviousData = true
    fireEvent.click(screen.getByText('change key'))
    await act(() => sleep(100))

    const key1 = loggedData[0][0]
    const key2 = loggedData[2][0]
    const key3 = loggedData[4][0]
    expect(loggedData).toEqual([
      [key1, undefined],
      [key1, key1],
      [key2, undefined],
      [key2, key2],
      [key3, key2],
      [key3, key3]
    ])
  })

  // https://github.com/vercel/swr/issues/2128
  it('should re-render when returned data and fallbackData is the same and keepPreviousData is enabled', async () => {
    const fallbackData = 'initial'
    const fetcher = k => createResponse(k, { delay: 50 })
    const keys = ['initial', 'updated']
    function App() {
      const [count, setCount] = useState(0)
      const { data } = useSWR(keys[count % 2 === 0 ? 0 : 1], fetcher, {
        fallbackData,
        keepPreviousData: true,
        revalidateOnMount: false,
        revalidateOnFocus: false
      })
      return (
        <>
          <button onClick={() => setCount(c => c + 1)}>change key</button>
          <div>{data}</div>
        </>
      )
    }

    renderWithConfig(<App />)
    // fallbackData
    screen.getByText('initial')

    fireEvent.click(screen.getByText('change key'))
    await act(() => sleep(10))
    // previous data
    screen.getByText('initial')
    await act(() => sleep(100))
    screen.getByText('updated')

    fireEvent.click(screen.getByText('change key'))
    await act(() => sleep(10))
    // previous data
    screen.getByText('updated')
    await act(() => sleep(100))
    screen.getByText('initial')
  })

  it('should work keepPreviousData without changing th key', async () => {
    const key = createKey()
    let counter = 0
    const fetcher = () => createResponse(++counter, { delay: 50 })
    function App() {
      const { data, mutate } = useSWR(key, fetcher)
      const { data: laggedData } = useSWR(key, fetcher, {
        keepPreviousData: true
      })

      return (
        <>
          <button onClick={() => mutate(undefined)}>mutate</button>
          <div>
            data:{data},laggy:{laggedData}
          </div>
        </>
      )
    }

    renderWithConfig(<App />)
    screen.getByText('data:,laggy:')
    await act(() => sleep(100))
    screen.getByText('data:1,laggy:1')
    fireEvent.click(screen.getByText('mutate'))
    // previous data
    screen.getByText('data:,laggy:1')
    await act(() => sleep(100))
    screen.getByText('data:2,laggy:2')
  })
})
