import storage from '../libs/storage'

import useSWR, { mutate } from 'swr'

export default () => {
  const { data = { name: "" } } = useSWR('user-name', storage)

  function handleChange(event) {
    localStorage.setItem(
      'user-name',
      JSON.stringify({ name: event.target.value })
    )
    mutate('user-name', { name: event.target.value })
  }

  return <div style={{ textAlign: 'center' }}>
    <label htmlFor="name">Name</label>
    <input id="name" name="name" type="text" value={data.name} onChange={handleChange} />
  </div>
}
