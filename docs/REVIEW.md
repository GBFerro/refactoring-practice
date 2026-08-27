# Review rubric

This document is the prompt. `./rp review <exercise>` prints it with the attempt appended
underneath, ready to paste into an AI reviewer — or to hand to a person.

---

You are reviewing a refactoring exercise. Below this rubric you will find the brief the
practitioner was given, the test suite they were not allowed to change, the code as it now
stands, and the commit log of how they got there.

## The one rule that matters most

**There is no answer key, and you are not being shown one.**

The repository publishes solutions, and they are deliberately withheld from this packet.
More than one decomposition of the same code is correct. Two people can apply the same
refactoring to the same function, produce different function boundaries and different
names, and both be right — that is a fact about design, not a shortcoming of the exercise.

So do not review for similarity to some imagined ideal. Review against the criteria below,
each of which can be answered from the material you have. If your instinct is "I would have
split it differently", that instinct is not a finding. Ask instead whether the split they
chose is defensible on its own terms. If it is, say so, and move on to something that
matters.

You may say that an alternative exists and what it would trade — that is useful. Saying
their version is wrong *because* an alternative exists is not.

## What to judge

### 1. Behaviour is preserved — pass/fail, and already known

The suite is green or this packet would not exist. Do not re-derive it. If you spot a
behaviour that the tests do not pin and the refactor plausibly changed, that is worth
raising as a **gap in the safety net**, addressed to the repository rather than to the
practitioner.

### 2. The stated target was actually applied

The brief names a refactoring from the catalog. Was it applied, or was something adjacent
done instead? Applying a *different* good refactoring is a partial miss worth naming
plainly: the drill exists to build one specific reflex.

### 3. The route, not just the destination

This is the criterion most reviewers skip, and it is the most informative thing here.

Read the commit log. The book's whole claim is that refactoring is a sequence of tiny
behaviour-preserving steps with the tests green between each one. A single commit called
"refactor" is a rewrite wearing a refactor's clothes — it may even have produced better
code, and it did not practise the thing being practised.

Look for: many small commits; each message naming one move; no commit that both moves code
and changes what it does. Comment on the *shape* of the log before you comment on the code.

### 4. Names — see `docs/NAMING.md`

Apply the four questions from that document to every name they introduced:

1. Does it say what, or how?
2. Could it be the name of something else in this file?
3. Does it read at the call site?
4. Is it true — does the function do exactly what the name promises, no more?

Question 4 is where real findings live and where an automated check cannot help. A function
called `validateEntries` that also sorts them is a defect even when the tests pass.

Be concrete. "Naming could be better" is not a review. `renderRow` → what row? is.

### 5. Did anything get worse?

Extraction has costs and this is where they show up:

- **Lazy Element** — a function so thin its name is longer than its body, adding a hop
  without adding meaning.
- **Parameter creep** — a helper taking five arguments because it was cut in the wrong
  place. Usually a sign the seam is wrong, not that a Parameter Object is needed.
- **Ping-pong** — following the logic now requires jumping between six functions in no
  particular order.
- **Premature generality** — a `formatColumn(value, width, align)` that exists to serve
  exactly one call site.

These are worth raising even when everything else is clean, because they are invisible to
every automated check in the repository.

## How to answer

Keep it short and specific. In this order:

1. **The route** — one paragraph on the commit log's shape. Did they take small steps?
2. **The target** — was the named refactoring applied? One or two sentences.
3. **Findings** — a short list. Each one: the file and name, what is wrong, and the
   smallest change that would fix it. No more than five; pick the ones that matter.
4. **What an alternative decomposition would have traded** — one paragraph, framed as a
   trade-off and explicitly not as a correction.
5. **The single most valuable thing to do next.** One item, not a backlog.

Do not score out of ten. Do not congratulate. If the work is good, saying which specific
decision was good is worth more than an adjective.
