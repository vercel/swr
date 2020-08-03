import {
  act,
  cleanup,
  fireEvent,
  render,
  waitForDomChange
} from '@testing-library/react'
import React, { ReactNode, Suspense, useEffect, useState } from 'react'

import useSWR, { mutate } from '../src'

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

describe('useSWR - when loading', () => {
  afterEach(cleanup)

  const loadData = () => new Promise(res => setTimeout(() => res('data'), 100))

  it('should return loading state', async () => {
    let renderCount = 0
    function Page() {
      const { data, isValidating } = useSWR('is-validating-1', loadData)
      renderCount++
      return (
        <div>
          hello, {data}, {isValidating ? 'loading' : 'ready'}
        </div>
      )
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`"hello, , loading"`)
    await waitForDomChange({ container })
    expect(container.textContent).toMatchInlineSnapshot(`"hello, data, ready"`)

    //    data       isValidating
    // -> undefined, false
    // -> undefined, true
    // -> data,      false
    expect(renderCount).toEqual(3)
  })

  it('should avoid extra rerenders', async () => {
    let renderCount = 0
    function Page() {
      // we never access `isValidating`, so it will not trigger rerendering
      const { data } = useSWR('is-validating-2', loadData)
      renderCount++
      return <div>hello, {data}</div>
    }

    const { container } = render(<Page />)
    await waitForDomChange({ container })
    expect(container.textContent).toMatchInlineSnapshot(`"hello, data"`)

    //    data
    // -> undefined
    // -> data
    expect(renderCount).toEqual(2)
  })

  it('should avoid extra rerenders while fetching', async () => {
    let renderCount = 0,
      dataLoaded = false
    const loadDataWithLog = () =>
      new Promise(res =>
        setTimeout(() => {
          dataLoaded = true
          res('data')
        }, 100)
      )

    function Page() {
      // we never access anything
      useSWR('is-validating-3', loadDataWithLog)
      renderCount++
      return <div>hello</div>
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`"hello"`)

    await act(() => new Promise(res => setTimeout(res, 110))) // wait
    // it doesn't re-render, but fetch was triggered
    expect(renderCount).toEqual(1)
    expect(dataLoaded).toEqual(true)
  })
})

describe('useSWR - when handle refresh', () => {
  afterEach(cleanup)

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
    await waitForDomChange({ container }) // mount
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 0"`)
    await act(() => new Promise(res => setTimeout(res, 210))) // update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => new Promise(res => setTimeout(res, 50))) // no update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => new Promise(res => setTimeout(res, 150))) // update
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
    await waitForDomChange({ container }) // mount
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 0"`)
    await act(() => new Promise(res => setTimeout(res, 210))) // no update (deduped)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 0"`)
    await act(() => new Promise(res => setTimeout(res, 200))) // update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => new Promise(res => setTimeout(res, 200))) // no update (deduped)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => new Promise(res => setTimeout(res, 200))) // update
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

    await waitForDomChange({ container }) // mount
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 0"`)
    await act(() => {
      return new Promise(res => setTimeout(res, 210))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => {
      return new Promise(res => setTimeout(res, 50))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 1"`)
    await act(() => {
      return new Promise(res => setTimeout(res, 150))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 2"`)
    await act(() => {
      fireEvent.click(container.firstElementChild)
      // it will clear 200ms timer and setup a new 300ms timer
      return new Promise(res => setTimeout(res, 200))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 2"`)
    await act(() => {
      return new Promise(res => setTimeout(res, 110))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 3"`)
    await act(() => {
      // wait for new 300ms timer
      return new Promise(res => setTimeout(res, 310))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 4"`)
    await act(() => {
      fireEvent.click(container.firstElementChild)
      // it will clear 300ms timer and setup a new 400ms timer
      return new Promise(res => setTimeout(res, 300))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 4"`)
    await act(() => {
      return new Promise(res => setTimeout(res, 110))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 5"`)
    await act(() => {
      fireEvent.click(container.firstElementChild)
      // it will clear 400ms timer and stop
      return new Promise(res => setTimeout(res, 110))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 5"`)
    await act(() => {
      return new Promise(res => setTimeout(res, 110))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"count: 5"`)
  })

  it('should allow use custom isEqual method', async () => {
    function Page() {
      const { data, revalidate } = useSWR(
        'dynamic-11',
        () => ({
          timestamp: +new Date(),
          version: '1.0'
        }),
        {
          compare: function isEqual(a, b) {
            if (a === b) {
              return true
            }
            if (!a || !b) {
              return false
            }
            return a.version === b.version
          }
        }
      )

      if (!data) {
        return <div>loading</div>
      }
      return <button onClick={revalidate}>{data.timestamp}</button>
    }

    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"loading"`)
    await waitForDomChange({ container })
    const firstContent = container.firstChild.textContent
    await act(() => {
      // trigger revalidation
      fireEvent.click(container.firstElementChild)
      return new Promise(res => setTimeout(res, 1))
    })
    const secondContent = container.firstChild.textContent
    expect(firstContent).toEqual(secondContent)
  })
})

describe('useSWR - when handle focus', () => {
  afterEach(cleanup)

  it('should revalidate on focus by default', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-5', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    await waitForDomChange({ container }) // mount
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 0"`)
    await act(() => {
      // trigger revalidation
      fireEvent.focus(window)
      return new Promise(res => setTimeout(res, 1))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it("shouldn't revalidate on focus when revalidateOnFocus is false", async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-6', () => value++, {
        dedupingInterval: 0,
        revalidateOnFocus: false
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    await waitForDomChange({ container }) // mount
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 0"`)
    await act(() => {
      // trigger revalidation
      fireEvent.focus(window)
      return new Promise(res => setTimeout(res, 1))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 0"`)
  })
})

describe('useSWR - when handle suspense', () => {
  afterEach(cleanup)

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
    await act(() => new Promise(res => setTimeout(res, 110))) // update
    expect(container.textContent).toMatchInlineSnapshot(`"SWR"`)
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
    const { container } = render(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    // hydration
    expect(container.textContent).toMatchInlineSnapshot(`"hello"`)
  })

  it('should throw errors', async () => {
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
    await act(() => new Promise(res => setTimeout(res, 150))) // still suspending
    expect(container.textContent).toMatchInlineSnapshot(`"error boundary"`)

    console.info('*The warning above can be ignored (caught by ErrorBoundary).')
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
    await act(() => new Promise(res => setTimeout(res, 150))) // still suspending
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

    await act(() => new Promise(res => setTimeout(res, 110)))

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
})
