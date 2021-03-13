import { act, fireEvent, render, screen } from '@testing-library/react'
import React, { useEffect, useState } from 'react'
import useSWR, { mutate } from '../src'
import { sleep, createResponse } from './utils'

describe('useSWR - error', () => {
  it('should handle errors', async () => {
    function Page() {
      const { data, error } = useSWR('error-1', () =>
        createResponse(new Error('error!'))
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }

    render(<Page />)
    screen.getByText('hello,')

    // mount
    await screen.findByText('error!')
  })

  it('should trigger the onError event', async () => {
    let erroredSWR = null
    function Page() {
      const { data, error } = useSWR(
        'error-2',
        () => createResponse(new Error('error!')),
        { onError: (_, key) => (erroredSWR = key) }
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }

    render(<Page />)
    screen.getByText('hello,')

    // mount
    await screen.findByText('error!')
    expect(erroredSWR).toEqual('error-2')
  })

  it('should trigger error retry', async () => {
    let count = 0
    function Page() {
      const { data, error } = useSWR(
        'error-3',
        () => createResponse(new Error('error: ' + count++), { delay: 100 }),
        {
          onErrorRetry: (_, __, ___, revalidate, revalidateOpts) => {
            setTimeout(() => revalidate(revalidateOpts), 50)
          },
          dedupingInterval: 0
        }
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }

    render(<Page />)
    screen.getByText('hello,')

    // mount
    await screen.findByText('error: 0')

    await act(() => sleep(200)) // retry
    screen.getByText('error: 1')

    await act(() => sleep(200)) // retry
    screen.getByText('error: 2')
  })

  it('should trigger the onLoadingSlow and onSuccess event', async () => {
    let loadingSlow = null,
      success = null
    function Page() {
      const { data } = useSWR(
        'error-4',
        () => createResponse('SWR', { delay: 200 }),
        {
          onLoadingSlow: key => (loadingSlow = key),
          onSuccess: (_, key) => (success = key),
          loadingTimeout: 100
        }
      )
      return <div>hello, {data}</div>
    }

    render(<Page />)
    screen.getByText('hello,')
    expect(loadingSlow).toEqual(null)

    await act(() => sleep(150)) // trigger onLoadingSlow event
    expect(loadingSlow).toEqual('error-4')
    expect(success).toEqual(null)

    await act(() => sleep(150)) // finish the request
    expect(success).toEqual('error-4')
    screen.getByText('hello, SWR')
  })
  it('should trigger limited error retries if errorRetryCount exists', async () => {
    let count = 0
    function Page() {
      const { data, error } = useSWR(
        'error-5',
        () => createResponse(new Error('error: ' + count++)),
        {
          errorRetryCount: 1,
          errorRetryInterval: 50,
          dedupingInterval: 0
        }
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }

    render(<Page />)
    screen.getByText('hello,')

    // mount
    await screen.findByText('error: 0')

    await screen.findByText('error: 1') // retry

    await act(() => sleep(200)) // a retry request won't happen because retryCount is over
    screen.getByText('error: 1')
  })

  it('should not trigger the onLoadingSlow and onSuccess event after component unmount', async () => {
    let loadingSlow = null,
      success = null
    function Page() {
      const { data } = useSWR('error-6', () => createResponse('SWR'), {
        onLoadingSlow: key => {
          loadingSlow = key
        },
        onSuccess: (_, key) => {
          success = key
        },
        loadingTimeout: 100
      })
      return <div>hello, {data}</div>
    }

    function App() {
      const [on, toggle] = useState(true)
      return (
        <div id="app" onClick={() => toggle(s => !s)}>
          {on && <Page />}
        </div>
      )
    }

    render(<App />)
    screen.getByText('hello,')
    expect(loadingSlow).toEqual(null)
    expect(success).toEqual(null)

    fireEvent.click(screen.getByText('hello,'))
    await act(async () => sleep(200))
    expect(success).toEqual(null)
    expect(loadingSlow).toEqual(null)
  })

  it('should not trigger the onError and onErrorRetry event after component unmount', async () => {
    let retry = null,
      failed = null
    function Page() {
      const { data } = useSWR(
        'error-7',
        () => createResponse(new Error('error!')),
        {
          onError: (_, key) => {
            failed = key
          },
          onErrorRetry: (_, key) => {
            retry = key
          },
          dedupingInterval: 0
        }
      )
      return <div>hello, {data}</div>
    }

    function App() {
      const [on, toggle] = useState(true)
      return (
        <div id="app" onClick={() => toggle(s => !s)}>
          {on && <Page />}
        </div>
      )
    }

    render(<App />)
    screen.getByText('hello,')
    expect(retry).toEqual(null)
    expect(failed).toEqual(null)

    fireEvent.click(screen.getByText('hello,'))
    await act(async () => sleep(200))
    expect(retry).toEqual(null)
    expect(failed).toEqual(null)
  })

  it('should not trigger error retries if errorRetryCount is set to 0', async () => {
    let count = 0
    function Page() {
      const { data, error } = useSWR(
        'error-8',
        () => createResponse(new Error('error: ' + count++)),
        {
          errorRetryCount: 0,
          errorRetryInterval: 50,
          dedupingInterval: 0
        }
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }

    render(<Page />)
    screen.getByText('hello,')

    // mount
    await screen.findByText('error: 0')

    await act(() => sleep(210)) // retry is never happen
    screen.getByText('error: 0')
  })

  it('should not clear error during revalidating until fetcher is finished successfully', async () => {
    const errors = []
    const key = 'error-9'
    function Page() {
      const { error } = useSWR(key, () => createResponse(new Error('error')), {
        errorRetryCount: 0,
        errorRetryInterval: 0,
        dedupingInterval: 0
      })
      useEffect(() => {
        errors.push(error ? error.message : null)
      }, [error])

      return <div>hello, {error ? error.message : null}</div>
    }

    render(<Page />)

    // mount
    await screen.findByText('hello, error')

    await act(() => mutate(key, undefined, true))
    // initial -> first error -> mutate -> receive another error
    // error won't be cleared during revalidation
    expect(errors).toEqual([null, 'error', 'error'])
  })
})
