import fetch from 'isomorphic-unfetch'

export default async function fetcher(...args) {
  const res = await fetch(...args)
  return res.json()
}
