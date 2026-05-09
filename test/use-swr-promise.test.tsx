import { screen } from '@testing-library/react'
import useSWR, { SWRConfig } from 'swr'
import {
  createKey,
  createResponse,
  itShouldSkipForReactCanary,
  renderWithConfig,
  sleep
} from './utils'
import { Suspense, act } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

describe('useSWR - promise', () => {
  itShouldSkipForReactCanary(
    'should allow passing promises as fallback',
    async () => {
      const key = createKey()

      const firstRender = [false, undefined] as [boolean, string | undefined]
      function Page() {
        const { data } = useSWR(key, () => {
          return createResponse('new data', { delay: 100 })
        })
        if (!firstRender[0]) {
          firstRender[0] = true
          firstRender[1] = data
        }
        return <div>data:{data}</div>
      }

      const fetchData = createResponse('initial data', { delay: 100 })

      renderWithConfig(
        <SWRConfig
          value={{
            fallback: {
              [key]: fetchData
            }
          }}
        >
          <Page />
        </SWRConfig>
      )

      await screen.findByText('data:initial data')
      await act(() => sleep(100)) // wait 100ms until the request inside finishes
      await screen.findByText('data:new data')

      expect(firstRender[1]).toEqual('initial data')
    }
  )

  itShouldSkipForReactCanary(
    'should allow passing promises as fallbackData',
    async () => {
      const key = createKey()

      const fetchData = createResponse('initial data', { delay: 100 })
      const firstRender = [false, undefined] as [boolean, string | undefined]

      function Page() {
        const { data } = useSWR(
          key,
          () => {
            return createResponse('new data', { delay: 100 })
          },
          {
            fallbackData: fetchData
          }
        )
        if (!firstRender[0]) {
          firstRender[0] = true
          firstRender[1] = data
        }
        return <div>data:{data}</div>
      }

      renderWithConfig(<Page />)

      await screen.findByText('data:initial data')
      await act(() => sleep(100)) // wait 100ms until the request inside finishes
      await screen.findByText('data:new data')

      expect(firstRender[1]).toEqual('initial data')
    }
  )

  itShouldSkipForReactCanary(
    'should suspend when resolving the fallback promise',
    async () => {
      const key = createKey()

      const firstRender = [false, undefined] as [boolean, string | undefined]
      function Page() {
        const { data } = useSWR(key, () => {
          return createResponse('new data', { delay: 100 })
        })
        if (!firstRender[0]) {
          firstRender[0] = true
          firstRender[1] = data
        }
        return <div>data:{data}</div>
      }

      const fetchData = createResponse('initial data', { delay: 100 })

      renderWithConfig(
        <SWRConfig
          value={{
            fallback: {
              [key]: fetchData
            }
          }}
        >
          <Suspense fallback={<div>loading</div>}>
            <Page />
          </Suspense>
        </SWRConfig>
      )

      await screen.findByText('loading')
      await screen.findByText('data:initial data')
      await act(() => sleep(100)) // wait 100ms until the request inside finishes
      await screen.findByText('data:new data')

      expect(firstRender[1]).toEqual('initial data')
    }
  )

  itShouldSkipForReactCanary(
    'should handle errors with fallback promises',
    async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {})

      const key = createKey()

      function Page() {
        const { data } = useSWR(key)
        return <div>data:{data}</div>
      }

      const fetchDataError = createResponse(new Error('error'), {
        delay: 100
      })

      renderWithConfig(
        <ErrorBoundary fallback={<div>error boundary</div>}>
          <SWRConfig
            value={{
              fallback: {
                [key]: fetchDataError
              }
            }}
          >
            <Suspense fallback={<div>loading</div>}>
              <Page />
            </Suspense>
          </SWRConfig>
        </ErrorBoundary>
      )

      await screen.findByText('loading')
      await act(() => sleep(100)) // wait 100ms until the request inside throws
      await screen.findByText('error boundary')
    }
  )

  itShouldSkipForReactCanary(
    'should handle same fallback promise that is already pending',
    async () => {
      const key = createKey()

      function Comp() {
        const { data } = useSWR(key)
        return <>data:{data},</>
      }

      const fetchDataError = createResponse('value', {
        delay: 100
      })

      renderWithConfig(
        <SWRConfig
          value={{
            fallback: {
              [key]: fetchDataError
            }
          }}
        >
          <Suspense fallback={<div>loading</div>}>
            <Comp />
            <Comp />
          </Suspense>
        </SWRConfig>
      )

      await screen.findByText('loading')
      await act(() => sleep(100)) // wait 100ms until the request inside resolves
      await screen.findByText('data:value,data:value,')
    }
  )
})
