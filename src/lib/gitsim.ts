// A tiny Git model for the Git playground: commits, branches, HEAD and merges, driven by typed commands.
// Pure and dependency-free so it can be unit tested with node:test. Messages mirror what real Git prints
// (checked against git 2.54). There are no files: every `git commit` simply records a new snapshot.

export interface GitCommit {
  /** Short fake hash, e.g. "3f9a2c1". */
  id: string;
  /** First parent first; merge commits have two. */
  parents: string[];
  message: string;
  /** The branch HEAD was on when this commit was made (used to draw lanes). */
  branch: string;
  /** Creation order, 0-based. */
  seq: number;
}

export interface GitState {
  commits: Record<string, GitCommit>;
  /** Branch name → commit id. */
  branches: Record<string, string>;
  /** The branch HEAD is attached to. */
  head: string;
  /** The previously checked-out branch, for `git switch -`. */
  prev: string | null;
  /** Commits made so far (drives hashes and default messages). */
  counter: number;
}

export type LineKind = 'out' | 'err' | 'hint';
export interface OutLine {
  text: string;
  kind: LineKind;
}

export interface RunResult {
  state: GitState;
  lines: OutLine[];
  /** True when the command failed (real Git would exit non-zero). */
  failed: boolean;
  /** The learner asked to clear the terminal. */
  clear?: boolean;
}

export interface GitGoal {
  head?: string;
  branches?: string[];
  merged?: { from: string; into: string }[];
  minCommits?: Record<string, number>;
}

// ---------- state helpers ----------

/** Deterministic, distinct-looking 7-hex-digit hash for the n-th commit. */
export function fakeHash(n: number): string {
  let x = (n + 1) * 0x9e3779b1;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

function clone(s: GitState): GitState {
  return { ...s, commits: { ...s.commits }, branches: { ...s.branches } };
}

function addCommit(s: GitState, parents: string[], message: string): GitCommit {
  let id = fakeHash(s.counter);
  for (let bump = 1000; s.commits[id]; bump++) id = fakeHash(s.counter + bump);
  const c: GitCommit = { id, parents, message, branch: s.head, seq: s.counter };
  s.commits[id] = c;
  s.counter++;
  s.branches[s.head] = id;
  return c;
}

/** A repository with one commit ("Initial commit") on main. */
export function initialState(): GitState {
  const s: GitState = { commits: {}, branches: { main: '' }, head: 'main', prev: null, counter: 0 };
  addCommit(s, [], 'Initial commit');
  return s;
}

/** The initial state plus `setup` commands, run silently. Throws if a setup command fails (a content bug). */
export function setupState(setup: string[] = []): GitState {
  let s = initialState();
  for (const cmd of setup) {
    const r = runCommand(s, cmd);
    if (r.failed) throw new Error(`git setup command failed: ${cmd}\n${r.lines.map((l) => l.text).join('\n')}`);
    s = r.state;
  }
  return s;
}

/** Every commit reachable from `id` by following parents (including `id`). */
export function reachable(s: GitState, id: string): Set<string> {
  const seen = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const c = stack.pop()!;
    if (seen.has(c) || !s.commits[c]) continue;
    seen.add(c);
    stack.push(...s.commits[c].parents);
  }
  return seen;
}

/** True when `a` is `b` or one of its ancestors. */
export function isAncestor(s: GitState, a: string, b: string): boolean {
  return reachable(s, b).has(a);
}

/** Commits reachable from any branch, oldest first. */
export function visibleCommits(s: GitState): GitCommit[] {
  const ids = new Set<string>();
  for (const tip of Object.values(s.branches)) for (const id of reachable(s, tip)) ids.add(id);
  return [...ids].map((id) => s.commits[id]).sort((a, b) => a.seq - b.seq);
}

/** Branch names pointing at a commit, HEAD's branch first, then alphabetical. */
export function branchesAt(s: GitState, id: string): string[] {
  return Object.keys(s.branches)
    .filter((b) => s.branches[b] === id)
    .sort((a, b) => (a === s.head ? -1 : b === s.head ? 1 : a.localeCompare(b)));
}

export function checkGoal(s: GitState, g: GitGoal | undefined): boolean {
  if (!g) return false;
  if (g.head !== undefined && s.head !== g.head) return false;
  if (g.branches && !g.branches.every((b) => b in s.branches)) return false;
  if (g.merged) {
    for (const { from, into } of g.merged) {
      if (!(from in s.branches) || !(into in s.branches)) return false;
      if (!isAncestor(s, s.branches[from], s.branches[into])) return false;
    }
  }
  if (g.minCommits) {
    for (const [b, n] of Object.entries(g.minCommits)) {
      if (!(b in s.branches) || reachable(s, s.branches[b]).size < n) return false;
    }
  }
  return true;
}

// ---------- parsing ----------

/** Splits a command line like a shell would, honouring '…' and "…" quotes. */
export function tokenize(input: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quote: string | null = null;
  let has = false;
  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'" || ch === '“' || ch === '”') {
      quote = ch === '“' ? '”' : ch;
      has = true;
    } else if (/\s/.test(ch)) {
      if (has || cur) out.push(cur);
      cur = '';
      has = false;
    } else {
      cur += ch;
      has = true;
    }
  }
  if (has || cur) out.push(cur);
  return out;
}

/** Git's branch-name rules, simplified (check-ref-format). */
export function isValidBranchName(name: string): boolean {
  if (!name || name === 'HEAD' || name === '@' || name.startsWith('-')) return false;
  if (/[\s~^:?*[\\\x00-\x1f\x7f]/.test(name)) return false;
  if (name.includes('..') || name.includes('//') || name.includes('@{')) return false;
  if (name.startsWith('/') || name.endsWith('/') || name.endsWith('.') || name.endsWith('.lock')) return false;
  return name.split('/').every((part) => part !== '' && !part.startsWith('.'));
}

/** Resolves a branch name or a (prefix of a) commit hash. */
function resolve(s: GitState, ref: string): string | null {
  if (ref in s.branches) return s.branches[ref];
  if (ref === 'HEAD') return s.branches[s.head];
  if (/^[0-9a-f]{4,40}$/.test(ref)) {
    const hits = Object.keys(s.commits).filter((id) => ref.startsWith(id) || id.startsWith(ref));
    if (hits.length === 1) return hits[0];
  }
  return null;
}

const out = (text: string): OutLine => ({ text, kind: 'out' });
const err = (text: string): OutLine => ({ text, kind: 'err' });
const hint = (text: string): OutLine => ({ text, kind: 'hint' });

const SUPPORTED = ['commit', 'branch', 'switch', 'checkout', 'merge', 'log', 'status'];
const REAL_BUT_UNSUPPORTED = new Set([
  'add', 'push', 'pull', 'fetch', 'clone', 'init', 'rebase', 'stash', 'reset', 'restore', 'revert', 'diff', 'show',
  'tag', 'cherry-pick', 'remote', 'rm', 'mv', 'reflog', 'bisect', 'blame', 'config',
]);

export const HELP_LINES = [
  'This playground understands:',
  '  git commit -m "message"     save a new snapshot on the current branch',
  '  git branch                  list branches (* marks the current one)',
  '  git branch <name>           create a branch here (without switching)',
  '  git branch -d <name>        delete a merged branch',
  '  git switch <name>           move HEAD to another branch',
  '  git switch -c <name>        create a branch and switch to it',
  '  git checkout [-b] <name>    the older spelling of switch [-c]',
  '  git merge <name>            merge a branch into the current one',
  '  git log --oneline           list commits reachable from HEAD',
  '  git status                  show the current branch',
  '  clear                       clear the terminal',
];

// ---------- commands ----------

export function runCommand(state: GitState, input: string): RunResult {
  const s = clone(state);
  const words = tokenize(input.trim());
  const ok = (lines: OutLine[]): RunResult => ({ state: s, lines, failed: false });
  const fail = (lines: OutLine[]): RunResult => ({ state, lines, failed: true });

  if (words.length === 0) return { state, lines: [], failed: false };
  const [first, sub, ...args] = words;
  if (first === 'clear' || first === 'cls') return { state, lines: [], failed: false, clear: true };
  if (first === 'help' || (first === 'git' && (sub === 'help' || sub === '--help'))) {
    return { state, lines: HELP_LINES.map(out), failed: false };
  }
  if (first !== 'git') {
    if (SUPPORTED.includes(first) || REAL_BUT_UNSUPPORTED.has(first)) {
      return fail([err(`command not found: ${first}`), hint(`Git commands start with "git", e.g. git ${words.join(' ')}`)]);
    }
    return fail([err(`command not found: ${first}`), hint('Type a Git command such as git status, or "help" to see what works here.')]);
  }
  if (sub === undefined) return { state, lines: HELP_LINES.map(out), failed: false };

  switch (sub) {
    case 'commit':
      return commit(s, args, ok, fail);
    case 'branch':
      return branch(s, args, ok, fail);
    case 'switch':
      return switchCmd(s, args, ok, fail);
    case 'checkout':
      return checkout(s, args, ok, fail);
    case 'merge':
      return merge(s, args, ok, fail);
    case 'log':
      return log(s, args, ok, fail);
    case 'status':
      return ok([out(`On branch ${s.head}`), out('nothing to commit, working tree clean')]);
    default:
      if (sub === 'add') {
        return fail([hint('There are no files in this playground: git commit saves a new snapshot straight away.')]);
      }
      if (REAL_BUT_UNSUPPORTED.has(sub)) {
        return fail([hint(`git ${sub} is a real command, but this playground only simulates commits, branches and merges.`)]);
      }
      return fail([err(`git: '${sub}' is not a git command. See 'git --help'.`), hint('Type "help" to see the commands this playground understands.')]);
  }
}

type Ok = (lines: OutLine[]) => RunResult;
type Fail = (lines: OutLine[]) => RunResult;

function commit(s: GitState, args: string[], ok: Ok, fail: Fail): RunResult {
  let message: string | null = null;
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-m' || a === '--message' || a === '-am') {
      if (i + 1 >= args.length) return fail([err('error: switch `m\' requires a value')]);
      message = args[++i];
    } else if (a.startsWith('-m') && a.length > 2) {
      message = a.slice(2);
    } else if (a.startsWith('--message=')) {
      message = a.slice('--message='.length);
    } else if (a === '-a' || a === '--all' || a === '--allow-empty') {
      // no files here, nothing to do
    } else if (a === '--amend') {
      return fail([hint('git commit --amend is real (see "Undo cheat sheet"), but this playground only makes new commits.')]);
    } else if (a.startsWith('-')) {
      return fail([err(`error: unknown option '${a.replace(/^-+/, '')}'`)]);
    } else {
      rest.push(a);
    }
  }
  if (rest.length) {
    return fail([err(`error: pathspec '${rest[0]}' did not match any file(s) known to git`), hint('Put the message in quotes: git commit -m "Add login form"')]);
  }
  if (message !== null && message.trim() === '') return fail([err('Aborting commit due to empty commit message.')]);
  const c = addCommit(s, [s.branches[s.head]], message ?? `Commit ${s.counter + 1}`);
  return ok([out(`[${s.head} ${c.id}] ${c.message}`)]);
}

function createBranch(s: GitState, name: string, at: string): OutLine[] | null {
  if (!isValidBranchName(name)) return [err(`fatal: '${name}' is not a valid branch name`)];
  if (name in s.branches) return [err(`fatal: a branch named '${name}' already exists`)];
  s.branches[name] = at;
  return null;
}

function branch(s: GitState, args: string[], ok: Ok, fail: Fail): RunResult {
  if (args.length === 0 || (args.length === 1 && (args[0] === '--list' || args[0] === '-a' || args[0] === '-l'))) {
    return ok(Object.keys(s.branches).sort().map((b) => out(`${b === s.head ? '*' : ' '} ${b}`)));
  }
  const [flag, name, extra] = args;
  if (flag === '-d' || flag === '-D' || flag === '--delete') {
    if (!name) return fail([err('fatal: branch name required')]);
    if (!(name in s.branches)) return fail([err(`error: branch '${name}' not found`)]);
    if (name === s.head) return fail([err(`error: cannot delete branch '${name}' used by worktree at '~/project'`)]);
    if (flag !== '-D' && !isAncestor(s, s.branches[name], s.branches[s.head])) {
      return fail([err(`error: the branch '${name}' is not fully merged`), hint(`If you are sure you want to delete it, run 'git branch -D ${name}'`)]);
    }
    const was = s.branches[name];
    delete s.branches[name];
    if (s.prev === name) s.prev = null;
    return ok([out(`Deleted branch ${name} (was ${was}).`)]);
  }
  if (flag.startsWith('-')) {
    return fail([hint(`git branch ${flag} isn't simulated here. Try git branch <name> or git branch -d <name>.`)]);
  }
  if (extra !== undefined) return fail([err('fatal: too many arguments')]);
  let at = s.branches[s.head];
  if (name !== undefined) {
    const r = resolve(s, name);
    if (!r) return fail([err(`fatal: not a valid object name: '${name}'`)]);
    at = r;
  }
  const e = createBranch(s, flag, at);
  return e ? fail(e) : ok([]);
}

function moveHead(s: GitState, name: string): void {
  if (name !== s.head) s.prev = s.head;
  s.head = name;
}

function switchCmd(s: GitState, args: string[], ok: Ok, fail: Fail): RunResult {
  if (args.length === 0) return fail([err('fatal: missing branch or commit argument')]);
  const [a, b] = args;
  if (a === '-c' || a === '--create' || a === '-C') {
    if (b === undefined) return fail([err('error: switch `c\' requires a value')]);
    const e = createBranch(s, b, s.branches[s.head]);
    if (e) return fail(e);
    moveHead(s, b);
    return ok([out(`Switched to a new branch '${b}'`)]);
  }
  if (a === '--detach' || a === '-d') return fail([hint('Detached HEAD is covered in "Safety nets"; this playground keeps HEAD on a branch.')]);
  if (a.startsWith('-') && a !== '-') return fail([err(`error: unknown switch '${a.replace(/^-+/, '')}'`)]);
  const name = a === '-' ? s.prev : a;
  if (name === null) return fail([err('fatal: invalid reference: @{-1}')]);
  if (name in s.branches) {
    if (name === s.head) return ok([out(`Already on '${name}'`)]);
    moveHead(s, name);
    return ok([out(`Switched to branch '${name}'`)]);
  }
  const r = resolve(s, name);
  if (r) {
    return fail([err(`fatal: a branch is expected, got commit '${name}'`), hint('If you want to detach HEAD at the commit, try again with the --detach option.')]);
  }
  return fail([err(`fatal: invalid reference: ${name}`), hint(`To create it, use git switch -c ${name}`)]);
}

function checkout(s: GitState, args: string[], ok: Ok, fail: Fail): RunResult {
  if (args.length === 0) return ok([]);
  const [a, b] = args;
  if (a === '-b' || a === '-B') {
    if (b === undefined) return fail([err('error: switch `b\' requires a value')]);
    const e = createBranch(s, b, s.branches[s.head]);
    if (e) return fail(e);
    moveHead(s, b);
    return ok([out(`Switched to a new branch '${b}'`)]);
  }
  if (a.startsWith('-') && a !== '-') return fail([err(`error: unknown switch '${a.replace(/^-+/, '')}'`)]);
  const name = a === '-' ? s.prev : a;
  if (name !== null && name in s.branches) {
    if (name === s.head) return ok([out(`Already on '${name}'`)]);
    moveHead(s, name);
    return ok([out(`Switched to branch '${name}'`)]);
  }
  if (name !== null && resolve(s, name)) {
    return fail([hint('Checking out a commit gives a detached HEAD (see "Safety nets"); this playground keeps HEAD on a branch.')]);
  }
  return fail([err(`error: pathspec '${a}' did not match any file(s) known to git`)]);
}

function merge(s: GitState, args: string[], ok: Ok, fail: Fail): RunResult {
  let mode: 'ff' | 'no-ff' | 'ff-only' = 'ff';
  const names: string[] = [];
  for (const a of args) {
    if (a === '--no-ff') mode = 'no-ff';
    else if (a === '--ff-only') mode = 'ff-only';
    else if (a === '--ff' || a === '--no-edit') continue;
    else if (a === '--abort') return fail([err('fatal: There is no merge to abort (MERGE_HEAD missing).')]);
    else if (a.startsWith('-')) return fail([err(`error: unknown option '${a.replace(/^-+/, '')}'`)]);
    else names.push(a);
  }
  if (names.length === 0) return fail([err('fatal: No remote for the current branch.'), hint('Name the branch to merge into this one, e.g. git merge feature')]);
  if (names.length > 1) return fail([hint('Merge one branch at a time here, e.g. git merge feature')]);
  const name = names[0];
  const target = resolve(s, name);
  if (!target) return fail([err(`merge: ${name} - not something we can merge`)]);
  const here = s.branches[s.head];
  if (isAncestor(s, target, here)) return ok([out('Already up to date.')]);
  const canFF = isAncestor(s, here, target);
  if (canFF && mode !== 'no-ff') {
    s.branches[s.head] = target;
    return ok([out(`Updating ${here}..${target}`), out('Fast-forward')]);
  }
  if (mode === 'ff-only') {
    return fail([hint("Diverging branches can't be fast-forwarded, you need to either:"), hint('    git merge --no-ff'), hint('or:'), hint('    git rebase'), err('fatal: Not possible to fast-forward, aborting.')]);
  }
  const what = name in s.branches ? `branch '${name}'` : `commit '${name}'`;
  const into = s.head === 'main' || s.head === 'master' ? '' : ` into ${s.head}`;
  addCommit(s, [here, target], `Merge ${what}${into}`);
  return ok([out("Merge made by the 'ort' strategy.")]);
}

function log(s: GitState, args: string[], ok: Ok, fail: Fail): RunResult {
  let all = false;
  let oneline = false;
  const starts: string[] = [];
  for (const a of args) {
    if (a === '--oneline') oneline = true;
    else if (a === '--all') all = true;
    else if (a === '--graph' || a === '--decorate') continue;
    else if (a.startsWith('-')) return fail([err(`fatal: unrecognized argument: ${a}`)]);
    else {
      const r = resolve(s, a);
      if (!r) {
        return fail([err(`fatal: ambiguous argument '${a}': unknown revision or path not in the working tree.`)]);
      }
      starts.push(r);
    }
  }
  if (all) starts.push(...Object.values(s.branches));
  if (starts.length === 0) starts.push(s.branches[s.head]);
  const ids = new Set<string>();
  for (const st of starts) for (const id of reachable(s, st)) ids.add(id);
  const commits = [...ids].map((id) => s.commits[id]).sort((a, b) => b.seq - a.seq);
  const lines = commits.map((c) => {
    const labels = branchesAt(s, c.id).map((b) => (b === s.head ? `HEAD -> ${b}` : b));
    return out(`${c.id}${labels.length ? ` (${labels.join(', ')})` : ''} ${c.message}`);
  });
  if (!oneline) lines.push(hint('(This playground always prints the short --oneline format.)'));
  return ok(lines);
}

// ---------- graph layout ----------

export type Orientation = 'horizontal' | 'vertical';

export interface GraphNode {
  id: string;
  message: string;
  x: number;
  y: number;
  lane: number;
  isMerge: boolean;
  isHead: boolean;
  /** Vertical layout: where this row's hash + message start (after its branch pills). */
  textX: number;
}
export interface GraphEdge {
  /** child id + "-" + parent id */
  key: string;
  d: string;
  lane: number;
}
export interface GraphLabel {
  branch: string;
  head: boolean;
  /** Top-left of the pill. */
  x: number;
  y: number;
  width: number;
  lane: number;
}
export interface GraphLayout {
  width: number;
  height: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  labels: GraphLabel[];
  lanes: string[];
}

export const GRAPH = {
  step: 64, // distance between consecutive commits along the time axis
  laneGap: 44, // distance between lanes (vertical layout) / base lane height (horizontal)
  rowGap: 40, // vertical layout: distance between commits
  pillH: 20,
  pillGap: 4,
  pad: 18,
  charW: 7.0, // approx. width of one character at 11.5px monospace
};

export function pillWidth(text: string): number {
  return Math.round(text.length * GRAPH.charW + 16);
}

export function labelText(branch: string, head: boolean): string {
  return head ? `HEAD → ${branch}` : branch;
}

/**
 * Greedy interval stacking: give each [start, end) interval the lowest level where it doesn't overlap
 * anything already placed. Intervals must be sorted by start.
 */
export function stackLevels(intervals: { start: number; end: number }[], gap = 6): number[] {
  const ends: number[] = [];
  return intervals.map(({ start, end }) => {
    let lvl = ends.findIndex((e) => e + gap <= start);
    if (lvl === -1) lvl = ends.length;
    ends[lvl] = end;
    return lvl;
  });
}

/** Lane per branch name, in order of the branch's first visible commit (the first branch is lane 0). */
export function assignLanes(commits: GitCommit[]): string[] {
  const lanes: string[] = [];
  for (const c of commits) if (!lanes.includes(c.branch)) lanes.push(c.branch);
  return lanes;
}

export function layoutGraph(s: GitState, orientation: Orientation): GraphLayout {
  const commits = visibleCommits(s);
  const lanes = assignLanes(commits);
  const laneOf = (c: GitCommit) => lanes.indexOf(c.branch);
  const col = new Map(commits.map((c, i) => [c.id, i]));
  const headId = s.branches[s.head];
  const { pad, pillH, pillGap } = GRAPH;

  // Labels per commit.
  const labelled = commits
    .map((c) => ({ c, names: branchesAt(s, c.id) }))
    .filter((x) => x.names.length > 0);

  let pos: (c: GitCommit) => { x: number; y: number };
  const labels: GraphLabel[] = [];
  let width: number;
  let height: number;
  const textX = new Map<string, number>();
  // Coordinates on the time axis (t) and lane axis (l), mapped to x/y per orientation.
  let toXY: (t: number, l: number) => [number, number];
  let tOf: (c: GitCommit) => number;
  let lOf: (c: GitCommit) => number;
  let step: number;

  if (orientation === 'horizontal') {
    step = GRAPH.step;
    const nodeX = (i: number) => pad + 20 + i * step;
    // Stack pills above each lane's commits without overlaps.
    const levels = new Map<string, number>(); // branch -> level
    const laneLevels = lanes.map(() => 0);
    lanes.forEach((_, li) => {
      const items: { b: string; start: number; end: number }[] = [];
      for (const { c, names } of labelled) {
        if (laneOf(c) !== li) continue;
        for (const b of names) {
          const w = pillWidth(labelText(b, b === s.head));
          const cx = nodeX(col.get(c.id)!);
          const start = Math.max(4, cx - w / 2);
          items.push({ b, start, end: start + w });
        }
      }
      // Keep pills of the same commit in name order, but sort by start for the greedy pass.
      const order = items.map((it, i) => ({ it, i })).sort((a, b) => a.it.start - b.it.start || a.i - b.i);
      const lv = stackLevels(order.map((o) => o.it));
      order.forEach((o, k) => {
        levels.set(o.it.b, lv[k]);
        laneLevels[li] = Math.max(laneLevels[li], lv[k] + 1);
      });
    });
    const laneTop: number[] = [];
    let y = pad;
    lanes.forEach((_, li) => {
      laneTop[li] = y;
      y += laneLevels[li] * (pillH + pillGap) + GRAPH.laneGap;
    });
    const laneY = (li: number) => laneTop[li] + laneLevels[li] * (pillH + pillGap) + 14;
    toXY = (t, l) => [t, l];
    tOf = (c) => nodeX(col.get(c.id)!);
    lOf = (c) => laneY(laneOf(c));
    pos = (c) => ({ x: tOf(c), y: lOf(c) });
    for (const { c, names } of labelled) {
      const { x, y: ny } = pos(c);
      for (const b of names) {
        const w = pillWidth(labelText(b, b === s.head));
        const lvl = levels.get(b) ?? 0;
        labels.push({
          branch: b,
          head: b === s.head,
          x: Math.max(4, x - w / 2),
          y: ny - 12 - pillH - lvl * (pillH + pillGap),
          width: w,
          lane: laneOf(c),
        });
      }
    }
    width = Math.max(...commits.map((c) => tOf(c) + 20), ...labels.map((l) => l.x + l.width)) + pad;
    height = y - GRAPH.laneGap + 40 + pad;
  } else {
    step = GRAPH.rowGap;
    const laneX = (li: number) => pad + 8 + li * 28;
    toXY = (t, l) => [l, t];
    tOf = (c) => pad + 14 + col.get(c.id)! * step;
    lOf = (c) => laneX(laneOf(c));
    pos = (c) => ({ x: lOf(c), y: tOf(c) });
    const startX = laneX(lanes.length - 1) + 22;
    let maxX = startX;
    for (const c of commits) {
      let x = startX;
      const { y: ny } = pos(c);
      for (const b of branchesAt(s, c.id)) {
        const w = pillWidth(labelText(b, b === s.head));
        labels.push({ branch: b, head: b === s.head, x, y: ny - pillH / 2, width: w, lane: laneOf(c) });
        x += w + pillGap;
      }
      if (x > startX) x += 2;
      textX.set(c.id, x);
      // hash (7 chars) + space + message, at ~7.3px per character (12px monospace)
      maxX = Math.max(maxX, x + (8 + c.message.length) * 7.3 + 8);
    }
    width = maxX;
    height = pad * 2 + 14 + Math.max(0, commits.length - 1) * step + 14;
  }

  const nodes: GraphNode[] = commits.map((c) => ({
    id: c.id,
    message: c.message,
    ...pos(c),
    lane: laneOf(c),
    isMerge: c.parents.length > 1,
    isHead: c.id === headId,
    textX: textX.get(c.id) ?? 0,
  }));

  const P = (t: number, l: number) => toXY(t, l).join(' ');
  const edges: GraphEdge[] = [];
  for (const c of commits) {
    c.parents.forEach((pid, pi) => {
      const p = s.commits[pid];
      if (!p || !col.has(pid)) return;
      const t1 = tOf(p);
      const l1 = lOf(p);
      const t2 = tOf(c);
      const l2 = lOf(c);
      let d: string;
      let lane: number;
      if (l1 === l2) {
        d = `M${P(t1, l1)} L${P(t2, l2)}`;
        lane = laneOf(c);
      } else if (pi === 0) {
        // Branching off: turn right away, then run along the child's lane.
        const tTurn = Math.min(t1 + step, t2);
        d = `M${P(t1, l1)} C${P(t1 + (tTurn - t1) / 2, l1)} ${P(t1 + (tTurn - t1) / 2, l2)} ${P(tTurn, l2)} L${P(t2, l2)}`;
        lane = laneOf(c);
      } else {
        // Merging in: run along the parent's lane, then turn into the merge commit.
        const tTurn = Math.max(t2 - step, t1);
        d = `M${P(t1, l1)} L${P(tTurn, l1)} C${P(tTurn + (t2 - tTurn) / 2, l1)} ${P(tTurn + (t2 - tTurn) / 2, l2)} ${P(t2, l2)}`;
        lane = laneOf(p);
      }
      edges.push({ key: `${c.id}-${pid}`, d, lane });
    });
  }

  return { width: Math.ceil(width), height: Math.ceil(height), nodes, edges, labels, lanes };
}

/** One-sentence text description of the graph, for screen readers. */
export function describeGraph(s: GitState): string {
  const commits = visibleCommits(s);
  const tips = Object.keys(s.branches)
    .sort()
    .map((b) => `${b} at ${s.branches[b]}${b === s.head ? ' (HEAD)' : ''}`);
  const merges = commits.filter((c) => c.parents.length > 1).length;
  return `${commits.length} commit${commits.length === 1 ? '' : 's'}${merges ? `, ${merges} of them merge commit${merges === 1 ? '' : 's'}` : ''}. Branches: ${tips.join('; ')}.`;
}
