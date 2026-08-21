---
title: UUID without dashes: hex, braces and urn | UUIDConv
description: Strip the dashes from a UUID or put them back, and switch between the plain, hex, braced and urn:uuid spellings, in lower case or the capitals Windows writes.
h1: UUID without dashes, and the other spellings
tldr: The dashes carry no information. A UUID is 32 hex digits; the 8-4-4-4-12 grouping, the braces and the urn:uuid prefix are all ways of printing the same 128 bits.
lede: Half the identifier formats in the wild differ only in punctuation, and every one of them has an ecosystem that insists on it: 32 bare hex digits in a database column, braces in the Windows registry, and urn:uuid in anything built on XML. This page converts between them without touching the bits.
cta: uuid - hex
related: uuid-formats, uuid-to-bytes, uuid-in-mysql, uuid-validation
priority: 0.7
updated: 2026-08-21
---

::example to=uuid style=hex
lede: The hex spelling: the same identifier with the four hyphens removed.
- f81d4fae-7dec-11d0-a765-00a0c91e6bf6 — 32 characters instead of 36
- 018f3c00-7c00-7000-8000-00a0c91e6bf6 — A v7 keeps its leading zeros, which is why it must stay a string
::

## The four spellings

| Spelling | Example | Where it is expected |
| --- | --- | --- |
| plain | `f81d4fae-7dec-11d0-a765-00a0c91e6bf6` | The default everywhere |
| hex | `f81d4fae7dec11d0a76500a0c91e6bf6` | Database columns, cache keys, .NET format `N` |
| braces | `{f81d4fae-7dec-11d0-a765-00a0c91e6bf6}` | Windows registry, COM, .NET format `B` |
| urn | `urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6` | XML, RDF, anything that wants a URN |

::rfc 9562 4 The text form, with `urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6` as the standard's own example

::rfc 4122 3 Where the urn:uuid namespace was first registered; RFC 9562 section 7 points that registration at itself

## Upper or lower case

RFC 9562 writes UUIDs in lower case and requires readers to accept both. Windows writes them in capitals, so registry exports, COM identifiers and plenty of Microsoft documentation come back shouting. Compare identifiers case-insensitively, or normalise on the way in; comparing two spellings of the same identifier as strings is a bug that waits for the worst possible day.

## Removing the dashes for a database

A `CHAR(32)` column holding bare hex saves the four hyphens, which is a ninth of the width and nothing to celebrate. The real saving is `BINARY(16)`, less than half of either, and MySQL has `UUID_TO_BIN` and `BIN_TO_UUID` to move between the two without application code. Bare hex is the middle ground people actually keep: readable in a query result, and cheap enough in an index that nobody profiles it twice.

```sql
-- MySQL: text to 16 bytes and back
SELECT UUID_TO_BIN('f81d4fae-7dec-11d0-a765-00a0c91e6bf6');
SELECT BIN_TO_UUID(id) FROM orders;

-- bare hex, no dashes
SELECT REPLACE('f81d4fae-7dec-11d0-a765-00a0c91e6bf6', '-', '');
```

## Putting the dashes back

The grouping is fixed at 8-4-4-4-12, so restoring it is a slice, not a parse. Paste bare hex into the converter and it comes back grouped; paste a braced or urn form and the punctuation is stripped. Whatever the spelling, the version and variant stay where they are: nothing here moves a single bit.

::faq
Q: Does removing the dashes change the UUID?
A: No. The hyphens are punctuation. The identifier is the 32 hex digits, and every spelling on this page carries the same 128 bits.
Q: Is an uppercase GUID a different value?
A: No. Case is not significant. Normalise to lower case on input if you compare identifiers as strings.
Q: What is the urn:uuid form for?
A: It makes a UUID a valid URN, which XML and RDF documents need when an identifier has to be a URI rather than a bare string.
::
