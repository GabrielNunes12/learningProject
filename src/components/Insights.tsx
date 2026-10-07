import { useMemo, type ReactNode } from 'react';
import { courses, getCourse } from '../content';
import {
  buildReport,
  hasEnoughForReport,
  isStarted,
  MIN_ATTEMPTS,
  MIN_TOTAL_ATTEMPTS,
  MIN_TYPE_ATTEMPTS,
  missText,
  pct,
  typeLabel,
  type ActionLink,
  type CourseReport,
  type ItemStats,
  type Mastery,
  type Report,
  type TypeStats,
  type Window,
} from '../lib/insights';
import { href } from '../lib/router';
import { useProgress } from '../lib/storage';
import type { MessageKey, Translate } from '../i18n/core';
import { useT } from '../i18n/react';
import { CourseIcon } from './CourseIcon';
import { Icon } from './icons';
import { Page, PageHeader } from './Layout';
import { accentStyle } from './ui';
import './Insights.css';

const DAY = 86_400_000;

const STATE_LABEL: Record<Mastery, MessageKey> = {
  mastered: 'insights.state.mastered',
  learning: 'insights.state.learning',
  struggling: 'insights.state.struggling',
  untested: 'insights.state.untested',
  none: 'insights.state.none',
};

/** "last answered today / yesterday / 3 days ago". */
function lastAnswered(t: Translate, time: number) {
  const d = Math.floor((Date.now() - time) / DAY);
  return d <= 0 ? t('insights.weak.lastToday') : d === 1 ? t('insights.weak.lastYesterday') : t('insights.weak.lastDaysAgo', { count: d });
}

type Noun = Report['itemNoun'];
/** Message keys that differ by what the items are called (concepts, lessons or topics). */
const nounKey = (prefix: string, noun: Noun) => `${prefix}.${noun}` as MessageKey;

function Action({ a, primary }: { a: ActionLink; primary?: boolean }) {
  return (
    <a className={`btn small${primary ? ' primary' : ''}`} href={href(...a.route)}>
      {a.label}
    </a>
  );
}

// ---------- page ----------

export function Insights({ courseId }: { courseId?: string }) {
  const { t, tx, locale } = useT();
  const p = useProgress();
  const focus = courseId ? getCourse(courseId) : undefined;
  const started = useMemo(() => courses.filter((c) => isStarted(c, p)), [p]);
  // The report holds sentences written in the active language, so it's rebuilt on a language switch.
  const report = useMemo(() => buildReport(focus ? [focus] : started, p), [focus, started, p, locale]);
  const filterCourses = focus && !started.includes(focus) ? [...started, focus] : started;

  return (
    <Page wide>
      <PageHeader
        title={t('insights.title')}
        subtitle={focus ? tx('insights.subtitleCourse', { course: <strong>{focus.title}</strong> }) : t('insights.subtitle')}
      />

      {filterCourses.length > 1 && (
        <nav className="chips ins-filter" aria-label={t('insights.filter')}>
          <a className={`chip-btn${focus ? '' : ' on'}`} href={href('insights')} aria-current={focus ? undefined : 'page'}>
            {t('insights.allCourses')}
          </a>
          {filterCourses.map((c) => (
            <a key={c.id} className={`chip-btn${focus === c ? ' on' : ''}`} href={href('insights', c.id)} aria-current={focus === c ? 'page' : undefined}>
              {c.title}
            </a>
          ))}
        </nav>
      )}

      {courseId && !focus ? (
        <section className="panel ins-empty">
          <h2>{t('insights.notFound.title')}</h2>
          <p className="muted">{tx('insights.notFound.body', { id: courseId }, { link: (c) => <a href={href('insights')}>{c}</a> })}</p>
        </section>
      ) : !report.enoughData ? (
        <EmptyState report={report} courseTitle={focus?.title} courseId={focus?.id} />
      ) : (
        <FullReport report={report} />
      )}
    </Page>
  );
}

function EmptyState({ report, courseTitle, courseId }: { report: Report; courseTitle?: string; courseId?: string }) {
  const { t, tx } = useT();
  const left = MIN_TOTAL_ATTEMPTS - report.totalAttempts;
  const count = report.totalAttempts;
  const bold = { b: (c: ReactNode) => <strong>{c}</strong> };
  return (
    <section className="panel ins-empty">
      <span className="ins-empty-icon" aria-hidden>
        <Icon name="seedling" size={30} />
      </span>
      <h2>{t('insights.empty.title')}</h2>
      <p className="muted">
        {count === 0
          ? courseTitle
            ? t('insights.empty.startIn', { course: courseTitle })
            : t('insights.empty.start')
          : `${courseTitle ? t('insights.empty.answeredIn', { count, course: courseTitle }) : t('insights.empty.answered', { count })} ${t('insights.empty.more', { count: left })}`}
      </p>
      <ul className="ins-empty-list">
        <li>{tx('insights.empty.needsAttention', {}, bold)}</li>
        <li>{tx('insights.empty.patterns', {}, bold)}</li>
        <li>{tx('insights.empty.strengths', {}, bold)}</li>
        <li>{tx('insights.empty.tips', {}, bold)}</li>
      </ul>
      <div className="row wrap">
        <a className="btn primary" href={courseId ? href('course', courseId) : '#/'}>
          {courseId ? t('insights.empty.openCourse') : t('insights.empty.continue')}
        </a>
        <a className="btn" href="#/review">
          {t('insights.empty.review')}
        </a>
      </div>
    </section>
  );
}

function FullReport({ report }: { report: Report }) {
  const { t } = useT();
  const noun = report.itemNoun;
  return (
    <>
      <Overview report={report} />

      {report.tips.length > 0 && (
        <section className="panel ins-section" aria-labelledby="ins-tips">
          <div className="panel-head">
            <h2 id="ins-tips">{t('insights.tips.title')}</h2>
            <span className="muted small">{t('insights.tips.basis')}</span>
          </div>
          <ol className="ins-tips">
            {report.tips.map((tip) => (
              <li key={tip.id} className="ins-tip">
                <span className="ins-tip-icon" aria-hidden>
                  <Icon name="bulb" size={20} />
                </span>
                <div className="grow">
                  <h3>{tip.title}</h3>
                  <p className="ins-evidence">{tip.evidence}</p>
                  <p>{tip.advice}</p>
                  <div className="row wrap">
                    {tip.actions.map((a, i) => (
                      <Action key={i} a={a} primary={i === 0} />
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="ins-columns">
        <section className="panel ins-section" aria-labelledby="ins-weak">
          <div className="panel-head">
            <h2 id="ins-weak">{t('insights.weak.title')}</h2>
            {report.weak.length > 0 && <span className="muted small">{t('insights.weak.ranked')}</span>}
          </div>
          <WeakList report={report} />
        </section>

        <section className="panel ins-section" aria-labelledby="ins-patterns">
          <div className="panel-head">
            <h2 id="ins-patterns">{t('insights.patterns.title')}</h2>
          </div>
          <Patterns report={report} />
        </section>
      </div>

      <section className="panel ins-section" aria-labelledby="ins-strengths">
        <div className="panel-head">
          <h2 id="ins-strengths">{t('insights.strengths.title')}</h2>
          {report.strengths.length > 0 && (
            <span className="muted small">{t(nounKey('insights.strengths.count', noun), { count: report.strengths.length })}</span>
          )}
        </div>
        {report.strengths.length ? (
          <ul className="ins-chips">
            {report.strengths.slice(0, 16).map((i) => (
              <li key={i.key}>
                <ItemChip item={i} showCourse={report.courses.length > 1} />
              </li>
            ))}
            {report.strengths.length > 16 && (
              <li className="muted small ins-more">{t('insights.strengths.more', { count: report.strengths.length - 16 })}</li>
            )}
          </ul>
        ) : (
          <p className="muted small">{t(nounKey('insights.strengths.none', noun))}</p>
        )}
      </section>

      <section className="ins-section" aria-labelledby="ins-map">
        <div className="section-head">
          <h2 id="ins-map">{t('insights.map.title')}</h2>
        </div>
        <Legend />
        <div className="stack">
          {report.courses.map((c) => (
            <CourseMastery key={c.course.id} r={c} focused={report.courses.length === 1} />
          ))}
        </div>
      </section>
    </>
  );
}

// ---------- overview tiles ----------

function WindowTile({ w }: { w: Window }) {
  const { t } = useT();
  return (
    <div className="ins-tile">
      <span className="stat-label">{t('insights.window.label', { count: w.days })}</span>
      <strong className="ins-big">{w.questions ? pct(w.accuracy) : '–'}</strong>
      <span className="small muted">
        {w.questions ? t('insights.window.detail', { count: w.questions, right: w.right }) : t('insights.window.empty')}
      </span>
    </div>
  );
}

function Overview({ report }: { report: Report }) {
  const { t, tx, n } = useT();
  const { counts, itemNoun } = report;
  const oneCourse = report.courses.length === 1 ? report.courses[0].course.id : undefined;
  const bold = { b: (c: ReactNode) => <strong>{c}</strong> };
  return (
    <div className="ins-tiles">
      <WindowTile w={report.week} />
      <WindowTile w={report.month} />
      <div className="ins-tile">
        <span className="stat-label">{t(nounKey('insights.noun', itemNoun))}</span>
        <div className="ins-counts">
          <span>{tx('insights.counts.mastered', { count: counts.mastered }, bold)}</span>
          <span>{tx('insights.counts.learning', { count: counts.learning }, bold)}</span>
          <span>{tx('insights.counts.struggling', { count: counts.struggling }, bold)}</span>
        </div>
        <span className="small muted">{t('insights.counts.untested', { count: counts.untested })}</span>
      </div>
      <a className={`ins-tile ins-tile-link${report.due ? ' attention' : ''}`} href={href('review', ...(oneCourse ? ['start', oneCourse] : []))}>
        <span className="stat-label">{t('insights.due.label')}</span>
        <strong className="ins-big">{n(report.due)}</strong>
        <span className="small muted">
          {report.due
            ? report.oldestDueDays >= 1
              ? t('insights.due.oldest', { count: report.oldestDueDays })
              : t('insights.due.today')
            : t('insights.due.none')}
        </span>
      </a>
    </div>
  );
}

// ---------- needs attention ----------

/** Rolling accuracy over the latest answers: one 2px line in the course accent, a marker on the latest point. */
function Sparkline({ item }: { item: ItemStats }) {
  const { t, pct: percent } = useT();
  const W = 84;
  const H = 30;
  const pad = 4;
  const ys = item.trend;
  if (!ys.length) return <span className="ins-spark-empty muted small">{t('insights.spark.empty')}</span>;
  const x = (i: number) => (ys.length === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (ys.length - 1));
  const y = (v: number) => pad + (1 - v) * (H - 2 * pad);
  const pts = ys.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const results = [...item.recent].map((c) => (c === '1' ? t('insights.spark.right') : t('insights.spark.wrong')));
  const slot = (W - 2 * pad) / Math.max(ys.length - 1, 1);
  return (
    <svg className="ins-spark" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('insights.spark.label', { count: results.length, results: results.join(t('insights.list.separator')) })}>
      <line x1={pad} x2={W - pad} y1={y(0.5)} y2={y(0.5)} className="ins-spark-mid" />
      {ys.length > 1 && <polyline points={pts} className="ins-spark-line" />}
      <circle cx={x(ys.length - 1)} cy={y(ys[ys.length - 1])} r={4} className="ins-spark-dot" />
      {ys.map((v, i) => (
        <rect key={i} x={x(i) - slot / 2} y={0} width={slot} height={H} className="ins-spark-hit">
          <title>{t('insights.spark.point', { index: i + 1, total: ys.length, result: results[i], pct: percent(v) })}</title>
        </rect>
      ))}
    </svg>
  );
}

function WeakList({ report }: { report: Report }) {
  const { t } = useT();
  const noun = report.itemNoun;
  if (!report.weak.length) {
    const thin = report.courses.flatMap((c) => c.items).filter((i) => i.attempts > 0 && i.thin).length;
    return (
      <p className="muted small">
        {t('insights.weak.nothing')}
        {thin > 0 && ` ${t(nounKey('insights.weak.thin', noun), { count: thin, min: MIN_ATTEMPTS })}`}
      </p>
    );
  }
  return (
    <ul className="ins-weak">
      {report.weak.slice(0, 6).map((i) => {
        const course = getCourse(i.courseId);
        return (
          <li key={i.key} className="ins-weak-row" style={accentStyle(course?.color)}>
            <div className="grow">
              <a className="ins-weak-name" href={href('course', i.courseId, 'lesson', i.lessonId)}>
                {i.label}
              </a>
              <span className="small muted ins-weak-meta">
                {[
                  report.courses.length > 1 ? i.courseTitle : null,
                  i.kind === 'concept' ? t('insights.weak.lesson', { title: i.lessonTitle }) : i.unitTitle,
                  i.lastSeen !== null ? lastAnswered(t, i.lastSeen) : null,
                  i.due > 0 ? t('insights.weak.due', { count: i.due }) : null,
                ]
                  .filter((x) => x !== null)
                  .join(' · ')}
              </span>
              <span className="small ins-weak-why">{missText(i)}</span>
            </div>
            <Sparkline item={i} />
            {i.kind === 'concept' && (
              <a className="btn small" href={href('practice', i.courseId, i.id)} aria-label={t('insights.weak.practiseLabel', { name: i.label })}>
                {t('insights.weak.practise')}
              </a>
            )}
          </li>
        );
      })}
      {report.weak.length > 6 && <li className="muted small">{t('insights.weak.more', { count: report.weak.length - 6 })}</li>}
    </ul>
  );
}

// ---------- patterns ----------

function TypeBars({ types }: { types: TypeStats[] }) {
  const { t } = useT();
  return (
    <figure className="hbars ins-types" aria-label={t('insights.types.title')}>
      {types.map((ty) => (
        <div
          key={ty.type}
          className="hbar-row tip"
          data-tip={t('insights.types.tip', { format: typeLabel(ty.type), right: ty.right, total: ty.attempts })}
          tabIndex={0}
        >
          <span className="hbar-label">{typeLabel(ty.type)}</span>
          <span className="hbar-track">
            <span className="hbar-mark" style={{ width: `${ty.accuracy * 100}%` }} />
          </span>
          <span className="hbar-value">{pct(ty.accuracy)}</span>
        </div>
      ))}
      <div className="sr-only"><table>
        <tbody>
          {types.map((ty) => (
            <tr key={ty.type}>
              <th>{typeLabel(ty.type)}</th>
              <td>{t('insights.types.row', { right: ty.right, total: ty.attempts, pct: pct(ty.accuracy) })}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </figure>
  );
}

function Patterns({ report }: { report: Report }) {
  const { t } = useT();
  const shown = report.types.filter((t) => t.attempts >= MIN_TYPE_ATTEMPTS);
  const hidden = report.types.length - shown.length;
  return (
    <>
      <h3 className="ins-sub">{t('insights.types.title')}</h3>
      {shown.length ? <TypeBars types={shown} /> : <p className="muted small">{t('insights.types.needMore', { min: MIN_TYPE_ATTEMPTS })}</p>}
      {hidden > 0 && shown.length > 0 && <p className="muted small">{t('insights.types.hidden', { count: hidden, min: MIN_TYPE_ATTEMPTS })}</p>}
      {report.patterns.length ? (
        <ul className="ins-patterns">
          {report.patterns.map((pt) => (
            <li key={pt.id}>
              <strong>{pt.title}</strong>
              <span className="small muted">{pt.detail}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small ins-patterns-none">{t('insights.patterns.none')}</p>
      )}
    </>
  );
}

// ---------- mastery map ----------

function StateMark({ state }: { state: Mastery }) {
  if (state === 'mastered') return <Icon name="check" size={13} />;
  if (state === 'struggling') return <span className="ins-mark-bang">!</span>;
  return <span className={`ins-mark-dot ${state}`} />;
}

function chipTip(t: Translate, i: ItemStats) {
  if (i.mastery === 'none') return t('insights.chip.noQuestions');
  if (!i.attempts) return t('insights.chip.untested', { count: i.questions });
  const score = { right: i.right, total: i.attempts };
  if (i.recentCount && !i.allTime) {
    const recent = { ...score, count: i.recentCount, pct: pct(i.recentAccuracy) };
    return t(i.thin ? 'insights.chip.scoreRecentThin' : 'insights.chip.scoreRecent', recent);
  }
  return t(i.thin ? 'insights.chip.scoreThin' : 'insights.chip.score', score);
}

function ItemChip({ item, showCourse }: { item: ItemStats; showCourse?: boolean }) {
  const { t } = useT();
  const tip = chipTip(t, item);
  return (
    <a
      className={`ins-chip ${item.mastery}${item.thin && item.attempts ? ' thin' : ''} tip`}
      href={href('course', item.courseId, 'lesson', item.lessonId)}
      data-tip={tip}
      aria-label={t('insights.chip.label', { name: item.label, state: t(STATE_LABEL[item.mastery]), detail: tip })}
    >
      <StateMark state={item.mastery} />
      {item.label}
      {showCourse && <span className="ins-chip-course">{item.courseTitle}</span>}
    </a>
  );
}

function Legend() {
  const { t } = useT();
  const states: Mastery[] = ['mastered', 'learning', 'struggling', 'untested'];
  return (
    <ul className="ins-legend" aria-label={t('insights.legend')}>
      {states.map((s) => (
        <li key={s}>
          <span className={`ins-chip ${s} ins-legend-chip`} aria-hidden>
            <StateMark state={s} />
          </span>
          {t(STATE_LABEL[s])}
        </li>
      ))}
    </ul>
  );
}

function CourseMastery({ r, focused }: { r: CourseReport; focused: boolean }) {
  const { t } = useT();
  const { course } = r;
  const n = { mastered: 0, total: 0 };
  for (const i of r.items) {
    if (i.mastery === 'none') continue;
    n.total++;
    if (i.mastery === 'mastered') n.mastered++;
  }
  const multiUnit = r.units.length > 1;
  return (
    <article className="panel ins-course" style={accentStyle(course.color)}>
      <header className="ins-course-head">
        <CourseIcon icon={course.icon} color={course.color} size={40} />
        <div className="grow">
          <h3>{course.title}</h3>
          <span className="small muted">
            {t(r.hasGraph ? 'insights.course.masteredConcepts' : 'insights.course.masteredLessons', { mastered: n.mastered, count: n.total })}
          </span>
        </div>
        <div className="row wrap ins-course-actions">
          {!focused && (
            <a className="btn small" href={href('insights', course.id)}>
              {t('insights.course.focus')}
            </a>
          )}
          <a className="btn small" href={href('practice', course.id)}>
            {t('insights.action.mixedPractice')}
          </a>
        </div>
      </header>
      {r.units.map((u) => (
        <div key={u.unit.id} className="ins-unit">
          {multiUnit && <h4 className="ins-unit-title">{u.unit.title}</h4>}
          {r.hasGraph ? (
            <ul className="ins-lessons">
              {u.lessons.map((g) => (
                <li key={g.lesson.id} className="ins-lesson">
                  <span className="ins-lesson-title small">{g.lesson.title}</span>
                  <ul className="ins-chips">
                    {g.items.map((i) => (
                      <li key={i.key}>
                        <ItemChip item={i} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="ins-chips">
              {u.lessons.flatMap((g) =>
                g.items.map((i) => (
                  <li key={i.key}>
                    <ItemChip item={i} />
                  </li>
                )),
              )}
            </ul>
          )}
        </div>
      ))}
    </article>
  );
}

// ---------- Home entry point ----------

/** Compact "Your learning report" card for Home. Hidden until there's enough practice to say something. */
export function InsightsTeaser() {
  const { t, locale } = useT();
  const p = useProgress();
  const started = useMemo(() => courses.filter((c) => isStarted(c, p)), [p]);
  // The report holds sentences in the active language: rebuild it on a language switch.
  const report = useMemo(() => (hasEnoughForReport(started, p) ? buildReport(started, p) : null), [started, p, locale]);
  if (!report) return null;
  const top = report.weak[0];
  const line = top
    ? t('insights.teaser.weak', { miss: missText(top) })
    : report.counts.mastered
      ? t(nounKey('insights.teaser.mastered', report.itemNoun), { count: report.counts.mastered })
      : t('insights.teaser.default');
  return (
    <a className="ins-teaser" href={href('insights')}>
      <span className="ins-teaser-icon" aria-hidden>
        <Icon name="trendUp" size={24} />
      </span>
      <span className="grow">
        <span className="eyebrow">{t('insights.title')}</span>
        <span className="ins-teaser-line">{line}</span>
      </span>
      <span className="ins-teaser-go" aria-hidden>
        →
      </span>
    </a>
  );
}
