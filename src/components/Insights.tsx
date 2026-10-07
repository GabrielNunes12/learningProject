import { useMemo } from 'react';
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
import { CourseIcon } from './CourseIcon';
import { Icon } from './icons';
import { Page, PageHeader } from './Layout';
import { accentStyle, plural } from './ui';
import './Insights.css';

const DAY = 86_400_000;

const STATE_LABEL: Record<Mastery, string> = {
  mastered: 'Mastered',
  learning: 'In progress',
  struggling: 'Struggling',
  untested: 'Not practised yet',
  none: 'No questions yet',
};

function ago(t: number | null) {
  if (t === null) return '';
  const d = Math.floor((Date.now() - t) / DAY);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
}

const singular = (noun: string) => noun.replace(/s$/, '');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Action({ a, primary }: { a: ActionLink; primary?: boolean }) {
  return (
    <a className={`btn small${primary ? ' primary' : ''}`} href={href(...a.route)}>
      {a.label}
    </a>
  );
}

// ---------- page ----------

export function Insights({ courseId }: { courseId?: string }) {
  const p = useProgress();
  const focus = courseId ? getCourse(courseId) : undefined;
  const started = useMemo(() => courses.filter((c) => isStarted(c, p)), [p]);
  const report = useMemo(() => buildReport(focus ? [focus] : started, p), [focus, started, p]);
  const filterCourses = focus && !started.includes(focus) ? [...started, focus] : started;

  return (
    <Page wide>
      <PageHeader
        title="Your learning report"
        subtitle={
          <>
            What you miss, what you're struggling with, and how to improve{focus ? <> in <strong>{focus.title}</strong></> : null}.
          </>
        }
      />

      {filterCourses.length > 1 && (
        <nav className="chips ins-filter" aria-label="Filter by course">
          <a className={`chip-btn${focus ? '' : ' on'}`} href={href('insights')} aria-current={focus ? undefined : 'page'}>
            All courses
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
          <h2>Course not found</h2>
          <p className="muted">
            There's no course called "{courseId}". <a href={href('insights')}>See the report for all your courses</a>.
          </p>
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
  const left = MIN_TOTAL_ATTEMPTS - report.totalAttempts;
  return (
    <section className="panel ins-empty">
      <span className="ins-empty-icon" aria-hidden>
        <Icon name="seedling" size={30} />
      </span>
      <h2>Not enough practice yet</h2>
      <p className="muted">
        {report.totalAttempts === 0
          ? `Answer a few questions${courseTitle ? ` in ${courseTitle}` : ''} and this report fills in.`
          : `You've answered ${plural(report.totalAttempts, 'question')}${courseTitle ? ` in ${courseTitle}` : ''}. ${cap(plural(left, 'more answer'))} and this report fills in.`}
      </p>
      <ul className="ins-empty-list">
        <li>
          <strong>Needs attention:</strong> concepts you keep missing, ranked by your recent answers.
        </li>
        <li>
          <strong>Patterns:</strong> which question formats trip you up, what you got right once but forgot, and reviews piling up.
        </li>
        <li>
          <strong>Strengths:</strong> what you've answered right three times in a row.
        </li>
        <li>
          <strong>Tips:</strong> a few concrete next steps, each based on your own answers.
        </li>
      </ul>
      <div className="row wrap">
        <a className="btn primary" href={courseId ? href('course', courseId) : '#/'}>
          {courseId ? 'Open the course' : 'Continue learning'}
        </a>
        <a className="btn" href="#/review">
          Review
        </a>
      </div>
    </section>
  );
}

function FullReport({ report }: { report: Report }) {
  const noun = report.itemNoun;
  return (
    <>
      <Overview report={report} />

      {report.tips.length > 0 && (
        <section className="panel ins-section" aria-labelledby="ins-tips">
          <div className="panel-head">
            <h2 id="ins-tips">How to improve</h2>
            <span className="muted small">Based on your own answers</span>
          </div>
          <ol className="ins-tips">
            {report.tips.map((t) => (
              <li key={t.id} className="ins-tip">
                <span className="ins-tip-icon" aria-hidden>
                  <Icon name="bulb" size={20} />
                </span>
                <div className="grow">
                  <h3>{t.title}</h3>
                  <p className="ins-evidence">{t.evidence}</p>
                  <p>{t.advice}</p>
                  <div className="row wrap">
                    {t.actions.map((a, i) => (
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
            <h2 id="ins-weak">Needs attention</h2>
            {report.weak.length > 0 && <span className="muted small">Ranked by recent misses</span>}
          </div>
          <WeakList report={report} />
        </section>

        <section className="panel ins-section" aria-labelledby="ins-patterns">
          <div className="panel-head">
            <h2 id="ins-patterns">Struggle patterns</h2>
          </div>
          <Patterns report={report} />
        </section>
      </div>

      <section className="panel ins-section" aria-labelledby="ins-strengths">
        <div className="panel-head">
          <h2 id="ins-strengths">Strengths</h2>
          {report.strengths.length > 0 && <span className="muted small">{plural(report.strengths.length, singular(noun), noun)} mastered</span>}
        </div>
        {report.strengths.length ? (
          <ul className="ins-chips">
            {report.strengths.slice(0, 16).map((i) => (
              <li key={i.key}>
                <ItemChip item={i} showCourse={report.courses.length > 1} />
              </li>
            ))}
            {report.strengths.length > 16 && <li className="muted small ins-more">and {report.strengths.length - 16} more</li>}
          </ul>
        ) : (
          <p className="muted small">
            Nothing mastered yet. A {singular(noun)} counts as mastered once every question you've answered on it has been right three times in a
            row.
          </p>
        )}
      </section>

      <section className="ins-section" aria-labelledby="ins-map">
        <div className="section-head">
          <h2 id="ins-map">Mastery by course</h2>
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
  return (
    <div className="ins-tile">
      <span className="stat-label">Accuracy, last {w.days} days</span>
      <strong className="ins-big">{w.questions ? pct(w.accuracy) : '–'}</strong>
      <span className="small muted">
        {w.questions ? `Latest try on ${plural(w.questions, 'question')}: ${w.right} right` : 'No answers in this period'}
      </span>
    </div>
  );
}

function Overview({ report }: { report: Report }) {
  const { counts, itemNoun } = report;
  const oneCourse = report.courses.length === 1 ? report.courses[0].course.id : undefined;
  return (
    <div className="ins-tiles">
      <WindowTile w={report.week} />
      <WindowTile w={report.month} />
      <div className="ins-tile">
        <span className="stat-label">{cap(itemNoun)}</span>
        <div className="ins-counts">
          <span>
            <strong>{counts.mastered}</strong> mastered
          </span>
          <span>
            <strong>{counts.learning}</strong> in progress
          </span>
          <span>
            <strong>{counts.struggling}</strong> struggling
          </span>
        </div>
        <span className="small muted">{counts.untested} not practised yet</span>
      </div>
      <a className={`ins-tile ins-tile-link${report.due ? ' attention' : ''}`} href={href('review', ...(oneCourse ? ['start', oneCourse] : []))}>
        <span className="stat-label">Reviews due</span>
        <strong className="ins-big">{report.due}</strong>
        <span className="small muted">
          {report.due ? (report.oldestDueDays >= 1 ? `Oldest waiting ${plural(report.oldestDueDays, 'day')}` : 'Due today') : 'All caught up'}
        </span>
      </a>
    </div>
  );
}

// ---------- needs attention ----------

/** Rolling accuracy over the latest answers: one 2px line in the course accent, a marker on the latest point. */
function Sparkline({ item }: { item: ItemStats }) {
  const W = 84;
  const H = 30;
  const pad = 4;
  const ys = item.trend;
  if (!ys.length) return <span className="ins-spark-empty muted small">no history</span>;
  const x = (i: number) => (ys.length === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (ys.length - 1));
  const y = (v: number) => pad + (1 - v) * (H - 2 * pad);
  const pts = ys.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const results = [...item.recent].map((c) => (c === '1' ? 'right' : 'wrong'));
  const slot = (W - 2 * pad) / Math.max(ys.length - 1, 1);
  return (
    <svg className="ins-spark" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Latest ${results.length} answers, oldest first: ${results.join(', ')}`}>
      <line x1={pad} x2={W - pad} y1={y(0.5)} y2={y(0.5)} className="ins-spark-mid" />
      {ys.length > 1 && <polyline points={pts} className="ins-spark-line" />}
      <circle cx={x(ys.length - 1)} cy={y(ys[ys.length - 1])} r={4} className="ins-spark-dot" />
      {ys.map((v, i) => (
        <rect key={i} x={x(i) - slot / 2} y={0} width={slot} height={H} className="ins-spark-hit">
          <title>{`Answer ${i + 1} of ${ys.length}: ${results[i]} (last 3: ${Math.round(v * 100)}% right)`}</title>
        </rect>
      ))}
    </svg>
  );
}

function WeakList({ report }: { report: Report }) {
  const noun = report.itemNoun;
  if (!report.weak.length) {
    const thin = report.courses.flatMap((c) => c.items).filter((i) => i.attempts > 0 && i.thin).length;
    return (
      <p className="muted small">
        Nothing stands out right now.
        {thin > 0 && ` ${cap(plural(thin, singular(noun), noun))} ${thin === 1 ? 'has' : 'have'} fewer than ${MIN_ATTEMPTS} answers, so it's too early to tell.`}
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
                {report.courses.length > 1 && `${i.courseTitle} · `}
                {i.kind === 'concept' ? `Lesson "${i.lessonTitle}"` : i.unitTitle}
                {i.lastSeen !== null && ` · last answered ${ago(i.lastSeen)}`}
                {i.due > 0 && ` · ${i.due} due`}
              </span>
              <span className="small ins-weak-why">{missText(i)}</span>
            </div>
            <Sparkline item={i} />
            {i.kind === 'concept' && (
              <a className="btn small" href={href('practice', i.courseId, i.id)} aria-label={`Practise ${i.label} with related ideas`}>
                Practise
              </a>
            )}
          </li>
        );
      })}
      {report.weak.length > 6 && <li className="muted small">and {report.weak.length - 6} more in the course views below</li>}
    </ul>
  );
}

// ---------- patterns ----------

function TypeBars({ types }: { types: TypeStats[] }) {
  return (
    <figure className="hbars ins-types" aria-label="Accuracy by question format">
      {types.map((t) => (
        <div key={t.type} className="hbar-row tip" data-tip={`${t.label}: ${t.right} of ${t.attempts} right`} tabIndex={0}>
          <span className="hbar-label">{t.label}</span>
          <span className="hbar-track">
            <span className="hbar-mark" style={{ width: `${t.accuracy * 100}%` }} />
          </span>
          <span className="hbar-value">{pct(t.accuracy)}</span>
        </div>
      ))}
      <table className="sr-only">
        <tbody>
          {types.map((t) => (
            <tr key={t.type}>
              <th>{t.label}</th>
              <td>
                {t.right} of {t.attempts} right ({pct(t.accuracy)})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Patterns({ report }: { report: Report }) {
  const shown = report.types.filter((t) => t.attempts >= MIN_TYPE_ATTEMPTS);
  const hidden = report.types.length - shown.length;
  return (
    <>
      <h3 className="ins-sub">Accuracy by question format</h3>
      {shown.length ? (
        <TypeBars types={shown} />
      ) : (
        <p className="muted small">Each format needs {MIN_TYPE_ATTEMPTS} answers before it's shown here.</p>
      )}
      {hidden > 0 && shown.length > 0 && (
        <p className="muted small">
          {plural(hidden, 'format')} with fewer than {MIN_TYPE_ATTEMPTS} answers {hidden === 1 ? 'is' : 'are'} left out. All answers so far count.
        </p>
      )}
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
        <p className="muted small ins-patterns-none">
          No clear patterns yet: no format gap, nothing forgotten, reviews under control, and no skipped core lessons.
        </p>
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

function chipTip(i: ItemStats) {
  if (i.mastery === 'none') return 'No practice questions yet';
  if (!i.attempts) return `${i.questions} question${i.questions === 1 ? '' : 's'}, not practised yet`;
  const recent = i.recentCount && !i.allTime ? `, last ${i.recentCount}: ${pct(i.recentAccuracy)}` : '';
  return `${i.right}/${i.attempts} right${recent}${i.thin ? ' (too few answers to judge)' : ''}`;
}

function ItemChip({ item, showCourse }: { item: ItemStats; showCourse?: boolean }) {
  return (
    <a
      className={`ins-chip ${item.mastery}${item.thin && item.attempts ? ' thin' : ''} tip`}
      href={href('course', item.courseId, 'lesson', item.lessonId)}
      data-tip={chipTip(item)}
      aria-label={`${item.label}: ${STATE_LABEL[item.mastery]}. ${chipTip(item)}`}
    >
      <StateMark state={item.mastery} />
      {item.label}
      {showCourse && <span className="ins-chip-course">{item.courseTitle}</span>}
    </a>
  );
}

function Legend() {
  const states: Mastery[] = ['mastered', 'learning', 'struggling', 'untested'];
  return (
    <ul className="ins-legend" aria-label="Legend">
      {states.map((s) => (
        <li key={s}>
          <span className={`ins-chip ${s} ins-legend-chip`} aria-hidden>
            <StateMark state={s} />
          </span>
          {STATE_LABEL[s]}
        </li>
      ))}
    </ul>
  );
}

function CourseMastery({ r, focused }: { r: CourseReport; focused: boolean }) {
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
            {n.mastered} of {n.total} {r.hasGraph ? 'concepts' : 'lessons'} mastered
            {!r.hasGraph && ' · grouped by lesson until this course has a concept map'}
          </span>
        </div>
        <div className="row wrap ins-course-actions">
          {!focused && (
            <a className="btn small" href={href('insights', course.id)}>
              Focus
            </a>
          )}
          <a className="btn small" href={href('practice', course.id)}>
            Mixed practice
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
  const p = useProgress();
  const started = useMemo(() => courses.filter((c) => isStarted(c, p)), [p]);
  const report = useMemo(() => (hasEnoughForReport(started, p) ? buildReport(started, p) : null), [started, p]);
  if (!report) return null;
  const top = report.weak[0];
  const line = top
    ? `${missText(top)} See how to improve.`
    : report.counts.mastered
      ? `${plural(report.counts.mastered, singular(report.itemNoun), report.itemNoun)} mastered. See what to practise next.`
      : 'See what you miss, what you struggle with, and how to improve.';
  return (
    <a className="ins-teaser" href={href('insights')}>
      <span className="ins-teaser-icon" aria-hidden>
        <Icon name="trendUp" size={24} />
      </span>
      <span className="grow">
        <span className="eyebrow">Your learning report</span>
        <span className="ins-teaser-line">{line}</span>
      </span>
      <span className="ins-teaser-go" aria-hidden>
        →
      </span>
    </a>
  );
}
