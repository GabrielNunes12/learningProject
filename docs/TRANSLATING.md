# Translating ProjectLearn

The site speaks **English** (`en`, the source of truth and fallback), **Brazilian Portuguese** (`pt-BR`),
**Spanish** (`es`) and **French** (`fr`). This guide is for anyone (human or agent) translating the interface
or a course. Follow it literally: the validators enforce most of it.

## How it works

| What | English source | Translations | Loaded |
| --- | --- | --- | --- |
| Interface strings | `src/i18n/en/<namespace>.ts` | `src/i18n/<locale>/<namespace>.ts` | English bundled; others fetched when the language is picked |
| Courses | `src/content/topics/<id>.json` | `src/content/topics/<locale>/<id>.json` | Like English, in two parts: a language's catalogs (titles, summaries, concepts) are fetched when it is picked; a course's translated steps come with its steps when it opens |
| Roadmap tracks | `src/content/roadmap.json` | `src/content/roadmap.<locale>.json` | same as courses |
| Emails | `src/i18n/<locale>/email.ts` | (part of the catalogs) | server-side |

- **Language choice:** on the first visit the browser's language decides (`pt*` → pt-BR, `es*` → es, `fr*` → fr,
  anything else → en). The globe chip in the header and the Profile page switch it; the choice is saved in the
  browser and in synced progress (`Progress.locale`), so it follows a signed-in learner to other devices.
- **Fallback:** a course without a translation (or with an invalid one) is shown in English, so courses can be
  translated one at a time. A missing interface key can't happen: TypeScript fails the build.
- **Progress is shared** across languages: completed lessons, reviews, maps, sheets and certificates are keyed by
  ids, never by text. Never change an id in a translation.
- Switching language mid-lesson keeps the learner's place; the current step re-renders in the new language.

## Translating a course (phase 2: one course at a time)

1. Copy the English file: `cp src/content/topics/<id>.json src/content/topics/<locale>/<id>.json`
   (`<locale>` is `pt-BR`, `es` or `fr`; the file name must be the course id).
2. Translate **only** the fields marked *translate* in the table below, in place. Keep every key, the order of
   everything, and every other value exactly as it is.
3. Run `npm run check:content`. It validates the file as a course AND compares it field by field with English.
   Fix everything it reports.
4. Run `npm run i18n:status -- --verbose` and look at the text it lists as *identical to English*: names and
   notation are fine; anything else is a field you forgot.
5. Read the result in the app (`npm run dev`, switch language with the globe chip, open the course and play
   a lesson). Long words can overflow narrow buttons: check at 375 px wide.
6. Use the reference translations of `learn-anything-fast` (`src/content/topics/{pt-BR,es,fr}/learn-anything-fast.json`)
   as the model for tone and terminology.

### Fields: translate vs. keep identical

The rules live in `src/content/translation.ts` (`COURSE_FIELDS`, `STEP_FIELDS`). *Keep* means byte-for-byte
identical to English; the validator rejects any difference.

| Where | Translate | Keep identical |
| --- | --- | --- |
| Course | `title`, `description`, `keyIdeas` (same count) | `id`, `icon`, `color`, `order`, `category`, `level` (shown via the UI catalogs) |
| Concepts | `label`, `summary`, `aliases` (any number, ≥ 1) | `id`, `lesson` |
| Links | `label` | `from`, `to` |
| Units | `title`, `description` | `id` |
| Lessons | `title`, `takeaway` | `id`, `pareto`, `minutes` |
| Every step | — | `type`, the order of steps |
| `explain` | `title`, `body` | |
| `example` | `title`, `problem`, `steps` (same count), `answer` | |
| Every question | `prompt`, `explanation`, `hint` | `id`, `concepts` |
| `mcq` | `choices` (same count, same order) | `answer` (index) |
| `numeric` | `unit` | `answer`, `tolerance` |
| `text` | `accept` (any number: the answers a learner of that language would type) | |
| `output` | — | `code`, `language`, `output` |
| `bug` | `fixes` (same count, same order) | `code`, `language`, `error`, `lines`, `answer` |
| `order` | `items` (same count, still in the CORRECT order, all different) | |
| `buckets` | `buckets` (labels), `items[].text` | `items[].bucket`, the order of items |
| `trace` | `frames[].note` | `code`, `language`, `frames[].line`, `vars`, `out`, `ask` |
| `truthtable` | `columns[].label` | `vars`, `columns[].expr`, `columns[].given` |
| `logicgrid` | `categories[].name`, `categories[].items`, `clues`, `solution` (see below) | number and order of everything |
| `balance` | — | `left`, `right`, `variable` |
| `sim` | `title`, `body`, git `goal.text` | `sim` and all configuration (`setup`, branches, dice, curves, join tables...) |
| Roadmap | track `title`, `description`, node `note` | `id`, `icon`, `course`, `after` |

Special cases:

- **Logic grids:** `solution` names items by their text, so it must use your translated item names, at the same
  positions as English. If English row 2 says `"cat"` and you translated the item `"cat"` as `"gato"`, row 2 says
  `"gato"`. Translate the clues so they still lead to exactly one solution (same logic, same order).
- **`text` answers:** translate the accepted answers and add the variants a learner would type (with and without
  the article, common synonyms). Matching ignores case, accents, spaces and punctuation, so `"repetição"` and
  `"repeticao"` are the same answer: don't list both. If the prompt shows a blank (`the ___ effect`), make the
  translated sentence and the accepted answers agree with each other.
- **Buckets / order items** are human text: translate them consistently with the explanation, which often
  refers to them.
- **Concept aliases** are what learners type on the knowledge map: give the natural words in your language
  (including the English term if people really use it, e.g. "80/20").

### Text rules (checked by the validator)

- Never translate code: ``` blocks and `inline code` must be copied exactly (same spans; the order may change
  with the sentence). Program output, identifiers, commands, file names, SQL, error messages from a real tool:
  unchanged.
- Keep the markdown: the same paragraphs (blank lines), the same bullet/numbered list items, balanced `**bold**`.
  Keep `*italic*` and `**bold**` on the equivalent words.
- Don't add or remove sentences that carry meaning; an explanation must still explain the same thing.
- Numbers inside prose follow the language (`1,000` → `1.000` in pt-BR/es, `1 000` in fr; `1.5×` → `1,5×`),
  but numbers inside code and in locked fields never change.

## Translating interface strings

Each namespace file mirrors the English one:

```ts
// src/i18n/fr/home.ts
import type { Translation } from '../core.ts';
import type en from '../en/home.ts';

export default {
  'home.title': '…',
  'home.reviewsDue': { one: '{count} révision à faire', other: '{count} révisions à faire' },
} satisfies Translation<typeof en>;
```

`src/i18n/<locale>/index.ts` merges the namespaces; TypeScript fails if a key is missing, extra, or a plural is
given as a plain string. `npm test` also checks that every translation keeps the same `{placeholders}` and
`<tags>` as English.

- **Placeholders** `{name}` stay exactly as they are (never translate the word inside the braces); move them
  where your grammar needs them. Numbers are formatted automatically.
- **Plurals** use the language's own categories (`Intl.PluralRules`): pt-BR, es and fr all need `one` and
  `other` (`many` is optional: it is used for large round numbers like 1 000 000, and falls back to `other`).
  French and Portuguese treat 0 as singular (`0 leçon`, `0 lição`) unless a `zero` form is given; add `zero`
  wherever English has one.
- **Tags** like `<link>…</link>` or `<b>…</b>` mark text the app wraps in a link or bold: keep them around the
  equivalent words.
- Keep `//` comments out of translations unless they help the next translator; read the English comments for
  context (button, tab label, tooltip, tight space).
- Short labels (tabs, buttons, chips) must stay short: prefer the shortest natural wording.

## Style

- **Tone:** friendly, concise, encouraging, like the English. Short sentences. No exclamation-mark inflation.
- **Address the learner informally:** pt-BR *você*; es *tú* (neutral Latin-American-friendly Spanish: no
  *vosotros*, no regional slang; *computadora* or a neutral rephrase rather than *ordenador*); fr *tu*.
- Translate meaning, not words. Idioms get an equivalent idiom or plain wording.
- Typography: pt-BR and es use “aspas” / «comillas» as in normal writing (the English uses “ ” and ’, either
  is fine but be consistent within a file); French uses « guillemets » with non-breaking spaces and a
  non-breaking space before `: ; ! ?` (use U+00A0 or U+202F). Keep `→` arrows and `·` separators.
- Keep proper names (ProjectLearn, Feynman, Ebbinghaus, Leitner, Pareto, VisiCalc, product and tool names,
  spreadsheet function names like `SUM` when they are code or the real English name of a function).
- Units and time: `min`, `h` are fine in all three languages.
- No emoji.

## Glossary

Use these terms everywhere (UI and courses). If a term isn't here, pick the most common term used by learners
in that language, then add it here.

### Product

| English | pt-BR | es | fr |
| --- | --- | --- | --- |
| ProjectLearn | ProjectLearn | ProjectLearn | ProjectLearn |
| Home | Início | Inicio | Accueil |
| course | curso | curso | cours |
| lesson | lição | lección | leçon |
| unit | unidade | unidad | unité |
| step | etapa | paso | étape |
| Core (lesson tag) | Essencial | Esencial | Essentiel |
| Deep dive (lesson tag) | Aprofundamento | Profundización | Approfondissement |
| Fast track | Modo rápido | Modo rápido | Mode express |
| key ideas | ideias-chave | ideas clave | idées clés |
| Key takeaway | Para lembrar | Para recordar | À retenir |
| cheat sheet | resumo | resumen | fiche mémo |
| quiz | quiz | test | quiz |
| worked example | exemplo resolvido | ejemplo resuelto | exemple résolu |
| question (an exercise) | questão | pregunta | question |
| hint | dica | pista | indice |
| explanation | explicação | explicación | explication |
| Continue / Check | Continuar / Verificar | Continuar / Comprobar | Continuer / Vérifier |
| review (the activity, spaced repetition) | revisão / revisar | repaso / repasar | révision / réviser |
| due (for review) | pendente | pendiente | à réviser |
| Review page | Revisão | Repaso | Révision |
| mastery, mastered | domínio, dominada(s) | dominio, dominada(s) | maîtrise, maîtrisée(s) |
| memory strength | força da memória | fuerza de la memoria | solidité de la mémoire |
| weak spot | ponto fraco | punto débil | point faible |
| streak | sequência (sequência de 5 dias) | racha (racha de 5 días) | série (série de 5 jours) |
| XP | XP | XP | XP |
| level | nível | nivel | niveau |
| daily goal | meta diária | meta diaria | objectif quotidien |
| mixed practice | prática mista | práctica mixta | pratique mixte |
| knowledge map | mapa do conhecimento | mapa de conocimientos | carte des connaissances |
| concept / idea | conceito / ideia | concepto / idea | concept / idée |
| link (between concepts) | ligação | conexión | lien |
| Insights (page, "your learning report") | Análise (Sua análise de aprendizado) | Informe (Tu informe de aprendizaje) | Bilan (Ton bilan d'apprentissage) |
| Notebook | Caderno | Cuaderno | Carnet |
| thinking on paper | pensar no papel | pensar en papel | penser sur papier |
| Make it wrong | Erre primeiro | Equivócate primero | Trompe-toi d'abord |
| Make it shorter | Encurte | Acórtalo | Raccourcis |
| Make it again | Refaça | Rehazlo | Refais |
| sheet (paper) | folha | hoja | feuille |
| keyword | palavra-chave | palabra clave | mot-clé |
| pile | pilha | montón | pile |
| anchor | âncora | ancla | ancre |
| thinking streak | sequência de reflexão | racha de reflexión | série de réflexion |
| Roadmap (page) | Trilhas | Rutas | Parcours |
| track (on the roadmap) | trilha | ruta | parcours |
| certificate | certificado | certificado | certificat |
| Certificate of completion | Certificado de conclusão | Certificado de finalización | Certificat de réussite |
| hours of learning | horas de estudo | horas de aprendizaje | heures d'apprentissage |
| profile | perfil | perfil | profil |
| Sign in / Sign up / Sign out | Entrar / Criar conta / Sair | Iniciar sesión / Crear cuenta / Cerrar sesión | Se connecter / Créer un compte / Se déconnecter |
| Get started | Começar | Empezar | Commencer |
| simulator | simulador | simulador | simulateur |
| Predict the output | Preveja a saída | Predice la salida | Prédis la sortie |
| Find the bug | Encontre o bug | Encuentra el error | Trouve le bug |
| Put in order | Coloque em ordem | Ordena | Remets dans l'ordre |
| Sort into buckets (bucket) | Separe em grupos (grupo) | Clasifica en grupos (grupo) | Classe dans des groupes (groupe) |
| Trace the code | Acompanhe o código | Sigue el código | Suis le code |
| truth table | tabela-verdade | tabla de verdad | table de vérité |
| logic grid | grade lógica | cuadrícula lógica | grille logique |
| balance (scale) | balança | balanza | balance |

### Learning science (Learn Anything Fast and wherever these ideas appear)

| English | pt-BR | es | fr |
| --- | --- | --- | --- |
| 80/20 rule | regra 80/20 | regla 80/20 | règle des 80/20 |
| Pareto principle | princípio de Pareto | principio de Pareto | principe de Pareto |
| the vital few | os poucos vitais | los pocos vitales | les quelques éléments essentiels |
| core of a subject | núcleo de um assunto | núcleo de un tema | noyau d'un sujet |
| long tail | cauda longa | cola larga | longue traîne |
| active recall | recordação ativa | recuerdo activo | rappel actif |
| retrieval (practice) | (prática de) recuperação | (práctica de) recuperación | (pratique de) récupération |
| testing effect | efeito de teste | efecto de prueba | effet de test |
| illusion of competence | ilusão de competência | ilusión de competencia | illusion de compétence |
| desirable difficulty, effortful learning | dificuldade desejável, aprendizagem com esforço | dificultad deseable, aprendizaje con esfuerzo | difficulté désirable, apprentissage exigeant |
| forgetting curve | curva do esquecimento | curva del olvido | courbe de l'oubli |
| spaced repetition | repetição espaçada | repetición espaciada | répétition espacée |
| spacing effect | efeito de espaçamento | efecto de espaciado | effet d'espacement |
| cramming | estudar tudo na véspera | estudiar todo a última hora | bachotage |
| Leitner box / system | caixa / sistema de Leitner | caja / sistema de Leitner | boîte / système de Leitner |
| interleaving | prática intercalada | práctica intercalada | pratique entrelacée |
| blocked practice | prática em blocos | práctica en bloques | pratique par blocs |
| Feynman technique | técnica de Feynman | técnica de Feynman | technique de Feynman |
| flashcard | flashcard | tarjeta (flashcard) | carte mémoire (flashcard) |

### Concept-map link labels

Link labels read as a sentence, "<from> <label> <to>". Prefer forms that work whatever the gender of the
target concept.

| English | pt-BR | es | fr |
| --- | --- | --- | --- |
| is a | é um tipo de | es una forma de | est une forme de |
| needs | precisa de | necesita | nécessite |
| builds on | se apoia em | se basa en | s'appuie sur |
| is part of | faz parte de | es parte de | fait partie de |
| contrasts with | contrasta com | contrasta con | s'oppose à |
| is the opposite of | é o oposto de | es lo opuesto a | est l'inverse de |
| causes | causa | provoca | entraîne |
| prevents | evita | evita | évite |
| is used in | é usado(a) em | se usa en | est utilisé(e) dans |
| is checked by | é desmascarada por | se detecta con | est démasquée par |
| replaces | substitui | reemplaza | remplace |

### More terms from the reference translations

| English | pt-BR | es | fr |
| --- | --- | --- | --- |
| the app | o app | la app | l'appli |
| notes (study notes) | anotações | apuntes | notes |
| gap (in understanding) | lacuna | laguna | lacune |
| hand-wave | enrolação | vaguedad | flou |
| jargon | jargão | jerga | jargon |
| load-bearing idea | ideia estrutural | idea pilar | idée porteuse |
| prerequisite | pré-requisito | requisito previo | prérequis |
| syllabus | ementa | temario | programme |
| practice test | simulado | examen de práctica | examen blanc |
| worked solution | resolução | solución resuelta | corrigé |
| right / wrong (an answer) | acerto / erro | acierto / fallo | juste / faux |
| card / box (Leitner) | cartão / caixa | tarjeta / caja | carte / boîte |
| core lesson (in prose) | lição essencial | lección esencial | leçon essentielle |
| feedback | feedback | retroalimentación | retour (correction) |
| recursion / call stack | recursão / pilha de chamadas | recursividad / pila de llamadas | récursivité / pile d'appels |
| spreadsheet, pivot table | planilha, tabela dinâmica | hoja de cálculo, tabla dinámica | tableur, tableau croisé dynamique |
| spreadsheet functions | SOMA, MÉDIA, SE, PROCV/PROCX | SUMA, PROMEDIO, SI, BUSCARV/BUSCARX | SOMME, MOYENNE, SI, RECHERCHEV/RECHERCHEX |

### Interface decisions (already used in the catalogs)

| English | pt-BR | es | fr |
| --- | --- | --- | --- |
| categories: Data, Engineering, Learning, Math, Programming, Thinking, Tools | Dados, Engenharia, Aprendizagem, Matemática, Programação, Raciocínio, Ferramentas | Datos, Ingeniería, Aprendizaje, Matemáticas, Programación, Pensamiento, Herramientas | Données, Ingénierie, Apprentissage, Maths, Programmation, Réflexion, Outils |
| levels: Beginner, Intermediate, Advanced | Iniciante, Intermediário, Avançado | Principiante, Intermedio, Avanzado | Débutant, Intermédiaire, Avancé |
| Learning path (course page) | Caminho de aprendizado | Ruta de aprendizaje | Parcours d'apprentissage |
| unit checkpoint | ponto de controle da unidade | control de la unidad | bilan d'unité |
| "{pct} mastered" | {pct} de domínio | {pct} dominado | {pct} de maîtrise |
| truth-table letters T / F | V / F | V / F | V / F |
| heads / tails | cara / coroa | cara / cruz | face / pile |
| playground (simulator) | simulador | simulador | bac à sable |
| branch / merge (Git) | branch / mesclar | rama / fusionar | branche / fusion |
| chunk (knowledge map) | bloco | bloque | bloc |
| redo (of a sheet) | reconstrução | reconstrucción | reprise |
| clean sheet | folha a limpo | hoja en limpio | feuille au propre |
| move (games) | jogada | movimiento | coup |
| Squeeze it (button) | Condensar | Condénsalo | Condenser |

Gender: avoid agreement with values you can't see ({course}, {name}, a concept label). Rephrase ("{course}:
curso concluído"), quote the value (fr « {course} »), or agree with a fixed noun ("idée rappelée"). Level titles
are pt-BR gender-neutral nouns (Iniciante, Aprendiz, Estudante…); es and fr use the masculine forms.

Course titles: *Learn Anything Fast* = "Aprenda qualquer coisa rápido" / "Aprende cualquier cosa rápido" /
"Tout apprendre plus vite". Titles use the language's normal capitalisation (sentence case in pt-BR, es and fr).

Typography decisions: straight apostrophes (`'`) in all languages (easier to type and to match); curly double
quotes “ ” in pt-BR and es, « » with no-break spaces in fr; percentages "20%" in pt-BR/es and "20 %" in fr
(no-break space; formatted numbers from the app already do this).

## Checks

- `npm run check:content`: every English course, every translated course (as a course and as a mirror of
  English), the roadmap and its translations.
- `npm run i18n:status` (`-- --verbose` for details): which courses exist in which language, catalog
  completeness, and text that is still identical to English.
- `npm test`: includes catalog parity (placeholders, tags, plural forms) and the translation validator tests.
- `npm run typecheck`: a missing or extra interface key fails here.

## Adding a language later

Add it to `LOCALES` (and names) in `src/i18n/locales.ts`, to `detectLocale`, to the loaders in
`src/i18n/runtime.ts`, create `src/i18n/<locale>/` from the English namespaces, add a glossary column here, and
make sure the PDF fonts can draw it (`canPrint` in `src/lib/certificate.ts`: WinAnsiEncoding covers Western
European languages only).
