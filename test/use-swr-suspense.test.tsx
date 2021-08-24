import { act, fireEvent, render, screen } from '@testing-library/react'
import React, { ReactNode, Suspense, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { createResponse, sleep } from './utils'

class ErrorBoundary extends React.Component<{ fallback: ReactNode }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return {
      hasError: true
    }
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

describe('useSWR - suspense', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it('should render fallback', async () => {
    function Section() {
      const { data } = useSWR('suspense-1', () => createResponse('SWR'), {
        suspense: true
      })
      return <div>{data}</div>
    }

    render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    // hydration
    screen.getByText('fallback')
    await screen.findByText('SWR')
  })

  it('should render multiple SWR fallbacks', async () => {
    function Section() {
      const { data: v1 } = useSWR<number>(
        'suspense-2',
        () => createResponse(1, { delay: 50 }),
        {
          suspense: true
        }
      )
      const { data: v2 } = useSWR<number>(
        'suspense-3',
        () => createResponse(2, { delay: 50 }),
        {
          suspense: true
        }
      )
      return <div>{v1 + v2}</div>
    }

    render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    // hydration
    screen.getByText('fallback')
    await act(() => sleep(70))
    screen.getByText('fallback')
    await act(() => sleep(70))
    screen.getByText('3')
  })

  it('should work for non-promises', async () => {
    function Section() {
      const { data } = useSWR('suspense-4', () => 'hello', {
        suspense: true
      })
      return <div>{data}</div>
    }
    render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    await screen.findByText('hello')
  })
  it('should throw errors', async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, 'error').mockImplementation(() => {})
    function Section() {
      const { data } = useSWR(
        'suspense-5',
        () => createResponse(new Error('error')),
        {
          suspense: true
        }
      )
      return <div>{data}</div>
    }

    // https://reactjs.org/docs/concurrent-mode-suspense.html#handling-errors
    render(
      <ErrorBoundary fallback={<div>error boundary</div>}>
        <Suspense fallback={<div>fallback</div>}>
          <Section />
        </Suspense>
      </ErrorBoundary>
    )

    // hydration
    screen.getByText('fallback')
    await screen.findByText('error boundary')
    // 1 for js-dom 1 for react-error-boundray
    expect(console.error).toHaveBeenCalledTimes(2)
  })

  it('should render cached data with error', async () => {
    mutate('suspense-6', 'hello')

    function Section() {
      const { data, error } = useSWR(
        // this value is cached
        'suspense-6',
        () => createResponse(new Error('error')),
        {
          suspense: true
        }
      )
      return (
        <div>
          {data}, {error ? error.message : null}
        </div>
      )
    }

    render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    screen.getByText('hello,') // directly from cache
    await screen.findByText('hello, error') // get error with cache
  })

  it('should pause when key changes', async () => {
    const renderedResults = []
    function Section() {
      const [key, setKey] = useState('suspense-7')
      const { data } = useSWR(key, k => createResponse(k), {
        suspense: true
      })

      useEffect(() => {
        if (data === 'suspense-7') {
          setKey('suspense-8')
        }
      }, [data])

      if (data !== renderedResults[renderedResults.length - 1]) {
        renderedResults.push(data)
      }

      return <>{data}</>
    }

    render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    await screen.findByText('suspense-8')
    // fixes https://github.com/zeit/swr/issues/57
    // 'suspense-7' -> undefined -> 'suspense-8'
    expect(renderedResults).toEqual(['suspense-7', 'suspense-8'])
  })

  it('should render correctly when key changes (but with same response data)', async () => {
    // https://github.com/vercel/swr/issues/1056
    const renderedResults = []
    function Section() {
      const [key, setKey] = useState(1)
      const { data } = useSWR(`foo?a=${key}`, () => createResponse('123'), {
        suspense: true
      })
      if (`${data},${key}` !== renderedResults[renderedResults.length - 1]) {
        renderedResults.push(`${data},${key}`)
      }
      return <div onClick={() => setKey(v => v + 1)}>{`${data},${key}`}</div>
    }

    render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    await screen.findByText('123,1')

    fireEvent.click(screen.getByText('123,1'))

    await screen.findByText('123,2')

    expect(renderedResults).toEqual(['123,1', '123,2'])
  })

  it('should render initial data if set', async () => {
    const fetcher = jest.fn(() => 'SWR')

    function Page() {
      const { data } = useSWR('suspense-9', fetcher, {
        fallbackData: 'Initial',
        suspense: true
      })
      return <div>hello, {data}</div>
    }

    render(
      <Suspense fallback={<div>fallback</div>}>
        <Page />
      </Suspense>
    )

    expect(fetcher).not.toBeCalled()
    screen.getByText('hello, Initial')
  })

  it('should avoid unnecessary re-renders', async () => {
    let renderCount = 0
    let startRenderCount = 0
    function Section() {
      ++startRenderCount
      const { data } = useSWR('suspense-10', () => createResponse('SWR'), {
        suspense: true
      })
      ++renderCount
      return <div>{data}</div>
    }

    render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    // hydration
    screen.getByText('fallback')
    await screen.findByText('SWR')
    await act(() => sleep(50)) // wait a moment to observe unnecessary renders
    expect(startRenderCount).toBe(2) // fallback + data
    expect(renderCount).toBe(1) // data
  })
})
