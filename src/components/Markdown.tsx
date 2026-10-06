import { Fragment, type ReactNode } from 'react';

// A deliberately tiny Markdown subset for lesson text:
// paragraphs, "- " bullet lists, ``` code blocks (with light syntax highlighting),
// **bold**, *italic* and `code`.

function inline(text: string, keyBase: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g).map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{inline(part.slice(2, -2), key)}</strong>;
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>;
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) return <em key={key}>{part.slice(1, -1)}</em>;
    return <Fragment key={key}>{part}</Fragment>;
  });
}

// ---------- syntax highlighting ----------

const words = (s: string) => new Set(s.split(/\s+/));
const HASH_COMMENT = String.raw`#.*`;
const C_COMMENT = String.raw`\/\/.*|\/\*[\s\S]*?\*\/`;

interface LangSpec {
  keywords: Set<string>;
  comment: string;
  /** SQL keywords match in any case. */
  caseInsensitive?: boolean;
  /** Capitalized identifiers are types (Java/Kotlin). */
  types?: boolean;
  annotations?: boolean;
  /** Shell: highlight --flags and -f. */
  flags?: boolean;
  /** YAML / .properties: highlight keys before ':' or '='. */
  keys?: boolean;
}

const LANGS: Record<string, LangSpec> = {
  python: {
    keywords: words(
      'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case self',
    ),
    comment: HASH_COMMENT,
    annotations: true,
  },
  java: {
    keywords: words(
      'abstract assert boolean break byte case catch char class continue default do double else enum extends final finally float for if implements import instanceof int interface long new package private protected public return short static super switch synchronized this throw throws try void volatile while var record sealed permits yield true false null module',
    ),
    comment: C_COMMENT,
    types: true,
    annotations: true,
  },
  kotlin: {
    keywords: words(
      'as break class continue do else false for fun if in interface is null object package return super this throw true try typealias val var when while by catch constructor init companion data sealed enum open override private protected public internal suspend lateinit inline operator abstract final import it',
    ),
    comment: C_COMMENT,
    types: true,
    annotations: true,
  },
  sql: {
    keywords: words(
      'select from where and or not in is null like ilike between as distinct order by group having limit offset fetch first rows only join inner left right full outer cross on using union all except intersect insert into values update set delete create table view index unique primary key foreign references default check constraint alter add drop column cascade if exists begin commit rollback transaction savepoint with recursive case when then else end over partition window asc desc nulls last true false count sum avg min max coalesce nullif cast extract exists any returning serial integer int bigint smallint text varchar char numeric decimal boolean date timestamp timestamptz real double precision row_number rank dense_rank lag lead explain analyze',
    ),
    comment: String.raw`--.*|\/\*[\s\S]*?\*\/`,
    caseInsensitive: true,
  },
  bash: {
    keywords: words(
      'git cd ls mkdir echo cat touch rm mv cp npm npx node java javac python pip mvn mvnw gradle gradlew docker curl sudo export source if then else fi for do done while in',
    ),
    comment: HASH_COMMENT,
    flags: true,
  },
  yaml: { keywords: words('true false null on off yes no'), comment: HASH_COMMENT, keys: true },
  json: { keywords: words('true false null'), comment: '(?!)' },
};
/** Fences that are output, trees or tables: shown as-is. */
const PLAIN = new Set(['text', 'txt', 'plain', 'output', 'console-output', 'diff', 'tree', 'none']);
const ALIASES: Record<string, string> = {
  py: 'python',
  python3: 'python',
  kt: 'kotlin',
  kts: 'kotlin',
  jshell: 'java',
  postgresql: 'sql',
  postgres: 'sql',
  mysql: 'sql',
  sqlite: 'sql',
  sh: 'bash',
  shell: 'bash',
  console: 'bash',
  zsh: 'bash',
  powershell: 'bash',
  yml: 'yaml',
  properties: 'yaml',
  ini: 'yaml',
};

/** For unlabeled fences: only highlight when the code clearly is a language; otherwise show it plain. */
function guessLanguage(code: string): string | null {
  if (/^\s*(\$\s*)?(git|npm|npx|cd|mkdir|mvn|\.\/mvnw|docker)\s/m.test(code)) return 'bash';
  if (/\b(SELECT\b[\s\S]*\bFROM|INSERT\s+INTO|CREATE\s+TABLE|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b/i.test(code)) return 'sql';
  if (/\bfun\s+\w+\s*\(|\bval\s+\w+\s*[=:]/.test(code)) return 'kotlin';
  if (/;\s*$/m.test(code) || /\b(public|private|void|class)\s/.test(code)) return 'java';
  if (/^\s*(def |import |from \S+ import |print\(|for \w+ in |while |if .+:\s*$|return\b)/m.test(code)) return 'python';
  return null;
}

function highlight(code: string, lang: string): ReactNode[] {
  if (PLAIN.has(lang)) return [code];
  const name = ALIASES[lang] ?? lang;
  const guessed = LANGS[name] ? name : guessLanguage(code);
  if (!guessed) return [code];
  const spec = LANGS[guessed];
  const re = new RegExp(
    [
      `(?<cmt>${spec.comment})`,
      String.raw`(?<str>"""[\s\S]*?"""|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')`,
      spec.annotations ? String.raw`(?<ann>@[A-Za-z_][\w.]*)` : null,
      spec.flags ? String.raw`(?<flag>(?<=\s)--?[A-Za-z][\w-]*)` : null,
      spec.keys ? String.raw`(?<key>^[ \t-]*[\w.\[\]-]+(?=\s*[:=]))` : null,
      String.raw`(?<num>\b\d[\d_]*(?:\.\d+)?[LlFfDd]?\b)`,
      // Hyphens belong to words only in shell/config (git-flow, spring.jpa.open-in-view), not in code (n-1).
      spec.flags || spec.keys ? String.raw`(?<word>[A-Za-z_][\w-]*)` : String.raw`(?<word>[A-Za-z_]\w*)`,
    ]
      .filter(Boolean)
      .join('|'),
    'gm',
  );
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of code.matchAll(re)) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const text = m[0];
    const g = m.groups!;
    let cls: string | null = null;
    if (g.cmt) cls = 'tok-comment';
    else if (g.str) cls = 'tok-string';
    else if (g.ann) cls = 'tok-annotation';
    else if (g.flag) cls = 'tok-type';
    else if (g.key) cls = 'tok-keyword';
    else if (g.num) cls = 'tok-number';
    else if (g.word) {
      if (spec.keywords.has(spec.caseInsensitive ? text.toLowerCase() : text)) cls = 'tok-keyword';
      else if (spec.types && /^[A-Z]/.test(text)) cls = 'tok-type';
      else if (code[m.index + text.length] === '(') cls = 'tok-fn';
    }
    out.push(cls ? <span key={i++} className={cls}>{text}</span> : text);
    last = m.index + text.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

/** Highlights each line on its own (for clickable lines). The language is resolved once for the whole snippet. */
export function highlightLines(code: string, lang = ''): ReactNode[][] {
  const name = ALIASES[lang] ?? lang;
  const resolved = PLAIN.has(lang) || LANGS[name] ? lang : (guessLanguage(code) ?? 'text');
  return code.split('\n').map((line) => highlight(line, resolved));
}

/** A standalone code block, e.g. the program in an output question. */
export function CodeBlock({ code, lang = '', className = '' }: { code: string; lang?: string; className?: string }) {
  return (
    <pre className={`code ${className}`.trim()}>
      <code>{highlight(code, lang)}</code>
    </pre>
  );
}

// ---------- blocks ----------

const isBullet = (line: string) => /^\s*- /.test(line);
const isFence = (line: string) => line.trimStart().startsWith('```');

export function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const key = blocks.length;
    if (isFence(lines[i])) {
      const lang = lines[i].trim().slice(3).trim().toLowerCase();
      const code: string[] = [];
      i++;
      while (i < lines.length && !isFence(lines[i])) code.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={key} className="code">
          <code>{highlight(code.join('\n'), lang)}</code>
        </pre>,
      );
    } else if (isBullet(lines[i])) {
      const items: string[] = [];
      while (i < lines.length && isBullet(lines[i])) items.push(lines[i++].replace(/^\s*- /, ''));
      blocks.push(
        <ul key={key}>
          {items.map((item, j) => (
            <li key={j}>{inline(item, `${key}-${j}`)}</li>
          ))}
        </ul>,
      );
    } else if (lines[i].trim() === '') {
      i++;
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() !== '' && !isFence(lines[i]) && !isBullet(lines[i])) para.push(lines[i++]);
      blocks.push(<p key={key}>{inline(para.join(' '), String(key))}</p>);
    }
  }
  return <div className="md">{blocks}</div>;
}

/** Inline-only variant, safe inside buttons. */
export function InlineMarkdown({ text }: { text: string }) {
  return <span>{inline(text, 'i')}</span>;
}
