// A tiny propositional-logic parser for truth-table steps. Pure, no runtime imports.
//
// Grammar, loosest binding first:
//   iff     := implies ( ('<->' | '↔' | 'iff') implies )*
//   implies := or ( ('->' | '→' | 'implies') implies )?        (right-associative)
//   or      := xor ( ('or' | '∨' | '||') xor )*
//   xor     := and ( ('xor' | '⊕') and )*
//   and     := not ( ('and' | '∧' | '&&' | '&') not )*
//   not     := ('not' | '¬' | '!' | '~') not | atom
//   atom    := VARIABLE | 'T' | 'F' | 'true' | 'false' | '(' iff ')'

export type LogicNode =
  | { op: 'var'; name: string }
  | { op: 'const'; value: boolean }
  | { op: 'not'; a: LogicNode }
  | { op: 'and' | 'or' | 'xor' | 'implies' | 'iff'; a: LogicNode; b: LogicNode };

const SYMBOLS: [string, string][] = [
  ['<->', 'iff'],
  ['↔', 'iff'],
  ['->', 'implies'],
  ['→', 'implies'],
  ['&&', 'and'],
  ['||', 'or'],
  ['∧', 'and'],
  ['&', 'and'],
  ['∨', 'or'],
  ['⊕', 'xor'],
  ['¬', 'not'],
  ['!', 'not'],
  ['~', 'not'],
  ['(', '('],
  [')', ')'],
];
const WORDS: Record<string, string> = { and: 'and', or: 'or', xor: 'xor', not: 'not', implies: 'implies', iff: 'iff' };

function tokenize(expr: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < expr.length) {
    if (/\s/.test(expr[i])) {
      i++;
      continue;
    }
    const sym = SYMBOLS.find(([s]) => expr.startsWith(s, i));
    if (sym) {
      out.push(sym[1]);
      i += sym[0].length;
      continue;
    }
    const word = expr.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (!word) throw new Error(`unexpected "${expr[i]}" at position ${i + 1}`);
    const lower = word[0].toLowerCase();
    out.push(WORDS[lower] ?? `$${word[0]}`);
    i += word[0].length;
  }
  return out;
}

/** Parses an expression over the given variables. Throws an Error with a readable message if it's malformed. */
export function parseLogic(expr: string, vars: string[]): LogicNode {
  const tokens = tokenize(expr);
  let pos = 0;
  const peek = () => tokens[pos];
  const take = () => tokens[pos++];

  const binary = (next: () => LogicNode, op: 'and' | 'or' | 'xor' | 'iff') => (): LogicNode => {
    let a = next();
    while (peek() === op) {
      take();
      a = { op, a, b: next() };
    }
    return a;
  };
  const atom = (): LogicNode => {
    const t = take();
    if (t === undefined) throw new Error('the expression ends too early');
    if (t === '(') {
      const inner = iff();
      if (take() !== ')') throw new Error('a "(" is never closed');
      return inner;
    }
    if (t.startsWith('$')) {
      const name = t.slice(1);
      if (vars.includes(name)) return { op: 'var', name };
      if (name === 'T' || name.toLowerCase() === 'true') return { op: 'const', value: true };
      if (name === 'F' || name.toLowerCase() === 'false') return { op: 'const', value: false };
      throw new Error(`"${name}" is not one of the variables (${vars.join(', ')})`);
    }
    throw new Error(`unexpected "${t}"`);
  };
  const not = (): LogicNode => {
    if (peek() === 'not') {
      take();
      return { op: 'not', a: not() };
    }
    return atom();
  };
  const and = binary(not, 'and');
  const xor = binary(and, 'xor');
  const or = binary(xor, 'or');
  const implies = (): LogicNode => {
    const a = or();
    if (peek() === 'implies') {
      take();
      return { op: 'implies', a, b: implies() };
    }
    return a;
  };
  const iff: () => LogicNode = binary(implies, 'iff');

  const tree = iff();
  if (pos < tokens.length) throw new Error(`unexpected "${tokens[pos].replace(/^\$/, '')}" after a complete expression`);
  return tree;
}

export function evalLogic(node: LogicNode, env: Record<string, boolean>): boolean {
  switch (node.op) {
    case 'var':
      return env[node.name];
    case 'const':
      return node.value;
    case 'not':
      return !evalLogic(node.a, env);
    case 'and':
      return evalLogic(node.a, env) && evalLogic(node.b, env);
    case 'or':
      return evalLogic(node.a, env) || evalLogic(node.b, env);
    case 'xor':
      return evalLogic(node.a, env) !== evalLogic(node.b, env);
    case 'implies':
      return !evalLogic(node.a, env) || evalLogic(node.b, env);
    case 'iff':
      return evalLogic(node.a, env) === evalLogic(node.b, env);
  }
}

/** Input rows in textbook order: all true first, the last variable alternating fastest (TT, TF, FT, FF). */
export function truthRows(vars: string[]): Record<string, boolean>[] {
  const n = vars.length;
  return Array.from({ length: 2 ** n }, (_, r) =>
    Object.fromEntries(vars.map((v, i) => [v, ((r >> (n - 1 - i)) & 1) === 0])),
  );
}

/** The correct value of every column in every row: result[row][column]. */
export function truthTableAnswers(vars: string[], exprs: string[]): boolean[][] {
  const trees = exprs.map((e) => parseLogic(e, vars));
  return truthRows(vars).map((env) => trees.map((t) => evalLogic(t, env)));
}
