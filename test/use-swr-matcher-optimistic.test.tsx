import { screen, fireEvent, act } from '@testing-library/react'
import useSWR, { useSWRConfig } from 'swr'
import { createKey, renderWithConfig, nextTick } from './utils'

describe('useSWR - matcher optimistic data', () => {
  it('should compute functional optimisticData per matched key', async () => {
    const baseKey = createKey()
    const key1 = baseKey + '-a'
    const key2 = baseKey + '-b'

    let resolveMutation: (v: number) => void
    const pending = new Promise<number>(r => {
      resolveMutation = r
    })

    function Page() {
      const { data: data1 } = useSWR<number>(key1, null)
      const { data: data2 } = useSWR<number>(key2, null)
      const { mutate } = useSWRConfig()
      return (
        <div>
          <button
            data-testid="seed"
            onClick={() => {
              mutate(key1, 1, false)
              mutate(key2, 2, false)
            }}
          />
          <button
            data-testid="opt"
            onClick={() => {
              mutate(
                k => typeof k === 'string' && k.startsWith(baseKey),
                () => pending,
                {
                  revalidate: false,
                  populateCache: false,
                  optimisticData: (current: number) => current + 100
                }
              )
            }}
          />
          <p>one:{data1}</p>
          <p>two:{data2}</p>
        </div>
      )
    }

    renderWithConfig(<Page />)
    await nextTick()

    fireEvent.click(screen.getByTestId('seed'))
    await screen.findByText('one:1')
    await screen.findByText('two:2')

    fireEvent.click(screen.getByTestId('opt'))
    await nextTick()

    await screen.findByText('one:101')
    await screen.findByText('two:102')

    await act(async () => {
      resolveMutation(999)
      await pending
    })
  })
})
