// This file includes some basic test cases for React Concurrent Mode.
// Due to the nature of global cache, the current SWR implementation will not
// be perfectly consistent in Concurrent rendering in every intermediate state.
// Only eventual consistency is guaranteed.

import { screen, fireEvent } from '@testing-library/react'
import { createKey, createResponse, sleep } from './utils'
let React // swc transformer requires to define React at the top

describe('useSWR - concurrent rendering', () => {
  let ReactDOM, act, useSWR, reactRoot, renderWithConfig
  beforeAll(() => {
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
    useSWR = require('swr').default
    const SWRConfig = require('swr').SWRConfig

    const root = document.createElement('div')
    document.body.appendChild(root)
    reactRoot = ReactDOM.createRoot(root)

    renderWithConfig = (element, config) =>
      act(() =>
        reactRoot.render(
          <SWRConfig value={{ provider: () => new Map(), ...config }}>
            {element}
          </SWRConfig>
        )
      )
  })
  afterEach(() => {
    act(() => reactRoot.unmount())
  })

  it('should fetch data in concurrent rendering', async () => {
    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => createResponse('0', { delay: 50 }), {
        dedupingInterval: 0
      })
      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)

    screen.getByText('data:')
    await act(() => sleep(100))
    screen.getByText('data:0')
  })

  it('should pause when changing the key inside a transition', async () => {
    const initialKey = createKey()
    const newKey = createKey()
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
      const [key, setKey] = React.useState(initialKey)

      return (
        <div onClick={() => startTransition(() => setKey(newKey))}>
          isPending:{isPending ? 1 : 0},
          <React.Suspense fallback="loading">
            <Component swrKey={key} />
          </React.Suspense>
        </div>
      )
    }

    renderWithConfig(<Page />)

    screen.getByText('isPending:0,loading')
    await act(() => sleep(120))
    screen.getByText(`isPending:0,data:${initialKey}`)
    fireEvent.click(screen.getByText(`isPending:0,data:${initialKey}`))
    await act(() => sleep(10))

    // Pending state
    screen.getByText(`isPending:1,data:${initialKey}`)

    // Transition end
    await act(() => sleep(120))
    screen.getByText(`isPending:0,data:${newKey}`)
  })
})
