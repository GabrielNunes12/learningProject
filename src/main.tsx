import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initAuth } from './lib/auth';
import { followProgressLocale, initialLocale, setLocale } from './i18n/runtime';
import './styles.css';

initAuth();

// Render once the starting language is ready (English is bundled; other languages are fetched first,
// so the page doesn't flash English text). If that fails, setLocale stays in English.
const locale = initialLocale();
(locale === 'en' ? Promise.resolve() : setLocale(locale, { remember: false })).finally(() => {
  followProgressLocale();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
