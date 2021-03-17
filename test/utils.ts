export function sleep(time: number) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export const createResponse = <T = any>(
  response: T,
  { delay } = { delay: 10 }
): Promise<T> =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      if (response instanceof Error) {
        reject(response)
      } else {
        resolve(response)
      }
    }, delay)
  )
