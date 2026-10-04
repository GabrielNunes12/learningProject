import { useEffect, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react';

export const accentStyle = (color?: string) => (color ? ({ '--accent': color } as CSSProperties) : undefined);

export function ProgressBar({ value, label, thin }: { value: number; label?: string; thin?: boolean }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={`bar${thin ? ' thin' : ''}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, size = 64, stroke = 7, children, label }: { value: number; size?: number; stroke?: number; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  // Stable hue per username.
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42, background: `hsl(${h} 60% 52%)` }} aria-hidden>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  help?: ReactNode;
}

export function Field({ label, error, help, type, ...rest }: FieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const id = rest.id ?? rest.name;
  return (
    <label className={`field${error ? ' has-error' : ''}`} htmlFor={id}>
      <span className="field-label">{label}</span>
      <span className="field-input">
        <input id={id} type={isPassword && show ? 'text' : type} aria-invalid={Boolean(error)} {...rest} />
        {isPassword && (
          <button type="button" className="field-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </span>
      {error ? <span className="field-error">{error}</span> : help ? <span className="field-help">{help}</span> : null}
    </label>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'good' | 'bad'; children: ReactNode }) {
  return (
    <div className={`notice ${tone}`} role={tone === 'bad' ? 'alert' : 'status'}>
      <span aria-hidden>{tone === 'good' ? '✓' : tone === 'bad' ? '!' : 'i'}</span>
      <div>{children}</div>
    </div>
  );
}

export const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

/** While a lesson/session is open, use the course colour for page-level UI (e.g. the portaled bottom bar). */
export function useBodyAccent(color?: string) {
  useEffect(() => {
    if (!color) return;
    document.body.style.setProperty('--accent', color);
    return () => {
      document.body.style.removeProperty('--accent');
    };
  }, [color]);
}
