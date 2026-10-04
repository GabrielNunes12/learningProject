# ProjectLearn

A Brilliant-style learning site built on the **80/20 principle**: every course starts with the few ideas that carry most of the value (core lessons), taught through worked examples and exercises, then kept in memory with quizzes and spaced repetition.

**Courses:** Learn Anything Fast · Probability · Big-O Thinking · Python · Java (8 → 25) · Kotlin · Unit Testing

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. This starts two processes: the website (Vite, port 5173) and the API server (Node, port 3001). The site forwards `/api` calls to the API.

**Emails in development:** without SMTP settings, confirmation and password-reset emails are not really sent. They appear in the **dev mailbox** at http://localhost:5173/#/dev/mailbox and in the terminal.

**Real emails:** copy `.env.example` to `.env` and fill in the `SMTP_*` settings (for Gmail, use an App Password).

## Production

```bash
npm run build
npm start
```

`npm start` serves the built site and the API from one Node process on `PORT` (default 3001). Set `APP_URL` to your public address so that links in emails are correct. Put the server behind HTTPS (most hosts do this for you); session cookies are marked `Secure` automatically when `APP_URL` starts with `https://`. The database is a single SQLite file in `data/` (or `DATA_DIR`). Back it up.

## Features

| Area | What it does |
| --- | --- |
| **Accounts** | Sign up with username, email and password. You must confirm your email before you can sign in. Includes forgot/reset password, change password and delete account. |
| **Guest mode** | Everything works without an account; progress is kept in the browser. When you sign up or sign in, it's merged into your account. |
| **Sync** | When you're signed in, progress (XP, streak, reviews, completed lessons) is saved to the server automatically. |
| **Courses page** | Search, and filter by category. Each card shows the core lesson count and an estimated time. |
| **Course page** | A learning path grouped into units, with **Core** and **Deep dive** labels. A *Fast track* switch shows only core lessons. The sidebar has key ideas, mastery, the quiz and the cheat sheet. |
| **Lesson player** | Step-by-step: explanations, worked examples revealed one step at a time, and questions (multiple choice, number, short text). Answer feedback appears in a bottom bar with hints, retries and explanations. Code is syntax-highlighted. |
| **Quiz** | 12 questions mixed from across the course. The results list which lessons to study and which you can skip. |
| **Review** | Spaced repetition: correct answers wait 1 → 3 → 7 → 16 → 35 days, misses come back right away. Shows a 7-day forecast, memory strength, and per-course review. |
| **XP & levels** | XP for answers and lessons, levels with titles, a daily goal ring, a streak, a weekly chart and an activity heatmap on your profile. |

## Security notes

- Passwords are hashed with scrypt (random salt per user). Plain-text passwords are never stored or logged.
- Sessions, email confirmation and reset links are random tokens. The database stores only their SHA-256 hashes, and confirmation/reset tokens work once.
- The session cookie is `HttpOnly` and `SameSite=Lax`. API calls that change data must be JSON from the site's own origin.
- Sign-in, sign-up and email endpoints are rate-limited. "Resend" and "forgot password" don't reveal whether an email has an account.

## Adding a course

Courses are JSON files in [`src/content/topics/`](src/content/topics). Add a file and refresh; it appears automatically. Check every course file with:

```bash
npm run check:content
```

The quickest way to write one is to have Claude do it using [`docs/NEW_TOPIC_PROMPT.md`](docs/NEW_TOPIC_PROMPT.md). The schema is in [`src/types.ts`](src/types.ts).

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
  index.ts                API: auth, account, progress, dev mailbox; serves dist/ in production
  security.ts             password hashing, tokens, rate limiting
  mail.ts                 email via SMTP (or dev mailbox)
  db.ts                   SQLite schema (node:sqlite, nothing to install)
```
