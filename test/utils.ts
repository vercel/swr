export function sleep(time: number) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export const createResponse = (response: any, { delay } = { delay: 10 }) =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      if (response instanceof Error) {
        reject(response)
      } else {
        resolve(response)
      }
    }, delay)
  )
