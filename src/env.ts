import { useEffect, useLayoutEffect } from 'react'

export const IS_SERVER =
  typeof window === 'undefined' ||
  // @ts-expect-error
  !!(typeof Deno !== 'undefined' && Deno.version && Deno.version.deno)

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

// This assignment is to extend the Navigator type to use effectiveType
const __navigator: Navigator & {
  connection?: { effectiveType: string }
} = navigator
// client side: need to adjust the config
// based on the browser status
// slow connection (<= 70Kbps)
export const slowConnection =
  !IS_SERVER &&
  typeof __navigator.connection !== 'undefined' &&
  ['slow-2g', '2g'].indexOf(__navigator['connection'].effectiveType) !== -1
