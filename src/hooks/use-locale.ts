'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Locale } from '@/lib/i18n'

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem('teems_locale') as Locale
    if (saved === 'ar' || saved === 'en') setLocaleState(saved)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('teems_locale', l)
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = l
  }, [])

  return { locale, setLocale, isRTL: locale === 'ar' }
}
