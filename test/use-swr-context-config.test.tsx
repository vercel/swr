import { act, render, screen, fireEvent } from '@testing-library/react'
import useSWR, {
  mutate,
  SWRConfig,
  type SWRConfiguration,
  useSWRConfig
} from 'swr'
import { createKey, createResponse, renderWithGlobalCache } from './utils'
import { useCallback, useEffect, useState } from 'react'

describe('useSWR - context configs', () => {
  it('mutate before mount should not block rerender', async () => {
    const prefetch = () => createResponse('prefetch-data')
    const fetcher = () => createResponse('data')
    const key = createKey()

    await act(async () => {
      await mutate(key, prefetch)
    })

    function Page() {
      const { data } = useSWR(key, fetcher)
      return <div>{data}</div>
    }

    renderWithGlobalCache(<Page />)
    // render with the prefetched data
    screen.getByText('prefetch-data')

    // render the fetched data
    await screen.findByText('data')
  })
})

describe('useSWRConfig hook maintains stable reference across re-renders', () => {
  it('should maintain the same swrConfig reference when counter updates', () => {
    const parentConfig: SWRConfiguration = {
      revalidateOnMount: true,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
    const counterButtonText = 'counter + 1'
    let useSWRConfigReferenceChangedTimes = 0
    function Page() {
      return (
        <SWRConfig value={parentConfig}>
          <ChildComponent />
        </SWRConfig>
      )
    }
    function ChildComponent() {
      const swrConfig = useSWRConfig()
      const [, setCounter] = useState(0)
      const counterAddOne = useCallback(
        () => setCounter(prev => prev + 1),
        [setCounter]
      )
      useEffect(() => {
        useSWRConfigReferenceChangedTimes += 1
      }, [swrConfig])
      return <button onClick={counterAddOne}>{counterButtonText}</button>
    }
    render(<Page />)
    fireEvent.click(screen.getByText(counterButtonText))
    fireEvent.click(screen.getByText(counterButtonText))
    fireEvent.click(screen.getByText(counterButtonText))
    expect(useSWRConfigReferenceChangedTimes).toBe(1)
  })
})
