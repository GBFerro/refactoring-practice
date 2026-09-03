# How to practice

Three rules. They matter more than any individual exercise.

### 1. Green the whole way

The tests are green before you start and they must be green after every step. If they go
red for more than about two minutes, `git restore` and take a smaller step. Refactoring is
not "make it better and then make it work again" — the working state is what makes the
next step safe.

### 2. One commit per micro-step

Not one commit per exercise. Each extraction, each rename, each moved statement is its own
commit, made with the suite green. At the end, `git log --oneline` for your exercise
should read like the solution's `STEPS.md`. **Comparing those two logs is the best
self-assessment this repository can give you** — better than comparing the final files,
because it shows whether you took the route or jumped.

### 3. Open the solution when you are done, or when you are stuck for twenty minutes

It is a second opinion, not an answer key. Exercises with more than one published solution
are that way on purpose: the interesting question is rarely *what* to do, it is what each
route costs.

---

## The loop

```bash
gh repo fork <you>/refactoring-practice --clone
cd refactoring-practice && npm install
git switch -c practice

./rp start 06-01     # prints the brief, watches that exercise only
#  ... you edit src/, tests stay green, you commit every step ...

./rp names 06-01     # advisory pass over the names you chose
./rp diff 06-01 --steps
./rp review 06-01 --out
```

Everything is `./rp <command>`. Exercise ids are fuzzy — `06-01`, `drill-06-01`,
`extract-function` and `"Extract Function"` all find the same one.

`main` is always pristine. You work on a branch, so starting over is:

```bash
git restore --source=main exercises/drills/06-first-set/01-extract-function/src
```

No reset script, no duplicated baseline folder — the baseline is the history itself.

## What each command is for

| Command | What it does |
| --- | --- |
| `./rp` | Lists the exercises |
| `./rp start <id>` | Prints the brief (add `--pt` for pt-BR) and watches that exercise |
| `./rp diff <id> --steps` | The route the solution took. **Start here**, not with the code |
| `./rp diff <id> --walkthrough` | The long form: why each move, the naming, the dead ends |
| `./rp diff <id>` | The code diff. Expect noise; see below |
| `./rp names <id>` | Advisory pass over your names — see [Naming](./NAMING.md) |
| `./rp review <id> --out` | Builds a review packet for an AI or a person — see [Review](./REVIEW.md) |
| `./rp check` | Everything CI runs |
| `npm test` | Every exercise, against `src/` — should always be green |
| `npm run lint:strict -- <path>` | The objective half of "done when": size, depth, parameters |

## Getting reviewed

`./rp review <id> --out` writes a file containing the rubric, the brief, the untouched test
suite, your code and your commit log — ready to paste into an AI. It deliberately **leaves
the published solutions out**, because a reviewer holding an answer key grades similarity
instead of quality, and more than one decomposition is correct.

It refuses while your suite is red, for the same reason `diff` does: a review of a red
suite has exactly one finding, and you already have it.

## Two honest notes about `./rp diff`

**The gate is a nudge, not a lock.** `cat solutions/*/*.ts` will always work. The script
guards against the impulse, not the intention, and it would be silly to pretend otherwise.

**The code diff will be noisy.** Your names are not the same as mine and neither is the
order you extracted things in. That is expected and it is not a mistake on your part. The
comparison that teaches is `--steps` against your own commit log.

## When an exercise fixes a bug

A few exercises carry a `tests-fixed/` folder. Those tests run only against the published
solutions, never against your `src/`, because they pin behaviour the challenge gets
**wrong** — and a suite that has to stay green against the challenge cannot pin that.

Two consequences. Your `npm test` will never run them, so a green suite is not proof you
closed the hole. And the files are spoilers: they name the bug precisely. Leave them shut
until you are done, then read them as the answer to "did I actually fix it?"

## When an exercise ships without tests

A few katas hand you code and no safety net — writing it is the first half of the
exercise, exactly as in chapter 4. Those declare which files the net must pin, and the
gate is **100% branch coverage on those files**, not a repository-wide percentage.

If a branch refuses to be covered, that is a finding rather than an obstacle: either it is
dead code — and you have just earned a free *Remove Dead Code* — or the kata needs another
input. Either way you learned something before touching the refactor.
