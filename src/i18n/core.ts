// Translation core: catalogs, t(), plurals and Intl formatting. Pure: only explicit .ts relative imports,
// so pure libs in src/lib, node:test and the server can all load it. React bindings live in src/i18n/react.tsx.
import en from './en/index.ts';
import { DEFAULT_LOCALE, type Locale } from './locales.ts';

export { LOCALES, LOCALE_NAMES, LOCALE_SHORT, DEFAULT_LOCALE, detectLocale, isLocale, type Locale } from './locales.ts';

/**
 * A plural message. Categories come from Intl.PluralRules for the locale ("one", "few", "many", "other"...);
 * "other" is required. "zero" is an explicit override used when count is exactly 0, in any language.
 */
export interface Plural {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}
export type Message = string | Plural;

/** English is the source of truth: every key and its shape (plain string or plural). */
export type EnglishCatalog = typeof en;
export type MessageKey = keyof EnglishCatalog;

/** What a translation must provide: every English key, with a plural wherever English has one. */
export type Catalog = { [K in MessageKey]: EnglishCatalog[K] extends string ? string : Plural };
/** One namespace file of a translation, checked against the English namespace file. */
export type Translation<E> = { [K in keyof E]: E[K] extends string ? string : Plural };

export type Params = Record<string, string | number>;
export type Translate = (key: MessageKey, params?: Params) => string;

const catalogs: Partial<Record<Locale, Catalog>> = { en: en as Catalog };

/** Makes a translation available (the app loads non-English catalogs on demand). */
export function registerCatalog(locale: Locale, catalog: Catalog) {
  catalogs[locale] = catalog;
}
export const hasCatalog = (locale: Locale) => Boolean(catalogs[locale]);

// ---------- formatting ----------

const pluralRules = new Map<string, Intl.PluralRules>();
const numberFormats = new Map<string, Intl.NumberFormat>();

/** The plural form of `msg` for `count` in `locale`. */
export function selectPlural(msg: Plural, count: number, locale: Locale): string {
  if (count === 0 && msg.zero !== undefined) return msg.zero;
  let rules = pluralRules.get(locale);
  if (!rules) pluralRules.set(locale, (rules = new Intl.PluralRules(locale)));
  const cat = rules.select(count) as keyof Plural;
  return msg[cat] ?? msg.other;
}

export function formatNumber(n: number, locale: Locale = activeLocale, opts?: Intl.NumberFormatOptions): string {
  if (!opts) {
    let f = numberFormats.get(locale);
    if (!f) numberFormats.set(locale, (f = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })));
    return f.format(n);
  }
  return new Intl.NumberFormat(locale, opts).format(n);
}

/** 0.42 → "42%" (or "42 %" in French). */
export const formatPercent = (fraction: number, locale: Locale = activeLocale) =>
  formatNumber(fraction, locale, { style: 'percent', maximumFractionDigits: 0 });

export function formatDate(d: Date | number, opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }, locale: Locale = activeLocale) {
  return new Intl.DateTimeFormat(locale, opts).format(typeof d === 'number' ? new Date(d) : d);
}

/** Joins items as a list: "a, b and c" / "a, b e c" / "a, b y c" / "a, b et c". */
export function formatList(items: string[], locale: Locale = activeLocale, type: 'conjunction' | 'disjunction' = 'conjunction') {
  return new Intl.ListFormat(locale, { style: 'long', type }).format(items);
}

/**
 * Fills {name} placeholders. Numbers are formatted for the locale (1,000 / 1.000 / 1 000).
 * `{{` and `}}` are literal braces.
 */
export function interpolate(text: string, params: Params | undefined, locale: Locale): string {
  if (!params || !text.includes('{')) return text;
  return text.replace(/\{\{|\}\}|\{(\w+)\}/g, (m, name: string | undefined) => {
    if (!name) return m[0];
    const v = params[name];
    if (v === undefined) return m;
    return typeof v === 'number' ? formatNumber(v, locale) : v;
  });
}

/** The raw message for a key in a locale, falling back to English (then to the key itself). */
export function rawMessage(key: MessageKey, locale: Locale): Message {
  return (catalogs[locale]?.[key] ?? (en as Catalog)[key] ?? key) as Message;
}

/** Resolves one message: picks the plural form (from params.count) and fills placeholders. */
export function resolve(key: MessageKey, params: Params | undefined, locale: Locale): string {
  const msg = rawMessage(key, locale);
  const text = typeof msg === 'string' ? msg : selectPlural(msg, Number(params?.count ?? 0), locale);
  return interpolate(text, params, locale);
}

/** A t() bound to one locale (the server uses this per request; the app uses the active-locale t below). */
export const translator =
  (locale: Locale): Translate =>
  (key, params) =>
    resolve(key, params, locale);

// ---------- the active locale (the app's current language) ----------

let activeLocale: Locale = DEFAULT_LOCALE;
const listeners = new Set<() => void>();

export const getLocale = () => activeLocale;

/** Switches the active locale. The catalog must be registered first (see src/i18n/react.tsx: setLocale). */
export function setActiveLocale(locale: Locale) {
  if (locale === activeLocale) return;
  activeLocale = locale;
  listeners.forEach((l) => l());
}

export function onLocaleChange(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Translates into the active locale. Pure libs import this; components use useT() so they re-render on a switch. */
export const t: Translate = (key, params) => resolve(key, params, activeLocale);

/** Translates a key that is built at runtime (e.g. `category.${name}`), or returns `fallback` if no such key exists. */
export function tMaybe(key: string, fallback: string, params?: Params): string {
  if (!(key in en)) return fallback;
  return resolve(key as MessageKey, params, activeLocale);
}

// ---------- course labels kept in English in the course files ----------

/** A course category ("Programming") in the active language. Unknown categories are shown as written. */
export const categoryLabel = (category: string) => tMaybe(`content.category.${category}`, category);
/** A course level ("Beginner") in the active language. */
export const levelLabel = (level: string) => tMaybe(`content.level.${level}`, level);
