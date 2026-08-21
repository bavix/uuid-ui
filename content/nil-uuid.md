---
title: Nil UUID: 00000000-0000-0000-0000-000000000000 | UUIDConv
description: What the all-zero UUID means, why it has neither a version nor a variant, and when using it as a placeholder is better or worse than NULL.
h1: The Nil UUID
tldr: The Nil UUID is 128 zero bits: 00000000-0000-0000-0000-000000000000. RFC 9562 defines it as the identifier that names nothing, and it deliberately carries neither a version nor a variant.
lede: Every codebase eventually needs a value that means "no identifier yet". The standard supplies one, and using it well is mostly about deciding where it may appear and where it must not.
cta: bytes - hex
related: max-uuid, uuid-validation, uuid-versions, uuid-formats
priority: 0.7
updated: 2026-08-21
---

::example kind=detect column="What the converter reads"
lede: The decoder reports what is and is not there: no version, no variant, and a note that the value is special.
- 00000000-0000-0000-0000-000000000000 — Nil, and a palindrome as a bonus
- ffffffff-ffff-ffff-ffff-ffffffffffff — Max, its opposite number
::

## The definition

All 128 bits are zero. Because the version and variant fields are part of those bits, the Nil UUID matches no version and no standard variant, which is precisely what makes it unmistakable. No generator can produce it by accident, and no strict RFC regex accepts it.

::rfc 9562 5.9 The Nil UUID

::specimen 00000000-0000-0000-0000-000000000000 No version, no variant: the fields a decoder would colour are simply not there.

## Every spelling of it

::table spellings 00000000-0000-0000-0000-000000000000 Nil

## Nil or NULL

|  | Nil UUID | NULL |
| --- | --- | --- |
| Fits a NOT NULL column | yes | no |
| Survives a protobuf field with no presence | yes | no |
| Distinguishes "unset" from "unknown" | no | yes, if you keep the discipline |
| Indexed like any other value | yes | depends on the engine |
| Joins accidentally to other Nil rows | **yes** — the trap | no, NULL never equals NULL |

That last row is the reason to be careful. Two unrelated rows both holding Nil in a foreign key will join to each other and to any Nil parent, silently. NULL refuses to join, which is usually what you actually wanted.

## Where Nil earns its place

- Wire formats without null: gRPC and protobuf scalar fields, where an absent value is indistinguishable from a zero one.
- A sentinel root in a self-referencing tree, so the root row needs no special case.
- The lower bound of a range scan over identifiers — Max is the matching upper bound.
- Test fixtures where an obviously fake identifier is clearer than a random one.

## Validating it

Because Nil fails a strict version-and-variant check, any parser that enforces RFC 9562 has to accept it as an explicit special case. Decide once, at the edge: either the field admits placeholders, in which case Nil is allowed by name, or it does not, in which case Nil is rejected like any other malformed value.

::rfc 9562 4.1 The variant field, which Nil does not satisfy

::faq
Q: What is 00000000-0000-0000-0000-000000000000?
A: The Nil UUID from RFC 9562 section 5.9: 128 zero bits, an identifier that names nothing.
Q: Is the Nil UUID valid?
A: It is defined by the standard, but it has neither a version nor an RFC variant, so a strict validation pattern rejects it unless you allow it by name.
Q: Should I use Nil instead of NULL?
A: Only where NULL is unavailable, such as a protobuf scalar. In SQL, remember that two Nil foreign keys will happily join to each other while two NULLs never do.
::
