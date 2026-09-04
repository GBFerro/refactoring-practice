[🌐 English](./README.en.md)

# Replace Parameter with Query

`Chapter 11` · `Replace Parameter with Query` · `●●○` · ~25 min

## Context

The Halliday Box Office refunds a cancelled booking on a sliding scale: full refund well
before the show, half refund closer in, nothing once it's too late to resell the seat.
Three different desks trigger a cancellation — a customer using the self-service portal, a
support agent on the phone, and a venue-wide cancellation that refunds every booking for a
show at once.

## The smell

**Long Parameter List.** `refundAmountCents(booking, daysUntilShow)` takes a day count as
its second argument, and all three callers compute it the exact same way before calling
it: `daysBetween(cancelledAt, booking.showDate)`. Every caller already has both values that
formula needs — the booking, and the moment of cancellation it was handed for its own
reasons — so the parameter isn't giving the function information it couldn't get itself.
It's ceremony, copied three times, standing between the caller and a function that could
just work it out.

## The target

**Replace Parameter with Query**: give `refundAmountCents` the moment of cancellation
instead of a pre-computed day count, and let it derive `daysUntilShow` internally from that
moment and the booking's own show date. Every caller drops its own `daysBetween` call and
hands over one `Date` instead of a number it had to compute first.

## Done when

- No caller in `src/` computes a day count before calling the refund function — each hands
  over a booking and the moment of cancellation, nothing more.
- `daysBetween` is no longer exported from the module that computes refunds; nothing
  outside it needs a raw day count any more.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters —
  `npm run lint:strict -- exercises/drills/11-apis/05-replace-parameter-with-query/src`
  is the check.
- `npm test` was green after every single step along the way.

This drill declares `apiFrozen: false`. `tests/callers.spec.ts` imports only the three
callers — `refundForSelfServiceCancellation`, `refundForSupportDeskCancellation`,
`refundForBulkCancellation` — and never the refund calculation by name, because changing
its signature is the entire point.

## Hints

<details>
<summary>Where do I start?</summary>

Not by changing `refundAmountCents`'s signature directly — that breaks all three callers in
the same commit, and a red suite won't tell you which one you got wrong. Add a second
function next to it first, one that takes the moment of cancellation and computes the day
count internally before delegating to the original. Nothing a caller sees can change yet.
</details>

<details>
<summary>Which caller do I move first?</summary>

It doesn't matter — unlike some splits in this module, none of the three callers here is
riskier than the others, because none of them changes what value comes out. Move them one
at a time anyway, one commit each, so a failure after any single step points at exactly one
diff.
</details>

<details>
<summary>What happens to the old two-argument function?</summary>

Once every caller has moved onto the new one, it has exactly one caller left: your
scaffolding function. Inline it there and take back the good name — the temporary,
awkward name was only ever meant to survive the migration, not the exercise.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 11, *Replace Parameter with Query*; chapter 3, *Long
Parameter List*.
