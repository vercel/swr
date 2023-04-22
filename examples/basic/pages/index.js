// import Link from 'next/link'
// import fetch from '../libs/fetch'

// import useSWR from 'swr'

// export default function Index() {
//   const { data } = useSWR('/api/data', fetch)

//   return (
//     <div style={{ textAlign: 'center' }}>
//       <h1>Trending Projects</h1>
//       <div>
//       {
//         data ? data.map(project =>
//           <p key={project}><Link href='/[user]/[repo]' as={`/${project}`}>{project}</Link></p>
//         ) : 'loading...'
//       }
//       </div>
//     </div>
//   )
// }

import useSWR from 'swr'
import React, { useState, useEffect } from 'react'

const sleep = ms =>
  new Promise(resolve => {
    setTimeout(() => resolve('foo'), ms)
  })

export default function App() {
  const [state, setState] = useState(false)
  useEffect(() => {
    let timeout = setTimeout(() => {
      setState(true)
    }, 2000)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  const joke = useSWR('joke', () => sleep(1000))

  if (!state || !joke.data) {
    return <div>loading</div>
  }

  return <div>{joke.data}</div>
}
