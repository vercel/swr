import { act, screen } from '@testing-library/react'
import React from 'react'
import useSWR, { mutate } from 'swr'
import { createKey, createResponse, renderWithGlobalCache } from './utils'

describe('useSWR - context configs', () => {
  it('mutate before mount should not block rerender', async () => {
    const prefetch = () => createResponse('prefetch-data')
    const fetcher = () => createResponse('data')
    const key = createKey()

    await act(async () => { await mutate(key, prefetch) })

    function Page() {
      const { data } = useSWR(key, fetcher)
      return <div>{data}</div>
    }

    renderWithGlobalCache(<Page />)
    // render with the prefetched data
    screen.getByText('prefetch-data')

    // render the fetched data
    await screen.findByText('data')
  })
})
