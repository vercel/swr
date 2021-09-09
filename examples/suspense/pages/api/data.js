const projects = [
  'facebook/flipper',
  'vuejs/vuepress',
  'rust-lang/rust',
  'zeit/next.js',
  'emperor/clothes'
]

export default function api(req, res) {
  if (req.query.id) {
    if (req.query.id === projects[4]) {
      setTimeout(() => {
        res.json({ msg: 'not found' })
      })

      return
    }
    // a slow endpoint for getting repo data
    fetch(`https://api.github.com/repos/${req.query.id}`)
      .then(res => res.json())
      .then(data => {
        setTimeout(() => {
          res.json(data)
        }, 2000)
      })

    return
  }
  setTimeout(() => {
    res.json(projects)
  }, 2000)
}
