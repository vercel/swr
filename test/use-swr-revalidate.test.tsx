import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import useSWR from 'swr'
import { createResponse, sleep, nextTick as waitForNextTick } from './utils'

describe('useSWR - revalidate', () => {
  it('should rerender after triggering revalidation', async () => {
    let value = 0

    function Page() {
      const { data, revalidate } = useSWR('dynamic-3', () => value++)
      return <button onClick={revalidate}>data: {data}</button>
    }

    render(<Page />)

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

    function Page() {
      const { data: v1, revalidate } = useSWR('dynamic-4', () => value++)
      const { data: v2 } = useSWR('dynamic-4', () => value++)
      return (
        <button onClick={revalidate}>
          {v1}, {v2}
        </button>
      )
    }

    render(<Page />)

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

    function Page() {
      const { data, revalidate } = useSWR('race', () =>
        createResponse(faster ? 1 : 0, { delay: faster ? 50 : 100 })
      )

      return <button onClick={revalidate}>data: {data}</button>
    }

    render(<Page />)

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
    function Page() {
      const { isValidating, revalidate } = useSWR(
        'keep isValidating for concurrent requests',
        () => createResponse(null, { delay: 100 }),
        { revalidateOnMount: false }
      )

      return (
        <button onClick={revalidate}>{isValidating ? 'true' : 'false'}</button>
      )
    }

    render(<Page />)
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
    function Page() {
      const { data, revalidate } = useSWR(
        'respect sequences of revalidation calls although in dedupingInterval',
        () => {
          const currCount = ++count
          return createResponse(currCount, { delay: currCount === 1 ? 50 : 0 })
        },
        {
          dedupingInterval: 30
        }
      )
      return <div onClick={() => revalidate()}>count: {data}</div>
    }

    render(<Page />)

    await waitForNextTick()
    fireEvent.click(screen.getByText('count:'))
    await act(() => sleep(70))
    screen.getByText('count: 2')
  })
})
