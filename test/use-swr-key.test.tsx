import { fireEvent, screen } from '@testing-library/react'
import React, { useState, useEffect, act } from 'react'
import useSWR, { preload, unstable_serialize, useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'
import { stableHash } from 'swr/_internal'
import { createKey, createResponse, renderWithConfig, sleep } from './utils'

describe('useSWR - key', () => {
  describe.each([
    { name: 'object', key: { a: 1 } },
    { name: 'array', key: ['/users', { id: 7 }] }
  ])('$name key namespaces', ({ key }) => {
    it.each([
      { stringFirst: false, serialized: false },
      { stringFirst: true, serialized: false },
      { stringFirst: false, serialized: true },
      { stringFirst: true, serialized: true }
    ])(
      'should isolate hash strings with string first: $stringFirst, serialized: $serialized',
      async ({ stringFirst, serialized }) => {
        const stringKey = serialized ? unstable_serialize(key) : stableHash(key)
        const structuredFetcher = jest.fn(() => 'STRUCTURED-DATA')
        const stringFetcher = jest.fn(() => 'STRING-DATA')

        function Structured() {
          const { data } = useSWR(key, structuredFetcher)
          return <div>structured: {data}</div>
        }

        function StringKey() {
          const { data } = useSWR(stringKey, stringFetcher)
          return <div>string: {data}</div>
        }

        function Page() {
          const [show, setShow] = useState(false)
          return (
            <>
              {stringFirst ? <StringKey /> : <Structured />}
              {show && (stringFirst ? <Structured /> : <StringKey />)}
              <button onClick={() => setShow(true)}>show second</button>
            </>
          )
        }

        renderWithConfig(<Page />)
        await screen.findByText(
          stringFirst ? 'string: STRING-DATA' : 'structured: STRUCTURED-DATA'
        )
        fireEvent.click(screen.getByText('show second'))

        await screen.findByText('structured: STRUCTURED-DATA')
        await screen.findByText('string: STRING-DATA')
        expect(structuredFetcher).toHaveBeenCalledTimes(1)
        expect(structuredFetcher).toHaveBeenCalledWith(key)
        expect(stringFetcher).toHaveBeenCalledTimes(1)
        expect(stringFetcher).toHaveBeenCalledWith(stringKey)
      }
    )

    it('should isolate mutations and tag revalidation for each namespace', async () => {
      const stringKey = unstable_serialize(key)
      let structuredMutate, stringMutate, mutate, trigger, stringTrigger
      let revalidateTag, unload
      const structuredFetcher = jest.fn(() => 'STRUCTURED-DATA')
      const stringFetcher = jest.fn(() => 'STRING-DATA')
      const mutationFetcher = jest.fn(() => 'REMOTE-DATA')

      function Page() {
        const config = useSWRConfig()
        mutate = config.mutate
        revalidateTag = config.revalidateTag
        unload = config.unload
        const structured = useSWR(() => key, structuredFetcher, {
          tags: ['structured']
        })
        const string = useSWR(() => stringKey, stringFetcher, {
          tags: ['string']
        })
        structuredMutate = structured.mutate
        stringMutate = string.mutate
        trigger = useSWRMutation(() => key, mutationFetcher, {
          populateCache: true,
          revalidate: false
        }).trigger
        stringTrigger = useSWRMutation(() => stringKey, mutationFetcher, {
          populateCache: true,
          revalidate: false
        }).trigger
        return (
          <>
            <div>structured: {structured.data}</div>
            <div>string: {string.data}</div>
          </>
        )
      }

      renderWithConfig(<Page />)
      await screen.findByText('structured: STRUCTURED-DATA')
      await screen.findByText('string: STRING-DATA')

      await act(() => structuredMutate('BOUND-DATA', false))
      screen.getByText('structured: BOUND-DATA')
      screen.getByText('string: STRING-DATA')

      await act(() => stringMutate('BOUND-STRING', false))
      screen.getByText('structured: BOUND-DATA')
      screen.getByText('string: BOUND-STRING')

      await act(() => mutate(key, 'GLOBAL-DATA', false))
      screen.getByText('structured: GLOBAL-DATA')
      screen.getByText('string: BOUND-STRING')

      await act(() => mutate(stringKey, 'GLOBAL-STRING', false))
      screen.getByText('structured: GLOBAL-DATA')
      screen.getByText('string: GLOBAL-STRING')

      const filter = jest.fn(candidate => candidate === stringKey)
      await act(() => mutate(filter, 'FILTERED-DATA', false))
      screen.getByText('structured: GLOBAL-DATA')
      screen.getByText('string: FILTERED-DATA')
      expect(filter).toHaveBeenCalledWith(key)
      expect(filter).toHaveBeenCalledWith(stringKey)

      await act(() =>
        mutate(candidate => candidate === key, 'FILTERED-OBJECT', false)
      )
      screen.getByText('structured: FILTERED-OBJECT')
      screen.getByText('string: FILTERED-DATA')

      await act(() => trigger())
      screen.getByText('structured: REMOTE-DATA')
      screen.getByText('string: FILTERED-DATA')
      expect(mutationFetcher).toHaveBeenCalledWith(key, { arg: undefined })

      await act(() => stringTrigger())
      screen.getByText('structured: REMOTE-DATA')
      screen.getByText('string: REMOTE-DATA')
      expect(mutationFetcher).toHaveBeenCalledWith(stringKey, {
        arg: undefined
      })

      await act(() => revalidateTag('structured'))
      screen.getByText('structured: STRUCTURED-DATA')
      screen.getByText('string: REMOTE-DATA')
      expect(structuredFetcher).toHaveBeenCalledTimes(2)
      expect(stringFetcher).toHaveBeenCalledTimes(1)

      await act(() => revalidateTag('string'))
      screen.getByText('structured: STRUCTURED-DATA')
      screen.getByText('string: STRING-DATA')
      expect(structuredFetcher).toHaveBeenCalledTimes(2)
      expect(stringFetcher).toHaveBeenCalledTimes(2)

      await act(async () => {
        unload()
      })
      expect(structuredFetcher).toHaveBeenCalledTimes(3)
      expect(stringFetcher).toHaveBeenCalledTimes(3)

      await act(() => revalidateTag('structured'))
      expect(structuredFetcher).toHaveBeenCalledTimes(4)
      expect(stringFetcher).toHaveBeenCalledTimes(3)
    })

    it('should preload each namespace separately', async () => {
      const stringKey = unstable_serialize(key)
      const structuredFetcher = jest.fn(() =>
        Promise.resolve('STRUCTURED-DATA')
      )
      const stringFetcher = jest.fn(() => Promise.resolve('STRING-DATA'))
      const fetcher = jest.fn(() => 'NOT-PRELOADED')

      preload(key, structuredFetcher)
      preload(stringKey, stringFetcher)

      function Page() {
        const { data: structured } = useSWR(key, fetcher)
        const { data: string } = useSWR(stringKey, fetcher)
        return (
          <div>
            {structured},{string}
          </div>
        )
      }

      renderWithConfig(<Page />)
      await screen.findByText('STRUCTURED-DATA,STRING-DATA')
      expect(structuredFetcher).toHaveBeenCalledTimes(1)
      expect(structuredFetcher).toHaveBeenCalledWith(key)
      expect(stringFetcher).toHaveBeenCalledTimes(1)
      expect(stringFetcher).toHaveBeenCalledWith(stringKey)
      expect(fetcher).not.toHaveBeenCalled()
    })

    it('should read separate fallback entries using serialized keys', () => {
      const stringKey = unstable_serialize(key)
      function Page() {
        const { data: structured } = useSWR(key, null)
        const { data: string } = useSWR(stringKey, null)
        return (
          <div>
            {structured},{string}
          </div>
        )
      }

      renderWithConfig(<Page />, {
        fallback: {
          [unstable_serialize(key)]: 'STRUCTURED-DATA',
          [unstable_serialize(stringKey)]: 'STRING-DATA'
        }
      })
      screen.getByText('STRUCTURED-DATA,STRING-DATA')
    })
  })

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
    // this triggers a re-render and a read access to `swr.data`
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
    // first, rerender on key change
    screen.getByText('hello, 2:')

    await screen.findByText('hello, 2:b')
  })

  it('should revalidate if a function key changes identity', async () => {
    const closureFunctions: { [key: string]: () => string } = {}

    const baseKey = createKey()
    const closureFactory = id => {
      if (closureFunctions[id]) return closureFunctions[id]
      closureFunctions[id] = () => `${baseKey}-${id}`
      return closureFunctions[id]
    }

    let updateId

    const fetcher = (key: string) => Promise.resolve(key)

    function Page() {
      const [id, setId] = React.useState('first')
      updateId = setId
      const fnWithClosure = closureFactory(id)
      const { data } = useSWR(fnWithClosure, fetcher)

      return <div>{data}</div>
    }

    renderWithConfig(<Page />)
    await screen.findByText(`${baseKey}-first`)

    act(() => updateId('first'))
    await screen.findByText(`${baseKey}-first`)

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
    expect(fetcher).toHaveBeenCalledTimes(0)
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

    // All values should be equal because they're sharing the same key
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
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
