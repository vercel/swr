import React, { useEffect, useState } from 'react'
import { render, fireEvent, act, screen } from '@testing-library/react'
import { mutate, useSWRConfig, SWRConfig } from 'swr'
import useSWRInfinite, { unstable_serialize } from 'swr/infinite'
import { sleep, createKey, createResponse, nextTick } from './utils'

describe('useSWRInfinite', () => {
  it('should render the first page component', async () => {
    function Page() {
      const { data } = useSWRInfinite<string, string>(
        index => `page-${index}`,
        key => createResponse(key)
      )

      return <div>data:{data}</div>
    }

    render(<Page />)
    screen.getByText('data:')

    await screen.findByText('data:page-0')
  })

  it('should render the multiple pages', async () => {
    function Page() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-2`, index],
        (_, index) => createResponse(`page ${index}, `)
      )

      useEffect(() => {
        // load next page if the current one is ready
        if (size <= 2) setSize(size + 1)
        // The setSize function is guaranteed to be referential equal
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [size])

      return <div>data:{data}</div>
    }

    render(<Page />)
    screen.getByText('data:')

    await screen.findByText('data:page 0, page 1, page 2,')
  })

  it('should support mutate and initialSize', async () => {
    // mock api
    const pageData = ['apple', 'banana', 'pineapple']

    function Page() {
      const { data, mutate: boundMutate } = useSWRInfinite<string, string>(
        index => [`pagetest-3`, index],
        (_, index) => createResponse(`${pageData[index]}, `),
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

    render(<Page />)
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

    function Page() {
      const { data } = useSWRInfinite(
        (index, previousPageData) => {
          // first page
          if (index === 0) return '/api'

          // hit the end
          if (!previousPageData.length) {
            return null
          }

          // fetch with offset
          return `/api?offset=${previousPageData[previousPageData.length - 1].id}`
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

    render(<Page />)
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
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [key, index],
        (_, index) => {
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

    render(<Page />)
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

  it('should cache page count', async () => {
    let toggle

    function Page() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-5`, index],
        (_, index) => createResponse(`page ${index}, `)
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

    render(<App />)
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

    function Page() {
      const [t, setT] = useState(false)
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-6`, index, t ? 'A' : 'B'],
        (_, index) => createResponse(`page ${index}, `)
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

    render(<Page />)
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

    function Page() {
      const [t, setT] = useState(false)
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-7`, index, t ? 'A' : 'B'],
        async (_, index) => createResponse(`page ${index}, `),
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

    render(<Page />)
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

    function Comp() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-8`, index],
        (_, index) => createResponse(`page ${index}, `)
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

    render(<Page />)
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

    function Comp() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-9`, index],
        (_, index) => createResponse(`page ${index}, `)
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

    render(<Comp />)
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
    mutate('shared-cache-0', cachedData)

    function Page() {
      const { data } = useSWRInfinite<string, string>(
        index => `shared-cache-${index}`,
        () => createResponse(cachedData)
      )

      return <div>data:{data}</div>
    }
    render(<Page />)
    screen.getByText('data:')

    // after a rerender we should already have the cached data rendered
    await screen.findByText(`data:${cachedData}`)
  })

  it('should not break refreshInterval', async () => {
    let value = 0
    function Page() {
      const { data } = useSWRInfinite<number, string>(
        index => `interval-0-${index}`,
        () => value++,
        {
          dedupingInterval: 0,
          refreshInterval: 100
        }
      )

      return <div>data:{data}</div>
    }
    render(<Page />)
    screen.getByText('data:')

    // after 300ms the rendered result should be 3
    await act(() => sleep(350))
    screen.getByText('data:3')
  })

  it('should re-use fallbackData', async () => {
    const dummyResponses = {
      '/api?page=1': ['page-1-1', 'page-1-2'],
      '/api?page=2': ['page-2-1', 'page-2-2']
    }
    const requests = []

    function Page() {
      const { data, size, setSize } = useSWRInfinite<string[], string>(
        index => {
          return [`page-test-10`, `/api?page=${index + 1}`]
        },
        (_, index) => {
          requests.push(index)
          return createResponse(dummyResponses[index])
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

    render(<Page />)
    // render with the fallbackData
    screen.getByText('data:page-1-1, page-1-2')
    expect(requests).toEqual([]) // should use the initial data

    fireEvent.click(screen.getByText('data:page-1-1, page-1-2'))
    // Should this reuse the cached data for `page=1`?
    await screen.findByText('data:page-1-1, page-1-2, page-2-1, page-2-2')
    expect(requests).toEqual(['/api?page=1', '/api?page=2'])
  })

  it('should share data between multiple hooks have the same key', async () => {
    const dummyResponses = {
      '/api?page=1': ['page-1-1', 'page-1-2'],
      '/api?page=2': ['page-2-1', 'page-2-2']
    }
    const useCustomSWRInfinite = () => {
      const { data, setSize, size } = useSWRInfinite<string[], string>(
        index => [`page-test-11`, `/api?page=${index + 1}`],
        (_, index) => createResponse(dummyResponses[index])
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

    render(<Page />)

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
      const { data, setSize } = useSWRInfinite<string, string>(
        null,
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

    render(<Page />)
    screen.getByText('data:')
    await screen.findByText('data:')

    // load next page
    fireEvent.click(screen.getByText('data:'))
    await screen.findByText('data:')
  })

  it('should mutate a cache with `unstable_serialize`', async () => {
    let count = 0
    function Page() {
      const { data } = useSWRInfinite<string, string>(
        index => `page-test-12-${index}`,
        key => createResponse(`${key}:${++count}`)
      )
      return <div>data:{data}</div>
    }

    render(<Page />)
    screen.getByText('data:')

    await screen.findByText('data:page-test-12-0:1')

    await act(() =>
      mutate(unstable_serialize(index => `page-test-12-${index}`))
    )
    await screen.findByText('data:page-test-12-0:2')

    await act(() =>
      mutate(
        unstable_serialize(index => `page-test-12-${index}`),
        'local-mutation',
        false
      )
    )
    await screen.findByText('data:local-mutation')
  })

  it('should mutate a cache with `unstable_serialize` based on a current data', async () => {
    const getKey = index => [`pagetest-13`, index]
    function Comp() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
        getKey,
        (_, index) => createResponse(`page ${index}, `)
      )
      useEffect(() => {
        setSize(size + 1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
      return <div>data:{data}</div>
    }

    render(<Comp />)

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
    const key = 'page-test-14;'

    let mutateCustomCache

    function Page() {
      mutateCustomCache = useSWRConfig().mutate
      const { data } = useSWRInfinite<string, string>(
        () => key,
        () => createResponse('response data')
      )
      return <div>data:{data}</div>
    }
    function App() {
      return (
        <SWRConfig
          value={{ provider: () => new Map([[key, 'initial-cache']]) }}
        >
          <Page />
        </SWRConfig>
      )
    }

    render(<App />)
    screen.getByText('data:')

    await screen.findByText('data:initial-cache')

    await act(() => mutateCustomCache(unstable_serialize(() => key)))
    await screen.findByText('data:response data')

    await act(() =>
      mutateCustomCache(unstable_serialize(() => key), 'local-mutation', false)
    )
    await screen.findByText('data:local-mutation')
  })

  it('should correctly set size when key is null', async () => {
    const loggedValues = []

    function Page() {
      const { size, setSize } = useSWRInfinite<string, string>(
        () => null,
        () => ''
      )
      loggedValues.push(size)
      return <button onClick={() => setSize(1)}>set size</button>
    }

    render(<Page />)

    await screen.findByText('set size')
    fireEvent.click(screen.getByText('set size'))
    await nextTick()

    expect(loggedValues).toEqual([1])
  })

  it('should correctly set size when setSize receives a callback', async () => {
    const key = createKey()

    function Page() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
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

    render(<Page />)

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

  // https://github.com/vercel/swr/issues/908
  it('should revalidate first page after mutating', async () => {
    let renderedData
    const key = createKey()
    let v = 'old'

    function Page() {
      const { data, size, mutate: boundMutate } = useSWRInfinite<
        string,
        string
      >(i => [key, i], () => v)
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

    render(<Page />)

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
      const { data, setSize } = useSWRInfinite<string, string>(
        index => key + '-' + index,
        () => createResponse('response value')
      )
      return (
        <div onClick={() => setSize(2)}>data:{data ? data.join(',') : ''}</div>
      )
    }

    render(
      <SWRConfig
        value={{ provider: () => new Map([[key + '-1', 'cached value']]) }}
      >
        <Page />
      </SWRConfig>
    )

    screen.getByText('data:')
    await screen.findByText('data:response value')
    fireEvent.click(screen.getByText('data:response value'))
    await screen.findByText('data:response value,cached value')
  })

  it('should return cached value ASAP when updating size and revalidate in the background', async () => {
    const key = createKey()
    const getData = jest.fn(v => v)

    function Page() {
      const { data, setSize } = useSWRInfinite<string, string>(
        index => key + '-' + index,
        () => sleep(30).then(() => getData('response value'))
      )
      return (
        <div onClick={() => setSize(2)}>data:{data ? data.join(',') : ''}</div>
      )
    }
    render(
      <SWRConfig
        value={{ provider: () => new Map([[key + '-1', 'cached value']]) }}
      >
        <Page />
      </SWRConfig>
    )

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
      const { data, setSize } = useSWRInfinite<string, string>(
        index => key + '-' + index,
        () => sleep(30).then(() => getData('response value'))
      )
      return (
        <div onClick={() => setSize(2)}>data:{data ? data.join(',') : ''}</div>
      )
    }

    render(<Page />)

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
      const { data, setSize } = useSWRInfinite<string, string>(
        index => key + '-' + index,
        () => sleep(30).then(() => 'response value'),
        { fallbackData: ['fallback-1', 'fallback-2'] }
      )
      return (
        <div onClick={() => setSize(2)}>data:{data ? data.join(',') : ''}</div>
      )
    }
    render(<Page />)

    screen.getByText('data:fallback-1,fallback-2')

    // Update size, it should still render the fallback
    fireEvent.click(screen.getByText('data:fallback-1,fallback-2'))
    await nextTick()
    screen.getByText('data:fallback-1,fallback-2')
  })
})
