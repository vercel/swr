import type { Key, SWRConfiguration, MutatorCallback } from 'swr'

export type SWRSubscriptionOptions<Data = any, Error = any> = {
  next: (err?: Error | null, data?: Data | MutatorCallback<Data>) => void
}

export type SWRSubscription<
  SWRSubKey extends Key = Key,
  Data = any,
  Error = any
> = SWRSubKey extends () => infer Arg | null | undefined | false
  ? (key: Arg, { next }: SWRSubscriptionOptions<Data, Error>) => void
  : SWRSubKey extends null | undefined | false
  ? never
  : SWRSubKey extends infer Arg
  ? (key: Arg, { next }: SWRSubscriptionOptions<Data, Error>) => void
  : never

export type SWRSubscriptionResponse<Data = any, Error = any> = {
  data?: Data
  error?: Error
}

export type SWRSubscriptionHook = <
  Data = any,
  Error = any,
  SWRSubKey extends Key = Key
>(
  key: SWRSubKey,
  subscribe: SWRSubscription<SWRSubKey, Data, Error>,
  config?: SWRConfiguration
) => SWRSubscriptionResponse<Data, Error>
