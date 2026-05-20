import React from 'react'
import { isWindowDefined } from './helper'

// @ts-expect-error
const enableDevtools = isWindowDefined && window.__SWR_DEVTOOLS_USE__

export const getDevToolsUse = () => {
  // @ts-expect-error
  return window.__SWR_DEVTOOLS_USE__ ?? []
}

export const setupDevTools = () => {
  if (enableDevtools) {
    // @ts-expect-error
    window.__SWR_DEVTOOLS_REACT__ = React
  }
}

// Due to Chrome extension limitations, the SWR DevTools extension may inject
// `__SWR_DEVTOOLS_USE__` too late, where `enableDevtools` will always be false
// In this case, we provide a global function `__SWR_DEVTOOLS_SETUP__` for the
// extension to invoke when it is ready

// @ts-expect-error
window.__SWR_DEVTOOLS_SETUP__ = () => {
  // @ts-expect-error
  window.__SWR_DEVTOOLS_REACT__ = React
}
