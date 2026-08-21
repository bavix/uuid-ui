---
title: UUID in PostgreSQL: the uuid type, v7 and indexes | UUIDConv
description: How PostgreSQL stores UUIDs in 16 bytes, which generator to use, why v4 keys hurt a B-tree, and what uuidv7() in PostgreSQL 18 changes.
h1: UUIDs in PostgreSQL
tldr: PostgreSQL has a native 16-byte `uuid` type, so storing identifiers as text wastes both space and comparison speed. The version you generate matters more than the column: v4 scatters index writes, v7 does not.
lede: PostgreSQL is the easiest database to get UUIDs right in and still the one where the classic mistake, `varchar(36)` plus v4, shows up most. This page covers the column, the generator, and what the index actually does.
cta: bytes - hex
related: uuid-v7, uuid-to-bytes, uuid-in-mysql, uuid-versions
priority: 0.8
updated: 2026-08-21
---

::example to=bytes style=hex
lede: What the 16 bytes of a v7 key look like: the clock leads, so consecutive inserts are neighbours.
- 01890a5d-ac96-774b-bcce-b302099a8057 — A v7 — the first six bytes are the millisecond
- 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 — A v4 — the first byte is already random
::

## The column

```sql
CREATE TABLE orders (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- PostgreSQL 18 and later
CREATE TABLE events (
    id uuid PRIMARY KEY DEFAULT uuidv7()
);
```

`gen_random_uuid()` is built in since PostgreSQL 13 and returns a v4. PostgreSQL 18 added `uuidv7()`, which is the one you want for a primary key. On older versions, generate v7 in the application; the column type is the same either way.

## Why the version matters to the index

A B-tree writes a new row next to the keys it sorts near. With v4 keys, every insert lands somewhere else, so the write set is the whole index: pages are read, dirtied, and written back all over the tree, WAL grows with full-page images, and the buffer cache fills with pages nothing will read again. With v7 keys, inserts land in the rightmost leaf, which stays hot.

|  | v4 key | v7 key |
| --- | --- | --- |
| Insert location | random leaf | rightmost leaf |
| Working set for writes | the whole index | a few pages |
| Index fragmentation | high | low |
| Range scan by time | needs the timestamp column | possible on the key itself |

::rfc 9562 6.13 What the standard says about database considerations

## Never store a UUID as text

A `uuid` column is 16 bytes and compares as two 64-bit words. `varchar(36)` is 36 bytes plus the length header, compares character by character, and lets two spellings of one identifier live in the same column. The type also validates on write, which is a free correctness check the text column does not give you.

## Practical notes

- `uuid_generate_v4()` comes from the uuid-ossp extension and predates `gen_random_uuid()`; new code needs neither the extension nor that function.
- PostgreSQL indexes carry only their own columns plus a pointer into the heap, so a UUID primary key does not widen the secondary indexes the way it does in InnoDB. What it does widen is the primary key index itself and every foreign key column pointing at it.
- For partitioned tables, a v7 key partitions by time without a separate column.
- The output format is canonical lower case; input accepts braces, the urn prefix and bare hex.

::links
- https://www.postgresql.org/docs/current/datatype-uuid.html | PostgreSQL: the uuid data type | Accepted input forms and storage
- https://www.postgresql.org/docs/current/functions-uuid.html | PostgreSQL: UUID functions | gen_random_uuid and, from 18, uuidv7
::

::faq
Q: Should a PostgreSQL primary key be a UUID?
A: It can be, and it should be a v7 rather than a v4: same uniqueness, but inserts land together instead of scattering across the index.
Q: How much space does a uuid column take?
A: 16 bytes, against 36 or more for the text form, and it compares as two integers rather than character by character.
Q: Does PostgreSQL generate v7 UUIDs?
A: From version 18, yes: uuidv7(). Before that, gen_random_uuid() returns a v4 and v7 has to come from the application.
::
