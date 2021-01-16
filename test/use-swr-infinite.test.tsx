import React, { useEffect, useState } from 'react'
import { render, fireEvent, act, screen } from '@testing-library/react'
import { useSWRInfinite, mutate } from '../src'
import { sleep } from './utils'

describe('useSWRInfinite', () => {
  it('should render the first page component', async () => {
    function Page() {
      const { data } = useSWRInfinite<string, string>(
        index => `page-${index}`,
        async key => {
          await sleep(100)
          return key
        }
      )

      return <div>{data}</div>
    }
    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    await screen.findByText('page-0')
  })

  it('should render the multiple pages', async () => {
    function Page() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-2`, index],
        async (_, index) => {
          await sleep(100)
          return `page ${index}, `
        }
      )

      useEffect(() => {
        // load next page if the current one is ready
        if (size <= 2) setSize(size + 1)
        // The setSize function is guaranteed to be referential equal
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [size])

      return <div>{data}</div>
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    await screen.findByText('page 0, page 1, page 2,')
  })

  it('should support mutate and initialSize', async () => {
    // mock api
    let pageData = ['apple', 'banana', 'pineapple']

    function Page() {
      const { data, mutate: boundMutate } = useSWRInfinite<string, string>(
        index => [`pagetest-3`, index],
        async (_, index) => {
          await sleep(100)
          return `${pageData[index]}, `
        },
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
          {data}
        </div>
      )
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    await screen.findByText('apple, banana, pineapple,')

    // change the source data to 'watermelon'
    pageData[1] = 'watermelon'
    // revalidate
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(350))
    expect(container.textContent).toMatchInlineSnapshot(
      `"apple, watermelon, pineapple, "`
    )
  })

  it('should support api cursor', async () => {
    // an API that supports the `?offset=` param
    async function mockAPIFetcher(url) {
      await sleep(100)
      const parse = url.match(/\?offset=(\d+)/)
      const offset = parse ? +parse[1] + 1 : 0
      if (offset <= 3) {
        return [
          {
            data: 'foo',
            id: offset
          },
          {
            data: 'bar',
            id: offset + 1
          }
        ]
      }
      return []
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

      if (!data) return null

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

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    await screen.findByText('0: foo,')
    await screen.findByText('1: bar,')
    await screen.findByText('2: foo,')
    await screen.findByText('3: bar,')
    await screen.findByText('end.')
  })

  it('should skip fetching existing pages when loading more', async () => {
    let requests = 0
    function Page() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-4`, index],
        async (_, index) => {
          requests++
          await sleep(100)
          return `page ${index}, `
        }
      )

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size + 1)
          }}
        >
          {data}
        </div>
      )
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    await screen.findByText('page 0,') // mounted
    expect(requests).toEqual(1)

    // load next page
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(150))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)
    expect(requests).toEqual(2)

    // load next page
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(150))
    expect(container.textContent).toMatchInlineSnapshot(
      `"page 0, page 1, page 2, "`
    )
    expect(requests).toEqual(3)
  })

  it('should cache page count', async () => {
    let toggle

    function Page() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-5`, index],
        async (_, index) => {
          await sleep(100)
          return `page ${index}, `
        }
      )

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size + 1)
          }}
        >
          {data}
        </div>
      )
    }

    function App() {
      const [showList, setShowList] = useState(true)
      toggle = setShowList
      return showList ? <Page /> : <div>yo</div>
    }

    const { container } = render(<App />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    await screen.findByText('page 0,')
    // load next page
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(150))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)

    // switch to another component
    act(() => toggle(v => !v))
    expect(container.textContent).toMatchInlineSnapshot(`"yo"`)

    // switch back and it should still have 2 pages cached
    act(() => toggle(v => !v))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)
    await act(() => sleep(100))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)
  })

  it('should reset page size when key changes', async () => {
    let toggle

    function Page() {
      const [t, setT] = useState(false)
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-6`, index, t ? 'A' : 'B'],
        async (_, index) => {
          await sleep(100)
          return `page ${index}, `
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
          {data}
        </div>
      )
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    await screen.findByText('page 0,')

    // load next page
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(150))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)

    // switch key, it should have only 1 page
    act(() => toggle(v => !v))
    await act(() => sleep(150))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, "`)
  })

  it('should persist page size when key changes', async () => {
    let toggle

    function Page() {
      const [t, setT] = useState(false)
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-7`, index, t ? 'A' : 'B'],
        async (_, index) => {
          await sleep(100)
          return `page ${index}, `
        },
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
          {data}
        </div>
      )
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    await screen.findByText('page 0,')

    // load next page
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(150))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)

    // switch key, it should still have 2 pages
    act(() => toggle(v => !v))
    await act(() => sleep(250))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)
  })

  it('should persist page size when remount', async () => {
    let toggle

    function Comp() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-8`, index],
        async (_, index) => {
          await sleep(100)
          return `page ${index}, `
        }
      )

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size + 1)
          }}
        >
          {data}
        </div>
      )
    }

    function Page() {
      const [show, setShow] = useState(true)
      toggle = setShow
      return show ? <Comp /> : null
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    await screen.findByText('page 0,')

    // load next page
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(150))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)

    // pages should be unmounted now
    act(() => toggle(v => !v))
    await act(() => sleep(50))
    expect(container.textContent).toMatchInlineSnapshot(`""`)

    // remount, should still have 2 pages
    act(() => toggle(v => !v))
    await act(() => sleep(150))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)
  })

  it('should keep `mutate` referential equal', async () => {
    const setters = []

    function Comp() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-9`, index],
        async (_, index) => {
          await sleep(100)
          return `page ${index}, `
        }
      )

      setters.push(setSize)

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size + 1)
          }}
        >
          {data}
        </div>
      )
    }

    const { container } = render(<Comp />)
    await screen.findByText('page 0,')

    // load next page
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(150))

    // check all `setSize`s are referential equal.
    for (let setSize of setters) {
      expect(setSize).toEqual(setters[0])
    }
  })

  it('should share initial cache from `useSWR`', async () => {
    const cachedData = new Date().toISOString()
    mutate('shared-cache-0', cachedData)

    function Page() {
      const { data } = useSWRInfinite<string, string>(
        index => `shared-cache-${index}`,
        async () => {
          await new Promise(res => setTimeout(res, 200))
          return cachedData
        }
      )

      return <div>{data}</div>
    }
    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    // after a rerender we should already have the cached data rendered
    await act(() => new Promise(res => setTimeout(res, 10)))
    expect(container.textContent).toMatchInlineSnapshot(`"${cachedData}"`)
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

      return <div>{data}</div>
    }
    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    // after 300ms the rendered result should be 3
    await act(() => new Promise(res => setTimeout(res, 310)))
    expect(container.textContent).toMatchInlineSnapshot(`"3"`)
  })
    
  it('should re-use initialData', async () => {
    const dummyResponses = {
      '/api?page=1': ['page-1-1', 'page-1-2'],
      '/api?page=2': ['page-2-1', 'page-2-2']
    }
    let requests = []

    function Page() {
      const { data, size, setSize } = useSWRInfinite<string[], string>(
        index => {
          return [`page-test-10`, `/api?page=${index + 1}`]
        },
        async (_, index) => {
          await new Promise(res => setTimeout(res, 100))
          requests.push(index)
          return dummyResponses[index]
        },
        {
          initialData: [dummyResponses[`/api?page=1`]]
        }
      )

      return (
        <div
          onClick={() => {
            // load next page
            setSize(size + 1)
          }}
        >
          {(data ? [].concat(...data) : []).join(', ')}
        </div>
      )
    }

    const { container } = render(<Page />)

    // render with the initialData
    expect(container.textContent).toMatchInlineSnapshot(`"page-1-1, page-1-2"`)
    expect(requests).toEqual([]) // should use the initial data
    fireEvent.click(container.firstElementChild)

    // Should this reuse the cached data for `page=1`?
    await screen.findByText('page-1-1, page-1-2, page-2-1, page-2-2')
    expect(requests).toEqual(['/api?page=1', '/api?page=2'])
  })
})
