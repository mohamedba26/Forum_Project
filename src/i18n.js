import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import ar from './locales/ar.json'
import en from './locales/en.json'

const savedLang = localStorage.getItem('lang') || 'fr'

document.documentElement.lang = savedLang
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  })

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  localStorage.setItem('lang', lng)
})

export default i18n
