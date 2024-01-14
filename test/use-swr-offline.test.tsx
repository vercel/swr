import { screen } from '@testing-library/react'
import useSWR from 'swr'
import {
  nextTick as waitForNextTick,
  toggleVisibility,
  createKey,
  renderWithConfig,
  dispatchWindowEvent
} from './utils'

describe('useSWR - offline', () => {
  it('should not revalidate when offline', async () => {
    let value = 0

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')
    // mount
    await screen.findByText('data: 0')

    // simulate offline
    await waitForNextTick()
    await dispatchWindowEvent('offline')

    // trigger focus revalidation
    toggleVisibility()

    // should not be revalidated
    screen.getByText('data: 0')
  })

  it('should revalidate immediately when becoming online', async () => {
    let value = 0

    const key = createKey()
    function Page() {
      const { data } = useSWR(key, () => value++, {
        dedupingInterval: 0
      })
      return <div>data: {data}</div>
    }

    renderWithConfig(<Page />)
    // hydration
    screen.getByText('data:')
    // mount
    await screen.findByText('data: 0')

    // simulate online
    await waitForNextTick()
    await dispatchWindowEvent('online')

    // should be revalidated
    await screen.findByText('data: 1')
  })
})
