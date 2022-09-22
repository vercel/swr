import { useMemo, useState } from "react"
import fetcher from '../libs/fetcher'
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption
} from '@reach/combobox'
import debounce from 'lodash.debounce'

import useSWR from 'swr'

export default function Index() {
  const [searchTerm, setSearchTerm] = useState(null)
  const { data: countries = [], isValidating } = useSWR(
    () => (searchTerm ? `/api/suggestions?value=${searchTerm}` : null),
    fetcher
  )

  function handleChange(event) {
    setSearchTerm(event.target.value)
  }

  const debouncedHandleChange = useMemo(
    () => debounce(handleChange, 500)
  , []);

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Country Search</h1>
      <Combobox>
        <ComboboxInput
          className="country-search-input"
          onChange={debouncedHandleChange}
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
