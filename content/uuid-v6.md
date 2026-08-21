---
title: UUID v6: the v1 clock, reordered to sort | UUIDConv
description: Version 6 keeps the v1 clock and node but writes the timestamp most significant bits first, so the identifiers sort by creation time. When to choose it over v7.
h1: UUID version 6
tldr: A v6 is a v1 with the clock fields written in order, so sorting the identifiers sorts them by time. The 1582 epoch, the clock sequence and the node field are unchanged.
lede: Version 6 exists for systems that already speak v1 and need ordering without changing what the identifier means. It is the migration path, not the new default: for a green field, v7 is simpler and carries a Unix clock.
cta: none
related: uuid-v1, uuid-v7, uuid-timestamp, uuid-versions
priority: 0.7
updated: 2026-08-21
---

::example kind=timestamp column="Decoded time (UTC)"
lede: The same clock as a v1, read from the front of the identifier instead of out of three scattered fields.
- 1ef08e9e-66d0-6000-b0ef-795dda65c5a6 — A v6: the timestamp leads, so the text sorts by time
- e66d0000-08e9-11ef-9234-00a0c91e6bf6 — The v1 carrying the same instant — note the clock is scattered
::

## What changed from v1

::specimen 1ef08e9e-66d0-6000-b0ef-795dda65c5a6 The same clock as a v1, written most significant bits first.

Compare that with the v1 layout: the same three clock pieces, in the opposite arrangement. `time_high` now leads and `time_low` follows the version nibble, so the most significant bit of the clock is also the most significant bit of the identifier.

::rfc 9562 5.6 The v6 layout and its relationship to v1

## Why anyone would choose v6 over v7

|  | v6 | v7 |
| --- | --- | --- |
| Epoch | 1582-10-15, 100 ns ticks | 1970-01-01, milliseconds |
| Clock width | 60 bits | 48 bits |
| Node field | yes — MAC or random | no |
| Sub-millisecond ordering | from the clock itself | only if the generator spends rand_a on it |
| Best for | systems already generating v1 | anything new |

The honest summary: choose v6 when you already have v1 identifiers and a code path that understands them, and you want new ones to sort. Choose v7 otherwise: fewer moving parts, a clock everyone can read without a constant, and no node field to leak.

## It still carries a node

v6 inherits the node field, so the same caution applies: unless the generator sets the multicast bit and fills it randomly, the identifier can name the machine that made it. If that matters, either randomise the node or move to v7, which has no such field at all.

::rfc 9562 6.10 Identifiers that do not identify the host

## Converting between v1 and v6

The conversion is a field permutation: the same 128 bits with the clock pieces moved and the version nibble changed. It is deterministic and reversible, but the result is a different value: rows keyed by the v1 form do not match the v6 form. Treat it as a data migration with a mapping table, never as a display transformation.

::rfc 9562 6.11 Sorting, which is the entire reason this layout exists

::faq
Q: Is a v6 just a rearranged v1?
A: Yes. Same clock, same clock sequence, same node; the timestamp fields are written most significant first so the identifiers sort by time.
Q: Should I use v6 or v7?
A: v7 for anything new: a Unix millisecond clock, no node field, no 1582 constant. v6 when you already generate v1 and want ordering without changing the model.
::
