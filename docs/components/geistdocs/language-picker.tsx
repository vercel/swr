import {
  LanguageToggle,
  LanguageToggleText
} from 'fumadocs-ui/components/layout/language-toggle'
import { LanguagesIcon } from 'lucide-react'

export const LanguagePicker = () => {
  return (
    <LanguageToggle>
      <LanguagesIcon className="size-4.5" />
      <LanguageToggleText className="sr-only" />
    </LanguageToggle>
  )
}
