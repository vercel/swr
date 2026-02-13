# SWR API Reference

## Table of Contents

- [Hooks](#hooks)
- [Configuration Options](#configuration-options)
- [Mutation Options](#mutation-options)
- [Infinite Configuration](#infinite-configuration)
- [Key Types](#key-types)
- [Response Types](#response-types)
- [Cache API](#cache-api)
- [Utility Functions](#utility-functions)

## Hooks

### useSWR

```tsx
import useSWR from 'swr'
const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetcher?, config?)
```

**Overloads:** key only, key + fetcher, key + config, key + fetcher + config.

### useSWRMutation

```tsx
import useSWRMutation from 'swr/mutation'
const { trigger, data, error, isMutating, reset } = useSWRMutation(key, fetcher, options?)
```

`trigger(arg?, options?)` — invoke the mutation. `arg` is passed as `{ arg }` to the fetcher's second parameter.

Fetcher signature: `(key, { arg }) => Promise<Data>`

### useSWRInfinite

```tsx
import useSWRInfinite from 'swr/infinite'
const { data, size, setSize, mutate, isLoading, isValidating } = useSWRInfinite(getKey, fetcher?, config?)
```

`getKey(pageIndex, previousPageData)` — return null to stop fetching. `data` is an array of page results. `size` / `setSize` control page count.

### useSWRSubscription

```tsx
import useSWRSubscription from 'swr/subscription'
const { data, error } = useSWRSubscription(key, (key, { next }) => {
  // subscribe and call next(err, data) on updates
  return () => { /* cleanup */ }
}, config?)
```

### useSWRImmutable

```tsx
import useSWRImmutable from 'swr/immutable'
const { data } = useSWRImmutable(key, fetcher?)
```

Shorthand for `useSWR` with `revalidateIfStale: false`, `revalidateOnFocus: false`, `revalidateOnReconnect: false`.

### useSWRConfig

```tsx
import { useSWRConfig } from 'swr'
const { mutate, cache, ...config } = useSWRConfig()
```

Access the global SWR configuration, cache, and scoped mutate function.

## Configuration Options

### SWRConfiguration

| Option | Type | Default | Description |
|---|---|---|---|
| `fetcher` | `BareFetcher` | — | Default fetcher function |
| `revalidateOnFocus` | `boolean` | `true` | Revalidate when window gains focus |
| `revalidateOnReconnect` | `boolean` | `true` | Revalidate on network recovery |
| `revalidateOnMount` | `boolean` | `undefined` | Revalidate when component mounts |
| `revalidateIfStale` | `boolean` | `true` | Revalidate if data is stale |
| `refreshInterval` | `number \| ((data) => number)` | `0` | Polling interval in ms (0 = disabled) |
| `refreshWhenHidden` | `boolean` | `false` | Poll when page is hidden |
| `refreshWhenOffline` | `boolean` | `false` | Poll when offline |
| `shouldRetryOnError` | `boolean \| ((err) => boolean)` | `true` | Retry on error |
| `errorRetryCount` | `number` | `undefined` | Max retry count |
| `errorRetryInterval` | `number` | `5000` | Retry interval in ms |
| `dedupingInterval` | `number` | `2000` | Dedup requests within this window |
| `focusThrottleInterval` | `number` | `5000` | Throttle focus revalidation |
| `loadingTimeout` | `number` | `3000` | Timeout before `onLoadingSlow` fires |
| `suspense` | `boolean` | `false` | Enable React Suspense mode |
| `fallbackData` | `Data` | — | Initial data (per-hook) |
| `fallback` | `Record<string, any>` | `{}` | Fallback data map (provider-level) |
| `keepPreviousData` | `boolean` | `false` | Keep previous data when key changes |
| `isPaused` | `() => boolean` | `() => false` | Pause all revalidation |
| `compare` | `(a, b) => boolean` | `dequal` | Custom comparison function |
| `use` | `Middleware[]` | — | Middleware array |
| `provider` | `(cache) => Cache` | — | Custom cache provider |
| `onSuccess` | `(data, key, config) => void` | — | Success callback |
| `onError` | `(err, key, config) => void` | — | Error callback |
| `onErrorRetry` | `(err, key, config, revalidate, opts) => void` | — | Custom retry logic |
| `onLoadingSlow` | `(key, config) => void` | — | Slow loading callback |
| `onDiscarded` | `(key) => void` | — | Request discarded callback |

## Mutation Options

### MutatorOptions (bound mutate)

| Option | Type | Default | Description |
|---|---|---|---|
| `revalidate` | `boolean \| ((data, key) => boolean)` | `true` | Revalidate after mutation |
| `populateCache` | `boolean \| ((result, current) => Data)` | `true` | Update cache with result |
| `optimisticData` | `Data \| ((current, displayed) => Data)` | — | Optimistic UI data |
| `rollbackOnError` | `boolean \| ((err) => boolean)` | `true` | Rollback on error |
| `throwOnError` | `boolean` | `false` | Throw instead of returning error |

### SWRMutationConfiguration (useSWRMutation)

Same as MutatorOptions plus `onSuccess` and `onError` callbacks.

## Infinite Configuration

Extends SWRConfiguration with:

| Option | Type | Default | Description |
|---|---|---|---|
| `initialSize` | `number` | `1` | Initial number of pages |
| `revalidateAll` | `boolean` | `false` | Revalidate all pages |
| `persistSize` | `boolean` | `false` | Keep size on key change |
| `revalidateFirstPage` | `boolean` | `true` | Revalidate first page on mutation |
| `parallel` | `boolean` | `false` | Fetch pages in parallel |

## Key Types

```tsx
// Key can be string, array, object, or null/undefined/false to disable
type Key = Arguments | (() => Arguments)
type Arguments = string | readonly [any, ...unknown[]] | Record<any, any> | null | undefined | false
```

**Conditional fetching:** pass `null`, `undefined`, or `false` to skip the request.

**Function keys:** `() => condition ? '/api/data' : null` — re-evaluated on render.

**Array keys:** `['/api/user', id]` — all elements are passed to the fetcher.

## Response Types

### SWRResponse

```tsx
{
  data: Data | undefined       // Fetched data
  error: Error | undefined     // Error object
  isLoading: boolean           // First load, no data yet
  isValidating: boolean        // Any request in flight
  mutate: KeyedMutator<Data>   // Bound mutate function
}
```

`isLoading` is true only on the initial load (no cached data). `isValidating` is true whenever a request is in flight (including revalidation).

### SWRMutationResponse

```tsx
{
  data: Data | undefined
  error: Error | undefined
  isMutating: boolean
  trigger: (arg?, opts?) => Promise<Data>
  reset: () => void
}
```

### SWRInfiniteResponse

```tsx
extends SWRResponse<Data[]> {
  size: number
  setSize: (size: number | ((size: number) => number)) => Promise<Data[] | undefined>
}
```

## Cache API

```tsx
interface Cache<Data = any> {
  keys(): IterableIterator<string>
  get(key: string): State<Data> | undefined
  set(key: string, value: State<Data>): void
  delete(key: string): void
}
```

Use `provider` option in `SWRConfig` to supply a custom cache:

```tsx
<SWRConfig value={{ provider: () => new Map() }}>
  {children}
</SWRConfig>
```

## Utility Functions

### preload

```tsx
import { preload } from 'swr'
await preload(key, fetcher)
```

Preload data before components mount. Returns the fetcher promise.

### unstable_serialize

```tsx
import { unstable_serialize } from 'swr'           // for useSWR keys
import { unstable_serialize } from 'swr/infinite'   // for useSWRInfinite keys
```

Serialize a key for use in `fallback` maps.

### SWRConfig (Provider)

```tsx
import { SWRConfig } from 'swr'

<SWRConfig value={{ fetcher, dedupingInterval: 5000 }}>
  {children}
</SWRConfig>

// Functional config (access parent)
<SWRConfig value={(parent) => ({ ...parent, fetcher })}>
  {children}
</SWRConfig>
```

### Global mutate

```tsx
import { mutate } from 'swr'

// Mutate specific key
mutate('/api/user', newData, opts?)

// Mutate by filter
mutate(key => key.startsWith('/api/'), newData, opts?)
```
