import type { SWRResponse, Key, Arguments } from '../index'

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
  revalidate?: boolean | ((data: Data, key: Arguments) => boolean)
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
type IsUndefinedIncluded<T> = undefined extends T ? true : false

// Resolves to the extra-argument portion of the trigger parameter list based on
// ExtraArg. Keeping the conditional inside a tuple type (rather than at the
// interface level) lets TypeScript treat the resulting trigger as a single
// callable signature even when ExtraArg is a deferred generic type parameter.
type TriggerExtraArg<ExtraArg> = [ExtraArg] extends [never]
  ? [extraArgument?: null | undefined]
  : IsUndefinedIncluded<ExtraArg> extends true
  ? [extraArgument?: ExtraArg]
  : [extraArgument: ExtraArg]

/**
 * A single callable trigger interface whose argument list is determined by
 * ExtraArg. Unlike a union of the three legacy Trigger* interfaces, this type
 * remains callable when ExtraArg is a generic (deferred) type parameter.
 */
export interface SWRMutationTrigger<
  Data = any,
  Error = any,
  SWRMutationKey extends Key = Key,
  ExtraArg = never
> {
  <SWRData = Data>(
    ...args: [
      ...TriggerExtraArg<ExtraArg>,
      options?: SWRMutationConfiguration<
        Data,
        Error,
        SWRMutationKey,
        ExtraArg,
        SWRData
      >
    ]
  ): Promise<Data>
  <SWRData = Data>(
    ...args: [
      ...TriggerExtraArg<ExtraArg>,
      options: SWRMutationConfiguration<
        Data,
        Error,
        SWRMutationKey,
        ExtraArg,
        SWRData
      > & { throwOnError: true }
    ]
  ): Promise<RemoveUndefined<Data>>
  <SWRData = Data>(
    ...args: [
      ...TriggerExtraArg<ExtraArg>,
      options: SWRMutationConfiguration<
        Data,
        Error,
        SWRMutationKey,
        ExtraArg,
        SWRData
      > & { throwOnError: false }
    ]
  ): Promise<Data | undefined>
}

/** @deprecated Use {@link SWRMutationTrigger} instead. */
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

/** @deprecated Use {@link SWRMutationTrigger} instead. */
export interface TriggerWithOptionsArgs<
  Data = any,
  Error = any,
  SWRMutationKey extends Key = Key,
  ExtraArg = never
> {
  <SWRData = Data>(
    extraArgument?: ExtraArg,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    >
  ): Promise<Data>
  <SWRData = Data>(
    extraArgument?: ExtraArg,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    > & { throwOnError: true }
  ): Promise<RemoveUndefined<Data>>
  <SWRData = Data>(
    extraArgument?: ExtraArg,
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    > & { throwOnError: false }
  ): Promise<Data | undefined>
}

/** @deprecated Use {@link SWRMutationTrigger} instead. */
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
  trigger: SWRMutationTrigger<Data, Error, SWRMutationKey, ExtraArg>
  /**
   * Function to reset the mutation state (`data`, `error`, and `isMutating`).
   */
  reset: () => void
}

export interface SWRMutationHook {
  <
    Data = any,
    Error = any,
    SWRMutationKey extends Key = Key,
    ExtraArg = never,
    SWRData = Data
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
    fetcher: MutationFetcher<Data, SWRMutationKey, ExtraArg>,
    /**
     * Extra options for the mutation hook.
     */
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    > & { throwOnError?: boolean }
  ): SWRMutationResponse<Data, Error, SWRMutationKey, ExtraArg>
  <
    Data = any,
    Error = any,
    SWRMutationKey extends Key = Key,
    ExtraArg = never,
    SWRData = Data
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
    fetcher: MutationFetcher<Data, SWRMutationKey, ExtraArg>,
    /**
     * Extra options for the mutation hook.
     */
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    > & { throwOnError: false }
  ): SWRMutationResponse<Data | undefined, Error, SWRMutationKey, ExtraArg>
  <
    Data = any,
    Error = any,
    SWRMutationKey extends Key = Key,
    ExtraArg = never,
    SWRData = Data
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
    fetcher: MutationFetcher<Data, SWRMutationKey, ExtraArg>,
    /**
     * Extra options for the mutation hook.
     */
    options?: SWRMutationConfiguration<
      Data,
      Error,
      SWRMutationKey,
      ExtraArg,
      SWRData
    > & { throwOnError: true }
  ): SWRMutationResponse<Data, Error, SWRMutationKey, ExtraArg>
}
