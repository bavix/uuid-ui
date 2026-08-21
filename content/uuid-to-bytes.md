---
title: UUID to byte array (16 bytes) converter | UUIDConv
description: Convert a UUID or GUID into its 16 bytes and back, as decimals, spaced hex or a 0x-prefixed C array, with the byte order every major language uses spelled out.
h1: UUID to a 16-byte array
tldr: A UUID is 16 bytes. Written out big-endian, byte 0 is the first pair of hex digits in the printed form, and byte 6 carries the version in its high nibble.
lede: Text is 36 characters; the identifier itself is 16 bytes. Anything that stores identifiers in bulk wants the bytes: a binary column, a cache key, a wire format. This page converts in both directions and prints them the three ways code actually needs them.
cta: bytes - hex
related: uuid-byte-order, uuid-to-hex, uuid-code-examples, uuid-bit-layout
priority: 0.8
updated: 2026-08-21
---

::example to=bytes
lede: The same identifier as decimal bytes, the shape a JSON payload or a Java array literal takes.
- f81d4fae-7dec-11d0-a765-00a0c91e6bf6 — Byte 6 is 0x11: version 1
- 018f3c00-7c00-7000-8000-00a0c91e6bf6 — Byte 6 is 0x70: version 7
- 00000000-0000-0000-0000-000000000000 — Nil UUID: sixteen zero bytes
::

## Three ways to write the same sixteen bytes

| Spelling | Looks like | Where it fits |
| --- | --- | --- |
| decimal | `[248,29,79,…]` | JSON, Java and Kotlin array literals, JavaScript |
| hex | `f8 1d 4f ae …` | hex dumps, protocol traces, documentation |
| chex | `[0xf8, 0x1d, …]` | C, C++, Rust and Go source |

The converter reads all three back, so a byte array pasted out of a log becomes an identifier again without editing it into shape first.

## Which byte holds what

| Byte | Content |
| --- | --- |
| 0-3 | The first group of the printed form: time_low, or the top of a v7 millisecond clock |
| 4-5 | The second group |
| 6 | High nibble is the version; low nibble belongs to the layout |
| 7 | The rest of the third group |
| 8 | The top two bits are the variant; 0x80 to 0xbf means RFC 9562 |
| 9-15 | The tail: clock sequence and node, or randomness |

::rfc 9562 4.2 Why the version lives in byte 6 rather than at the front

## Getting the bytes in each language

| Language | Bytes out | Bytes in |
| --- | --- | --- |
| Python | `u.bytes` (big-endian), `u.bytes_le` (mixed) | `uuid.UUID(bytes=b)` |
| Java | `ByteBuffer.allocate(16).putLong(msb).putLong(lsb)` | `new UUID(buf.getLong(), buf.getLong())` |
| Go | `u[:]` with `github.com/google/uuid` | `uuid.FromBytes(b)` |
| Rust | `uuid.as_bytes()` | `Uuid::from_bytes(b)` |
| C# | `id.ToByteArray(bigEndian: true)` | `new Guid(span, bigEndian: true)` |
| JavaScript | `uuid.parse(str)` returns a `Uint8Array` | `uuid.stringify(bytes)` |

::note Both C# entries are the .NET 8 overloads: `ToByteArray(bool)` and `Guid(ReadOnlySpan<byte>, bool)`. Before them, `ToByteArray()` gives the mixed-endian layout, which is a different byte array for the same identifier. `CreateVersion7` came one version later, in .NET 9.

## Storing bytes instead of text

Sixteen bytes against 36 characters is the obvious win, but the real one is comparison: a fixed-width binary key compares in one pass, and an index over it is smaller at every level. The cost is that nobody can read a row by eye any more, and that the byte order becomes a contract you have to keep. If the identifiers are v7 and the index matters, keep them big-endian so the byte order and the time order agree.

::rfc 9562 6.13 What the standard recommends for database storage

::faq
Q: How many bytes is a UUID?
A: Sixteen. The 36-character text form is a way of printing them: 32 hex digits and four hyphens.
Q: Which byte holds the version?
A: Byte 6, in its high nibble, in the RFC byte order. A v4 shows 0x4x there and a v7 shows 0x7x.
Q: Why do the bytes differ between C# and Python?
A: Python uuid.bytes is big-endian; the classic Guid.ToByteArray in .NET reverses the first three fields. Python spells that variant bytes_le.
::
