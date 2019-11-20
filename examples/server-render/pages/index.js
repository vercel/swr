import Link from 'next/link'
import fetcher from '../libs/fetcher'

import useSWR from 'swr'

const URL = 'https://pokeapi.co/api/v2/pokemon/'

export default function Home({ initialData }) {
  const { data } = useSWR(URL, fetcher, { initialData })

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Trending Projects</h1>
      <div>
        {data && data.results
          ? data.results.map(pokemon => (
              <p key={pokemon.name}>
                <Link href="/[pokemon]" as={`/${pokemon.name}`}>
                  <a>{pokemon.name}</a>
                </Link>
              </p>
            ))
          : 'loading...'}
      </div>
    </div>
  )
}

Home.getInitialProps = async () => {
  const data = await fetcher(URL)
  return { initialData: data }
}
