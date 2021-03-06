import { render, screen, act, fireEvent } from '@testing-library/react'
import React, { useState } from 'react'
import useSWR from '../src'
import { sleep } from './utils'

describe('useSWR - immutable', () => {
  it('should revalidate on mount', async () => {
    let value = 0
    const useData = () =>
      useSWR('immutable-1', () => value++, {
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

    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"mount componentdata: "`
    )
    // ready
    await screen.findByText('data: 0')

    // mount <Component/> by clicking the button
    fireEvent.click(screen.getByText('mount component'))

    // wait for rerender
    await screen.findByText('data: 1')
  })

  it('should not revalidate on mount when `immutable` is enabled', async () => {
    let value = 0
    const useData = () =>
      useSWR('immutable-2', () => value++, {
        dedupingInterval: 0,
        immutable: true
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

    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"mount componentdata: "`
    )
    // ready
    await screen.findByText('data: 0')

    // mount <Component/> by clicking the button
    fireEvent.click(screen.getByText('mount component'))

    // wait for rerender
    await act(() => sleep(50))
    await screen.findByText('data: 0')
  })
})
