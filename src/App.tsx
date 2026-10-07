import { contentErrors, getCourse } from './content';
import { CheckEmail, DevMailbox, Forgot, Reset, SignIn, SignUp, Verify } from './components/Auth';
import { CertificatePage, PublicCertificate } from './components/Certificate';
import { CheatSheet } from './components/CheatSheet';
import { CoursePage } from './components/CoursePage';
import { DevGames } from './components/DevGames';
import { Courses } from './components/Courses';
import { Home } from './components/Home';
import { Insights } from './components/Insights';
import { KnowledgeMap } from './components/KnowledgeMap';
import { Page } from './components/Layout';
import { LessonPlayer } from './components/LessonPlayer';
import { MixedPractice } from './components/MixedPractice';
import { Notebook } from './components/Notebook';
import { Profile } from './components/Profile';
import { Quiz } from './components/Quiz';
import { Review, ReviewSession } from './components/Review';
import { Roadmap } from './components/Roadmap';
import { useAuth } from './lib/auth';
import { useRoute } from './lib/router';
import { Icon } from './components/icons';

export function App() {
  const route = useRoute();
  return (
    <>
      {contentErrors.length > 0 && (
        <div className="content-errors" role="alert">
          <strong>Some course files have problems and were skipped:</strong>
          <ul>
            {contentErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <Route route={route} />
    </>
  );
}

function Route({ route }: { route: string[] }) {
  const { user } = useAuth();
  const [section, a, b, c] = route;

  switch (section) {
    case undefined:
      return <Home />;
    case 'courses':
      return <Courses />;
    case 'roadmap':
      return <Roadmap trackId={a} />;
    case 'review':
      if (a === 'start' || a === 'weak') return <ReviewSession key={route.join('/')} mode={a} courseId={b} />;
      return <Review />;
    case 'profile':
      return <Profile />;
    case 'certificate':
      if (a) return <PublicCertificate key={a} id={a} />;
      break;
    case 'notebook':
      return <Notebook />;
    case 'insights':
      return <Insights courseId={a} />;
    case 'practice':
      return <MixedPractice key={route.join('/')} courseId={a} conceptId={b} />;
    case 'signin':
      return user ? <Redirect to="#/" /> : <SignIn />;
    case 'signup':
      return user ? <Redirect to="#/" /> : <SignUp />;
    case 'check-email':
      return <CheckEmail email={a ?? ''} />;
    case 'verify':
      return <Verify token={a ?? ''} />;
    case 'forgot':
      return <Forgot />;
    case 'reset':
      return <Reset token={a ?? ''} />;
    case 'dev':
      if (a === 'mailbox') return <DevMailbox />;
      if (a === 'games' && import.meta.env.DEV) return <DevGames key={route.join('/')} index={b} mode={c} />;
      break;
    case 'topic': // old links
    case 'course': {
      const course = a ? getCourse(a) : undefined;
      if (!course) break;
      if (!b) return <CoursePage course={course} />;
      if (b === 'quiz') return <Quiz key={course.id} course={course} />;
      if (b === 'cheatsheet') return <CheatSheet course={course} />;
      if (b === 'map') return <KnowledgeMap key={course.id} courseId={course.id} />;
      if (b === 'certificate') return <CertificatePage key={course.id} course={course} />;
      const lesson = b === 'lesson' ? course.lessons.find((l) => l.id === c) : undefined;
      if (lesson) return <LessonPlayer key={`${course.id}/${lesson.id}`} course={course} lesson={lesson} />;
      break;
    }
  }

  return (
    <Page>
      <section className="center empty-state">
        <div className="celebrate" aria-hidden>
          <Icon name="compass" size={72} />
        </div>
        <h1>Page not found</h1>
        <p className="lead">That link doesn't lead anywhere.</p>
        <a className="btn primary" href="#/">
          Go home
        </a>
      </section>
    </Page>
  );
}

function Redirect({ to }: { to: string }) {
  queueMicrotask(() => {
    window.location.hash = to;
  });
  return null;
}
