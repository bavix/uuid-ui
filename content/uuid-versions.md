---
title: UUID versions 1 to 8 compared, plus Nil and Max | UUIDConv
description: Every UUID version side by side: what each one is made of, whether it sorts by time, what it reveals, and which to pick. Based on RFC 9562, not the obsolete RFC 4122.
h1: UUID versions, side by side
tldr: Eight layouts share one shape. v4 is chance, v7 is a clock plus chance, v3 and v5 are hashes of a name, v1 and v6 are a clock plus a machine, v8 is whatever you define, and Nil and Max are constants with no version at all.
lede: The version nibble picks a layout, and the layouts have almost nothing in common beyond the six bits that name them. This page puts all of them in one table so the choice takes a minute rather than an afternoon.
cta: bytes - hex
related: uuid-v4, uuid-v7, uuid-bit-layout, what-is-a-uuid
priority: 0.8
updated: 2026-08-21
---

::example kind=detect column="What the converter reads"
lede: The decoder reads the version and variant off any identifier, including the two that have neither.
- 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 — Random
- 01890a5d-ac96-774b-bcce-b302099a8057 — Time-ordered
- cfbff0d1-9375-5685-968c-48ce8b15ae17 — SHA-1 of the DNS namespace and example.com
- 00000000-0000-0000-0000-000000000000 — Nil: no version, no variant
::

## The whole table

| Version | Made from | Sorts by time | Reveals | Reach for it when |
| --- | --- | --- | --- | --- |
| v1 | 60-bit clock since 1582 + node | no | creation time, often the MAC | you are reading identifiers from an older system |
| v2 | DCE Security: clock, local domain and id | no | a POSIX UID or GID | never, unless DCE asks |
| v3 | MD5 of a namespace and a name | no | nothing, but the name is guessable | you need determinism and MD5 is already the convention |
| v4 | 122 random bits | no | nothing | you need an identifier and nothing more |
| v5 | SHA-1 of a namespace and a name | no | nothing, but the name is guessable | the same input must always give the same identifier |
| v6 | the v1 clock, reordered | yes | creation time, often the MAC | you already generate v1 and want ordering |
| v7 | 48-bit Unix ms + 74 random bits | yes | creation time to the millisecond | it is a database key, which is the usual case |
| v8 | whatever you define | if you design it that way | whatever you put in it | you need custom structure in a valid UUID |
| Nil | all zeros | — | nothing | you need an obvious placeholder |
| Max | all ones | — | nothing | you need an upper bound for a range query |

::rfc 9562 5 Every layout in the standard, in one section

## Where the version actually lives

Bits 48 to 51 hold the version: the 13th hex digit, first character of the third group. Bits 64 and 65 hold the variant at the top of the 17th digit. An identifier whose 17th digit is 8, 9, a or b belongs to RFC 9562; anything else is NCS, Microsoft or reserved, and its version nibble means nothing.

::rfc 9562 4.2 The version field

## Version 2 is real, and you will not use it

DCE Security identifiers give `time_low` to a local id, a POSIX UID or GID, and half the clock sequence to a local domain. What remains is a coarse, partial timestamp. RFC 9562 documents the layout for completeness; almost no library generates it, and most decoders report it as unknown.

::specimen e66d0000-08e9-21ef-9234-00a0c91e6bf6 DCE Security spends time_low on a local id and half the clock sequence on a local domain.

::rfc 9562 5.2 The v2 layout, which most tools quietly ignore

## The standard moved in 2024

RFC 9562 replaced RFC 4122 in May 2024. Versions 1 to 5 are unchanged; v6, v7, v8 and the Max UUID are new. A page that describes UUID versions and cites RFC 4122 is describing a document that never mentioned a time-ordered layout. Worth remembering when comparing sources.

::links
- https://www.rfc-editor.org/rfc/rfc9562.html | RFC 9562 — the current standard | Obsoletes RFC 4122
- https://www.itu.int/rec/T-REC-X.667 | ITU-T X.667 / ISO-IEC 9834-8 | The same identifier as an international standard
::

::faq
Q: Which UUID version should I use?
A: v7 for database keys, v4 when you only need uniqueness, v5 when the identifier must be derived from a name. Everything else is for compatibility with an existing system.
Q: Why is there no version 2 in most libraries?
A: v2 is DCE Security. It spends fields on a POSIX UID and a local domain, is rarely useful outside DCE, and most implementations skipped it.
Q: Do Nil and Max UUIDs have a version?
A: No. All zeros and all ones set neither a valid version nor the RFC variant, which is exactly what makes them unmistakable as placeholders.
::
