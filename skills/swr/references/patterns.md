# SWR Common Patterns

## Table of Contents

- [Data Fetching](#data-fetching)
- [Mutations & Optimistic UI](#mutations--optimistic-ui)
- [Infinite Loading & Pagination](#infinite-loading--pagination)
- [Prefetching & Preloading](#prefetching--preloading)
- [SSR & Next.js Integration](#ssr--nextjs-integration)
- [Subscriptions & Realtime](#subscriptions--realtime)
- [Custom Hooks](#custom-hooks)
- [Middleware](#middleware)
- [Error Handling](#error-handling)
- [Performance Patterns](#performance-patterns)

## Data Fetching

### Basic fetch

```tsx
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function Profile() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher)

  if (error) return <div>Failed to load</div>
  if (isLoading) return <div>Loading...</div>
  return <div>{data.name}</div>
}
```

### Conditional fetching

```tsx
// Fetch only when user exists
const { data } = useSWR(user ? `/api/user/${user.id}` : null, fetcher)

// Function key for derived conditions
const { data } = useSWR(() => `/api/user/${user.id}/posts`, fetcher)
// Throws if user is undefined, SWR catches and pauses
```

### Multiple arguments

```tsx
const { data } = useSWR(
  ['/api/user', id, token],
  ([url, userId, authToken]) =>
    fetch(`${url}/${userId}`, { headers: { Authorization: authToken } }).then(r => r.json())
)
```

### Global fetcher

```tsx
<SWRConfig value={{ fetcher: (url: string) => fetch(url).then(r => r.json()) }}>
  <App />
</SWRConfig>

// Now omit fetcher from individual hooks
const { data } = useSWR('/api/user')
```

### Axios

```tsx
import axios from 'axios'

const fetcher = (url: string) => axios.get(url).then(res => res.data)
const { data } = useSWR('/api/user', fetcher)
```

### Polling

```tsx
const { data } = useSWR('/api/realtime', fetcher, {
  refreshInterval: 1000, // Poll every second
})

// Dynamic interval based on data
const { data } = useSWR('/api/data', fetcher, {
  refreshInterval: (data) => (data?.isActive ? 1000 : 5000),
})
```

## Mutations & Optimistic UI

### Bound mutate (revalidation)

```tsx
const { data, mutate } = useSWR('/api/todos', fetcher)

async function addTodo(text: string) {
  await fetch('/api/todos', { method: 'POST', body: JSON.stringify({ text }) })
  mutate() // Revalidate
}
```

### Optimistic update

```tsx
const { data, mutate } = useSWR('/api/todos', fetcher)

async function addTodo(newTodo: Todo) {
  await mutate(
    fetch('/api/todos', { method: 'POST', body: JSON.stringify(newTodo) }).then(r => r.json()),
    {
      optimisticData: [...(data ?? []), newTodo],
      rollbackOnError: true,
      populateCache: (result, current) => [...(current ?? []), result],
      revalidate: false,
    }
  )
}
```

### useSWRMutation for remote mutations

```tsx
import useSWRMutation from 'swr/mutation'

async function createTodo(url: string, { arg }: { arg: { text: string } }) {
  return fetch(url, { method: 'POST', body: JSON.stringify(arg) }).then(r => r.json())
}

function TodoForm() {
  const { trigger, isMutating } = useSWRMutation('/api/todos', createTodo)

  return (
    <button
      disabled={isMutating}
      onClick={() => trigger({ text: 'New todo' })}
    >
      Add
    </button>
  )
}
```

### Optimistic mutation with useSWRMutation

```tsx
const { trigger } = useSWRMutation('/api/todos', createTodo, {
  optimisticData: (current) => [...(current ?? []), optimisticTodo],
  rollbackOnError: true,
})
```

### Global mutate

```tsx
import { mutate } from 'swr'

// Revalidate all keys matching a pattern
mutate(key => typeof key === 'string' && key.startsWith('/api/todos'))

// Update specific key from anywhere
mutate('/api/user', newUserData)
```

## Infinite Loading & Pagination

### Basic infinite list

```tsx
import useSWRInfinite from 'swr/infinite'

const PAGE_SIZE = 10

function Posts() {
  const getKey = (pageIndex: number, previousPageData: Post[] | null) => {
    if (previousPageData && previousPageData.length === 0) return null // End
    return `/api/posts?page=${pageIndex}&limit=${PAGE_SIZE}`
  }

  const { data, size, setSize, isLoading, isValidating } = useSWRInfinite(getKey, fetcher)

  const posts = data ? data.flat() : []
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0]?.length === 0
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE)

  return (
    <>
      {posts.map(post => <Post key={post.id} {...post} />)}
      <button
        disabled={isLoadingMore || isReachingEnd}
        onClick={() => setSize(size + 1)}
      >
        Load More
      </button>
    </>
  )
}
```

### Infinite scroll with IntersectionObserver

```tsx
const ref = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (!ref.current) return
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !isReachingEnd && !isValidating) {
      setSize(s => s + 1)
    }
  })
  observer.observe(ref.current)
  return () => observer.disconnect()
}, [isReachingEnd, isValidating, setSize])

return (
  <>
    {posts.map(post => <Post key={post.id} {...post} />)}
    <div ref={ref} />
  </>
)
```

### Parallel fetching

```tsx
const { data } = useSWRInfinite(getKey, fetcher, {
  parallel: true, // Fetch all pages simultaneously on revalidation
})
```

## Prefetching & Preloading

### preload API

```tsx
import { preload } from 'swr'

// Preload before render
preload('/api/user', fetcher)

function App() {
  const { data } = useSWR('/api/user', fetcher) // Uses preloaded data
}
```

### Prefetch on hover

```tsx
function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      onMouseEnter={() => preload(href, fetcher)}
    >
      {children}
    </a>
  )
}
```

### Prefetch related data

```tsx
const { data: user } = useSWR('/api/user', fetcher)

useEffect(() => {
  if (user) preload(`/api/user/${user.id}/posts`, fetcher)
}, [user])
```

## SSR & Next.js Integration

### App Router (Server Components)

```tsx
// app/page.tsx
import { SWRConfig, unstable_serialize } from 'swr'

export default async function Page() {
  const data = await fetch('https://api.example.com/user').then(r => r.json())

  return (
    <SWRConfig value={{ fallback: { [unstable_serialize('/api/user')]: data } }}>
      <Profile />
    </SWRConfig>
  )
}
```

### Pages Router (getServerSideProps)

```tsx
export async function getServerSideProps() {
  const data = await fetchUser()
  return { props: { fallback: { '/api/user': data } } }
}

export default function Page({ fallback }: { fallback: Record<string, unknown> }) {
  return (
    <SWRConfig value={{ fallback }}>
      <Profile />
    </SWRConfig>
  )
}
```

### Per-hook fallback

```tsx
const { data } = useSWR('/api/user', fetcher, {
  fallbackData: serverData,
})
```

## Subscriptions & Realtime

### WebSocket

```tsx
import useSWRSubscription from 'swr/subscription'

function LivePrice({ symbol }: { symbol: string }) {
  const { data } = useSWRSubscription(`price-${symbol}`, (key, { next }) => {
    const ws = new WebSocket(`wss://stream.example.com/${symbol}`)
    ws.onmessage = (e) => next(null, JSON.parse(e.data))
    ws.onerror = (e) => next(e as Error)
    return () => ws.close()
  })

  return <span>{data?.price}</span>
}
```

### EventSource (SSE)

```tsx
const { data } = useSWRSubscription('/api/events', (key, { next }) => {
  const es = new EventSource(key)
  es.onmessage = (e) => next(null, JSON.parse(e.data))
  es.onerror = (e) => next(e as Error)
  return () => es.close()
})
```

## Custom Hooks

Wrap useSWR in domain-specific hooks:

```tsx
function useUser(id: string) {
  return useSWR<User>(`/api/users/${id}`, fetcher)
}

function usePosts(userId: string) {
  return useSWR<Post[]>(userId ? `/api/users/${userId}/posts` : null, fetcher)
}

function useInfinitePosts(userId: string) {
  return useSWRInfinite<Post[]>(
    (index, prev) => {
      if (prev && prev.length === 0) return null
      return `/api/users/${userId}/posts?page=${index}`
    },
    fetcher
  )
}
```

## Middleware

### Structure

```tsx
import type { Middleware } from 'swr'

const myMiddleware: Middleware = (useSWRNext) => (key, fetcher, config) => {
  // Before hook logic
  const swr = useSWRNext(key, fetcher, config)
  // After hook logic
  return swr
}

// Usage
const { data } = useSWR(key, fetcher, { use: [myMiddleware] })
```

### Logger middleware

```tsx
const logger: Middleware = (useSWRNext) => (key, fetcher, config) => {
  const swr = useSWRNext(key, fetcher, config)
  useEffect(() => {
    console.log('SWR:', key, swr.data)
  }, [key, swr.data])
  return swr
}
```

### Serialize keys middleware

```tsx
const serialize: Middleware = (useSWRNext) => (key, fetcher, config) => {
  const serializedKey = Array.isArray(key) ? JSON.stringify(key) : key
  return useSWRNext(serializedKey, fetcher, config)
}
```

## Error Handling

### Basic error handling

```tsx
const { data, error } = useSWR(key, fetcher)
if (error) return <ErrorComponent error={error} />
```

### Custom retry

```tsx
const { data } = useSWR(key, fetcher, {
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    if (error.status === 404) return // Don't retry 404s
    if (retryCount >= 3) return      // Max 3 retries
    setTimeout(() => revalidate({ retryCount }), 5000)
  },
})
```

### Global error handler

```tsx
<SWRConfig value={{
  onError: (error, key) => {
    if (error.status !== 403 && error.status !== 404) {
      reportError(error, key)
    }
  }
}}>
  <App />
</SWRConfig>
```

## Performance Patterns

### Deduplication

SWR deduplicates requests with the same key within `dedupingInterval` (default 2s). Multiple components using the same key share one request.

### Keep previous data

```tsx
const { data } = useSWR(searchKey, fetcher, {
  keepPreviousData: true, // Show old data while fetching new key
})
```

### Immutable data

```tsx
import useSWRImmutable from 'swr/immutable'

// Never revalidates — use for static data
const { data } = useSWRImmutable('/api/config', fetcher)
```

### Suspense

```tsx
import { Suspense } from 'react'

function Profile() {
  const { data } = useSWR('/api/user', fetcher, { suspense: true })
  return <div>{data.name}</div> // data is guaranteed
}

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Profile />
    </Suspense>
  )
}
```

### Custom cache provider

```tsx
<SWRConfig value={{
  provider: () => {
    const map = new Map(JSON.parse(localStorage.getItem('swr-cache') || '[]'))
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('swr-cache', JSON.stringify([...map.entries()]))
    })
    return map
  }
}}>
  <App />
</SWRConfig>
```

### Pausing revalidation

```tsx
const { data } = useSWR(key, fetcher, {
  isPaused: () => !isOnline, // Pause when offline
})
```
