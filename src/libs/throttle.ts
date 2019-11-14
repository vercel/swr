export default function throttle(fn: any, interval: number) {
  let pending = false
  return (...args) => {
    if (pending) return
    pending = true
    fn(...args)
    setTimeout(() => (pending = false), interval)
  }
}
