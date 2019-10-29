import Link from 'next/link'
import useProjects from '../hooks/use-projects'

export default () => {
  const { data } = useProjects()

  return <div style={{ textAlign: 'center' }}>
    <h1>Trending Projects</h1>
    <div>
    {
      data ? data.map(project => 
        <p key={project}><Link href='/[user]/[repo]' as={`/${project}`}><a>{project}</a></Link></p>
      ) : 'loading...'
    }
    </div>
  </div>
}
