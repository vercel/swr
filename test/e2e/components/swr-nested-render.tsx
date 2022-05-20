import React from 'react'
import useSWR from 'swr'
import { createResponse } from '../../common-utils'
import { Provider } from './provider'

const NestedRender = ({ testKey }: { testKey: string }) => {
  const { data, isValidating } = useSWR(testKey, key =>
    createResponse(key, { delay: 500 })
  )
  if (isValidating) {
    return <div>loading</div>
  }
  return (
    <Provider>
      <div id="parent">{data}</div>
      <ChildComponent testKey={testKey}></ChildComponent>
    </Provider>
  )
}

const ChildComponent = ({ testKey }: { testKey: string }) => {
  const { data } = useSWR(testKey, key => createResponse(key, { delay: 2000 }))
  return <div id="child">{data}</div>
}

export default NestedRender
