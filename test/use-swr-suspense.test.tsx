import { act, fireEvent, screen } from '@testing-library/react'
import type { ReactNode, PropsWithChildren } from 'react'
import { Profiler } from 'react'
import React, { Suspense, useEffect, useReducer, useState } from 'react'
import useSWR, { mutate } from 'swr'
import {
  createKey,
  createResponse,
  renderWithConfig,
  renderWithGlobalCache,
  sleep
} from './utils'

class ErrorBoundary extends React.Component<
  PropsWithChildren<{ fallback: ReactNode }>
> {
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
    const key = createKey()
    function Section() {
      const { data } = useSWR(key, () => createResponse('SWR'), {
        suspense: true
      })
      return <div>{data}</div>
    }

    renderWithConfig(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    // hydration
    screen.getByText('fallback')
    await screen.findByText('SWR')
  })

  it('should render multiple SWR fallbacks', async () => {
    const key = createKey()
    function Section() {
      const { data: v1 } = useSWR<number>(
        key,
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

    renderWithConfig(
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
    const key = createKey()
    function Section() {
      const { data } = useSWR(key, () => 'hello', {
        suspense: true
      })
      return <div>{data}</div>
    }
    renderWithConfig(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    await screen.findByText('hello')
  })
  it('should throw errors', async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const key = createKey()
    function Section() {
      const { data } = useSWR<any>(
        key,
        () => createResponse(new Error('error')),
        {
          suspense: true
        }
      )
      return <div>{data}</div>
    }

    // https://reactjs.org/docs/concurrent-mode-suspense.html#handling-errors
    renderWithConfig(
      <ErrorBoundary fallback={<div>error boundary</div>}>
        <Suspense fallback={<div>fallback</div>}>
          <Section />
        </Suspense>
      </ErrorBoundary>
    )

    // hydration
    screen.getByText('fallback')
    await screen.findByText('error boundary')
    // 1 for js-dom 1 for react-error-boundary
    expect(console.error).toHaveBeenCalledTimes(3)
  })

  it('should render cached data with error', async () => {
    const key = createKey()
    mutate(key, 'hello')

    function Section() {
      const { data, error } = useSWR(
        // this value is cached
        key,
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

    renderWithGlobalCache(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    screen.getByText('hello,') // directly from cache
    await screen.findByText('hello, error') // get the error with cache
  })

  it('should not fetch when cached data is present and `revalidateIfStale` is false', async () => {
    const key = createKey()
    mutate(key, 'cached')

    let fetchCount = 0

    function Section() {
      const { data } = useSWR(key, () => createResponse(++fetchCount), {
        suspense: true,
        revalidateIfStale: false
      })
      return <div>{data}</div>
    }

    renderWithGlobalCache(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    screen.getByText('cached')
    await act(() => sleep(50)) // Wait to confirm fetch is not triggered
    expect(fetchCount).toBe(0)
  })

  it('should pause when key changes', async () => {
    const renderedResults = []
    const initialKey = createKey()
    const updatedKey = createKey()
    function Section() {
      const [key, setKey] = useState(initialKey)
      const { data } = useSWR(key, k => createResponse(k), {
        suspense: true
      })

      useEffect(() => {
        if (data === initialKey) {
          setKey(updatedKey)
        }
      }, [data])

      if (data !== renderedResults[renderedResults.length - 1]) {
        renderedResults.push(data)
      }

      return <>{data}</>
    }

    renderWithConfig(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )
    // FIXME: without this line, the test will fail with react@canary
    await sleep(10)
    await screen.findByText(updatedKey)
    // fixes https://github.com/vercel/swr/issues/57
    // initialKey' -> undefined -> updatedKey
    expect(renderedResults).toEqual([initialKey, updatedKey])
  })

  it('should render correctly when key changes (but with same response data)', async () => {
    // https://github.com/vercel/swr/issues/1056
    const renderedResults = []
    const baseKey = createKey()
    function Section() {
      const [key, setKey] = useState(1)
      const { data } = useSWR(
        `${baseKey}-${key}`,
        () => createResponse('123'),
        {
          suspense: true
        }
      )
      if (`${data},${key}` !== renderedResults[renderedResults.length - 1]) {
        renderedResults.push(`${data},${key}`)
      }
      return <div onClick={() => setKey(v => v + 1)}>{`${data},${key}`}</div>
    }

    renderWithConfig(
      <Suspense fallback={<div>fallback</div>}>
        <Section />
      </Suspense>
    )

    await screen.findByText('123,1')

    fireEvent.click(screen.getByText('123,1'))

    await screen.findByText('123,2')

    expect(renderedResults).toEqual(['123,1', '123,2'])
  })

  it('should render correctly when key changes (from null to valid key)', async () => {
    // https://github.com/vercel/swr/issues/1836
    const renderedResults = []
    const baseKey = createKey()
    let setData: any = () => {}
    const Result = ({ query }: { query: string }) => {
      const { data } = useSWR(
        query ? `${baseKey}-${query}` : null,
        key => createResponse(key, { delay: 200 }),
        {
          suspense: true
        }
      )
      if (`${data}` !== renderedResults[renderedResults.length - 1]) {
        if (data === undefined) {
          renderedResults.push(`${baseKey}-nodata`)
        } else {
          renderedResults.push(`${data}`)
        }
      }
      return <div>{data ? data : `${baseKey}-nodata`}</div>
    }
    const App = () => {
      const [query, setQuery] = useState('123')
      if (setData !== setQuery) {
        setData = setQuery
      }
      return (
        <>
          <br />
          <br />
          <Suspense fallback={null}>
            <Result query={query}></Result>
          </Suspense>
        </>
      )
    }

    renderWithConfig(<App />)

    await screen.findByText(`${baseKey}-123`)

    act(() => setData(''))
    await screen.findByText(`${baseKey}-nodata`)

    act(() => setData('456'))
    await screen.findByText(`${baseKey}-456`)

    expect(renderedResults).toEqual([
      `${baseKey}-123`,
      `${baseKey}-nodata`,
      `${baseKey}-456`
    ])
  })

  it('should render initial data if set', async () => {
    const fetcher = jest.fn(() => 'SWR')

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, fetcher, {
        fallbackData: 'Initial',
        suspense: true
      })
      return <div>hello, {data}</div>
    }

    renderWithConfig(
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
    const key = createKey()
    function Section() {
      ++startRenderCount
      const { data } = useSWR(key, () => createResponse('SWR'), {
        suspense: true
      })
      ++renderCount
      return <div>{data}</div>
    }

    renderWithConfig(
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

  it('should return `undefined` data for falsy key', async () => {
    const key = createKey()
    const Section = ({ trigger }: { trigger: boolean }) => {
      const { data } = useSWR(
        trigger ? key : null,
        () => createResponse('SWR'),
        {
          suspense: true
        }
      )
      return <div>{data || 'empty'}</div>
    }

    const App = () => {
      const [trigger, toggle] = useReducer(x => !x, false)
      return (
        <div>
          <button onClick={toggle}>toggle</button>
          <Suspense fallback={<div>fallback</div>}>
            <Section trigger={trigger} />
          </Suspense>
        </div>
      )
    }

    renderWithConfig(<App />)

    await screen.findByText('empty')

    fireEvent.click(screen.getByRole('button'))

    screen.getByText('fallback')

    await screen.findByText('SWR')
  })

  it('should only render fallback once when `keepPreviousData` is set to true', async () => {
    const originKey = createKey()
    const newKey = createKey()
    const onRender = jest.fn()
    const Result = ({ query }: { query: string }) => {
      const { data } = useSWR(query, q => createResponse(q, { delay: 200 }), {
        suspense: true,
        keepPreviousData: true
      })
      return <div>data: {data}</div>
    }
    const App = () => {
      const [query, setQuery] = useState(originKey)
      return (
        <>
          <button onClick={() => setQuery(newKey)}>change</button>
          <br />
          <Suspense
            fallback={
              <Profiler id={originKey} onRender={onRender}>
                <div>loading</div>
              </Profiler>
            }
          >
            <Result query={query}></Result>
          </Suspense>
        </>
      )
    }
    renderWithConfig(<App />)
    await act(() => sleep(200))
    await screen.findByText(`data: ${originKey}`)
    fireEvent.click(screen.getByText('change'))
    await act(() => sleep(200))
    await screen.findByText(`data: ${newKey}`)
    expect(onRender).toHaveBeenCalledTimes(1)
  })
})
