---
title: ULID: sortable 26-character IDs, and UUID conversion | UUIDConv
description: What a ULID contains, how its Crockford base32 alphabet works, and how to convert between ULID and UUID without changing a single bit of the identifier.
h1: ULID, and how it maps onto a UUID
tldr: A ULID is 128 bits printed as 26 Crockford base32 characters: 48 bits of Unix milliseconds followed by 80 random bits. The bits fit a UUID exactly, so converting between the two is a change of alphabet, not of value.
lede: ULID appeared before RFC 9562 had a time-ordered layout, and it solved the same problem in a shorter, case-insensitive text form. This page covers what is inside one and how it lines up with a UUID v7.
cta: ulid -
related: ulid-vs-uuid, uuid-v7, uuid-timestamp
priority: 0.8
updated: 2026-08-21
---

::example to=ulid
lede: The same 128 bits, printed in Crockford base32 instead of hex.
- 01890a5d-ac96-774b-bcce-b302099a8057 — A v7: the leading milliseconds survive the conversion
- 00000000-0000-0000-0000-000000000000 — Nil: 26 zeros in base32
- ffffffff-ffff-ffff-ffff-ffffffffffff — Max: the largest ULID there is
::

## What a ULID is made of

| Part | Bits | Characters | What it holds |
| --- | --- | --- | --- |
| timestamp | 48 | 10 | Unix milliseconds, most significant first |
| randomness | 80 | 16 | Random, or a counter incremented within the millisecond |

Ten characters of base32 encode 50 bits, two more than the timestamp has, so the first character of a ULID never exceeds 7 and only reaches 7 once the 48-bit millisecond clock runs out in the year 10889. That is why every ULID you have seen starts with a digit, and why the largest one that exists is `7ZZZZZZZZZZZZZZZZZZZZZZZZZ`.

## The alphabet

Crockford base32 drops I, L, O and U: I and L look like 1, O looks like 0, and U was removed to avoid accidental words. Decoding is case-insensitive, so a ULID read aloud, typed from a screenshot or shouted across a room survives the trip better than hex does.

## ULID against UUID v7

|  | ULID | UUID v7 |
| --- | --- | --- |
| Text length | 26 | 36 |
| Alphabet | Crockford base32, case-insensitive | hex with hyphens |
| Timestamp | 48 bits of Unix ms | 48 bits of Unix ms |
| Random bits | 80 | 74 |
| Fixed bits | none | 6: version and variant |
| Fits a native `uuid` column | after conversion | directly |

The six fixed bits are the whole difference in content. A ULID converted to a UUID keeps its bits, so the result usually reports an arbitrary version: a valid 128-bit value, but not a valid v7. Converting the other way is lossless in both directions as long as you accept that.

::rfc 9562 6.11 Sorting, the property both formats are built around

## Monotonicity inside one millisecond

The ULID specification suggests incrementing the random component when several identifiers are made in the same millisecond, so that they still sort in creation order. Not every implementation does it, and two ULIDs from the same millisecond may otherwise come back in arbitrary order, the same caveat as `rand_a` in a v7.

::links
- https://github.com/ulid/spec | The ULID specification | Layout, alphabet and the monotonic variant
::

::faq
Q: Can I convert a ULID to a UUID?
A: Yes, both ways. Both are 128 bits; only the text encoding differs. A converted ULID will not usually be a valid v7, because a ULID has no version bits.
Q: Why does every ULID start with a digit?
A: Ten base32 characters carry 50 bits but the timestamp is only 48, so the two extra bits are always zero and the leading character stays between 0 and 7.
Q: Is a ULID case sensitive?
A: No. Crockford base32 decodes case-insensitively and omits I, L, O and U to avoid confusion with 1 and 0.
::
