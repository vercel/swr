import React from 'react'
import App from 'next/app'
import { SWRConfig } from 'swr'
import fetch from '../libs/fetch.js';

export default class MyApp extends App {
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
