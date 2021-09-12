import { SWRResponse } from 'swr'

export type SWRMutationConfiguration<Data, Error> = {
  revalidate?: boolean
  populateCache?: boolean
  onSuccess?: (data: Data, key: string) => void
  onError?: (error: Error, key: string) => void
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
