---
title: UUID to four 32-bit words (int array) | UUIDConv
description: Convert a UUID into four 32-bit words: the Minecraft NBT int array, the Unreal FGuid A/B/C/D fields, and the four uint32 a protobuf schema carries an identifier in.
h1: UUID to four 32-bit words
tldr: Four 32-bit words are the same 128 bits cut into quarters, most significant first: w1 is the first block of the printed UUID, w4 the last. Signed and unsigned differ only in how the same bits are printed.
lede: Formats that predate a 128-bit integer type tend to store a UUID as four 32-bit numbers. Minecraft writes them as an NBT int array, Unreal as the four fields of an FGuid, and protobuf schemas keep reinventing a message with four uint32 in it. This page converts both ways and says which of the four holds the version.
cta: words signed
related: uuid-to-long, uuid-byte-order, uuid-to-bytes, uuid-bit-layout
priority: 0.8
updated: 2026-08-21
---

::example to=words int=signed
lede: Signed words are what a Minecraft NBT int array holds: the same bytes, printed as int32.
- f81d4fae-7dec-11d0-a765-00a0c91e6bf6 — w1 is negative because its top bit is set
- 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 — A v4
- ffffffff-ffff-ffff-ffff-ffffffffffff — Max UUID: every word is -1 when signed
::

## How the four words line up with the printed UUID

The words are big-endian quarters of the identifier, in reading order. For `018f3c00-7c00-7000-8000-00a0c91e6bf6`, w1 is `018f3c00`, w2 is `7c007000`, w3 is `800000a0` and w4 is `c91e6bf6`. Unlike the high/low pair, nothing is reordered, which is why the words survive a round trip through systems that disagree about byte order.

| Word | Bits | What lives there |
| --- | --- | --- |
| w1 | 0-31 | time_low in a v1, the top half of the millisecond clock in a v7 |
| w2 | 32-63 | time_mid, then the four version bits, then time_high or rand_a |
| w3 | 64-95 | The two variant bits at the very top, then clock_seq or randomness |
| w4 | 96-127 | The tail: the last 32 bits of the node or of the randomness |

::rfc 9562 4.2 The version nibble sits inside w2, not at the start of the identifier

::rfc 9562 4.1 The variant bits are the top of w3

## Signed or unsigned: the same bits either way

A word above 2147483647 has its top bit set. Printed as `uint32` it stays positive; printed as `int32` it wraps to a negative number, and 4162670510 becomes -132296786. Minecraft and any Java-based format print signed, because Java has no unsigned int. Protobuf lets the schema choose between `uint32` and `int32`, and picking the wrong one is the usual reason an identifier survives the trip but comes back wrong.

## Where four words show up

| Format | Shape | Signed? |
| --- | --- | --- |
| Minecraft NBT (1.16+) | `[I;w1,w2,w3,w4]` | signed |
| Unreal Engine | `FGuid(A, B, C, D)` | unsigned |
| protobuf | `message Id { uint32 w1 = 1; … }` | schema decides |
| C | `uint32_t words[4]` | unsigned |
| Windows GUID struct | `Data1` is a `DWORD`, then two `WORD`s and eight bytes | unsigned, and mixed-endian |

::note The Windows GUID struct is the one entry on this list that is not simply four big-endian words: its first three fields are stored little-endian. If you are reading raw memory rather than a text form, see the byte order page.

```python
import struct, uuid

u = uuid.UUID("f81d4fae-7dec-11d0-a765-00a0c91e6bf6")

words = struct.unpack(">4I", u.bytes)      # unsigned
signed = struct.unpack(">4i", u.bytes)     # what an NBT int array holds

back = uuid.UUID(bytes=struct.pack(">4I", *words))
```

When the identifier has to cross a protobuf boundary, the two-field `int64` message in `bavix/apis` is the usual choice: four `uint32` fields buy nothing on the wire over two `int64` ones and cost two more field tags.

::links
- https://github.com/bavix/apis/blob/master/bavix/api/v1/uuid.proto | bavix/apis — uuid.proto | The two-field message, for comparison
::

## Reading a Minecraft player UUID

Since snapshot 20w12a, which shipped in 1.16, player and entity identifiers in NBT are stored as `[I;…]` int arrays. Before that they were a pair of longs called `UUIDMost` and `UUIDLeast`, and older tooling still expects those. The wiki's own example of the new form is `[I;-132296786,2112623056,-1486552928,-920753162]`, which is the identifier at the top of this page read as four signed words.

Paste those four numbers into the converter with the signed reading selected and it gives back the identifier a command or an API expects. The reverse works too: paste the UUID, take the four words, and write them straight into the tag.

::links
- https://minecraft.wiki/w/Universally_unique_identifier | Minecraft Wiki: UUID storage | The int-array format, and the Most/Least pair it replaced
::

::faq
Q: Why are some of the four numbers negative?
A: They are 32-bit values with the top bit set, printed as signed integers. Minecraft and other Java-based formats have no unsigned int type, so they print them that way. The bits are identical to the unsigned reading.
Q: Which word holds the UUID version?
A: The second one. The version is bits 48 to 51, which fall inside w2, right after time_mid.
Q: Is the word order affected by endianness?
A: No. The words are the printed identifier cut into four, left to right. Only the Windows GUID struct reorders bytes, and it does that inside its first three fields.
::
