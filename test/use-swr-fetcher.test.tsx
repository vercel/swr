import { act, screen } from '@testing-library/react'
import React, { useState } from 'react'
import useSWR from 'swr'
import { createKey, renderWithConfig, nextTick } from './utils'

describe('useSWR - fetcher', () => {
  // https://github.com/vercel/swr/issues/1131
  it('should use the latest fetcher reference', async () => {
    const key = createKey()
    let fetcher = () => 'foo'
    let mutate
    let rerender

    function Page() {
      const { data, mutate: boundMutate } = useSWR(key, fetcher)
      rerender = useState({})[1]
      mutate = boundMutate

      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)
    await nextTick()
    screen.getByText('data:foo')

    // Change the fetcher and make sure the ref is updated.
    fetcher = () => 'bar'
    act(() => rerender({}))

    // Revalidate.
    await act(() => mutate())

    // Should fetch with the new fetcher.
    await screen.findByText('data:bar')
  })
})
