---
title: UUID formats: plain, hex, braces and urn:uuid | UUIDConv
description: Every way the same UUID gets written: canonical, 32 bare hex digits, braced, urn:uuid and capitals, with the .NET N/D/B/P/X names and which system expects which.
h1: Every way to write the same UUID
tldr: The 128 bits never change; the punctuation does. Canonical, bare hex, braces, urn:uuid and upper case are five spellings of one identifier, and comparing two of them as strings is a bug.
lede: Half the identifier bugs that reach production are spelling mismatches: a braced GUID from a registry export compared with a canonical one from an API. This page lists every form the tool reads and writes, and says who expects each.
cta: uuid - braces
related: uuid-to-hex, uuid-validation, uuid-byte-order, uuid-to-bytes
priority: 0.7
updated: 2026-08-21
---

::example to=uuid style=braces
lede: The braced form, the one the Windows registry and COM write.
- f81d4fae-7dec-11d0-a765-00a0c91e6bf6 — .NET calls this format B
- 01890a5d-ac96-774b-bcce-b302099a8057 — A v7 — punctuation does not touch the version nibble
::

## The five spellings

::table spellings f81d4fae-7dec-11d0-a765-00a0c91e6bf6 "The same identifier"

The converter reads all of them, in any case, and writes whichever you pick. Nothing in this table changes a single bit.

::rfc 9562 4 The text form the standard defines, and what a reader must accept

## The .NET format letters

| Letter | Looks like | Same as |
| --- | --- | --- |
| N | 32 digits, no punctuation | the hex spelling above |
| D | 8-4-4-4-12 with hyphens | the canonical spelling |
| B | hyphenated, in braces | the braces spelling |
| P | hyphenated, in parentheses | a variant of braces this tool does not write |
| X | a C struct literal: `{0x…,0x…,0x…,{0x…}}` | four fields, not a text form |

The X format is the odd one: it is a C initialiser for the Windows `GUID` struct, and its first three fields are little-endian. That makes it a byte-order question rather than a spelling question.

## urn:uuid, and when a UUID must be a URI

XML, RDF and other systems that identify things by URI need a scheme in front. `urn:uuid:` was registered for exactly that, so `urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6` is a valid URN naming the same identifier. Strip the prefix and it is an ordinary UUID again.

::rfc 4122 3 Where the urn:uuid namespace was first registered; RFC 9562 section 7 points that registration at itself

## Case, and the comparison bug

RFC 9562 writes UUIDs in lower case and requires readers to accept both cases. Windows writes capitals. Two spellings of one identifier are not equal as strings, so normalise on input, to lower case and without hyphens if you store bare hex, and compare the normalised form. A database that stores both forms in the same column will eventually return duplicate rows for one entity.

## Which to store

| Column | Bytes per row | Readable in a query result |
| --- | --- | --- |
| native `uuid` type | 16 | yes, the driver formats it |
| `BINARY(16)` | 16 | no, unless you wrap it |
| `CHAR(32)` bare hex | 32 | yes |
| `CHAR(36)` canonical | 36 | yes |
| braced or urn form | 38 or 45 | yes, and nobody thanks you |

::faq
Q: Is a braced GUID a different value?
A: No. Braces, hyphens, the urn: prefix and letter case are all punctuation. The identifier is the 32 hex digits.
Q: What is the .NET N format?
A: 32 hex digits with no hyphens, the same thing as the hex spelling in the table above.
Q: Should I store UUIDs upper or lower case?
A: Lower case, and normalise on the way in. The standard writes lower case, and mixed case in one column produces duplicate rows for one entity.
::
