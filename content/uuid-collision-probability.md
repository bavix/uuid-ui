---
title: UUID collision probability, with the actual numbers | UUIDConv
description: How likely two random UUIDs are to collide, worked from the birthday problem over 122 random bits, and why a broken generator is the risk that actually matters.
h1: How likely is a UUID collision?
tldr: A v4 has 122 random bits. Even odds of a single collision need about 2.7 × 10^18 identifiers; a one-in-a-billion chance still needs around 10^14. The realistic risk is not arithmetic, it is a bad random source.
lede: The answer people quote is usually the 50% figure, which is not the number anyone should plan around. Both numbers are below, and the calculator recomputes either from the other.
cta: uuid
related: uuid-v4, what-is-a-uuid, uuid-versions, uuid-alternatives
priority: 0.7
updated: 2026-08-21
---

::widget collision

## The arithmetic

With N possible values and n identifiers drawn at random, the chance that any two match is about 1 − e^(−n(n−1)/2N). For a v4, N is 2^122, because the version and variant take six of the 128 bits.

| Chance of one collision | Identifiers needed |
| --- | --- |
| one in a billion | ≈ 1.0 × 10^14 |
| one in a million | ≈ 3.3 × 10^15 |
| even odds | ≈ 2.7 × 10^18 |

A service minting a million identifiers a second reaches the first row in a little over three years and the last in about eighty-six thousand.

::rfc 9562 6.7 What the standard says about collision resistance

## Why the 50% number misleads

It answers a question nobody asks. Nobody is willing to accept a coin flip on their primary key, so the figure that matters is the one where the risk is negligible, and that is the row at the top. Quoting the bottom row makes UUIDs sound about ten thousand times safer than the number you would actually design against.

## The risk that is real

Every collision anyone has reported in practice came from the generator, not from the arithmetic:

- A container image that seeds a userspace PRNG from the clock, so two containers started in the same second produce the same stream.
- A virtual machine restored from a snapshot, carrying its random state with it.
- A library that falls back to `Math.random` when the crypto API is missing, which in a browser means any page not served over HTTPS.
- An embedded device with no entropy source at first boot.

::note If you need to be sure, do not check the odds; check the source. On a browser that means `crypto.randomUUID` or `crypto.getRandomValues`, and on a server the platform's own random device.

## Fewer random bits, different arithmetic

A v7 keeps 74 random bits, so within one millisecond the space is 2^74 rather than 2^122. That sounds alarming and is not: the collision would have to happen inside the same millisecond, and 74 bits is still an enormous space to fill in a thousandth of a second. Generators that spend `rand_a` on a counter remove even that.

::rfc 9562 6.2 Counters, which make identifiers made in the same millisecond distinct by construction

::faq
Q: How many UUIDs before a collision?
A: For even odds, about 2.7 × 10^18. For a one-in-a-billion chance, about 10^14. Both assume a sound random source.
Q: Do UUID collisions happen in practice?
A: They do, and almost always because of a broken generator: a cloned VM, a clock-seeded PRNG, or a non-crypto fallback.
Q: Is v7 more likely to collide than v4?
A: Only within a single millisecond, where it has 74 random bits instead of 122. In practice that is still a space no service fills.
::
