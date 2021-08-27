export default async function storage(key) {
  const value = localStorage.getItem(key)
  if (!value) return undefined
  return JSON.parse(value)
}
