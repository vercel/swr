import { act, render, screen } from '@testing-library/react'
import React from 'react'
import useSWR, { mutate } from '../src'
import { createResponse } from './utils'

describe('useSWR - context configs', () => {
  it('mutate before mount should not block rerender', async () => {
    const prefetch = () => createResponse('prefetch-data')
    const fetcher = () => createResponse('data')
    await act(() => mutate('prefetch', prefetch))

    function Page() {
      const { data } = useSWR('prefetch', fetcher)
      return <div>{data}</div>
    }

    render(<Page />)
    // render with the prefetched data
    screen.getByText('prefetch-data')

    // render the fetched data
    await screen.findByText('data')
  })
})
