import type { TransitionFunction, TransitionStartFunction } from 'react'
import React, { useCallback, useState } from 'react'
import { IS_REACT_LEGACY, isFunction, isPromiseLike } from '../_internal'

type UseTransition = () => [boolean, TransitionStartFunction]

// React 16–18: no useTransition, or useTransition w/o async function tracking support.
// Track async pending manually with useState.
const useTransitionLegacy: UseTransition = () => {
  const [isPending, setIsPending] = useState(false)
  const start = useCallback((cb: TransitionFunction) => {
    const result = cb()
    if (isPromiseLike(result)) {
      setIsPending(true)
      result.finally(() => setIsPending(false))
    }
  }, [])
  return [isPending, start]
}

// React 18 introduced useTransition, but it can only handle sync transitions.
// React 19 introduced async support in useTransition natively.
// We can detect it via React.use which was also added in React 19.
const IS_REACT_19 = !IS_REACT_LEGACY && isFunction((React as any).use)

export const useTransition: UseTransition = IS_REACT_19
  ? React.useTransition
  : useTransitionLegacy
