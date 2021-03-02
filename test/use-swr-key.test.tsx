import { act, fireEvent, render, screen } from '@testing-library/react'
import React, { useState, useEffect } from 'react'
import useSWR from '../src'
import { sleep } from './utils'

describe('useSWR - key', () => {
  it('should respect requests after key has changed', async () => {
    let rerender

    function Page() {
      const [mounted, setMounted] = useState(0)
      const key = `key-1-${mounted ? 'short' : 'long'}`
      const { data } = useSWR(key, async () => {
        if (mounted) {
          await sleep(100)
          return 'short request'
        }
        await sleep(200)
        return 'long request'
      })
      useEffect(() => setMounted(1), [])
      rerender = setMounted

      return <div>{data}</div>
    }

    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`""`)

    await screen.findByText('short request')

    await act(() => sleep(110)) // wait 100ms until "long request" finishes
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"short request"`
    ) // should be "short request" still

    // manually trigger a re-render from outside
    // this triggers a re-render, and a read access to `swr.data`
    // but the result should still be "short request"
    act(() => rerender(x => x + 1))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"short request"`
    )
  })

  it('should render undefined after key has changed', async () => {
    function Page() {
      const [mounted, setMounted] = useState(false)
      const key = `key-${mounted ? '1' : '0'}`
      const { data } = useSWR(key, async k => {
        await sleep(200)
        return k
      })
      useEffect(() => {
        setTimeout(() => setMounted(true), 320)
      }, [])
      return <div>{data}</div>
    }

    //    time     data       key
    // -> 0        undefined, '0'
    // -> 200      0,         '0'
    // -> 320      undefined, '1' <- this state is required; we can't show 0 here
    // -> 520      1,         '1'
    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`""`) // undefined, time=0
    await act(() => sleep(210))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"key-0"`) // 0, time=210
    await act(() => sleep(200))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`""`) // undefined, time=410
    await act(() => sleep(140))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"key-1"`) // 1, time=550
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
    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, 1:"`
    )

    await screen.findByText('hello, 1:a')

    fireEvent.click(container.firstElementChild)
    // first rerender on key change
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, 2:"`
    )
    await act(() => sleep(100))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, 2:b"`
    )
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

    const { container } = render(<Page />)
    const closureSpy = jest.spyOn(closureFunctions, 'first')

    await screen.findByText('data-first')
    expect(closureSpy).toHaveBeenCalledTimes(1)

    // update, but don't change the id.
    // Function identity should stay the same, and useSWR should not call the function again.
    act(() => updateId('first'))
    await act(async () => await 0)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"data-first"`
    )
    expect(closureSpy).toHaveBeenCalledTimes(1)

    act(() => updateId('second'))
    await act(async () => await 0)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"data-second"`
    )
  })

  it('should cleanup state when key turns to empty', async () => {
    function Page() {
      const [cnt, setCnt] = useState(1)
      const { isValidating } = useSWR(
        cnt === -1 ? '' : `key-empty-${cnt}`,
        () => new Promise(r => setTimeout(r, 1000))
      )

      return (
        <div onClick={() => setCnt(cnt == 2 ? -1 : cnt + 1)}>
          {isValidating ? 'true' : 'false'}
        </div>
      )
    }

    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"true"`)
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(10))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"true"`)
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(10))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"false"`)
  })
})
