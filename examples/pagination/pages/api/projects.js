// an endpoint for getting projects data
export default (req, res) => {
  const offset = parseInt(req.query.offset || 0)

  if (offset >= 9) return setTimeout(() => res.json([]), 1000)

  const data = Array(3).fill(0).map((_, i) => {
    return {
      name: 'Project ' + (i + offset) + ` (server time: ${Date.now()})`,
      id: i + offset
    }
  })

  setTimeout(() => res.json(data), 1000)
}
