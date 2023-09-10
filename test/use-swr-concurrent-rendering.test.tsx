import { screen, fireEvent, act } from '@testing-library/react'
import { createKey, createResponse, sleep, renderWithConfig } from './utils'
import React from 'react'

import useSWR from 'swr'

describe('useSWR - concurrent rendering', () => {
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
