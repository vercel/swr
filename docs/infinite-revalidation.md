# useSWRInfinite 重新验证行为文档

## 概述

`useSWRInfinite` 是 SWR 提供的用于实现无限滚动加载的 Hook。它的重新验证（revalidation）行为与普通的 `useSWR` 有所不同，这是为了优化性能而设计的。

## 默认行为

### 为什么只重新验证第一页？

当你使用 `useSWRInfinite` 加载多页数据时，默认情况下**只会重新验证第一页**。这是预期行为，原因如下：

1. **性能优化**：想象一下你有 100 页数据，当用户点击"返回"时，如果同时重新验证所有页面，会导致严重的性能问题。

2. **时间线设计**：大多数无限滚动的应用都是时间线类型的（如 Facebook、Twitter），新的内容通常出现在顶部。当第一页数据更新时，SWR 会自然地重新加载后续页面。

3. **缓存策略**：只重新验证第一页可以在保持数据新鲜度的同时，避免不必要的网络请求。

### 示例场景

```jsx
import useSWRInfinite from 'swr/infinite'

function Posts() {
  const { data, size, setSize } = useSWRInfinite(
    (index) => `/api/posts?page=${index}`,
    fetcher
  )

  // 当加载第2页时：
  // - 第1页会被重新验证（默认行为）
  // - 第2页会发起新请求
  // - 后续已加载的页面不会被重新验证
}
```

## 配置选项

### revalidateFirstPage

控制是否重新验证第一页。

```jsx
useSWRInfinite(
  (index) => `/api/posts?page=${index}`,
  fetcher,
  {
    revalidateFirstPage: false, // 禁用第一页重新验证
  }
)
```

**类型**：`boolean`
**默认值**：`true`

### revalidateAll

强制重新验证所有已加载的页面。

```jsx
useSWRInfinite(
  (index) => `/api/posts?page=${index}`,
  fetcher,
  {
    revalidateAll: true, // 重新验证所有页面
  }
)
```

**类型**：`boolean`
**默认值**：`false`

**注意**：启用此选项可能会导致性能问题，特别是当用户已经加载了很多页时。

### revalidateIfStale

控制是否在数据过期时重新验证。

```jsx
useSWRInfinite(
  (index) => `/api/posts?page=${index}`,
  fetcher,
  {
    revalidateIfStale: false, // 即使数据过期也不重新验证
  }
)
```

**类型**：`boolean`
**默认值**：`true`

### 其他标准选项

`useSWRInfinite` 支持所有 `useSWR` 的标准选项：

```jsx
useSWRInfinite(
  (index) => `/api/posts?page=${index}`,
  fetcher,
  {
    revalidateOnFocus: false,      // 禁用焦点重新验证
    revalidateOnReconnect: false,  // 禁用重连重新验证
    revalidateOnMount: false,      // 禁用挂载时重新验证
    refreshInterval: 0,            // 禁用自动刷新
  }
)
```

## 使用场景

### 场景1：社交媒体时间线（默认行为）

对于 Twitter/Facebook 这样的时间线应用，新的内容通常出现在顶部：

```jsx
useSWRInfinite(
  (index) => `/api/timeline?page=${index}`,
  fetcher,
  {
    // 默认行为即可：
    // - 重新验证第一页以获取新内容
    // - 不重新验证其他页面以节省性能
  }
)
```

### 场景2：静态内容列表

对于内容不经常变化的列表（如博客文章），可以禁用第一页重新验证：

```jsx
useSWRInfinite(
  (index) => `/api/posts?page=${index}`,
  fetcher,
  {
    revalidateFirstPage: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  }
)
```

### 场景3：需要实时更新的数据

对于需要实时更新的数据（如股票价格），可以启用所有页面重新验证：

```jsx
useSWRInfinite(
  (index) => `/api/prices?page=${index}`,
  fetcher,
  {
    revalidateAll: true,
    refreshInterval: 5000, // 每5秒刷新一次
  }
)
```

### 场景4：使用 useSWRImmutable

对于完全静态的数据，可以使用 `useSWRImmutable` 来完全禁用重新验证：

```jsx
import useSWRImmutable from 'swr/immutable'

function StaticPosts() {
  const { data } = useSWRImmutable(
    (index) => `/api/static-posts?page=${index}`,
    fetcher
  )
}
```

**注意**：`useSWRImmutable` 目前不直接支持 `useSWRInfinite` 的功能，但你可以通过配置选项实现类似效果：

```jsx
useSWRInfinite(
  (index) => `/api/static-posts?page=${index}`,
  fetcher,
  {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateOnMount: false,
  }
)
```

## 最佳实践

### 1. 根据数据特性选择策略

- **频繁更新的数据**：使用默认行为（重新验证第一页）
- **偶尔更新的数据**：禁用第一页重新验证
- **静态数据**：禁用所有重新验证

### 2. 性能优化

```jsx
// 好的做法：只在需要时重新验证
useSWRInfinite(getKey, fetcher, {
  revalidateFirstPage: true,  // 保持数据新鲜
  revalidateAll: false,       // 避免性能问题
})

// 不推荐：对所有页面进行不必要的重新验证
useSWRInfinite(getKey, fetcher, {
  revalidateAll: true,  // 可能导致性能问题
})
```

### 3. 配合 Mutation 使用

当你需要更新特定页面的数据时，可以使用 `mutate`：

```jsx
import { mutate } from 'swr'

// 更新特定页面
mutate('/api/posts?page=0', newData, { revalidate: false })

// 或者触发重新验证
mutate('/api/posts?page=0')
```

## 常见问题

### Q: 为什么第一页总是被重新验证？

A: 这是默认行为，目的是保持时间线类型应用的数据新鲜度。如果你不需要这个功能，可以设置 `revalidateFirstPage: false`。

### Q: 如何完全禁用重新验证？

A: 设置以下选项：

```jsx
useSWRInfinite(getKey, fetcher, {
  revalidateFirstPage: false,
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateOnMount: false,
})
```

### Q: revalidateAll 和 revalidateFirstPage 有什么区别？

A: 
- `revalidateFirstPage: true`（默认）：只重新验证第一页
- `revalidateAll: true`：重新验证所有已加载的页面
- `revalidateFirstPage: false`：不重新验证第一页

### Q: 如何实现双向无限滚动？

A: 目前 `useSWRInfinite` 不直接支持双向无限滚动。你可以考虑：

1. 使用两个 `useSWRInfinite` 实例（一个用于向上滚动，一个用于向下滚动）
2. 使用其他支持双向无限滚动的库（如 TanStack Query）
3. 自定义实现，使用 `useSWR` 配合手动分页逻辑

## 相关资源

- [SWR 官方文档](https://swr.vercel.app/)
- [useSWRInfinite API 参考](https://swr.vercel.app/docs/infinite)
- [GitHub Issue #785](https://github.com/vercel/swr/issues/785) - 关于此行为的详细讨论
