---
title: UUID byte order: RFC vs mixed-endian GUID | UUIDConv
description: Why the same GUID comes out of a Microsoft API with its bytes shuffled: mixed-endian layout against the big-endian order RFC 9562 defines, and how to tell which one you were handed.
h1: UUID byte order: big-endian, and the Microsoft exception
tldr: RFC 9562 stores a UUID big-endian: the printed order is the byte order. Microsoft APIs store the first three fields little-endian, so the same identifier turns into a different byte array, and reading one as the other silently produces a different UUID.
lede: Almost every UUID bug that survives code review is a byte order bug. The text form is unambiguous; the byte form is not, because one large ecosystem writes the first three fields in the opposite order. This page shows both byte arrays for the same identifier, and how to detect which one you have.
cta: bytes - hex
related: uuid-to-bytes, uuid-in-sql-server, uuid-in-mongodb, uuid-code-examples
priority: 0.8
updated: 2026-08-21
---

::example to=bytes style=hex
lede: This is the RFC order: the bytes read exactly as the identifier prints.
- f81d4fae-7dec-11d0-a765-00a0c91e6bf6 — Mixed-endian, the same identifier: ae 4f 1d f8 ec 7d d0 11 a7 65 00 a0 c9 1e 6b f6
- 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 — Mixed-endian: 44 24 5b 0c a0 70 32 49 98 0c b4 dc 0d 3f 02 b5
::

## What actually gets swapped

A UUID prints as five groups: 8-4-4-4-12 hex digits. The mixed-endian layout reverses the bytes of the first three groups and leaves the last two alone. The fourth and fifth groups are byte arrays in both layouts, which is why an identifier can look half-familiar after the wrong conversion: the tail matches, the head does not.

| Group | RFC 9562 order | Microsoft in-memory order |
| --- | --- | --- |
| 1 (4 bytes) | big-endian | little-endian |
| 2 (2 bytes) | big-endian | little-endian |
| 3 (2 bytes) | big-endian | little-endian |
| 4 (2 bytes) | as written | as written |
| 5 (6 bytes) | as written | as written |

::rfc 9562 4 The standard states the byte order once, at the top: most significant byte first

## Which systems hand you which

| Source | Byte order | Note |
| --- | --- | --- |
| `Guid.ToByteArray()` in .NET | mixed-endian | `Guid.ToByteArray(bigEndian: true)` exists in .NET 8 and later |
| SQL Server `uniqueidentifier` | mixed-endian in binary form | Its comparison starts from the last group, which is why GUID clustered keys sort strangely |
| Java `UUID`, Go `[16]byte`, Python `uuid.bytes` | big-endian | Python also offers `bytes_le` for the mixed form |
| MongoDB BSON subtype 4 | big-endian | The standard subtype; use this one |
| MongoDB BSON subtype 3 | driver-dependent | Legacy. The C# driver wrote mixed-endian, others did not |
| `UUID_TO_BIN(u, 1)` in MySQL | big-endian, reordered | Swaps time_low and time_high for index locality — a different operation, not endianness |

## How to tell which one you have

Byte 6 carries the version in its high nibble in the RFC order, so a v4 shows `4x` there and a v7 shows `7x`. Swapping moves that nibble into byte 7 and pulls a different byte into its place, so the decoded version changes.

What it changes into is the catch. Decoding twenty thousand swapped v4 identifiers spreads the version nibble evenly across all sixteen values, so a little over half of them still read as a version somebody could plausibly have generated. The variant nibble does not help either: groups four and five are untouched by the swap, so it stays exactly where it was.

A single value therefore cannot be diagnosed by eye. What does work: decode a batch. A source that really produces v4 shows the digit 4 in every single one, and a swapped batch shows all sixteen digits in roughly equal numbers. For one value, round-trip it through the library that wrote the bytes and compare the text with what you expected.

```csharp
var id = new Guid("f81d4fae-7dec-11d0-a765-00a0c91e6bf6");

byte[] mixed = id.ToByteArray();            // ae 4f 1d f8 …
byte[] rfc   = id.ToByteArray(bigEndian: true);  // f8 1d 4f ae …  (.NET 8+)

// before .NET 8: swap groups 1-3 by hand
Array.Reverse(mixed, 0, 4);
Array.Reverse(mixed, 4, 2);
Array.Reverse(mixed, 6, 2);
```

## The rule that prevents all of this

Store and transport the text form, or store the RFC byte order and write down that you did. A binary column with no note attached is a trap for the next service that reads it, and the failure is silent: you get a valid-looking UUID that belongs to nobody.

::rfc 4122 4.1.2 The layout the older standard described, for systems still built on it

::links
- https://learn.microsoft.com/en-us/dotnet/api/system.guid.tobytearray | Guid.ToByteArray in .NET | Its own remarks describe the reversal of the first three groups
- https://docs.python.org/3/library/uuid.html | Python: uuid.UUID.bytes and bytes_le | The same two layouts, named
::

::faq
Q: Why does the same GUID look different in C# and in Java?
A: Guid.ToByteArray writes the first three fields little-endian; Java writes all sixteen bytes big-endian. The text form is identical, the byte arrays are not.
Q: Is mixed-endian the same as little-endian?
A: No. Only the first three fields are reversed; the last eight bytes keep their order. That is why the tail of the identifier still matches after a wrong conversion.
Q: How do I detect a swapped UUID?
A: Not from one value: half of all swapped v4s still decode as a plausible version. Decode a batch instead — a correct source shows one version digit for every identifier, a swapped one shows all sixteen.
::
