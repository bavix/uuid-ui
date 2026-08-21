---
title: UUID in MySQL: BINARY(16), UUID_TO_BIN and BIN_TO_UUID | UUIDConv
description: How to store UUIDs in MySQL without wasting space: the BINARY(16) column, the swap flag on UUID_TO_BIN, and why the swap exists at all.
h1: UUIDs in MySQL
tldr: MySQL has no UUID type. Store 16 bytes in BINARY(16) with UUID_TO_BIN, read them back with BIN_TO_UUID, and use the swap flag only for v1 identifiers.
lede: MySQL leaves the storage decision to you, and the default choice, `CHAR(36)`, costs more than twice the space and turns every key comparison into string work. Here is the version that behaves.
cta: uuid - hex
related: uuid-to-hex, uuid-v7, uuid-in-postgresql, uuid-byte-order
priority: 0.8
updated: 2026-08-21
---

::example to=uuid style=hex
lede: What ends up in the column: 32 hex digits, no punctuation.
- 01890a5d-ac96-774b-bcce-b302099a8057 — A v7 — already time-ordered, so the swap flag must stay off
- f81d4fae-7dec-11d0-a765-00a0c91e6bf6 — A v1 — this is the case the swap flag was invented for
::

## The column

```sql
CREATE TABLE orders (
    id BINARY(16) PRIMARY KEY,
    created_at DATETIME(3) NOT NULL
);

INSERT INTO orders (id, created_at)
VALUES (UUID_TO_BIN('01890a5d-ac96-774b-bcce-b302099a8057'), NOW(3));

SELECT BIN_TO_UUID(id) AS id FROM orders;
```

| Column type | Bytes per row | Comparison |
| --- | --- | --- |
| `BINARY(16)` | 16 | memcmp — one pass |
| `CHAR(32)` bare hex | 32 | string, case rules apply |
| `CHAR(36)` canonical | 36 | string, and stores four hyphens per row |
| `VARCHAR(36)` | 37+ | string, plus a length byte |

## The swap flag, and when it helps

`UUID_TO_BIN(u, 1)` moves the first group past the third before storing: the row starts with time-high, then time-mid where it already was, then time-low. For a **v1** identifier that puts the slow-moving bits of the clock first, so consecutive inserts land near each other. MySQL's own example is `6ccd780c-baba-1026-…` stored as `1026baba6ccd780c…`. It is a fix for the v1 field order, not a general optimisation.

::table mysql-swap

::note Apply the flag to a v7 and you destroy the property you wanted: the clock stops leading and the key scatters. Flag 1 is for v1 only, and whichever flag you choose has to be used identically on write and on read.

::rfc 9562 6.13 Database considerations, including this exact reordering idea

## Reading rows by hand

A `BINARY(16)` column prints as unreadable bytes in a console, which is the real cost of the compact form. Either wrap it in `BIN_TO_UUID(id)` on the way out, or keep a generated column alongside it for humans, at the price of the space you just saved.

```sql
ALTER TABLE orders
    ADD COLUMN id_text CHAR(36)
    GENERATED ALWAYS AS (BIN_TO_UUID(id)) VIRTUAL;
```

## MySQL UUID() is a v1

The built-in `UUID()` function returns a version 1 identifier with the node taken from the server, so it embeds a MAC address and does not sort. Generate v7 in the application and pass it in; the database function is only convenient, not correct for a key.

::links
- https://dev.mysql.com/doc/refman/8.4/en/miscellaneous-functions.html#function_uuid-to-bin | MySQL: UUID_TO_BIN and BIN_TO_UUID | Including what the swap flag does
::

::faq
Q: How should I store a UUID in MySQL?
A: BINARY(16) with UUID_TO_BIN on write and BIN_TO_UUID on read. CHAR(36) more than doubles the storage and makes every comparison a string comparison.
Q: What does the second argument of UUID_TO_BIN do?
A: It reorders the timestamp fields so that the slow-moving half of a v1 clock leads. Use it for v1 only: applying it to a v7 removes the time ordering.
Q: Is MySQL UUID() good enough for a primary key?
A: No. It returns a v1 that embeds the server MAC and does not sort. Generate a v7 in the application.
::
