import { useState } from 'react';
import Link from 'next/link'
import fetcher from '../libs/fetcher'

import useSWR from 'swr'

const api = {
  list: () => 'https://pokeapi.co/api/v2/pokemon/',
  item: (pokemon) => `https://pokeapi.co/api/v2/pokemon/${pokemon}`,
}

function Pokemon({ item }) {
  return (
    <div>
      <h2>{item.name}</h2>
      <div>
        <figure>
          <img src={item.sprites.front_default} width="96" height="96" />
        </figure>
        <p>height: {item.height}</p>
        <p>weight: {item.weight}</p>
        <p>abilities: {item.abilities.map(({ ability }) => ability.name).join(', ')}</p>
      </div>
    </div>
  )
}

export default function Home(props) {
  const { data: list } = useSWR(api.list(), fetcher, { initialData: props.list })
  const [selected, setSelected] = useState(list.results[0].name);
  const { data: item } = useSWR(api.item(selected), fetcher, { initialData: props.item })
  
  if (!list || !list.results || !item) return 'loading...';

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>pokemon wiki</h1>
      <div>
        <label htmlFor="pet-select">Choose a pet:</label>
        <select name="pets" id="pet-select" defaultValue={selected} onChange={e => { setSelected(e.target.value); }}>
          {list.results.map(pokemon => (
            <option value={pokemon.name} key={pokemon.name}>
              {pokemon.name}
            </option>
          ))}
        </select>
        <Pokemon item={item} />  
      </div>
    </div>
  )
}

Home.getInitialProps = async () => {
  const list = await fetcher(api.list())
  const item = await fetcher(api.item(list.results[0].name))
  return { list, item }
}
