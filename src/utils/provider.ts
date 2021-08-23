import { useContext } from 'react'
import { defaultProvider } from './config'
import { SWRConfigContext } from './config-context'
import { SWRGlobalState, GlobalState } from './global-state'

export const useSWRProvider = () => {
  const cache = useContext(SWRConfigContext).cache || defaultProvider[0]
  return {
    cache,
    mutate: (SWRGlobalState.get(cache) as GlobalState)[6]
  }
}
