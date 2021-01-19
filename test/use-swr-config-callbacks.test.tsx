import { act, render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import useSWR from '../src'
import { sleep } from './utils'

describe('useSWR - config callbacks', () => {
  it('should trigger the onSuccess event with the latest version of the onSuccess callback', async () => {
    let state = null
    let count = 0

    function Page(props: { text: string }) {
      const { data, revalidate } = useSWR(
        'config callbacks - onSuccess',
        () => new Promise(res => setTimeout(() => res(count++), 200)),
        { onSuccess: () => (state = props.text) }
      )
      return (
        <div onClick={revalidate}>
          hello, {data}, {props.text}
        </div>
      )
    }
    const { container, rerender } = render(<Page text={'a'} />)
    // the onSuccess callback does not trigger yet, the state still null.
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, , a"`
    )
    expect(state).toEqual(null)

    await screen.findByText('hello, 0, a')

    expect(state).toEqual('a')

    // props changed, but the onSuccess callback does not trigger yet, `state` is same as before
    rerender(<Page text={'b'} />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, 0, b"`
    )
    expect(state).toEqual('a')

    // trigger revalidation, this would re-trigger the onSuccess callback
    fireEvent.click(container.firstElementChild)

    await act(() => sleep(201))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, 1, b"`
    )
    // the onSuccess callback should capture the latest `props.text`
    expect(state).toEqual('b')
  })

  it('should trigger the onError event with the latest version of the onError callback', async () => {
    let state = null
    let count = 0

    function Page(props: { text: string }) {
      const { data, revalidate, error } = useSWR(
        'config callbacks - onError',
        () =>
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error(`Error: ${count++}`)), 200)
          ),
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

    const { container, rerender } = render(<Page text="a" />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, , a"`
    )
    expect(state).toEqual(null)
    await screen.findByText('Error: 0')

    expect(state).toEqual('a')

    // props changed, but the onError callback doese not trigger yet.
    rerender(<Page text="b" />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"Error: 0"`)
    expect(container.firstElementChild.getAttribute('title')).toEqual('b')
    expect(state).toEqual('a')
    fireEvent.click(container.firstElementChild)
    await act(() => sleep(210))

    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"Error: 1"`)
    expect(container.firstElementChild.getAttribute('title')).toEqual('b')
    expect(state).toEqual('b')
  })

  it('should trigger the onErrorRetry event with the latest version of the onErrorRetry callback', async () => {
    let state = null
    let count = 0
    function Page(props: { text: string }) {
      const { data, error } = useSWR(
        'config callbacks - onErrorRetry',
        () =>
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error(`Error: ${count++}`)), 200)
          ),
        {
          onErrorRetry: (_, __, ___, revalidate, revalidateOpts) => {
            state = props.text
            setTimeout(() => revalidate(revalidateOpts), 100)
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

    const { container, rerender } = render(<Page text="a" />)
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, , a"`
    )
    expect(state).toEqual(null)

    await screen.findByText('Error: 0')
    expect(container.firstElementChild.getAttribute('title')).toEqual('a')
    expect(state).toEqual('a')

    // since the onErrorRetry schedule a timer to trigger revalidation, update props.text now
    rerender(<Page text="b" />)
    // not revalidate yet.
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"Error: 0"`)
    expect(container.firstElementChild.getAttribute('title')).toEqual('b')
    expect(state).toEqual('a')

    await act(() => sleep(350))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(`"Error: 1"`)
    expect(container.firstElementChild.getAttribute('title')).toEqual('b')
    expect(state).toEqual('b')
  })

  it('should trigger the onLoadingSlow and onSuccess event with the lastest version of the callbacks', async () => {
    let state = null
    let count = 0

    function Page(props: { text: string }) {
      const { data } = useSWR(
        'config callbacks - onLoadingSlow',
        () => new Promise(res => setTimeout(() => res(count++), 200)),
        {
          onLoadingSlow: () => {
            state = props.text
          },
          onSuccess: () => {
            state = props.text
          },
          loadingTimeout: 100
        }
      )
      return (
        <div>
          hello, {data}, {props.text}
        </div>
      )
    }

    const { container, rerender } = render(<Page text="a" />)

    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, , a"`
    )
    expect(state).toEqual(null)

    await act(() => sleep(101))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, , a"`
    )
    expect(state).toEqual('a')
    rerender(<Page text="b" />)

    await act(() => sleep(100))
    expect(container.firstChild.textContent).toMatchInlineSnapshot(
      `"hello, 0, b"`
    )
    expect(state).toEqual('b')
  })
})
