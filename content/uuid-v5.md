---
title: UUID v5: deterministic identifiers from a name | UUIDConv
description: How a version 5 UUID is derived with SHA-1 from a namespace and a name, why the same input always gives the same identifier, and how it differs from v3.
h1: UUID version 5
tldr: A v5 is the SHA-1 of a namespace UUID and a name, truncated to 128 bits with the version and variant bits overwritten. The same namespace and name always produce the same identifier, on any machine, forever.
lede: Version 5 is the one UUID you can recompute. That makes it the right tool when two systems must agree on an identifier without talking to each other, and the wrong tool when the identifier has to be unguessable.
cta: uuid -
related: uuid-v3, uuid-namespaces, uuid-versions, uuid-v4
priority: 0.7
updated: 2026-08-21
---

::example kind=detect column="What the converter reads"
lede: Each of these is the v5 of the DNS namespace and a host name, recomputed here by the same code the generator runs.
- cfbff0d1-9375-5685-968c-48ce8b15ae17 — DNS namespace, example.com
- 5cb4f8c0-aecd-590e-b4ac-82b9ab7f1529 — DNS namespace, bavix.github.io
::

## How it is derived

Take the 16 bytes of the namespace UUID, append the name as bytes, hash with SHA-1, keep the first 16 bytes of the digest, then overwrite four bits with the version and two with the variant. Nothing is random and nothing depends on the machine, so the result is a pure function of two inputs.

::specimen cfbff0d1-9375-5685-968c-48ce8b15ae17 A SHA-1 digest with six bits overwritten.

::rfc 9562 5.5 The v5 layout

::rfc 9562 6.5 The name-based derivation, step by step

## The same name, computed here

::table names 5

Run the same pair through any library in any language and you get the same row. That is the whole promise of the layout.

## What it is good for

- Idempotent imports: the identifier of a row derived from its natural key, so re-running the import updates instead of duplicating.
- Cross-system agreement: two services that both know the tenant and the resource name compute the same identifier without a lookup.
- Stable test fixtures: no random values in snapshots.
- Content addressing where a real hash would be too long to fit a UUID column.

## What it is not good for

A v5 is guessable by construction. If the name is an email address, a username or a sequential number, anyone who can guess the name can compute the identifier, and if that identifier grants access, you have built a lookup table for attackers. The SHA-1 here is a mapping function, not a security boundary, and the standard says so plainly.

::rfc 9562 6.9 Unguessability, and why a name-based identifier is not a secret

## v5 or v3

Identical contract, different hash: v5 uses SHA-1, v3 uses MD5. Neither is being used for its collision resistance, and both truncate to 128 bits anyway. Pick v5 for anything new, and v3 only when an existing system already computes MD5-based identifiers you have to match.

::faq
Q: Will the same name always give the same UUID v5?
A: Yes, in every language and on every machine. It is SHA-1 over the namespace bytes and the name, with six bits overwritten.
Q: Is UUID v5 secure because it uses SHA-1?
A: No. The hash makes it deterministic, not secret. Anyone who can guess the name can compute the identifier.
Q: Can I use my own namespace UUID?
A: Yes. Any UUID works as a namespace; the four registered ones are conveniences, not a requirement.
::
