// The app's own line icons: one 24×24 grid, 2px strokes, round caps. Drawn by hand to replace emoji in the UI.
import type { ReactNode } from 'react';

const PATHS = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h6.5a3 3 0 0 0 0-6h-5a3 3 0 0 1 0-6H16" />
    </>
  ),
  review: (
    <>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v5h-5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  flame: <path d="M12 3c.7 3.3 5 5.4 5 10a5 5 0 0 1-10 0c0-2.4 1.3-3.9 2.4-4.9.2 1.8 1.2 2.9 2.4 2.9-.3-2.9-.8-5.3.2-8z" />,
  bulb: (
    <>
      <path d="M9.5 18h5M10.5 21h3" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.8.6 1.1 1.4 1.1 2.2v.5h5V16c0-.8.3-1.6 1.1-2.2A6 6 0 0 0 12 3z" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M9.5 9l1.8 1.8L14.8 7.3" />
      <path d="M8.6 13.9 7 21l5-2.6 5 2.6-1.6-7.1" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" />,
  sparkle: <path d="M12 3c.5 4.4 4.6 8.5 9 9-4.4.5-8.5 4.6-9 9-.5-4.4-4.6-8.5-9-9 4.4-.5 8.5-4.6 9-9z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  clock: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13V9.5M10 2.5h4" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M8 20h8M5 7.5h14" />
      <path d="M5 7.5 2.5 13a2.6 2.6 0 0 0 5 0zM19 7.5 16.5 13a2.6 2.6 0 0 0 5 0z" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="M13 7l4 4" />
    </>
  ),
  trendUp: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  seedling: (
    <>
      <path d="M12 21v-8" />
      <path d="M12 13c0-3.9-2.8-6-7-6 0 3.9 2.8 6 7 6z" />
      <path d="M12 11c0-3.3 2.4-5 6-5 0 3.3-2.4 5-6 5z" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

/** A line icon in the current text colour. Decorative by default; pass `label` when it carries meaning on its own. */
export function Icon({ name, size = 20, label, className }: { name: IconName; size?: number; label?: string; className?: string }) {
  return (
    <svg
      className={`icon${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

/** ProjectLearn's mark: an 80/20 split — one wide bar for the core ideas, one narrow bar for the rest. */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <rect x="2" y="4" width="14" height="16" rx="3.5" fill="currentColor" />
      <rect x="18" y="4" width="4" height="16" rx="2" fill="currentColor" opacity="0.45" />
    </svg>
  );
}
