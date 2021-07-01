// This file includes some basic test cases for React Concurrent Mode.
// Due to the nature of global cache, the current SWR implementation will not
// be perfectly consistent in Concurrent rendering in every intermediate state.
// Only eventual consistency is guaranteed.

import { screen, fireEvent } from '@testing-library/react'
import { createResponse, sleep } from './utils'

describe('useSWR - concurrent rendering', () => {
  let React, ReactDOM, act, useSWR

  beforeEach(() => {
    jest.resetModules()
    jest.mock('scheduler', () => require('scheduler/unstable_mock'))
    jest.mock('react', () => require('react-experimental'))
    jest.mock('react-dom', () => require('react-dom-experimental'))
    jest.mock('react-dom/test-utils', () =>
      require('react-dom-experimental/test-utils')
    )
    React = require('react')
    ReactDOM = require('react-dom')
    act = require('react-dom/test-utils').act
    useSWR = require('../src').default
  })

  it('should fetch data in concurrent rendering', async () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const reactRoot = ReactDOM.createRoot(root)

    function Page() {
      const { data } = useSWR(
        'concurrent-1',
        () => createResponse('0', { delay: 50 }),
        {
          dedupingInterval: 0
        }
      )
      return <div>data:{data}</div>
    }

    act(() => reactRoot.render(<Page />))

    screen.getByText('data:')
    await act(() => sleep(100))
    screen.getByText('data:0')

    act(() => reactRoot.unmount())
  })

  it('should pause when changing the key inside a transition', async () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const reactRoot = ReactDOM.createRoot(root)

    const fetcher = (k: string) => createResponse(k, { delay: 100 })
    // eslint-disable-next-line react/prop-types
    function Component({ swrKey }) {
      const { data } = useSWR(swrKey, fetcher, {
        dedupingInterval: 0,
        suspense: true
      })

      return <>data:{data}</>
    }
    function Page() {
      const [isPending, startTransition] = React.useTransition()
      const [key, setKey] = React.useState('concurrent-2')

      return (
        <div onClick={() => startTransition(() => setKey('new-key'))}>
          isPending:{isPending ? 1 : 0},
          <React.Suspense fallback="loading">
            <Component swrKey={key} />
          </React.Suspense>
        </div>
      )
    }

    act(() => reactRoot.render(<Page />))

    screen.getByText('isPending:0,loading')
    await act(() => sleep(120))
    screen.getByText('isPending:0,data:concurrent-2')
    fireEvent.click(screen.getByText('isPending:0,data:concurrent-2'))
    await act(() => sleep(10))

    // Pending state
    screen.getByText('isPending:1,data:concurrent-2')

    // Transition end
    await act(() => sleep(120))
    screen.getByText('isPending:0,data:new-key')

    act(() => reactRoot.unmount())
  })
})
