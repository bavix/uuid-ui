---
title: UUID as a primary key: when it works | UUIDConv
description: What a UUID costs as a primary key, why v7 removes most of that cost, how it compares with a bigint, and what to store in the column in PostgreSQL, MySQL and SQL Server.
h1: UUID as a primary key
tldr: The cost is 16 bytes in the column, again in every foreign key, and again in every secondary index if the engine is InnoDB. With v4 you also pay in scattered index writes; v7 removes that part. If one sequence would do, an integer is still smaller and simpler.
lede: The argument about UUID keys usually mixes three separate questions: the size of the column, the behaviour of the index, and whether you need identifiers without a coordinator at all. This page keeps them apart.
cta: bytes - hex
related: uuid-v4-vs-v7, uuid-in-postgresql, uuid-in-mysql, uuid-to-bytes
priority: 0.9
updated: 2026-08-21
---

::example to=bytes style=hex
lede: What lands in the column: sixteen bytes, and with a v7 the first six of them are a clock.
- 01890a5d-ac96-774b-bcce-b302099a8057 — A v7 key: consecutive inserts share the leading bytes
- 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 — A v4 key: the first byte is already random
::

## The three questions

**Do you need identifiers without a coordinator?** If every row is written by one database, a `bigint` sequence is smaller, faster to compare, and readable in a log. UUIDs earn their size when rows are created offline, in another service, or in another region.

**What does the column cost?** Sixteen bytes against eight in the table, and then it depends on the engine. InnoDB puts the primary key into every secondary index record, so each secondary index pays the extra eight bytes per row as well: four of them turn 8 extra bytes into 40. SQL Server does the same for a clustered table. PostgreSQL does not: its indexes carry only their own columns and a pointer into the heap, so the extra cost lands on the primary key index itself and on every foreign key column that references it.

::links
- https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html | MySQL: InnoDB index types | Each secondary index record carries the primary key columns
- https://www.postgresql.org/docs/current/indexes-index-only-scans.html | PostgreSQL: index-only scans | Why an index there holds only what it indexes
::

**How does the index behave?** That depends entirely on the version, and it is the part people get wrong.

::rfc 9562 6.13 What the standard has to say about database keys

## What to store

| Database | Column | Notes |
| --- | --- | --- |
| PostgreSQL | `uuid` | 16 bytes, native, compares as two integers |
| MySQL | `BINARY(16)` | with `UUID_TO_BIN` and `BIN_TO_UUID` |
| SQL Server | `uniqueidentifier` | 16 bytes, but sorted from the last group first |
| MongoDB | BSON binary subtype 4 | the standard subtype, not the legacy 3 |
| SQLite | `BLOB` of 16 bytes | text also works and doubles the size |

Never `varchar(36)`. It more than doubles the storage, compares character by character, and lets two spellings of one identifier sit in the same column.

## Keep the sortable one at the front

With v7 the leading bits are a millisecond clock, so a range over the key is a range over time: the rows for a day sit together on disk, and a partitioned table can partition on the key itself. With v4 none of that is true, and a clustered index on it fragments.

SQL Server is the exception worth remembering: it compares `uniqueidentifier` starting from the last group, so a v7 stored there does not stay time-ordered in the index. Keep the clustered key on an identity column there and make the UUID a non-clustered unique key.

## What you get back

- Rows can be created anywhere, including offline, and merged later without renumbering.
- An identifier can be handed out before the row exists, which makes idempotent writes straightforward.
- Nothing in the key tells an outsider how many rows you have, which a sequence does.

::faq
Q: Is a UUID a bad primary key?
A: Not by itself. A v4 is bad for an index because the writes scatter; a v7 behaves like a sequence while keeping the properties you chose a UUID for.
Q: UUID or bigint?
A: bigint when one database writes every row. UUID when rows are created in more than one place, or before they reach the database.
Q: How much space does a UUID key really cost?
A: Sixteen bytes in the table, plus sixteen in every foreign key that references it. In InnoDB and in a clustered SQL Server table, every secondary index carries the key as well; in PostgreSQL it does not.
::
