[![SWR](https://assets.zeit.co/image/upload/v1572289618/swr/banner.png)](https://swr.now.sh)

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

## Introduction

[swr.now.sh](https://swr.now.sh)

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

...and a lot more.

With SWR, components will get **a stream of data updates constantly and automatically**. Thus, the UI will be always **fast** and **reactive**.

## Quick Start

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
`key` is a unique identifier of the request, normally the URL of the API. And the `fetcher` accepts
`key` as its parameter and returns the data asynchronously.

`useSWR` also returns 2 values: `data` and `error`. When the request (fetcher) is not yet finished,
`data` will be `undefined`. And when we get a response, it sets `data` and `error` based on the result
of `fetcher` and rerenders the component.

Note that `fetcher` can be any asynchronous function, so you can use your favourite data-fetching
library to handle that part.

Check out [swr.now.sh](https://swr.now.sh) for more demos of SWR.

## Usage

Inside your React project directory, run the following:

```
yarn add swr
```

Or with npm:

```
npm install swr
```

### API

```js
const { data, error, isValidating, revalidate } = useSWR(key, fetcher, options)
```

#### Parameters

- `key`: a unique key string for the request (or a function / null) [(advanced usage)](#conditional-fetching)  
- `fetcher`: (_optional_) a Promise returning function to fetch your data [(details)](#data-fetching) 
- `options`: (_optional_) an object of options for this SWR hook

#### Return Values
- `data`: data for the given key resolved by `fetcher` (or undefined if not loaded)  
- `error`: error thrown by `fetcher` (or undefined)  
- `isValidating`: if there's a request or revalidation loading  
- `revalidate`: function to trigger the validation manually

#### Options

- `suspense = false`: enable React Suspense mode [(details)](#suspense-mode)
- `fetcher = undefined`: the default fetcher function
- `revalidateOnFocus = true`: auto revalidate when window gets focused
- `refreshInterval = 0`: polling interval (disabled by default)
- `refreshWhenHidden = false`: polling when the window is invisible (if `refreshInterval` is enabled)
- `shouldRetryOnError = true`: retry when fetcher has an error [(details)](#error-retries)
- `dedupingInterval = 2000`: dedupe requests with the same key in this time span
- `focusThrottleInterval = 5000`: only revalidate once during a time span
- `loadingTimeout = 3000`: timeout to trigger the onLoadingSlow event
- `errorRetryInterval = 5000`: error retry interval [(details)](#error-retries)
- `onLoadingSlow`: callback function when a request takes too long to load (`loadingTimeout`)
- `onSuccess`: callback function when a request finishs successfully
- `onError`: callback function when a request returns an error
- `onErrorRetry`: handler for [error retry](#error-retries)

When under a slow network (2G, <= 70Kbps), `errorRetryInterval` will be 10s, and
`loadingTimeout` will be 5s by default.

You can also use [global configuration](#global-configuration) to provide default options.

## Examples

- [Global Configuration](#global-configuration)
- [Data Fetching](#data-fetching)
- [Conditional Fetching](#conditional-fetching)
- [Dependent Fetching](#dependent-fetching)
- [Manually Revalidate](#manually-revalidate)
- [Local Mutation](#local-mutation)
- [Suspense Mode](#suspense-mode)
- [Error Retries](#error-retries)

### Global Configuration

You can use `SWRConfig` to provide global configurations (`options`) for all SWR hooks. 

In this example, all `useSWR` hooks will use the same fetcher provided to load JSON data, and refresh every 3 seconds (except the user API):

```js
import useSWR, { SWRConfig } from 'swr'

function Dashboard () {
  const { data: events } = useSWR('/api/events')
  const { data: projects } = useSWR('/api/projects')
  const { data: user } = useSWR('/api/user', { refreshInterval: 0 })
  // ...
}

function App () {
  return (
    <SWRConfig 
      value={{
        refreshInterval: 3000,
        fetcher: (...args) => fetch(...args).then(res => res.json())
      }}
    >
      <Dashboard />
    </SWRConfig>
  )
}
```

### Data Fetching

`fetcher` is a function **accepts the `key`** of SWR, and returns a value or a Promise.  
You can use any library you to handle data fetching, for example:

```js
import fetch from 'unfetch'

const fetcher = url => fetch(url).then(r => r.json())

function App () {
  const { data } = useSWR('/api/data', fetcher)
  // ...
}
```

Or using GraphQL:
```js
import { request } from 'graphql-request'

const API = 'https://api.graph.cool/simple/v1/movies'
const fetcher = query => request(API, query)

function App () {
  const { data, error } = useSWR(
    `{
      Movie(title: "Inception") {
        releaseDate
        actors {
          name
        }
      }
    }`,
    fetcher
  )
  // ...
}
```

Note that `fetcher` can be skipped from the parameters if it's provided gloablly.

### Conditional Fetching

Use `null` or pass a function as the `key` to `useSWR` to conditionally fetch data. If the functions throws an error or returns a falsy value, SWR will cancel the request.

```js
// conditionally fetch
const { data } = useSWR(shouldFetch ? '/api/data' : null, fetcher)

// ...or return a falsy value
const { data } = useSWR(() => shouldFetch ? '/api/data' : null, fetcher)

// ... or throw an error when user.id is not defined
const { data } = useSWR(() => '/api/data?uid=' + user.id, fetcher)
```

### Dependent Fetching

SWR also allows you to fetch data that depends on other data. It ensures the maximum possible parallelism (avoiding waterfalls), as well as serial fetching when a piece of dynamic data is required for the next data fetch to happen.

```js
function MyProjects () {
  const { data: user } = useSWR('/api/user')
  const { data: projects } = useSWR(() => '/api/projects?uid=' + user.id)
  // When passing a function, SWR will use the
  // return value as `key`. If the function throws,
  // SWR will know that some dependencies are not
  // ready. In this case it is `user`.

  if (!projects) return 'loading...'
  return 'You have ' + projects.length + ' projects'
}
```

### Manually Revalidate

You can broadcast a revalidation message to all SWR data inside any component by calling
`trigger(key)`.

This example shows how to automatically refetch the login info (e.g.: inside `<Profile/>`) 
when the user clicks the “Logout” button.

```js
import useSWR, { trigger } from 'swr'

function App () {
  return (
    <div>
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
  )
}
```

### Local Mutation

In many cases, applying local mutations to data is a good way to make changes
feel faster — no need to wait for the remote source of data.

With `mutate`, you can update your local data programmatically, while
revalidating and finally replace it with the latest data.

```js
import useSWR, { mutate } from 'swr'

function Profile () {
  const { data } = useSWR('/api/user', fetcher)

  return (
    <div>
      <h1>My name is {data.name}.</h1>
      <button onClick={async () => {
        const newName = data.name.toUpperCase()
        // send a request to the API to update the data
        await requestUpdateUsername(newName)
        // update the local data immediately and revalidate (refetch)
        mutate('/api/user', { ...data, name: newName })
      }}>Uppercase my name!</button>
    </div>
  )
}
```

### Suspense Mode

You can enable the `suspense` option to use SWR with React Suspense:

```js
import { Suspense } from 'react'
import useSWR from 'swr'

function Profile () {
  const { data } = useSWR('/api/user', fetcher, { suspense: true })
  return <div>hello, {data.name}</div>
}

function App () {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <Profile/>
    </Suspense>
  )
}
```

Note in Suspense mode, `data` is always the fetch response (so you don't need to check if it's `undefined`). But if there's an error occurred, you need to use an [error boundary](https://reactjs.org/docs/concurrent-mode-suspense.html#handling-errors) to catch it.

### Error Retries

By default, SWR uses the [exponential backoff algorithm](https://en.wikipedia.org/wiki/Exponential_backoff) to handle error retries.
You can read more from the source code.

It's also possible to override the behavior:

```js
useSWR(key, fetcher, {
  onErrorRetry: (error, key, option, revalidate, { retryCount }) => {
    if (retryCount >= 10) return
    if (error.status === 404) return

    // retry after 5 seconds
    setTimeout(() => revalidate({ retryCount: retryCount + 1 }), 5000)
  }
})
```

## Authors
- Shu Ding ([@shuding_](https://twitter.com/shuding_)) – [ZEIT](https://zeit.co)
- Guillermo Rauch ([@rauchg](https://twitter.com/rauchg)) – [ZEIT](https://zeit.co)
- Joe Haddad ([@timer150](https://twitter.com/timer150)) - [ZEIT](https://zeit.co)
- Paco Coursey ([@pacocoursey](https://twitter.com/pacocoursey)) - [ZEIT](https://zeit.co)

Thanks to Ryan Chen for providing the awesome `swr` npm package name!

## License
The MIT License.
