// Run `yarn webpack-dev-server` then open the http://localhost:8080/demo1 (or other port in the cli)
import React, { Fragment, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import ReactDOM from 'react-dom'
import { useSWRInfinite } from '../../src/use-swr-infinite'
import { load } from './data'
import { ListChildComponentProps } from 'react-window'

function Row(props: ListChildComponentProps) {
  const { style, data } = props
  return (
    <div className="ListItem" style={style}>
      Item {data?.id} Data: {data?.data}
    </div>
  )
}

export default function App() {
  const {isValidating, data, error, page, setPage} = useSWRInfinite((index, previousPageData) => {
    if (previousPageData && previousPageData.length === 0) return null
   return previousPageData.last()?.id
  }, load)

  console.log(data);
  const loadMore = useCallback(async () => setPage((i) => i + 1), [])

  if (!data) return <>loading</>
  // Never reach this line, why?
  
  return (
    <>
      page: {page}
      isValidating: {isValidating}
      <br />
      error: {error}
      <InfiniteLoader
        isItemLoaded={i => !!data?.[i]}
        itemCount={1000}
        loadMoreItems={loadMore}
      >
        {({ onItemsRendered, ref }) => (
          <List
            className="List"
            height={400}
            itemCount={1000}
            itemSize={30}
            onItemsRendered={onItemsRendered}
            ref={ref}
            width={300}
            children={Row} />
        )}
      </InfiniteLoader>
    </>
  )
}

ReactDOM.render(<App />, document.body)
