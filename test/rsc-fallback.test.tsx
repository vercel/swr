import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import useSWR, { SWRConfig } from 'swr'
import { sleep } from './utils'

describe('RSC Fallback', () => {
  it('should not revalidate on mount with RSC fallback data by default', async () => {
    const fetchFn = jest.fn(() => 'updated data')
    
    function Page() {
      const { data } = useSWR('key', fetchFn, {
        fallbackData: 'RSC data'
      })
      return <div>Data: {data}</div>
    }
    
    render(<Page />)
    
    expect(screen.getByText('Data: RSC data')).toBeInTheDocument()
    expect(fetchFn).not.toHaveBeenCalled()
    
    await sleep(50)
    
    expect(fetchFn).not.toHaveBeenCalled()
  })
  
  it('should revalidate on mount with RSC fallback data when revalidateOnRSCFallback is true', async () => {
    const fetchFn = jest.fn(() => 'updated data')
    
    function Page() {
      const { data } = useSWR('key', fetchFn, {
        fallbackData: 'RSC data',
        revalidateOnRSCFallback: true
      })
      return <div>Data: {data}</div>
    }
    
    render(<Page />)
    
    expect(screen.getByText('Data: RSC data')).toBeInTheDocument()    
    expect(fetchFn).toHaveBeenCalledTimes(1)
    
    await sleep(50)
      
    expect(screen.getByText('Data: updated data')).toBeInTheDocument()
  })
})
