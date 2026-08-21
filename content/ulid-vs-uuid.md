---
title: ULID vs UUID v7: which to choose | UUIDConv
description: A direct comparison of ULID and UUID v7 on length, alphabet, entropy, monotonicity, database support and tooling, with a clear rule for picking one.
h1: ULID or UUID v7
tldr: Same 48-bit millisecond clock, same sorting behaviour. Choose v7 when the value must be a UUID for a column type or a library; choose ULID when the shorter, case-insensitive text form is what people handle.
lede: The two formats solve one problem and differ mostly in presentation. This page lays the differences out so the decision takes a minute, and says what happens if you later change your mind.
cta: ulid -
related: ulid, uuid-v7, uuid-alternatives, uuid-in-postgresql
priority: 0.8
updated: 2026-08-21
---

::example to=ulid
lede: One identifier, both spellings: 36 characters against 26.
- 01890a5d-ac96-774b-bcce-b302099a8057 — A v7 and its ULID form carry the same instant
- 018f3c00-7c00-7000-8000-00a0c91e6bf6 — Another v7, same story
::

## The comparison

|  | UUID v7 | ULID |
| --- | --- | --- |
| Standard | RFC 9562 | a community specification |
| Bits | 128 | 128 |
| Text length | 36 | 26 |
| Random bits | 74 | 80 |
| Case sensitivity | insensitive by convention | insensitive by design |
| Native database type | yes, `uuid` in PostgreSQL and others | no, store as UUID or as text |
| Library support | everywhere | good, but not built in |
| Monotonic within a millisecond | if the generator spends rand_a on a counter | if the implementation follows the monotonic variant |
| Copy-paste and reading aloud | hex, easy to confuse 0 and O in some fonts | the alphabet was designed for it |

::rfc 9562 5.7 What v7 guarantees that a community spec cannot

## The rule

If the identifier lives in a database column, travels through gRPC, or passes through code that validates a version nibble, use v7: everything already understands it. If the identifier is mostly handled by people, in support tickets, URLs read over the phone or log lines scanned by eye, ULID is ten characters shorter and forgiving about case.

## Storing a ULID in a UUID column

It works, and it is a common pattern: convert on the way in, convert back on the way out. The one honest caveat is that the stored value will not validate as any UUID version, because a ULID has no version bits. Tools that check the nibble will call it non-standard, and they are right: the storage is fine, the label is not.

## Changing your mind later

Both directions are lossless at the bit level, so a migration is a re-encoding rather than a re-issue: the same identifier, printed differently. What is not lossless is meaning: a v7 converted to ULID text loses its version nibble to the eye, and a ULID converted to UUID gains a version it never had. Pick the canonical form once, and convert only at the edges.

::rfc 9562 6.2 Monotonic counters, where the two specifications agree in spirit

::links
- https://github.com/ulid/spec | The ULID specification | The other side of this comparison
::

::faq
Q: Is ULID better than UUID v7?
A: Neither is better. They carry the same clock; ULID is shorter and case-insensitive, v7 is standardised and fits native UUID types and libraries.
Q: Can I store a ULID in a PostgreSQL uuid column?
A: Yes, by converting the 128 bits. The stored value will not report a valid UUID version, because a ULID has no version bits.
::
