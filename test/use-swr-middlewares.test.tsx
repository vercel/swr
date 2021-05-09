import { render, screen } from '@testing-library/react'
import React from 'react'
import useSWR from '../src'
import { createResponse } from './utils'

describe('useSWR - middlewares', () => {
  it('should call middlewares', async () => {
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
  })
})
