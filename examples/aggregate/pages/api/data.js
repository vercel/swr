const projects = [
  'facebook/flipper',
  'vuejs/vuepress',
  'rust-lang/rust',
  'vercel/next.js'
]

export default async function api(req, res) {
  if (req.query.id) {
    return new Promise(resolve => {
      setTimeout(() => resolve(projects[req.query.id]), 1500)
    }).then(v => res.json(v))
  }
}
