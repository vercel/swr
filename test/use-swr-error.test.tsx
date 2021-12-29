import { act, fireEvent, screen } from '@testing-library/react'
import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import {
  sleep,
  createResponse,
  createKey,
  renderWithConfig,
  mockVisibilityHidden
} from './utils'

describe('useSWR - error', () => {
  it('should handle errors', async () => {
    const key = createKey()
    function Page() {
      const { data, error } = useSWR(key, () =>
        createResponse(new Error('error!'))
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('hello,')

    // mount
    await screen.findByText('error!')
  })

  it('should trigger the onError event', async () => {
    const key = createKey()
    let erroredSWR = null
    function Page() {
      const { data, error } = useSWR(
        key,
        () => createResponse(new Error('error!')),
        { onError: (_, errorKey) => (erroredSWR = errorKey) }
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('hello,')

    // mount
    await screen.findByText('error!')
    expect(erroredSWR).toEqual(key)
  })

  it('should trigger error retry', async () => {
    const key = createKey()
    let count = 0
    function Page() {
      const { data, error } = useSWR(
        key,
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
    renderWithConfig(<Page />)
    screen.getByText('hello,')

    // mount
    await screen.findByText('error: 0')

    await act(() => sleep(200)) // retry
    screen.getByText('error: 1')

    await act(() => sleep(200)) // retry
    screen.getByText('error: 2')
  })

  it('should stop retrying when document is not visible', async () => {
    const key = createKey()
    let count = 0
    function Page() {
      const { data, error } = useSWR(
        key,
        () => createResponse(new Error('error: ' + count++), { delay: 100 }),
        {
          onErrorRetry: (_, __, ___, revalidate, revalidateOpts) => {
            revalidate(revalidateOpts)
          },
          dedupingInterval: 0
        }
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }
    renderWithConfig(<Page />)
    screen.getByText('hello,')

    // mount
    await screen.findByText('error: 0')

    // errored, retrying
    await act(() => sleep(50))
    const resetVisibility = mockVisibilityHidden()

    await act(() => sleep(100))
    screen.getByText('error: 1')

    await act(() => sleep(100)) // stopped due to invisible
    screen.getByText('error: 1')

    resetVisibility()
  })

  it('should not retry when shouldRetryOnError is disabled', async () => {
    const key = createKey()
    let count = 0
    function Page() {
      const { data, error } = useSWR(
        key,
        () => createResponse(new Error('error: ' + count++), { delay: 100 }),
        {
          onErrorRetry: (_, __, ___, revalidate, revalidateOpts) => {
            revalidate(revalidateOpts)
          },
          dedupingInterval: 0,
          shouldRetryOnError: false
        }
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }
    renderWithConfig(<Page />)
    screen.getByText('hello,')

    // mount
    await screen.findByText('error: 0')

    await act(() => sleep(150))
    screen.getByText('error: 0')
  })

  it('should trigger the onLoadingSlow and onSuccess event', async () => {
    const key = createKey()
    let loadingSlow = null,
      success = null
    function Page() {
      const { data } = useSWR(
        key,
        () => createResponse('SWR', { delay: 200 }),
        {
          onLoadingSlow: loadingKey => (loadingSlow = loadingKey),
          onSuccess: (_, successKey) => (success = successKey),
          loadingTimeout: 100
        }
      )
      return <div>hello, {data}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('hello,')
    expect(loadingSlow).toEqual(null)

    await act(() => sleep(150)) // trigger onLoadingSlow event
    expect(loadingSlow).toEqual(key)
    expect(success).toEqual(null)

    await act(() => sleep(150)) // finish the request
    expect(success).toEqual(key)
    screen.getByText('hello, SWR')
  })
  it('should trigger limited error retries if errorRetryCount exists', async () => {
    const key = createKey()
    let count = 0
    function Page() {
      const { data, error } = useSWR(
        key,
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

    renderWithConfig(<Page />)
    screen.getByText('hello,')

    // mount
    await screen.findByText('error: 0')

    await screen.findByText('error: 1') // retry

    await act(() => sleep(200)) // a retry request won't happen because retryCount is over
    screen.getByText('error: 1')
  })

  it('should not trigger the onLoadingSlow and onSuccess event after component unmount', async () => {
    const key = createKey()
    let loadingSlow = null,
      success = null
    function Page() {
      const { data } = useSWR(key, () => createResponse('SWR'), {
        onLoadingSlow: loadingKey => {
          loadingSlow = loadingKey
        },
        onSuccess: (_, successKey) => {
          success = successKey
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

    renderWithConfig(<App />)
    screen.getByText('hello,')
    expect(loadingSlow).toEqual(null)
    expect(success).toEqual(null)

    fireEvent.click(screen.getByText('hello,'))
    await act(() => sleep(200))
    expect(success).toEqual(null)
    expect(loadingSlow).toEqual(null)
  })

  it('should not trigger the onError and onErrorRetry event after component unmount', async () => {
    const key = createKey()
    let retry = null,
      failed = null
    function Page() {
      const { data } = useSWR(key, () => createResponse(new Error('error!')), {
        onError: (_, errorKey) => {
          failed = errorKey
        },
        onErrorRetry: (_, errorKey) => {
          retry = errorKey
        },
        dedupingInterval: 0
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

    renderWithConfig(<App />)
    screen.getByText('hello,')
    expect(retry).toEqual(null)
    expect(failed).toEqual(null)

    fireEvent.click(screen.getByText('hello,'))
    await act(() => sleep(200))
    expect(retry).toEqual(null)
    expect(failed).toEqual(null)
  })

  it('should not trigger error retries if errorRetryCount is set to 0', async () => {
    const key = createKey()
    let count = 0
    function Page() {
      const { data, error } = useSWR(
        key,
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

    renderWithConfig(<Page />)
    screen.getByText('hello,')

    // mount
    await screen.findByText('error: 0')

    await act(() => sleep(210)) // retry is never happen
    screen.getByText('error: 0')
  })

  it('should not clear error during revalidating until fetcher is finished successfully', async () => {
    const errors = []
    const key = createKey()
    let mutate
    function Page() {
      const { error, mutate: _mutate } = useSWR(
        key,
        () => createResponse(new Error('error')),
        {
          errorRetryCount: 0,
          errorRetryInterval: 0,
          dedupingInterval: 0
        }
      )
      mutate = _mutate
      useEffect(() => {
        errors.push(error ? error.message : null)
      }, [error])

      return <div>hello, {error ? error.message : null}</div>
    }

    renderWithConfig(<Page />)

    // mount
    await screen.findByText('hello, error')

    await act(() => mutate())
    // initial -> first error -> mutate -> receive another error
    // error won't be cleared during revalidation
    expect(errors).toEqual([null, 'error', 'error'])
  })

  it('should reset isValidating when an error occured synchronously', async () => {
    const key = createKey()
    function Page() {
      const { error, isValidating } = useSWR(key, () => {
        throw new Error('error!')
      })
      if (error)
        return (
          <div>
            {error.message},{isValidating.toString()}
          </div>
        )
      return <div>hello,{isValidating.toString()}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('error!,false')
  })

  it('should reset isValidating when an error occured asynchronously', async () => {
    const key = createKey()
    function Page() {
      const { error, isValidating } = useSWR(key, () =>
        createResponse(new Error('error!'))
      )
      if (error)
        return (
          <div>
            {error.message},{isValidating.toString()}
          </div>
        )
      return <div>hello,{isValidating.toString()}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('hello,true')

    await screen.findByText('error!,false')
  })

  it('should dedupe onError events', async () => {
    const key = createKey()
    const errorEvents = []
    function Foo() {
      useSWR(key, () => createResponse(new Error('error!'), { delay: 20 }), {
        onError: e => errorEvents.push(e)
      })
      return null
    }
    function Page() {
      return (
        <>
          <Foo />
          <Foo />
        </>
      )
    }

    renderWithConfig(<Page />)
    await act(() => sleep(30))

    // Since there's only 1 request fired, only 1 error event should be reported.
    expect(errorEvents.length).toBe(1)
  })
})
