import React from 'react'
import { isWindowDefined } from './helper'

export const preset = {
  // @ts-expect-error
  use: isWindowDefined ? window.__SWR_DEVTOOLS_USE__ : []
}

export const setupDevTools = () => {
  if (isWindowDefined) {
    // @ts-expect-error
    window.__SWR_DEVTOOLS_REACT__ = React
  }
}
