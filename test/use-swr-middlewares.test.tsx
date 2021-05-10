import { act, render, screen } from '@testing-library/react'
import React, { useState, useEffect, useRef } from 'react'
import useSWR, { SWRConfig } from '../src'
import { createResponse, sleep } from './utils'

describe('useSWR - middlewares', () => {
  it('should use middlewares', async () => {
    const mockConsoleLog = jest.fn(s => s)
    const loggerMiddleware = useSWRNext => (key, fn, config) => {
      mockConsoleLog(key)
      return useSWRNext(key, fn, config)
    }
    function Page() {
      const { data } = useSWR('middlewares-1', () => createResponse('data'), {
        middlewares: [loggerMiddleware]
      })
      return <div>hello, {data}</div>
    }

    render(<Page />)
    screen.getByText('hello,')
    await screen.findByText('hello, data')
    expect(mockConsoleLog.mock.calls[0][0]).toBe('middlewares-1')
    // Initial render and data ready.
    expect(mockConsoleLog.mock.calls.length).toBe(2)
  })

  it('should support middlewares in context', async () => {
    const mockConsoleLog = jest.fn(s => s)
    const loggerMiddleware = useSWRNext => (key, fn, config) => {
      mockConsoleLog(key)
      return useSWRNext(key, fn, config)
    }
    function Page() {
      const { data } = useSWR('middlewares-2', () => createResponse('data'))
      return <div>hello, {data}</div>
    }

    render(
      <SWRConfig value={{ middlewares: [loggerMiddleware] }}>
        <Page />
      </SWRConfig>
    )
    screen.getByText('hello,')
    await screen.findByText('hello, data')
    expect(mockConsoleLog.mock.calls[0][0]).toBe('middlewares-2')
    expect(mockConsoleLog.mock.calls.length).toBe(2)
  })

  it('should support react hooks inside middlewares', async () => {
    const lazyMiddleware = useSWRNext => (key, fn, config) => {
      const dataRef = useRef(undefined)
      const res = useSWRNext(key, fn, config)
      if (res.data) {
        dataRef.current = res.data
        return res
      } else {
        return { ...res, data: dataRef.current }
      }
    }
    function Page() {
      const [mounted, setMounted] = useState(false)
      const key = `middlewares-4-${mounted ? '1' : '0'}`
      const { data } = useSWR(key, k => createResponse(k, { delay: 100 }))
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
    screen.getByText('data:middlewares-4-0') // 0, time=150
    await act(() => sleep(100))
    screen.getByText('data:middlewares-4-0') // still holding the previous value, even if the key has changed
    await act(() => sleep(100))
    screen.getByText('data:middlewares-4-1') // 1, time=350
  })
})
