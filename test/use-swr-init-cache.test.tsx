import { initCache } from 'swr/_internal'

describe('initCache', () => {
  it('should release the listeners from the latest initProvider() call, not a stale snapshot', () => {
    // Simulates exactly the sequence SWRConfig's effect produces under
    // StrictMode: render calls initCache() once; the effect then does
    // setup -> simulated cleanup -> setup again -> (eventually) real
    // cleanup, reusing the same returned tuple throughout.
    const provider = new Map()
    let initCount = 0
    const released: number[] = []

    const initFocus = () => {
      initCount++
      const myInit = initCount
      return () => {
        released.push(myInit)
      }
    }
    const initReconnect = () => () => undefined

    const tuple = initCache(provider, { initFocus, initReconnect })
    const [, , initProvider, unmount] = tuple as [
      unknown,
      unknown,
      () => void,
      () => void
    ]

    expect(initCount).toBe(1)

    // Effect setup #1 (StrictMode's first invoke): initProvider() is a
    // no-op here, the state from the render-time initCache() call above
    // is still present.
    initProvider()
    expect(initCount).toBe(1)

    // StrictMode's simulated cleanup: releases listener set #1 and tears
    // down the provider's global state.
    unmount()
    expect(released).toEqual([1])

    // StrictMode's re-setup: state is gone, so this genuinely re-runs and
    // registers a second, independent listener set.
    initProvider()
    expect(initCount).toBe(2)

    // The real, final cleanup. The tuple's own `unmount` reference must
    // resolve to whichever listener set is actually live right now (set
    // #2), not the already-released set #1 it was holding when the tuple
    // was first created. A stale reference would call release #1 again
    // here (released = [1, 1]) and leak set #2's listeners forever.
    unmount()
    expect(released).toEqual([1, 2])
  })
})
