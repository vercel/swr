export const createKey = () => 'swr-key-' + ~~(Math.random() * 1e7)

export function sleep(time: number) {
  return new Promise<void>(resolve => setTimeout(resolve, time))
}

export const createResponse = <T>(
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
