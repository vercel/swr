# SWR Troubleshooting

## Table of Contents

- [Unexpected Revalidation](#unexpected-revalidation)
- [Stale or Missing Data](#stale-or-missing-data)
- [Infinite Loops](#infinite-loops)
- [SSR Issues](#ssr-issues)
- [TypeScript Issues](#typescript-issues)
- [Performance Issues](#performance-issues)
- [Migration from v1 to v2](#migration-from-v1-to-v2)

## Unexpected Revalidation

### Data refetches when switching tabs

SWR revalidates on focus by default. Disable with:

```tsx
useSWR(key, fetcher, { revalidateOnFocus: false })
// Or globally
<SWRConfig value={{ revalidateOnFocus: false }}>
```

### Data refetches on component mount

SWR revalidates when a component using a cached key mounts. Control with:

```tsx
useSWR(key, fetcher, { revalidateOnMount: false })  // Skip mount revalidation
useSWR(key, fetcher, { revalidateIfStale: false })   // Skip if data exists
```

Or use `useSWRImmutable` for data that never needs revalidation.

### Multiple identical requests

SWR deduplicates within `dedupingInterval` (2s default). If you see duplicates:

- Check that keys are stable (no new object/array references each render)
- Increase `dedupingInterval` if needed

### Revalidation after mutation

`mutate()` revalidates by default. Pass `{ revalidate: false }` to skip:

```tsx
mutate(key, newData, { revalidate: false })
```

## Stale or Missing Data

### Data is undefined after mutation

Ensure `populateCache` is configured correctly:

```tsx
mutate(key, newData, {
  populateCache: true,    // Boolean: replace cache with mutation result
  revalidate: false,      // Skip revalidation if cache is already correct
})
```

### Cache not shared between components

Components must use the same serialized key. Object/array keys are compared by value via `stableHash`, but function keys must return the same value:

```tsx
// These share cache (same serialized key):
useSWR('/api/user', fetcher)
useSWR('/api/user', fetcher)

// These also share cache:
useSWR(['/api', 'user'], fetcher)
useSWR(['/api', 'user'], fetcher)
```

### keepPreviousData shows wrong data

`keepPreviousData` keeps the last resolved data while a new key is loading. Clear it by setting the key to `null` first if needed.

## Infinite Loops

### Hook called in a loop

Never construct new object/array keys inline without memoization:

```tsx
// BAD: New array reference every render → infinite revalidation
useSWR(['/api', { id }], fetcher)

// GOOD: Stable key
useSWR(`/api?id=${id}`, fetcher)

// GOOD: Array with primitives only
useSWR(['/api', id], fetcher)
```

### Mutation triggers rerender loop

Avoid calling `mutate()` during render. Use it in event handlers or effects:

```tsx
// BAD
function Component() {
  const { data, mutate } = useSWR(key, fetcher)
  if (data?.needsUpdate) mutate() // Loop!

  // GOOD
  useEffect(() => {
    if (data?.needsUpdate) mutate()
  }, [data?.needsUpdate])
}
```

## SSR Issues

### Hydration mismatch

Use `fallbackData` or `SWRConfig.fallback` to provide server data:

```tsx
// Per-hook
useSWR(key, fetcher, { fallbackData: serverData })

// Provider-level
<SWRConfig value={{ fallback: { [key]: serverData } }}>
```

### Data fetched twice (server + client)

This is expected — SWR revalidates on mount by default to ensure freshness. Suppress with:

```tsx
useSWR(key, fetcher, { revalidateOnMount: false })
```

Or use `useSWRImmutable` for static data.

### Key serialization for SSR fallback

Use `unstable_serialize` to match keys in fallback maps:

```tsx
import { unstable_serialize } from 'swr'
import { unstable_serialize as unstable_serialize_infinite } from 'swr/infinite'

const fallback = {
  [unstable_serialize('/api/user')]: userData,
  [unstable_serialize_infinite((i) => `/api/posts?page=${i}`)]: [postsData],
}
```

## TypeScript Issues

### Typing the fetcher

```tsx
// Typed fetcher function
const fetcher = (url: string): Promise<User> => fetch(url).then(r => r.json())

// Or type the hook
const { data } = useSWR<User, Error>('/api/user', fetcher)
```

### Typing useSWRMutation

```tsx
const { trigger } = useSWRMutation<
  Todo,         // Return type
  Error,        // Error type
  string,       // Key type
  { text: string }  // Arg type
>('/api/todos', createTodo)
```

### Typing useSWRInfinite

```tsx
const { data } = useSWRInfinite<Post[]>(
  (index, prev) => prev && !prev.length ? null : `/api/posts?page=${index}`,
  fetcher
)
// data is Post[][] | undefined
```

## Performance Issues

### Too many rerenders

SWR only triggers rerenders for state properties you access (tracked via Proxy). If you see excessive rerenders:

1. Only destructure what you need: `const { data } = useSWR(...)` won't rerender on `isValidating` changes
2. Use `compare` option for custom equality checks
3. Ensure keys are stable

### Large data sets

For large cached datasets:

- Use a custom `compare` function to avoid deep equality checks
- Consider a custom cache provider for persistent storage
- Use `keepPreviousData` to avoid layout shifts

### Deduplication not working

Ensure keys serialize to the same string. Use `stableHash` behavior:

- Primitive keys: compared by value
- Object keys: compared by sorted key-value pairs
- Array keys: compared element by element

## Migration from v1 to v2

### Key changes

| v1 | v2 |
|---|---|
| `useSWR(key, fn, { initialData })` | `useSWR(key, fn, { fallbackData })` |
| `revalidateOnMount` implicit | `revalidateOnMount` explicit |
| `mutate(key, data, shouldRevalidate)` | `mutate(key, data, { revalidate: bool })` |
| `SWRConfig.value.dedupingInterval` | Same, default changed from 2000ms |
| Return: `{ data, error, isValidating }` | Return: `{ data, error, isValidating, isLoading }` |
| Fetcher gets spread args | Fetcher gets single arg or tuple |
| `import { cache }` | `import { useSWRConfig }` then `config.cache` |
| No mutation hook | `useSWRMutation` from `swr/mutation` |
| No subscription hook | `useSWRSubscription` from `swr/subscription` |
| No immutable hook | `useSWRImmutable` from `swr/immutable` |

### Fetcher argument changes (v1 → v2)

```tsx
// v1: arguments spread
useSWR(['/api', id], (url, id) => fetch(`${url}/${id}`))

// v2: single tuple argument
useSWR(['/api', id], ([url, id]) => fetch(`${url}/${id}`))
```

### initialData → fallbackData

```tsx
// v1
useSWR(key, fetcher, { initialData: data })

// v2
useSWR(key, fetcher, { fallbackData: data })
```
