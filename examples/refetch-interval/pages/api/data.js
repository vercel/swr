// an simple endpoint for getting current list
let list = []

export default (req, res) => {
  if (req.query.add) {
    list.push(req.query.add)
  } else if (req.query.clear) {
    list = []
  }
  res.json(list)
}
