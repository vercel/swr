import React, { Suspense } from 'react'
import {
  cleanup,
  render,
  waitForDomChange,
  act,
  fireEvent
} from '@testing-library/react'

import useSWR, { trigger, mutate, SWRConfig } from '../src'

describe('useSWR', () => {
  afterEach(cleanup)

  it('should return `undefined` on hydration', () => {
    function Page() {
      const { data } = useSWR('constant-1', () => 'SWR')
      return <div>hello, {typeof data === 'undefined' ? '' : 'ERROR'}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
  })

  it('should return data after hydration', async () => {
    function Page() {
      const { data } = useSWR('constant-2', () => 'SWR')
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    await waitForDomChange({ container }) // mount
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, SWR"`
    )
  })

  it('should allow functions as key and reuse the cache', async () => {
    function Page() {
      const { data } = useSWR(() => 'constant-2', () => 'SWR')
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, SWR"`
    )
  })

  it('should allow async fetcher functions', async () => {
    function Page() {
      const { data } = useSWR(
        'constant-3',
        () => new Promise(res => setTimeout(() => res('SWR'), 200))
      )
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    await waitForDomChange({ container })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, SWR"`
    )
  })

  it('should dedupe requests by default', async () => {
    let count = 0
    const fetch = () => {
      count++
      return new Promise(res => setTimeout(() => res('SWR'), 200))
    }

    function Page() {
      const { data: v1 } = useSWR('constant-4', fetch)
      const { data: v2 } = useSWR('constant-4', fetch)
      return (
        <div>
          {v1}, {v2}
        </div>
      )
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`", "`)
    await waitForDomChange({ container })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"SWR, SWR"`)
    // only fetches once
    expect(count).toEqual(1)
  })

  it('should trigger the onSuccess event', async () => {
    let SWRData = null
    function Page() {
      const { data } = useSWR(
        'constant-5',
        () => new Promise(res => setTimeout(() => res('SWR'), 200)),
        { onSuccess: _data => (SWRData = _data) }
      )
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    await waitForDomChange({ container })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, SWR"`
    )
    expect(SWRData).toEqual('SWR')
  })
})

describe('useSWR - refresh', () => {
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
})

describe('useSWR - revalidate', () => {
  afterEach(cleanup)

  it('should rerender after triggering revalidation', async () => {
    let value = 0

    function Page() {
      const { data, revalidate } = useSWR('dynamic-3', () => value++)
      return <button onClick={revalidate}>data: {data}</button>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    await waitForDomChange({ container }) // mount
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 0"`)
    await act(() => {
      // trigger revalidation
      fireEvent.click(container.firstElementChild)
      return new Promise(res => setTimeout(res, 1))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should revalidate all the hooks with the same key', async () => {
    let value = 0

    function Page() {
      const { data: v1, revalidate } = useSWR('dynamic-4', () => value++)
      const { data: v2 } = useSWR('dynamic-4', () => value++)
      return (
        <button onClick={revalidate}>
          {v1}, {v2}
        </button>
      )
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`", "`)
    await waitForDomChange({ container }) // mount
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"0, 0"`)
    await act(() => {
      // trigger revalidation
      fireEvent.click(container.firstElementChild)
      return new Promise(res => setTimeout(res, 1))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"1, 1"`)
  })
})

describe('useSWR - error', () => {
  afterEach(cleanup)

  it('should handle errors', async () => {
    function Page() {
      const { data, error } = useSWR(
        'error-1',
        () =>
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error('error!')), 200)
          )
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    await waitForDomChange({ container })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"error!"`)
  })

  it('should trigger the onError event', async () => {
    let erroredSWR = null
    function Page() {
      const { data, error } = useSWR(
        'error-2',
        () =>
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error('error!')), 200)
          ),
        { onError: (_, key) => (erroredSWR = key) }
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    await waitForDomChange({ container })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"error!"`)
    expect(erroredSWR).toEqual('error-2')
  })

  it('should trigger error retry', async () => {
    let count = 0
    function Page() {
      const { data, error } = useSWR(
        'error-3',
        () => {
          return new Promise((_, rej) =>
            setTimeout(() => rej(new Error('error: ' + count++)), 100)
          )
        },
        {
          onErrorRetry: (_, __, ___, revalidate, revalidateOpts) => {
            setTimeout(() => revalidate(revalidateOpts), 100)
          },
          dedupingInterval: 0
        }
      )
      if (error) return <div>{error.message}</div>
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    await waitForDomChange({ container })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"error: 0"`)
    await act(() => new Promise(res => setTimeout(res, 210))) // retry
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"error: 1"`)
    await act(() => new Promise(res => setTimeout(res, 210))) // retry
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"error: 2"`)
  })

  it('should trigger the onLoadingSlow and onSuccess event', async () => {
    let loadingSlow = null,
      success = null
    function Page() {
      const { data } = useSWR(
        'error-4',
        () => new Promise(res => setTimeout(() => res('SWR'), 200)),
        {
          onLoadingSlow: key => (loadingSlow = key),
          onSuccess: (_, key) => (success = key),
          loadingTimeout: 100
        }
      )
      return <div>hello, {data}</div>
    }
    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"hello, "`)
    expect(loadingSlow).toEqual(null)
    await act(() => new Promise(res => setTimeout(res, 110))) // slow
    expect(loadingSlow).toEqual('error-4')
    expect(success).toEqual(null)
    await act(() => new Promise(res => setTimeout(res, 100))) // finish
    expect(success).toEqual('error-4')
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, SWR"`
    )
  })
})

describe('useSWR - focus', () => {
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

describe('useSWR - local mutation', () => {
  afterEach(cleanup)

  it('should trigger revalidation programmatically', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-7', () => value++, {
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
      trigger('dynamic-7')
      return new Promise(res => setTimeout(res, 1))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should mutate the cache and revalidate', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('dynamic-8', () => value++, {
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
      // mutate and revalidate
      mutate('dynamic-8', 'mutate')
      return new Promise(res => setTimeout(res, 1))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })

  it('should mutate the cache and revalidate in async', async () => {
    function Page() {
      const { data } = useSWR(
        'dynamic-9',
        () => new Promise(res => setTimeout(() => res('truth'), 200)),
        { dedupingInterval: 0 }
      )
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    await waitForDomChange({ container }) // mount
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"data: truth"`
    )
    await act(() => {
      // mutate and revalidate
      mutate('dynamic-9', 'local')
      return new Promise(res => setTimeout(res, 1))
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"data: local"`
    )
    await act(() => new Promise(res => setTimeout(res, 200))) // recovers
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"data: truth"`
    )
  })
})

describe('useSWR - context configs', () => {
  afterEach(cleanup)

  it('should read the config fallback from the context', async () => {
    let value = 0
    const fetcher = () => value++

    function Section() {
      const { data } = useSWR('dynamic-10')
      return <div>data: {data}</div>
    }
    function Page() {
      // config provider
      return (
        <SWRConfig
          value={{ fetcher, refreshInterval: 100, dedupingInterval: 0 }}
        >
          <Section />
        </SWRConfig>
      )
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    await waitForDomChange({ container }) // mount
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 0"`)
    await act(() => new Promise(res => setTimeout(res, 110))) // update
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })
})

describe('useSWR - suspense', () => {
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
      const { data: v1 } = useSWR(
        'suspense-2',
        () => new Promise(res => setTimeout(() => res(1), 100)),
        {
          suspense: true
        }
      )
      const { data: v2 } = useSWR(
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
})
