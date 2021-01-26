import React from 'react'
import { render } from '@testing-library/react'
import { sleep } from './utils'
import { useSWRSubscription } from '../src'

describe('useSWRSubscription', () => {
  it('should update state when fetcher is an observable', async () => {
    const key = 'observable-0'
    let intervalId
    let res = 0
    function subscribe(onNext, onError) {
      intervalId = setInterval(() => {
        if (res === 3) {
          onError('error')
        } else {
          onNext(res)
        }
        res++
      }, 100)

      return () => {}
    }

    function Page() {
      const { data, error } = useSWRSubscription(key, subscribe)

      return <div>{error ? error : data}</div>
    }

    const { container } = render(<Page />)
    await sleep(10)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`""`)
    await sleep(100)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"0"`)
    await sleep(100)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"1"`)
    await sleep(100)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"2"`)
    await sleep(100)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"error"`)
    clearInterval(intervalId)
    await sleep(100)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"error"`)
  })
})
