import fetcher from '../../libs/fetch'
import Repos from './repos'
const Page = () => {
  const serverData = fetcher('http://localhost:3000/api/data')
  return <Repos serverData={serverData} />
}

export default Page
