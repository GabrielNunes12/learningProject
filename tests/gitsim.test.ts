// Tests for the Git playground model (src/lib/gitsim.ts). Run with: npm test
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  checkGoal,
  fakeHash,
  initialState,
  isAncestor,
  isValidBranchName,
  layoutGraph,
  reachable,
  runCommand,
  setupState,
  stackLevels,
  tokenize,
  type GitState,
} from '../src/lib/gitsim.ts';

/** Runs commands in order and returns the final state plus each command's output text. */
function run(s: GitState, ...cmds: string[]): { s: GitState; outs: string[]; failed: boolean[] } {
  const outs: string[] = [];
  const failed: boolean[] = [];
  for (const c of cmds) {
    const r = runCommand(s, c);
    s = r.state;
    outs.push(r.lines.map((l) => l.text).join('\n'));
    failed.push(r.failed);
  }
  return { s, outs, failed };
}

const tip = (s: GitState, b: string) => s.branches[b];

describe('gitsim basics', () => {
  test('starts with one commit on main', () => {
    const s = initialState();
    assert.equal(s.head, 'main');
    assert.equal(Object.keys(s.commits).length, 1);
    assert.equal(s.commits[tip(s, 'main')].message, 'Initial commit');
  });

  test('hashes are deterministic, 7 hex digits and distinct', () => {
    const hs = Array.from({ length: 200 }, (_, i) => fakeHash(i));
    assert.ok(hs.every((h) => /^[0-9a-f]{7}$/.test(h)));
    assert.equal(new Set(hs).size, hs.length);
    assert.equal(fakeHash(3), fakeHash(3));
  });

  test('tokenize honours quotes', () => {
    assert.deepEqual(tokenize('git commit -m "Add login form"'), ['git', 'commit', '-m', 'Add login form']);
    assert.deepEqual(tokenize("git commit -m 'x y'  "), ['git', 'commit', '-m', 'x y']);
    assert.deepEqual(tokenize('git commit -m ""'), ['git', 'commit', '-m', '']);
  });

  test('branch names follow the basic ref rules', () => {
    for (const ok of ['feature', 'fix/login', 'dark-mode', 'v1.2']) assert.ok(isValidBranchName(ok), ok);
    for (const bad of ['a b', '-x', 'HEAD', 'a..b', 'a.lock', 'x/', '.hidden', 'a~1']) assert.ok(!isValidBranchName(bad), bad);
  });

  test('commit moves only the branch HEAD is on', () => {
    const { s, outs } = run(initialState(), 'git branch feature', 'git commit -m "Add README"');
    assert.match(outs[1], /^\[main [0-9a-f]{7}\] Add README$/);
    assert.notEqual(tip(s, 'main'), tip(s, 'feature'));
    assert.equal(s.commits[tip(s, 'main')].parents[0], tip(s, 'feature'));
    assert.equal(outs[0], '');
  });

  test('plain git commit gets a default message', () => {
    const { outs } = run(initialState(), 'git commit');
    assert.match(outs[0], /^\[main [0-9a-f]{7}\] Commit 2$/);
  });

  test('commit errors look like Git', () => {
    const { outs, failed } = run(initialState(), 'git commit -m', 'git commit -m ""', 'git commit -m Add login');
    assert.deepEqual(failed, [true, true, true]);
    assert.equal(outs[0], "error: switch `m' requires a value");
    assert.equal(outs[1], 'Aborting commit due to empty commit message.');
    assert.match(outs[2], /^error: pathspec 'login' did not match any file\(s\) known to git/);
  });
});

describe('gitsim branches and switching', () => {
  test('switch, switch -c, checkout and checkout -b', () => {
    const { s, outs } = run(
      initialState(),
      'git switch -c feature',
      'git switch main',
      'git switch main',
      'git checkout feature',
      'git checkout -b hotfix',
      'git switch -',
    );
    assert.deepEqual(outs, [
      "Switched to a new branch 'feature'",
      "Switched to branch 'main'",
      "Already on 'main'",
      "Switched to branch 'feature'",
      "Switched to a new branch 'hotfix'",
      "Switched to branch 'feature'",
    ]);
    assert.equal(s.head, 'feature');
  });

  test('errors for unknown and duplicate branches', () => {
    const { outs, failed } = run(
      initialState(),
      'git switch nope',
      'git checkout nope',
      'git branch main',
      'git switch -c main',
      'git checkout -b main',
      'git branch "a b"',
      'git switch',
    );
    assert.ok(failed.every(Boolean));
    assert.equal(outs[0].split('\n')[0], 'fatal: invalid reference: nope');
    assert.equal(outs[1], "error: pathspec 'nope' did not match any file(s) known to git");
    assert.equal(outs[2], "fatal: a branch named 'main' already exists");
    assert.equal(outs[3], "fatal: a branch named 'main' already exists");
    assert.equal(outs[4], "fatal: a branch named 'main' already exists");
    assert.equal(outs[5], "fatal: 'a b' is not a valid branch name");
    assert.equal(outs[6], 'fatal: missing branch or commit argument');
  });

  test('a failed command leaves the state untouched', () => {
    const s0 = initialState();
    const r = runCommand(s0, 'git switch nope');
    assert.equal(r.state, s0);
  });

  test('git branch lists with * on the current branch', () => {
    const { outs } = run(initialState(), 'git branch zeta', 'git switch -c alpha', 'git branch');
    assert.equal(outs[2], '* alpha\n  main\n  zeta');
  });

  test('branch -d refuses unmerged work, -D forces it', () => {
    const { s, outs, failed } = run(
      initialState(),
      'git switch -c wip',
      'git commit -m "WIP"',
      'git switch main',
      'git branch -d wip',
      'git branch -D wip',
      'git branch -d main',
      'git branch -d nope',
    );
    assert.match(outs[3], /^error: the branch 'wip' is not fully merged/);
    assert.match(outs[4], /^Deleted branch wip \(was [0-9a-f]{7}\)\.$/);
    assert.deepEqual(failed.slice(3), [true, false, true, true]);
    assert.ok(!('wip' in s.branches));
    assert.equal(outs[6], "error: branch 'nope' not found");
  });

  test('status reports the branch', () => {
    const { outs } = run(initialState(), 'git switch -c feature', 'git status');
    assert.equal(outs[1], 'On branch feature\nnothing to commit, working tree clean');
  });
});

describe('gitsim merging', () => {
  test('fast-forward when the current branch has not moved', () => {
    const { s, outs } = run(initialState(), 'git switch -c fix', 'git commit -m a', 'git commit -m b', 'git switch main', 'git merge fix');
    const lines = outs[4].split('\n');
    assert.match(lines[0], /^Updating [0-9a-f]{7}\.\.[0-9a-f]{7}$/);
    assert.equal(lines[1], 'Fast-forward');
    assert.equal(tip(s, 'main'), tip(s, 'fix'));
    assert.equal(Object.keys(s.commits).length, 3);
  });

  test('already up to date', () => {
    const { outs } = run(initialState(), 'git branch b', 'git merge b', 'git merge main');
    assert.equal(outs[1], 'Already up to date.');
    assert.equal(outs[2], 'Already up to date.');
  });

  test('merge commit with two parents when both sides moved', () => {
    const { s, outs } = run(
      initialState(),
      'git switch -c feature',
      'git commit -m C',
      'git switch main',
      'git commit -m E',
      'git merge feature',
    );
    assert.equal(outs[4], "Merge made by the 'ort' strategy.");
    const m = s.commits[tip(s, 'main')];
    assert.equal(m.message, "Merge branch 'feature'");
    assert.equal(m.parents.length, 2);
    assert.equal(m.parents[1], tip(s, 'feature'));
    assert.ok(isAncestor(s, tip(s, 'feature'), tip(s, 'main')));
    assert.equal(reachable(s, tip(s, 'main')).size, 4);
  });

  test('merging main into a feature branch names the target', () => {
    const { s } = run(initialState(), 'git switch -c feature', 'git commit -m C', 'git switch main', 'git commit -m E', 'git switch feature', 'git merge main');
    assert.equal(s.commits[tip(s, 'feature')].message, "Merge branch 'main' into feature");
    assert.notEqual(tip(s, 'main'), tip(s, 'feature'));
  });

  test('--no-ff and --ff-only', () => {
    const a = run(initialState(), 'git switch -c f', 'git commit -m x', 'git switch main', 'git merge --no-ff f');
    assert.equal(a.outs[3], "Merge made by the 'ort' strategy.");
    assert.equal(a.s.commits[tip(a.s, 'main')].parents.length, 2);
    const b = run(initialState(), 'git switch -c f', 'git commit -m x', 'git switch main', 'git commit -m y', 'git merge --ff-only f');
    assert.ok(b.failed[4]);
    assert.match(b.outs[4], /fatal: Not possible to fast-forward, aborting\.$/);
  });

  test('merge errors', () => {
    const { outs } = run(initialState(), 'git merge nope', 'git merge');
    assert.equal(outs[0], 'merge: nope - not something we can merge');
    assert.match(outs[1], /^fatal: No remote for the current branch\./);
  });
});

describe('gitsim log and friendly hints', () => {
  test('log --oneline lists reachable commits newest first with decorations', () => {
    const { s, outs } = run(initialState(), 'git branch feature', 'git commit -m "Second"', 'git log --oneline', 'git switch feature', 'git log --oneline');
    const lines = outs[2].split('\n');
    assert.equal(lines.length, 2);
    assert.equal(lines[0], `${tip(s, 'main')} (main) Second`.replace('(main)', '(HEAD -> main)'));
    assert.equal(lines[1], `${tip(s, 'feature')} (feature) Initial commit`);
    assert.equal(outs[4].split('\n').length, 1);
  });

  test('log after a merge counts every reachable commit', () => {
    const s = setupState([
      'git commit -m B',
      'git switch -c feature',
      'git commit -m C',
      'git commit -m D',
      'git switch main',
      'git commit -m E',
      'git merge feature',
    ]);
    const r = runCommand(s, 'git log --oneline');
    assert.equal(r.lines.length, 6);
  });

  test('unknown commands get a hint, not a crash', () => {
    const { outs, failed } = run(initialState(), 'commit -m x', 'git push', 'git frobnicate', 'ls', 'help');
    assert.deepEqual(failed, [true, true, true, true, false]);
    assert.match(outs[0], /start with "git"/);
    assert.match(outs[1], /real command/);
    assert.match(outs[2], /^git: 'frobnicate' is not a git command/);
    assert.match(outs[4], /git switch -c/);
  });

  test('clear asks the terminal to clear', () => {
    assert.equal(runCommand(initialState(), 'clear').clear, true);
  });

  test('setup throws on a bad command', () => {
    assert.throws(() => setupState(['git switch nope']));
  });
});

describe('gitsim goals', () => {
  const goal = { head: 'main', branches: ['fix'], merged: [{ from: 'fix', into: 'main' }], minCommits: { main: 4 } };

  test('fast-forward goal is met only at the end', () => {
    let s = setupState(['git commit -m "Add homepage"']);
    const steps = ['git switch -c fix', 'git commit -m a', 'git commit -m b', 'git switch main', 'git merge fix'];
    const met = steps.map((c) => {
      s = runCommand(s, c).state;
      return checkGoal(s, goal);
    });
    assert.deepEqual(met, [false, false, false, false, true]);
  });

  test('merged means ancestor-or-equal', () => {
    const s = setupState(['git branch other']);
    assert.ok(checkGoal(s, { merged: [{ from: 'other', into: 'main' }] }));
    assert.ok(!checkGoal(s, { merged: [{ from: 'missing', into: 'main' }] }));
    assert.ok(!checkGoal(s, undefined));
  });
});

describe('gitsim layout', () => {
  test('stackLevels puts overlapping intervals on new levels', () => {
    assert.deepEqual(stackLevels([{ start: 0, end: 50 }, { start: 30, end: 80 }, { start: 90, end: 120 }]), [0, 1, 0]);
  });

  test('one lane per branch, a merge commit has two edges, labels do not overlap', () => {
    const s = setupState([
      'git commit -m B',
      'git switch -c feature',
      'git commit -m C',
      'git switch main',
      'git commit -m E',
      'git merge feature',
      'git branch release',
    ]);
    for (const o of ['horizontal', 'vertical'] as const) {
      const g = layoutGraph(s, o);
      assert.deepEqual(g.lanes, ['main', 'feature']);
      assert.equal(g.nodes.length, 5);
      assert.equal(g.edges.length, 5);
      const m = g.nodes.find((n) => n.isMerge)!;
      assert.ok(m.isHead);
      assert.equal(g.edges.filter((e) => e.key.startsWith(m.id)).length, 2);
      assert.equal(g.labels.length, 3);
      for (const a of g.labels) {
        assert.ok(a.x >= 0 && a.x + a.width <= g.width, `${o}: label inside the canvas`);
        for (const b of g.labels) {
          if (a === b) continue;
          const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + 20 && b.y < a.y + 20;
          assert.ok(!overlap, `${o}: ${a.branch} overlaps ${b.branch}`);
        }
      }
      // time runs left→right (horizontal) or top→bottom (vertical)
      const axis = o === 'horizontal' ? 'x' : 'y';
      for (let i = 1; i < g.nodes.length; i++) assert.ok(g.nodes[i][axis] > g.nodes[i - 1][axis]);
    }
  });

  test('adjacent labelled commits in one lane stack instead of overlapping', () => {
    const s = setupState(['git branch feature-with-a-long-name', 'git commit -m x']);
    const g = layoutGraph(s, 'horizontal');
    const [a, b] = g.labels;
    assert.ok(a.y !== b.y || a.x + a.width <= b.x || b.x + b.width <= a.x);
  });

  test('deleted unmerged commits disappear from the graph', () => {
    const s = setupState(['git switch -c wip', 'git commit -m w', 'git switch main', 'git branch -D wip']);
    assert.equal(layoutGraph(s, 'horizontal').nodes.length, 1);
  });
});
