# ProjectLearn

A Brilliant-style learning site built on the **80/20 principle**: every course starts with the few ideas that carry most of the value (core lessons), taught through worked examples and exercises, then kept in memory with quizzes and spaced repetition.

**Courses:** Learn Anything Fast · Logical Thinking · Critical Thinking · Analytical Thinking · Everyday Math · Probability · Big-O Thinking · Python · Java (8 → 25) · Kotlin · Unit Testing · SQL · Git · Spring Boot · System Design · Software Architecture

## Run it

```bash
npm install
npm run db:local   # starts Postgres in ./data/pg on port 5433 (needs Postgres installed, e.g. brew install postgresql@17)
npm run dev
```

Put `DATABASE_URL=postgres://localhost:5433/projectlearn` in `.env` (see `.env.example`). `npm run db:stop` stops the database. Without a database the site still works; only sign-in and progress sync need it.

Open http://localhost:5173. This starts two processes: the website (Vite, port 5173) and the API server (Node, port 3001). The site forwards `/api` calls to the API.

**Emails in development:** without SMTP settings, confirmation and password-reset emails are not really sent. They appear in the **dev mailbox** at http://localhost:5173/#/dev/mailbox and in the terminal.

**Real emails:** copy `.env.example` to `.env` and fill in the `SMTP_*` settings (for Gmail, use an App Password).

## Deploy to Vercel

The site is static files (`dist/`) and the API runs as one serverless function (`api/index.ts` wraps the Express app in `server/app.ts`). `vercel.json` holds the build settings and sends `/api/*` to the function. Accounts and synced progress live in Postgres (Neon); the tables are created on the first request.

1. **Import the repo:** vercel.com → Add New → Project → pick this GitHub repo. The settings come from `vercel.json`; leave them as they are.
2. **Database:** in the project, Storage → Create Database → Neon → connect it to the project for all environments. This sets `DATABASE_URL`.
3. **Environment variables** (Settings → Environment Variables, Production):
   - `APP_URL` = `https://learning.mentor-hub.space` (used in email links; makes the session cookie `Secure`).
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`: required for sign-up, since new accounts must confirm their email. Without them, emails are only written to the function logs.
4. **Domain:** Settings → Domains → add `learning.mentor-hub.space`. The `mentor-hub.space` DNS is managed by Vercel, so the record is created for you.
5. **Deploy:** every push to `main` deploys to production; other branches get preview URLs.

Check it with `https://learning.mentor-hub.space/api/auth/me`, which should return `{"user":null}`.

`npx vercel build` runs the same build locally, after `npx vercel link` (needs your Vercel login).

**One server instead:** `npm run build && npm start` serves the site and API from one Node process on `PORT` (default 3001). It needs `DATABASE_URL` and `APP_URL`.

## Features

| Area | What it does |
| --- | --- |
| **Accounts** | Sign up with username, email and password. You must confirm your email before you can sign in. Includes forgot/reset password, change password and delete account. |
| **Guest mode** | Everything works without an account; progress is kept in the browser. When you sign up or sign in, it's merged into your account. |
| **Sync** | When you're signed in, progress (XP, streak, reviews, completed lessons) is saved to the server automatically. |
| **Courses page** | Search, and filter by category. Each card shows the core lesson count and an estimated time. |
| **Course page** | A learning path grouped into units, with **Core** and **Deep dive** labels. A *Fast track* switch shows only core lessons. The sidebar has key ideas, mastery, the quiz and the cheat sheet. |
| **Lesson player** | Step-by-step: explanations, worked examples revealed one step at a time, and practice: interactive steps first (predict the output, find the bug, put in order, sort into buckets, trace the code, simulators for Git, SQL joins, dice and Big-O), plus multiple choice, number and short text. Answer feedback appears in a bottom bar with hints, retries and explanations. Code is syntax-highlighted. |
| **Quiz** | 12 questions mixed from across the course. The results list which lessons to study and which you can skip. |
| **Review** | Spaced repetition: correct answers wait 1 → 3 → 7 → 16 → 35 days, misses come back right away. Shows a 7-day forecast, memory strength, and per-course review. |
| **XP & levels** | XP for answers and lessons, levels with titles, a daily goal ring, a streak, a weekly chart and an activity heatmap on your profile. |

## Security notes

- Passwords are hashed with scrypt (random salt per user). Plain-text passwords are never stored or logged.
- Sessions, email confirmation and reset links are random tokens. The database stores only their SHA-256 hashes, and confirmation/reset tokens work once.
- The session cookie is `HttpOnly` and `SameSite=Lax`. API calls that change data must be JSON from the site's own origin.
- Sign-in, sign-up and email endpoints are rate-limited. The counters live in Postgres, so the limits hold across serverless instances. "Resend" and "forgot password" don't reveal whether an email has an account.

## Adding a course

Courses are JSON files in [`src/content/topics/`](src/content/topics). Add a file and refresh; it appears automatically. Check every course file with:

```bash
npm run check:content
```

The quickest way to write one is to have Claude do it using [`docs/NEW_TOPIC_PROMPT.md`](docs/NEW_TOPIC_PROMPT.md). The schema is in [`src/types.ts`](src/types.ts).

**Interactive by default:** every lesson must include at least one interactive step (predict the output, find the bug, put in order, sort into buckets, trace the code, or a simulator). The validator rejects lessons without one. Open any of them directly at http://localhost:5173/#/dev/games while developing.

> Review history is keyed on `course id / lesson id / question id`. If you rename an id, that question's review history starts over.

## Project layout

```
src/
  content/topics/*.json   courses (the only files you touch to add content)
  content/validate.ts     course validator (used by the app and npm run check:content)
  components/             pages: Home, Courses, CoursePage, LessonPlayer, Quiz, Review, Profile, Auth
  lib/storage.ts          progress, XP, levels, streak, spaced-repetition scheduling
  lib/auth.ts             session state and progress sync
server/
  app.ts                  API routes: auth, account, progress, dev mailbox
  index.ts                runs the API locally (and serves dist/ with npm start)
  security.ts             password hashing, tokens, rate limiting
  mail.ts                 email via SMTP (or dev mailbox)
  db.ts                   Postgres pool and schema (created on first use)
api/index.ts              Vercel serverless entry for the same app
vercel.json               Vercel build settings and the /api rewrite
```

## Credits

Technology logos in `src/assets/logos/` (Python, Java, Kotlin, Git, Spring) come from [Devicon](https://github.com/devicons/devicon) (MIT licence). The logos themselves are trademarks of their respective owners and are used only to identify the course topics.
