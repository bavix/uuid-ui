---
title: UUID namespaces: DNS, URL, OID and X.500 | UUIDConv
description: The four namespace IDs RFC 9562 registers for name-based UUIDs, what each one means, and how to define your own namespace without colliding with anyone.
h1: Namespaces for name-based UUIDs
tldr: A name-based UUID needs a namespace: a UUID that says which kind of name you are hashing. Four are registered (DNS, URL, OID and X.500), and any UUID of your own works just as well.
lede: The namespace is what keeps the host name example.com and the URL https://example.com from colliding into one identifier. This page lists the registered four, explains what belongs in each, and covers rolling your own.
cta: uuid -
related: uuid-v5, uuid-v3, uuid-versions, what-is-a-uuid
priority: 0.6
updated: 2026-08-21
---

::example kind=detect column="What the converter reads"
lede: The namespace IDs are themselves version 1 UUIDs, and the converter still reads the clock in them.
- 6ba7b810-9dad-11d1-80b4-00c04fd430c8 — The DNS namespace
- 6ba7b814-9dad-11d1-80b4-00c04fd430c8 — The X.500 namespace, differing in the 8th hex digit
::

## The four registered namespaces

::table namespaces

They differ by a single hex digit, which is a common source of copy-paste bugs: DNS ends `810`, URL `811`, OID `812` and X.500 `814`. There is no `813`.

All four are version 1 identifiers, and their clocks carry the same instant: 1998-02-04T22:13:53.151Z. They were generated in one sitting a quarter of a century ago and have not moved since, which is exactly what a namespace constant should do.

::rfc 9562 6.6 Namespace ID usage and allocation

::rfc 9562 7.2 The IANA registry the namespaces live in

## Why a namespace exists at all

Without it, every name-based identifier would live in one flat space, and two systems hashing unrelated strings would eventually agree by accident. The namespace prefixes the hash input, so `example.com` as a host and `example.com` as a tenant slug in your own namespace derive to different identifiers.

## Defining your own

Generate one v4, write it into a constant, and never change it. That constant is now the root of a private identifier space: v5 of it and a tenant slug is stable forever, and nobody else can land in your space by accident. Changing it later invalidates every identifier derived beneath it, so treat it like a schema, not like configuration.

```javascript
import { v5 } from "uuid";

// generated once, then frozen
const TENANTS = "3f2b7e9a-9a2f-4a1a-9f37-1c4a2ee1f5b3";

const id = v5("acme", TENANTS);   // the same every time, everywhere
```

## Nesting namespaces

A derived UUID is a perfectly good namespace for the next level: v5 of your root and a tenant gives a tenant namespace, and v5 of that and a resource name gives a resource identifier. The chain stays deterministic all the way down, which is how content-addressed hierarchies get built without a registry.

::rfc 9562 6.5 What the standard requires of the derivation at every level

::faq
Q: What are the four standard UUID namespaces?
A: DNS 6ba7b810-9dad-11d1-80b4-00c04fd430c8, URL …811…, OID …812… and X.500 …814…. They differ by one hex digit and there is no …813….
Q: Can I invent my own namespace UUID?
A: Yes, any UUID works. Generate a v4 once, freeze it as a constant, and treat changing it as a breaking schema change.
Q: Does the namespace need to be secret?
A: It cannot be. Namespaces are published constants, and a name-based UUID is guessable whenever the name is.
::
