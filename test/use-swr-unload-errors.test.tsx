import { act, screen } from '@testing-library/react'
import useSWR, { useSWRConfig } from 'swr'
import type { Unloader } from 'swr'
import { createKey, renderWithConfig } from './utils'

describe('useSWR - unload pending errors', () => {
  it.each([false, true])(
    'discards a rejection from before unload (revalidate: %s)',
    async revalidate => {
      const key = createKey()
      const provider = new Map()
      let unload!: Unloader
      let reject!: (error: Error) => void
      const pending = new Promise<string>((_, rejectPromise) => {
        reject = rejectPromise
      })
      const onError = jest.fn()
      const onErrorRetry = jest.fn()
      const fetcher = jest
        .fn()
        .mockImplementationOnce(() => pending)
        .mockResolvedValue('fresh')

      function Page() {
        unload = useSWRConfig().unload
        const { data, error, isValidating } = useSWR(key, fetcher, {
          dedupingInterval: 0,
          onError,
          onErrorRetry
        })
        return (
          <div>
            data:{data};error:{error?.message};validating:{String(isValidating)}
          </div>
        )
      }

      renderWithConfig(<Page />, { provider: () => provider })
      expect(fetcher).toHaveBeenCalledTimes(1)
      await act(async () => unload({ revalidate }))
      if (revalidate) {
        await screen.findByText('data:fresh;error:;validating:false')
      }
      await act(async () => reject(new Error('obsolete')))
      expect(onError).not.toHaveBeenCalled()
      expect(onErrorRetry).not.toHaveBeenCalled()
      if (revalidate) {
        screen.getByText('data:fresh;error:;validating:false')
        expect(provider.get(key).error).toBeUndefined()
      } else {
        expect(screen.getByText(/data:;error:;validating:/)).toBeDefined()
        expect(provider.has(key)).toBe(false)
      }
      expect(fetcher).toHaveBeenCalledTimes(revalidate ? 2 : 1)
    }
  )

  it('keeps a post-unload request validating when the old request rejects', async () => {
    const key = createKey()
    const provider = new Map()
    let unload!: Unloader
    let rejectOlder!: (error: Error) => void
    let rejectCurrent!: (error: Error) => void
    const older = new Promise<string>((_, reject) => {
      rejectOlder = reject
    })
    const current = new Promise<string>((_, reject) => {
      rejectCurrent = reject
    })
    const fetcher = jest
      .fn()
      .mockImplementationOnce(() => older)
      .mockImplementationOnce(() => current)
    const onError = jest.fn()
    const onErrorRetry = jest.fn()
    const currentError = new Error('current after unload')

    function Page() {
      unload = useSWRConfig().unload
      const { data, error, isLoading, isValidating } = useSWR(key, fetcher, {
        dedupingInterval: 0,
        onError,
        onErrorRetry
      })
      return (
        <div>
          data:{data};error:{error?.message};loading:{String(isLoading)}
          ;validating:{String(isValidating)}
        </div>
      )
    }

    renderWithConfig(<Page />, { provider: () => provider })
    act(() => {
      unload()
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
    await act(async () => rejectOlder(new Error('obsolete')))
    screen.getByText('data:;error:;loading:true;validating:true')
    expect(provider.get(key).error).toBeUndefined()
    expect(onError).not.toHaveBeenCalled()
    expect(onErrorRetry).not.toHaveBeenCalled()

    await act(async () => rejectCurrent(currentError))
    screen.getByText(
      'data:;error:current after unload;loading:false;validating:false'
    )
    expect(provider.get(key).error).toBe(currentError)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBe(currentError)
    expect(onErrorRetry).toHaveBeenCalledTimes(1)
    expect(onErrorRetry.mock.calls[0][0]).toBe(currentError)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('still reports rejections without unload', async () => {
    const onError = jest.fn()
    const key = createKey()
    function StablePage() {
      const { error } = useSWR(
        key,
        () => Promise.reject(new Error('current')),
        {
          shouldRetryOnError: false,
          onError
        }
      )
      return <div>{error?.message}</div>
    }
    renderWithConfig(<StablePage />)
    await screen.findByText('current')
    expect(onError).toHaveBeenCalledTimes(1)
  })
})
