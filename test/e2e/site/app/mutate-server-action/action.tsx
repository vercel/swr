'use server'

export async function action(): Promise<{ result: number }> {
  await sleep(500)
  return { result: 10086 }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}
