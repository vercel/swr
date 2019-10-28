import axios from 'axios'

export default async function (...args) {
  const res = await axios(...args)
  return res.data
}
