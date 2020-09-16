import axios from 'axios'

const projects = [
  'facebook/flipper',
  'vuejs/vuepress',
  'rust-lang/rust',
  'zeit/next.js'
]

export default (req, res) => {
  if (req.query.id) {
    // a slow endpoint for getting repo data
    axios(`https://api.github.com/repos/${req.query.id}`)
      .then(resp => resp.data)
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
