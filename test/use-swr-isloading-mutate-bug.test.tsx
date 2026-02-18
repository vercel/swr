import { screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { createKey, sleep, renderWithConfig } from './utils'

describe('useSWR - isLoading with mutate revalidate:false', () => {
  it('should not get stuck on isLoading when mutate with revalidate:false on hook with no fetcher', async () => {
    const key = createKey()
    let boundMutate

    function Page() {
      // Hook with no fetcher - this will initially have isLoading: false
      const { data, isLoading, isValidating } = useSWR(key, null)
      const { mutate } = useSWRConfig()
      boundMutate = mutate

      return (
        <div>
          <div>data: {data || 'undefined'}</div>
          <div>isLoading: {isLoading ? 'true' : 'false'}</div>
          <div>isValidating: {isValidating ? 'true' : 'false'}</div>
          <button
            onClick={() => boundMutate(key, 'new-data', { revalidate: false })}
          >
            mutate
          </button>
        </div>
      )
    }

    renderWithConfig(<Page />)

    // Initially no data, isLoading should be false (no fetcher)
    await screen.findByText('data: undefined')
    screen.getByText('isLoading: false')
    screen.getByText('isValidating: false')

    // Click mutate button
    fireEvent.click(screen.getByText('mutate'))
    await act(() => sleep(50))

    // After mutation, data should be updated and isLoading should be false
    await screen.findByText('data: new-data')
    screen.getByText('isLoading: false')
    screen.getByText('isValidating: false')
  })

  it('should not get stuck on isLoading when cache is updated before component mounts', async () => {
    const key = createKey()
    let boundMutate

    function Page() {
      const { data, isLoading, isValidating, mutate } = useSWR(key, null)

      return (
        <div>
          <div>data: {data || 'undefined'}</div>
          <div>isLoading: {isLoading ? 'true' : 'false'}</div>
          <div>isValidating: {isValidating ? 'true' : 'false'}</div>
          <button onClick={() => mutate('updated-data', { revalidate: false })}>
            mutate
          </button>
        </div>
      )
    }

    function Wrapper() {
      const { mutate } = useSWRConfig()
      boundMutate = mutate
      const [show, setShow] = React.useState(false)

      return (
        <div>
          <button
            onClick={() => {
              boundMutate(key, 'initial-data', { revalidate: false })
              setShow(true)
            }}
          >
            show
          </button>
          {show && <Page />}
        </div>
      )
    }

    renderWithConfig(<Wrapper />)

    // Click show button - this will update cache and then mount the component
    fireEvent.click(screen.getByText('show'))
    await act(() => sleep(50))

    // Component should mount with data and isLoading should be false
    await screen.findByText('data: initial-data')
    screen.getByText('isLoading: false')
    screen.getByText('isValidating: false')

    // Now mutate again
    fireEvent.click(screen.getByText('mutate'))
    await act(() => sleep(50))

    // After mutation, isLoading should still be false
    await screen.findByText('data: updated-data')
    screen.getByText('isLoading: false')
    screen.getByText('isValidating: false')
  })

  it('should not get stuck on isLoading when updating cache with revalidate:false after initial load', async () => {
    const key = createKey()
    let fetchCount = 0
    let boundMutate

    function Page() {
      const { data, isLoading, isValidating } = useSWR(
        key,
        async () => {
          await sleep(10)
          return `data-${++fetchCount}`
        },
        { revalidateOnMount: true }
      )
      const { mutate } = useSWRConfig()
      boundMutate = mutate

      return (
        <div>
          <div>data: {data || 'undefined'}</div>
          <div>isLoading: {isLoading ? 'true' : 'false'}</div>
          <div>isValidating: {isValidating ? 'true' : 'false'}</div>
          <button
            onClick={() =>
              boundMutate(key, 'mutated-data', { revalidate: false })
            }
          >
            mutate
          </button>
        </div>
      )
    }

    renderWithConfig(<Page />)

    // Initially loading
    screen.getByText('isLoading: true')
    screen.getByText('isValidating: true')

    // Wait for initial data
    await screen.findByText('data: data-1')
    screen.getByText('isLoading: false')
    screen.getByText('isValidating: false')

    // Click mutate button with revalidate: false
    fireEvent.click(screen.getByText('mutate'))
    await act(() => sleep(50))

    // After mutation, data should be updated and isLoading should be false
    await screen.findByText('data: mutated-data')
    screen.getByText('isLoading: false')
    screen.getByText('isValidating: false')

    // fetchCount should still be 1 (no revalidation)
    expect(fetchCount).toBe(1)
  })
})
