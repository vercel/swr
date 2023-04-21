import type { SWRResponse, Key } from 'swr'

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
  SWRMutationKey extends Key = Key,
  SWRData = any
> = {
  revalidate?: boolean
  populateCache?:
    | boolean
    | ((result: Data, currentData: SWRData | undefined) => SWRData)
  optimisticData?: SWRData | ((currentData?: SWRData) => SWRData)
  rollbackOnError?: boolean | ((error: unknown) => boolean)
  throwOnError?: boolean
  fetcher?: MutationFetcher<Data, ExtraArg, SWRMutationKey>
  onSuccess?: (
    data: Data,
    key: string,
    config: Readonly<
      SWRMutationConfiguration<Data, Error, ExtraArg, SWRMutationKey, SWRData>
    >
  ) => void
  onError?: (
    err: Error,
    key: string,
    config: Readonly<
      SWRMutationConfiguration<Data, Error, ExtraArg, SWRMutationKey, SWRData>
    >
  ) => void
}

export interface SWRMutationResponse<
  Data = any,
  Error = any,
  ExtraArg = never,
  SWRMutationKey extends Key = Key
> extends Pick<SWRResponse<Data, Error>, 'data' | 'error'> {
  /**
   * Indicates if the mutation is in progress.
   */
  isMutating: boolean
  /**
   * Function to trigger the mutation. You can also pass an extra argument to
   * the fetcher, and override the options for the mutation hook.
   */
  trigger: [ExtraArg] extends [never]
    ? <SWRData = Data>(
        extraArgument?: null,
        options?: SWRMutationConfiguration<
          Data,
          Error,
          ExtraArg,
          SWRMutationKey,
          SWRData
        >
      ) => Promise<Data | undefined>
    : <SWRData = Data>(
        extraArgument: ExtraArg,
        options?: SWRMutationConfiguration<
          Data,
          Error,
          ExtraArg,
          SWRMutationKey,
          SWRData
        >
      ) => Promise<Data | undefined>
  /**
   * Function to reset the mutation state (`data`, `error`, and `isMutating`).
   */
  reset: () => void
}

export type SWRMutationHook = <
  Data = any,
  Error = any,
  SWRMutationKey extends Key = Key,
  ExtraArg = never
>(
  /**
   * The key of the resource that will be mutated. It should be the same key
   * used in the `useSWR` hook so SWR can handle revalidation and race
   * conditions for that resource.
   */
  key: SWRMutationKey,
  /**
   * The function to trigger the mutation that accepts the key, extra argument
   * and options. For example:
   *
   * ```jsx
   * (api, data) => fetch(api, {
   *   method: 'POST',
   *   body: JSON.stringify(data)
   * })
   * ```
   */
  fetcher: MutationFetcher<Data, ExtraArg, SWRMutationKey>,
  /**
   * Extra options for the mutation hook.
   */
  options?: SWRMutationConfiguration<Data, Error, ExtraArg, SWRMutationKey>
) => SWRMutationResponse<Data, Error, ExtraArg, SWRMutationKey>
