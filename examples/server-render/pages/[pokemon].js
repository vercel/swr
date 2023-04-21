import Link from 'next/link'
import fetcher from '../libs/fetcher'

import useSWR from 'swr'

const getURL = pokemon => `https://pokeapi.co/api/v2/pokemon/${pokemon}`

export default function Pokemon({ pokemon, fallbackData }) {
  const { data } = useSWR(getURL(pokemon), fetcher, { fallbackData })

  return (
    <div>
      <h1>{pokemon}</h1>
      {data ? (
        <div>
          <figure>
            <img src={data.sprites.front_default} />
          </figure>
          <p>height: {data.height}</p>
          <p>weight: {data.weight}</p>
          <ul>
            {data.types.map(({ type }) => (
              <li key={type.name}>{type.name}</li>
            ))}
          </ul>
        </div>
      ) : (
        'loading...'
      )}
      <br />
      <br />
      <Link href="/">
        Back
      </Link>
    </div>
  )
}

export async function getServerSideProps({ query }) {
  const data = await fetcher(getURL(query.pokemon))
  return { props: { fallbackData: data, pokemon: query.pokemon } }
}