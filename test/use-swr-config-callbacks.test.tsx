import { screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import useSWR from 'swr'
import { sleep, createResponse, renderWithConfig, createKey } from './utils'

describe('useSWR - config callbacks', () => {
  it('should trigger the onSuccess event with the latest version of the onSuccess callback', async () => {
    let state = null
    let count = 0
    const key = createKey()
    function Page(props: { text: string }) {
      const { data, mutate } = useSWR(key, () => createResponse(count++), {
        onSuccess: () => (state = props.text)
      })
      return (
        <div onClick={() => mutate()}>
          hello, {data}, {props.text}
        </div>
      )
    }
    const { rerender } = renderWithConfig(<Page text={'a'} />)
    // the onSuccess callback does not trigger yet, the state is still null.
    screen.getByText('hello, , a')
    expect(state).toEqual(null)

    await screen.findByText('hello, 0, a')

    expect(state).toEqual('a')

    // props changed, but the onSuccess callback does not trigger yet, `state` is same as before
    rerender(<Page text={'b'} />)
    screen.getByText('hello, 0, b')
    expect(state).toEqual('a')

    // trigger revalidation, this would re-trigger the onSuccess callback
    fireEvent.click(screen.getByText(/hello/))
    await screen.findByText('hello, 1, b')
    // the onSuccess callback should capture the latest `props.text`
    expect(state).toEqual('b')
  })

  it('does not call onSuccess for a request after its key becomes null', async () => {
    const key = createKey()
    const cache = new Map()
    const success = jest.fn()
    let resolveRequest!: (value: string) => void
    const request = new Promise<string>(resolve => {
      resolveRequest = resolve
    })
    const fetcher = jest.fn(() => request)

    function Page({ active, label }: { active: boolean; label: string }) {
      const { data } = useSWR(active ? key : null, fetcher, {
        onSuccess: () => success(label)
      })
      return <div>{data ?? 'empty'}</div>
    }

    function Subscriber() {
      const { data } = useSWR(key, fetcher)
      return <div>subscriber: {data ?? 'empty'}</div>
    }

    function App({
      active,
      label,
      subscribe
    }: {
      active: boolean
      label: string
      subscribe: boolean
    }) {
      return (
        <>
          <Page active={active} label={label} />
          {subscribe && <Subscriber />}
        </>
      )
    }

    const { rerender } = renderWithConfig(
      <App active label="original" subscribe={false} />,
      { provider: () => cache }
    )
    expect(fetcher).toHaveBeenCalledTimes(1)

    rerender(<App active={false} label="later" subscribe />)
    await act(async () => {
      resolveRequest('old result')
      await request
    })

    expect(success).not.toHaveBeenCalled()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(cache.get(key).data).toBe('old result')
    screen.getByText('subscriber: old result')
  })

  it('does not call onError for a request after its key becomes null', async () => {
    const key = createKey()
    const cache = new Map()
    const onError = jest.fn()
    const failure = new Error('old failure')
    let rejectRequest!: (reason: Error) => void
    const request = new Promise<string>((_, reject) => {
      rejectRequest = reject
    })
    const fetcher = jest.fn(() => request)

    function Page({ active }: { active: boolean }) {
      useSWR(active ? key : null, fetcher, {
        onError,
        shouldRetryOnError: false
      })
      return null
    }

    const { rerender } = renderWithConfig(<Page active />, {
      provider: () => cache
    })
    expect(fetcher).toHaveBeenCalledTimes(1)

    rerender(<Page active={false} />)
    await act(async () => {
      rejectRequest(failure)
    })

    expect(onError).not.toHaveBeenCalled()
    expect(cache.get(key).error).toBe(failure)
  })

  it('calls onSuccess when a null key becomes active', async () => {
    const key = createKey()
    const onSuccess = jest.fn()
    let resolveRequest!: (value: string) => void
    const request = new Promise<string>(resolve => {
      resolveRequest = resolve
    })
    const fetcher = jest.fn(() => request)

    function Page({ active }: { active: boolean }) {
      useSWR(active ? key : null, fetcher, { onSuccess })
      return null
    }

    const { rerender } = renderWithConfig(<Page active={false} />)
    expect(fetcher).not.toHaveBeenCalled()

    rerender(<Page active />)
    expect(fetcher).toHaveBeenCalledTimes(1)
    await act(async () => {
      resolveRequest('new result')
      await request
    })

    expect(onSuccess).toHaveBeenCalledWith(
      'new result',
      key,
      expect.any(Object)
    )
  })

  it('should trigger the onError event with the latest version of the onError callback', async () => {
    let state = null
    let count = 0
    const key = createKey()
    function Page(props: { text: string }) {
      const { data, mutate, error } = useSWR(
        key,
        () => createResponse(new Error(`Error: ${count++}`)),
        { onError: () => (state = props.text) }
      )
      if (error)
        return (
          <div title={props.text} onClick={() => mutate()}>
            {error.message}
          </div>
        )
      return (
        <div onClick={() => mutate()}>
          <>
            hello, {data}, {props.text}
          </>
        </div>
      )
    }

    const { rerender } = renderWithConfig(<Page text="a" />)

    screen.getByText('hello, , a')
    expect(state).toEqual(null)
    await screen.findByText('Error: 0')

    expect(state).toEqual('a')

    // props changed, but the onError callback does not trigger yet.
    rerender(<Page text="b" />)
    screen.getByText('Error: 0')
    screen.getByTitle('b')
    expect(state).toEqual('a')

    fireEvent.click(screen.getByTitle('b'))
    await screen.findByText('Error: 1')
    screen.getByTitle('b')
    expect(state).toEqual('b')
  })

  it('should trigger the onErrorRetry event with the latest version of the onErrorRetry callback', async () => {
    let state = null
    let count = 0
    const key = createKey()
    function Page(props: { text: string }) {
      const { data, error } = useSWR(
        key,
        () => createResponse(new Error(`Error: ${count++}`)),
        {
          onErrorRetry: (_, __, ___, revalidate, revalidateOpts) => {
            state = props.text
            revalidate(revalidateOpts)
          }
        }
      )
      if (error) return <div title={props.text}>{error.message}</div>
      return (
        <div>
          <>
            hello, {data}, {props.text}
          </>
        </div>
      )
    }

    const { rerender } = renderWithConfig(<Page text="a" />)
    screen.getByText('hello, , a')
    expect(state).toEqual(null)

    await screen.findByText('Error: 0')
    screen.getByTitle('a')
    expect(state).toEqual('a')

    // since the onErrorRetry schedule a timer to trigger revalidation, and update props.text now
    rerender(<Page text="b" />)
    // not revalidated yet.
    screen.getByText('Error: 0')
    screen.getByTitle('b')
    expect(state).toEqual('a')

    // revalidate
    await screen.findByText('Error: 1')
    screen.getByTitle('b')
    expect(state).toEqual('b')
  })

  it('should trigger the onLoadingSlow and onSuccess event with the lastest version of the callbacks', async () => {
    const LOADING_TIMEOUT = 100
    let state = null
    let count = 0
    const key = createKey()
    function Page(props: { text: string }) {
      const { data } = useSWR(
        key,
        () => createResponse(count++, { delay: LOADING_TIMEOUT * 2 }),
        {
          onLoadingSlow: () => {
            state = props.text
          },
          onSuccess: () => {
            state = props.text
          },
          loadingTimeout: LOADING_TIMEOUT
        }
      )
      return (
        <div>
          hello, {data}, {props.text}
        </div>
      )
    }

    const { rerender } = renderWithConfig(<Page text="a" />)

    screen.getByText('hello, , a')
    expect(state).toEqual(null)

    // should trigger a loading slow event
    await act(() => sleep(LOADING_TIMEOUT * 1.5))
    screen.getByText('hello, , a')
    expect(state).toEqual('a')

    // onSuccess callback should be called with the latest prop value
    rerender(<Page text="b" />)
    await screen.findByText('hello, 0, b')
    expect(state).toEqual('b')
  })

  it('should trigger the onDiscarded callback when having a race condition with mutate', async () => {
    const key = createKey()
    const discardedEvents = []

    function Page() {
      const { mutate } = useSWR(
        key,
        () => createResponse('foo', { delay: 50 }),
        {
          onDiscarded: k => {
            discardedEvents.push(k)
          }
        }
      )
      return <div onClick={() => mutate('bar')}>mutate</div>
    }

    renderWithConfig(<Page />)

    screen.getByText('mutate')
    await act(() => sleep(10))
    fireEvent.click(screen.getByText('mutate'))
    await act(() => sleep(80))

    // Should have one event recorded.
    expect(discardedEvents).toEqual([key])
  })

  it('should not trigger the onSuccess callback when discarded', async () => {
    const key = createKey()
    const discardedEvents = []
    const successEvents = []

    function Page() {
      const { mutate } = useSWR(
        key,
        () => createResponse('foo', { delay: 50 }),
        {
          onDiscarded: k => {
            discardedEvents.push(k)
          },
          onSuccess: d => {
            successEvents.push(d)
          }
        }
      )
      return <div onClick={() => mutate('bar', false)}>mutate</div>
    }

    renderWithConfig(<Page />)

    screen.getByText('mutate')
    await act(() => sleep(10))
    fireEvent.click(screen.getByText('mutate'))
    await act(() => sleep(80))

    // Should have one event recorded.
    expect(discardedEvents).toEqual([key])
    expect(successEvents).toEqual([])
  })
})
