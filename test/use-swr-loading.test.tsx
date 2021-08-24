import { act, render, screen } from '@testing-library/react'
import React from 'react'
import useSWR from 'swr'
import { createResponse, createKey, sleep } from './utils'

describe('useSWR - loading', () => {
  it('should return loading state', async () => {
    let renderCount = 0
    function Page() {
      const { data, isValidating } = useSWR('is-validating-1', () =>
        createResponse('data')
      )
      renderCount++
      return (
        <div>
          hello, {data}, {isValidating ? 'loading' : 'ready'}
        </div>
      )
    }

    render(<Page />)
    screen.getByText('hello, , loading')

    await screen.findByText('hello, data, ready')
    //    data       isValidating
    // -> undefined, true
    // -> data,      false
    expect(renderCount).toEqual(2)
  })

  it('should avoid extra rerenders', async () => {
    let renderCount = 0
    function Page() {
      // we never access `isValidating`, so it will not trigger rerendering
      const { data } = useSWR('is-validating-2', () => createResponse('data'))
      renderCount++
      return <div>hello, {data}</div>
    }

    render(<Page />)

    await screen.findByText('hello, data')
    //    data
    // -> undefined
    // -> data
    expect(renderCount).toEqual(2)
  })

  it('should avoid extra rerenders while fetching', async () => {
    let renderCount = 0,
      dataLoaded = false

    function Page() {
      // we never access anything
      useSWR('is-validating-3', async () => {
        const res = await createResponse('data')
        dataLoaded = true
        return res
      })
      renderCount++
      return <div>hello</div>
    }

    render(<Page />)
    screen.getByText('hello')

    await act(() => sleep(100)) // wait
    // it doesn't re-render, but fetch was triggered
    expect(renderCount).toEqual(1)
    expect(dataLoaded).toEqual(true)
  })

  it('should return enumberable object', async () => {
    // If the returned object is enumberable, we can use the spread operator
    // to deconstruct all the keys.

    function Page() {
      const swr = useSWR(createKey())
      return (
        <div>
          {Object.keys({ ...swr })
            .sort()
            .join(',')}
        </div>
      )
    }

    render(<Page />)
    screen.getByText('data,error,isValidating,mutate')
  })
})
