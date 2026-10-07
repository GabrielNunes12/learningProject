// React bindings for the translation core: useT() re-renders a component when the language changes.
import { Fragment, useSyncExternalStore, type ReactNode } from 'react';
import {
  formatDate,
  formatList,
  formatNumber,
  formatPercent,
  getLocale,
  interpolate,
  onLocaleChange,
  rawMessage,
  selectPlural,
  t,
  type MessageKey,
  type Params,
} from './core';

export const useLocale = () => useSyncExternalStore(onLocaleChange, getLocale, getLocale);

/** Values for tx(): strings and numbers like t(), plus React nodes (e.g. <strong>{name}</strong>) for {placeholders}. */
export type RichParams = Record<string, string | number | ReactNode>;
/** Renderers for <tag>…</tag> pairs inside a message, e.g. { b: (text) => <strong>{text}</strong> }. */
export type Tags = Record<string, (children: ReactNode) => ReactNode>;

/**
 * Like t(), but returns React nodes: {placeholders} may be elements, and <tag>…</tag> pairs in the message
 * are rendered by `tags`. Tags don't nest; placeholders may sit inside a tag.
 * Example: "Signed in as {name}" with { name: <strong>ana</strong> }, or "<link>Create a profile</link> to sync".
 */
export function rich(key: MessageKey, params: RichParams = {}, tags: Tags = {}): ReactNode {
  const locale = getLocale();
  const msg = rawMessage(key, locale);
  const plain: Params = {};
  for (const [k, v] of Object.entries(params)) if (typeof v === 'string' || typeof v === 'number') plain[k] = v;
  const text = interpolate(typeof msg === 'string' ? msg : selectPlural(msg, Number(params.count ?? 0), locale), plain, locale);

  const nodes = (s: string, prefix: string): ReactNode[] =>
    s.split(/(\{\w+\})/).map((part, i) => {
      const m = part.match(/^\{(\w+)\}$/);
      if (m && m[1] in params) return <Fragment key={`${prefix}${i}`}>{params[m[1]]}</Fragment>;
      return part;
    });

  const out: ReactNode[] = [];
  const re = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    out.push(...nodes(text.slice(last, m.index), `t${n}-`));
    const render = tags[m[1]];
    const inner = nodes(m[2], `i${n}-`);
    out.push(<Fragment key={`tag${n}`}>{render ? render(inner) : inner}</Fragment>);
    last = re.lastIndex;
    n++;
  }
  out.push(...nodes(text.slice(last), 'end-'));
  return <>{out}</>;
}

/**
 * Translation hook for components: re-renders on a language switch.
 *   const { t, tx, n, pct, date, locale } = useT();
 *   t('home.greeting', { name })          → string
 *   t('course.lessons', { count: 3 })     → plural form for 3
 *   tx('nav.signedInAs', { name: <strong>{u}</strong> }) → ReactNode
 */
export function useT() {
  const locale = useLocale();
  return {
    locale,
    t,
    tx: rich,
    /** A number for this locale: 1,234.5 / 1.234,5 / 1 234,5. */
    n: (v: number, opts?: Intl.NumberFormatOptions) => formatNumber(v, locale, opts),
    /** A fraction as a percentage: 0.42 → 42%. */
    pct: (fraction: number) => formatPercent(fraction, locale),
    /** A date; defaults to "May 3, 2026" style (long month). */
    date: (d: Date | number, opts?: Intl.DateTimeFormatOptions) => formatDate(d, opts, locale),
    list: (items: string[], type?: 'conjunction' | 'disjunction') => formatList(items, locale, type),
  };
}
