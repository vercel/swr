import { act, screen, fireEvent } from '@testing-library/react'
import useSWR, { useSWRConfig } from 'swr'
import useSWRInfinite from 'swr/infinite'
import { createKey, createResponse, renderWithConfig, sleep } from './utils'
import '@testing-library/jest-dom'

describe('useSWRInfinite - Real Issue #1670 Reproduction', () => {
  it('should reproduce the actual issue: cannot revalidate all infinite pages after mutation', async () => {
    const key = createKey()
    const dataStore = {
      serverData: {
        0: ['Item 1', 'Item 2'],
        1: ['Item 3', 'Item 4'],
        2: ['Item 5', 'Item 6']
      }
    }

    function TodoList() {
      const { mutate } = useSWRConfig()
      const { data, size, setSize } = useSWRInfinite(
        pageIndex => `/api/todos-${key}?page=${pageIndex}`,
        async url => {
          const pageIndex = parseInt(url.split('page=')[1])
          return createResponse(dataStore.serverData[pageIndex] || [])
        },
        { initialSize: 1 }
      )

      const allItems = data ? data.flat() : []

      const handleAddItem = async () => {
        dataStore.serverData[0] = ['New Item', ...dataStore.serverData[0]]

        await mutate(
          k => typeof k === 'string' && k.includes(`todos-${key}`),
          undefined,
          { revalidate: true }
        )
      }

      return (
        <div>
          <div>Items: {allItems.join(', ')}</div>
          <button onClick={() => setSize(size + 1)}>Load More</button>
          <button onClick={handleAddItem}>Add Item</button>
        </div>
      )
    }

    renderWithConfig(<TodoList />)

    await screen.findByText('Items: Item 1, Item 2')

    fireEvent.click(screen.getByText('Load More'))
    await screen.findByText('Items: Item 1, Item 2, Item 3, Item 4')

    fireEvent.click(screen.getByText('Load More'))
    await screen.findByText(
      'Items: Item 1, Item 2, Item 3, Item 4, Item 5, Item 6'
    )

    fireEvent.click(screen.getByText('Add Item'))
    await act(() => sleep(50))

    const text = screen.getByText(/Items:/).textContent

    expect(text).not.toContain('New Item')
  })

  it('should solve the issue with includeSpecialKeys option', async () => {
    const key = createKey()
    const dataStore = {
      serverData: {
        0: ['Item 1', 'Item 2'],
        1: ['Item 3', 'Item 4'],
        2: ['Item 5', 'Item 6']
      }
    }

    function TodoList() {
      const { mutate } = useSWRConfig()
      const { data, size, setSize } = useSWRInfinite(
        pageIndex => `/api/todos-${key}?page=${pageIndex}`,
        async url => {
          const pageIndex = parseInt(url.split('page=')[1])
          return createResponse(dataStore.serverData[pageIndex] || [])
        },
        { initialSize: 1 }
      )

      const allItems = data ? data.flat() : []

      const handleAddItem = async () => {
        dataStore.serverData[0] = ['New Item', ...dataStore.serverData[0]]

        await mutate(
          (k: any) => typeof k === 'string' && k.includes(`todos-${key}`),
          undefined,
          { revalidate: true, includeSpecialKeys: true } as any
        )
      }

      return (
        <div>
          <div>Items: {allItems.join(', ')}</div>
          <button onClick={() => setSize(size + 1)}>Load More</button>
          <button onClick={handleAddItem}>Add Item (Fixed)</button>
        </div>
      )
    }

    renderWithConfig(<TodoList />)

    await screen.findByText('Items: Item 1, Item 2')

    fireEvent.click(screen.getByText('Load More'))
    await screen.findByText('Items: Item 1, Item 2, Item 3, Item 4')

    fireEvent.click(screen.getByText('Load More'))
    await screen.findByText(
      'Items: Item 1, Item 2, Item 3, Item 4, Item 5, Item 6'
    )

    fireEvent.click(screen.getByText('Add Item (Fixed)'))
    await act(() => sleep(50))

    await screen.findByText(
      'Items: New Item, Item 1, Item 2, Item 3, Item 4, Item 5, Item 6'
    )
  })

  it('should handle real-world scenario: delete item and refresh all pages', async () => {
    const key = createKey()
    const dataStore = {
      serverData: {
        0: ['Task 1', 'Task 2', 'Task 3'],
        1: ['Task 4', 'Task 5', 'Task 6'],
        2: ['Task 7', 'Task 8', 'Task 9']
      }
    }

    function TaskManager() {
      const { mutate } = useSWRConfig()
      const { data, size, setSize } = useSWRInfinite(
        pageIndex => `/api/tasks-${key}?page=${pageIndex}`,
        async url => {
          const pageIndex = parseInt(url.split('page=')[1])
          return createResponse(dataStore.serverData[pageIndex] || [])
        }
      )

      const allTasks = data ? data.flat() : []

      const handleDeleteTask = async (taskToDelete: string) => {
        Object.keys(dataStore.serverData).forEach(page => {
          dataStore.serverData[page] = dataStore.serverData[page].filter(
            task => task !== taskToDelete
          )
        })

        await mutate(
          (k: any) => typeof k === 'string' && k.includes(`tasks-${key}`),
          undefined,
          { revalidate: true, includeSpecialKeys: true } as any
        )
      }

      return (
        <div>
          <div>Total tasks: {allTasks.length}</div>
          <ul>
            {allTasks.map(task => (
              <li key={task}>
                {task}
                <button onClick={() => handleDeleteTask(task)}>Delete</button>
              </li>
            ))}
          </ul>
          <button onClick={() => setSize(size + 1)}>Load More</button>
        </div>
      )
    }

    renderWithConfig(<TaskManager />)

    await screen.findByText('Total tasks: 3')
    fireEvent.click(screen.getByText('Load More'))
    await screen.findByText('Total tasks: 6')
    fireEvent.click(screen.getByText('Load More'))
    await screen.findByText('Total tasks: 9')

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[4])

    await act(() => sleep(50))

    await screen.findByText('Total tasks: 8')
    // @ts-expect-error ignore jest error
    expect(screen.queryByText('Task 5')).not.toBeInTheDocument()
  })

  it('should handle mixed useSWR and useSWRInfinite with same base key', async () => {
    const key = createKey()
    let regularFetchCount = 0
    let infiniteFetchCount = 0

    function MixedComponent() {
      const { mutate } = useSWRConfig()

      const { data: singleData } = useSWR(
        `/api/mixed-${key}?page=0`,
        async () => {
          regularFetchCount++
          return createResponse(['Regular Item'])
        }
      )

      const { data: infiniteData } = useSWRInfinite(
        pageIndex => `/api/mixed-${key}?page=${pageIndex}`,
        async () => {
          infiniteFetchCount++
          return createResponse(['Infinite Item'])
        }
      )

      const handleMutateWithoutSpecial = () => {
        mutate(
          k => typeof k === 'string' && k.includes(`mixed-${key}`),
          undefined,
          { revalidate: true }
        )
      }

      const handleMutateWithSpecial = () => {
        mutate(
          k => typeof k === 'string' && k.includes(`mixed-${key}`),
          undefined,
          { revalidate: true, includeSpecialKeys: true } as any
        )
      }

      return (
        <div>
          <div>Regular: {singleData?.[0] || 'Loading'}</div>
          <div>Infinite: {infiniteData?.[0]?.[0] || 'Loading'}</div>
          <div>Regular fetches: {regularFetchCount}</div>
          <div>Infinite fetches: {infiniteFetchCount}</div>
          <button onClick={handleMutateWithoutSpecial}>
            Mutate Without Special
          </button>
          <button onClick={handleMutateWithSpecial}>Mutate With Special</button>
        </div>
      )
    }

    renderWithConfig(<MixedComponent />)

    await screen.findByText('Regular: Regular Item')
    await screen.findByText('Infinite: Infinite Item')

    const initialRegularCount = regularFetchCount
    const initialInfiniteCount = infiniteFetchCount

    fireEvent.click(screen.getByText('Mutate Without Special'))
    await act(() => sleep(50))

    expect(regularFetchCount).toBeGreaterThan(initialRegularCount)
    expect(infiniteFetchCount).toBe(initialInfiniteCount)

    const midRegularCount = regularFetchCount
    const midInfiniteCount = infiniteFetchCount

    fireEvent.click(screen.getByText('Mutate With Special'))
    await act(() => sleep(50))

    expect(regularFetchCount).toBeGreaterThan(midRegularCount)
    expect(infiniteFetchCount).toBeGreaterThan(midInfiniteCount)
  })

  it('should handle concurrent mutations with different includeSpecialKeys settings', async () => {
    const key = createKey()
    let callCount = 0

    function ConcurrentMutationTest() {
      const { mutate } = useSWRConfig()
      const { data } = useSWRInfinite(
        pageIndex => `/api/concurrent-${key}?page=${pageIndex}`,
        async () => {
          callCount++
          return createResponse([`Call ${callCount}`])
        }
      )

      const handleConcurrentMutations = async () => {
        await Promise.all([
          mutate(
            k => typeof k === 'string' && k.includes(`concurrent-${key}`),
            undefined,
            { revalidate: true }
          ),
          mutate(
            k => typeof k === 'string' && k.includes(`concurrent-${key}`),
            undefined,
            { revalidate: true, includeSpecialKeys: true } as any
          )
        ])
      }

      return (
        <div>
          <div>Data: {data?.[0]?.[0] || 'Loading'}</div>
          <button onClick={handleConcurrentMutations}>
            Trigger Concurrent
          </button>
        </div>
      )
    }

    renderWithConfig(<ConcurrentMutationTest />)

    await screen.findByText(/Data: Call/)
    const initialCount = callCount

    fireEvent.click(screen.getByText('Trigger Concurrent'))
    await act(() => sleep(100))

    expect(callCount).toBeGreaterThan(initialCount)
  })

  it('should not break when cache contains many keys', async () => {
    const key = createKey()

    function PerformanceTest() {
      const { mutate, cache } = useSWRConfig()

      for (let i = 0; i < 100; i++) {
        cache.set(`dummy-key-${i}`, { data: i })
      }

      const { data } = useSWRInfinite(
        pageIndex => `/api/perf-${key}?page=${pageIndex}`,
        async () => createResponse(['Performance Test'])
      )

      const handleMutateWithLargeCache = async () => {
        const startTime = Date.now()

        await mutate(
          k => typeof k === 'string' && k.includes(`perf-${key}`),
          undefined,
          { revalidate: true, includeSpecialKeys: true } as any
        )

        const duration = Date.now() - startTime
        return duration
      }

      return (
        <div>
          <div>Data: {data?.[0]?.[0] || 'Loading'}</div>
          <div>Cache size: {Array.from(cache.keys()).length}</div>
          <button
            onClick={async () => {
              const duration = await handleMutateWithLargeCache()
              expect(duration).toBeLessThan(1000)
            }}
          >
            Test Performance
          </button>
        </div>
      )
    }

    renderWithConfig(<PerformanceTest />)

    await screen.findByText('Data: Performance Test')
    fireEvent.click(screen.getByText('Test Performance'))
    await act(() => sleep(100))
  })

  it('should handle empty matcher results gracefully', async () => {
    const key = createKey()

    function EmptyMatcherTest() {
      const { mutate } = useSWRConfig()
      const { data } = useSWRInfinite(
        pageIndex => `/api/empty-${key}?page=${pageIndex}`,
        async () => createResponse(['Test Data'])
      )

      const handleEmptyMatcher = async () => {
        const result = await mutate(() => false, undefined, {
          revalidate: true,
          includeSpecialKeys: true
        } as any)

        expect(result).toEqual([])
      }

      return (
        <div>
          <div>Data: {data?.[0]?.[0] || 'Loading'}</div>
          <button onClick={handleEmptyMatcher}>Empty Matcher</button>
        </div>
      )
    }

    renderWithConfig(<EmptyMatcherTest />)

    await screen.findByText('Data: Test Data')
    fireEvent.click(screen.getByText('Empty Matcher'))
    await act(() => sleep(50))
  })

  it('should correctly filter $inf$ vs regular keys with precise matchers', async () => {
    const key = createKey()
    let infRevalidateCount = 0
    let regularRevalidateCount = 0

    function PreciseFilterTest() {
      const { mutate } = useSWRConfig()

      useSWR(`/api/filter-${key}?page=0`, async () => {
        regularRevalidateCount++
        return createResponse(['Regular'])
      })

      useSWRInfinite(
        pageIndex => `/api/filter-${key}?page=${pageIndex}`,
        async () => {
          infRevalidateCount++
          return createResponse(['Infinite'])
        }
      )

      const handleMutateOnlyInfinite = async () => {
        await mutate(
          k => typeof k === 'string' && k.startsWith('$inf$'),
          undefined,
          { revalidate: true, includeSpecialKeys: true } as any
        )
      }

      const handleMutateOnlyRegular = async () => {
        await mutate(
          k =>
            typeof k === 'string' &&
            !k.startsWith('$') &&
            k.includes(`filter-${key}`),
          undefined,
          { revalidate: true }
        )
      }

      return (
        <div>
          <div>Inf revalidates: {infRevalidateCount}</div>
          <div>Regular revalidates: {regularRevalidateCount}</div>
          <button onClick={handleMutateOnlyInfinite}>
            Mutate Only Infinite
          </button>
          <button onClick={handleMutateOnlyRegular}>Mutate Only Regular</button>
        </div>
      )
    }

    renderWithConfig(<PreciseFilterTest />)

    await act(() => sleep(50))

    const initialInf = infRevalidateCount
    const initialReg = regularRevalidateCount

    fireEvent.click(screen.getByText('Mutate Only Infinite'))
    await act(() => sleep(50))

    expect(infRevalidateCount).toBeGreaterThan(initialInf)
    expect(regularRevalidateCount).toBe(initialReg)

    fireEvent.click(screen.getByText('Mutate Only Regular'))
    await act(() => sleep(50))

    expect(regularRevalidateCount).toBeGreaterThan(initialReg)
  })
})
