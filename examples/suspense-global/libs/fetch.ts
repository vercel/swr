export default async function fetcher(...args: [any]) {
  const res = await fetch(...args)
  if (!res.ok) {
    throw new Error('An error occurred while fetching the data.')
  } else {
    return res.json()
  }
}
