import { useSWRInfinite } from 'swr'
import { useState, useRef, useEffect } from 'react'

import fetcher from '../libs/fetch'
import useOnScreen from '../hooks/useOnScreen'

const PAGE_SIZE = 6

const getKey = (pageIndex, previousPageData, repo, pageSize) => {
  if (previousPageData && !previousPageData.length) return null // reached the end

  return `https://api.github.com/repos/${repo}/issues?per_page=${pageSize}&page=${
    pageIndex + 1
  }`
}

export default function App() {
  const ref = useRef()
  const [repo, setRepo] = useState('facebook/react')
  const [val, setVal] = useState(repo)

  const isVisible = useOnScreen(ref)

  const { data, error, mutate, size, setSize, isValidating } = useSWRInfinite(
    (...args) => getKey(...args, repo, PAGE_SIZE),
    fetcher
  )

  const issues = data ? [].concat(...data) : []
  const isLoadingInitialData = !data && !error
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 && data && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0]?.length === 0
  const isReachingEnd = size === PAGE_SIZE
  const isRefreshing = isValidating && data && data.length === size

  useEffect(() => {
    if (isVisible && !isReachingEnd && !isRefreshing) {
      setSize(size + 1)
    }
  }, [isVisible, isRefreshing])

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="facebook/reect"
      />
      <button
        onClick={() => {
          setRepo(val)
          setSize(1)
        }}
      >
        load issues
      </button>
      <p>
        showing {size} page(s) of {isLoadingMore ? '...' : issues.length}{' '}
        issue(s){' '}
        <button disabled={isRefreshing} onClick={() => mutate()}>
          {isRefreshing ? 'refreshing...' : 'refresh'}
        </button>
        <button disabled={!size} onClick={() => setSize(0)}>
          clear
        </button>
      </p>
      {isEmpty ? <p>Yay, no issues found.</p> : null}
      {issues.map((issue) => {
        return (
          <p key={issue.id} style={{ margin: '6px 0', height: 50 }}>
            - {issue.title}
          </p>
        )
      })}
      <div ref={ref}>
        {isLoadingMore ? 'loading...' : isReachingEnd ? 'no more issues' : ''}
      </div>
    </div>
  )
}
