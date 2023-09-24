import { createContext, createElement, useRef } from 'react'

type Context = {
  shouldForceFetch: (params: {
    noCacheOnMount: boolean | undefined
    key: Key
  }) => boolean
}

const defaultContext: Context = {
  shouldForceFetch: () => false
}

export const SWRNoCacheOnMountContext = createContext<Context>(defaultContext)

type Key = string

const SWRNoCacheOnMount = () => {
  const isFetchedMap = useRef<Record<Key, boolean>>({})

  const shouldForceFetch = ({
    noCacheOnMount,
    key
  }: {
    noCacheOnMount: boolean | undefined
    key: Key
  }) => {
    const result = Boolean(noCacheOnMount && !isFetchedMap.current[key])
    if (result) {
      isFetchedMap.current[key] = true
    }
    return result
  }

  return createElement(SWRNoCacheOnMountContext.Provider, {
    value: {
      shouldForceFetch
    }
  })
}

export default SWRNoCacheOnMount
