import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import useSWR, { SWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'
import { createKey } from './utils'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(complete => {
    resolve = complete
  })
  return { promise, resolve }
}

describe('cache provider effect replay', () => {
  it.each([false, true])(
    'should discard reads overlapping a completed mutation (StrictMode: %s)',
    async strict => {
      const key = createKey()
      const initial = deferred<string>()
      const older = deferred<string>()
      const write = deferred<string>()
      let reads = 0
      let refresh: Promise<unknown> | undefined
      let mutation: Promise<unknown> | undefined

      function Page() {
        const { data, mutate } = useSWR(key, () =>
          ++reads === 1 ? initial.promise : older.promise
        )
        const { trigger } = useSWRMutation(key, () => write.promise, {
          populateCache: true,
          revalidate: false
        })
        return (
          <>
            <output aria-label="cached value">{data ?? 'loading'}</output>
            <button
              onClick={() => {
                refresh = mutate()
              }}
            >
              refresh
            </button>
            <button
              onClick={() => {
                mutation = trigger()
              }}
            >
              write
            </button>
          </>
        )
      }

      const Wrapper = strict ? React.StrictMode : React.Fragment
      render(
        <Wrapper>
          <SWRConfig value={{ provider: () => new Map() }}>
            <Page />
          </SWRConfig>
        </Wrapper>
      )
      const value = screen.getByRole('status', { name: 'cached value' })
      await act(async () => {
        initial.resolve('enabled')
      })
      expect(value).toHaveTextContent('enabled')
      fireEvent.click(screen.getByText('refresh'))
      fireEvent.click(screen.getByText('write'))
      await act(async () => {
        write.resolve('disabled')
        await mutation
      })
      expect(value).toHaveTextContent('disabled')
      await act(async () => {
        older.resolve('enabled')
        await refresh
      })
      expect(value).toHaveTextContent('disabled')
    }
  )

  it.each([false, true])(
    'should deduplicate a reader mounted after effect replay (StrictMode: %s)',
    async strict => {
      const key = createKey()
      const response = deferred<string>()
      const fetcher = jest.fn(() => response.promise)

      function Reader() {
        const { data } = useSWR(key, fetcher)
        return <output>{data ?? 'loading'}</output>
      }
      function Page() {
        const [second, setSecond] = React.useState(false)
        return (
          <>
            <Reader />
            {second && <Reader />}
            <button onClick={() => setSecond(true)}>add reader</button>
          </>
        )
      }
      const Wrapper = strict ? React.StrictMode : React.Fragment
      render(
        <Wrapper>
          <SWRConfig value={{ provider: () => new Map() }}>
            <Page />
          </SWRConfig>
        </Wrapper>
      )
      fireEvent.click(screen.getByText('add reader'))
      await act(async () => {
        response.resolve('shared')
      })
      expect(
        screen.getAllByRole('status').map(value => value.textContent)
      ).toEqual(['shared', 'shared'])
      expect(fetcher).toHaveBeenCalledTimes(1)
    }
  )
})
