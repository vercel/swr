import React from 'react'
import App from 'next/app'
import { SWRConfig } from '@zeit/swr'
import fetch from '../libs/fetch.js';

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props
    return <SWRConfig
      value={{
        fetcher: fetch
      }}
    >
      <Component {...pageProps} />
    </SWRConfig>
  }
}

export default MyApp
