import { useEffect, useLayoutEffect } from 'react'

export const IS_SERVER =
  typeof window === 'undefined' ||
  // @ts-ignore
  !!(typeof Deno !== 'undefined' && Deno && Deno.version && Deno.version.deno)

// polyfill for requestAnimationFrame
export const rAF = IS_SERVER
  ? null
  : window['requestAnimationFrame'] || (f => setTimeout(f, 1))

// React currently throws a warning when using useLayoutEffect on the server.
// To get around it, we can conditionally useEffect on the server (no-op) and
// useLayoutEffect in the browser.
export const useIsomorphicLayoutEffect = IS_SERVER ? useEffect : useLayoutEffect
