import { NextApiRequest, NextApiResponse } from 'next'

const projects = [
  'facebook/flipper',
  'vuejs/vuepress',
  'rust-lang/rust',
  'vercel/next.js',
  'emperor/clothes'
] as const

export type ProjectsData = typeof projects

export interface RepoData {
  forks_count: number
  stargazers_count: number
  watchers: number
}

export default function api(req: NextApiRequest, res: NextApiResponse) {
  if (req.query.id) {
    if (req.query.id === projects[4]) {
      setTimeout(() => {
        res.status(404).json({ msg: 'not found' })
      })
    } else {
      // a slow endpoint for getting repo data
      fetch(`https://api.github.com/repos/${req.query.id}`)
        .then(res => res.json())
        .then(data => {
          setTimeout(() => {
            res.json(data)
          }, 2000)
        })
    }
  } else {
    setTimeout(() => {
      res.json(projects)
    }, 2000)
  }
}
