---
title: UUID in MongoDB: BSON subtype 4 vs legacy subtype 3 | UUIDConv
description: How MongoDB stores UUIDs as BSON binary, why subtype 3 is a per-driver minefield, and how to move legacy values to the standard subtype 4.
h1: UUIDs in MongoDB
tldr: MongoDB stores a UUID as BSON binary. Subtype 4 is the standard, big-endian layout; the legacy subtype 3 has a byte order that depends on which driver wrote it.
lede: A UUID in MongoDB is one of the few places where the same value, written by two clients, produces two different documents. The cause is the legacy binary subtype, and the fix is mechanical once you know what to look for.
cta: base64 -
related: uuid-byte-order, uuid-to-base64, uuid-to-bytes, uuid-in-postgresql
priority: 0.7
updated: 2026-08-21
---

::example to=base64
lede: BSON binary prints as base64, which is how a UUID appears in an extended JSON dump.
- 01890a5d-ac96-774b-bcce-b302099a8057 — What a subtype 4 value carries
- f81d4fae-7dec-11d0-a765-00a0c91e6bf6 — Subtype 3 written by the old C# driver would encode different bytes
::

## The two subtypes

| Subtype | Name | Byte order | Use it? |
| --- | --- | --- | --- |
| 4 | UUID | big-endian, as RFC 9562 defines | yes |
| 3 | UUID (legacy) | depends on the driver that wrote it | only to read old data |

The legacy subtype predates any agreement on layout, and the drivers still name the conventions after themselves. `CSHARP_LEGACY` writes the mixed-endian form, `JAVA_LEGACY` reverses each of the two 8-byte halves, and `PYTHON_LEGACY` writes the bytes straight through. All three produce subtype 3, and nothing in the stored value says which of them wrote it.

## How the mismatch shows up

- A query by UUID returns nothing, although the document is visibly there.
- The same logical identifier appears as two distinct binary values in one collection.
- An aggregation groups by UUID and produces double the expected number of buckets.
- An export to JSON shows base64 that does not match the identifier the application prints.

## Moving to subtype 4

Set the driver to the standard representation, then rewrite the affected documents: read each legacy value with the convention that wrote it, decode it to a UUID, and store it back as subtype 4. Do it once, verify the counts, and add a check that no subtype 3 values remain. A mixed collection is worse than either convention alone.

```javascript
// mongosh: find documents still holding a legacy binary UUID
db.orders.find({ id: { $type: "binData" } })
    .toArray()
    .filter(doc => doc.id.sub_type === 3)
    .length;
```

::rfc 9562 4 The byte order subtype 4 follows

## UUID or ObjectId

MongoDB's own `ObjectId` is 12 bytes: a 4-byte timestamp in seconds, a 5-byte value random per process, and a 3-byte counter. The timestamp leads, so ObjectIds sort by creation time. If identifiers never leave MongoDB, it is smaller and simpler. Use a UUID when the same identifier has to exist in other systems too: that is the one property ObjectId cannot give you.

::links
- https://bsonspec.org/spec.html | The BSON specification | Binary subtypes, including 3 and 4
- https://www.mongodb.com/docs/manual/reference/bson-types/ | MongoDB: BSON types | How binary data and ObjectId are stored
::

::faq
Q: What is the difference between BSON subtype 3 and 4?
A: Subtype 4 is the standard big-endian UUID. Subtype 3 is legacy and its byte order depends on which driver wrote the value.
Q: Why does my UUID query return no documents in MongoDB?
A: Almost always a subtype mismatch: the document holds a legacy subtype 3 value written with a different byte order than your driver uses to query.
Q: Should I use UUID or ObjectId in MongoDB?
A: ObjectId if the identifier never leaves MongoDB: 12 bytes, and it sorts. UUID when other systems must name the same entity.
::
