import { useEffect, useLayoutEffect } from 'react'

export const IS_SERVER = typeof window === 'undefined' || 'Deno' in window

const __requestAnimationFrame = !IS_SERVER
  ? window['requestAnimationFrame']
  : null

// polyfill for requestAnimationFrame
export const rAF = __requestAnimationFrame
  ? (f: FrameRequestCallback) => __requestAnimationFrame(f)
  : (f: (...args: any[]) => void) => setTimeout(f, 1)

// React currently throws a warning when using useLayoutEffect on the server.
// To get around it, we can conditionally useEffect on the server (no-op) and
// useLayoutEffect in the browser.
export const useIsomorphicLayoutEffect = IS_SERVER ? useEffect : useLayoutEffect

// This assignment is to extend the Navigator type to use effectiveType.
const navigatorConnection =
  typeof navigator !== 'undefined' &&
  (navigator as Navigator & {
    connection?: {
      effectiveType: string
      saveData: boolean
    }
  }).connection

// Adjust the config based on slow connection status (<= 70Kbps).
export const slowConnection =
  !IS_SERVER &&
  navigatorConnection &&
  (['slow-2g', '2g'].includes(navigatorConnection.effectiveType) ||
    navigatorConnection.saveData)
