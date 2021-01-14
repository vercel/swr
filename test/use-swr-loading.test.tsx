import { act, render } from '@testing-library/react'
import React from 'react'
import useSWR from '../src'
import { sleep } from './utils'

describe('useSWR - loading', () => {
  const loadData = () => new Promise(res => setTimeout(() => res('data'), 100))

  it('should return loading state', async () => {
    let renderCount = 0
    function Page() {
      const { data, isValidating } = useSWR('is-validating-1', loadData)
      renderCount++
      return (
        <div>
          hello, {data}, {isValidating ? 'loading' : 'ready'}
        </div>
      )
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`"hello, , loading"`)

    await act(() => sleep(110))
    expect(container.textContent).toMatchInlineSnapshot(`"hello, data, ready"`)
    //    data       isValidating
    // -> undefined, false
    // -> undefined, true
    // -> data,      false
    expect(renderCount).toEqual(3)
  })

  it('should avoid extra rerenders', async () => {
    let renderCount = 0
    function Page() {
      // we never access `isValidating`, so it will not trigger rerendering
      const { data } = useSWR('is-validating-2', loadData)
      renderCount++
      return <div>hello, {data}</div>
    }

    const { container } = render(<Page />)

    await act(() => sleep(110))

    expect(container.textContent).toMatchInlineSnapshot(`"hello, data"`)

    //    data
    // -> undefined
    // -> data
    expect(renderCount).toEqual(2)
  })

  it('should avoid extra rerenders while fetching', async () => {
    let renderCount = 0,
      dataLoaded = false
    const loadDataWithLog = () =>
      new Promise(res =>
        setTimeout(() => {
          dataLoaded = true
          res('data')
        }, 100)
      )

    function Page() {
      // we never access anything
      useSWR('is-validating-3', loadDataWithLog)
      renderCount++
      return <div>hello</div>
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`"hello"`)

    await act(() => sleep(110)) // wait
    // it doesn't re-render, but fetch was triggered
    expect(renderCount).toEqual(1)
    expect(dataLoaded).toEqual(true)
  })
})
