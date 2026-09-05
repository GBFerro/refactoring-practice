[🌐 English](./README.en.md)

# Pull Up Constructor Body

`Chapter 12` · `Pull Up Constructor Body` · `●●○` · ~30 min

## Context

Beckworth Music School enrolls students two ways: private, one-on-one lessons with a
named tutor, or a shared group lesson slot. Either way, the front office needs the same
three things before it can invoice anyone — an enrolment id, the date the student signed
up, and a term's tuition total — regardless of which kind of lesson it turns out to be.

## The smell

**Duplicated Code**, specifically identical constructor prologues.
`PrivateLessonEnrolment` and `GroupLessonEnrolment` both extend `Enrolment`, but
`Enrolment` currently does nothing at all — every constructor opens with the same five
lines: validate the student's name, derive an id from it, store the enrolment date, then
work out the term's tuition. Only the trailing field — which tutor, or how many students —
is genuinely specific to one kind of enrolment.

## The target

**Pull Up Constructor Body**: give `Enrolment` a real constructor that does the shared
work once, and have each subclass call `super(...)` with whatever that constructor needs.
The mechanical part is easy. The part worth your attention is that a constructor is not an
ordinary method — `super()` must run first, and a subclass's own fields do not exist until
it returns — so not every identical-looking line can move up exactly as written.

## Done when

- `Enrolment` validates the student name, derives the id, and stores `enrolledOn` and
  `tuitionCents` — once, in its own constructor.
- Neither subclass repeats that validation, that id scheme, or that storage.
- `Enrolment`'s constructor is `protected` — `new Enrolment(...)` from outside
  `enrolment.ts` does not compile.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/12-inheritance/03-pull-up-constructor-body/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Sort the constructor's statements by what they need. `studentName` validation and the id
built from it need nothing but a parameter — safe to move first. `enrolledOn` is the same:
handed in whole, passed straight through. Do both of those before you even look at the
tuition calculation.
</details>

<details>
<summary>The tuition line looks just as identical as the others. Why can't it move the same way?</summary>

Read what it depends on. If it reads `this.someField`, ask when that field gets assigned —
in this case, by the subclass's own constructor, after `super()` has already returned.
Moving a statement that depends on that field into the superclass's constructor asks it to
read a value that will not exist yet.
</details>

<details>
<summary>So how does the tuition calculation move at all?</summary>

It doesn't need to depend on `this` in the first place. Whatever it currently reads from
subclass fields, check whether it could instead be computed from constructor parameters or
plain constants — values available *before* `super()` runs. Compute the result there, and
pass it as an argument to `super(...)` instead of assigning it afterward.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 12, *Pull Up Constructor Body*; chapter 3,
*Duplicated Code*.
