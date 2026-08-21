---
title: Is this a valid UUID? Regex, version and variant | UUIDConv
description: How to check a UUID properly: the regex that matches the canonical form, why the version and variant nibbles matter, and which strings look like UUIDs but are not.
h1: Validating a UUID
tldr: Matching 32 hex digits proves the shape, not the standard. A value is an RFC 9562 identifier only if its version nibble is 1 to 8 and its variant nibble is 8, 9, a or b.
lede: Most validation code stops at a regex, which accepts plenty of values no generator ever produced. This page separates the three questions people actually mean by "valid", and shows what the converter reads from each string.
cta: uuid -
related: uuid-formats, uuid-bit-layout, nil-uuid, uuid-versions
priority: 0.7
updated: 2026-08-21
---

::example kind=detect column="What the converter reads"
lede: The same decoder the tool runs, applied to the values people most often ask about.
- 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 — Canonical and standard
- 01890a5d-ac96-774b-bcce-b302099a8057 — A v7 — same check, different layout
- 00000000-0000-0000-0000-000000000000 — Well formed, but neither version nor variant
- deadbeefdeadbeefdeadbeefdeadbeef — Hex, right length, and not an RFC 9562 identifier at all
::

## Three different questions

| Question | What to check |
| --- | --- |
| Is it shaped like a UUID? | 32 hex digits, optionally grouped 8-4-4-4-12 |
| Is it an RFC 9562 identifier? | version nibble 1-8 and variant nibble 8, 9, a or b |
| Is it one of ours? | the version you generate, plus whatever your own layout requires |

Most code needs the first two. Rejecting a value because it is a v1 when you generate v7 is the third question, and it belongs in the domain layer, not in a parser.

::rfc 9562 4.2 The version field

::rfc 9562 4.1 The variant field, and the patterns that are not this standard

::specimen 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 The two fields validation actually checks: the version nibble, 13th character, and the variant at the top of the 17th.

## The regex, and its limits

```javascript
// shape only
const SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// RFC 9562: version 1-8, variant 10xx
const RFC = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

RFC.test("00000000-0000-0000-0000-000000000000");   // false: Nil has no version
RFC.test("ffffffff-ffff-ffff-ffff-ffffffffffff");   // false: Max has none either
```

Note what the stricter pattern rejects: the Nil and Max UUIDs are defined by the standard and match neither. If your input may legitimately be a placeholder, accept those two explicitly rather than loosening the pattern.

## Strings that look like UUIDs and are not

- A ULID: 26 characters of Crockford base32, no hyphens — a different alphabet entirely.
- A hex digest cut to 32 characters: right length, arbitrary version nibble.
- A GUID read from a mixed-endian byte array: valid shape, wrong bytes, usually an impossible version.
- A base64 UUID at 22 characters: the same 16 bytes, a form no UUID regex will match.

## Be strict on the way out, generous on the way in

The converter accepts braces, the urn prefix, bare hex, capitals, quotes and surrounding whitespace, because that is what people paste out of logs and spreadsheets. Do the same at your edges: normalise first, validate the normalised form, store one spelling. Rejecting `{F81D4FAE-…}` because of its braces is a support ticket, not a security control.

::faq
Q: What regex validates a UUID?
A: For the shape, 8-4-4-4-12 hex. For an RFC 9562 identifier, additionally require version 1-8 and a variant nibble of 8, 9, a or b. Remember that Nil and Max match neither.
Q: Is 00000000-0000-0000-0000-000000000000 a valid UUID?
A: It is the Nil UUID, defined by the standard, but it carries no version and no variant, so a strict RFC pattern rejects it. Accept it explicitly if placeholders are allowed.
Q: Should validation reject a v1 if we only generate v7?
A: That is a domain rule, not a format rule. Parse the identifier, then decide separately whether that version is acceptable in that field.
::
