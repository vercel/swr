import fetcher from '../libs/fetcher'
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption
} from '@reach/combobox'

import useSWR from 'swr'

export default () => {
  const [searchTerm, setSearchTerm] = React.useState(null)
  const { data: countries = [], isValidating } = useSWR(
    () => (searchTerm ? `/api/suggestions?value=${searchTerm}` : null),
    fetcher
  )

  function handleSearchTermChange(event) {
    setSearchTerm(event.target.value)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Country Search</h1>
      <Combobox>
        <ComboboxInput
          className="country-search-input"
          onChange={handleSearchTermChange}
          aria-label="Countries"
        />
        {countries && countries.length > 0 && (
          <ComboboxPopover className="shadow-popup">
            <ComboboxList>
              {countries.map(country => (
                <ComboboxOption key={country} value={country} />
              ))}
            </ComboboxList>
          </ComboboxPopover>
        )}
      </Combobox>
    </div>
  )
}
