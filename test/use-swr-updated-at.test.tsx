import { act, fireEvent, screen } from '@testing-library/react'
import React, { useEffect, useReducer } from 'react'
import useSWR from 'swr'
import {
  createKey,
  renderWithConfig,
  nextTick as waitForNextTick,
  sleep,
  focusOn
} from './utils'

const focusWindow = () => focusOn(window)

describe('useSWR - updatedAt', () => {
  it('should be initially undefined', async () => {
    const key = createKey()

    const fetcher = () => {
      return 'data'
    }

    function Page() {
      const { updatedAt } = useSWR(key, fetcher)

      return <span data-testid="updatedAt">{updatedAt}</span>
    }

    renderWithConfig(<Page />)

    expect(screen.getByTestId('updatedAt')).toBeEmptyDOMElement()

    await waitForNextTick()

    expect(screen.getByTestId('updatedAt')).not.toBeEmptyDOMElement()
  })

  it('should not trigger re-render if not consumed', async () => {
    const key = createKey()

    const fetcher = () => {
      return 'data'
    }

    const renderSpy = jest.fn()

    function Page() {
      const { data, isValidating } = useSWR(key, fetcher)

      // reading is validating just to trigger more renders
      useEffect(() => {}, [isValidating])

      renderSpy()

      return <span>data: {data}</span>
    }

    renderWithConfig(<Page />)

    expect(screen.getByText(/data/i)).toHaveTextContent('data:')

    expect(renderSpy).toHaveBeenCalledTimes(1)

    await waitForNextTick()

    expect(screen.getByText(/data/i)).toHaveTextContent('data: data')

    expect(renderSpy).toHaveBeenCalledTimes(2)

    await focusWindow()

    await waitForNextTick()

    expect(screen.getByText(/data/i)).toHaveTextContent('data: data')

    expect(renderSpy).toHaveBeenCalledTimes(4)
  })

  it('should updated when the fetcher is called', async () => {
    const key = createKey()

    let fetcherCallTime: number

    const fetcher = () => {
      fetcherCallTime = Date.now()
      return 'data'
    }

    const updateSpy = jest.fn()

    const TIME_INTERVAL = Math.floor(100 + Math.random() * 100)

    const config = {
      dedupingInterval: TIME_INTERVAL
    }

    function Page() {
      const { data, updatedAt } = useSWR(key, fetcher, config)

      useEffect(() => {
        updateSpy(data, updatedAt)
      }, [data, updatedAt])

      return (
        <div>
          <span>data: {data}</span>
          <span>updatedAt: {updatedAt}</span>
        </div>
      )
    }

    renderWithConfig(<Page />)

    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy).toHaveBeenLastCalledWith(undefined, undefined)

    await waitForNextTick()

    expect(updateSpy).toHaveBeenCalledTimes(2)
    const [data, updatedAt] = updateSpy.mock.calls[1]

    expect(data).toEqual('data')
    expect(updatedAt).toBeDefined()

    expect(updatedAt).toBeGreaterThanOrEqual(fetcherCallTime)

    await sleep(config.dedupingInterval)

    await focusWindow()
    await waitForNextTick()

    expect(updateSpy).toHaveBeenCalledTimes(3)
    const [, lastUpdatedAt] = updateSpy.mock.calls[2]

    expect(lastUpdatedAt).toBeGreaterThanOrEqual(fetcherCallTime)
    expect(lastUpdatedAt).toBeGreaterThan(updatedAt)
  })

  it('should be consistent in all hooks using the same key', async () => {
    const key = createKey()

    const fetcher = () => 'data'

    const TIME_INTERVAL = Math.floor(100 + Math.random() * 100)

    const config = {
      dedupingInterval: TIME_INTERVAL,
      refreshInterval: TIME_INTERVAL * 2
    }

    const Dashboard = ({
      testId = 'testId',
      children = null,
      revalidateOnMount = false
    }) => {
      const { updatedAt } = useSWR(key, fetcher, {
        ...config,
        revalidateOnMount
      })

      return (
        <section>
          <span data-testid={testId}>{updatedAt}</span>

          <article>{children}</article>
        </section>
      )
    }

    function Page() {
      const { updatedAt } = useSWR(key, fetcher, config)
      const [show, toggle] = useReducer(x => !x, false)

      return (
        <div>
          <span data-testid="zero">{updatedAt}</span>

          <button onClick={toggle}>show</button>

          <div>
            <Dashboard testId="first" />
          </div>

          {show && <Dashboard testId="second" revalidateOnMount />}
        </div>
      )
    }

    renderWithConfig(<Page />)

    // assert emptiness because the `updatedAt` prop is undefined
    expect(screen.getByTestId('zero')).toBeEmptyDOMElement()
    expect(screen.getByTestId('first')).toBeEmptyDOMElement()

    await waitForNextTick()

    expect(screen.getByTestId('zero')).not.toBeEmptyDOMElement()
    expect(screen.getByTestId('first')).not.toBeEmptyDOMElement()

    const firstUpdatedAt = Number(screen.getByTestId('zero').textContent)

    // Assert that `first` agrees with `zero`
    expect(screen.getByTestId('first')).toHaveTextContent(
      screen.getByTestId('zero').textContent
    )

    fireEvent.click(screen.getByRole('button', { name: 'show' }))

    // Assert that when it mounts, `second` has no knowledge of `updatedAt`
    expect(screen.getByTestId('second')).toBeEmptyDOMElement()

    // wait for the refresh interval
    await act(async () => {
      await sleep(config.refreshInterval)
    })

    expect(Number(screen.getByTestId('zero').textContent)).toBeGreaterThan(
      firstUpdatedAt
    )

    expect(Number(screen.getByTestId('first').textContent)).toBeGreaterThan(
      firstUpdatedAt
    )

    expect(Number(screen.getByTestId('second').textContent)).toBeGreaterThan(
      firstUpdatedAt
    )

    // transitively check that all hooks continue to agree on the `updatedAt` value for `key`
    expect(screen.getByTestId('zero')).toHaveTextContent(
      screen.getByTestId('first').textContent
    )

    expect(screen.getByTestId('first')).toHaveTextContent(
      screen.getByTestId('second').textContent
    )

    const secondUpdateAt = Number(screen.getByTestId('zero').textContent)

    // let the deduping interval run
    await sleep(config.dedupingInterval)

    // trigger revalidation by focus - all `updatedAt` keys should continue to agree
    await focusWindow()
    await waitForNextTick()

    expect(Number(screen.getByTestId('zero').textContent)).toBeGreaterThan(
      secondUpdateAt
    )

    expect(Number(screen.getByTestId('first').textContent)).toBeGreaterThan(
      secondUpdateAt
    )

    expect(Number(screen.getByTestId('second').textContent)).toBeGreaterThan(
      secondUpdateAt
    )

    // transitively check that all hooks continue to agree on the `updatedAt` value for `key`
    expect(screen.getByTestId('zero')).toHaveTextContent(
      screen.getByTestId('first').textContent
    )

    expect(screen.getByTestId('first')).toHaveTextContent(
      screen.getByTestId('second').textContent
    )
  })
})
