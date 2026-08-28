# Exercise roadmap

One domain per exercise, one world per module, so no two exercises feel like the same
program twice. Nothing here is copied from the book: the domains are original and the only
thing borrowed is the catalog name of the refactoring.

Ids follow `drill-CC-NN` (chapter, position) and `kata-CC`.

## Module 1 — chapter 6, A First Set of Refactorings · *Silverbrook Athletics Club*

| Id | Refactoring | Domain | The hook |
| --- | --- | --- | --- |
| 06-01 | Extract Function | race results sheet | 77-line procedure, blocks announced by comments |
| 06-02 | Inline Function | course eligibility | helpers so thin the name says less than the body |
| 06-03 | Extract Variable | entry fee | one return statement, five nested calculations |
| 06-04 | Inline Variable | finish-line splits | variables that only alias a field |
| 06-05 | Change Function Declaration | course lookup | a name that lies, and a parameter nobody needs |
| 06-06 | Encapsulate Variable | club settings | a module-level object mutated from four files |
| 06-07 | Rename Variable | split times | `t`, `d`, `x2` in arithmetic nobody can follow |
| 06-08 | Introduce Parameter Object | season report | `from` and `to` threaded through six signatures |
| 06-09 | Combine Functions into Class | training plan | the same `(runner, plan)` pair passed everywhere |
| 06-10 | Combine Functions into Transform | runner profile | four functions deriving fields from one record |
| 06-11 | Split Phase | registration line | parsing and pricing tangled in one pass |

## Module 2 — chapter 7, Encapsulation · *Marlowe Community Library*

| Id | Refactoring | Domain | The hook |
| --- | --- | --- | --- |
| 07-01 | Encapsulate Record | loan record | a raw object read and written from everywhere |
| 07-02 | Encapsulate Collection | member loans | the loans array handed out to be mutated |
| 07-03 | Replace Primitive with Object | shelf code | a string that everybody parses their own way |
| 07-04 | Replace Temp with Query | overdue fine | temps with a lifetime longer than the function |
| 07-05 | Extract Class | member | contact details squatting inside the member |
| 07-06 | Inline Class | catalogue key | a class that wraps one field and adds nothing |
| 07-07 | Hide Delegate | membership tier | `member.membership().tier().limit()` |
| 07-08 | Remove Middle Man | branch | six methods that only forward to the manager |
| 07-09 | Substitute Algorithm | title search | a hand-rolled scan where a lookup belongs |

## Module 3 — chapter 8, Moving Features · *Ashgrove Bakery Co-op*

| Id | Refactoring | Domain | The hook |
| --- | --- | --- | --- |
| 08-01 | Move Function | delivery distance | a method that only touches another object's data |
| 08-02 | Move Field | discount rate | a field that belongs to the contract, not the customer |
| 08-03 | Move Statements into Function | order receipt | every caller repeats the same two lines first |
| 08-04 | Move Statements to Callers | dispatch note | a function doing something only half its callers want |
| 08-05 | Replace Inline Code with Function Call | allergen check | a hand-written loop that `some` already does |
| 08-06 | Slide Statements | daily bake plan | declarations a screen away from their use |
| 08-07 | Split Loop | production totals | one loop computing two unrelated numbers |
| 08-08 | Replace Loop with Pipeline | supplier report | accumulate-and-filter by hand |
| 08-09 | Remove Dead Code | legacy pricing | branches no caller can reach any more |

## Module 4 — chapter 9, Organizing Data · *Riverline Bike Share*

| Id | Refactoring | Domain | The hook |
| --- | --- | --- | --- |
| 09-01 | Split Variable | trip cost | one variable, two unrelated jobs |
| 09-02 | Rename Field | trip record | `dt`, `st`, `en` in a published record |
| 09-03 | Replace Derived Variable with Query | trip totals | a cached total kept in sync by hand |
| 09-04 | Change Reference to Value | fare | a shared mutable amount aliased across trips |
| 09-05 | Change Value to Reference | rider | the same rider copied into every trip |

## Module 5 — chapter 10, Simplifying Conditional Logic · *Fernbank Clinic*

| Id | Refactoring | Domain | The hook |
| --- | --- | --- | --- |
| 10-01 | Decompose Conditional | out-of-hours charge | a condition and two branches nobody can read |
| 10-02 | Consolidate Conditional Expression | eligibility | four ifs that all return the same thing |
| 10-03 | Replace Nested Conditional with Guard Clauses | staff payout | happy path buried four levels deep |
| 10-04 | Replace Conditional with Polymorphism | appointment types | a switch repeated in three functions |
| 10-05 | Introduce Special Case | unknown patient | `=== "unknown"` checked in nine places |
| 10-06 | Introduce Assertion | dosage rate | an assumption the code relies on and never states |

## Module 6 — chapter 11, Refactoring APIs · *Halliday Box Office*

Most of this module runs `apiFrozen: false` — the point of these refactorings is that the
signature changes, so the suite exercises the callers instead.

| Id | Refactoring | Domain | The hook |
| --- | --- | --- | --- |
| 11-01 | Separate Query from Modifier | seat hold | `findSeatAndReserve` does both |
| 11-02 | Parameterize Function | price bands | `raiseByFive`, `raiseByTen`, `raiseByTwenty` |
| 11-03 | Remove Flag Argument | booking | `book(order, true)` at every call site |
| 11-04 | Preserve Whole Object | seat scoring | three fields of the same object, passed apart |
| 11-05 | Replace Parameter with Query | refund | a parameter the callee could work out itself |
| 11-06 | Replace Query with Parameter | availability | a function reaching for module state |
| 11-07 | Remove Setting Method | ticket | an id that stays settable after construction |
| 11-08 | Replace Constructor with Factory Function | ticket kinds | `new Ticket("premium")` |
| 11-09 | Replace Function with Command | seating score | one function, seven temps, three phases |
| 11-10 | Replace Command with Function | fee calculator | a command class with one method and no state |

## Module 7 — chapter 12, Dealing with Inheritance · *Beckworth Music School*

| Id | Refactoring | Domain | The hook |
| --- | --- | --- | --- |
| 12-01 | Pull Up Method | lesson billing | the same method, twice, in two subclasses |
| 12-02 | Pull Up Field | instrument | the same field declared in both subclasses |
| 12-03 | Pull Up Constructor Body | enrolment | identical constructor prologues |
| 12-04 | Push Down Method | tutor | a superclass method only one subclass uses |
| 12-05 | Push Down Field | rental | a field meaningful to one subclass only |
| 12-06 | Replace Type Code with Subclasses | instrument category | a type code driving every conditional |
| 12-07 | Remove Subclass | student kinds | a subclass that no longer earns its keep |
| 12-08 | Extract Superclass | rooms and instruments | two classes with the same shape |
| 12-09 | Collapse Hierarchy | practice room | a subclass that adds nothing |
| 12-10 | Replace Subclass with Delegate | term pricing | subclassing used for one varying axis |
| 12-11 | Replace Superclass with Delegate | archive | inheriting an interface it half refuses |

## Katas

Realistic code, no named refactoring, at least two published solutions each (§4.3).

| Id | Domain | Ships with tests? |
| --- | --- | --- |
| kata-06 | Silverbrook registration pipeline | yes |
| kata-07 | Marlowe holds and fines | yes |
| kata-08 | Ashgrove delivery routing | yes |
| kata-09 | Riverline trip ledger | **no** — write the net first (chapter 4) |
| kata-10 | Fernbank triage rules | yes |
| kata-11 | Halliday booking API | yes |
| kata-12 | Beckworth rental hierarchy | **no** — write the net first |
| kata-13 | Cross-chapter: timesheet and payroll engine | yes |
| kata-14 | Cross-chapter: invoice reconciliation | **no** — write the net first |
