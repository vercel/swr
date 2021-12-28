import { act, fireEvent, screen } from '@testing-library/react'
import React, { useEffect, useReducer } from 'react'
import useSWR from 'swr'
import { createKey, renderWithConfig, sleep } from './utils'

describe('useSWR - updatedAt', () => {
  it('should be initially undefined', async () => {
    const key = createKey()

    const fetcher = () => {
      return 'data'
    }

    function Page() {
      const { mutate, updatedAt } = useSWR(key, fetcher, {
        revalidateOnMount: false
      })

      return <button onClick={() => mutate()}>data: {updatedAt}</button>
    }

    renderWithConfig(<Page />)

    screen.getByText('data:')
  })

  it('should not trigger re-render if not consumed', async () => {
    const key = createKey()

    const fetcher = () => {
      return 'data'
    }

    const renderSpy = jest.fn()

    function Page() {
      const { mutate } = useSWR(key, fetcher, {
        revalidateOnMount: false
      })

      renderSpy()

      return <button onClick={() => mutate()}>data</button>
    }

    renderWithConfig(<Page />)

    screen.getByText('data')

    fireEvent.click(screen.getByRole('button'))

    await act(async () => {
      await new Promise<void>(resolve => window.queueMicrotask(resolve))
    })

    expect(renderSpy).toHaveBeenCalledTimes(1)
  })

  it('should eventually reflect the last time the fetcher was called', async () => {
    const key = createKey()

    let fetcherCallTime: number

    const fetcher = () => {
      fetcherCallTime = Date.now()
      return 'data'
    }

    const updateSpy = jest.fn()

    function Page() {
      const { mutate, updatedAt } = useSWR(key, fetcher)

      useEffect(() => {
        updateSpy(updatedAt)
      }, [updatedAt])

      return <button onClick={() => mutate()}>data</button>
    }

    renderWithConfig(<Page />)

    screen.getByText('data')

    fireEvent.click(screen.getByRole('button'))

    expect(updateSpy).toHaveBeenCalledTimes(1)

    expect(updateSpy.mock.calls[0][0]).toBeUndefined()

    await act(async () => {
      await new Promise<void>(resolve => window.queueMicrotask(resolve))
    })

    expect(updateSpy).toHaveBeenCalledTimes(2)

    const updatedAt = updateSpy.mock.calls[1][0]
    expect(updatedAt).toBeDefined()

    expect(updatedAt).toBeGreaterThanOrEqual(fetcherCallTime)
  })

  it('should be consistent in all hooks using the same key', async () => {
    const key = createKey()

    const fetcher = () => 'data'

    const Dashboard = ({
      testId = 'testId',
      children = null,
      revalidateOnMount = false
    }) => {
      const { updatedAt } = useSWR(key, fetcher, { revalidateOnMount })

      return (
        <section>
          <span data-testid={testId}>{updatedAt}</span>

          <article>{children}</article>
        </section>
      )
    }

    const Mutator = () => {
      const { mutate } = useSWR(key, fetcher)

      return <button onClick={() => mutate()}>deep mutator</button>
    }

    function Page() {
      const { mutate, updatedAt } = useSWR(key, fetcher)
      const [show, toggle] = useReducer(x => !x, false)

      return (
        <div>
          <button onClick={() => mutate()}>mutate</button>

          <span data-testid="zero">{updatedAt}</span>

          <button onClick={toggle}>show</button>

          <div>
            <Dashboard testId="first">
              <Mutator />
            </Dashboard>
          </div>

          {show && <Dashboard testId="second" revalidateOnMount />}
        </div>
      )
    }

    renderWithConfig(<Page />)

    // assert emptiness because the `updatedAt` prop is undefined
    expect(screen.getByTestId('zero')).toBeEmptyDOMElement()
    expect(screen.getByTestId('first')).toBeEmptyDOMElement()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'mutate' }))
      await new Promise<void>(resolve => window.queueMicrotask(resolve))
    })

    expect(screen.getByTestId('zero')).not.toBeEmptyDOMElement()

    // copy the text value
    const firstUpdatedAt = screen.getByTestId('zero').textContent

    // Assert that `first` agrees with `zero`
    expect(screen.getByTestId('first')).toHaveTextContent(firstUpdatedAt)

    // Need to wait on the deduping interval
    await act(async () => {
      await sleep(2000)
    })

    fireEvent.click(screen.getByRole('button', { name: 'show' }))

    // Assert that when it mounts, `second` has no knowledge of `updatedAt`
    expect(screen.getByTestId('second')).toBeEmptyDOMElement()

    await act(async () => {
      await new Promise(resolve => window.requestAnimationFrame(resolve))
    })

    await act(async () => {
      await new Promise<void>(resolve => window.queueMicrotask(resolve))
    })

    // Assert that `second`, eventually agrees with `zero`
    expect(screen.getByTestId('second')).toHaveTextContent(
      screen.getByTestId('zero').textContent
    )

    await act(async () => {
      // mutate from a nested element
      fireEvent.click(screen.getByRole('button', { name: 'deep mutator' }))
      await new Promise<void>(resolve => window.queueMicrotask(resolve))
    })

    // not empty, and not the same as before
    expect(screen.getByTestId('zero')).not.toBeEmptyDOMElement()
    expect(screen.getByTestId('zero')).not.toEqual(firstUpdatedAt)

    // sanity check, the value showed by `first` and `second` has increased
    expect(Number(screen.getByTestId('first').textContent)).toBeGreaterThan(
      Number(firstUpdatedAt)
    )

    expect(Number(screen.getByTestId('second').textContent)).toBeGreaterThan(
      Number(firstUpdatedAt)
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
