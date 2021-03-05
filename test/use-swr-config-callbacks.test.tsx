import { act, render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import useSWR from '../src'
import { sleep, createResponse } from './utils'

describe('useSWR - config callbacks', () => {
  it('should trigger the onSuccess event with the latest version of the onSuccess callback', async () => {
    let state = null
    let count = 0

    function Page(props: { text: string }) {
      const { data, revalidate } = useSWR(
        'config callbacks - onSuccess',
        () => createResponse(count++),
        { onSuccess: () => (state = props.text) }
      )
      return (
        <div onClick={revalidate}>
          hello, {data}, {props.text}
        </div>
      )
    }
    const { rerender } = render(<Page text={'a'} />)
    // the onSuccess callback does not trigger yet, the state still null.
    screen.getByText('hello, , a')
    expect(state).toEqual(null)

    await screen.findByText('hello, 0, a')

    expect(state).toEqual('a')

    // props changed, but the onSuccess callback does not trigger yet, `state` is same as before
    rerender(<Page text={'b'} />)
    screen.getByText('hello, 0, b')
    expect(state).toEqual('a')

    // trigger revalidation, this would re-trigger the onSuccess callback
    fireEvent.click(screen.getByText(/hello/))
    await screen.findByText('hello, 1, b')
    // the onSuccess callback should capture the latest `props.text`
    expect(state).toEqual('b')
  })

  it('should trigger the onError event with the latest version of the onError callback', async () => {
    let state = null
    let count = 0

    function Page(props: { text: string }) {
      const { data, revalidate, error } = useSWR(
        'config callbacks - onError',
        () => createResponse(new Error(`Error: ${count++}`)),
        { onError: () => (state = props.text) }
      )
      if (error)
        return (
          <div title={props.text} onClick={revalidate}>
            {error.message}
          </div>
        )
      return (
        <div onClick={revalidate}>
          hello, {data}, {props.text}
        </div>
      )
    }

    const { rerender } = render(<Page text="a" />)

    screen.getByText('hello, , a')
    expect(state).toEqual(null)
    await screen.findByText('Error: 0')

    expect(state).toEqual('a')

    // props changed, but the onError callback doese not trigger yet.
    rerender(<Page text="b" />)
    screen.getByText('Error: 0')
    screen.getByTitle('b')
    expect(state).toEqual('a')

    fireEvent.click(screen.getByTitle('b'))
    await screen.findByText('Error: 1')
    screen.getByTitle('b')
    expect(state).toEqual('b')
  })

  it('should trigger the onErrorRetry event with the latest version of the onErrorRetry callback', async () => {
    let state = null
    let count = 0

    function Page(props: { text: string }) {
      const { data, error } = useSWR(
        'config callbacks - onErrorRetry',
        () => createResponse(new Error(`Error: ${count++}`)),
        {
          onErrorRetry: (_, __, ___, revalidate, revalidateOpts) => {
            state = props.text
            revalidate(revalidateOpts)
          }
        }
      )
      if (error) return <div title={props.text}>{error.message}</div>
      return (
        <div>
          hello, {data}, {props.text}
        </div>
      )
    }

    const { rerender } = render(<Page text="a" />)
    screen.getByText('hello, , a')
    expect(state).toEqual(null)

    await screen.findByText('Error: 0')
    screen.getByTitle('a')
    expect(state).toEqual('a')

    // since the onErrorRetry schedule a timer to trigger revalidation, update props.text now
    rerender(<Page text="b" />)
    // not revalidate yet.
    screen.getByText('Error: 0')
    screen.getByTitle('b')
    expect(state).toEqual('a')

    // revalidate
    await screen.findByText('Error: 1')
    screen.getByTitle('b')
    expect(state).toEqual('b')
  })

  it('should trigger the onLoadingSlow and onSuccess event with the lastest version of the callbacks', async () => {
    const LOADING_TIMEOUT = 5
    let state = null
    let count = 0

    function Page(props: { text: string }) {
      const { data } = useSWR(
        'config callbacks - onLoadingSlow',
        () => createResponse(count++, { delay: LOADING_TIMEOUT * 2 }),
        {
          onLoadingSlow: () => {
            state = props.text
          },
          onSuccess: () => {
            state = props.text
          },
          loadingTimeout: LOADING_TIMEOUT
        }
      )
      return (
        <div>
          hello, {data}, {props.text}
        </div>
      )
    }

    const { rerender } = render(<Page text="a" />)

    screen.getByText('hello, , a')
    expect(state).toEqual(null)

    // should trigger a loading slow event
    await act(() => sleep(LOADING_TIMEOUT))
    screen.getByText('hello, , a')
    expect(state).toEqual('a')

    // onSuccess callback should be called with the latest prop value
    rerender(<Page text="b" />)
    await screen.findByText('hello, 0, b')
    expect(state).toEqual('b')
  })
})
