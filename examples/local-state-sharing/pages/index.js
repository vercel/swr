import { useState } from "react"
import initialStore from "../libs/store"
import useSWR, { mutate } from "swr"

function Profile() {
  const { data } = useSWR("globalState", { initialData: initialStore })
  const [value, updateValue] = useState((data || {}).name)
  if (!data) {
    return null
  }
  return (
    <div>
      <h1>My name is {data.name}.</h1>
      <input
        value={value}
        onChange={e => updateValue(e.target.value)}
        style={{ width: 200, marginRight: 8 }}
      />
      <button
        type="button"
        onClick={() => {
          mutate("globalState", { ...data, name: value }, false)
        }}
      >
        Uppercase my name!
      </button>
    </div>
  )
}

function Other() {
  const { data } = useSWR("globalState", { initialData: initialStore })
  if (!data) {
    return null
  }
  return (
    <div style={{ border: "1px solid #ddd", marginTop: 30, padding: 20 }}>
      <h1>
        Another Component: <br />
        My name is {data.name}.
      </h1>
    </div>
  )
}

export default () => (
  <div style={{ padding: 40 }}>
    useSWR can share state between components:
    <Profile />
    <Other />
  </div>
)
