import { screen, act } from '@testing-library/react'
import {
  createKey,
  createResponse,
  sleep,
  executeWithoutBatching,
  renderWithConfig
} from './utils'
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

  // https://codesandbox.io/s/concurrent-swr-case-ii-lr6x4u
  it.skip('should do state updates in transitions', async () => {
    const key1 = createKey()
    const key2 = createKey()

    const log = []

    function Counter() {
      const [count, setCount] = React.useState(0)

      React.useEffect(() => {
        const interval = setInterval(() => {
          setCount(x => x + 1)
        }, 20)
        return () => clearInterval(interval)
      }, [])

      log.push(count)

      return <>{count}</>
    }

    function Body() {
      useSWR(key2, () => createResponse(true, { delay: 1000 }), {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 0,
        suspense: true
      })
      return null
    }

    function Page() {
      const { data } = useSWR(key1, () => createResponse(true, { delay: 50 }), {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 0
      })

      return (
        <>
          <Counter />
          {data ? <Body /> : null}
        </>
      )
    }

    await executeWithoutBatching(async () => {
      renderWithConfig(<Page />)
      await sleep(500)
    })
  })
})
