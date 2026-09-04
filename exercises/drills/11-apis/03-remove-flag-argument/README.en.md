[🌐 English](./README.en.md)

# Remove Flag Argument

`Chapter 11` · `Remove Flag Argument` · `●●○` · ~30 min

## Context

The Halliday Box Office takes bookings through three channels: a walk-up sale at the
counter, a mail-in order form, and a phone order for a block of seats. All three end up
booking the same section, but the counter wants its seats confirmed the instant it asks,
while the mail form is happy to sit on a waitlist if the section is briefly full.

## The smell

**Mysterious Name.** Not in `book`'s own name - the problem is what every caller has to
type to use it. `bookAtCounter` and `bookByMail` both end in `return book(section, order,
true)` or `return book(section, order, false)`, and neither literal means anything without
opening `book`'s body to find out. A boolean argument at a call site is the same failure
as a comment explaining a block: a name that hasn't been written yet. It exists because
`book` does two genuinely different things - confirm immediately and refuse if there's no
room, or confirm now and waitlist later - glued together by an `if` that reads the flag.

## The target

**Remove Flag Argument**: replace `book`'s boolean with two functions that each say
outright what they do, `bookPriority` and `bookStandard`. The caller whose choice is fixed
at each call site - the counter, the mail form - just calls the right one by name. The
phone order is different: it decides which one to call from the size of the order, and
that decision belongs at the call site, not hidden inside a parameter someone computed and
then handed to a function that couldn't tell a computed value from a literal one.

## Done when

- `book` no longer exists with a boolean third parameter anywhere in `src/`.
- Every caller either states outright which kind of booking it wants, or computes that
  choice in an `if` it owns and calls the matching function directly.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters -
  `npm run lint:strict -- exercises/drills/11-apis/03-remove-flag-argument/src`
  is the check.
- `npm test` was green after every single step along the way.

This drill declares `apiFrozen: false`. The three functions the box office actually calls
- `bookAtCounter`, `bookByMail`, `bookByPhone` - keep their signatures; the suite in
`tests/callers.spec.ts` only pins those three. Everything below that boundary, including
what `book` is called and whether it exists at all, is yours to redesign.

## Hints

<details>
<summary>Where do I start?</summary>

Not by moving a caller. Add a function next to `book` that does exactly what its `true`
branch does, and have `book` call it instead of running that branch inline. Do the same
for the `false` branch. Nothing a caller sees can change yet - you have only given each
branch a name, the same first move as drill-11-01.
</details>

<details>
<summary>Which caller moves first?</summary>

`bookAtCounter` and `bookByMail` pass a literal `true` or `false` that never varies -
moving either one straight onto the matching function cannot change what it returns.
`bookByPhone` is different: its argument is computed from `order.seatCount`, not written
down. Move it last, and when you do, don't pass the computed boolean into anything - write
the `if` at the call site and call the function it picks directly.
</details>

<details>
<summary>Why isn't this a named type, the way the book warns it sometimes should be?</summary>

Ask what the two branches of `book` actually differ in: a *value* they write down, or the
*steps* they take. If a restricted-view seat and a standard seat both went through the same
steps and only the number stored at the end differed, that would be an argument for keeping
one function and parameterizing it, the way drill-11-02 keeps three of its four raise
functions merged. Here the priority branch throws where the standard branch waitlists -
that's not a different value, it's a different thing happening. Two functions is the
answer when the branches disagree about what happens, not just about what gets recorded.
</details>

## Reading

*Refactoring*, 2nd edition - chapter 11, *Remove Flag Argument*; chapter 3, *Mysterious
Name*.
