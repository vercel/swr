import { act, screen } from '@testing-library/react'
import useSWR from 'swr'
import { createKey, renderWithConfig, sleep } from './utils'

describe('useSWR - auto abort', () => {
  it('should abort previous request when a new request starts', async () => {
    const key = createKey()
    let abortedCount = 0
    let fetchCount = 0

    const fetcher = async (
      _key: string,
      { signal }: { signal: AbortSignal }
    ) => {
      fetchCount++
      const currentFetch = fetchCount

      signal.addEventListener('abort', () => {
        abortedCount++
      })

      await sleep(100)

      if (signal.aborted) {
        throw new Error(`aborted-${currentFetch}`)
      }

      return `response-${currentFetch}`
    }

    let mutate: any

    function Page() {
      const { data, mutate: boundMutate, error } = useSWR(key, fetcher)
      mutate = boundMutate

      return (
        <div>
          data:{data},error:{error?.message}
        </div>
      )
    }

    renderWithConfig(<Page />)

    // Make sure the first request is ongoing
    await sleep(20)

    // Immediately trigger a mutation
    await act(() => mutate())

    // Final state should be from the mutation
    await screen.findByText(/data:response-2/)

    // The subsequent requests should have aborted previous ones
    expect(fetchCount).toBe(2)
    expect(abortedCount).toBe(1)
  })

  it('should pass AbortSignal to fetcher', async () => {
    const key = createKey()
    let receivedSignal: AbortSignal | undefined

    const fetcher = async (
      _key: string,
      { signal }: { signal: AbortSignal }
    ) => {
      receivedSignal = signal
      await sleep(10)
      return 'data'
    }

    function Page() {
      const { data } = useSWR(key, fetcher)
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)

    await screen.findByText('data:data')

    // Verify that an AbortSignal was passed to the fetcher
    expect(receivedSignal).toBeInstanceOf(AbortSignal)
    expect(receivedSignal.aborted).toBe(false)
  })

  it('should not abort request during deduplication', async () => {
    const key = createKey()
    let abortedCount = 0
    let fetchCount = 0

    const fetcher = async (
      _key: string,
      { signal }: { signal?: AbortSignal }
    ) => {
      fetchCount++

      signal?.addEventListener('abort', () => {
        abortedCount++
      })

      await sleep(100)
      return 'data'
    }

    function Page1() {
      const { data } = useSWR(key, fetcher)
      return <div>page1:{data}</div>
    }

    function Page2() {
      const { data } = useSWR(key, fetcher)
      return <div>page2:{data}</div>
    }

    renderWithConfig(
      <>
        <Page1 />
        <Page2 />
      </>
    )

    await screen.findByText('page1:data')
    await screen.findByText('page2:data')

    // Should only fetch once due to deduplication
    expect(fetchCount).toBe(1)
    // No aborts should have occurred
    expect(abortedCount).toBe(0)
  })

  it('should handle fetch errors gracefully when aborted', async () => {
    const key = createKey()
    let fetchCount = 0

    const fetcher = async (
      _key: string,
      { signal }: { signal?: AbortSignal }
    ) => {
      fetchCount++

      await sleep(50)

      if (signal?.aborted) {
        const error = new Error('Aborted')
        error.name = 'AbortError'
        throw error
      }

      return 'data'
    }

    let mutate: any

    function Page() {
      const {
        data,
        error,
        mutate: boundMutate
      } = useSWR(key, fetcher, {
        // Disable error retry to make the test faster
        shouldRetryOnError: false
      })
      mutate = boundMutate

      return (
        <div>
          <div>data:{data}</div>
          {error && <div>error:{error.message}</div>}
        </div>
      )
    }

    renderWithConfig(<Page />)

    // Wait for initial fetch
    await screen.findByText('data:data')

    // Trigger rapid revalidations
    await act(() => mutate())

    await sleep(10)

    await act(() => mutate())

    // Wait a bit for things to settle
    await sleep(200)

    // Should eventually show data (not error)
    expect(screen.getByText(/data:data/)).toBeInTheDocument()
    expect(fetchCount).toBeGreaterThan(1)
  })

  it('should cleanup abort controller after request completes', async () => {
    const key = createKey()
    let signal: AbortSignal | undefined

    const fetcher = async (_key: string, opts: { signal: AbortSignal }) => {
      signal = opts.signal
      await sleep(50)
      return 'data'
    }

    function Page() {
      const { data } = useSWR(key, fetcher)
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)

    await screen.findByText('data:data')

    // After the request completes, the signal should not be aborted
    // (it's cleaned up properly)
    expect(signal).toBeDefined()
    expect(signal?.aborted).toBe(false)
  })
})
