---
title: Decode the timestamp inside a UUID or ULID | UUIDConv
description: Read the creation time out of a UUID v1, v6 or v7 and out of a ULID: which versions carry a clock, what epoch each one counts from, and what the decoded value can be trusted to mean.
h1: Get the timestamp out of a UUID
tldr: v1, v6 and v7 carry a clock; v4 carries none, and no amount of decoding will produce a date from one. A v7 holds 48 bits of Unix milliseconds, a v1 holds 100-nanosecond ticks since 1582-10-15.
lede: Three of the eight layouts carry a clock you can read straight off, a fourth carries half of one, and a ULID carries the same millisecond clock as a v7. This page decodes all of them, and is equally clear about the case people arrive with most often: a v4 has no timestamp to find.
cta: none
related: uuid-v7, uuid-v1, uuid-bit-layout, ulid
priority: 0.8
updated: 2026-08-21
---

::example kind=timestamp column="Decoded time (UTC)"
lede: Paste any of these into the converter and the decoded time appears next to the identifier.
- 018f3c00-7c00-7000-8000-00a0c91e6bf6 — v7: 48 bits of Unix milliseconds, straight off the front
- 1ef08e9e-66d0-6000-b0ef-795dda65c5a6 — v6: the same instant, in the v1 clock reordered to sort
- f81d4fae-7dec-11d0-a765-00a0c91e6bf6 — v1: 100-nanosecond ticks counted from 1582-10-15
::

## Which versions carry a clock

| Version | Clock | Epoch | Sorts by time? |
| --- | --- | --- | --- |
| v1 | 60 bits, 100-nanosecond ticks | 1582-10-15 | No: the high bits of the clock come last |
| v6 | the same 60 bits, reordered | 1582-10-15 | Yes |
| v7 | 48 bits, milliseconds | 1970-01-01 | Yes |
| ULID | 48 bits, milliseconds | 1970-01-01 | Yes |
| v2 | partial: time_low is given to a local id | 1582-10-15 | No |
| v3, v4, v5, v8 | none | — | No |

::rfc 9562 6.1 What the standard says a timestamp in an identifier may and may not be relied on for

## Why a v4 has no date

A v4 is 122 random bits, plus the six the version and variant take. There is no clock in it, so a tool that offers to decode a date from one is decoding noise. If you need the creation time and only have v4 identifiers, the time has to come from a column next to it, or the identifiers have to become v7.

## What the decoded time actually tells you

It tells you what the clock on the generating machine said. That machine may have been wrong, may have been a container starting with a skewed clock, and in the case of v7 may have deliberately spent the sub-millisecond bits on a counter instead of on precision. Treat the value as strong evidence and weak proof: good for debugging and for ordering, unsuitable as an audit timestamp.

::rfc 9562 6.2 Monotonic counters, and why two v7s from the same millisecond still order correctly

## Doing it in code

```javascript
// v7: the first 48 bits are Unix milliseconds
const ms = Number(BigInt("0x" + id.replace(/-/g, "").slice(0, 12)));
const when = new Date(ms);

// v1 and v6: 100-nanosecond ticks since 1582-10-15
const GREGORIAN = 12219292800000n;   // milliseconds between the two epochs
const unixMs = ticks / 10000n - GREGORIAN;
```

The constant is the whole trick for v1: 12219292800 seconds separate 1582-10-15 from 1970-01-01, and the ticks are tenths of a microsecond rather than milliseconds.

## ULID and v7 share a clock

A ULID is the same 48-bit millisecond field followed by 80 random bits, printed in Crockford base32. That is why converting a v7 to a ULID keeps the timestamp intact: only the random tail and the alphabet change. The converter shows both, so a log full of ULIDs and a database full of v7 identifiers can be lined up on the same axis.

::faq
Q: How do I get the date out of a UUID v4?
A: You cannot. A v4 is randomness plus six fixed bits; it never carried a creation time. Any tool that shows one for a v4 is misreading random bits.
Q: What epoch does a v1 timestamp count from?
A: 1582-10-15, the start of the Gregorian calendar, in 100-nanosecond ticks. Subtract 12219292800 seconds to reach the Unix epoch.
Q: Is the timestamp in a v7 in UTC?
A: It is Unix milliseconds, which are timezone-free. The converter prints them as UTC.
::
