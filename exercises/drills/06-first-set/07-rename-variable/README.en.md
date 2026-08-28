[🌐 English](./README.en.md)

# Rename Variable

`Chapter 6` · `Rename Variable` · `●○○` · ~20 min

## Context

Silverbrook Athletics Club's coaches time training sessions at every kilometre marker. The
raw checkpoints go into a per-session report: the pace for each kilometre, the average
pace for the session, and a single number describing how consistent that pace was — tight
and even, or all over the place. Every session that gets reported has run at least one
full kilometre; there is no "checkpoint zero" entry, only the start line itself, at
distance zero and time zero.

## The smell

**Mysterious Name**. One function computes that consistency number, and every local
variable in it is named `t`, `d`, `x2`, `n`, or `xs`. It hurts here in a way that's easy to
underestimate: nothing else in the file is broken. The function is short, it's correctly
typed, the test suite passes against it, and the linter has nothing to say. The only thing
wrong is that a reader cannot tell what any of the five names hold without reconstructing
the formula from scratch — and in a report full of elapsed times and distances, the wrong
guesses (`t` for time, `d` for distance) are the *plausible* ones, not the obviously silly
ones.

## The target

**Rename Variable**, applied only once you've worked out what each identifier actually is
— not before. The mechanics are the easiest part of this drill: change a name, run the
suite, it's still green, because a rename can never change what the code does. The work is
entirely in the naming, and "done" looks like five short, ordinary-looking names that a
reader can check against the arithmetic and find true.

## Done when

- `xs`, `n`, `d`, `x2`, and `t` are gone, along with the reduce callback's own `a` and `s`
  — replaced with names a reader can verify against the formula, not against how they
  sound.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters —
  `npm run lint:strict -- exercises/drills/06-first-set/07-rename-variable/src`
  is the check.
- `npm test` was green after every single rename along the way — it should never have
  stopped being green, since renaming cannot change behaviour.

## Hints

<details>
<summary>Where do I start?</summary>

Not with the letters that look most alarming. Start with the parameter: the function's own
name and the module around it already tell you what kind of thing it holds, with no need
to read the body first. Everything else depends on values computed from each other, so
work through the formula in the order it's computed, not top to bottom on the page.
</details>

<details>
<summary>I can see what `d` and `x2` compute, but I'm not sure what to call the last line.</summary>

Look up the formula for variance in terms of an average and an average of squares. It's a
standard shortcut, not something you're expected to derive from nothing — but you do need
to recognise the shape once you see it, and check it against a source outside this file
before you trust it.
</details>

<details>
<summary>Is `spread` a good name for the value right before the square root?</summary>

Check what `spread` already means elsewhere in this module — the enclosing function's own
name uses it, and so does `format.ts`. Whatever that value is, is it the same thing as the
number you're about to name, or is it one operation away from it?
</details>

## Reading

*Refactoring*, 2nd edition — chapter 6, *Rename Variable*; chapter 3, *Mysterious Name*.
