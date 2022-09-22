import type { SWRResponse, Key, MutatorOptions } from 'swr'

type FetcherResponse<Data> = Data | Promise<Data>

type FetcherOptions<ExtraArg = unknown> = Readonly<{
  arg: ExtraArg
}>

export type MutationFetcher<
  Data = unknown,
  ExtraArg = unknown,
  SWRKey extends Key = Key
> = SWRKey extends () => infer Arg | null | undefined | false
  ? (key: Arg, options: FetcherOptions<ExtraArg>) => FetcherResponse<Data>
  : SWRKey extends null | undefined | false
  ? never
  : SWRKey extends infer Arg
  ? (key: Arg, options: FetcherOptions<ExtraArg>) => FetcherResponse<Data>
  : never

export type SWRMutationConfiguration<
  Data,
  Error,
  ExtraArg = any,
  SWRMutationKey extends Key = Key
> = MutatorOptions<Data> & {
  fetcher?: MutationFetcher<Data, ExtraArg, SWRMutationKey>
  onSuccess?: (
    data: Data,
    key: string,
    config: Readonly<
      SWRMutationConfiguration<Data, Error, ExtraArg, SWRMutationKey>
    >
  ) => void
  onError?: (
    err: Error,
    key: string,
    config: Readonly<
      SWRMutationConfiguration<Data, Error, ExtraArg, SWRMutationKey>
    >
  ) => void
}

export interface SWRMutationResponse<
  Data = any,
  Error = any,
  ExtraArg = any,
  SWRMutationKey extends Key = Key
> extends Pick<SWRResponse<Data, Error>, 'data' | 'error'> {
  isMutating: boolean
  trigger: (
    extraArgument?: ExtraArg,
    options?: SWRMutationConfiguration<Data, Error, ExtraArg, SWRMutationKey>
  ) => Promise<Data | undefined>
  reset: () => void
}

export type SWRMutationHook = <
  Data = any,
  Error = any,
  SWRMutationKey extends Key = Key,
  ExtraArg = any
>(
  ...args:
    | readonly [SWRMutationKey, MutationFetcher<Data, ExtraArg, SWRMutationKey>]
    | readonly [
        SWRMutationKey,
        MutationFetcher<Data, ExtraArg, SWRMutationKey>,
        SWRMutationConfiguration<Data, Error, ExtraArg, SWRMutationKey>
      ]
) => SWRMutationResponse<Data, Error, ExtraArg, SWRMutationKey>
