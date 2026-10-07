// The language picker: a compact chip in the header (desktop and mobile) and a full select on the Profile page.
import { LOCALE_NAMES, LOCALE_SHORT, LOCALES, isLocale } from '../i18n/core';
import { useT } from '../i18n/react';
import { setLocale } from '../i18n/runtime';
import { Icon } from './icons';

const options = LOCALES.map((l) => (
  <option key={l} value={l} lang={l}>
    {LOCALE_NAMES[l]}
  </option>
));

/** Header chip: globe + "EN". A native select sits on top (invisible), so the menu is the platform's own. */
export function LanguageChip({ compact }: { compact?: boolean }) {
  const { t, locale } = useT();
  return (
    <label className={`chip lang-chip${compact ? ' compact' : ' tip tip-below'}`} data-tip={compact ? undefined : t('nav.language')} title={compact ? t('nav.language') : undefined}>
      <Icon name="globe" size={16} />
      <span aria-hidden>{LOCALE_SHORT[locale]}</span>
      <select aria-label={t('nav.language')} value={locale} onChange={(e) => isLocale(e.target.value) && setLocale(e.target.value)}>
        {options}
      </select>
    </label>
  );
}

/** Profile page: a labelled select with every language's own name. */
export function LanguageSelect({ id = 'language' }: { id?: string }) {
  const { t, locale } = useT();
  return (
    <label className="lang-select" htmlFor={id}>
      <span className="lang-select-label">
        <Icon name="globe" size={18} /> {t('nav.language')}
      </span>
      <select id={id} value={locale} onChange={(e) => isLocale(e.target.value) && setLocale(e.target.value)}>
        {options}
      </select>
    </label>
  );
}
