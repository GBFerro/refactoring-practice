[🌐 English](./README.en.md)

# Change Function Declaration

`Chapter 6` · `Change Function Declaration` · `●○○` · ~20 min

## Context

Silverbrook Athletics Club runs its courses in seasonal catalogues — a `CourseCatalogue`
per season, each holding the courses on offer that season, some with a prerequisite. The
club's booking tools ask the catalogue three questions: describe a course, how many seats
are left in it, describe a course together with what it requires first. All three questions
go through the same lookup underneath.

## The smell

**Mysterious Name**. The lookup is called `checkCourse`, and "check" promises a yes-or-no
answer. What it actually does is find the course or throw — a query that doubles as an
assertion, which is a different thing than a check, and a caller reading only the call site
has no way to tell the two apart until the exception surprises them.

The same function also takes a `season` parameter that every caller fills in with
`catalogue.season` — the value already sitting on the object one line away. It is not wrong,
exactly. It is a second way to say something the catalogue already says, and a second way to
say the same thing is a second way for it to disagree.

## The target

**Change Function Declaration**: rename `checkCourse` to something that is true of a
function that throws, and drop the `season` parameter once the catalogue itself supplies it.
Both are the same catalog move — a signature is a name plus a parameter list, and this
exercise asks you to fix one of each.

Done, the lookup takes a catalogue and a code, nothing else, and its name does not need a
comment to be believed.

## Done when

- The lookup's name is true of a function that throws on a miss, and the removed parameter
  does not survive as a renamed one nobody reads.
- Every caller in `src/callers.ts` calls the lookup with two arguments, and none of them
  compute or forward a season by hand.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters —
  `npm run lint:strict -- exercises/drills/06-first-set/05-change-function-declaration/src`
  is the check.
- `npm test` was green after every single step along the way.

This drill declares `apiFrozen: false`. `tests/callers.spec.ts` only imports
`describeCourse`, `seatsRemaining`, and `describeWithPrerequisite` — the three functions
outside code actually calls — and never the lookup by name. That is deliberate: the whole
point of this drill is to change a signature, so nothing in the suite may depend on the one
you are changing. Change it, migrate a caller, watch the suite; anything it reports is a real
behaviour change, because it never had an opinion on the lookup's shape to begin with.

## Hints

<details>
<summary>Where do I start?</summary>

Not with a rename across the whole file. Add the new declaration first, next to the old one,
with the old one calling the new one. Now you have two working functions and the suite is
still green — you have not moved a single caller yet, and you already know the new shape
compiles and behaves.
</details>

<details>
<summary>Is it safe to just delete the `season` parameter?</summary>

Only once you can point at every call site and show it passes `catalogue.season`. That is
true here, but it is a fact about the *callers*, not about the function you are editing —
reading `checkCourse` in isolation cannot tell you that. Make the new function read
`catalogue.season` itself and have the old one delegate to it; the suite goes red the moment
any caller's `season` disagreed with its own catalogue.
</details>

<details>
<summary>Do I move all three callers at once?</summary>

You can — there are only three, in one file you already own, which is exactly the case
where the book's simple mechanic (change the declaration, fix every caller, one commit) is
the right call. Moving them one at a time here is slower on purpose: it is the same motion
you would need if this lookup were called from six modules instead of one, and the point of
a drill is to practice the motion before you need it for real.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 6, *Change Function Declaration*; chapter 3,
*Mysterious Name*.
