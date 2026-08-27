# Naming

This is the one part of the repository that goes beyond the book on purpose.

*Refactoring* covers naming, but it covers it as **moves**: *Rename Variable*, *Rename
Field*, *Change Function Declaration*, and *Mysterious Name* as the first smell in chapter
3. What the catalog cannot give you is the judgement — the book tells you how to rename
safely and that you should, not how to tell a good name from a plausible one.

That gap matters here more than in most repositories, because **Extract Function is a
naming exercise wearing a mechanical costume**. Cutting a block out and giving it a
parameter list is the easy half; the reason the extraction is worth anything is that the
block now has a name, and a bad name leaves the reader worse off than the comment they
replaced.

## The four questions

Ask them in this order. The first failure is the one to fix.

### 1. Does it say *what*, or does it say *how*?

The name should survive a rewrite of the body. `calculatePaceByDividingSecondsByKm` dies
the moment you cache the result. `paceSecondsPerKm` does not.

If your name describes the mechanism, you have named the implementation, and every future
change to the implementation will make it a lie.

### 2. Could it be the name of something else in this file?

`formatLine`, `getValue`, `buildResult`, `handleEntry` — each of these would fit five
different functions in the same module. A name that fits everything identifies nothing.

Names ending in `Data`, `Info`, `Manager`, `Helper`, `Util` and `Handler` fail this
question by construction: they are categories, not names.

### 3. Does it read at the call site, or only at the definition?

You write a name once and read it everywhere else. Check the caller, not the declaration:

```ts
lines.push(renderDidNotFinish(entry));       // reads
lines.push(dnfLineFormatter(entry));         // does not
```

If you have to look up what a function does after reading its call, it is not carrying its
weight and you have moved the confusion rather than removed it.

### 4. Is it *true*?

The most common failure and the hardest to catch, because a plausible name feels finished.
`validateEntries` that also normalises them is a lie, and the person who trusts it will be
bitten. A name that is slightly too narrow is a bug in waiting; a name that is too broad is
an invitation to dump unrelated things inside it.

**If a name is hard to write, that is data.** Usually it means the function does two
things and wants to be two functions. Renaming is cheap; reach for a second extraction
before you reach for `andThen` in a name.

## Conventions in this repository

Not universal law — just what these exercises are consistent about, so the solutions read
as one voice:

| Kind | Shape | Example |
| --- | --- | --- |
| Something that answers a question | noun phrase | `averagePace`, `sortedFinishers` |
| Something that produces output | `render*` / `format*` | `renderHeader`, `formatDuration` |
| Something that answers yes or no | `is*` / `has*` | `isFinisher`, `hasFinished` |
| A type predicate | `is*`, narrowing | `isFinisher(e): e is Finisher` |
| A unit-bearing number | name carries the unit | `paceSecondsPerKm`, not `pace` |

`render*` versus `format*` is a real distinction, not a coin toss: **format** turns one
value into a string (`formatDuration(4967)`), **render** turns a piece of the domain into
one or more output lines (`renderFinisher`). Keeping them apart tells the reader which
layer they are in before they read the body.

## How this is checked

```bash
./rp names 06-01
```

Advisory, always exits 0, and it only answers question 2 and part of question 1 — it can
see that a name is vague, never that it is *true*. A green result means nothing was
obviously wrong, which is not the same as right.

Questions 3 and 4 need a reader. That is what [`REVIEW.md`](./REVIEW.md) is for.
