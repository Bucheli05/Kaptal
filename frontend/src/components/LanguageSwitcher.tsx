import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggleLang = () => {
    const next = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(next)
  }

  return (
    <button
      onClick={toggleLang}
      className="text-xs font-medium text-coffee-400 dark:text-dark-text-muted hover:text-forest-900 dark:hover:text-forest-400 transition-colors uppercase tracking-wider"
    >
      {i18n.language === 'es' ? 'EN' : 'ES'}
    </button>
  )
}
