import { screen, fireEvent } from '@testing-library/react'
import { useState, act, Profiler } from 'react'
import useSWR from 'swr'
import useSWRImmutable, { immutable } from 'swr/immutable'
import {
  sleep,
  createKey,
  nextTick as waitForNextTick,
  focusOn,
  renderWithConfig,
  createResponse
} from './utils'

const focusWindow = () => focusOn(window)

describe('useSWR - immutable', () => {
  it('should revalidate on mount', async () => {
    let value = 0
    const key = createKey()
    const useData = () =>
      useSWR(key, () => value++, {
        dedupingInterval: 0
      })

    function Component() {
      useData()
      return null
    }

    function Page() {
      const [showComponent, setShowComponent] = useState(false)
      const { data } = useData()
      return (
        <div>
          <button onClick={() => setShowComponent(true)}>
            mount component
          </button>
          <p>data: {data}</p>
          {showComponent ? <Component /> : null}
        </div>
      )
    }

    renderWithConfig(<Page />)

    // hydration
    screen.getByText('mount component')
    screen.getByText('data:')

    // ready
    await screen.findByText('data: 0')

    // mount <Component/> by clicking the button
    fireEvent.click(screen.getByText('mount component'))

    // wait for rerender
    await screen.findByText('data: 1')
  })

  it('should not revalidate on mount when `revalidateIfStale` is enabled', async () => {
    let value = 0
    const key = createKey()
    const useData = () =>
      useSWR(key, () => value++, {
        dedupingInterval: 0,
        revalidateIfStale: false
      })

    function Component() {
      useData()
      return null
    }
    function Page() {
      const [showComponent, setShowComponent] = useState(false)
      const { data } = useData()
      return (
        <div>
          <button onClick={() => setShowComponent(true)}>
            mount component
          </button>
          <p>data: {data}</p>
          {showComponent ? <Component /> : null}
        </div>
      )
    }

    renderWithConfig(<Page />)

    // hydration
    screen.getByText('mount component')
    screen.getByText('data:')

    // ready
    await screen.findByText('data: 0')

    // mount <Component/> by clicking the button
    fireEvent.click(screen.getByText('mount component'))

    // wait for rerender
    await act(() => sleep(50))
    await screen.findByText('data: 0')
  })

  it('should not revalidate with the immutable hook', async () => {
    let value = 0
    const key = createKey()
    const useData = () =>
      useSWRImmutable(key, () => value++, { dedupingInterval: 0 })

    function Component() {
      useData()
      return null
    }
    function Page() {
      const [showComponent, setShowComponent] = useState(false)
      const { data } = useData()
      return (
        <div>
          <button onClick={() => setShowComponent(true)}>
            mount component
          </button>
          <p>data: {data}</p>
          {showComponent ? <Component /> : null}
        </div>
      )
    }

    renderWithConfig(<Page />)

    // hydration
    screen.getByText('mount component')
    screen.getByText('data:')

    // ready
    await screen.findByText('data: 0')

    // mount <Component/> by clicking the button
    fireEvent.click(screen.getByText('mount component'))

    // trigger window focus
    await waitForNextTick()
    await focusWindow()

    // wait for rerender
    await act(() => sleep(50))
    await screen.findByText('data: 0')
  })

  it('should not revalidate with the immutable middleware', async () => {
    let value = 0
    const key = createKey()
    const useData = () =>
      useSWR(key, () => value++, {
        dedupingInterval: 0,
        use: [immutable]
      })

    function Component() {
      useData()
      return null
    }
    function Page() {
      const [showComponent, setShowComponent] = useState(false)
      const { data } = useData()
      return (
        <div>
          <button onClick={() => setShowComponent(true)}>
            mount component
          </button>
          <p>data: {data}</p>
          {showComponent ? <Component /> : null}
        </div>
      )
    }

    renderWithConfig(<Page />)

    // hydration
    screen.getByText('mount component')
    screen.getByText('data:')

    // ready
    await screen.findByText('data: 0')

    // mount <Component/> by clicking the button
    fireEvent.click(screen.getByText('mount component'))

    // trigger window focus
    await waitForNextTick()
    await focusWindow()

    // wait for rerender
    await act(() => sleep(50))
    await screen.findByText('data: 0')
  })

  it('should not revalidate with revalidateIfStale disabled when key changes', async () => {
    const fetcher = jest.fn(v => v)

    const key = createKey()
    const useData = (id: string) =>
      useSWR(key + id, fetcher, {
        dedupingInterval: 0,
        revalidateIfStale: false
      })

    function Page() {
      const [id, setId] = useState('0')
      const { data } = useData(id)
      return (
        <button onClick={() => setId(id === '0' ? '1' : '0')}>
          data: {data}
        </button>
      )
    }

    renderWithConfig(<Page />)

    // Ready
    await screen.findByText(`data: ${key}0`)

    // Toggle the key by clicking the button
    fireEvent.click(screen.getByText(`data: ${key}0`))
    await screen.findByText(`data: ${key}1`)

    await waitForNextTick()

    // Toggle the key again by clicking the button
    fireEvent.click(screen.getByText(`data: ${key}1`))
    await screen.findByText(`data: ${key}0`)

    await waitForNextTick()

    // Toggle the key by clicking the button
    fireEvent.click(screen.getByText(`data: ${key}0`))
    await screen.findByText(`data: ${key}1`)

    await sleep(20)

    // `fetcher` should only be called twice, with each key.
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(fetcher).toHaveBeenNthCalledWith(1, key + '0')
    expect(fetcher).toHaveBeenNthCalledWith(2, key + '1')
  })

  it('isLoading and isValidating should be true when switch to new key', async () => {
    const key = createKey()
    const onRender = jest.fn()
    const useData = (id: string) =>
      useSWRImmutable(
        key + id,
        () =>
          createResponse(id, {
            delay: 100
          }),
        {
          dedupingInterval: 0
        }
      )

    function Data() {
      const [id, setId] = useState('0')
      const { data, isLoading, isValidating } = useData(id)
      return (
        <div>
          <button onClick={() => setId(id === '0' ? '1' : '0')}>
            switch id
          </button>
          <p>
            data: {data}, isLoading: {isLoading ? 'true' : 'false'},
            isValidating: {isValidating ? 'true' : 'false'}
          </p>
        </div>
      )
    }

    function Page() {
      return (
        <Profiler
          onRender={(id, phase) => {
            onRender(id, phase)
          }}
          id={key}
        >
          <Data />
        </Profiler>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText(`data: , isLoading: true, isValidating: true`)
    expect(onRender).toHaveBeenCalledWith(key, 'mount')
    await screen.findByText(`data: 0, isLoading: false, isValidating: false`)
    expect(onRender).toHaveBeenCalledWith(key, 'update')
    fireEvent.click(screen.getByText('switch id'))
    expect(onRender).toHaveBeenCalledWith(key, 'update')
    await screen.findByText(`data: , isLoading: true, isValidating: true`)
    expect(onRender).toHaveBeenCalledWith(key, 'update')
    await screen.findByText(`data: 1, isLoading: false, isValidating: false`)
    expect(onRender).toHaveBeenCalledWith(key, 'update')
    expect(onRender).toHaveBeenCalledTimes(4)
  })
})
