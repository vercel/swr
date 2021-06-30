import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import useSWR, { createCache, SWRConfig } from '../src'
import { createKey } from './utils'

describe('useSWR - status', () => {
  it('should update `status` when initial and revalidate requests are successful', async () => {
    const fetcher = _key => new Promise(resolve => resolve('data'))
    const key = createKey()

    function Section() {
      const { status, mutate } = useSWR(key, fetcher)

      return (
        <div onClick={() => mutate()} data-testid="status">
          {status}
        </div>
      )
    }

    const customCache = new Map()
    const { cache } = createCache(customCache)

    render(
      <SWRConfig value={{ cache }}>
        <Section />
      </SWRConfig>
    )

    expect(screen.getByText('loading')).toBeInTheDocument()

    await screen.findByText('stale')

    expect(screen.getByTestId('status')).toHaveTextContent('stale')

    act(() => {
      fireEvent.click(screen.getByTestId('status'))
    })

    expect(screen.getByText('validating')).toBeInTheDocument()

    await screen.findByText('stale')

    expect(screen.getByTestId('status')).toHaveTextContent('stale')
  })

  it('should update `status` when request fails but mutate resolves, no retry on error', async () => {
    let init = false

    const fetcher = _key => {
      if (init) return new Promise(resolve => resolve('data'))
      init = true

      return new Promise((_, reject) => reject('reason'))
    }

    const key = createKey()

    function Section() {
      const { status, error, mutate, isValidating } = useSWR(key, fetcher)

      return (
        <div>
          <div onClick={() => mutate()} data-testid="status">
            {status}
          </div>
          {error && isValidating ? (
            <span>Healing from error</span>
          ) : (
            <span>Gave up</span>
          )}
        </div>
      )
    }

    const customCache = new Map()
    const { cache } = createCache(customCache)

    render(
      <SWRConfig value={{ cache, shouldRetryOnError: false }}>
        <Section />
      </SWRConfig>
    )

    expect(screen.getByText('loading')).toBeInTheDocument()

    await screen.findByText('error')

    expect(screen.getByTestId('status')).toHaveTextContent('error')

    expect(screen.getByText('Gave up')).toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByTestId('status'))
    })

    expect(screen.getByText('Healing from error')).toBeInTheDocument()

    await screen.findByText('stale')

    expect(screen.getByTestId('status')).toHaveTextContent('stale')
  })

  it('should update `status` when a request fails but mutate is successful, with retry on error', async () => {
    let init = false

    const fetcher = _key => {
      if (init) return new Promise(resolve => resolve('data'))
      init = true

      return new Promise((_, reject) => reject('reason'))
    }

    const key = createKey()

    function Section() {
      const { status, error, mutate, isValidating } = useSWR(key, fetcher)

      return (
        <div>
          <div onClick={() => mutate()} data-testid="status">
            {status}
          </div>
          {error && isValidating ? (
            <span>Healing from error</span>
          ) : (
            <span>Gave up</span>
          )}
        </div>
      )
    }

    const customCache = new Map()
    const { cache } = createCache(customCache)

    render(
      <SWRConfig value={{ cache }}>
        <Section />
      </SWRConfig>
    )

    expect(screen.getByText('loading')).toBeInTheDocument()

    await screen.findByText('error')

    expect(screen.getByTestId('status')).toHaveTextContent('error')

    expect(screen.getByText('Healing from error')).toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByTestId('status'))
    })

    expect(screen.getByText('Healing from error')).toBeInTheDocument()

    await screen.findByText('stale')

    expect(screen.getByTestId('status')).toHaveTextContent('stale')
  })

  it('should update `status` when a request always fails, no mutate and with retry on error', async () => {
    const fetcher = _key => {
      return new Promise((_, reject) => reject('reason'))
    }

    const key = createKey()

    function Section() {
      const { status, error, isValidating } = useSWR(key, fetcher)

      return (
        <div>
          <div data-testid="status">{status}</div>
          {error && isValidating ? (
            <span>Healing from error</span>
          ) : (
            <span>Gave up</span>
          )}
        </div>
      )
    }

    const customCache = new Map()
    const { cache } = createCache(customCache)

    render(
      <SWRConfig
        value={{
          cache,
          errorRetryInterval: 20,
          errorRetryCount: 3
        }}
      >
        <Section />
      </SWRConfig>
    )

    expect(screen.getByText('loading')).toBeInTheDocument()

    await screen.findByText('error')

    expect(screen.getByTestId('status')).toHaveTextContent('error')

    expect(screen.getByText('Healing from error')).toBeInTheDocument()

    await screen.findByText('Gave up')

    expect(screen.getByText('Gave up')).toBeInTheDocument()

    expect(screen.getByTestId('status')).toHaveTextContent('error')
  })

  it('should update `status` when a request fails, fails to retry 3 times, and then mutate succeeds', async () => {
    const initial = 1
    const retries = 3
    let count = 0
    const fetcher = _key => {
      if (count === retries + initial)
        return new Promise(resolve => resolve('data'))
      count += 1
      return new Promise((_, reject) => reject('reason'))
    }

    const key = createKey()

    function Section() {
      const { status, error, mutate, isValidating } = useSWR(key, fetcher)

      return (
        <div>
          <div onClick={() => mutate()} data-testid="status">
            {status}
          </div>
          {error && isValidating ? (
            <span>Healing from error</span>
          ) : (
            <span>Gave up</span>
          )}
        </div>
      )
    }

    const customCache = new Map()
    const { cache } = createCache(customCache)

    render(
      <SWRConfig
        value={{
          cache,
          errorRetryInterval: 20,
          errorRetryCount: retries
        }}
      >
        <Section />
      </SWRConfig>
    )

    expect(screen.getByText('loading')).toBeInTheDocument()

    await screen.findByText('error')

    expect(screen.getByTestId('status')).toHaveTextContent('error')

    expect(screen.getByText('Healing from error')).toBeInTheDocument()

    await screen.findByText('Gave up')

    expect(screen.getByText('Gave up')).toBeInTheDocument()

    expect(screen.getByTestId('status')).toHaveTextContent('error')

    act(() => {
      fireEvent.click(screen.getByTestId('status'))
    })

    expect(screen.getByText('Healing from error')).toBeInTheDocument()

    await screen.findByText('stale')

    expect(screen.getByTestId('status')).toHaveTextContent('stale')
  })
})
