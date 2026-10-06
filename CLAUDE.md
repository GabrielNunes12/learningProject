# ProjectLearn: notes for Claude

## Content rules
- **Interactive learning is the default.** Every lesson must include at least one interactive step: `output`, `bug`, `order`, `buckets`, `trace`, `truthtable`, `logicgrid`, `balance` or `sim`. The validator rejects lessons without one. Prefer interactive steps over `mcq`; keep `mcq` for judgement calls.
- **No emoji as icons or decoration.** Course and track icons are `logo:<name>` (SVGs in `src/assets/logos/`) or a 1–5 character monogram; UI icons come from `src/components/icons.tsx`. The validator rejects emoji icons.
- Lessons stay at 10 steps or fewer. To add practice to a full lesson, convert an `mcq` that tests the same idea and **keep its `id`** (spaced-review history is keyed on `course/lesson/question` ids).
- Verify every code snippet, printed output, error message, bug fix and wrong fix with the real toolchain before it goes into a course. Trace frames are recorded from real runs, never written by hand.
- Authoring guide and schemas: `docs/NEW_TOPIC_PROMPT.md`, `src/types.ts`, `src/content/validate.ts`.

## Checks
- `npm run check:content`: validates every course and `src/content/roadmap.json`.
- `npm test`: node:test suites in `tests/`. Pure logic lives in `src/lib/` modules with no runtime imports so these tests can load them.
- `npm run typecheck`, `npm run build`.
- `#/dev/games` (dev server only) opens any game or simulator step directly.
