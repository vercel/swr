import React, { useCallback, useEffect, useState } from "react"
import useSWRSubscription from "swr/subscription"
import EventEmitter from "events"

const event = new EventEmitter()

const swrKey = "sub-key"

export default function page() {
  const [num, setNum] = useState(0)

  useEffect(() => {
    if (num % 3 === 0 && num > 0) {
      const err = new Error("error:" + num)
      event.emit("error", err)
    } else {
      event.emit("data", "state:" + num)
    }
  }, [num])

  const subscribe = useCallback(
    (key, { next }) => {
      const onData = (value) => next(undefined, value)
      const onError = (err) => next(err)

      event.on("data", onData)
      event.on("error", onError)

      return () => {
        event.off("data", next)
        event.off("error", next)
      }
    },
    []
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setNum(num + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [num])

  const { data, error } = useSWRSubscription(swrKey, subscribe)
  return (
    <div>
      <h3>SWR Subscription</h3>
      <h4>Recieved every second, error when data is times of 3</h4>
      <div>{data}</div>
      <div>{error ? error.message : ""}</div>
    </div>
  )
}
