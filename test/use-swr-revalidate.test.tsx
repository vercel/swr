import { act, fireEvent, screen } from '@testing-library/react'
import React from 'react'
import useSWR from 'swr'
import {
  createResponse,
  sleep,
  nextTick as waitForNextTick,
  createKey,
  renderWithConfig
} from './utils'

describe('useSWR - revalidate', () => {
  it('should rerender after triggering revalidation', async () => {
    let value = 0

    const key = createKey()
    function Page() {
      const { data, mutate } = useSWR(key, () => value++)
      return <button onClick={() => mutate()}>data: {data}</button>
    }

    renderWithConfig(<Page />)

    // hydration
    screen.getByText('data:')

    // mount
    await screen.findByText('data: 0')

    fireEvent.click(screen.getByText('data: 0'))
    await waitForNextTick()
    screen.getByText('data: 1')
  })

  it('should revalidate all the hooks with the same key', async () => {
    let value = 0

    const key = createKey()
    function Page() {
      const { data: v1, mutate } = useSWR(key, () => value++)
      const { data: v2 } = useSWR(key, () => value++)
      return (
        <button onClick={() => mutate()}>
          {v1}, {v2}
        </button>
      )
    }

    renderWithConfig(<Page />)

    // hydration
    screen.getByText(',')

    // mount
    await screen.findByText('0, 0')

    fireEvent.click(screen.getByText('0, 0'))

    await waitForNextTick()
    screen.getByText('1, 1')
  })

  it('should respect sequences of revalidation calls (cope with race condition)', async () => {
    let faster = false

    const key = createKey()
    function Page() {
      const { data, mutate } = useSWR(key, () =>
        createResponse(faster ? 1 : 0, { delay: faster ? 50 : 100 })
      )

      return <button onClick={() => mutate()}>data: {data}</button>
    }

    renderWithConfig(<Page />)

    // hydration
    screen.getByText('data:')

    // trigger the slower revalidation
    faster = false
    fireEvent.click(screen.getByText('data:'))

    await waitForNextTick()
    // trigger the faster revalidation
    faster = true
    fireEvent.click(screen.getByText('data:'))

    await act(async () => sleep(150))
    screen.getByText('data: 1')
  })

  it('should keep isValidating be true when there are two concurrent requests', async () => {
    const key = createKey()
    function Page() {
      const { isValidating, mutate } = useSWR(
        key,
        () => createResponse(null, { delay: 100 }),
        { revalidateOnMount: false }
      )

      return (
        <button onClick={() => mutate()}>
          {isValidating ? 'true' : 'false'}
        </button>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('false')

    // trigger the first revalidation
    fireEvent.click(screen.getByText('false'))
    await act(() => sleep(50))
    screen.getByText('true')

    fireEvent.click(screen.getByText('true'))
    await act(() => sleep(70))
    // first revalidation is over, second revalidation is still in progress
    screen.getByText('true')

    await act(() => sleep(70))
    screen.getByText('false')
  })

  it('should respect sequences of revalidation calls although in dedupingInterval', async () => {
    let count = 0
    const key = createKey()
    function Page() {
      const { data, mutate } = useSWR(
        key,
        () => {
          const currCount = ++count
          return createResponse(currCount, { delay: currCount === 1 ? 50 : 0 })
        },
        {
          dedupingInterval: 30
        }
      )
      return <div onClick={() => mutate()}>count: {data}</div>
    }

    renderWithConfig(<Page />)

    await waitForNextTick()
    fireEvent.click(screen.getByText('count:'))
    await act(() => sleep(70))
    screen.getByText('count: 2')
  })

  it('should set initial isValidating be false when config.isPaused returns true', async () => {
    function Page() {
      const { isValidating } = useSWR(
        'set isValidating for config.isPaused',
        () => '123',
        { isPaused: () => true }
      )

      return <div>{isValidating ? 'true' : 'false'}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('false')
  })
})
