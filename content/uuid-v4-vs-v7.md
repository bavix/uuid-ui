---
title: UUID v4 vs v7: which one for your keys | UUIDConv
description: A direct comparison of random v4 and time-ordered v7: what each contains, how they behave in a B-tree index, what v7 reveals, and the rule for choosing between them.
h1: UUID v4 or v7
tldr: Same uniqueness, different behaviour in an index. v4 scatters writes and reveals nothing; v7 keeps writes together and reveals the creation time to the millisecond. Pick by which of those you can afford.
lede: Two versions cover almost every new project, and the choice comes down to one question: does anything break if the identifier admits when it was made? This page puts both sides of that trade in front of you, and lets you watch the sorting difference happen.
cta: bytes - hex
related: uuid-v4, uuid-v7, uuid-primary-key, uuid-versions
priority: 0.9
updated: 2026-08-21
---

::widget sort

::example kind=detect column="What the converter reads"
lede: One of each, read back by the decoder: the v7 admits its moment, the v4 has nothing to admit.
- 01890a5d-ac96-774b-bcce-b302099a8057 — v7: the clock is right there in the first six bytes
- 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 — v4: version and variant, and 122 bits that say nothing
::

## Side by side

| | v4 | v7 |
| --- | --- | --- |
| Random bits | 122 | 74 |
| Carries a timestamp | no | 48 bits of Unix milliseconds |
| Sorts by creation time | no | yes |
| Index writes land | anywhere in the tree | in the rightmost leaf |
| Reveals | nothing | when the row was made |
| Text length | 36 | 36 |
| Library support | universal | wide, and in PostgreSQL 18 and .NET 9 |

::rfc 9562 5.7 The v7 layout, field by field

## What the index actually does

A B-tree keeps its entries in order. With v4 keys, each insert lands at a random point, so the pages being written are spread across the whole index: more pages dirtied, more of them evicted before they are read again, and more write amplification in the log. With v7 keys, consecutive inserts share a page, and that page stays in memory while it fills.

The effect scales with the size of the index rather than the number of rows inserted, which is why it is invisible in a test database and unpleasant in a large one.

::rfc 9562 6.11 Sorting, which is the property that produces all of this

## What v7 gives away

The first 48 bits are the millisecond the identifier was made. Anyone holding one can read it, and anyone holding two can measure the gap between them. For an order or an event that is usually fine, and often useful. For an invitation, a password reset, a share link or anything a competitor could count, it is a leak, and v4 is the right answer.

::note Neither version is a secret. v4 hides the time; it does not make the value unguessable in any sense you should rely on. A capability still needs an issued, revocable token.

## The rule

Use v7 when the identifier is a database key. Use v4 when the value is exposed to people who should not learn its timing, or when you have no way to generate v7 in every service that writes rows.

Mixed tables are fine, by the way: both are valid UUIDs, and a column holding some of each still works. What you lose is the ordering property for the v4 rows, which is exactly the thing you switched for.

::faq
Q: Is v7 faster than v4?
A: Generation costs the same. Inserts into an indexed column are faster with v7, because the writes are local instead of scattered.
Q: Should I migrate existing v4 keys to v7?
A: Rarely. New rows can be v7 while old ones stay v4; the column type does not change and both remain valid.
Q: Does v7 reduce uniqueness?
A: It has 74 random bits instead of 122, which is still far more than any service exhausts inside one millisecond.
::
