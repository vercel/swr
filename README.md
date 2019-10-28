[![SWR](https://assets.zeit.co/image/upload/v1572289618/swr/banner.png)](https://swr.now.sh)

<p align="center">
  <a aria-label="SWR website" href="https://swr.now.sh">swr.now.sh<a>
</p>

<p align="center">
  <a aria-label="ZEIT logo" href="https://github.com/zeit">
    <img src="https://img.shields.io/badge/MADE%20BY%20ZEIT-000000.svg?style=for-the-badge&logo=ZEIT&labelColor=000000&logoWidth=20">
  </a>
  <a aria-label="NPM version" href="https://www.npmjs.com/package/@zeit/swr">
    <img alt="" src="https://img.shields.io/npm/v/@zeit/swr?style=for-the-badge&labelColor=000000">
  </a>
  <a aria-label="License" href="https://github.com/zeit/swr/blob/master/LICENSE">
    <img alt="" src="https://img.shields.io/npm/l/@zeit/swr?style=for-the-badge&labelColor=000000">
  </a>
</p>

## Intro

SWR is a React Hooks library for remote data fetching.

The name “**SWR**” is derived from `stale-while-revalidate`, a HTTP cache invalidation strategy popularized by [RFC 5861](https://tools.ietf.org/html/rfc5861).
**SWR** first returns the data from cache (stale), then sends the fetch request (revalidate), and finally comes with the up-to-date data again.

It features:
- Transport and protocol agnostic data fetching
- Fast page navigation
- Revalidation on focus
- Interval polling
- Local mutation
- Pagination
- TypeScript ready
- Suspense mode
- Minimal API

With SWR, components will get a stream of data updates constantly and automatically, Thus, the UI will be always fast and reactive.

## Quick Start

```js
import useSWR from '@zeit/swr'

function Profile () {
  const { data, error } = useSWR('/api/user', fetch)

  if (error) return <div>failed to load</div>
  if (!data) return <div>loading...</div>
  return <div>hello {data.name}!</div>
}
```

In this example, the React Hook `useSWR` accepts a `key` and a `fetch` function.
`key` is a unique identifier of the data, normally a URL of the API. And the `fetch` accepts
`key` as its parameter and returns the data asynchronously.

`useSWR` also returns 2 values: `data` and `error`. When the request (fetch) is not yet finished,
`data` will be `null`. And when we get a response, it sets `data` and `error` based on the result
of `fetch` and rerenders the component.

## API

### `useSWR`

```js
const {
  data,                                    // data for the given key (or null)
  error,                                   // error (or null)
  isValidating,                            // is validating
  revalidate                               // function to trigger a validate manually
} = useSWR(
  key,                                     // a unique key for the data
  fn,                                      // function to fetch your data
  swrOptions? = {
    suspense: false,                       // enabled React Suspense mode
    revalidateOnFocus: true,               // auto revalidate when window gets focused
    refreshWhenHidden: false,              // refresh while the window is invisible
    shouldRetryOnError: true,              // retry when fetch has an error
    refreshInterval: 0,                    // polling interval (disabled by default)
    errorRetryInterval: 5000,              // error retry interval (10s on slow network)
    focusThrottleInterval: 5000,           // keep focus revalidate requests in a time window
    dedupingInterval: 2000,                // deduping requests
    loadingTimeout: 3000,                  // timeout for triggering the onLoadingSlow event

    onLoadingSlow,                         // event handlers
    onSuccess,
    onError,
    onErrorRetry
  }
)
```

### `SWRConfig`

A context to provide global configurations for SWR.

```js
import useSWR, { SWRConfig } from '@zeit/swr'

function App () {
  return <SWRConfig value={{ refreshInterval: 1000 }}>
    <Profile/>
  </SWRConfig>
}

function Profile () {
  const { data, error } = useSWR('/api/user', fetch)
  // ...all the SWRs inside will use `refreshInterval: 1000`
  // automatically.

  // ...
}
```

### `mutate`

With `mutate`, you can update your local data programmatically, while
revalidating and finally replace it.

```js
import useSWR, { mutate } from '@zeit/swr'

function Profile () {
  const { data } = useSWR('/api/user', fetch)

  return <div>
    <h1>My name is {data.name}.</h1>
    <button onClick={async () => {
      const newName = data.name.toUpperCase()
      // send a request to the API to update the data
      await requestUpdateUsername(newName)
      // update the local data immediately and revalidate (refetch)
      mutate('/api/user', { ...data, name: newName })
    }}>Uppercase my name!</button>
  </div>
}
```

### `trigger`

You can broadcast a revalidation message to all SWR data inside any component by calling
`trigger(key)`.

```js
import useSWR, { trigger } from '@zeit/swr'

function App () {
  return <div>
    <Profile />
    <button onClick={() => {
      // set the cookie as expired
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      // tell all SWRs with this key to revalidate
      trigger('/api/user')
    }}>
      Logout
    </button>
  </div>
}
```

### `Suspense`

You can enable the `suspense` option to use `useSWR` with React Suspense.

```js
import { Suspense } from 'react'
import useSWR from '@zeit/swr'

function Profile () {
  const { data } = useSWR('/api/user', fetch, { suspense: true })
  return <div>hello, {data.name}</div>
}

function App () {
  return <Suspense fallback={<div>loading...</div>}>
    <Profile/>
  </Suspense>
}
```

## Authors
- Shu Ding ([@shuding_](https://twitter.com/shuding_)) – [ZEIT](https://zeit.co)
- Guillermo Rauch ([@rauchg](https://twitter.com/rauchg)) – [ZEIT](https://zeit.co)
- Joe Haddad ([@timer150](https://twitter.com/timer150)) - [ZEIT](https://zeit.co)
- Paco Coursey ([@pacocoursey](https://twitter.com/pacocoursey)) - [ZEIT](https://zeit.co)

## License
The MIT License.
