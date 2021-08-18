import { act, render, screen } from '@testing-library/react'
import React, { useState, useEffect, useRef } from 'react'
import useSWR, { Middleware, SWRConfig } from 'swr'
import { createResponse, sleep, createKey } from './utils'

describe('useSWR - middlewares', () => {
  it('should use middlewares', async () => {
    const key = createKey()
    const mockConsoleLog = jest.fn(s => s)
    const loggerMiddleware: Middleware = useSWRNext => (k, fn, config) => {
      mockConsoleLog(k)
      return useSWRNext(k, fn, config)
    }
    function Page() {
      const { data } = useSWR(key, () => createResponse('data'), {
        middlewares: [loggerMiddleware]
      })
      return <div>hello, {data}</div>
    }

    render(<Page />)
    screen.getByText('hello,')
    await screen.findByText('hello, data')
    expect(mockConsoleLog.mock.calls[0][0]).toBe(key)
    // Initial render and data ready.
    expect(mockConsoleLog.mock.calls.length).toBe(2)
  })

  it('should pass original keys to middlewares', async () => {
    const key = createKey()
    const mockConsoleLog = jest.fn(s => s)
    const loggerMiddleware: Middleware = useSWRNext => (k, fn, config) => {
      mockConsoleLog(k)
      return useSWRNext(k, fn, config)
    }
    function Page() {
      const { data } = useSWR([key, 1, 2, 3], () => createResponse('data'), {
        middlewares: [loggerMiddleware]
      })
      return <div>hello, {data}</div>
    }

    render(<Page />)
    screen.getByText('hello,')
    await screen.findByText('hello, data')
    expect(mockConsoleLog.mock.calls[0][0]).toEqual([key, 1, 2, 3])
    // Initial render and data ready.
    expect(mockConsoleLog.mock.calls.length).toBe(2)
  })

  it('should support middlewares in context', async () => {
    const key = createKey()
    const mockConsoleLog = jest.fn(s => s)
    const loggerMiddleware: Middleware = useSWRNext => (k, fn, config) => {
      mockConsoleLog(k)
      return useSWRNext(k, fn, config)
    }
    function Page() {
      const { data } = useSWR(key, () => createResponse('data'))
      return <div>hello, {data}</div>
    }

    render(
      <SWRConfig value={{ middlewares: [loggerMiddleware] }}>
        <Page />
      </SWRConfig>
    )
    screen.getByText('hello,')
    await screen.findByText('hello, data')
    expect(mockConsoleLog.mock.calls[0][0]).toBe(key)
    expect(mockConsoleLog.mock.calls.length).toBe(2)
  })

  it('should support extending middlewares via context and per-hook config', async () => {
    const key = createKey()
    const mockConsoleLog = jest.fn((_, s) => s)
    const createLoggerMiddleware = (id: number): Middleware => useSWRNext => (
      k,
      fn,
      config
    ) => {
      mockConsoleLog(id, k)
      return useSWRNext(k, fn, config)
    }
    function Page() {
      const { data } = useSWR(key, () => createResponse('data'), {
        middlewares: [createLoggerMiddleware(0)]
      })
      return <div>hello, {data}</div>
    }

    render(
      <SWRConfig value={{ middlewares: [createLoggerMiddleware(2)] }}>
        <SWRConfig value={{ middlewares: [createLoggerMiddleware(1)] }}>
          <Page />
        </SWRConfig>
      </SWRConfig>
    )
    screen.getByText('hello,')
    await screen.findByText('hello, data')
    expect(mockConsoleLog.mock.calls.map(call => call[0])).toEqual([
      0,
      1,
      2,
      0,
      1,
      2
    ])
  })

  it('should support react hooks inside middlewares', async () => {
    const key = createKey()
    const lazyMiddleware: Middleware = useSWRNext => (k, fn, config) => {
      const dataRef = useRef(undefined)
      const res = useSWRNext(k, fn, config)
      if (res.data) {
        dataRef.current = res.data
        return res
      } else {
        return { ...res, data: dataRef.current }
      }
    }
    function Page() {
      const [mounted, setMounted] = useState(false)
      const { data } = useSWR(`${key}-${mounted ? '1' : '0'}`, k =>
        createResponse(k, { delay: 100 })
      )
      useEffect(() => {
        setTimeout(() => setMounted(true), 200)
      }, [])
      return <div>data:{data}</div>
    }

    render(
      <SWRConfig value={{ middlewares: [lazyMiddleware] }}>
        <Page />
      </SWRConfig>
    )

    screen.getByText('data:') // undefined, time=0
    await act(() => sleep(150))
    screen.getByText(`data:${key}-0`) // 0, time=150
    await act(() => sleep(100))
    screen.getByText(`data:${key}-0`) // still holding the previous value, even if the key has changed
    await act(() => sleep(100))
    screen.getByText(`data:${key}-1`) // 1, time=350
  })

  it('should pass modified keys to the next middlewares and useSWR', async () => {
    const key = createKey()
    const createDecoratingKeyMiddleware = (
      c: string
    ): Middleware => useSWRNext => (k, fn, config) => {
      return useSWRNext(`${c}${k}${c}`, fn, config)
    }

    function Page() {
      const { data } = useSWR(key, k => createResponse(k), {
        middlewares: [
          createDecoratingKeyMiddleware('!'),
          createDecoratingKeyMiddleware('#')
        ]
      })
      return <div>hello, {data}</div>
    }

    render(<Page />)
    screen.getByText('hello,')
    await screen.findByText(`hello, !#${key}#!`)
  })
})
