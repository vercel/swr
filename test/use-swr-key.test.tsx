import { act, fireEvent, render, screen } from '@testing-library/react'
import React, { useState, useEffect } from 'react'
import useSWR from '../src'
import { createResponse, sleep } from './utils'

describe('useSWR - key', () => {
  it('should respect requests after key has changed', async () => {
    let rerender

    function Page() {
      const [mounted, setMounted] = useState(0)
      const key = `key-1-${mounted ? 'short' : 'long'}`
      const { data } = useSWR(key, () => {
        if (mounted) {
          return createResponse('short request', { delay: 50 })
        }
        return createResponse('long request', { delay: 100 })
      })
      useEffect(() => setMounted(1), [])
      rerender = setMounted

      return <div>data:{data}</div>
    }

    render(<Page />)
    screen.getByText('data:')

    await screen.findByText('data:short request')

    await act(() => sleep(100)) // wait 100ms until "long request" finishes
    screen.getByText('data:short request') // should be "short request" still

    // manually trigger a re-render from outside
    // this triggers a re-render, and a read access to `swr.data`
    // but the result should still be "short request"
    act(() => rerender(x => x + 1))
    screen.getByText('data:short request')
  })

  it('should render undefined after key has changed', async () => {
    function Page() {
      const [mounted, setMounted] = useState(false)
      const key = `key-${mounted ? '1' : '0'}`
      const { data } = useSWR(key, k => createResponse(k, { delay: 100 }))
      useEffect(() => {
        setTimeout(() => setMounted(true), 200)
      }, [])
      return <div>data:{data}</div>
    }

    //    time     data       key
    // -> 0        undefined, '0'
    // -> 100      0,         '0'
    // -> 200      undefined, '1' <- this state is required; we can't show 0 here
    // -> 300      1,         '1'
    render(<Page />)
    screen.getByText('data:') // undefined, time=0
    await act(() => sleep(150))
    screen.getByText('data:key-0') // 0, time=150
    await act(() => sleep(100))
    screen.getByText('data:') // undefined, time=250
    await act(() => sleep(100))
    screen.getByText('data:key-1') // 1, time=550
  })

  it('should return undefined after key change when fetcher is synchronized', async () => {
    const samples = {
      '1': 'a',
      '2': 'b',
      '3': 'c'
    }

    function Page() {
      const [sampleKey, setKey] = React.useState(1)
      const { data } = useSWR(
        `key-2-${sampleKey}`,
        key => samples[key.replace('key-2-', '')]
      )
      return (
        <div
          onClick={() => {
            setKey(sampleKey + 1)
          }}
        >
          hello, {sampleKey}:{data}
        </div>
      )
    }

    render(<Page />)
    screen.getByText('hello, 1:')

    await screen.findByText('hello, 1:a')

    fireEvent.click(screen.getByText('hello, 1:a'))
    // first rerender on key change
    screen.getByText('hello, 2:')

    await screen.findByText('hello, 2:b')
  })

  it('should revalidate if a function key changes identity', async () => {
    const closureFunctions: { [key: string]: () => Promise<string> } = {}

    const closureFactory = id => {
      if (closureFunctions[id]) return closureFunctions[id]
      closureFunctions[id] = () => Promise.resolve(`data-${id}`)
      return closureFunctions[id]
    }

    let updateId

    const fetcher = fn => fn()

    function Page() {
      const [id, setId] = React.useState('first')
      updateId = setId
      const fnWithClosure = closureFactory(id)
      const { data } = useSWR([fnWithClosure], fetcher)

      return <div>{data}</div>
    }

    render(<Page />)
    const closureSpy = jest.spyOn(closureFunctions, 'first')

    await screen.findByText('data-first')
    expect(closureSpy).toHaveBeenCalledTimes(1)

    // update, but don't change the id.
    // Function identity should stay the same, and useSWR should not call the function again.
    act(() => updateId('first'))
    await screen.findByText('data-first')
    expect(closureSpy).toHaveBeenCalledTimes(1)

    act(() => updateId('second'))
    await screen.findByText('data-second')
  })

  it('should cleanup state when key turns to empty', async () => {
    function Page() {
      const [cnt, setCnt] = useState(1)
      const { isValidating } = useSWR(
        cnt === -1 ? '' : `key-empty-${cnt}`,
        () => createResponse('', { delay: 100 })
      )

      return (
        <div onClick={() => setCnt(cnt == 2 ? -1 : cnt + 1)}>
          {isValidating ? 'true' : 'false'}
        </div>
      )
    }

    render(<Page />)
    screen.getByText('true')

    fireEvent.click(screen.getByText('true'))
    await act(() => sleep(10))
    screen.getByText('true')

    fireEvent.click(screen.getByText('true'))
    await act(() => sleep(10))
    screen.getByText('false')
  })

  it('should keep data in sync when key updates', async () => {
    const fetcher = () => createResponse('test', { delay: 100 })
    const values = []

    function Page() {
      const [key, setKey] = useState(null)

      const { data: v1 } = useSWR(key, fetcher)
      const { data: v2 } = useSWR(key, fetcher)

      values.push([v1, v2])

      return <button onClick={() => setKey('key-sync')}>update key</button>
    }

    render(<Page />)
    screen.getByText('update key')

    fireEvent.click(screen.getByText('update key'))
    await act(() => sleep(120))

    // All values should equal because they're sharing the same key
    expect(values.some(([a, b]) => a !== b)).toBeFalsy()
  })
})
