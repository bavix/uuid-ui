---
title: UUID alternatives: Snowflake, KSUID, NanoID, CUID2 | UUIDConv
description: When a UUID is not the right identifier: Snowflake IDs, KSUID, NanoID, CUID2 and plain auto-increment, compared on length, ordering and coordination.
h1: When not to use a UUID
tldr: A UUID buys you identifiers without coordination, for 16 bytes. If you have coordination anyway, or you need a shorter or unguessable value, one of five other formats fits better.
lede: The interesting question is not which UUID version, but whether an identifier that nobody has to hand out is worth its size at all. Here is the honest comparison, including the boring answer that often wins.
cta: uuid -
related: ulid-vs-uuid, uuid-v7, uuid-v8, uuid-versions
priority: 0.7
updated: 2026-08-21
---

::example kind=detect column="What the converter reads"
lede: Everything on this page is 128 bits or fewer; only the UUID forms decode into fields.
- 01890a5d-ac96-774b-bcce-b302099a8057 — v7, the identifier the alternatives are measured against
- 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 — v4, no structure at all
::

## The field

| Format | Bits | Text | Sorts by time | Needs coordination | Good at |
| --- | --- | --- | --- | --- | --- |
| UUID v4 | 128 | 36 | no | no | being available everywhere |
| UUID v7 | 128 | 36 | yes | no | database keys |
| ULID | 128 | 26 | yes | no | short text, human handling |
| Snowflake | 64 | 19 digits | yes | yes, a worker id per node | fitting a bigint column |
| KSUID | 160 | 27 | yes | no | a second-resolution prefix plus 128 random bits |
| NanoID | configurable | 21 by default | no | no | short, URL-safe, tunable entropy |
| CUID2 | configurable | 24 by default | no | no | collision resistance without leaking time |
| auto-increment | 64 | short | yes | yes, one sequence | small, fast, obvious |

## Snowflake, when 64 bits matter

A Snowflake packs a 41-bit millisecond timestamp, a 10-bit machine id and a 12-bit per-millisecond counter into 64 bits, with the top bit left at zero so the value stays a positive `bigint`. That halves the index size against a UUID and prints as about nineteen digits. The price is coordination: every node needs a distinct worker id, and handing those out reliably is its own small system. Choose it when the storage saving is measured and the operational cost is acceptable.

## KSUID and the second-resolution middle ground

KSUID is 20 bytes: a 32-bit second counter, offset from its own epoch in 2014 rather than from 1970, and a 128-bit random payload, printed as 27 base62 characters that sort lexicographically by time. It predates v7 and remains reasonable, but v7 does the same job in fewer bits with a standard behind it.

## NanoID and CUID2, when the value faces users

Both aim at short, URL-safe identifiers rather than at structure. NanoID is 21 characters of a 64-symbol alphabet by default, chosen to land near a v4 for collision probability, and the length is a parameter. CUID2 defaults to 24 characters and hashes every entropy source into the result, so neither the time nor the host can be read back out. Neither sorts, and neither fits a native UUID column: they are text identifiers, and that is the point.

::rfc 9562 6.9 Unguessability, the axis on which CUID2 and NanoID differ from a UUID

## The boring answer

If there is exactly one database, one writer, and no plan to merge data from elsewhere, an auto-increment integer is smaller, faster, and easier to read in a log than anything on this list. UUIDs buy independence from coordination; when there is no coordination problem, you are paying for insurance you do not need.

::rfc 9562 6.7 Collision resistance, and what "no coordination" actually costs

::links
- https://github.com/segmentio/ksuid | KSUID | 160 bits, second-resolution prefix
- https://github.com/ai/nanoid | NanoID | Configurable length and alphabet
- https://github.com/paralleldrive/cuid2 | CUID2 | Deliberately leaks neither time nor host
::

::faq
Q: Is Snowflake better than UUID v7?
A: It is half the size and fits a bigint, but every node needs a coordinated worker id. v7 needs no coordination at all.
Q: What should I use if the identifier must not reveal creation time?
A: v4, NanoID or CUID2. Anything time-ordered (v1, v6, v7, ULID, KSUID, Snowflake) reveals when it was made.
Q: Are UUIDs overkill for a single database?
A: Often, yes. With one writer and no data merging, an auto-increment key is smaller and simpler; UUIDs pay for independence you are not using.
::
