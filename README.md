[![SWR](https://assets.zeit.co/image/upload/v1572289618/swr/banner.png)](https://swr.now.sh)

<p align="center">
  <a aria-label="ZEIT logo" href="https://github.com/zeit">
    <img src="https://badgen.net/badge/icon/MADE%20BY%20ZEIT?icon=zeit&label&color=black&labelColor=black">
  </a>
  <a aria-label="NPM version" href="https://www.npmjs.com/package/swr">
    <img alt="" src="https://badgen.net/npm/v/swr">
  </a>
  <a aria-label="Package size" href="https://bundlephobia.com/result?p=swr">
    <img alt="" src="https://badgen.net/bundlephobia/minzip/swr">
  </a>
  <a aria-label="License" href="https://github.com/zeit/swr/blob/master/LICENSE">
    <img alt="" src="https://badgen.net/npm/license/swr">
  </a>
</p>

## Introduction

[swr.now.sh](https://swr.now.sh)

SWR is a React Hooks library for remote data fetching.

The name “**SWR**” is derived from `stale-while-revalidate`, a cache invalidation strategy popularized by [HTTP RFC 5861](https://tools.ietf.org/html/rfc5861).  
**SWR** first returns the data from cache (stale), then sends the fetch request (revalidate), and finally comes with the up-to-date data again.

It features:
- Transport and protocol agnostic data fetching
- Fast page navigation
- Revalidation on focus
- Interval polling
- Local mutation
- Pagination
- TypeScript ready
- SSR support
- Suspense mode
- React Native support
- Minimal API

...and a lot more.

With SWR, components will get **a stream of data updates constantly and automatically**. Thus, the UI will be always **fast** and **reactive**.

<br/>

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

<br/>

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

- `key`: a unique key string for the request (or a function / array / null) [(advanced usage)](#conditional-fetching)  
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
- `initialData`: initial data to be returned (note: This is per-hook)
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

<br/>

## Examples

- [Global Configuration](#global-configuration)
- [Data Fetching](#data-fetching)
- [Conditional Fetching](#conditional-fetching)
- [Dependent Fetching](#dependent-fetching)
- [Multiple Arguments](#multiple-arguments)
- [Manually Revalidate](#manually-revalidate)
- [Local Mutation](#local-mutation)
- [SSR with Next.js](#ssr-with-nextjs)
- [Suspense Mode](#suspense-mode)
- [Error Retries](#error-retries)

### Global Configuration

The context `SWRConfig` can provide global configurations (`options`) for all SWR hooks. 

In this example, all SWRs will use the same fetcher provided to load JSON data, and refresh every 3 seconds by default:

```js
import useSWR, { SWRConfig } from 'swr'

function Dashboard () {
  const { data: events } = useSWR('/api/events')
  const { data: projects } = useSWR('/api/projects')
  const { data: user } = useSWR('/api/user', { refreshInterval: 0 }) // don't refresh
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
You can use any library to handle data fetching, for example:

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

_If you want to pass variables to a GraphQL query, check out [Multiple Arguments](#multiple-arguments)._

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

### Multiple Arguments

In some scenarios, it's useful pass multiple arguments (can be any value or object) to the `fetcher` function. For example:

```js
useSWR('/api/data', url => fetchWithToken(url, token))
```

This is **incorrect**. Because the identifier (also the index of the cache) of the data is `'/api/data'`, 
so even if `token` changes, SWR will still have the same key and return the wrong data. 

Instead, you can use an **array** as the `key` parameter, which contains multiple arguments of `fetcher`:

```js
useSWR(['/api/data', token], fetchWithToken)
```

This solves the problem. The key of the request is now the combination of both values. SWR **shallowly** compares
the arguments on every render, and triggers revalidation if any of them has changed.  
Keep in mind that you should not recreate objects when rendering, as they will be treated as different objects on every render:

```js
// Don’t do this! Deps will be changed on every render.
useSWR(['/api/user', { id }], query)

// Make sure objects are stable
const params = useMemo(() => ({ id }), [id])
useSWR(['/api/user', params], query)
```

Dan Abramov explains dependencies very well in [this blog post](https://overreacted.io/a-complete-guide-to-useeffect/#but-i-cant-put-this-function-inside-an-effect).

### Manually Revalidate

You can broadcast a revalidation message globally to all SWRs with the same key by calling
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

### SSR with Next.js

With the `initialData` option, you pass an initial value to the hook. It works perfectly with many SSR solutions
such as `getInitialProps` in [Next.js](https://github.com/zeit/next.js):

```js
App.getInitialProps = async getInitialProps () {
  const data = await fetcher('/api/data')
  return { data }
}

function App (props) {
  const initialData = props.data
  const { data } = useSWR('/api/data', fetcher, { initialData })

  return <div>{data}</div>
}
```

It is still a server-side rendered site, but it’s also fully powered by SWR in the client side. 
Which means the data can be dynamic and update itself over time and user interactions.

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

In Suspense mode, `data` is always the fetch response (so you don't need to check if it's `undefined`). 
But if an error occurred, you need to use an [error boundary](https://reactjs.org/docs/concurrent-mode-suspense.html#handling-errors) to catch it.

_Note that Suspense is not supported in SSR mode._

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

<br/>

## Authors
- Shu Ding ([@shuding_](https://twitter.com/shuding_)) – [ZEIT](https://zeit.co)
- Guillermo Rauch ([@rauchg](https://twitter.com/rauchg)) – [ZEIT](https://zeit.co)
- Joe Haddad ([@timer150](https://twitter.com/timer150)) - [ZEIT](https://zeit.co)
- Paco Coursey ([@pacocoursey](https://twitter.com/pacocoursey)) - [ZEIT](https://zeit.co)

Thanks to Ryan Chen for providing the awesome `swr` npm package name!

<br/>

## License
The MIT License.
