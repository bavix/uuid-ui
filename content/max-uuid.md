---
title: Max UUID: ffffffff-ffff-ffff-ffff-ffffffffffff | UUIDConv
description: The all-ones UUID added by RFC 9562: what it is for, why it has no version, and how it pairs with the Nil UUID as the bounds of a range scan.
h1: The Max UUID
tldr: The Max UUID is 128 one bits: ffffffff-ffff-ffff-ffff-ffffffffffff. RFC 9562 added it in 2024 as the counterpart to Nil: the largest possible value, with no version and no variant.
lede: Max is the newest thing in the standard and the least known. It exists so that code needing an upper bound stops inventing one, and it pairs with Nil to bracket the whole 128-bit space.
cta: bytes - hex
related: nil-uuid, uuid-v7, uuid-versions, uuid-validation
priority: 0.7
updated: 2026-08-21
---

::example kind=detect column="What the converter reads"
lede: Every bit set: the variant reads as reserved, and there is no version to report.
- ffffffff-ffff-ffff-ffff-ffffffffffff — Max — also a palindrome
- 00000000-0000-0000-0000-000000000000 — Nil, the other end of the range
::

## What it is

All 128 bits set. Like Nil, it satisfies neither the version nor the variant rules, so no generator will ever produce it and no strict validator will accept it without an explicit exception. Unlike Nil, it is new: RFC 4122 had no such value, so older libraries and older articles do not mention it.

::rfc 9562 5.10 The Max UUID, added by the current standard

::specimen ffffffff-ffff-ffff-ffff-ffffffffffff Every bit set, and still no version: the counterpart of Nil at the other end of the range.

## Every spelling of it

::table spellings ffffffff-ffff-ffff-ffff-ffffffffffff Max

## The obvious use: bounding a range

With time-ordered identifiers, a range scan over a UUID key replaces a scan over a timestamp column. Nil is the lower bound and Max the upper, so "everything in this partition" needs no special case and no synthetic sentinel of your own invention.

```sql
-- everything, expressed as a range over the key itself
SELECT * FROM events
WHERE id BETWEEN '00000000-0000-0000-0000-000000000000'
             AND 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- one millisecond of a v7 stream: pad the tail with zeros and with f
```

The second idea is the useful one in practice: to select every v7 made during one millisecond, build the lower bound from that millisecond followed by zeros and the upper bound from the same millisecond followed by ones. The Max UUID is that trick taken to its limit.

::rfc 9562 6.11 Sorting, which is what makes a range over identifiers meaningful

## What it is not

Max is not "invalid" and not an error marker. Using it to mean failure creates the same problem as any in-band signal: the day a real value legitimately equals your sentinel, the meaning collapses. Here that day never comes, since nothing generates Max, but the habit spreads to fields where it does.

## Support in the wild

Libraries that predate RFC 9562 may not export a Max constant, and some validators reject it outright. Writing the literal by hand is safe: it is sixteen `ff` bytes and cannot drift. Check that your storage layer round-trips it before relying on it as a bound.

::faq
Q: What is ffffffff-ffff-ffff-ffff-ffffffffffff?
A: The Max UUID, defined in RFC 9562 section 5.10: all 128 bits set, the largest possible UUID value.
Q: What is the Max UUID used for?
A: As an upper bound. With Nil as the lower bound it brackets the whole space, which makes range scans over time-ordered identifiers straightforward.
Q: Why do some tools say the Max UUID is invalid?
A: It has no version and no RFC variant, and it was only added in 2024. Older libraries and strict validators reject it unless it is allowed by name.
::
