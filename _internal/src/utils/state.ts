import type { MutableRefObject } from 'react'
import React, { useRef, useCallback, useState } from 'react'
import { useIsomorphicLayoutEffect, IS_REACT_LEGACY } from './env'

/**
 * An implementation of state with dependency-tracking.
 */
export const useStateWithDeps = <S = any>(
  state: any
): [
  MutableRefObject<any>,
  Record<keyof S, boolean>,
  (payload: Partial<S>) => void
] => {
  const rerender = useState<Record<string, unknown>>({})[1]
  const unmountedRef = useRef(false)
  const stateRef = useRef(state)

  // If a state property (data, error, or isValidating) is accessed by the render
  // function, we mark the property as a dependency so if it is updated again
  // in the future, we trigger a rerender.
  // This is also known as dependency-tracking.
  const stateDependenciesRef = useRef<Record<keyof S, boolean>>({
    data: false,
    error: false,
    isValidating: false
  } as any)

  /**
   * @param payload To change stateRef, pass the values explicitly to setState:
   * @example
   * ```js
   * setState({
   *   isValidating: false
   *   data: newData // set data to newData
   *   error: undefined // set error to undefined
   * })
   *
   * setState({
   *   isValidating: false
   *   data: undefined // set data to undefined
   *   error: err // set error to err
   * })
   * ```
   */
  const setState = useCallback(
    (payload: Partial<S>) => {
      let shouldRerender = false

      const currentState = stateRef.current
      for (const _ in payload) {
        const k = _ as keyof S

        // If the property has changed, update the state and mark rerender as
        // needed.
        if (currentState[k] !== payload[k]) {
          currentState[k] = payload[k]

          // If the property is accessed by the component, a rerender should be
          // triggered.
          if (stateDependenciesRef.current[k]) {
            shouldRerender = true
          }
        }
      }

      if (shouldRerender && !unmountedRef.current) {
        if (IS_REACT_LEGACY) {
          rerender({})
        } else {
          ;(React as any).startTransition(() => rerender({}))
        }
      }
    },
    [rerender]
  )

  useIsomorphicLayoutEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
    }
  })

  return [stateRef, stateDependenciesRef.current, setState]
}
