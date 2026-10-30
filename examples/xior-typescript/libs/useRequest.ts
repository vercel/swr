import useSWR, { SWRConfiguration, SWRResponse } from 'swr'
import axios, {
  XiorRequestConfig as AxiosRequestConfig,
  XiorResponse as AxiosResponse,
  XiorError as AxiosError
} from 'xior'

export type GetRequest = AxiosRequestConfig | null

interface Return<Data, Error>
  extends Pick<
    SWRResponse<AxiosResponse<Data>, AxiosError>,
    'isValidating' | 'error' | 'mutate'
  > {
  data: Data | undefined
  response: AxiosResponse<Data> | undefined
}

export interface Config<Data = unknown, Error = unknown>
  extends Omit<
    SWRConfiguration<AxiosResponse<Data>, AxiosError>,
    'fallbackData'
  > {
  fallbackData?: Data
}

export default function useRequest<Data = unknown, Error = unknown>(
  request: GetRequest,
  { fallbackData, ...config }: Config<Data, Error> = {}
): Return<Data, Error> {
  const {
    data: response,
    error,
    isValidating,
    mutate
  } = useSWR<AxiosResponse<Data>, AxiosError>(
    request,
    /**
     * NOTE: Typescript thinks `request` can be `null` here, but the fetcher
     * function is actually only called by `useSWR` when it isn't.
     */
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () => axios.request<Data>(request!),
    {
      ...config,
      fallbackData:
        fallbackData &&
        ({
          status: 200,
          statusText: 'InitialData',
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          config: request!,
          headers: {},
          data: fallbackData
        } as AxiosResponse<Data>)
    }
  )

  return {
    data: response && response.data,
    response,
    error,
    isValidating,
    mutate
  }
}
