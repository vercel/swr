import { act, screen } from '@testing-library/react'
import React from 'react'
import useSWR from 'swr'
import { createKey, renderWithConfig, sleep } from './utils'

describe('RSC Fallback', () => {
  it('should not revalidate on mount with RSC fallback data when revalidateOnRSCFallback is false', async () => {
    const key = createKey()
    const fetchFn = jest.fn(() => 'updated data')

    function Page() {
      const { data } = useSWR(key, fetchFn, {
        fallbackData: 'RSC data',
        revalidateOnRSCFallback: false
      })
      return <div>Data: {data}</div>
    }

    renderWithConfig(<Page />)

    expect(screen.getByText('Data: RSC data')).toBeInTheDocument()
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
})
