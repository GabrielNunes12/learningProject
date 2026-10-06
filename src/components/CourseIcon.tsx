// A course's (or roadmap track's) icon. `icon` is either "logo:<name>" for a real technology logo from
// src/assets/logos/, or a short monogram such as "P(x)" or "∴" drawn as a tile in the course colour.
import type { CSSProperties } from 'react';
import './CourseIcon.css';

const LOGOS = import.meta.glob<string>('../assets/logos/*.svg', { eager: true, query: '?url', import: 'default' });
const logoUrl = (name: string) => LOGOS[`../assets/logos/${name}.svg`];

/** Dark text on light colours, white on dark ones (WCAG relative luminance). */
function inkFor(hex: string): string {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return '#fff';
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.32 ? '#16161a' : '#fff';
}

/** Monograms shrink as they get longer so "80/20" fits the same tile as "%". */
const MONO_SCALE = [0, 0.62, 0.4, 0.31, 0.26, 0.22];

interface Props {
  icon: string;
  /** Course colour, used for monogram tiles. */
  color?: string;
  /** Tile size in px. Below 26px a monogram becomes a colour dot, since its text would be unreadable. */
  size?: number;
  className?: string;
}

export function CourseIcon({ icon, color = '#5b5bd6', size = 44, className = '' }: Props) {
  const style = { '--ci-size': `${size}px` } as CSSProperties;
  if (icon.startsWith('logo:')) {
    const url = logoUrl(icon.slice(5));
    return (
      <span className={`ci ci-logo ${className}`.trim()} style={style} aria-hidden>
        {url && <img src={url} alt="" draggable={false} />}
      </span>
    );
  }
  if (size < 26) {
    return <span className={`ci-dot ${className}`.trim()} style={{ background: color }} aria-hidden />;
  }
  const scale = MONO_SCALE[Math.min([...icon].length, MONO_SCALE.length - 1)];
  return (
    <span
      className={`ci ci-mono ${className}`.trim()}
      style={{ ...style, '--ci-scale': scale, background: color, color: inkFor(color) } as CSSProperties}
      aria-hidden
    >
      {icon}
    </span>
  );
}
