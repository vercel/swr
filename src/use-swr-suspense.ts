// TODO: add documentation

import useSWR from './use-swr'

const suspenseGroup = {
  promises: [],
  started: false
}

function _internal_useSWRSuspenseStart() {
  if (suspenseGroup.started) {
    suspenseGroup.started = false
    throw new Error('Wrong order of SWR suspense guards.')
  }
  suspenseGroup.started = true
  suspenseGroup.promises = []
}

function _internal_useSWRSuspenseEnd() {
  if (!suspenseGroup.started) {
    throw new Error('Wrong order of SWR suspense guards.')
  }
  if (!suspenseGroup.promises.length) {
    suspenseGroup.started = false
    return
  }
  suspenseGroup.started = false
  throw Promise.race(suspenseGroup.promises).then(() => {
    // need to clean up the group
    suspenseGroup.promises = []
  })
}

function useSWRSuspense(callback) {
  _internal_useSWRSuspenseStart()
  const data = callback(useSWR)
  _internal_useSWRSuspenseEnd()
  return data
}

export {
  suspenseGroup,
  useSWRSuspense,
  _internal_useSWRSuspenseStart,
  _internal_useSWRSuspenseEnd
}
