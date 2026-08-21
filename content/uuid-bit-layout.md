---
title: UUID bit layout: which bits mean what | UUIDConv
description: A bit-by-bit map of a UUID: where the version and variant sit, what each version spends its remaining 122 bits on, and how to read the layout off the printed form.
h1: The bit layout of a UUID
tldr: Every UUID spends 4 bits on the version and 2 on the variant. The other 122 belong to the layout that the version names, and the tables below come straight out of the code this site runs.
lede: A UUID is 128 bits and only six of them mean the same thing in every version. This page maps the rest: which bit ranges belong to the clock, the node, the hash or the randomness, for every layout RFC 9562 defines.
cta: bytes - hex
related: uuid-timestamp, uuid-versions, uuid-to-bytes, uuid-validation
priority: 0.8
updated: 2026-08-21
---

## The six bits every version shares

Bits 48 to 51 hold the version: that is the 13th hex digit of the printed form, the first character of the third group. Bits 64 and 65 hold the variant, at the top of the 17th hex digit, which is the first character of the fourth group. A `10xx` pattern there means RFC 9562, which is why so many identifiers show 8, 9, a or b in that position.

::rfc 9562 4.2 The version field

::rfc 9562 4.1 The variant field, and the patterns that are not this standard

## Version 4: randomness with two holes in it

::specimen 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 Two fixed fields cut the randomness into three runs, 122 bits in total.

::table layout 4

The two fixed fields split the random space into three runs. That is why a v4 has 122 bits of entropy rather than 128, and why the 13th and 17th characters of a v4 never look random.

## Version 7: milliseconds first

::specimen 01890a5d-ac96-774b-bcce-b302099a8057 The millisecond clock leads, so byte order and time order agree.

::table layout 7

The 48-bit millisecond field sits at the front, so byte order and time order agree and the identifiers sort. `rand_a` is nominally random, but a generator is allowed to spend it on sub-millisecond precision or on a counter that keeps identifiers made in the same millisecond in order.

::rfc 9562 5.7 The v7 layout in the standard

## Version 1: the clock that does not sort

::specimen f81d4fae-7dec-11d0-a765-00a0c91e6bf6 The clock is split into three pieces and the high part comes last, which is why a v1 does not sort.

::table layout 1

The clock is split into low, mid and high, and the high part comes last. Sorting v1 identifiers as strings therefore sorts by the low bits of the clock, which is close to sorting by nothing. Version 6 fixes exactly this by putting the pieces back in order.

## Version 6: the same clock, reordered

::specimen 1ef08e9e-66d0-6000-b0ef-795dda65c5a6 The same clock as a v1, written most significant bits first.

::table layout 6

## Versions 3 and 5: a hash with the middle cut out

::specimen cfbff0d1-9375-5685-968c-48ce8b15ae17 A SHA-1 digest with six bits overwritten.

::table layout 5

A v5 is a SHA-1 of the namespace and the name, truncated to 128 bits, with the version and variant bits overwritten. A v3 is the same with MD5. Six bits of the digest are lost, which is intentional and harmless: what remains is still a deterministic function of the input.

::rfc 9562 6.5 How a name-based identifier is derived

## Version 8: nothing but the six bits

::specimen 018f3c00-0000-8000-8000-0000deadbeef Only the version and variant are spoken for; the other 122 bits are yours.

::table layout 8

Version 8 exists so that a custom layout can still be a valid UUID. The standard claims the version and variant bits and says nothing about the other 122, which makes v8 the right home for identifiers that embed a shard number, a tenant, or a different clock.

::rfc 9562 5.8 The deliberately empty specification for v8

::faq
Q: Which character of a UUID is the version?
A: The 13th hex digit, which is the first character of the third group. A v4 shows a 4 there and a v7 shows a 7.
Q: Why does the fourth group almost always start with 8, 9, a or b?
A: Those are the values whose top two bits are 10, which is the variant that marks an RFC 9562 identifier.
Q: How much entropy does a v4 actually have?
A: 122 bits. The version and variant take six of the 128.
::
