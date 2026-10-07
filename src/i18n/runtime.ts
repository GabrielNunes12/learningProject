// Switching the app's language: loads the catalog and the course translations for a locale (each its own
// chunk), then makes it active. Browser only (uses import(), localStorage and the document).
import { loadContentLocale } from '../content';
import { getProgress, onProgress, setLocalePref } from '../lib/storage';
import { detectLocale, getLocale, hasCatalog, isLocale, registerCatalog, setActiveLocale, translator, type Catalog, type Locale } from './core';

const KEY = 'projectlearn:locale';

/** Non-English catalogs are separate chunks, fetched the first time a language is used. */
const CATALOGS: Record<Exclude<Locale, 'en'>, () => Promise<{ default: Catalog }>> = {
  'pt-BR': () => import('./pt-BR/index.ts'),
  es: () => import('./es/index.ts'),
  fr: () => import('./fr/index.ts'),
};

function stored(): Locale | null {
  try {
    const v = localStorage.getItem(KEY);
    return isLocale(v) ? v : null;
  } catch {
    return null;
  }
}

/** The language to start in: the learner's choice on this device, then the one in their progress, then the browser's. */
export function initialLocale(): Locale {
  const p = getProgress().locale;
  return stored() ?? (isLocale(p) ? p : null) ?? detectLocale(typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language]);
}

let queue: Promise<void> = Promise.resolve();
let wanted: Locale = getLocale();

/**
 * Switches the whole site to `locale`: UI strings, course text, dates and numbers, and <html lang>.
 * `remember` (a choice the learner made) saves it on this device and in their synced progress.
 * Switches run one after another; if several are queued, only the last one is applied.
 */
export function setLocale(locale: Locale, { remember = true }: { remember?: boolean } = {}): Promise<void> {
  wanted = locale;
  if (remember) {
    try {
      localStorage.setItem(KEY, locale);
    } catch {
      /* private mode: the choice lasts for this visit */
    }
  }
  queue = queue.then(async () => {
    if (wanted !== locale) return;
    try {
      if (locale !== 'en' && !hasCatalog(locale)) registerCatalog(locale, (await CATALOGS[locale]()).default);
      await loadContentLocale(locale, translator(locale)('content.lessonsUnit'));
    } catch (err) {
      // Offline or a failed chunk: stay in the current language rather than half-switching.
      console.error(`Could not load the ${locale} translation`, err);
      return;
    }
    if (wanted !== locale) return;
    document.documentElement.lang = locale;
    setActiveLocale(locale);
    if (remember) setLocalePref(locale);
  });
  return queue;
}

/** Follows the language saved in synced progress (signing in on a new device, or a change in another tab). */
export function followProgressLocale() {
  let seen = getProgress().locale;
  onProgress(() => {
    const next = getProgress().locale;
    if (next === seen) return;
    seen = next;
    if (isLocale(next) && next !== wanted) setLocale(next);
  });
}
