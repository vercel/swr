# Infinite Loading with Intersection Observer

This example demonstrates how to implement infinite loading using `useSWRInfinite` with `IntersectionObserver` and `useCallback` to prevent infinite loops.

## The Problem

When using `setSize` from `useSWRInfinite` with `IntersectionObserver`, you might encounter an infinite loop because:

1. `setSize` triggers a re-render
2. Re-render recreates the observer callback
3. Observer callback calls `setSize` again
4. This creates an infinite loop

## The Solution

Use `useCallback` to memoize the `loadMore` function and `useRef` to track the observer.

## Complete Example

```jsx
import { useCallback, useRef, useEffect } from 'react'
import useSWRInfinite from 'swr/infinite'

const fetcher = (url) => fetch(url).then((res) => res.json())

function InfiniteList() {
  const {
    data,
    error,
    size,
    setSize,
    isValidating,
  } = useSWRInfinite(
    (index) => `/api/posts?page=${index}`,
    fetcher,
    {
      revalidateFirstPage: false, // Don't revalidate first page on every load
    }
  )

  // Flatten the data array
  const posts = data ? data.flat() : []
  const isLoadingInitialData = !data && !error
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0]?.length === 0
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < 10)
  const isRefreshing = isValidating && data && data.length === size

  // Memoize the loadMore function to prevent infinite loops
  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isReachingEnd) {
      setSize((prev) => prev + 1)
    }
  }, [isLoadingMore, isReachingEnd, setSize])

  // Ref for the intersection observer
  const observerRef = useRef(null)

  // Set up intersection observer
  const lastPostRef = useCallback(
    (node) => {
      if (isLoadingMore) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isReachingEnd) {
          loadMore()
        }
      })

      if (node) observerRef.current.observe(node)
    },
    [isLoadingMore, isReachingEnd, loadMore]
  )

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  if (error) return <div>Failed to load</div>
  if (isLoadingInitialData) return <div>Loading...</div>
  if (isEmpty) return <div>No posts found</div>

  return (
    <div>
      {posts.map((post, index) => {
        // Add ref to last post for infinite scroll
        if (index === posts.length - 1) {
          return (
            <div key={post.id} ref={lastPostRef}>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
            </div>
          )
        }
        return (
          <div key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
          </div>
        )
      })}

      {isLoadingMore && <div>Loading more...</div>}
      {isReachingEnd && <div>No more posts</div>}
      {isRefreshing && <div>Refreshing...</div>}
    </div>
  )
}

export default InfiniteList
```

## Key Points

### 1. Memoize `loadMore` with `useCallback`

```jsx
const loadMore = useCallback(() => {
  if (!isLoadingMore && !isReachingEnd) {
    setSize((prev) => prev + 1)
  }
}, [isLoadingMore, isReachingEnd, setSize])
```

This prevents the function from being recreated on every render, which would cause the intersection observer to re-register.

### 2. Use `useRef` for the observer

```jsx
const observerRef = useRef(null)
```

Storing the observer in a ref ensures it persists across renders without causing re-renders.

### 3. Memoize the ref callback

```jsx
const lastPostRef = useCallback(
  (node) => {
    if (isLoadingMore) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isReachingEnd) {
        loadMore()
      }
    })

    if (node) observerRef.current.observe(node)
  },
  [isLoadingMore, isReachingEnd, loadMore]
)
```

The ref callback is memoized to prevent unnecessary observer re-registrations.

### 4. Cleanup on unmount

```jsx
useEffect(() => {
  return () => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
  }
}, [])
```

Always clean up the observer to prevent memory leaks.

## Alternative: Using a Click Button

If you prefer a simpler approach without intersection observer:

```jsx
import { useCallback } from 'react'
import useSWRInfinite from 'swr/infinite'

const fetcher = (url) => fetch(url).then((res) => res.json())

function InfiniteList() {
  const {
    data,
    error,
    size,
    setSize,
    isValidating,
  } = useSWRInfinite(
    (index) => `/api/posts?page=${index}`,
    fetcher
  )

  const posts = data ? data.flat() : []
  const isLoadingMore = isValidating && size > 0 && data && typeof data[size - 1] === 'undefined'
  const isEmpty = data?.[0]?.length === 0
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < 10)

  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isReachingEnd) {
      setSize((prev) => prev + 1)
    }
  }, [isLoadingMore, isReachingEnd, setSize])

  if (error) return <div>Failed to load</div>
  if (!data) return <div>Loading...</div>
  if (isEmpty) return <div>No posts found</div>

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
        </div>
      ))}

      {!isReachingEnd && (
        <button onClick={loadMore} disabled={isLoadingMore}>
          {isLoadingMore ? 'Loading...' : 'Load More'}
        </button>
      )}

      {isReachingEnd && <div>No more posts</div>}
    </div>
  )
}

export default InfiniteList
```

## TypeScript Version

```typescript
import { useCallback, useRef, useEffect } from 'react'
import useSWRInfinite from 'swr/infinite'

interface Post {
  id: number
  title: string
  content: string
}

const fetcher = (url: string): Promise<Post[]> => 
  fetch(url).then((res) => res.json())

function InfiniteList() {
  const {
    data,
    error,
    size,
    setSize,
    isValidating,
  } = useSWRInfinite<Post[]>(
    (index) => `/api/posts?page=${index}`,
    fetcher,
    {
      revalidateFirstPage: false,
    }
  )

  const posts: Post[] = data ? data.flat() : []
  const isLoadingInitialData = !data && !error
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0]?.length === 0
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < 10)
  const isRefreshing = isValidating && data && data.length === size

  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isReachingEnd) {
      setSize((prev) => prev + 1)
    }
  }, [isLoadingMore, isReachingEnd, setSize])

  const observerRef = useRef<IntersectionObserver | null>(null)

  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isReachingEnd) {
          loadMore()
        }
      })

      if (node) observerRef.current.observe(node)
    },
    [isLoadingMore, isReachingEnd, loadMore]
  )

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  if (error) return <div>Failed to load</div>
  if (isLoadingInitialData) return <div>Loading...</div>
  if (isEmpty) return <div>No posts found</div>

  return (
    <div>
      {posts.map((post, index) => {
        if (index === posts.length - 1) {
          return (
            <div key={post.id} ref={lastPostRef}>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
            </div>
          )
        }
        return (
          <div key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
          </div>
        )
      })}

      {isLoadingMore && <div>Loading more...</div>}
      {isReachingEnd && <div>No more posts</div>}
      {isRefreshing && <div>Refreshing...</div>}
    </div>
  )
}

export default InfiniteList
```

## Related Issues

- [#785](https://github.com/vercel/swr/issues/785) - Better documentation on the revalidation behavior of the infinite hook
- [#883](https://github.com/vercel/swr/issues/883) - add useCallback in useSWRInfinite example when need to use setSize
