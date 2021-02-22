import { act, render, screen } from '@testing-library/react'
import React, { ReactNode, Suspense, useEffect, useState } from 'react'
import useSWR, { mutate } from '../src'
import { sleep } from './utils'

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
      const { data } = useSWR(
        'suspense-1',
        () => new Promise(res => setTimeout(() => res('SWR'), 100)),
        {
          suspense: true
        }
      )
      return <div>{data}</div>
    }
    const { container } = render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    // hydration
    expect(container.textContent).toMatchInlineSnapshot(`"fallback"`)
    await act(() => sleep(110)) // update
    await screen.findByText('SWR')
  })

  it('should render multiple SWR fallbacks', async () => {
    function Section() {
      const { data: v1 } = useSWR<number>(
        'suspense-2',
        () => new Promise(res => setTimeout(() => res(1), 100)),
        {
          suspense: true
        }
      )
      const { data: v2 } = useSWR<number>(
        'suspense-3',
        () => new Promise(res => setTimeout(() => res(2), 100)),
        {
          suspense: true
        }
      )
      return <div>{v1 + v2}</div>
    }
    const { container } = render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    // hydration
    expect(container.textContent).toMatchInlineSnapshot(`"fallback"`)
    await act(() => new Promise(res => setTimeout(res, 150))) // still suspending
    expect(container.textContent).toMatchInlineSnapshot(`"fallback"`)
    await act(() => new Promise(res => setTimeout(res, 100))) // should recover
    expect(container.textContent).toMatchInlineSnapshot(`"3"`)
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
        () =>
          new Promise((_, reject) => setTimeout(() => reject('error'), 100)),
        {
          suspense: true
        }
      )
      return <div>{data}</div>
    }
    // https://reactjs.org/docs/concurrent-mode-suspense.html#handling-errors
    const { container } = render(
      <ErrorBoundary fallback={<div>error boundary</div>}>
        <Suspense fallback={<div>fallback</div>}>
          <Section />
        </Suspense>
      </ErrorBoundary>
    )

    // hydration
    expect(container.textContent).toMatchInlineSnapshot(`"fallback"`)
    await act(() => sleep(150)) // still suspending
    expect(container.textContent).toMatchInlineSnapshot(`"error boundary"`)
    // 1 for js-dom 1 for react-error-boundray
    expect(console.error).toHaveBeenCalledTimes(2)
  })

  it('should render cached data with error', async () => {
    mutate('suspense-6', 'hello')

    function Section() {
      const { data, error } = useSWR(
        // this value is cached
        'suspense-6',
        () =>
          new Promise((_, reject) => setTimeout(() => reject('error'), 100)),
        {
          suspense: true
        }
      )
      return (
        <div>
          {data}, {error}
        </div>
      )
    }

    const { container } = render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    expect(container.textContent).toMatchInlineSnapshot(`"hello, "`) // directly from cache
    await act(() => sleep(150)) // still suspending
    expect(container.textContent).toMatchInlineSnapshot(`"hello, error"`) // get error with cache
  })

  it('should pause when key changes', async () => {
    const renderedResults = []
    function Section() {
      const [key, setKey] = useState('suspense-7')
      const { data } = useSWR(
        key,
        k => new Promise(res => setTimeout(() => res(k), 50)),
        {
          suspense: true
        }
      )

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

  it('should render initial data if set', async () => {
    const fetcher = jest.fn(() => 'SWR')

    function Page() {
      const { data } = useSWR('suspense-9', fetcher, {
        initialData: 'Initial',
        suspense: true
      })
      return <div>hello, {data}</div>
    }

    const { container } = render(
      <Suspense fallback={<div>fallback</div>}>
        <Page />
      </Suspense>
    )

    expect(fetcher).not.toBeCalled()
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, Initial"`
    )
  })
  it('should avoid unnecessary re-renders', async () => {
    let renderCount = 0
    let startRenderCount = 0
    function Section() {
      ++startRenderCount
      const { data } = useSWR(
        'suspense-10',
        () => new Promise(res => setTimeout(() => res('SWR'), 100)),
        {
          suspense: true
        }
      )
      ++renderCount
      return <div>{data}</div>
    }
    const { container } = render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    // hydration
    expect(container.textContent).toMatchInlineSnapshot(`"fallback"`)
    await screen.findByText('SWR')
    await act(() => sleep(100)) // wait a moment to observe unnecessary renders
    expect(startRenderCount).toBe(2) // fallback + data
    expect(renderCount).toBe(1) // data
  })
})
