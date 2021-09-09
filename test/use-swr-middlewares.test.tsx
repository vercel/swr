import { act, render, screen } from '@testing-library/react'
import React, { useState, useEffect, useRef } from 'react'
import useSWR, { Middleware, SWRConfig } from 'swr'
import { withMiddleware } from '../src/utils/with-middleware'

import { createResponse, sleep, createKey, nextTick } from './utils'

describe('useSWR - middleware', () => {
  it('should use middleware', async () => {
    const key = createKey()
    const mockConsoleLog = jest.fn(s => s)
    const loggerMiddleware: Middleware = useSWRNext => (k, fn, config) => {
      mockConsoleLog(k)
      return useSWRNext(k, fn, config)
    }
    function Page() {
      const { data } = useSWR(key, () => createResponse('data'), {
        use: [loggerMiddleware]
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

  it('should pass original keys to middleware', async () => {
    const key = createKey()
    const mockConsoleLog = jest.fn(s => s)
    const loggerMiddleware: Middleware = useSWRNext => (k, fn, config) => {
      mockConsoleLog(k)
      return useSWRNext(k, fn, config)
    }
    function Page() {
      const { data } = useSWR([key, 1, 2, 3], () => createResponse('data'), {
        use: [loggerMiddleware]
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

  it('should support `use` option in context', async () => {
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
      <SWRConfig value={{ use: [loggerMiddleware] }}>
        <Page />
      </SWRConfig>
    )
    screen.getByText('hello,')
    await screen.findByText('hello, data')
    expect(mockConsoleLog.mock.calls[0][0]).toBe(key)
    expect(mockConsoleLog.mock.calls.length).toBe(2)
  })

  it('should support extending middleware via context and per-hook config', async () => {
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
        use: [createLoggerMiddleware(0)]
      })
      return <div>hello, {data}</div>
    }

    render(
      <SWRConfig value={{ use: [createLoggerMiddleware(2)] }}>
        <SWRConfig value={{ use: [createLoggerMiddleware(1)] }}>
          <Page />
        </SWRConfig>
      </SWRConfig>
    )
    screen.getByText('hello,')
    await screen.findByText('hello, data')
    expect(mockConsoleLog.mock.calls.map(call => call[0])).toEqual([
      2,
      1,
      0,
      2,
      1,
      0
    ])
  })

  it('should use the correct middleware order in `withMiddleware`', async () => {
    const key = createKey()
    const mockConsoleLog = jest.fn((_, s) => s)
    const createLoggerMiddleware = (id: number): Middleware => useSWRNext => (
      k,
      fn,
      config
    ) => {
      mockConsoleLog(id + '-enter', k)
      const swr = useSWRNext(k, fn, config)
      mockConsoleLog(id + '-exit', k)
      return swr
    }

    const customSWRHook = withMiddleware(useSWR, useSWRNext => (...args) => {
      mockConsoleLog('0-enter', args[0])
      const swr = useSWRNext(...args)
      mockConsoleLog('0-exit', args[0])
      return swr
    })

    function Page() {
      const { data } = customSWRHook(key, () => createResponse('data'), {
        use: [createLoggerMiddleware(1)]
      })
      return <div>hello, {data}</div>
    }

    render(
      <SWRConfig value={{ use: [createLoggerMiddleware(2)] }}>
        <Page />
      </SWRConfig>
    )
    screen.getByText('hello,')
    await screen.findByText('hello, data')
    expect(mockConsoleLog.mock.calls.map(call => call[0])).toEqual([
      '2-enter',
      '1-enter',
      '0-enter',
      '0-exit',
      '1-exit',
      '2-exit',
      '2-enter',
      '1-enter',
      '0-enter',
      '0-exit',
      '1-exit',
      '2-exit'
    ])
  })

  it('should support react hooks inside middleware', async () => {
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
      <SWRConfig value={{ use: [lazyMiddleware] }}>
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

  it('should pass modified keys to the next middleware and useSWR', async () => {
    const key = createKey()
    const createDecoratingKeyMiddleware = (
      c: string
    ): Middleware => useSWRNext => (k, fn, config) => {
      return useSWRNext(`${c}${k}${c}`, fn, config)
    }

    function Page() {
      const { data } = useSWR(key, k => createResponse(k), {
        use: [
          createDecoratingKeyMiddleware('!'),
          createDecoratingKeyMiddleware('#')
        ]
      })
      return <div>hello, {data}</div>
    }

    render(<Page />)
    screen.getByText('hello,')
    await screen.findByText(`hello, #!${key}!#`)
  })

  it('should send the non-serialized key to the middleware', async () => {
    const key = createKey()
    const logger = jest.fn()

    const m: Middleware = useSWRNext => (k, fn, config) => {
      logger(Array.isArray(k))
      return useSWRNext(JSON.stringify(k), _k => fn(...JSON.parse(_k)), config)
    }

    function Page() {
      const { data } = useSWR(
        [key, { hello: 'world' }],
        (_, o) => {
          return o.hello
        },
        {
          use: [m]
        }
      )
      return <div>hello, {data || ''}</div>
    }

    render(<Page />)
    screen.getByText('hello,')
    await nextTick()

    expect(logger).toBeCalledWith(true)
    screen.getByText('hello, world')
  })
})
