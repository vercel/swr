export interface ConfigInterface {
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

  onLoadingSlow?: (key: string, config: ConfigInterface) => void
  onSuccess?: (data: any, key: string, config: ConfigInterface) => void
  onError?: (err: Error, key: string, config: ConfigInterface) => void
  onErrorRetry?: (
    err: Error,
    key: string,
    config: ConfigInterface,
    revalidate: revalidateType,
    revalidateOpts: RevalidateOptionInterface
  ) => void
}

export interface RevalidateOptionInterface {
  retryCount?: number
  noDedupe?: boolean
}

type keyFunction = () => string
export type keyInterface = string | keyFunction
export type updaterInterface = (
  shouldRevalidate?: boolean
) => boolean | Promise<boolean>
export type triggerInterface = (key: string, shouldRevalidate?: boolean) => void
export type mutateInterface = (
  key: string,
  data: any,
  shouldRevalidate?: boolean
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

export type pagesWithSWRType = () => void
export type pagesPropsInterface<Offset> = {
  // offset can be any type
  offset: Offset
  withSWR: pagesWithSWRType
}

export type pageComponentType = (props: pagesPropsInterface<any>) => any
export type pageOffsetMapperType<Offset> = (data: any) => Offset

export type pagesResponseInterface = {
  pages: any
  pageCount: number
  pageSWRs: responseInterface<any, any>[]
  isLoadingMore: boolean
  isReachingEnd: boolean
  isEmpty: boolean
  loadMore: () => void
}
