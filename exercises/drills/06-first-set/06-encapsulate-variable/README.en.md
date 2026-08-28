[🌐 English](./README.en.md)

# Encapsulate Variable

`Chapter 6` · `Encapsulate Variable` · `●○○` · ~30 min

## Context

The Silverbrook Athletics Club runs its season out of one settings record: the dues,
the late-fee rate, how many members the roster can hold, how many have joined so far, and
whether registration is currently open. Four different jobs touch it — the registration
desk decides who gets in, the roster board reports how many spots are left, the treasurer
works out the late fee, and the committee opens and closes each season.

## The smell

**Global Data**, with **Mutable Data** as the reason it is dangerous rather than merely
untidy. `settings` is a module-level object, exported as-is, and `registration.ts`,
`roster.ts`, `season.ts`, and `treasury.ts` all reach into it directly — reading fields
and, in three of the four files, assigning to them. Nothing marks which of those four
files is allowed to change `memberCount`; the answer is "any of them, from anywhere in the
file, with no name attached to the change." A bug that leaves `registrationOpen` stuck at
`false` could be written in any of the four files, and you would have to read all four to
rule the others out.

## The target

**Encapsulate Variable**: wrap `settings` behind functions, and stop exporting the
variable itself. Every read becomes a call to a getter (`remainingCapacity()`,
`registrationIsOpen()`); every write becomes a call to a function whose name says what is
happening (`admitOneMember()`, `closeSeasonRegistration()`), not a bare assignment. When
you are done, `settings` cannot be imported from anywhere outside `club-settings.ts` —
try it, and TypeScript should refuse the import, not just discourage it by convention.

Wrapping the reads and writes is the mechanical half. The judgement call is what the
getters hand back once the object has more than one field worth exposing at once — see
`WALKTHROUGH.md` for the three options this drill weighs and which one the solution
commits to.

## Done when

- No file outside `club-settings.ts` imports `settings` or assigns to any of its fields.
- Every one of the five fields is reachable only through a named function.
- `npm run lint:strict -- exercises/drills/06-first-set/06-encapsulate-variable/src` is
  clean.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Add the accessor functions first, next to the variable, without touching any of the four
callers yet. `settings` stays exported for now, so nothing breaks and the suite stays
green with zero behaviour change — you have added code, not moved any yet. Only once the
functions exist do you go file by file, replacing direct field access with a call.
</details>

<details>
<summary>Which caller do I redirect first?</summary>

Start with the file that only reads — `roster.ts` touches `capacity`, `memberCount`, and
`registrationOpen`, but never assigns to any of them. Read-only callers are the safe
warm-up: there is no order-of-assignment to get wrong, so a mistake in the getter shows up
immediately as a wrong return value, not as state corruption three calls later. Save
`registration.ts` for last — it is the one file that both reads and writes in the same
function.
</details>

<details>
<summary>What does the getter for the whole record hand back?</summary>

Once every field has a getter, ask what happens if a caller needs several fields at once —
does it call four functions, or does something hand back the record itself? Handing back
`settings` directly re-opens the door you just closed: a caller that receives the live
object can still assign into it. A copy closes that door but opens another — the caller
now holds a value that goes stale the moment anything else calls a setter. This drill does
not use a generic getter for the whole record at all; see `WALKTHROUGH.md` for why.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 6, *Encapsulate Variable*; chapter 3, *Global Data*
and *Mutable Data*.
