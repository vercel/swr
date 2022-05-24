import React, { Suspense, useEffect, useState } from 'react'
import { fireEvent, act, screen } from '@testing-library/react'
import useSWR, { mutate as globalMutate, useSWRConfig, SWRConfig } from 'swr'
import useSWRInfinite, { unstable_serialize } from 'swr/infinite'
import {
  sleep,
  createKey,
  createResponse,
  nextTick,
  renderWithConfig,
  renderWithGlobalCache,
  executeWithoutBatching
} from './utils'

describe('useSWRInfinite', () => {
  it('should render the first page component', async () => {
    const key = createKey()
    function Page() {
      const { data, error, isValidating } = useSWRInfinite(
        index => `page-${index}-${key}`,
        infiniteKey => createResponse(infiniteKey)
      )

      return (
        <div>
          <div>data:{data}</div>
          <div>error:{error}</div>
          <div>isValidating:{isValidating.toString()}</div>
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    await screen.findByText(`data:page-0-${key}`)
    await screen.findByText(`error:`)
    await screen.findByText(`isValidating:false`)
  })

  it('should not render anything if getKey throw error and call mutate wont cause error', async () => {
    function Page() {
      const { data, error, isValidating, mutate } = useSWRInfinite(
        () => {
          throw new Error('error')
        },
        infiniteKey => createResponse(infiniteKey)
      )

      return (
        <div>
          <div onClick={() => mutate()}>data:{data}</div>
          <div>error:{error}</div>
          <div>isValidating:{isValidating.toString()}</div>
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    await screen.findByText(`data:`)
    await screen.findByText(`error:`)
    await screen.findByText(`isValidating:false`)

    fireEvent.click(screen.getByText('data:'))

    await screen.findByText(`data:`)
    await screen.findByText(`error:`)
    await screen.findByText(`isValidating:false`)
  })

  it('should render the multiple pages', async () => {
    const key = createKey()
    function Page() {
      const { data, size, setSize } = useSWRInfinite(
        index => [key, index],
        ([_, index]) => createResponse(`page ${index}, `)
      )

      useEffect(() => {
        // load next page if the current one is ready
        if (size <= 2) setSize(size + 1)
        // The setSize function is guaranteed to be referential equal
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [size])

      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    await screen.findByText('data:page 0, page 1, page 2,')
  })

  it('should support mutate and initialSize', async () => {
    // mock api
    const pageData = ['apple', 'banana', 'pineapple']

    const key = createKey()
    function Page() {
      const { data, mutate: boundMutate } = useSWRInfinite(
        index => [key, index],
        ([_, index]) => createResponse(`${pageData[index]}, `),
        {
          initialSize: 3
        }
      )

      return (
        <div
          onClick={() => {
            // reload the entire list
            boundMutate()
          }}
        >
          data:{data}
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    await screen.findByText('data:apple, banana, pineapple,')

    // change the source data to 'watermelon'
    pageData[1] = 'watermelon'

    // revalidate
    fireEvent.click(screen.getByText('data:apple, banana, pineapple,'))
    await screen.findByText('data:apple, watermelon, pineapple,')
  })

  it('should support api cursor', async () => {
    // an API that supports the `?offset=` param
    async function mockAPIFetcher(url) {
      const parse = url.match(/\?offset=(\d+)/)
      const offset = parse ? +parse[1] + 1 : 0
      const response =
        offset <= 3
          ? [
              {
                data: 'foo',
                id: offset
              },
              {
                data: 'bar',
                id: offset + 1
              }
            ]
          : []
      return createResponse(response)
    }

    const key = createKey()
    function Page() {
      const { data } = useSWRInfinite(
        (index, previousPageData) => {
          // first page
          if (index === 0) return `/api/${key}`

          // hit the end
          if (!previousPageData.length) {
            return null
          }

          // fetch with offset
          return `/api/${key}?offset=${
            previousPageData[previousPageData.length - 1].id
          }`
        },
        mockAPIFetcher,
        {
          initialSize: 5
        }
      )

      if (!data) return <div>loading</div>

      const hitEnd = data[data.length - 1].length === 0
      return (
        <div>
          {data.map(page => {
            return page.map(item => {
              return (
                <span key={item.id}>
                  {item.id}: {item.data},{' '}
                </span>
              )
            })
          })}
          {hitEnd ? 'end.' : ''}
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('loading')

    await screen.findByText('0: foo,')
    await screen.findByText('1: bar,')
    await screen.findByText('2: foo,')
    await screen.findByText('3: bar,')
    await screen.findByText('end.')
  })

  it('should skip fetching existing pages when loading more', async () => {
    let requests = 0
    const key = createKey()

    function Page() {
      const { data, size, setSize } = useSWRInfinite(
        index => [key, index],
        ([_, index]) => {
          requests++
          return createResponse(`page ${index}, `)
        }
      )

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size + 1)
          }}
        >
          data:{data}
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    await screen.findByText('data:page 0,') // mounted
    expect(requests).toEqual(1)

    // load next page
    fireEvent.click(screen.getByText('data:page 0,'))

    await screen.findByText('data:page 0, page 1,') // mounted
    expect(requests).toEqual(3) // revalidate page 0, load page 1

    // load next page
    fireEvent.click(screen.getByText('data:page 0, page 1,'))

    await screen.findByText('data:page 0, page 1, page 2,') // mounted
    expect(requests).toEqual(5) // revalidate page 0, load page 2

    // load next page
    fireEvent.click(screen.getByText('data:page 0, page 1, page 2,'))

    await screen.findByText('data:page 0, page 1, page 2, page 3,') // mounted
    expect(requests).toEqual(7) // revalidate page 0, load page 3
  })

  it('should not revalidate page 0 when revalidateFirstPage is false', async () => {
    let requests = 0
    const key = createKey()

    function Page() {
      const { data, size, setSize } = useSWRInfinite(
        index => [key, index],
        ([_, index]) => {
          requests++
          return createResponse(`page ${index}, `)
        },
        {
          revalidateFirstPage: false
        }
      )

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size + 1)
          }}
        >
          data:{data}
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    await screen.findByText('data:page 0,') // mounted
    expect(requests).toEqual(1)

    // load next page
    fireEvent.click(screen.getByText('data:page 0,'))

    await screen.findByText('data:page 0, page 1,') // mounted
    expect(requests).toEqual(2) // load page 1

    // load next page
    fireEvent.click(screen.getByText('data:page 0, page 1,'))

    await screen.findByText('data:page 0, page 1, page 2,') // mounted
    expect(requests).toEqual(3) // load page 2

    // load next page
    fireEvent.click(screen.getByText('data:page 0, page 1, page 2,'))

    await screen.findByText('data:page 0, page 1, page 2, page 3,') // mounted
    expect(requests).toEqual(4) // load page 3
  })

  it('should cache page count', async () => {
    let toggle

    const key = createKey()
    function Page() {
      const { data, size, setSize } = useSWRInfinite(
        index => [key, index],
        ([_, index]) => createResponse(`page ${index}, `)
      )

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size + 1)
          }}
        >
          data:{data}
        </div>
      )
    }

    function App() {
      const [showList, setShowList] = useState(true)
      toggle = setShowList
      return showList ? <Page /> : <div>yo</div>
    }

    renderWithConfig(<App />)
    screen.getByText('data:')

    await screen.findByText('data:page 0,')

    // load next page
    fireEvent.click(screen.getByText('data:page 0,'))
    await screen.findByText('data:page 0, page 1,')

    // switch to another component
    act(() => toggle(v => !v))
    screen.getByText('yo')

    // switch back and it should still have 2 pages cached
    act(() => toggle(v => !v))
    screen.getByText('data:page 0, page 1,')
    await act(() => sleep(100))
    screen.getByText('data:page 0, page 1,')
  })

  it('should reset page size when key changes', async () => {
    let toggle

    const key = createKey()
    function Page() {
      const [t, setT] = useState(false)
      const { data, size, setSize } = useSWRInfinite(
        index => [key, index, t ? 'A' : 'B'],
        ([_, index]) => createResponse(`page ${index}, `)
      )

      toggle = setT

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size + 1)
          }}
        >
          data:{data}
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    await screen.findByText('data:page 0,')

    // load next page
    fireEvent.click(screen.getByText('data:page 0,'))
    await screen.findByText('data:page 0, page 1,')

    // switch key, it should have only 1 page
    act(() => toggle(v => !v))
    await screen.findByText('data:page 0,')
  })

  it('should persist page size when key changes', async () => {
    let toggle

    const key = createKey()
    function Page() {
      const [t, setT] = useState(false)
      const { data, size, setSize } = useSWRInfinite(
        index => [key, index, t ? 'A' : 'B'],
        async ([_, index]) => createResponse(`page ${index}, `),
        {
          persistSize: true
        }
      )

      toggle = setT

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size + 1)
          }}
        >
          data:{data}
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    await screen.findByText('data:page 0,')

    // load next page
    fireEvent.click(screen.getByText('data:page 0,'))

    await screen.findByText('data:page 0, page 1,')

    // switch key, it should still have 2 pages
    act(() => toggle(v => !v))
    await screen.findByText('data:page 0, page 1,')
  })

  it('should persist page size when remount', async () => {
    let toggle

    const key = createKey()
    function Comp() {
      const { data, size, setSize } = useSWRInfinite(
        index => [key, index],
        ([_, index]) => createResponse(`page ${index}, `)
      )

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size + 1)
          }}
        >
          data:{data}
        </div>
      )
    }

    function Page() {
      const [show, setShow] = useState(true)
      toggle = setShow
      return show ? <Comp /> : <div>hide</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    await screen.findByText('data:page 0,')

    // load next page
    fireEvent.click(screen.getByText('data:page 0,'))
    await screen.findByText('data:page 0, page 1,')

    // pages should be unmounted now
    act(() => toggle(v => !v))
    await screen.findByText('hide')

    // remount, should still have 2 pages
    act(() => toggle(v => !v))
    await screen.findByText('data:page 0, page 1,')
  })

  it('should keep `mutate` referential equal', async () => {
    const setters = []

    const key = createKey()
    function Comp() {
      const { data, size, setSize } = useSWRInfinite(
        index => [key, index],
        ([_, index]) => createResponse(`page ${index}, `)
      )

      setters.push(setSize)

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size + 1)
          }}
        >
          data:{data}
        </div>
      )
    }

    renderWithConfig(<Comp />)
    screen.getByText('data:')

    await screen.findByText('data:page 0,')

    // load next page
    fireEvent.click(screen.getByText('data:page 0,'))

    await screen.findByText('data:page 0, page 1,')

    // check all `setSize`s are referential equal.
    for (const setSize of setters) {
      expect(setSize).toEqual(setters[0])
    }
  })

  it('should share initial cache from `useSWR`', async () => {
    const cachedData = new Date().toISOString()
    const key = createKey()
    globalMutate(`shared-cache-${key}-0`, cachedData)

    function Page() {
      const { data } = useSWRInfinite<string, string>(
        index => `shared-cache-${key}-${index}`,
        () => createResponse(cachedData)
      )

      return <div>data:{data}</div>
    }
    renderWithGlobalCache(<Page />)
    screen.getByText('data:')

    // after a rerender we should already have the cached data rendered
    await screen.findByText(`data:${cachedData}`)
  })

  it('should not break refreshInterval', async () => {
    let value = 0
    const key = createKey()
    function Page() {
      const { data } = useSWRInfinite(
        index => `interval-${key}-${index}`,
        () => value++,
        {
          dedupingInterval: 0,
          refreshInterval: 100
        }
      )

      return <div>data:{data}</div>
    }
    renderWithConfig(<Page />)
    screen.getByText('data:')

    // after 300ms the rendered result should be 3
    await executeWithoutBatching(() => sleep(350))
    screen.getByText('data:3')
  })

  it('should re-use fallbackData', async () => {
    const dummyResponses = {
      '/api?page=1': ['page-1-1', 'page-1-2'],
      '/api?page=2': ['page-2-1', 'page-2-2']
    }
    const requests = []

    const key = createKey()
    function Page() {
      const { data, size, setSize } = useSWRInfinite(
        index => {
          return [key, `/api?page=${index + 1}`]
        },
        ([_, index]) => {
          requests.push(index)
          return createResponse<string[]>(dummyResponses[index])
        },
        {
          fallbackData: [dummyResponses[`/api?page=1`]]
        }
      )

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size + 1)
          }}
        >
          data:{(data ? [].concat(...data) : []).join(', ')}
        </div>
      )
    }

    renderWithConfig(<Page />)
    // render with the fallbackData
    screen.getByText('data:page-1-1, page-1-2')
    expect(requests).toEqual([]) // should use the initial data

    fireEvent.click(screen.getByText('data:page-1-1, page-1-2'))
    // Should this reuse the cached data for `page=1`?
    await screen.findByText('data:page-1-1, page-1-2, page-2-1, page-2-2')
    expect(requests).toEqual(['/api?page=1', '/api?page=2'])
  })

  it('should share data between multiple hooks have the same key', async () => {
    const key = createKey()
    const dummyResponses = {
      '/api?page=1': ['page-1-1', 'page-1-2'],
      '/api?page=2': ['page-2-1', 'page-2-2']
    }
    const useCustomSWRInfinite = () => {
      const { data, setSize, size } = useSWRInfinite(
        index => [key, `/api?page=${index + 1}`],
        ([_, index]) => createResponse<string[]>(dummyResponses[index])
      )
      return {
        data: data ? [].concat(...data) : [],
        setSize,
        size
      }
    }

    const Component = (props: { label: string }) => {
      const { data, size, setSize } = useCustomSWRInfinite()
      return (
        <>
          <ul>
            {data.map(value => (
              <li key={value}>
                {props.label}:{value}
              </li>
            ))}
          </ul>
          <button onClick={() => setSize(size + 1)}>{props.label}:click</button>
        </>
      )
    }

    function Page() {
      return (
        <div>
          <Component label="A" />
          <Component label="B" />
        </div>
      )
    }

    renderWithConfig(<Page />)

    // render responses for page=1
    await screen.findByText('A:page-1-2')
    await screen.findByText('B:page-1-2')

    fireEvent.click(screen.getByText('A:click'))

    // render responses for page=2
    await screen.findByText('A:page-2-2')
    await screen.findByText('B:page-2-2')
  })

  it('should support null as getKey', async () => {
    function Page() {
      const { data, setSize } = useSWRInfinite(null, () => 'data')

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size => size + 1)
          }}
        >
          data:{data || ''}
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')
    await screen.findByText('data:')

    // load next page
    fireEvent.click(screen.getByText('data:'))
    await screen.findByText('data:')
  })

  it('should support getKey to return null', async () => {
    function Page() {
      const { data, setSize } = useSWRInfinite(
        () => null,
        () => 'data'
      )

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size => size + 1)
          }}
        >
          data:{data || ''}
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')
    await screen.findByText('data:')

    // load next page
    fireEvent.click(screen.getByText('data:'))
    await screen.findByText('data:')
  })

  it('should mutate a cache with `unstable_serialize`', async () => {
    let count = 0
    const key = createKey()
    let mutate
    function Page() {
      mutate = useSWRConfig().mutate
      const { data } = useSWRInfinite(
        index => `page-test-${key}-${index}`,
        infiniteKey => createResponse(`${infiniteKey}:${++count}`)
      )
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    await screen.findByText(`data:page-test-${key}-0:1`)

    await act(() =>
      mutate(unstable_serialize(index => `page-test-${key}-${index}`))
    )
    await screen.findByText(`data:page-test-${key}-0:2`)

    await act(() =>
      mutate(
        unstable_serialize(index => `page-test-${key}-${index}`),
        'local-mutation',
        false
      )
    )
    await screen.findByText('data:local-mutation')
  })

  it('should mutate a cache with `unstable_serialize` based on a current data', async () => {
    const key = createKey()
    const getKey: (index: number) => [string, number] = (index: number) => [
      key,
      index
    ]
    let mutate
    function Comp() {
      mutate = useSWRConfig().mutate
      const { data, size, setSize } = useSWRInfinite(getKey, ([_, index]) =>
        createResponse(`page ${index}, `)
      )
      useEffect(() => {
        setSize(size + 1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
      return <div>data:{data}</div>
    }

    renderWithConfig(<Comp />)

    screen.getByText('data:')
    await screen.findByText('data:page 0, page 1,')

    await act(() =>
      mutate(
        unstable_serialize(getKey),
        data => data.map(value => `(edited)${value}`),
        false
      )
    )
    await screen.findByText('data:(edited)page 0, (edited)page 1,')
  })

  it('should be able to use `unstable_serialize` with a custom cache', async () => {
    const key = createKey()

    let mutateCustomCache

    function Page() {
      mutateCustomCache = useSWRConfig().mutate
      const { data } = useSWRInfinite(
        () => key,
        () => createResponse('response data')
      )
      return <div>data:{data}</div>
    }
    function App() {
      return (
        <SWRConfig
          value={{
            provider: () => new Map([[key, { data: 'initial-cache' }]])
          }}
        >
          <Page />
        </SWRConfig>
      )
    }

    renderWithConfig(<App />)
    screen.getByText('data:')

    await screen.findByText('data:initial-cache')

    await act(() => mutateCustomCache(unstable_serialize(() => key)))
    await screen.findByText('data:response data')

    await act(() =>
      mutateCustomCache(
        unstable_serialize(() => key),
        'local-mutation',
        false
      )
    )
    await screen.findByText('data:local-mutation')
  })

  it('should correctly set size when key is null', async () => {
    const loggedValues = []

    function Page() {
      const { size, setSize } = useSWRInfinite(
        () => null,
        () => ''
      )
      loggedValues.push(size)
      return <button onClick={() => setSize(1)}>set size</button>
    }

    renderWithConfig(<Page />)

    await screen.findByText('set size')
    fireEvent.click(screen.getByText('set size'))
    await nextTick()

    expect(loggedValues).toEqual([1])
  })

  it('setSize should only accept number', async () => {
    const key = createKey()
    function Comp() {
      const { data, size, setSize } = useSWRInfinite(
        index => [key, index],
        ([_, index]) => createResponse(`page ${index}`)
      )

      return (
        <>
          <div
            onClick={() => {
              // load next page
              // @ts-expect-error
              setSize('2')
            }}
          >
            data:{data}
          </div>
          <div>size:{size}</div>
        </>
      )
    }
    renderWithConfig(<Comp></Comp>)
    await screen.findByText('data:page 0')
    await screen.findByText('size:1')

    fireEvent.click(screen.getByText('data:page 0'))

    await screen.findByText('data:page 0')
    await screen.findByText('size:1')
  })

  it('should correctly set size when setSize receives a callback', async () => {
    const key = createKey()

    function Page() {
      const { data, size, setSize } = useSWRInfinite(
        index => `${key}-${index}`,
        k => createResponse(`page-${k}`)
      )
      return (
        <div>
          <p>data: {(data || []).join()}</p>
          <p>size: {size}</p>
          <button onClick={() => setSize(sz => sz + 1)}>set size</button>
        </div>
      )
    }

    const getDataBySize = size =>
      Array<string>(size)
        .fill('')
        .map((_, index) => `page-${key}-${index}`)
        .join()

    renderWithConfig(<Page />)

    await screen.findByText('set size')
    const btn = screen.getByText('set size')

    fireEvent.click(btn)
    await nextTick()
    await screen.findByText(`data: ${getDataBySize(2)}`)
    await screen.findByText('size: 2')

    fireEvent.click(btn)
    await nextTick()
    await screen.findByText(`data: ${getDataBySize(3)}`)
    await screen.findByText('size: 3')
  })

  it('setSize should return a promise', async () => {
    let _setSize
    function Comp() {
      const { setSize } = useSWRInfinite(
        () => null,
        () => createResponse('')
      )

      _setSize = setSize
      return null
    }
    renderWithConfig(<Comp />)
    expect(_setSize()).toBeInstanceOf(Promise)
  })

  // https://github.com/vercel/swr/issues/908
  //TODO: This test trigger act warning
  it('should revalidate first page after mutating', async () => {
    let renderedData
    const key = createKey()
    let v = 'old'

    function Page() {
      const {
        data,
        size,
        mutate: boundMutate
      } = useSWRInfinite(
        i => [key, i],
        () => v
      )
      renderedData = data

      return (
        <div>
          <button
            onClick={() => {
              v = 'new'
              boundMutate([v])
            }}
          >
            mutate
          </button>
          <p>size=${size}</p>
        </div>
      )
    }

    renderWithConfig(<Page />)

    await screen.findByText('mutate')
    await nextTick()
    expect(renderedData).toEqual(['old'])
    fireEvent.click(screen.getByText('mutate'))
    await nextTick()
    expect(renderedData).toEqual(['new'])
  })

  it('should reuse cached value for new pages', async () => {
    const key = createKey()

    function Page() {
      const { data, setSize } = useSWRInfinite(
        index => key + '-' + index,
        () => createResponse('response value')
      )
      return (
        <div onClick={() => setSize(2)}>data:{data ? data.join(',') : ''}</div>
      )
    }

    renderWithConfig(<Page />, {
      provider: () => new Map([[key + '-1', { data: 'cached value' }]])
    })

    screen.getByText('data:')
    await screen.findByText('data:response value')
    fireEvent.click(screen.getByText('data:response value'))
    await screen.findByText('data:response value,cached value')
  })

  it('should return cached value ASAP when updating size and revalidate in the background', async () => {
    const key = createKey()
    const getData = jest.fn(v => v)

    function Page() {
      const { data, setSize } = useSWRInfinite(
        index => key + '-' + index,
        () => sleep(30).then(() => getData('response value'))
      )
      return (
        <div onClick={() => setSize(2)}>data:{data ? data.join(',') : ''}</div>
      )
    }
    renderWithConfig(<Page />, {
      provider: () => new Map([[key + '-1', { data: 'cached value' }]])
    })

    screen.getByText('data:')
    await screen.findByText('data:response value')
    expect(getData).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('data:response value'))

    // Returned directly from the cache without blocking
    await screen.findByText('data:response value,cached value')
    expect(getData).toHaveBeenCalledTimes(1)

    // Revalidate
    await act(() => sleep(30))
    expect(getData).toHaveBeenCalledTimes(2)
  })

  it('should block on fetching new uncached pages when updating size', async () => {
    const key = createKey()
    const getData = jest.fn(v => v)

    function Page() {
      const { data, setSize } = useSWRInfinite(
        index => key + '-' + index,
        () => sleep(30).then(() => getData('response value'))
      )
      return (
        <div onClick={() => setSize(2)}>data:{data ? data.join(',') : ''}</div>
      )
    }

    renderWithConfig(<Page />)

    screen.getByText('data:')
    await screen.findByText('data:response value')
    expect(getData).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('data:response value'))

    // Fetch new page and revalidate the first page.
    await screen.findByText('data:response value,response value')
    expect(getData).toHaveBeenCalledTimes(3)
  })

  it('should return fallbackData if cache is empty', async () => {
    const key = createKey()

    function Page() {
      const { data, setSize } = useSWRInfinite(
        index => key + '-' + index,
        () => sleep(30).then(() => 'response value'),
        { fallbackData: ['fallback-1', 'fallback-2'] }
      )
      return (
        <div onClick={() => setSize(2)}>data:{data ? data.join(',') : ''}</div>
      )
    }
    renderWithConfig(<Page />)

    screen.getByText('data:fallback-1,fallback-2')

    // Update size, it should still render the fallback
    fireEvent.click(screen.getByText('data:fallback-1,fallback-2'))
    await nextTick()
    screen.getByText('data:fallback-1,fallback-2')
  })

  it('should revalidate the resource with bound mutate when no argument is passed', async () => {
    let t = 0
    const key = createKey()
    const fetcher = jest.fn(async () =>
      createResponse(`foo-${t++}`, { delay: 10 })
    )
    const logger = []
    function Page() {
      const { data, mutate } = useSWRInfinite(() => key, fetcher, {
        dedupingInterval: 0
      })
      logger.push(data)
      return (
        <>
          <div>data: {String(data)}</div>
          <button onClick={() => mutate()}>mutate</button>
        </>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText('data: foo-0')

    fireEvent.click(screen.getByText('mutate'))
    await screen.findByText('data: foo-1')
    expect(fetcher).toBeCalledTimes(2)

    expect(logger).toEqual([undefined, ['foo-0'], ['foo-1']])
  })

  it('should pass the correct cursor information in `getKey`', async () => {
    const key = createKey()
    const fetcher = jest.fn(index => createResponse('data-' + index))
    const logger = []
    function Page() {
      const { data } = useSWRInfinite(
        (index, previousPageData) => {
          logger.push(key + ':' + index + ':' + previousPageData)
          return '' + index
        },
        fetcher,
        {
          dedupingInterval: 0,
          initialSize: 5
        }
      )
      return (
        <>
          <div>{data ? data.length : 0}</div>
        </>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText('5')

    expect(
      logger.every(log => {
        const [k, index, previousData] = log.split(':')
        return (
          k === key &&
          ((index === '0' && previousData === 'null') ||
            previousData === 'data-' + (index - 1))
        )
      })
    ).toBeTruthy()
  })

  // https://github.com/vercel/swr/issues/1776
  it('should update the getKey reference with the suspense mode', async () => {
    const keyA = 'keyA' + createKey()
    const keyB = 'keyB' + createKey()

    const apiData = {
      [keyA]: ['A1', 'A2', 'A3'],
      [keyB]: ['B1', 'B2', 'B3']
    }

    function Page() {
      const [status, setStatus] = useState('a')
      const { data, setSize } = useSWRInfinite(
        () => (status === 'a' ? keyA : keyB),
        key => createResponse(apiData[key]),
        { suspense: true }
      )
      return (
        <>
          <div>data: {String(data)}</div>
          <button
            onClick={() => {
              setStatus('b')
              setSize(1)
            }}
          >
            mutate
          </button>
        </>
      )
    }
    renderWithConfig(
      <Suspense fallback="loading">
        <Page />
      </Suspense>
    )
    await screen.findByText('data: A1,A2,A3')

    fireEvent.click(screen.getByText('mutate'))
    await screen.findByText('data: B1,B2,B3')
  })

  it('should revalidate the resource with bound mutate when arguments are passed', async () => {
    const key = createKey()

    let counter = 0

    function Content() {
      const { data } = useSWRInfinite(
        () => key,
        () => createResponse(++counter),
        {
          revalidateOnMount: true,
          revalidateFirstPage: false,
          dedupingInterval: 0
        }
      )
      return <div>data: {String(data)}</div>
    }

    function Page() {
      const [contentKey, setContentKey] = useState('a')
      return (
        <>
          <Content key={contentKey} />
          <button
            onClick={() => {
              setContentKey('b')
            }}
          >
            mutate
          </button>
        </>
      )
    }
    renderWithConfig(<Page />)
    await screen.findByText('data: 1')

    fireEvent.click(screen.getByText('mutate'))
    await screen.findByText('data: 2')
  })

  // https://github.com/vercel/swr/issues/1899
  it('should revalidate the resource with bound mutate when options is of Object type ', async () => {
    let t = 0
    const key = createKey()
    const fetcher = jest.fn(async () =>
      createResponse(`foo-${t++}`, { delay: 10 })
    )
    const logger = []
    function Page() {
      const { data, mutate } = useSWRInfinite(() => key, fetcher, {
        dedupingInterval: 0
      })
      logger.push(data)
      return (
        <>
          <div>data: {String(data)}</div>
          <button onClick={() => mutate(data, { revalidate: true })}>
            mutate
          </button>
        </>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText('data: foo-0')

    fireEvent.click(screen.getByText('mutate'))
    await screen.findByText('data: foo-1')
    expect(fetcher).toBeCalledTimes(2)

    expect(logger).toEqual([undefined, ['foo-0'], ['foo-1']])
  })

  // https://github.com/vercel/swr/issues/1899
  it('should not revalidate the resource with bound mutate when options is of Object type', async () => {
    let t = 0
    const key = createKey()
    const fetcher = jest.fn(async () =>
      createResponse(`foo-${t++}`, { delay: 10 })
    )
    const logger = []
    function Page() {
      const { data, mutate } = useSWRInfinite(() => key, fetcher, {
        dedupingInterval: 0
      })
      logger.push(data)
      return (
        <>
          <div>data: {String(data)}</div>
          <button onClick={() => mutate(data, { revalidate: false })}>
            mutate
          </button>
        </>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText('data: foo-0')

    fireEvent.click(screen.getByText('mutate'))
    expect(fetcher).toBeCalledTimes(1)

    expect(logger).toEqual([undefined, ['foo-0']])
  })

  it('should share data with useSWR', async () => {
    const key = createKey()
    const SWR = () => {
      const { data } = useSWR(`${key}-${2}`)
      return <div>swr: {data}</div>
    }
    const Page = () => {
      const { data, setSize, size } = useSWRInfinite(
        index => `${key}-${index + 1}`,
        infiniteKey => createResponse(`${infiniteKey},`, { delay: 100 })
      )
      return (
        <>
          <div onClick={() => setSize(i => i + 1)}>data: {data}</div>
          <div onClick={() => setSize(i => i + 1)}>size: {size}</div>
          <SWR></SWR>
        </>
      )
    }
    renderWithConfig(<Page />)
    await screen.findByText(`data: ${key}-1,`)
    await screen.findByText(`swr:`)
    fireEvent.click(screen.getByText('size: 1'))
    await screen.findByText(`data: ${key}-1,${key}-2,`)
    await screen.findByText(`size: 2`)
    await screen.findByText(`swr: ${key}-2,`)
  })
})
