[🌐 English](./README.en.md)

# Split Phase

`Chapter 6` · `Split Phase` · `●●○` · ~35 min

## Context

The volunteers at the Silverbrook Athletics Club registration desk key entries in from a
paper sign-up sheet: one line per runner, `name|distance|membership|promo`. At the end of
the night, `priceRegistrationLine` turns each raw line into what the runner owes — the base
fee for their distance, minus a member discount, minus an early-bird discount, capped so
nobody owes less than zero.

## The smell

**Long Function**. `priceRegistrationLine` answers two unrelated questions in one pass:
*what does this line of text mean* and *what does it cost*. They happen to run one after
the other, but nothing marks where one ends and the other begins — there's no comment, no
blank-line block, just twelve local variables in a row. It hurts here because the two
questions have unrelated reasons to change: a new promo code and a new distance tier both
land in the same function, and neither change has any business touching the other's half.

## The target

**Split Phase**: cut the function into two — one that turns text into facts, one that
turns facts into money — connected by a small data structure that carries only what the
second phase needs. Done looks like two functions and one type, composed in a single line:
`priceRegistration(parseRegistrationLine(raw))`.

## Done when

- `parseRegistrationLine` returns facts about the runner and imports nothing about money;
  `priceRegistration` turns those facts into a charge and imports nothing about `|` or
  string splitting.
- The intermediate type carries a boolean for every yes/no decision pricing makes — no
  field is still text waiting to be compared to a literal.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters —
  `npm run lint:strict -- exercises/drills/06-first-set/11-split-phase/src` is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Not with the parsing half, even though it runs first. Extract the pricing tail of the
function first, passing it whatever raw values it needs as separate parameters. Only once
you can see exactly what pricing consumes should you design the structure that carries
those values across the seam — otherwise you'll design it around what parsing happens to
produce, which is a different and worse question.
</details>

<details>
<summary>What goes in the intermediate structure?</summary>

Everything the pricing phase needs to make a decision, and nothing it needs to interpret.
If a field in your intermediate type is still a string that gets compared to a literal
(`"MEMBER"`, `"EARLY"`) anywhere outside the parsing function, the cut happened one word
too early — that comparison belongs in the parser, and the structure should carry the
boolean it produces instead.
</details>

<details>
<summary>The runner's name doesn't affect the price. Does it belong in the structure too?</summary>

It's tempting to leave it as a separate parameter next to the structure, since pricing
never branches on it. But a seam that's "the structure, plus one straggler" isn't really
one seam — it's an invitation for the next field someone adds to default to being a
parameter too. If a value crossed from parsing to pricing, it belongs in the structure,
whether or not pricing does anything with it beyond passing it through.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 6, *Split Phase*; chapter 3, *Long Function*.
