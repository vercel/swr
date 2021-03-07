import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import useSWR from '../src'
import { sleep } from './utils'

const waitForNextTick = () => act(() => sleep(1))
const focusWindow = () =>
  act(async () => {
    fireEvent.focus(window)
  })
const dispatchWindowEvent = event =>
  act(async () => {
    window.dispatchEvent(new Event(event))
  })

describe('useSWR - offline', () => {
  it('should not revalidate when offline', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('offline-1', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')

    // simulate offline
    await waitForNextTick()
    await dispatchWindowEvent('offline')

    // trigger focus revalidation
    await focusWindow()

    // should not be revalidated
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 0"`)
  })

  it('should revalidate immediately when becoming online', async () => {
    let value = 0

    function Page() {
      const { data } = useSWR('offline-2', () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }
    const { container } = render(<Page />)

    // hydration
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: "`)
    // mount
    await screen.findByText('data: 0')

    // simulate online
    await waitForNextTick()
    await dispatchWindowEvent('online')

    // should be revalidated
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"data: 1"`)
  })
})
