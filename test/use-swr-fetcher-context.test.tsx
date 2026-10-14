import { act, fireEvent, createEvent, screen } from '@testing-library/react'
import { Suspense } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import type { FetcherContext, Middleware } from 'swr'
import useSWRInfinite from 'swr/infinite'
import { createKey, focusOn, nextTick, renderWithConfig, sleep } from './utils'

describe('useSWR - fetcher context', () => {
  it('should pass the mount trigger on the initial request', async () => {
    const key = createKey()
    const contexts: FetcherContext[] = []
    function Page() {
      const { data } = useSWR(key, (_, ctx) => {
        contexts.push(ctx)
        return 'ok'
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data: ok')

    expect(contexts).toEqual([{ trigger: 'mount', retryCount: 0 }])
  })

  it('should pass the mount trigger when revalidating with fallback data', async () => {
    const key = createKey()
    const contexts: FetcherContext[] = []
    function Page() {
      const { data } = useSWR(
        key,
        (_, ctx) => {
          contexts.push(ctx)
          return 'fresh'
        },
        { fallbackData: 'fallback' }
      )
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('data: fallback')
    await screen.findByText('data: fresh')

    expect(contexts).toEqual([{ trigger: 'mount', retryCount: 0 }])
  })

  it('should pass the interval trigger when polling', async () => {
    jest.useFakeTimers()
    try {
      const key = createKey()
      const triggers: string[] = []
      let count = 0
      function Page() {
        const { data } = useSWR(
          key,
          (_, ctx) => {
            triggers.push(ctx.trigger)
            return count++
          },
          { refreshInterval: 200, dedupingInterval: 100 }
        )
        return <div>count: {data}</div>
      }

      renderWithConfig(<Page />)
      await screen.findByText('count: 0')

      await act(async () => {
        jest.advanceTimersByTime(200)
      })
      screen.getByText('count: 1')
      await act(async () => {
        jest.advanceTimersByTime(200)
      })
      screen.getByText('count: 2')

      expect(triggers).toEqual(['mount', 'interval', 'interval'])
    } finally {
      jest.useRealTimers()
    }
  })

  it('should pass the focus trigger when revalidating on focus', async () => {
    const key = createKey()
    const triggers: string[] = []
    let count = 0
    function Page() {
      const { data } = useSWR(
        key,
        (_, ctx) => {
          triggers.push(ctx.trigger)
          return count++
        },
        { dedupingInterval: 0, focusThrottleInterval: 0 }
      )
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data: 0')

    await nextTick()
    await focusOn(window)
    await screen.findByText('data: 1')

    expect(triggers).toEqual(['mount', 'focus'])
  })

  it('should pass the reconnect trigger when revalidating on reconnect', async () => {
    const key = createKey()
    const triggers: string[] = []
    let count = 0
    function Page() {
      const { data } = useSWR(
        key,
        (_, ctx) => {
          triggers.push(ctx.trigger)
          return count++
        },
        { dedupingInterval: 0 }
      )
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data: 0')

    await nextTick()
    fireEvent(window, createEvent('offline', window))
    fireEvent(window, createEvent('online', window))
    await screen.findByText('data: 1')

    expect(triggers).toEqual(['mount', 'reconnect'])
  })

  it('should pass the mutate trigger for bound and global mutate', async () => {
    const key = createKey()
    const triggers: string[] = []
    let count = 0
    let boundMutate: () => Promise<any>
    let globalMutate: (key: string) => Promise<any>
    function Page() {
      const { data, mutate } = useSWR(
        key,
        (_, ctx) => {
          triggers.push(ctx.trigger)
          return count++
        },
        { dedupingInterval: 0 }
      )
      boundMutate = () => mutate()
      globalMutate = useSWRConfig().mutate
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data: 0')

    await act(() => boundMutate())
    await screen.findByText('data: 1')
    await act(() => globalMutate(key))
    await screen.findByText('data: 2')

    expect(triggers).toEqual(['mount', 'mutate', 'mutate'])
  })

  it('should pass the retry trigger and retry count on error retries', async () => {
    const key = createKey()
    const contexts: FetcherContext[] = []
    function Page() {
      const { data, error } = useSWR(
        key,
        (_, ctx) => {
          contexts.push(ctx)
          if (ctx.retryCount < 2) throw new Error('error')
          return 'ok'
        },
        {
          dedupingInterval: 0,
          onErrorRetry: (_, __, ___, revalidate, revalidateOpts) => {
            setTimeout(() => revalidate(revalidateOpts), 10)
          }
        }
      )
      if (error) return <div>error</div>
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data: ok')

    expect(contexts).toEqual([
      { trigger: 'mount', retryCount: 0 },
      { trigger: 'retry', retryCount: 1 },
      { trigger: 'retry', retryCount: 2 }
    ])
  })

  it('should call the fetcher once with the trigger of the deduplicated request', async () => {
    const key = createKey()
    const triggers: string[] = []
    const fetcher = async (_: string, ctx: FetcherContext) => {
      triggers.push(ctx.trigger)
      await sleep(10)
      return 'ok'
    }
    function A() {
      const { data } = useSWR(key, fetcher)
      return <div>a: {data}</div>
    }
    function B() {
      const { data } = useSWR(key, fetcher)
      return <div>b: {data}</div>
    }

    renderWithConfig(
      <>
        <A />
        <B />
      </>
    )
    await screen.findByText('a: ok')
    await screen.findByText('b: ok')

    expect(triggers).toEqual(['mount'])
  })

  it('should pass the mount trigger in suspense mode', async () => {
    const key = createKey()
    const triggers: string[] = []
    function Page() {
      const { data } = useSWR(
        key,
        async (_, ctx) => {
          triggers.push(ctx.trigger)
          await sleep(10)
          return 'ok'
        },
        { suspense: true }
      )
      return <div>data: {data}</div>
    }

    renderWithConfig(
      <Suspense fallback={<div>fallback</div>}>
        <Page />
      </Suspense>
    )
    screen.getByText('fallback')
    await screen.findByText('data: ok')

    expect(triggers).toEqual(['mount'])
  })

  it('should forward the context to the useSWRInfinite page fetcher', async () => {
    const key = createKey()
    const triggers: string[] = []
    let count = 0
    let mutate: () => Promise<any>
    function Page() {
      const swr = useSWRInfinite(
        index => [key, index],
        (_, ctx) => {
          triggers.push(ctx.trigger)
          return count++
        },
        { dedupingInterval: 0 }
      )
      mutate = () => swr.mutate()
      return <div>data: {swr.data?.join(',')}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText('data: 0')

    await act(() => mutate())
    await screen.findByText('data: 1')

    expect(triggers).toEqual(['mount', 'mutate'])
  })

  it('should keep working with fetchers that ignore the context and with middleware', async () => {
    const key = createKey()
    const received: unknown[][] = []
    const forward: Middleware = useSWRNext => (k, fetcher, config) =>
      useSWRNext(k, fetcher && ((...args: any[]) => fetcher(...args)), config)
    function Page() {
      const { data } = useSWR(
        key,
        (k: string) => {
          received.push([k])
          return 'ok'
        },
        { use: [forward] }
      )
      const { data: ctxData } = useSWR(key + '-ctx', (_, ctx) => ctx.trigger, {
        use: [forward]
      })
      return (
        <div>
          data: {data} {ctxData}
        </div>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText('data: ok mount')

    expect(received).toEqual([[key]])
  })
})
