import React from 'react'
import { isWindowDefined } from './helper'

// @ts-expect-error
const enableDevtools = isWindowDefined && window.__SWR_DEVTOOLS_USE__

export const use = enableDevtools
  ? // @ts-expect-error
    window.__SWR_DEVTOOLS_USE__
  : []

export const setupDevTools = () => {
  if (enableDevtools) {
    // @ts-expect-error
    window.__SWR_DEVTOOLS_REACT__ = React
  }
}
