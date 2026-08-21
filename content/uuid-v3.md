---
title: UUID v3: MD5-based deterministic identifiers | UUIDConv
description: What a version 3 UUID is, how it derives an identifier from a namespace and a name with MD5, and why v5 is the better choice unless you must match an existing system.
h1: UUID version 3
tldr: A v3 is the MD5 of a namespace UUID and a name, truncated to 128 bits with the version and variant bits overwritten. Same contract as v5, older hash.
lede: Version 3 is the MD5 sibling of version 5. The derivation, the guarantees and the caveats are identical; only the hash differs, and that difference matters less than people expect.
cta: uuid -
related: uuid-v5, uuid-namespaces, uuid-versions, uuid-v4
priority: 0.6
updated: 2026-08-21
---

::example kind=detect column="What the converter reads"
lede: The v3 of the DNS namespace and a host name, recomputed by the generator rather than pasted in.
- 9073926b-929f-31c2-abc9-fad77ae3e8eb — DNS namespace, example.com
- dc7edcc8-7f17-3cd9-acb0-e2984e568005 — DNS namespace, bavix.github.io
::

## The derivation

Namespace bytes, then the name bytes, hashed with MD5; keep the first 16 bytes, overwrite the version nibble with 3 and the variant bits with 10. The result is deterministic across languages and machines, exactly like a v5.

::specimen 9073926b-929f-31c2-abc9-fad77ae3e8eb An MD5 digest with six bits overwritten.

::rfc 9562 5.3 The v3 layout

## The same names as v5, for comparison

::table names 3

Compare these with the v5 table: same inputs, entirely different identifiers. Deriving an identifier is only reproducible if both sides agree on the version as well as the namespace and name.

## Is MD5 a problem here?

MD5 is broken for collision resistance, and a v3 does not depend on collision resistance: the identifier is truncated to 128 bits and six of those bits are overwritten, so neither v3 nor v5 offers cryptographic guarantees. What MD5 costs you is reputation, since a scanner will flag it on sight. What it buys you is compatibility with systems that already compute v3.

::rfc 9562 6.5 Name-based generation, which treats the hash as a mapping function

## When to pick which

| Situation | Version |
| --- | --- |
| New code, no constraints | v5 |
| Matching identifiers an existing system already produced with MD5 | v3 |
| A policy that forbids MD5 outright | v5 |
| The identifier must be unguessable | neither; use a random token |

::faq
Q: What is the difference between UUID v3 and v5?
A: Only the hash: v3 uses MD5, v5 uses SHA-1. The derivation, the determinism and the guarantees are the same.
Q: Is UUID v3 insecure because MD5 is broken?
A: It was never a security primitive. The digest is truncated to 128 bits with six bits overwritten, so no version of a name-based UUID is unguessable.
::
