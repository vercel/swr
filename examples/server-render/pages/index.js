import Link from 'next/link'
import fetcher from '../libs/fetcher'

import useSWR from 'swr'

const URL = 'https://pokeapi.co/api/v2/pokemon/'

export default function Home({ fallbackData }) {
  const { data } = useSWR(URL, fetcher, { fallbackData })

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Trending Projects</h1>
      <div>
        {data && data.results
          ? data.results.map(pokemon => (
              <p key={pokemon.name}>
                <Link href="/[pokemon]" as={`/${pokemon.name}`}>
                  {pokemon.name}
                </Link>
              </p>
            ))
          : 'loading...'}
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  const data = await fetcher(URL)
  return { props: { fallbackData: data } }
}