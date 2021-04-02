import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import useSWR from '../src'
import { sleep } from './utils'

describe('useSWR - revalidate', () => {
  it('should rerender after triggering revalidation', async () => {
    let value = 0

    function Page() {
      const { data, revalidate } = useSWR('dynamic-3', () => value++)
      return <button onClick={revalidate}>data: {data}</button>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')
    fireEvent.click(container.firstElementChild)
    await act(() => {
      // trigger revalidation
      return sleep(1)
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
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
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`", "`)
    // mount
    await screen.findByText('0, 0')

    fireEvent.click(container.firstElementChild)

    await act(() => {
      // trigger revalidation
      return sleep(1)
    })
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"1, 1"`)
  })

  it('should respect sequences of revalidation calls (cope with race condition)', async () => {
    let faster = false

    function Page() {
      const { data, revalidate } = useSWR(
        'race',
        () =>
          new Promise(res => {
            const value = faster ? 1 : 0
            setTimeout(() => res(value), faster ? 100 : 200)
          })
      )

      return <button onClick={revalidate}>{data}</button>
    }

    const { container } = render(<Page />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`""`)

    // trigger the slower revalidation
    faster = false
    fireEvent.click(container.firstElementChild)

    await act(async () => sleep(10))
    // trigger the faster revalidation
    faster = true
    fireEvent.click(container.firstElementChild)

    await act(async () => sleep(210))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"1"`)
  })

  it('should keep isValidating be true when there are two concurrent requests', async () => {
    function Page() {
      const { isValidating, revalidate } = useSWR(
        'keep isValidating for concurrent requests',
        () =>
          new Promise(res => {
            setTimeout(res, 200)
          }),
        { revalidateOnMount: false }
      )

      return (
        <button onClick={revalidate}>{isValidating ? 'true' : 'false'}</button>
      )
    }

    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"false"`)

    // trigger the first revalidation
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(100))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"true"`)

    fireEvent.click(container.firstElementChild)
    await act(() => sleep(110))
    // first revalidation is over, second revalidation is still in progress
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"true"`)

    await act(() => sleep(100))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"false"`)
  })

  it('should respect sequences of revalidation calls although in dedupingInterval', async () => {
    let count = 0
    function Page() {
      const { data, revalidate } = useSWR(
        'respect sequences of revalidation calls although in dedupingInterval',
        async () => {
          const currCount = ++count
          await sleep(currCount === 1 ? 60 : 0)
          return currCount
        },
        {
          dedupingInterval: 30
        }
      )
      return <div onClick={() => revalidate()}>count: {data}</div>
    }
    const { container } = render(<Page />)
    await act(() => sleep(10))
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(60))
    expect(container.firstChild.textContent).toMatchInlineSnapshot('"count: 2"')
  })
})
