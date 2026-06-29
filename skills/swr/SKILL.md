---
name: swr
description: >
  SWR (stale-while-revalidate) data fetching for React. Use when working with
  SWR hooks (useSWR, useSWRMutation, useSWRInfinite, useSWRSubscription,
  useSWRImmutable), configuring SWR providers, implementing data fetching
  patterns, mutations, optimistic UI, infinite loading, pagination, prefetching,
  polling, SSR/Next.js integration, caching, middleware, error handling, or
  debugging SWR behavior (stale data, unexpected revalidation, hydration issues).
  Also use for migrating between SWR versions.
---

# SWR

React Hooks for data fetching with built-in caching, revalidation, focus tracking, and request deduplication.

## Quick Reference

```tsx
import useSWR from 'swr'                           // Core hook
import useSWRMutation from 'swr/mutation'           // Remote mutations
import useSWRInfinite from 'swr/infinite'           // Pagination / infinite loading
import useSWRImmutable from 'swr/immutable'         // Never-revalidate data
import useSWRSubscription from 'swr/subscription'   // Realtime subscriptions
import { SWRConfig, useSWRConfig, mutate, preload, unstable_serialize } from 'swr'
```

## Core Usage

```tsx
const fetcher = (url: string) => fetch(url).then(r => r.json())

// Basic
const { data, error, isLoading, isValidating, mutate } = useSWR<User>('/api/user', fetcher)

// Conditional (pass null to skip)
const { data } = useSWR(userId ? `/api/users/${userId}` : null, fetcher)

// Mutation
const { trigger, isMutating } = useSWRMutation('/api/todos', (url, { arg }: { arg: Todo }) =>
  fetch(url, { method: 'POST', body: JSON.stringify(arg) }).then(r => r.json())
)

// Optimistic update
await mutate(
  fetch('/api/todos', { method: 'POST', body: JSON.stringify(todo) }),
  { optimisticData: [...data, todo], rollbackOnError: true, revalidate: false }
)

// Infinite
const { data, size, setSize } = useSWRInfinite(
  (i, prev) => prev?.length === 0 ? null : `/api/posts?page=${i}`,
  fetcher
)
```

## Key Concepts

- **Key**: unique string, array, or object identifying data. Pass `null`/`undefined`/`false` to disable fetching
- **Deduplication**: identical keys within 2s share one request
- **Revalidation**: automatic on focus, reconnect, mount, and interval
- **Cache**: shared across components using same key. Customize via `SWRConfig` provider
- **isLoading vs isValidating**: `isLoading` = first load (no data), `isValidating` = any in-flight request

## SWRConfig Provider

```tsx
<SWRConfig value={{
  fetcher,
  revalidateOnFocus: true,
  dedupingInterval: 2000,
  fallback: { '/api/user': serverData },
}}>
  <App />
</SWRConfig>
```

## Detailed References

- **Full API (hooks, config, types, cache)**: See [references/api.md](references/api.md)
- **Common patterns (SSR, infinite scroll, optimistic UI, middleware, custom hooks)**: See [references/patterns.md](references/patterns.md)
- **Troubleshooting & migration**: See [references/troubleshooting.md](references/troubleshooting.md)
