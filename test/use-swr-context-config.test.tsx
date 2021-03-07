import { act, render } from '@testing-library/react'
import React from 'react'
import useSWR, { mutate } from '../src'
import { sleep } from './utils'

describe('useSWR - context configs', () => {
  it('mutate before mount should not block rerender', async () => {
    const prefetch = () => Promise.resolve('prefetch-data')
    const fetcher = () =>
      new Promise(resolve => {
        setTimeout(() => resolve('data'), 100)
      })
    await act(() => mutate('prefetch', prefetch))

    function Page() {
      const { data } = useSWR('prefetch', fetcher)
      return <div>{data}</div>
    }

    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"prefetch-data"`
    )

    await act(() => sleep(150))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data"`)
  })
})
