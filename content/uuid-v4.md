---
title: UUID v4: 122 random bits, and when that is enough | UUIDConv
description: What a random UUID actually contains, how likely a collision really is, why six of its bits are never random, and when v7 is the better default for a database key.
h1: UUID version 4
tldr: A v4 is 122 bits of randomness plus 4 version bits and 2 variant bits. It carries no time, no machine and no meaning, which is why it is the safe default when an identifier only has to be unique.
lede: Version 4 is the UUID most systems generate, and the one most people picture when they hear the word. This page covers what is inside it, the collision arithmetic that people quote wrongly, and the one job it is genuinely bad at.
cta: bytes - hex
related: uuid-v7, uuid-versions, uuid-bit-layout, what-is-a-uuid
priority: 0.8
updated: 2026-08-21
---

::example kind=detect column="What the converter reads"
lede: Two fields are fixed in every RFC 9562 identifier, and the decoder reads them straight off the text.
- 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 — The 4 opens the third group; the 9 opens the fourth
- 06b01cbc-8d90-46ca-bdb4-e030d28dfd3a — Another v4 — same two fixed positions
::

## Which bits are random and which are not

::specimen 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 Two fixed fields cut the randomness into three runs, 122 bits in total.

The version nibble is the 13th hex digit and the variant sits at the top of the 17th, so a v4 always reads `xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx`. Everything else comes from the random source, which is why the entropy is 122 bits rather than 128.

::rfc 9562 5.4 The v4 layout

## How likely is a collision, really

Two numbers are worth keeping apart. A one-in-a-billion chance that any two of your identifiers collide arrives at about 10^14 of them: a hundred trillion, which a service minting a million a second reaches in a little over three years. Even odds of a single collision need about 2.7 × 10^18, which the same service reaches in roughly eighty-six thousand years. Both numbers say the same thing for ordinary systems, and the second one is the figure people usually quote.

What is your risk is the generator. A container image that seeds a userspace PRNG from the clock, a virtual machine restored from a snapshot, a library that falls back to `Math.random` when the crypto API is missing: each of these has produced duplicate identifiers in production, and none of them is a property of the format.

::rfc 9562 6.7 Collision resistance, and what the standard requires of the source

## The one job a v4 is bad at

As a primary key in a B-tree index, a v4 is the worst-behaved identifier you can pick. Each insert lands at a random point in the index, so writes touch pages all over the tree, the cache fills with pages that will not be read again, and the index fragments. Replace the same key with a v7 and the inserts land next to each other, because the leading 48 bits are a clock.

| Need | Reach for |
| --- | --- |
| An identifier and nothing else | v4 |
| A primary key that also sorts by time | v7 |
| The same input always giving the same identifier | v5 |
| A token nobody may guess | not a UUID — use a random token of your own length |

## A v4 is not a secret

122 bits is plenty of entropy for a capability URL in principle, and the standard still says not to treat an identifier as one. Identifiers end up in logs, in referrer headers, in analytics and in support tickets; a value that grants access should be issued, scoped and revocable, and a UUID is none of those things.

::rfc 9562 6.9 Unguessability: the standard is explicit that a UUID is not a security token

::faq
Q: Why does every v4 have the same character in two places?
A: Those are the version and variant fields: the 13th hex digit is always 4, and the 17th is 8, 9, a or b. Only the other 122 bits are random.
Q: Are UUID v4 collisions possible?
A: Mathematically yes, practically no: even odds need about 2.7 × 10^18 identifiers. Broken randomness, cloned VMs and non-crypto fallbacks are the realistic causes of duplicates.
Q: Should I use v4 or v7 for a database primary key?
A: v7. It keeps the uniqueness properties of v4 while inserting in time order, which is what a B-tree index wants.
::
