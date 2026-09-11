'use client'

import { browser } from 'react-dom'

import type { InternalConfiguration, Middleware } from '../_internal'

export const suspense: Middleware = useSWRNext => (key, fetcher, config) => {
  config.suspense = true
  ;(
    config as typeof config & Pick<InternalConfiguration, '_suspenseBrowser'>
  )._suspenseBrowser = browser
  return useSWRNext(key, fetcher, config)
}
