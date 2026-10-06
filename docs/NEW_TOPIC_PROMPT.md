# Prompt: generate a new 80/20 topic

Copy everything in the box below into Claude (or ask Claude Code directly: *"add a topic about X using docs/NEW_TOPIC_PROMPT.md"*).
Replace `<TOPIC>` and `<GOAL>`, save the result as `src/content/topics/<id>.json`, run `npm run check:content`, and refresh the site.
If anything in the file is malformed, the site shows a red banner telling you exactly what to fix.

---

```
Create a learning topic about <TOPIC> for my learning app. My goal: <GOAL>
(e.g. "understand enough to read news about it", "pass an intro exam", "use it at work").

Use the 80/20 principle:
1. First decide which 20% of concepts give 80% of the practical value for MY goal.
   Those lessons get "pareto": "core"; useful-but-secondary material gets "pareto": "extra".
   Aim for roughly 2/3 core, 1/3 extra. Group lessons into 2–4 units; within each unit,
   core lessons come first. Lesson ids must be unique across the whole course.
2. Teach through doing, like Brilliant: interactive practice is the DEFAULT, not an extra.
   Each lesson is 5–10 short steps that alternate short explanations (max ~120 words), worked
   examples revealed step by step, and practice. Every lesson has at least 3 graded steps, and
   EVERY lesson must include at least one interactive step: output, bug, order, buckets, trace,
   truthtable, logicgrid, balance or sim (the app rejects lessons without one). Prefer interactive steps over mcq whenever the
   idea allows it: sequences → order, classifying → buckets, code state over time → trace,
   "what does it print" → output, broken code/commands → bug. Use mcq for judgement calls only.
   Prefer practice that makes the learner APPLY the idea to a new case over repeating a definition.
3. Every question has an explanation of WHY the answer is right. Add a "hint" for harder ones.
   Wrong mcq choices should be realistic misconceptions, not jokes.
   Avoid "all of the above" / "none of the above" (choices get shuffled in quizzes).
4. "keyIdeas": 4–6 one-line statements that summarize the whole topic.
   Each lesson's "takeaway" is one sentence worth remembering.
5. Facts must be accurate. If something is debated or approximate, say so.

Output ONLY valid JSON matching this schema:

{
  "id": "kebab-case-id",
  "title": "Short Title",
  "icon": "one emoji",
  "color": "#hex color",
  "order": 20,
  "category": "Programming | Math | Learning | ...",
  "level": "Beginner | Intermediate | Advanced",
  "description": "One sentence: what you'll be able to do.",
  "keyIdeas": ["...", "..."],
  "units": [
    { "id": "unit-id", "title": "Unit title", "description": "optional", "lessons": [
    {
      "id": "kebab-case",
      "title": "...",
      "pareto": "core" | "extra",
      "minutes": 5,
      "takeaway": "One sentence.",
      "steps": [
        { "type": "explain", "title": "optional", "body": "text" },
        { "type": "example", "title": "optional", "problem": "text",
          "steps": ["step 1", "step 2"], "answer": "final answer (optional)" },
        { "type": "mcq", "id": "q-unique-in-lesson", "prompt": "text",
          "choices": ["a", "b", "c", "d"], "answer": 0,
          "hint": "optional", "explanation": "text" },
        { "type": "numeric", "id": "q-...", "prompt": "text", "answer": 0.25,
          "tolerance": 0.01, "unit": "optional", "hint": "optional", "explanation": "text" },
        { "type": "text", "id": "q-...", "prompt": "text",
          "accept": ["answer", "alternative spelling"], "explanation": "text" },
        { "type": "output", "id": "q-...", "prompt": "What does this print?",
          "language": "python", "code": "plain code, no fences",
          "output": "exact printed text, one line per printed line", "explanation": "text" },
        { "type": "bug", "id": "q-...", "prompt": "What should happen. Click the line with the bug.",
          "language": "python", "code": "plain code, no fences",
          "error": "the error message or wrong output it produces (optional)",
          "lines": [3], "fixes": ["Change line 3 to `...`", "...", "..."], "answer": 0,
          "explanation": "text" },
        { "type": "order", "id": "q-...", "prompt": "Put these in the order they happen:",
          "items": ["first", "second", "third"], "explanation": "text" },
        { "type": "buckets", "id": "q-...", "prompt": "Sort each card:",
          "buckets": ["Category A", "Category B"],
          "items": [{ "text": "card", "bucket": 0 }, { "text": "card", "bucket": 1 }],
          "explanation": "text" },
        { "type": "trace", "id": "q-...", "prompt": "Step through and predict the values.",
          "language": "python", "code": "plain code, no fences",
          "frames": [{ "line": 1, "vars": { "x": "1" } },
                     { "line": 2, "vars": { "x": "2" }, "ask": "x", "note": "optional caption" }],
          "explanation": "text" },
        { "type": "truthtable", "id": "q-...", "prompt": "Fill in the table.", "vars": ["P", "Q"],
          "columns": [{ "expr": "not Q", "given": true }, { "expr": "P -> Q", "label": "If P then Q" }],
          "explanation": "text" },
        { "type": "logicgrid", "id": "q-...", "prompt": "Who owns what?",
          "categories": [{ "name": "Person", "items": ["Ana", "Ben", "Cy"] },
                         { "name": "Pet", "items": ["cat", "dog", "fish"] }],
          "clues": ["Ana is allergic to fur.", "..."],
          "solution": [["fish"], ["cat"], ["dog"]], "explanation": "text" },
        { "type": "balance", "id": "q-...", "prompt": "Get x alone.",
          "left": [2, 3], "right": [0, 9], "explanation": "text" },
        { "type": "sim", "sim": "git", "title": "optional", "body": "task text",
          "goal": { "text": "Merge feature into main", "merged": [{ "from": "feature", "into": "main" }] } },
        { "type": "sim", "sim": "dice", "dice": 2, "sides": 6, "target": [7], "goalRolls": 500 },
        { "type": "sim", "sim": "growth", "curves": ["n", "n^2"], "maxN": 1000000 },
        { "type": "sim", "sim": "join", "left": { "name": "customers", "columns": ["id", "name"],
          "rows": [[1, "Ana"]] }, "right": { "name": "orders", "columns": ["id", "customer_id"],
          "rows": [[10, 1]] }, "on": ["id", "customer_id"] }
      ]
    }
    ] }
  ]
}

Code blocks may name a language for highlighting: ```python, ```java or ```kotlin.
Any asterisk outside backticks becomes emphasis, so keep code like `*args` in backticks.
For "text" answers, comparison keeps only letters and digits — use mcq for symbol answers like "?:".

Interactive steps (at least one per lesson; they make the learner produce or manipulate an answer
instead of recognizing one):
- "output": the learner types what the code prints. Comparison is case-sensitive but ignores extra
  spaces and blank lines at the ends. Keep output short (1–4 lines) and deterministic: no set or
  hash ordering, no timestamps, no memory addresses.
- "bug": the learner clicks the broken line, then picks the fix. "lines" lists the 1-based line
  numbers that count as finding the bug (usually one; add a second only if it's equally fair).
  Write fixes that refer to line numbers, and make the wrong fixes plausible attempts that would
  NOT work. "error" shows the real message (or the wrong output) — take it from an actual run,
  with file/line locations replaced by "  ..." so it doesn't give the line away.
- "order": 3–8 different items, written in the CORRECT order (the app shuffles them).
- "buckets": 2–4 bucket labels and 6–10 cards; every bucket gets at least one card.
- "trace": 5–12 frames. Each frame is the line that just ran plus every variable afterwards, written
  the way the language prints it ('hi', [1, 2], None). 2–3 frames have "ask" (a variable to predict).
  Record frames from a real run, never by hand.
- "sim" (ungraded playground; "goal" or "goalRolls" unlocks Continue): "git" supports commit, branch,
  switch/checkout (-c/-b), merge, log, status; "dice" rolls 1–3 dice; "growth" races complexity
  classes ("1", "log n", "n", "n log n", "n^2", "2^n"); "join" shows INNER/LEFT/RIGHT/FULL joins.
- "truthtable": 1–3 "vars"; each column's "expr" uses not/and/or/xor/->/<-> (or ¬ ∧ ∨ ⊕ → ↔) and parentheses.
  The correct cells are computed from the expression, so only the expression must be right. "given": true
  shows a helper column already filled in.
- "logicgrid": 2–3 categories of 3–5 items; the first category labels the rows. "solution" has one row
  per first-category item listing its match in each other category. The clues must lead to exactly ONE
  solution — check it with a brute-force solver before publishing.
- "balance": the equation a·x + b = c·x + d as "left": [a, b], "right": [c, d], whole numbers from -20
  to 20, with a whole-number solution. The learner applies the same move to both sides; solving in the
  fewest possible moves counts as a first-try success.
- Non-programming topics use order, buckets, truthtable, logicgrid, balance and the matching simulators —
  not output/bug/trace.

Formatting inside text fields: **bold**, *italic*, `code`, lines starting with "- " for
bullet lists, a blank line ("\n\n") between paragraphs, and ``` fences for code blocks.
"answer" in mcq is the 0-based index of the correct choice.
For numeric answers that aren't whole numbers, set "tolerance" (e.g. 0.005 for probabilities).
```

---

## Tips for choosing topics

- **Start with 1–2 topics at a time.** Finish their core lessons before adding more.
- **Make the goal specific.** "Learn SQL" → "write queries to answer business questions from a sales database". A specific goal makes the 80/20 cut much sharper.
- **Use the quiz as a diagnostic.** Take a new topic's quiz first; only study the lessons it flags.
- **Check the facts in generated content**, especially numbers and dates, before you rely on them.
