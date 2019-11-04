[![SWR](https://assets.zeit.co/image/upload/v1572289618/swr/banner.png)](https://swr.now.sh)

<p align="center">
  <a aria-label="SWR website" href="https://swr.now.sh">swr.now.sh<a>
</p>

<p align="center">
  <a aria-label="ZEIT logo" href="https://github.com/zeit">
    <img src="https://img.shields.io/badge/MADE%20BY%20ZEIT-000000.svg?logo=ZEIT&labelColor=000000&logoWidth=12">
  </a>
  <a aria-label="NPM version" href="https://www.npmjs.com/package/swr">
    <img alt="" src="https://img.shields.io/npm/v/swr">
  </a>
  <a aria-label="Package size" href="https://bundlephobia.com/result?p=swr">
    <img alt="" src="https://img.shields.io/bundlephobia/minzip/swr">
  </a>
  <a aria-label="License" href="https://github.com/zeit/swr/blob/master/LICENSE">
    <img alt="" src="https://img.shields.io/npm/l/swr">
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

To install, run `yarn add swr` or `npm install swr` in your React project.

```js
import useSWR from 'swr'

function Profile () {
  const { data, error } = useSWR('/api/user', fetcher)

  if (error) return <div>failed to load</div>
  if (!data) return <div>loading...</div>
  return <div>hello {data.name}!</div>
}
```

In this example, the React Hook `useSWR` accepts a `key` and a `fetcher` function.
`key` is a unique identifier of the data, normally a URL of the API. And the `fetcher` accepts
`key` as its parameter and returns the data asynchronously.

`useSWR` also returns 2 values: `data` and `error`. When the request (fetcher) is not yet finished,
`data` will be `undefined`. And when we get a response, it sets `data` and `error` based on the result
of `fetcher` and rerenders the component.

Note that `fetcher` can be any asynchronous function, so you can use your favourite data-fetching
library to handle that part.

---

- API
  - [`useSWR`](#useswr)
  - [`SWRConfig`](#swrconfig)
  - [`mutate`](#mutate)
  - [`trigger`](#trigger)
- Examples
  - [Suspense Mode](#suspense-mode)
  - [Subscription (e.g.: socket.io)](#subscription-eg-socketio)
  - [Dependent Fetching](#dependent-fetching)

## API

### `useSWR`

```js
const {
  data,                                    // data for the given key (or undefined)
  error,                                   // error (or undefined)
  isValidating,                            // if the request is loading
  revalidate                               // function to trigger a validate manually
} = useSWR(
  key,                                     // a unique key for the data (or a function, see below)
  fetcher,                                 // Promise returning function to load your data
  swrOptions? = {
    suspense: false,                       // enabled React Suspense mode
    revalidateOnFocus: true,               // auto revalidate when window gets focused
    refreshWhenHidden: false,              // refresh while the window is invisible
    shouldRetryOnError: true,              // retry when fetcher has an error
    refreshInterval: 0,                    // polling interval (disabled by default)
    errorRetryInterval: 5000,              // error retry interval (10s on slow network)
    focusThrottleInterval: 5000,           // keep focus revalidate requests in a time window
    dedupingInterval: 2000,                // deduping requests
    loadingTimeout: 3000,                  // timeout for triggering the onLoadingSlow event

    onLoadingSlow,                         // event handlers
    onSuccess,
    onError,
    onErrorRetry,

    fetcher                                // default fetcher function
  }
)
```

#### `key` as a function

Pass a function as the `key` to `useSWR` to conditionally fetch data. If the functions throws an error or returns a falsy value, SWR will cancel the request.

```js
// key returns a falsy value
const { data } = useSWR(() => shouldFetch ? '/api/data' : null, fetcher)

// key throws an error when user.id is not defined
const { data } = useSWR(() => '/api/data?uid=' + user.id, fetcher)
```

### `SWRConfig`

A context to provide global configurations (`swrOptions`) for SWR.

```js
import useSWR, { SWRConfig } from 'swr'

function App () {
  // all the SWRs inside will use `refreshInterval: 1000`
  // and the native `fetch` implementation
  return <SWRConfig value={{
    refreshInterval: 1000,
    fetcher: (...args) => fetch(...args).then(res => res.json())
  }}>
    <Profile/>
  </SWRConfig>
}

function Profile () {
  const { data, error } = useSWR('/api/user')
  // ...
}
```

### `mutate`

With `mutate`, you can update your local data programmatically, while
revalidating and finally replace it.

```js
import useSWR, { mutate } from 'swr'

function Profile () {
  const { data } = useSWR('/api/user', fetcher)

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
import useSWR, { trigger } from 'swr'

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

## Examples

### Suspense Mode

You can enable the `suspense` option to use `useSWR` with React Suspense.

```js
import { Suspense } from 'react'
import useSWR from 'swr'

function Profile () {
  const { data } = useSWR('/api/user', fetcher, { suspense: true })
  return <div>hello, {data.name}</div>
}

function App () {
  return <Suspense fallback={<div>loading...</div>}>
    <Profile/>
  </Suspense>
}
```

### Subscription (e.g.: socket.io)

You can use SWR with socket.io (generally any subscription pattern) like this:

```js
// fetch-data.js

import { mutate } from 'swr'

let latestData = null

// setup ws and broadcast to all SWRs
...
socket.on('data', data => {
  latestData = data
  mutate('/api/data', data, false)
})

export default () => latestData
```

and your component:

```js
import useSWR from 'swr'
import fetchData from './fetch-data'

function App () {
  const { data } = useSWR('/api/data', fetchData)
  // ...
}
```

### Dependent Fetching
SWR allows you to fetch data that depends on other data. It ensures the maximum possible parallelism (avoiding waterfalls), as well as serial fetching when a piece of dynamic data is required for the next data fetch to happen.

```js
import useSWR from 'swr'

function MyProjects () {
  const { data: user } = useSWR('/api/user')
  const { data: projects } = useSWR(
    () => '/api/projects?uid=' + user.id
  )
  // When passing a function, SWR will use the
  // return value as `key`. If the function throws,
  // SWR will know that some dependencies are not
  // ready. In this case it is `user`.

  if (!projects) return 'loading...'
  return 'You have ' + projects.length + ' projects'
}
```

## Authors
- Shu Ding ([@shuding_](https://twitter.com/shuding_)) – [ZEIT](https://zeit.co)
- Guillermo Rauch ([@rauchg](https://twitter.com/rauchg)) – [ZEIT](https://zeit.co)
- Joe Haddad ([@timer150](https://twitter.com/timer150)) - [ZEIT](https://zeit.co)
- Paco Coursey ([@pacocoursey](https://twitter.com/pacocoursey)) - [ZEIT](https://zeit.co)

Thanks to Ryan Chen for providing the awesome `swr` npm package name!

## License
The MIT License.
