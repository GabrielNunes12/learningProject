// The languages the site speaks. Pure: no runtime imports, so node:test and the server can load it.

export const LOCALES = ['en', 'pt-BR', 'es', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Each language's own name, for the language switcher (always shown in that language). */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português (Brasil)',
  es: 'Español',
  fr: 'Français',
};

/** Two-letter label for compact switchers. */
export const LOCALE_SHORT: Record<Locale, string> = { en: 'EN', 'pt-BR': 'PT', es: 'ES', fr: 'FR' };

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v);

/**
 * Picks the site language from the browser's preferred languages (navigator.languages), in order:
 * any Portuguese → pt-BR, any Spanish → es, any French → fr, English → en. The first match wins.
 */
export function detectLocale(languages: readonly string[] | undefined | null): Locale {
  for (const raw of languages ?? []) {
    const tag = String(raw).toLowerCase();
    const base = tag.split(/[-_]/)[0];
    if (base === 'pt') return 'pt-BR';
    if (base === 'es') return 'es';
    if (base === 'fr') return 'fr';
    if (base === 'en') return 'en';
  }
  return DEFAULT_LOCALE;
}
