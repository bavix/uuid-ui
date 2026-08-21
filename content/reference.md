---
title: UUID reference: formats, versions and conversions | UUIDConv
description: A reference for working with UUIDs and GUIDs: the 128-bit layout, versions 1 to 8, and how a UUID maps onto Base64, hex, bytes, 64-bit integers, 32-bit words and ULIDs.
h1: UUID reference
tldr: A UUID is 128 bits with 6 of them spoken for: 4 say which layout the rest follows, 2 say which standard it belongs to. Everything else on this site is a way of writing those 128 bits down.
lede: This is the reference behind the converter: what each format on the tool actually means, which bits a version spends where, and where RFC 9562 says so. Every example was produced by the same code the converter runs.
cta: uuid
related: what-is-a-uuid, uuid-versions, uuid-to-long
priority: 0.9
updated: 2026-08-21
---

::specimen f81d4fae-7dec-11d0-a765-00a0c91e6bf6 The identifier RFC 9562 uses in its own examples, taken apart. Point at any character to see which field it belongs to.

## What the 128 bits are

A UUID carries no meaning of its own beyond its layout. Four bits hold the version, two hold the variant, and the remaining 122 belong to whichever layout the version names: a clock and a node for v1, a hash for v3 and v5, milliseconds and randomness for v7, pure chance for v4.

::rfc 9562 4.2 Where the version nibble sits, and why it is the 13th hex digit

::rfc 9562 4.1 The variant bits: 10xx is this standard, other patterns are NCS, Microsoft and reserved

## GUID and UUID are the same thing

GUID is the name Microsoft uses; UUID is the name the RFC uses. The 128 bits are identical. What differs is the byte order some Microsoft APIs use when they turn those bits into a byte array, and that difference is real enough to corrupt data if it is ignored.

## The standard moved: RFC 4122 is obsolete

RFC 9562 replaced RFC 4122 in May 2024. It kept versions 1 through 5 unchanged and added v6, v7 and v8, plus the Max UUID. Pages that still cite RFC 4122 for a v7 layout are citing a document that never described one.

::rfc 9562 - The current standard, in full

::index id=start-here title="Start here"
- what-is-a-uuid | What is a UUID? | The short, exact answer, and what GUID has to do with it
- guid-vs-uuid | GUID and UUID | Two names, one layout, and the byte order that differs
- uuid-versions | All versions side by side | What each layout is made of and when to pick it
- uuid-v4-vs-v7 | v4 or v7 | The choice almost every new project makes
- uuid-primary-key | UUID as a primary key | What it costs, and when an integer is the better key
::

::index id=using-the-tool title="Making and converting in bulk"
- uuid-generator | The generator | Every version, aimed at any moment, with names for v3 and v5
- uuid-bulk-convert | A whole column at once | Mixed formats per line, comments kept, nothing dropped
::

::index id=converting title="Converting a UUID"
- uuid-to-bytes | To a 16-byte array | Decimal, hex or a 0x-prefixed C array
- uuid-to-hex | Without dashes | Bare hex for a database column or a cache key
- uuid-formats | Every way to write one | Canonical, hex, braces, urn:uuid, capitals, N/D/B/P/X
- uuid-to-base64 | To Base64, and the short forms | 22 characters, the URL-safe alphabet, and what base58 buys
- uuid-to-long | To a high/low 64-bit pair | Java, Kotlin, Kafka, Rust — and why the number is negative
- uuid-to-words | To four 32-bit words | Minecraft NBT int arrays, Unreal FGuid, protobuf
- uuid-byte-order | Byte order: RFC against mixed-endian GUID | The bug that survives code review
::

::index id=reading title="Reading one"
- uuid-timestamp | Decoding the timestamp | v1, v6, v7 and ULID carry a clock; v4 does not
- uuid-bit-layout | The bit layout | Which bits belong to which field, per version
- uuid-validation | Validating a UUID | The regex, the version nibble, and what it rejects
- uuid-collision-probability | Collision probability | The real numbers, and the risk that is not arithmetic
::

::index id=versions title="The versions, in order"
- uuid-v1 | Version 1 | A 1582 clock and, often, a real MAC address
- uuid-v3 | Version 3 | Deterministic identifiers, via MD5
- uuid-v4 | Version 4 | 122 random bits, and the collision arithmetic
- uuid-v5 | Version 5 | The same contract with SHA-1
- uuid-v6 | Version 6 | The v1 clock, reordered so it sorts
- uuid-v7 | Version 7 | Time-ordered keys, and what they leak
- uuid-v8 | Version 8 | Your own layout inside a valid UUID
- nil-uuid | The Nil UUID | All zeros: placeholder, and the join trap
- max-uuid | The Max UUID | All ones: the upper bound of a range
- uuid-namespaces | Namespaces | DNS, URL, OID, X.500 — and rolling your own
::

::index id=databases title="In a database"
- uuid-in-postgresql | PostgreSQL | The uuid type, uuidv7(), and what the index does
- uuid-in-mysql | MySQL | BINARY(16), UUID_TO_BIN and the swap flag
- uuid-in-sql-server | SQL Server | uniqueidentifier sorts from the wrong end
- uuid-in-mongodb | MongoDB | BSON subtype 4 against the legacy subtype 3
::

::index id=neighbours title="ULID and the alternatives"
- ulid | ULID | 26 characters, the same 128 bits
- ulid-vs-uuid | ULID or UUID v7 | One clock, two spellings — how to choose
- uuid-alternatives | When not to use a UUID | Snowflake, KSUID, NanoID, CUID2, auto-increment
::

::index id=running title="Running the tool"
- uuid-code-examples | Code examples | Eight languages, and the three byte-order traps
- self-hosted-uuid-tool | Self-hosted and offline | One Docker image, no backend, nothing uploaded
::

::faq
Q: Is a GUID the same as a UUID?
A: Yes. Same 128 bits, same layouts, different vocabulary. Watch the byte order when a GUID is turned into bytes by a Microsoft API: the first three groups are written little-endian there, the last two big-endian.
Q: Which UUID version should I use?
A: v4 when you only need uniqueness, v7 when the identifier goes into a database index and you want it to sort by time, v5 when the identifier has to be derived from a name and be the same everywhere.
::
