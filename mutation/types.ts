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

type RemoveUndefined<T> = T extends undefined ? never : T
interface TriggerWithArgs<
  Data = any,
  Error = any,
  ExtraArg = never,
  SWRMutationKey extends Key = Key
> {
  <SWRData = Data>(
    extraArgument: ExtraArg,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      ExtraArg,
      SWRMutationKey,
      SWRData
    >
  ): Promise<Data>
  <SWRData = Data>(
    extraArgument: ExtraArg,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      ExtraArg,
      SWRMutationKey,
      SWRData
    > & { throwOnError: true }
  ): Promise<RemoveUndefined<Data>>
  <SWRData = Data>(
    extraArgument: ExtraArg,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      ExtraArg,
      SWRMutationKey,
      SWRData
    > & { throwOnError: false }
  ): Promise<Data | undefined>
}

interface TriggerWithoutArgs<
  Data = any,
  Error = any,
  ExtraArg = never,
  SWRMutationKey extends Key = Key
> {
  <SWRData = Data>(
    extraArgument?: null,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      ExtraArg,
      SWRMutationKey,
      SWRData
    >
  ): Promise<Data>
  <SWRData = Data>(
    extraArgument?: null,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      ExtraArg,
      SWRMutationKey,
      SWRData
    > & { throwOnError: true }
  ): Promise<RemoveUndefined<Data>>
  <SWRData = Data>(
    extraArgument?: null,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      ExtraArg,
      SWRMutationKey,
      SWRData
    > & { throwOnError: false }
  ): Promise<Data>
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
    ? TriggerWithoutArgs<Data, Error, ExtraArg, SWRMutationKey>
    : TriggerWithArgs<Data, Error, ExtraArg, SWRMutationKey>
  /**
   * Function to reset the mutation state (`data`, `error`, and `isMutating`).
   */
  reset: () => void
}

export interface SWRMutationHook {
  <Data = any, Error = any, SWRMutationKey extends Key = Key, ExtraArg = never>(
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
  ): SWRMutationResponse<Data, Error, ExtraArg, SWRMutationKey>
  <Data = any, Error = any, SWRMutationKey extends Key = Key, ExtraArg = never>(
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
    options?: SWRMutationConfiguration<
      Data,
      Error,
      ExtraArg,
      SWRMutationKey
    > & { throwOnError: false }
  ): SWRMutationResponse<Data | undefined, Error, ExtraArg, SWRMutationKey>
  <Data = any, Error = any, SWRMutationKey extends Key = Key, ExtraArg = never>(
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
    options?: SWRMutationConfiguration<
      Data,
      Error,
      ExtraArg,
      SWRMutationKey
    > & { throwOnError: true }
  ): SWRMutationResponse<Data, Error, ExtraArg, SWRMutationKey>
}
