import { SWRConfiguration, Fetcher, SWRResponse, ValueKey } from 'swr'

export type SWRInfiniteConfiguration<
  Data = any,
  Error = any,
  Args extends ValueKey = ValueKey
> = SWRConfiguration<Data[], Error, Args, Fetcher<Data[], Args>> & {
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
