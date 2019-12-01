// TODO: add documentation

const suspenseGroup = {
  promises: [],
  started: false
}

function useSWRSuspenseStart() {
  if (suspenseGroup.started) {
    suspenseGroup.started = false
    throw new Error('Wrong order of SWR suspense guards.')
  }
  suspenseGroup.started = true
  suspenseGroup.promises = []
}

function useSWRSuspenseEnd() {
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

export { suspenseGroup, useSWRSuspenseStart, useSWRSuspenseEnd }
