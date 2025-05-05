import type { AppProps } from 'next/app'
import { GlobalSWRConfig } from 'global-swr-config'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GlobalSWRConfig>
      <Component {...pageProps} />
    </GlobalSWRConfig>
  )
}
