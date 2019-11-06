export interface ConfigInterface<Data = any, Error = any> {
  errorRetryInterval?: number
  loadingTimeout?: number
  focusThrottleInterval?: number
  dedupingInterval?: number

  refreshInterval?: number
  refreshWhenHidden?: boolean
  revalidateOnFocus?: boolean
  shouldRetryOnError?: boolean
  fetcher?: any
  suspense?: boolean

  onLoadingSlow?: (key: string, config: ConfigInterface<Data, Error>) => void
  onSuccess?: (
    data: Data,
    key: string,
    config: ConfigInterface<Data, Error>
  ) => void
  onError?: (
    err: Error,
    key: string,
    config: ConfigInterface<Data, Error>
  ) => void
  onErrorRetry?: (
    err: Error,
    key: string,
    config: ConfigInterface<Data, Error>,
    revalidate: revalidateType,
    revalidateOpts: RevalidateOptionInterface
  ) => void
}

export interface RevalidateOptionInterface {
  retryCount?: number
  dedupe?: boolean
}

type keyFunction = () => string
export type keyInterface = string | keyFunction
export type updaterInterface<Data = any, Error = any> = (
  shouldRevalidate?: boolean,
  data?: Data,
  error?: Error
) => boolean | Promise<boolean>
export type triggerInterface = (key: string, shouldRevalidate?: boolean) => void
export type mutateInterface<Data = any> = (
  key: string,
  data: Data,
  shouldRevalidate?: boolean
) => void
export type broadcastStateInterface<Data = any, Error = any> = (
  key: string,
  data: Data,
  error?: Error
) => void
export type responseInterface<Data, Error> = {
  data?: Data
  error?: Error
  revalidate: () => Promise<boolean>
  isValidating: boolean
}
export type revalidateType = (
  revalidateOpts: RevalidateOptionInterface
) => Promise<boolean>

export type pagesWithSWRType<Data, Error> = (
  swr: responseInterface<Data, Error>
) => responseInterface<Data, Error>
export type pagesPropsInterface<Offset, Data, Error> = {
  // offset can be any type
  offset: Offset
  withSWR: pagesWithSWRType<Data, Error>
}

export type pageComponentType<Offset, Data, Error> = (
  props: pagesPropsInterface<Offset, Data, Error>
) => any
export type pageOffsetMapperType<Offset, Data, Error> = (
  data: any,
  pageSWRs: responseInterface<Data, Error>[]
) => Offset

export type pagesResponseInterface = {
  pages: any
  pageCount: number
  pageSWRs: responseInterface<any, any>[]
  isLoadingMore: boolean
  isReachingEnd: boolean
  isEmpty: boolean
  loadMore: () => void
}
