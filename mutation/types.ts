import { SWRResponse, SWRConfiguration, Key, MutatorOptions } from 'swr'

type Async<Data> = Data | Promise<Data>

export type MutationFetcher<
  Data = unknown,
  SWRKey extends Key = Key,
  ExtraArg = any
> =
  /**
   * () => [{ foo: string }, { bar: number }] | null
   * () => ( [{ foo: string }, { bar: number } ] as const | null )
   */
  SWRKey extends () => readonly [...infer Args] | null
    ? (...args: [...Args, ExtraArg]) => Async<Data>
    : /**
     * [{ foo: string }, { bar: number } ] | null
     * [{ foo: string }, { bar: number } ] as const | null
     */
    SWRKey extends readonly [...infer Args]
    ? (...args: [...Args, ExtraArg]) => Async<Data>
    : /**
     * () => string | null
     * () => Record<any, any> | null
     */
    SWRKey extends () => infer Arg | null
    ? (...args: [Arg, ExtraArg]) => Async<Data>
    : /**
     *  string | null | Record<any,any>
     */
    SWRKey extends null
    ? never
    : SWRKey extends infer Arg
    ? (...args: [Arg, ExtraArg]) => Async<Data>
    : never

export type SWRMutationConfiguration<
  Data,
  Error,
  SWRMutationKey extends Key = Key,
  ExtraArg = any
> = Pick<
  SWRConfiguration<
    Data,
    Error,
    MutationFetcher<Data, SWRMutationKey, ExtraArg>
  >,
  'fetcher' | 'onSuccess' | 'onError'
> &
  MutatorOptions<Data>

export interface SWRMutationResponse<
  Data = any,
  Error = any,
  SWRMutationKey extends Key = Key,
  ExtraArg = any
> extends Omit<SWRResponse<Data, Error>, 'isValidating'> {
  isMutating: boolean
  trigger: (
    extraArgument?: ExtraArg,
    options?: SWRMutationConfiguration<Data, Error, SWRMutationKey, ExtraArg>
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
    | readonly [SWRMutationKey, MutationFetcher<Data, SWRMutationKey, ExtraArg>]
    | readonly [
        SWRMutationKey,
        MutationFetcher<Data, SWRMutationKey, ExtraArg>,
        SWRMutationConfiguration<Data, Error, SWRMutationKey, ExtraArg>
      ]
) => SWRMutationResponse<Data, Error, SWRMutationKey, ExtraArg>
