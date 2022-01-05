import { act, fireEvent, screen } from '@testing-library/react'
import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import { createKey, createResponse, renderWithConfig, sleep } from './utils'

describe('useSWR - key', () => {
  it('should respect requests after key has changed', async () => {
    let rerender

    const baseKey = createKey()
    function Page() {
      const [mounted, setMounted] = useState(0)
      const key = `${baseKey}-${mounted ? 'short' : 'long'}`
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

    renderWithConfig(<Page />)
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
    const baseKey = createKey()
    function Page() {
      const [mounted, setMounted] = useState(false)
      const key = `${baseKey}-${mounted ? '1' : '0'}`
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
    renderWithConfig(<Page />)
    screen.getByText('data:') // undefined, time=0
    await act(() => sleep(150))
    screen.getByText(`data:${baseKey}-0`) // 0, time=150
    await act(() => sleep(100))
    screen.getByText('data:') // undefined, time=250
    await act(() => sleep(100))
    screen.getByText(`data:${baseKey}-1`) // 1, time=350
  })

  it('should return undefined after key change when fetcher is synchronized', async () => {
    const samples = {
      '1': 'a',
      '2': 'b',
      '3': 'c'
    }

    const baseKey = createKey()
    function Page() {
      const [sampleKey, setKey] = React.useState(1)
      const { data } = useSWR(
        `${baseKey}-${sampleKey}`,
        key => samples[key.replace(`${baseKey}-`, '')]
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

    renderWithConfig(<Page />)
    screen.getByText('hello, 1:')

    await screen.findByText('hello, 1:a')

    fireEvent.click(screen.getByText('hello, 1:a'))
    // first rerender on key change
    screen.getByText('hello, 2:')

    await screen.findByText('hello, 2:b')
  })

  it('should revalidate if a function key changes identity', async () => {
    const closureFunctions: { [key: string]: () => Promise<string> } = {}

    const baseKey = createKey()
    const closureFactory = id => {
      if (closureFunctions[id]) return closureFunctions[id]
      closureFunctions[id] = () => Promise.resolve(`${baseKey}-${id}`)
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

    renderWithConfig(<Page />)
    const closureSpy = jest.spyOn(closureFunctions, 'first')

    await screen.findByText(`${baseKey}-first`)
    expect(closureSpy).toHaveBeenCalledTimes(1)

    // update, but don't change the id.
    // Function identity should stay the same, and useSWR should not call the function again.
    act(() => updateId('first'))
    await screen.findByText(`${baseKey}-first`)
    expect(closureSpy).toHaveBeenCalledTimes(1)

    act(() => updateId('second'))
    await screen.findByText(`${baseKey}-second`)
  })

  it('should not fetch if the function key throws an error', async () => {
    let value = 0
    const fetcher = jest.fn(() => value++)
    const key = () => {
      throw new Error('error')
    }

    function Page() {
      const { data } = useSWR(key, fetcher)
      return <div>{`key-${data}`}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText(`key-undefined`)
    expect(fetcher).toBeCalledTimes(0)
  })

  it('should cleanup state when key turns to empty', async () => {
    const key = createKey()
    function Page() {
      const [cnt, setCnt] = useState(1)
      const { isValidating } = useSWR(cnt === -1 ? '' : `${key}-${cnt}`, () =>
        createResponse('', { delay: 100 })
      )

      return (
        <div onClick={() => setCnt(cnt == 2 ? -1 : cnt + 1)}>
          {isValidating ? 'true' : 'false'}
        </div>
      )
    }

    renderWithConfig(<Page />)
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

    const updatedKey = createKey()
    function Page() {
      const [key, setKey] = useState(null)

      const { data: v1 } = useSWR(key, fetcher)
      const { data: v2 } = useSWR(key, fetcher)

      values.push([v1, v2])

      return <button onClick={() => setKey(updatedKey)}>update key</button>
    }

    renderWithConfig(<Page />)
    screen.getByText('update key')

    fireEvent.click(screen.getByText('update key'))
    await act(() => sleep(120))

    // All values should equal because they're sharing the same key
    expect(values.some(([a, b]) => a !== b)).toBeFalsy()
  })

  it('should support object as the key and deep compare', async () => {
    const fetcher = jest.fn(() => 'data')
    function Page() {
      const { data: v1 } = useSWR({ foo: { bar: 1 } }, fetcher)
      const { data: v2 } = useSWR({ foo: { bar: 1 } }, fetcher)

      return (
        <div>
          {v1},{v2}
        </div>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText('data,data')

    // Only 1 request since the keys are the same.
    expect(fetcher).toBeCalledTimes(1)
  })
})
