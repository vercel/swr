import { act, screen } from '@testing-library/react'
import React from 'react'
import useSWR from 'swr'
import { createKey, renderWithConfig, sleep } from './utils'

describe('RSC Fallback', () => {
  it('should not revalidate on mount with RSC fallback data when revalidateOnRSCFallback is false', async () => {
    const key = createKey()
    const fetchFn = jest.fn(() => 'updated data')

    function Page() {
      const { data, isValidating, isLoading } = useSWR(key, fetchFn, {
        fallbackData: 'RSC data',
        revalidateOnRSCFallback: false
      })
      return (
        <div>
          Data: {data}, isValidating: {String(isValidating)}, isLoading:{' '}
          {String(isLoading)}
        </div>
      )
    }

    renderWithConfig(<Page />)

    screen.getByText(content => content.includes('Data: RSC data'))
    screen.getByText(content => content.includes('isValidating: false'))
    screen.getByText(content => content.includes('isLoading: false'))
    expect(fetchFn).not.toHaveBeenCalled()

    await act(() => sleep(50))

    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('should revalidate on mount with RSC fallback data when revalidateOnRSCFallback is true', async () => {
    const key = createKey()
    const fetchFn = jest.fn(() => 'updated data')

    function Page() {
      const { data } = useSWR(key, fetchFn, {
        fallbackData: 'RSC data',
        revalidateOnRSCFallback: true
      })
      return <div>Data: {data}</div>
    }

    renderWithConfig(<Page />)

    expect(screen.getByText('Data: RSC data')).toBeInTheDocument()

    await act(() => sleep(50))

    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Data: updated data')).toBeInTheDocument()
  })

  it('should not affect existing fallback behavior when revalidateOnRSCFallback is not set', async () => {
    const key = createKey()
    const fetchFn = jest.fn(() => 'updated data')

    function Page() {
      const { data } = useSWR(key, fetchFn, {
        fallbackData: 'fallback data'
      })
      return <div>Data: {data}</div>
    }

    renderWithConfig(<Page />)

    expect(screen.getByText('Data: fallback data')).toBeInTheDocument()

    // Default behavior: revalidateIfStale is true, so it should revalidate
    await act(() => sleep(50))

    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Data: updated data')).toBeInTheDocument()
  })

  it('should work with SWRConfig provider fallback when revalidateOnRSCFallback is false', async () => {
    const key = createKey()
    const fetchFn = jest.fn(() => 'updated data')

    function Page() {
      const { data } = useSWR(key, fetchFn, {
        revalidateOnRSCFallback: false
      })
      return <div>Data: {data}</div>
    }

    renderWithConfig(<Page />, { fallback: { [key]: 'provider fallback' } })

    expect(screen.getByText('Data: provider fallback')).toBeInTheDocument()

    await act(() => sleep(50))

    expect(fetchFn).not.toHaveBeenCalled()
  })
})
