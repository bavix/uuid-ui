---
title: UUID v7: time-ordered identifiers, explained | UUIDConv
description: What a UUID v7 is made of, why it sorts by time, how it compares with v4 and ULID, and what to check before using one as a primary key. Generate and decode v7 in the browser.
h1: UUID version 7
tldr: A v7 is 48 bits of Unix milliseconds followed by 74 bits of randomness, with 6 bits spent on the version and variant. Because the clock comes first, sorting the identifiers sorts them by creation time.
lede: Version 7 is the layout RFC 9562 added for exactly one job: an identifier that is unique like a v4 but behaves like a sequence in a database index. This page covers what it contains, what it costs, and where it beats v4 and ULID.
cta: ulid -
related: ulid-vs-uuid, uuid-timestamp, uuid-in-postgresql, uuid-versions
priority: 0.9
updated: 2026-08-21
---

::example kind=timestamp column="Decoded time (UTC)"
lede: The first twelve hex digits of a v7 are the milliseconds; everything after them is noise by design.
- 018f3c00-7c00-7000-8000-00a0c91e6bf6 — The clock, then the version nibble 7
- 01900000-0000-7000-8000-000000000000 — A hand-made v7: a round millisecond and an empty tail
::

## What a v7 is made of

::specimen 01890a5d-ac96-774b-bcce-b302099a8057 The millisecond clock leads, so byte order and time order agree. Every character above is coloured by the field it belongs to.

| Field | Bits | What it holds |
| --- | --- | --- |
| unix_ts_ms | 0-47 | Milliseconds since 1970-01-01, most significant first |
| version | 48-51 | Always 0111 |
| rand_a | 52-63 | Randomness, sub-millisecond precision, or a counter |
| variant | 64-65 | Always 10 |
| rand_b | 66-127 | 62 bits of randomness |

::rfc 9562 5.7 The layout, field by field

## Why it sorts and v4 does not

A B-tree index writes new rows next to the keys they sort near. Random keys therefore scatter writes across the whole index, dirtying pages everywhere and pushing the working set out of memory. A v7 puts the clock in the high bits, so consecutive inserts land on the same page, and the index behaves like one built on an auto-increment column while keeping the properties that made you choose a UUID in the first place.

::rfc 9562 6.11 Sorting, and what the standard expects of a time-ordered layout

## v7 against v4 and ULID

|  | v4 | v7 | ULID |
| --- | --- | --- | --- |
| Random bits | 122 | 74 | 80 |
| Carries a timestamp | no | 48 bits, milliseconds | 48 bits, milliseconds |
| Sorts by time | no | yes | yes |
| Text length | 36 | 36 | 26 |
| Fits a UUID column | yes | yes | yes, after conversion |

A ULID and a v7 hold the same clock and differ mainly in how they print. If the identifiers have to live in a `uuid` column or travel through a library that validates the version nibble, v7 is the one that fits without conversion.

## What you give up

A v7 tells anyone holding it roughly when it was created. For an order ID that is usually harmless; for a password reset token, an invitation link or anything a competitor might count, it leaks. It also has 48 fewer random bits than a v4, which is irrelevant for collisions and relevant for guessability: a v7 is not a secret and should never be used as one.

::rfc 9562 6.9 Unguessability: why an identifier is not a capability

## Two v7s in the same millisecond

Within a single millisecond the clock field is identical, so ordering falls to whatever the generator put in `rand_a`. Implementations that care spend those twelve bits on a counter that increments while the millisecond lasts; implementations that do not fill them with randomness, and identifiers from the same millisecond come back in arbitrary order. If per-millisecond ordering matters to you, check which one your library does.

::rfc 9562 6.2 The counter methods the standard describes

```sql
-- PostgreSQL 18 ships a generator
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- keep the column anyway: the identifier is an ordering hint, not an audit trail
```

::faq
Q: Is UUID v7 safe as a primary key?
A: Yes, and it is the reason the layout exists: the leading millisecond field keeps index writes local instead of scattering them the way v4 does.
Q: Does a v7 leak when a record was created?
A: Yes, to the millisecond. That is by design. Do not use v7 for tokens, invitations or anything whose creation time is sensitive.
Q: Should I use v7 or a ULID?
A: Same clock, same idea. Choose v7 when the value has to be a UUID for a column type or a library, and a ULID when the shorter 26-character text form matters more.
::
