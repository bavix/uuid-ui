---
title: Convert a list of UUIDs at once | UUIDConv
description: Paste a whole column of identifiers and convert every line in one go, mixing formats freely, with comments kept and the results held in a searchable history.
h1: Converting a column of identifiers
tldr: The tool works line by line. Paste a hundred identifiers in whatever formats they happen to be in, pick one target, and every line is converted at once; anything unreadable is reported rather than dropped.
lede: A single conversion is the demo. The reason to keep the tab open is the column you copied out of a query result, a log or a spreadsheet, where half the lines are one format and half are another.
cta: uuid
related: uuid-generator, uuid-formats, uuid-validation, uuid-to-bytes
priority: 0.7
updated: 2026-08-21
---

::widget bulk

::example to=uuid
lede: Four lines in four different formats, all read as the same kind of thing and written out as canonical UUIDs.
- f81d4fae7dec11d0a76500a0c91e6bf6 — bare hex, as a database column holds it
- {01890a5d-ac96-774b-bcce-b302099a8057} — braced, as Windows writes it
- AYkKXayWd0u8zrMCCZqAVw== — Base64, as BSON prints it
- 7R3N7TWZFC278AES80M34HWTZP — a ULID
::

## Mixed input is the normal case

Every line is read on its own, so a list can hold canonical UUIDs, bare hex, braced Windows values, base64, byte arrays, ULIDs and high/low pairs at the same time. The reader recognises each and converts it to the one format you chose. That is what makes the tool useful on the output of a query somebody else wrote.

## Comments survive the trip

A `#` opens a comment, and so does `//` at the start of a line or after whitespace. The text after it is kept next to the result instead of being thrown away, which means a list can carry its own labels:

```text
f81d4fae-7dec-11d0-a765-00a0c91e6bf6   # the row that broke
01890a5d-ac96-774b-bcce-b302099a8057   // fixture, do not delete
```

::note `//` only opens a comment at a line start or after whitespace, because standard base64 uses `/` as a payload character: roughly one identifier in 250 encodes to something containing `//`.

## Nothing disappears quietly

A line the reader cannot make sense of is reported, not skipped, and a line that is already in the target format says so instead of pretending to convert. That matters when the list is long enough that you would not notice two missing rows.

## Where the results go

Converted lines land in a history you can search, tag and keep across reloads, because it lives in the browser's own storage. Nothing is uploaded: the whole pipeline runs in the tab, which is the same reason the pages of this reference can compute their examples in front of you.

::rfc 9562 4 The text forms a reader has to accept, which is why mixed input works at all

::faq
Q: Can I convert many UUIDs at once?
A: Yes. One identifier per line, any mix of formats, one target format for the batch.
Q: What happens to lines that are not identifiers?
A: They are reported as unread rather than dropped, so a long list does not lose rows silently.
Q: Are my pasted identifiers uploaded anywhere?
A: No. Every line is parsed and converted in the browser, and the history stays in the browser's own storage.
::
