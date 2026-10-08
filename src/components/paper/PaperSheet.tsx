// A sheet of paper for thinking on: keywords land in the tray, get dragged (or tapped) into piles,
// and a pen layer takes arrows, circles and doodles. Everything is stored in sheet units (lib/thinking.ts).
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent, type RefObject } from 'react';
import type { SheetDraft } from '../../lib/storage';
import {
  addChip,
  addPile,
  addStroke,
  CHIP_H,
  CHIP_W,
  dropChip,
  MAX_CHIP_CHARS,
  MAX_CHIPS,
  MAX_PILES,
  pileRect,
  removeChip,
  renamePile,
  sendToPile,
  SHEET_H,
  SHEET_W,
  strokePath,
  tilt,
  TRAY_H,
  undoStroke,
  type ChipSize,
} from '../../lib/thinking';
import { useT } from '../../i18n/react';
import './Paper.css';

type Tool = 'words' | 'pen';

interface Props {
  draft: SheetDraft;
  onChange?: (d: SheetDraft) => void;
  /** Accessible name of the sheet, e.g. "Your keywords about Loops". */
  label: string;
  placeholder?: string;
  /** Hide the pile columns (a single free area). */
  noPiles?: boolean;
  /** Small, non-interactive rendering (for comparing with an old sheet). */
  readOnly?: boolean;
  autoFocus?: boolean;
}

export function PaperSheet({ draft, onChange, label, placeholder, noPiles, readOnly, autoFocus }: Props) {
  const { t, tx } = useT();
  const [tool, setTool] = useState<Tool>('words');
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const [ink, setInk] = useState<{ x: number; y: number }[] | null>(null);
  const paper = useRef<HTMLDivElement>(null);
  const size = useChipSize(paper);
  const piles = noPiles ? 0 : draft.piles.length;
  const edit = (d: SheetDraft) => onChange?.(d);

  const toSheet = (e: { clientX: number; clientY: number }) => {
    const r = paper.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SHEET_W, y: ((e.clientY - r.top) / r.height) * SHEET_H };
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    edit(addChip(draft, text, undefined, size));
    setText('');
  };

  // ----- chips: drag, or tap to select and use the pile buttons / keys -----
  const chipDown = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    if (readOnly || tool !== 'words') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, ...toSheet(e), moved: false });
  };
  const chipMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const p = toSheet(e);
    const c = draft.chips.find((x) => x.id === drag.id)!;
    setDrag({ ...drag, ...p, moved: drag.moved || Math.hypot(p.x - c.x, p.y - c.y) > 12 });
  };
  const chipUp = () => {
    if (!drag) return;
    if (drag.moved) {
      edit(dropChip(draft, drag.id, drag.x, drag.y));
      setSelected(null);
    } else setSelected(selected === drag.id ? null : drag.id);
    setDrag(null);
  };
  const chipKey = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (readOnly) return;
    const n = Number(e.key);
    if (piles && n >= 1 && n <= piles) {
      e.preventDefault();
      edit(sendToPile(draft, id, n - 1, size));
    } else if (e.key === '0' || e.key.toLowerCase() === 't') {
      e.preventDefault();
      edit(sendToPile(draft, id, undefined, size));
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      edit(removeChip(draft, id));
      setSelected(null);
    } else if (e.key === 'Escape') setSelected(null);
  };

  // ----- pen -----
  const inkDown = (e: PointerEvent<SVGSVGElement>) => {
    if (readOnly || tool !== 'pen') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setInk([toSheet(e)]);
  };
  const inkMove = (e: PointerEvent<SVGSVGElement>) => {
    if (ink) setInk([...ink, toSheet(e)]);
  };
  const inkUp = () => {
    if (ink) edit(addStroke(draft, ink));
    setInk(null);
  };

  const sel = draft.chips.find((c) => c.id === selected);

  return (
    <div className={`paper-wrap${readOnly ? ' read-only' : ''}`}>
      {!readOnly && (
        <div className="paper-tools" role="toolbar" aria-label={t('thinking.paper.tools')}>
          <div className="seg" role="group" aria-label={t('thinking.paper.tool')}>
            <button type="button" className={tool === 'words' ? 'on' : ''} aria-pressed={tool === 'words'} onClick={() => setTool('words')}>
              {t('thinking.paper.keywords')}
            </button>
            <button type="button" className={tool === 'pen' ? 'on' : ''} aria-pressed={tool === 'pen'} onClick={() => setTool('pen')}>
              {t('thinking.paper.pen')}
            </button>
          </div>
          {draft.strokes.length > 0 && (
            <button type="button" className="btn small ghost" onClick={() => edit(undoStroke(draft))}>
              {t('thinking.paper.undoInk')}
            </button>
          )}
          {!noPiles && piles < MAX_PILES && (
            <button type="button" className="btn small ghost" onClick={() => edit(addPile(draft, size))}>
              {t('thinking.paper.addPile')}
            </button>
          )}
          <span className="paper-count small muted">
            {t('thinking.paper.count', { n: draft.chips.length, count: MAX_CHIPS })}
          </span>
        </div>
      )}

      {piles > 0 && (
        <div className="paper-pile-names" style={{ gridTemplateColumns: `repeat(${piles}, 1fr)` }}>
          {draft.piles.map((name, i) =>
            readOnly ? (
              <span key={i} className="pile-name">
                {name || t('thinking.paper.pile', { n: i + 1 })}
              </span>
            ) : (
              <input
                key={i}
                className="pile-name"
                value={name}
                maxLength={24}
                placeholder={t('thinking.paper.pilePlaceholder', { n: i + 1 })}
                aria-label={t('thinking.paper.pileNameLabel', { n: i + 1 })}
                onChange={(e) => edit(renamePile(draft, i, e.target.value))}
              />
            ),
          )}
        </div>
      )}

      <div className={`paper ${tool === 'pen' && !readOnly ? 'pen-mode' : ''}`} ref={paper} role="group" aria-label={label}>
        <svg className="paper-svg" viewBox={`0 0 ${SHEET_W} ${SHEET_H}`} preserveAspectRatio="none" aria-hidden>
          {piles > 0 && (
            <>
              <line x1={0} y1={TRAY_H} x2={SHEET_W} y2={TRAY_H} className="paper-tray-line" />
              {Array.from({ length: piles - 1 }, (_, i) => {
                const r = pileRect(i + 1, piles);
                return <line key={i} x1={r.x} y1={TRAY_H + 8} x2={r.x} y2={SHEET_H - 8} className="paper-pile-line" />;
              })}
            </>
          )}
        </svg>
        {piles > 0 && <span className="paper-tray-label">{readOnly ? '' : t('thinking.paper.trayLabel')}</span>}

        {draft.chips.map((c) => {
          const dragging = drag?.id === c.id && drag.moved;
          const x = dragging ? drag.x : c.x;
          const y = dragging ? drag.y : c.y;
          const pile = c.pile !== undefined ? draft.piles[c.pile] || t('thinking.paper.pileInline', { n: c.pile + 1 }) : undefined;
          const chipLabel = c.fixedFrom
            ? pile !== undefined
              ? t('thinking.paper.chipInPileFixed', { text: c.text, pile, old: c.fixedFrom })
              : t('thinking.paper.chipInTrayFixed', { text: c.text, old: c.fixedFrom })
            : pile !== undefined
              ? t('thinking.paper.chipInPile', { text: c.text, pile })
              : t('thinking.paper.chipInTray', { text: c.text });
          return (
            <button
              key={c.id}
              type="button"
              className={`chip-k${selected === c.id ? ' selected' : ''}${dragging ? ' dragging' : ''}${c.fixedFrom ? ' fixed' : ''}`}
              style={{ left: `${(x / SHEET_W) * 100}%`, top: `${(y / SHEET_H) * 100}%`, rotate: `${tilt(c.id)}deg` }}
              tabIndex={readOnly ? -1 : 0}
              aria-label={chipLabel}
              aria-pressed={readOnly ? undefined : selected === c.id}
              title={c.fixedFrom ? t('thinking.paper.was', { old: c.fixedFrom }) : undefined}
              onPointerDown={(e) => chipDown(e, c.id)}
              onPointerMove={chipMove}
              onPointerUp={chipUp}
              onPointerCancel={() => setDrag(null)}
              onKeyDown={(e) => chipKey(e, c.id)}
            >
              {c.text}
            </button>
          );
        })}

        <svg
          className="paper-ink"
          viewBox={`0 0 ${SHEET_W} ${SHEET_H}`}
          preserveAspectRatio="none"
          aria-hidden
          onPointerDown={inkDown}
          onPointerMove={inkMove}
          onPointerUp={inkUp}
          onPointerCancel={() => setInk(null)}
        >
          {draft.strokes.map((s, i) => (
            <path key={i} d={strokePath(s)} />
          ))}
          {ink && ink.length > 1 && <path d={`M${ink.map((p) => `${p.x} ${p.y}`).join(' L')}`} />}
        </svg>

        {draft.chips.length === 0 && !readOnly && <p className="paper-empty">{t('thinking.paper.empty')}</p>}
      </div>

      {!readOnly && sel && (
        <div className="paper-chip-bar" role="group" aria-label={t('thinking.paper.moveGroup', { text: sel.text })}>
          <span className="small muted">{tx('thinking.paper.moveTo', { text: <strong>{sel.text}</strong> })}</span>
          {draft.piles.slice(0, piles).map((name, i) => (
            <button key={i} type="button" className="btn small" onClick={() => (edit(sendToPile(draft, sel.id, i, size)), setSelected(null))}>
              {name || t('thinking.paper.pile', { n: i + 1 })}
            </button>
          ))}
          {sel.pile !== undefined && (
            <button type="button" className="btn small ghost" onClick={() => (edit(sendToPile(draft, sel.id, undefined, size)), setSelected(null))}>
              {t('thinking.paper.tray')}
            </button>
          )}
          <button type="button" className="btn small ghost danger-text" onClick={() => (edit(removeChip(draft, sel.id)), setSelected(null))}>
            {t('thinking.paper.remove')}
          </button>
        </div>
      )}

      {!readOnly && (
        <form className="paper-add" onSubmit={submit}>
          <input
            value={text}
            maxLength={MAX_CHIP_CHARS}
            placeholder={placeholder ?? t('thinking.paper.placeholder')}
            aria-label={t('thinking.paper.newKeyword')}
            autoFocus={autoFocus}
            enterKeyHint="done"
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="btn" disabled={!text.trim() || draft.chips.length >= MAX_CHIPS}>
            {t('thinking.paper.add')}
          </button>
        </form>
      )}
      {!readOnly && piles > 0 && (
        <p className="paper-hint small muted">{t('thinking.paper.hint', { max: piles })}</p>
      )}
    </div>
  );
}

/** Minimum chip size on screen, in CSS px (matches .chip-k in Paper.css). */
const MIN_CHIP_PX = { w: 92, h: 34 };

/** The chip size in sheet units for the paper's current on-screen size (bigger on a narrow phone sheet). */
function useChipSize(ref: RefObject<HTMLDivElement | null>): ChipSize {
  const [size, setSize] = useState<ChipSize>({ w: CHIP_W, h: CHIP_H });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      setSize({ w: Math.max(CHIP_W, (MIN_CHIP_PX.w * SHEET_W) / width), h: Math.max(CHIP_H, (MIN_CHIP_PX.h * SHEET_H) / height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}
