---
title: GUID vs UUID: the same 128 bits | UUIDConv
description: Whether a GUID and a UUID are the same thing, where the two words come from, and the one real difference: the byte order some Microsoft APIs use.
h1: GUID and UUID
tldr: They are the same 128 bits under two names. GUID is Microsoft vocabulary, UUID is the RFC's. The only difference that can bite you is the byte order in which some Microsoft APIs write them.
lede: The two words are used interchangeably, and for the text form that is correct. The moment either becomes a byte array, the vocabulary stops being the interesting part.
cta: uuid - braces
related: uuid-byte-order, what-is-a-uuid, uuid-formats, uuid-in-sql-server
priority: 0.8
updated: 2026-08-21
---

::example to=uuid style=braces
lede: The braced spelling Windows writes, and the same identifier the RFC would print without braces.
- f81d4fae-7dec-11d0-a765-00a0c91e6bf6 — .NET calls this format B
- 01890a5d-ac96-774b-bcce-b302099a8057 — A v7, in the same clothes
::

## Where the two names come from

The IETF standardised the identifier and called it a UUID; RFC 9562 is the current text. Microsoft shipped the same thing in COM and called it a GUID, a Globally Unique Identifier, and the name stuck across Windows, .NET and SQL Server. ITU-T X.667 and ISO/IEC 9834-8 describe it again for their own audiences, and RFC 9562 notes that both sets of specifications have been aligned and are fully technically compatible.

::rfc 9562 4 The format the word UUID refers to

## Where they differ

| | RFC 9562 world | Microsoft world |
| --- | --- | --- |
| Text form | `f81d4fae-7dec-11d0-…` | identical, often in capitals |
| Punctuation habits | plain, or `urn:uuid:` | braces, and the N/D/B/P/X format letters |
| Byte order of the first three groups | big-endian | little-endian in memory and in `ToByteArray()` |
| Database column | `uuid` | `uniqueidentifier` |
| Generator | `v4`, `v7` and the rest | `NEWID`, `NEWSEQUENTIALID`, `Guid.NewGuid` |

The byte order is the only row that can corrupt data. Everything else is spelling.

## The one that bites

`Guid.ToByteArray()` reverses the bytes of the first three groups. Java, Go, Python's `uuid.bytes` and every RFC-conforming implementation do not. Feed one to the other and you get a valid-looking identifier that belongs to a different row, with no error anywhere. .NET 8 added `ToByteArray(bigEndian: true)` and a matching constructor, which is the fix when you control both ends.

::note Half of all mixed-endian identifiers still decode as a plausible version, so a single value cannot be diagnosed by eye. The byte order page has the detail and the way to check a batch.

## So which word should I use?

Say GUID inside a Microsoft codebase, UUID everywhere else, and neither in a schema comment: write down the version and the byte order instead. Those are the two facts the next person actually needs.

::faq
Q: Is a GUID the same as a UUID?
A: Yes. The same 128 bits and the same layouts. Only the byte order used by some Microsoft APIs differs, and only when the value becomes bytes.
Q: Can I store a GUID in a PostgreSQL uuid column?
A: Yes, as long as you move it as text or in RFC byte order. The mixed-endian byte array is a different value.
Q: Does Microsoft follow RFC 9562?
A: Modern .NET does: it generates v4 and, since .NET 9, v7, and it can read and write big-endian bytes. The older APIs keep the mixed-endian habit.
::
