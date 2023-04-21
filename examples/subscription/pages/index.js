import React from "react"
import useSWRSubscription from "swr/subscription"
import EventEmitter from "events"

const event = new EventEmitter()

// Simulating an external data source.
let stopped = false
async function start () {
  for (let i = 0; i < 100; i++) {
    await new Promise(res => setTimeout(res, 1000))
    if (stopped) return
    if (i % 3 === 0 && i !== 0) {
      event.emit("error", new Error("error: " + i));
    } else {
      event.emit("data", "state: " + i);
    }
  }
}

export default function page() {
  const { data, error } = useSWRSubscription('my-sub', (key, { next }) => {
    event.on("data", (value) => next(undefined, value));
    event.on("error", (err) => next(err));
    start();
    return () => {
      stopped = true;
    };
  })

  return (
    <div>
      <h3>SWR Subscription</h3>
      <h4>Received every second, error when data is times of 3</h4>
      <div>{data}</div>
      <div>{error ? error.message : ""}</div>
    </div>
  )
}
