---
title: uniqueidentifier in SQL Server: byte order and sorting | UUIDConv
description: Why SQL Server sorts uniqueidentifier values by the last group first, how its byte order differs from RFC 9562, and what NEWSEQUENTIALID actually guarantees.
h1: UUIDs in SQL Server
tldr: SQL Server stores a GUID mixed-endian and sorts it by the last group first, so neither the text order nor the RFC byte order predicts the index order. NEWSEQUENTIALID exists to work around exactly that.
lede: SQL Server is the database where UUID intuition fails hardest: the same identifier has a different byte layout, a different sort order, and a generator whose guarantees are narrower than the name suggests.
cta: bytes - hex
related: uuid-byte-order, uuid-to-bytes, uuid-in-postgresql, uuid-v7
priority: 0.7
updated: 2026-08-21
---

::example to=bytes style=hex
lede: The RFC byte order, which is the order the identifier reads in. SQL Server stores the first three groups reversed.
- f81d4fae-7dec-11d0-a765-00a0c91e6bf6 — Mixed-endian in storage: ae 4f 1d f8 ec 7d d0 11 a7 65 00 a0 c9 1e 6b f6
- 01890a5d-ac96-774b-bcce-b302099a8057 — Mixed-endian: 5d 0a 89 01 96 ac 4b 77 bc ce b3 02 09 9a 80 57
::

## Two things that are both true

| Aspect | SQL Server | RFC 9562 |
| --- | --- | --- |
| Byte order of groups 1-3 | little-endian | big-endian |
| Byte order of groups 4-5 | as written | as written |
| Sort order | last group first, then 4th, then 3rd, 2nd, 1st | plain byte order |
| Text form | identical | identical |

The text you see is the same in both worlds, which is why the difference stays hidden until a byte array crosses a boundary: an ETL job, a checksum, a cache key built from raw bytes.

::rfc 9562 4 The byte order the standard defines, for contrast

## The sort order nobody expects

The documentation is blunt about it: ordering is not implemented by comparing the bit patterns of the two values. What the comparison does instead is start from the last group and work backwards, so a clustered index on a GUID column orders rows in a way that matches neither the printed value nor the creation time — and a time-ordered v7 stored there does not stay time-ordered in the index.

## NEWID and NEWSEQUENTIALID

| Function | Produces | Good for |
| --- | --- | --- |
| `NEWID()` | a random GUID | uniqueness only, and the worst case for a clustered index |
| `NEWSEQUENTIALID()` | values increasing in SQL Server sort order until Windows restarts | clustered keys, at the cost of predictability |

`NEWSEQUENTIALID` can only appear in a `DEFAULT` constraint, never in a query. After Windows restarts, the sequence can begin again from a lower range. And the documentation is unusually direct about the rest: if privacy is a concern, do not use this function, because the next value it generates can be guessed. That rules it out anywhere the identifier is exposed.

Underneath, it wraps the Windows `UuidCreateSequential` call and shuffles the bytes. That call is the old MAC-based generator, which is why the same page adds that its values are unique across machines only when the source computer has a network card.

## If you generate identifiers in the application

Generating v7 in the application and storing it in `uniqueidentifier` gives you a stable, standard identifier, but the clustered index will not benefit, because SQL Server sorts from the other end. Either keep the clustered key on an identity column and make the GUID a non-clustered unique key, or accept the fragmentation deliberately.

::rfc 9562 6.13 What the standard advises for database keys

::links
- https://learn.microsoft.com/sql/t-sql/data-types/uniqueidentifier-transact-sql | SQL Server: uniqueidentifier | Storage and comparison rules
- https://learn.microsoft.com/sql/t-sql/functions/newsequentialid-transact-sql | SQL Server: NEWSEQUENTIALID | Including the guessability warning
::

::faq
Q: Why do GUIDs sort strangely in SQL Server?
A: uniqueidentifier compares the last group first and the first group last, so index order matches neither the printed value nor creation time.
Q: Is a SQL Server GUID stored in RFC byte order?
A: No. The first three groups are stored little-endian, the last two as written: the mixed-endian layout shared with .NET.
Q: Should I use NEWSEQUENTIALID?
A: Only for internal clustered keys. The documentation says outright that the next value can be guessed, and the sequence can restart from a lower range after Windows restarts.
::
