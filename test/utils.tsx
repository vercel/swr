import { act, fireEvent, render } from '@testing-library/react'
import React from 'react'
import { SWRConfig } from 'swr'

export function sleep(time: number) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export const createResponse = <T extends any>(
  response: T,
  { delay } = { delay: 10 }
): Promise<T> =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      if (response instanceof Error) {
        reject(response)
      } else {
        resolve(response)
      }
    }, delay)
  )

export const nextTick = () => act(() => sleep(1))

export const focusOn = (element: any) =>
  act(async () => {
    fireEvent.focus(element)
  })

export const createKey = () => 'swr-key-' + ~~(Math.random() * 1e7)

const _renderWithConfig = (
  element: React.ReactElement,
  config: Parameters<typeof SWRConfig>[0]['value']
): ReturnType<typeof render> => {
  const result = render(<SWRConfig value={config}>{element}</SWRConfig>)
  return {
    ...result,
    // override the rerender method to wrap the element with SWRConfig again
    rerender: (rerenderElement: React.ReactElement) =>
      result.rerender(<SWRConfig value={config}>{rerenderElement}</SWRConfig>)
  }
}

export const renderWithConfig = (
  element: React.ReactElement,
  config?: Parameters<typeof _renderWithConfig>[1]
): ReturnType<typeof _renderWithConfig> => {
  const provider = () => new Map()
  return _renderWithConfig(element, { provider, ...config })
}

export const renderWithGlobalCache = (
  element: React.ReactElement,
  config?: Parameters<typeof _renderWithConfig>[1]
): ReturnType<typeof _renderWithConfig> => {
  return _renderWithConfig(element, { ...config })
}
