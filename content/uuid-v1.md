---
title: UUID v1: a clock, a MAC address, and what it leaks | UUIDConv
description: How a version 1 UUID stores time as 100-nanosecond ticks since 1582, why the node field is often a real MAC address, and why v1 identifiers do not sort by time.
h1: UUID version 1
tldr: A v1 holds a 60-bit clock counting 100-nanosecond ticks since 1582-10-15, a clock sequence, and a 48-bit node that is frequently the machine's real MAC address. It does not sort by time, because the high bits of the clock come last.
lede: Version 1 is the oldest layout still in wide use, and the one that reveals the most. This page decodes what it carries, explains the two problems that pushed the standard to add v6 and v7, and shows how to read a v1 you have been handed.
cta: none
related: uuid-v6, uuid-timestamp, uuid-versions, uuid-bit-layout
priority: 0.7
updated: 2026-08-21
---

::example kind=timestamp column="Decoded time (UTC)"
lede: The clock is split across three fields, so decoding it means reassembling them before subtracting the epoch offset.
- f81d4fae-7dec-11d0-a765-00a0c91e6bf6 — The v1 from the original RFC examples
- f95bc000-6369-11d0-8abc-00a0c91e6bf6 — A v1 whose clock lands exactly on 1997-01-01
::

## What a v1 is made of

::specimen f81d4fae-7dec-11d0-a765-00a0c91e6bf6 The clock is split into three pieces and the high part comes last, which is why a v1 does not sort.

::rfc 9562 5.1 The v1 layout

## The 1582 epoch

The clock counts 100-nanosecond intervals from 1582-10-15, the day the Gregorian calendar began. To reach Unix time, divide the ticks by 10 000 and subtract 12 219 292 800 000 milliseconds. The precision is theoretical: most implementations read a millisecond clock and pad, or keep a counter to avoid handing out the same tick twice.

::rfc 9562 6.1 What the standard says a timestamp may be relied on for

## Why a v1 does not sort by time

The clock is written low bits first: `time_low` occupies the first group, `time_mid` the second, and `time_high` sits at the end of the third. Comparing two v1 identifiers as text or as bytes therefore compares the fastest-moving part of the clock first, which is close to comparing noise. Version 6 fixes this by writing the same clock in reading order, and version 7 replaces it with plain Unix milliseconds.

::rfc 9562 6.11 Sorting, and why the field order is what matters

## The node field usually is a MAC address

The last 48 bits are meant to identify the machine, and the original method was to use its MAC address. That means a v1 can identify the host that made it and, with the timestamp beside it, when. If the multicast bit is set (the low bit of the first node byte), the node is random rather than a real address; that is the standard's escape hatch.

::rfc 9562 6.10 Generating identifiers that do not identify the host

## What clock_seq is for

If the machine clock jumps backwards, after an NTP correction or a restored snapshot, the same tick can be handed out twice. The clock sequence is bumped whenever that is detected, so identifiers made in the repeated window still differ. It is 14 bits, and it is why a v1 generator wants persistent state.

::rfc 9562 6.3 The state a time-based generator is expected to keep

## Moving off v1

Existing v1 identifiers can stay: they are valid and decodable. For new ones, v6 keeps the same clock while sorting correctly, and v7 drops the 1582 epoch and the node field entirely. Converting a v1 to a v6 is a field reordering rather than a new identifier, but the result is still a different value: a migration, not a cast.

::faq
Q: Does a UUID v1 contain a MAC address?
A: Often, yes: the 48-bit node field was originally the machine MAC. If the multicast bit is set, the node is random instead.
Q: What date does a v1 timestamp count from?
A: 1582-10-15, in 100-nanosecond ticks. Divide by 10 000 and subtract 12 219 292 800 000 to get Unix milliseconds.
Q: Why do v1 identifiers not sort in creation order?
A: The clock is stored low bits first, so string and byte comparison see the fastest-changing part of it first. v6 stores the same clock in order.
::
