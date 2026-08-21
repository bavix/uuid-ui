---
title: Short UUID: Base64 in 22 characters | UUIDConv
description: Convert a UUID or GUID to Base64 and back, in the standard alphabet or the URL-safe one, and see how 36 characters become 22 without losing a bit.
h1: UUID to Base64, and the short forms
tldr: Base64 of the 16 bytes is 24 characters with padding and 22 without. The URL-safe alphabet swaps + and / for - and _, which is what makes the short form usable in a path or a query string.
lede: Base64 is the cheapest way to make a UUID shorter without inventing a scheme: the same 128 bits, 22 characters instead of 36. This page converts both ways, in both alphabets, and covers the two things that bite: padding and sort order.
cta: base64 - url
related: uuid-to-bytes, uuid-to-hex, ulid, uuid-in-mongodb
priority: 0.8
updated: 2026-08-21
---

::example to=base64 style=url
lede: The URL-safe spelling with the padding dropped: 22 characters, safe in a path, a query string or a filename.
- f81d4fae-7dec-11d0-a765-00a0c91e6bf6 — The standard alphabet would start with a plus sign here
- 018f3c00-7c00-7000-8000-00a0c91e6bf6 — A v7
- 00000000-0000-0000-0000-000000000000 — Nil UUID
::

## Why 22 characters and not 24

Base64 encodes three bytes into four characters. Sixteen bytes is five whole groups plus one byte left over, so the encoder emits 22 characters and then pads with `==` to reach a multiple of four. The padding carries no information for a fixed-length input: everyone knows a UUID is 16 bytes, so the two equals signs can be dropped and re-added by the decoder.

::rfc 4648 4 The standard alphabet and the padding rule

::rfc 4648 5 The URL and filename safe alphabet: - and _ instead of + and /

## Which alphabet to use

| Alphabet | Characters 62 and 63 | Safe in a URL? |
| --- | --- | --- |
| standard | `+` and `/` | No: both need percent-encoding, and `/` splits a path |
| url-safe | `-` and `_` | Yes, and it survives filenames too |

::note Pick one and write it into the schema. A value that round-trips through the wrong alphabet decodes into different bytes, and 22 characters of anything looks equally plausible in a log.

## Base64 does not preserve sort order

The Base64 alphabet runs A-Z, a-z, 0-9, which is not the order the underlying bytes compare in. Two v7 identifiers made a second apart sort correctly as bytes and as text, but not as Base64. If a time-ordered key is the point, keep the bytes or the hex form; if all you want is a short opaque handle, Base64 is fine.

```javascript
import { parse, stringify } from "uuid";

const bytes = parse("f81d4fae-7dec-11d0-a765-00a0c91e6bf6");

const short = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const back = stringify(Uint8Array.from(
    atob(short.replace(/-/g, "+").replace(/_/g, "/")),
    c => c.charCodeAt(0),
));
```

## Every alphabet, and what it costs

Base64 is one row in a table people usually meet one row at a time.

| Encoding | Length | Case sensitive | Sorts like the bytes | Safe in a URL |
| --- | --- | --- | --- | --- |
| canonical UUID | 36 | no | yes | yes |
| hex, no hyphens | 32 | no | yes | yes |
| Crockford base32, as a ULID prints | 26 | no | yes | yes |
| base64url | 22 | yes | no | yes |
| base64 standard | 24 with padding | yes | no | no, + and / need escaping |
| base58 | 22, shorter when the value starts with zero bytes | yes | no | yes |

Base58 lands at the same 22 characters and drops 0, O, I and l, which makes a value survivable when it is read aloud or copied by hand. The cost is an encoder that needs big-integer arithmetic rather than bit shifting, and thinner support in standard libraries. Crockford base32 is the usual compromise when people have to handle the value: four characters longer than base64url, case-insensitive, and it keeps byte order.

## What not to do

- Truncating. Dropping bits does not shorten an identifier, it creates a different one with a real collision probability.
- A private alphabet nobody documents. Six months later nobody can decode the values in the logs.
- Storing the short form as the key. Store the bytes; render the short form.

::faq
Q: Why is my Base64 UUID 24 characters?
A: It still carries the == padding. Sixteen bytes encode to 22 significant characters; the padding only exists to reach a multiple of four and can be dropped for a fixed-length value.
Q: Is Base64 of a UUID safe in a URL?
A: Only in the URL-safe alphabet. The standard one uses + and /, which have to be percent-encoded and which break paths.
Q: Can I sort by the Base64 form?
A: No. The alphabet ordering does not match byte ordering, so time-ordered v7 identifiers stop sorting by time once encoded.
Q: What is a 22 character UUID?
A: The same 16 bytes in base64url without padding. Nothing is lost; it is a shorter spelling of the same value.
Q: Can I shorten a UUID by cutting characters off?
A: No. Truncation discards bits and creates a new, shorter identifier with a real chance of collision. Re-encode instead.
::
