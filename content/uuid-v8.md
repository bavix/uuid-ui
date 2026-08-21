---
title: UUID v8: the layout you define yourself | UUIDConv
description: Version 8 claims only the version and variant bits and leaves the other 122 to you. What to put in them, what breaks when you do, and how to stay a valid UUID.
h1: UUID version 8
tldr: Version 8 is deliberately unspecified: six bits are the version and variant, the other 122 are yours. It is the standard's way of saying "put your structure here instead of inventing a new format".
lede: Every team eventually wants a shard number, a tenant, or a different clock inside the identifier. Version 8 is where that goes: a custom layout that still validates as a UUID, fits a `uuid` column, and survives every library on the way.
cta: bytes - hex
related: uuid-v7, uuid-versions, uuid-bit-layout, uuid-formats
priority: 0.6
updated: 2026-08-21
---

::example kind=detect column="What the converter reads"
lede: A hand-built v8: a millisecond clock in front, a marker in the tail, and the six bits the standard claims.
- 018f3c00-0000-8000-8000-0000deadbeef — Valid v8 — the version nibble is 8 and the variant is 10xx
- 018f3c00-0000-8000-0000-0000deadbeef — Same bits, wrong variant nibble: no longer an RFC 9562 identifier
::

## What the standard claims, and what it leaves

::specimen 018f3c00-0000-8000-8000-0000deadbeef Only the version and variant are spoken for; the other 122 bits are yours.

Bits 48-51 must read 1000 and bits 64-65 must read 10. Everything else is yours: three runs of 48, 12 and 62 bits, split by the two fixed fields. That awkward split is the main design constraint, because a field cannot straddle the version or variant without being reassembled on read.

::rfc 9562 5.8 The deliberately empty specification

## What people put in one

- A clock with a different epoch or resolution than v7 offers — microseconds, or a domain epoch that buys extra years.
- A shard or partition number, so routing needs no lookup.
- A tenant identifier, so a leaked row cannot be re-keyed into another tenant.
- A short type tag, so an identifier in a log says what it names.
- A checksum over the rest, to catch transcription errors before a database round trip.

## What you give up

Opacity, mostly. The standard's advice is that an identifier should not carry meaning others can parse, because everything encoded in it becomes a contract you cannot change and information you cannot un-leak. A tenant id in the key means the key tells an outsider how many tenants you have and which one a row belongs to.

::rfc 9562 6.12 Opacity: the argument against putting meaning in an identifier

You also give up interoperability of meaning: another system sees a valid v8 and can read nothing from it. Write the layout down next to the schema, with bit offsets, or the next engineer will reverse-engineer it from examples.

## Staying sortable

If ordering matters, the time field has to lead, as in v7: the first 48 bits, most significant first. Put a shard number in front instead and you have grouped by shard, not ordered by time, and the index will behave accordingly.

::rfc 9562 6.11 Sorting, which a custom layout has to earn for itself

::faq
Q: What is a UUID v8 for?
A: Custom layouts. The standard fixes only the version and variant bits so that application-specific structure can live in a value that is still a valid UUID.
Q: Can I put a timestamp in a v8?
A: Yes, and put it first if you want the identifiers to sort. v8 is the right home for a clock that v7 cannot express, such as microseconds or a different epoch.
Q: Will libraries accept a v8?
A: Parsing and storage yes, because it is a well-formed UUID. Decoding the meaning is on you; nothing else knows your layout.
::
