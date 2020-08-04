import React from 'react'
import { ConfigInterface } from '../types'
export default function throttle(
  fn: any,
  configRef: React.MutableRefObject<ConfigInterface>,
  intervalKey: 'focusThrottleInterval'
) {
  let pending = false
  return (...args) => {
    if (pending) return
    pending = true
    fn(...args)
    setTimeout(() => (pending = false), configRef.current[intervalKey])
  }
}
