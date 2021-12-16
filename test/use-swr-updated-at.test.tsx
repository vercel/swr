import { act, fireEvent, screen } from '@testing-library/react'
import React, { useEffect } from 'react'
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
      await sleep(0)
    })

    expect(updateSpy).toHaveBeenCalledTimes(2)

    const updatedAt = updateSpy.mock.calls[1][0]
    expect(updatedAt).toBeDefined()

    expect(updatedAt).toBeGreaterThanOrEqual(fetcherCallTime)
  })
})
