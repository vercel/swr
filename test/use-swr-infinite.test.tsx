import React, { useEffect } from 'react'
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
      const { data, page, setPage } = useSWRInfinite<string, string>(
        index => [`pagetest-2`, index],
        async (_, index) => {
          await new Promise(res => setTimeout(res, 100))
          return `page ${index}, `
        }
      )

      useEffect(() => {
        // load next page if the current one is ready
        if (page <= 2) setPage(page + 1)
      }, [page])

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

  it('should support mutate and initialPage', async () => {
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
          initialPage: 3
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
          initialPage: 5
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
})
