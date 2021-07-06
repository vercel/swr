import { SWRConfiguration, Fetcher, SWRResponse } from 'swr'

export type SWRInfiniteConfiguration<
  Data = any,
  Error = any
> = SWRConfiguration<Data[], Error, Fetcher<Data[]>> & {
  initialSize?: number
  revalidateAll?: boolean
  persistSize?: boolean
}

export interface SWRInfiniteResponse<Data = any, Error = any>
  extends SWRResponse<Data[], Error> {
  size: number
  setSize: (
    size: number | ((_size: number) => number)
  ) => Promise<Data[] | undefined>
}
