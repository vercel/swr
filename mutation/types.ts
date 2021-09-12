import { SWRResponse, SWRConfiguration, Fetcher } from 'swr'

export type SWRMutationConfiguration<Data, Error> = Pick<
  SWRConfiguration<Data[], Error, Fetcher<Data[]>>,
  'fetcher' | 'onSuccess' | 'onError'
> & {
  revalidate?: boolean
  populateCache?: boolean
}

export interface SWRMutationResponse<Data = any, Error = any>
  extends Omit<SWRResponse<Data, Error>, 'isValidating'> {
  isMutating: boolean
  trigger: (
    extraArgument?: any,
    options?: SWRMutationConfiguration<Data, Error>
  ) => Promise<Data | undefined>
  reset: () => void
}
