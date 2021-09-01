import { act, fireEvent } from '@testing-library/react'
import React from 'react'
import { SWRConfiguration, SWRConfig } from 'swr'

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

export const TestSWRConfig = ({
  children,
  value
}: {
  children: React.ReactNode
  value?: SWRConfiguration
}) => (
  <SWRConfig value={{ provider: () => new Map(), ...value }}>
    {children}
  </SWRConfig>
)
