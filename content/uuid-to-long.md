---
title: UUID to two 64-bit longs (MSB/LSB) — converter | UUIDConv
description: Convert a UUID into a high/low pair of 64-bit integers, the shape Java, Kotlin, Kafka and Rust use. Signed and unsigned readings, and why the number comes out negative.
h1: UUID to a high/low 64-bit pair
tldr: A UUID is two 64-bit halves. Java prints them signed, which is why getMostSignificantBits often returns a negative number. The bits are unchanged; only the sign convention differs.
lede: A 128-bit identifier does not fit in a 64-bit integer, so every language that stores one as integers stores two: the high half and the low half. This page converts between the two representations and spells out the two things that break most often: the sign and the byte order.
cta: high-low unsigned
related: uuid-to-words, uuid-byte-order, uuid-to-bytes, uuid-code-examples
priority: 0.8
updated: 2026-08-21
---

::example to=high-low int=unsigned
lede: The unsigned reading is the plain big-endian value of each half: the high word is the first eight bytes of the identifier, read left to right.
- f81d4fae-7dec-11d0-a765-00a0c91e6bf6 — The v1 from the original RFC examples
- 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 — A v4
- 00000000-0000-0000-0000-000000000000 — Nil UUID: both halves zero
- ffffffff-ffff-ffff-ffff-ffffffffffff — Max UUID: both halves at 2^64 - 1
::

## Why getMostSignificantBits returns a negative number

Java has no unsigned 64-bit type. `UUID#getMostSignificantBits` hands back the same bits as the unsigned reading above, printed as a signed `long`, so any identifier whose first hex digit is 8 or higher prints negative. Nothing is lost: subtract 2^64 from the unsigned value when it is 2^63 or more, and you have Java's number.

| UUID | Unsigned high | Java getMostSignificantBits |
| --- | --- | --- |
| f81d4fae-7dec-11d0-a765-00a0c91e6bf6 | 17878533706586264016 | -568210367123287600 |
| 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 | 890345227701733682 | 890345227701733682 |

The second row is below 2^63, so both readings agree. That is the whole of the mystery.

## The two readings this tool offers

The `unsigned` reading takes each half big-endian, exactly as the identifier is written: the high word of f81d4fae-7dec-11d0-… is 0xf81d4fae7dec11d0. The `signed` reading takes each half little-endian and prints it as a signed integer. That is the shape a little-endian machine gives when it reinterprets the bytes in place, as `ByteBuffer` in `LITTLE_ENDIAN` order or `BitConverter.ToInt64` do.

| Reading | Byte order inside each half | Where you meet it |
| --- | --- | --- |
| unsigned | big-endian | Java and Kotlin bit patterns, Kafka, protobuf fixed64 pairs, `Uuid::as_u64_pair` in Rust |
| signed | little-endian | byte buffers reinterpreted in place on a little-endian machine |

::note The reading is not a display setting. Write a pair with one reading and read it back with the other, and you get a different identifier rather than an error: the unsigned pair above comes back as `d011ec7d-ae4f-1df8-f66b-1ec9a00065a7` when read as signed. Whichever you pick, write it down next to the schema.

## The same pair in each language

| Language | Split | Rebuild |
| --- | --- | --- |
| Java | `uuid.getMostSignificantBits()` / `getLeastSignificantBits()` | `new UUID(msb, lsb)` |
| Kotlin | `uuid.toLongs { msb, lsb -> … }` | `Uuid.fromLongs(msb, lsb)` |
| Rust | `uuid.as_u64_pair()` | `Uuid::from_u64_pair(hi, lo)` |
| Kafka | `Uuid#getMostSignificantBits` | `new Uuid(msb, lsb)` |
| Go | `binary.BigEndian.Uint64(u[:8])` | `binary.BigEndian.PutUint64(u[:8], hi)` |
| C# | `BitConverter.ToUInt64(bytes, 0)` | `new Guid(bytes)` |

```java
UUID id = UUID.fromString("f81d4fae-7dec-11d0-a765-00a0c91e6bf6");

long msb = id.getMostSignificantBits();   // -568210367123287600
long lsb = id.getLeastSignificantBits();  // -6384696206158828554

// the unsigned reading of the same bits
String hi = Long.toUnsignedString(msb);   // 17878533706586264016

UUID back = new UUID(msb, lsb);           // f81d4fae-7dec-11d0-a765-00a0c91e6bf6
```

## The pair as a protobuf message

A 128-bit identifier has no home in protobuf: there is no `uint128`, and `bytes` costs a length prefix and loses fixed width. Two 64-bit fields fit exactly, which is what `bavix/apis` declares for the whole API surface.

```protobuf
syntax = "proto3";

package bavix.api.v1;

option go_package = "github.com/bavix/apis/pkg/bavix/api/v1";

// UUID is a message that represents a UUID.
//
// A UUID is composed of two 64-bit values, each representing a part of the UUID.
// The high part is stored in the high field, and the low part is stored in the
// low field.
message UUID {
    // The high part of the UUID.
    int64 high = 1;
    // The low part of the UUID.
    int64 low = 2;
}
```

Note the type: `int64`, not `uint64`. Protobuf has both, and the choice here follows what Go hands you, which is the reading below.

## The reading that message carries

The reference implementation reinterprets the sixteen bytes in place, eight at a time:

```go
func UUID2DoubleInt(v uuid.UUID) (int64, int64) {
	return *(*int64)(unsafe.Pointer(&v[0])), *(*int64)(unsafe.Pointer(&v[8]))
}

func DoubleInt2UUID(highValue int64, lowValue int64) uuid.UUID {
	var uuidValue uuid.UUID

	*(*int64)(unsafe.Pointer(&uuidValue[0])) = highValue
	*(*int64)(unsafe.Pointer(&uuidValue[8])) = lowValue

	return uuidValue
}
```

On a little-endian machine, which is every amd64 and arm64 server, that reinterpretation reads each half **least significant byte first**. It is the `signed` reading in the converter, so the numbers on this page and the numbers that message carries are the same numbers.

| UUID | high (signed) | low (signed) |
| --- | --- | --- |
| f81d4fae-7dec-11d0-a765-00a0c91e6bf6 | -3453719414676972040 | -690424266549598809 |
| 01890a5d-ac96-774b-bcce-b302099a8057 | 5437980742112676097 | 6305208841809415868 |
| 0c5b2444-70a0-4932-980c-b4dc0d3f02b5 | 3623603779236289292 | -5403687274121261928 |

::note The one caveat is in the word `unsafe`: the layout follows the machine, not the standard. Run that code on a big-endian machine and the same identifier produces a different pair: the big-endian one, which is what this converter calls `unsigned` once the sign is accounted for. Everything in production today is little-endian, so this is a portability note, not a bug report.

::links
- https://github.com/bavix/apis/blob/master/bavix/api/v1/uuid.proto | bavix/apis — bavix/api/v1/uuid.proto | The message above, in full
- https://github.com/bavix/apis/blob/master/pkg/uuidconv/uuid.go | bavix/apis — pkg/uuidconv/uuid.go | UUID2DoubleInt and DoubleInt2UUID, the signed reading
- https://github.com/bavix/apis | bavix/apis | The protobuf definitions these services share
::

## Why store a UUID as two longs at all

Two `bigint` columns beat a 36-character string on both storage and comparison, and a protobuf message with two `fixed64` fields is 18 bytes on the wire against 36 for the text. The cost is that the identifier stops being readable, and that every service touching it has to agree on the byte order and on the sign convention. Write both down where the schema lives.

::rfc 9562 4.1 The variant bits live in the low half, which is why the low word rarely looks random

::rfc 9562 6.13 What the standard says about storing UUIDs in a database

::faq
Q: Why does getMostSignificantBits return a negative number?
A: Java prints a 64-bit value as a signed long, and the high half of most UUIDs exceeds 2^63. The bits are correct; Long.toUnsignedString gives the same value without the sign.
Q: Can I rebuild the UUID from the two numbers?
A: Yes, with the same reading you wrote them in. Read the unsigned pair of f81d4fae-7dec-11d0-a765-00a0c91e6bf6 as signed and you get d011ec7d-ae4f-1df8-f66b-1ec9a00065a7: a different identifier, and nothing warns you. In code, new UUID(msb, lsb) in Java and Uuid.fromLongs in Kotlin round-trip their own halves.
Q: Is the high half the first part of the printed UUID?
A: In the unsigned reading, yes: the high word is the first eight bytes, which is everything up to and including the third group of hex digits.
::
