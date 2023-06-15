import type { SWRResponse, Key } from 'swr'

type FetcherResponse<Data> = Data | Promise<Data>

type FetcherOptions<ExtraArg = unknown> = Readonly<{
  arg: ExtraArg
}>

export type MutationFetcher<
  Data = unknown,
  SWRKey extends Key = Key,
  ExtraArg = unknown
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
  SWRMutationKey extends Key = Key,
  ExtraArg = any,
  SWRData = any
> = {
  revalidate?: boolean
  populateCache?:
    | boolean
    | ((result: Data, currentData: SWRData | undefined) => SWRData)
  optimisticData?: SWRData | ((currentData?: SWRData) => SWRData)
  rollbackOnError?: boolean | ((error: unknown) => boolean)
  fetcher?: MutationFetcher<Data, SWRMutationKey, ExtraArg>
  onSuccess?: (
    data: Data,
    key: string,
    config: Readonly<
      SWRMutationConfiguration<Data, Error, SWRMutationKey, ExtraArg, SWRData>
    >
  ) => void
  onError?: (
    err: Error,
    key: string,
    config: Readonly<
      SWRMutationConfiguration<Data, Error, SWRMutationKey, ExtraArg, SWRData>
    >
  ) => void
}

type RemoveUndefined<T> = T extends undefined ? never : T
export interface TriggerWithArgs<
  Data = any,
  Error = any,
  SWRMutationKey extends Key = Key,
  ExtraArg = never
> {
  <SWRData = Data>(
    extraArgument: ExtraArg,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    >
  ): Promise<Data>
  <SWRData = Data>(
    extraArgument: ExtraArg,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    > & { throwOnError: true }
  ): Promise<RemoveUndefined<Data>>
  <SWRData = Data>(
    extraArgument: ExtraArg,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    > & { throwOnError: false }
  ): Promise<Data | undefined>
}

export interface TriggerWithoutArgs<
  Data = any,
  Error = any,
  SWRMutationKey extends Key = Key,
  ExtraArg = never
> {
  <SWRData = Data>(
    extraArgument?: null,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    >
  ): Promise<Data>
  <SWRData = Data>(
    extraArgument?: null,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    > & { throwOnError: true }
  ): Promise<RemoveUndefined<Data>>
  <SWRData = Data>(
    extraArgument?: null,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    > & { throwOnError: false }
  ): Promise<Data>
}

export interface SWRMutationResponse<
  Data = any,
  Error = any,
  SWRMutationKey extends Key = Key,
  ExtraArg = never
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
    ? TriggerWithoutArgs<Data, Error, SWRMutationKey, ExtraArg>
    : TriggerWithArgs<Data, Error, SWRMutationKey, ExtraArg>
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
    fetcher: MutationFetcher<Data, SWRMutationKey, ExtraArg>,
    /**
     * Extra options for the mutation hook.
     */
    options?: SWRMutationConfiguration<Data, Error, SWRMutationKey, ExtraArg>
  ): SWRMutationResponse<Data, Error, SWRMutationKey, ExtraArg>
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
    fetcher: MutationFetcher<Data, SWRMutationKey, ExtraArg>,
    /**
     * Extra options for the mutation hook.
     */
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg
    > & { throwOnError: false }
  ): SWRMutationResponse<Data | undefined, Error, SWRMutationKey, ExtraArg>
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
    fetcher: MutationFetcher<Data, SWRMutationKey, ExtraArg>,
    /**
     * Extra options for the mutation hook.
     */
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg
    > & { throwOnError: true }
  ): SWRMutationResponse<Data, Error, SWRMutationKey, ExtraArg>
}
