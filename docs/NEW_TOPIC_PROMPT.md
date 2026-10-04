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
2. Teach through doing, like Brilliant: each lesson is 5–8 short steps that alternate
   short explanations (max ~120 words), worked examples revealed step by step, and questions.
   Every lesson has at least 3 questions. Prefer questions that make the learner APPLY the
   idea to a new case over questions that ask them to repeat a definition.
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
          "accept": ["answer", "alternative spelling"], "explanation": "text" }
      ]
    }
    ] }
  ]
}

Code blocks may name a language for highlighting: ```python, ```java or ```kotlin.
Any asterisk outside backticks becomes emphasis, so keep code like `*args` in backticks.
For "text" answers, comparison keeps only letters and digits — use mcq for symbol answers like "?:".

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
