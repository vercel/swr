import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const projects = [
  'facebook/flipper',
  'vuejs/vuepress',
  'rust-lang/rust',
  'vercel/next.js'
]

export default function api(req: NextApiRequest, res: NextApiResponse) {
  if (req.query.id) {
    // a slow endpoint for getting repo data
    axios(`https://api.github.com/repos/${req.query.id}`)
      .then(response => response.data)
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
