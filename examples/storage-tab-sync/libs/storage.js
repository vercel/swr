export default async function (key) {
  const value = localStorage.getItem(key)
  if (!value) return undefined
  return JSON.parse(value)
}
