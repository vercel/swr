import React, { useEffect, useState } from 'react'
import {
  render,
  waitForDomChange,
  fireEvent,
  act
} from '@testing-library/react'

import { useSWRInfinite } from '../src'

describe('useSWRInfinite', () => {
  it('should render the first page component', async () => {
    function Page() {
      const { data } = useSWRInfinite<string, string>(
        index => `page-${index}`,
        async key => {
          await new Promise(res => setTimeout(res, 100))
          return key
        }
      )

      return <div>{data}</div>
    }
    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    await waitForDomChange({ container }) // mount
    expect(container.textContent).toMatchInlineSnapshot(`"page-0"`)
  })

  it('should render the multiple pages', async () => {
    function Page() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-2`, index],
        async (_, index) => {
          await new Promise(res => setTimeout(res, 100))
          return `page ${index}, `
        }
      )

      useEffect(() => {
        // load next page if the current one is ready
        if (size <= 2) setSize(size + 1)
      }, [size])

      return <div>{data}</div>
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    await waitForDomChange({ container }) // mount
    // should have 3 pages at the same time
    expect(container.textContent).toMatchInlineSnapshot(
      `"page 0, page 1, page 2, "`
    )
  })

  it('should support mutate and initialSize', async () => {
    // mock api
    let pageData = ['apple', 'banana', 'pineapple']

    function Page() {
      const { data, mutate } = useSWRInfinite<string, string>(
        index => [`pagetest-3`, index],
        async (_, index) => {
          await new Promise(res => setTimeout(res, 100))
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
            mutate()
          }}
        >
          {data}
        </div>
      )
    }

    const { container } = render(<Page />)
    expect(container.textContent).toMatchInlineSnapshot(`""`)
    await waitForDomChange({ container }) // mount
    expect(container.textContent).toMatchInlineSnapshot(
      `"apple, banana, pineapple, "`
    )

    // change the source data to 'watermelon'
    pageData[1] = 'watermelon'
    // revalidate
    fireEvent.click(container.firstElementChild)
    await act(() => new Promise(res => setTimeout(res, 350)))
    expect(container.textContent).toMatchInlineSnapshot(
      `"apple, watermelon, pineapple, "`
    )
  })

  it('should support api cursor', async () => {
    // an API that supports the `?offset=` param
    async function mockAPIFetcher(url) {
      await new Promise(res => setTimeout(res, 100))
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
    await waitForDomChange({ container }) // mount
    expect(container.textContent).toMatchInlineSnapshot(
      `"0: foo, 1: bar, 2: foo, 3: bar, end."`
    )
  })

  it('should skip fetching existing pages when loading more', async () => {
    let requests = 0
    function Page() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-4`, index],
        async (_, index) => {
          requests++
          await new Promise(res => setTimeout(res, 100))
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
    await waitForDomChange({ container }) // mount
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, "`)
    expect(requests).toEqual(1)

    // load next page
    fireEvent.click(container.firstElementChild)
    await act(() => new Promise(res => setTimeout(res, 150)))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)
    expect(requests).toEqual(2)

    // load next page
    fireEvent.click(container.firstElementChild)
    await act(() => new Promise(res => setTimeout(res, 150)))
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
          await new Promise(res => setTimeout(res, 100))
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
    await waitForDomChange({ container }) // mount
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, "`)

    // load next page
    fireEvent.click(container.firstElementChild)
    await act(() => new Promise(res => setTimeout(res, 150)))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)

    // switch to another component
    act(() => toggle(v => !v))
    expect(container.textContent).toMatchInlineSnapshot(`"yo"`)

    // switch back and it should still have 2 pages cached
    act(() => toggle(v => !v))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)
    await act(() => new Promise(res => setTimeout(res, 100)))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)
  })

  it('should reset page size when key changes', async () => {
    let toggle

    function Page() {
      const [t, setT] = useState(false)
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-6`, index, t ? 'A' : 'B'],
        async (_, index) => {
          await new Promise(res => setTimeout(res, 100))
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
    await waitForDomChange({ container }) // mount
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, "`)

    // load next page
    fireEvent.click(container.firstElementChild)
    await act(() => new Promise(res => setTimeout(res, 150)))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)

    // switch key, it should have only 1 page
    act(() => toggle(v => !v))
    await act(() => new Promise(res => setTimeout(res, 150)))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, "`)
  })

  it('should persist page size when key changes', async () => {
    let toggle

    function Page() {
      const [t, setT] = useState(false)
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-7`, index, t ? 'A' : 'B'],
        async (_, index) => {
          await new Promise(res => setTimeout(res, 100))
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
    await waitForDomChange({ container }) // mount
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, "`)

    // load next page
    fireEvent.click(container.firstElementChild)
    await act(() => new Promise(res => setTimeout(res, 150)))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)

    // switch key, it should still have 2 pages
    act(() => toggle(v => !v))
    await act(() => new Promise(res => setTimeout(res, 250)))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)
  })

  it('should persist page size when remount', async () => {
    let toggle

    function Comp() {
      const { data, size, setSize } = useSWRInfinite<string, string>(
        index => [`pagetest-8`, index],
        async (_, index) => {
          await new Promise(res => setTimeout(res, 100))
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
    await waitForDomChange({ container }) // mount
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, "`)

    // load next page
    fireEvent.click(container.firstElementChild)
    await act(() => new Promise(res => setTimeout(res, 150)))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)

    // pages should be unmounted now
    act(() => toggle(v => !v))
    await act(() => new Promise(res => setTimeout(res, 50)))
    expect(container.textContent).toMatchInlineSnapshot(`""`)

    // remount, should still have 2 pages
    act(() => toggle(v => !v))
    await act(() => new Promise(res => setTimeout(res, 150)))
    expect(container.textContent).toMatchInlineSnapshot(`"page 0, page 1, "`)
  })
})
