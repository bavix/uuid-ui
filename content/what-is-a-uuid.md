---
title: What is a UUID? A short, exact answer | UUIDConv
description: A UUID is a 128-bit identifier defined by RFC 9562 that any machine can generate without asking anyone. What that buys you, what it costs, and how UUID and GUID relate.
h1: What is a UUID?
tldr: A UUID is 128 bits, generated locally, unique in practice without a central authority. GUID is the same thing under a different name.
lede: The value of a UUID is not that it is long. It is that two machines with no connection between them can each make one and be safe assuming the two will never collide. Everything else about the format follows from that.
cta: uuid -
related: uuid-versions, uuid-v7, uuid-bit-layout
priority: 0.8
updated: 2026-08-21
---

## The definition

A UUID is a 128-bit value with a defined internal layout: four bits say which layout, two say which standard family, and the remaining 122 are spent according to the layout. It is written as 32 hex digits in five hyphenated groups, and RFC 9562 has defined it since May 2024, replacing RFC 4122.

::rfc 9562 4 The format, in the words of the standard

## Why generate identifiers locally

A database sequence needs a database. A UUID needs nothing: a mobile client offline on a plane can create a record, name it, and reconcile later without a coordinator handing out numbers. That property is what makes the format worth its 16 bytes: distributed systems, event sourcing, multi-region writes and offline-first clients all rest on it.

## Is a collision actually impossible?

Not impossible, just too unlikely to plan for. A v4 has 122 random bits: reaching even odds of one collision takes about 2.7 × 10^18 identifiers, and a one-in-a-billion chance still takes around 10^14 of them. The real risks are elsewhere: a broken random source, a virtual machine cloned with its state, or a library that seeded itself from the clock.

::rfc 9562 6.7 What the standard says about collision resistance

## UUID and GUID

GUID is Microsoft vocabulary for the same 128 bits. The only practical difference is in byte order: several Microsoft APIs store the first three fields little-endian, so the byte arrays differ even though the text forms match. The same identifier is also standardised as ITU-T X.667 and ISO/IEC 9834-8; RFC 9562 says of that pair that both sets of specifications have been aligned and are fully technically compatible.

## Which version to reach for

| Version | Made from | Use it when |
| --- | --- | --- |
| v4 | randomness | You need an identifier and nothing more |
| v7 | milliseconds plus randomness | The identifier is a database key and should sort by time |
| v5 | SHA-1 of a namespace and a name | The same input must always produce the same identifier |
| v1 / v6 | a clock and a node | You are reading identifiers made by older systems |
| v8 | whatever you define | You need custom structure and still want a valid UUID |
| Nil / Max | all zeros / all ones | You need a placeholder that is obviously not a real value |

## What a UUID is not

It is not a secret: knowing one should never grant access to anything. It is not a checksum: it says nothing about the data it names. And it is not free: 16 bytes per row, per index entry and per foreign key adds up, which is exactly the trade you are making in exchange for not needing a coordinator.

::rfc 9562 6.12 Opacity: an identifier is not a place to put meaning

::faq
Q: Is a GUID the same as a UUID?
A: Yes. Same 128 bits and the same layouts. Only the byte order used by some Microsoft APIs differs.
Q: How likely is a UUID collision?
A: For v4, negligible: 122 random bits put even odds of a collision at about 2.7 × 10^18 identifiers. Broken randomness is a far more realistic risk.
Q: Which RFC defines UUIDs now?
A: RFC 9562, published in May 2024. It replaced RFC 4122 and added versions 6, 7 and 8 along with the Max UUID.
::
