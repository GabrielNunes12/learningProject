import { useEffect, useState } from 'react';

// Hash routing (#/course/x/lesson/y) so the built site works as plain static files.

const parse = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);

export function useRoute(): string[] {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const href = (...parts: string[]) => `#/${parts.map(encodeURIComponent).join('/')}`;
export const go = (...parts: string[]) => {
  window.location.hash = href(...parts);
};
