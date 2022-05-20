import React from 'react'
import useSWR from 'swr'
import { createResponse } from '../../common-utils'

const NestedRender = ({ swrKey }: { swrKey: string }) => {
  const { data, isValidating } = useSWR(swrKey, key =>
    createResponse(key, { delay: 500 })
  )
  if (isValidating) {
    return <div>loading</div>
  }
  return (
    <div>
      <div id="parent">{data}</div>
      <ChildComponent swrKey={swrKey}></ChildComponent>
    </div>
  )
}

const ChildComponent = ({ swrKey }: { swrKey: string }) => {
  const { data } = useSWR(swrKey, key => createResponse(key, { delay: 2000 }))
  return <div id="child">{data}</div>
}

export default NestedRender
