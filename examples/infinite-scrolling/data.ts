function delay() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, Math.random() * 500)
  })
}

export async function load(lastIndex: number) {
  debugger
  console.log('Request to load from lastIndex', lastIndex)
  await delay()
  if (lastIndex > 500) return []
  return Array(20)
    .fill(0)
    .map((x, y) => y + lastIndex)
    .map(x => ({ id: x, data: Math.random() }))
}
