import { useRef, useCallback, useState, MutableRefObject } from 'react'

import { useIsomorphicLayoutEffect } from './env'
import { State } from '../types'

type StateKeys = keyof State<any, any>
type StateDeps = Record<StateKeys, boolean>

/**
 * An implementation of state with dependency-tracking.
 */
export default function useStateWithDeps<Data, Error, S = State<Data, Error>>(
  state: S,
  unmountedRef: MutableRefObject<boolean>
): [
  MutableRefObject<S>,
  MutableRefObject<Record<StateKeys, boolean>>,
  (payload: S) => void
] {
  const rerender = useState<Record<string, unknown>>({})[1]
  const stateRef = useRef(state)

  // If a state property (data, error or isValidating) is accessed by the render
  // function, we mark the property as a dependency so if it is updated again
  // in the future, we trigger a rerender.
  // This is also known as dependency-tracking.
  const stateDependenciesRef = useRef<StateDeps>({
    data: false,
    error: false,
    isValidating: false
  })

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
    (payload: S) => {
      let shouldRerender = false

      const currentState = stateRef.current
      for (const _ of Object.keys(payload)) {
        // Type casting to work around the `for...in` loop
        // https://github.com/Microsoft/TypeScript/issues/3500
        const k = _ as keyof S & StateKeys

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
        rerender({})
      }
    },
    // config.suspense isn't allowed to change during the lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Always update the state reference.
  useIsomorphicLayoutEffect(() => {
    stateRef.current = state
  })

  return [stateRef, stateDependenciesRef, setState]
}
