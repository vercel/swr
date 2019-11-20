import Link from 'next/link'
import fetcher from '../libs/fetcher'

import useSWR from 'swr'

const getURL = pokemon => `https://pokeapi.co/api/v2/pokemon/${pokemon}`

export default function Pokemon({ pokemon, initialData }) {
  const { data } = useSWR(getURL(pokemon), fetcher, { initialData })

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
        <a>Back</a>
      </Link>
    </div>
  )
}

Pokemon.getInitialProps = async ({ query }) => {
  const data = await fetcher(getURL(query.pokemon))
  return { initialData: data, pokemon: query.pokemon }
}
