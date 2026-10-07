# ProjectLearn: notes for Claude

## Content rules
- **Interactive learning is the default.** Every lesson must include at least one interactive step: `output`, `bug`, `order`, `buckets`, `trace`, `truthtable`, `logicgrid`, `balance` or `sim`. The validator rejects lessons without one. Prefer interactive steps over `mcq`; keep `mcq` for judgement calls.
- **No emoji as icons or decoration.** Course and track icons are `logo:<name>` (SVGs in `src/assets/logos/`) or a 1–5 character monogram; UI icons come from `src/components/icons.tsx`. The validator rejects emoji icons.
- **Every course has a concept graph** (`concepts` + `links`) and every graded step lists the `concepts` it tests. These power the insights report, mixed practice and the knowledge-map canvas. `check:content` enforces 8–24 concepts, a tag on every graded step, a test for every concept and a concept in every lesson.
- **Every study session is a thinking session** (`src/lib/thinking.ts`, `src/components/paper/`): lessons open with "make it wrong" and close with "make it shorter"; every session opens with "make it again" when a sheet is due. `Session` takes a required `ritual` prop so new session types can't skip it. Don't add ways to bypass the phases.
- Lessons stay at 10 steps or fewer. To add practice to a full lesson, convert an `mcq` that tests the same idea and **keep its `id`** (spaced-review history is keyed on `course/lesson/question` ids).
- Verify every code snippet, printed output, error message, bug fix and wrong fix with the real toolchain before it goes into a course. Trace frames are recorded from real runs, never written by hand.
- **Every user-facing string is translated** (en, pt-BR, es, fr). UI text lives in `src/i18n/en/<namespace>.ts` and its translations in `src/i18n/{pt-BR,es,fr}/`: never hard-code English in a component; use `useT()` (components) or `t()` from `src/i18n/core.ts` (pure libs), with plurals and placeholders instead of string building. Adding a key means adding it to all four locales (TypeScript enforces it). Changing an English course means updating its translations in `src/content/topics/<locale>/` too (`check:content` flags structural drift). Guide: `docs/TRANSLATING.md`.
- Authoring guide and schemas: `docs/NEW_TOPIC_PROMPT.md`, `src/types.ts`, `src/content/validate.ts`.

## Checks
- `npm run check:content`: validates every course, every translation (as a course and as a mirror of the English file) and the roadmap.
- `npm run i18n:status`: which courses and catalogs exist in which language.
- `npm test`: node:test suites in `tests/`. Pure logic lives in `src/lib/` modules with no runtime imports so these tests can load them.
- `npm run typecheck`, `npm run build`.
- `#/dev/games` (dev server only) opens any game or simulator step directly.
