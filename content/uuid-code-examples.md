---
title: UUID code examples: JS, Python, Go, Java, Rust, C# | UUIDConv
description: Generating, parsing and converting UUIDs in eight languages, including the byte-order traps in Python bytes_le and .NET ToByteArray.
h1: UUIDs in eight languages
tldr: Every language generates and parses UUIDs the same way; they differ in what they hand you for the bytes. Python offers two byte orders, .NET defaults to the mixed-endian one, and Java gives you two longs instead.
lede: Reference snippets for the four things people actually do with a UUID: make one, parse one, get its bytes, get its time. The platform-specific traps are marked.
cta: bytes - chex
related: uuid-to-bytes, uuid-byte-order, uuid-to-long, uuid-v7
priority: 0.7
updated: 2026-08-21
---

::example to=bytes style=chex
lede: The byte array these snippets should all produce for the same identifier.
- 01890a5d-ac96-774b-bcce-b302099a8057 — RFC byte order — big-endian, as printed
::

## JavaScript and TypeScript

```javascript
// built in, v4, no dependency
const id = crypto.randomUUID();

// the uuid package, for v7 and for bytes
import { v7, parse, stringify } from "uuid";

const ordered = v7();
const bytes = parse(ordered);        // Uint8Array(16), RFC order
const back = stringify(bytes);
```

`crypto.randomUUID()` exists in browsers and in Node, and only makes v4. It requires a secure context in the browser, which is why it is missing on plain HTTP pages.

## Python

```python
import uuid

id = uuid.uuid4()
parsed = uuid.UUID("01890a5d-ac96-774b-bcce-b302099a8057")

parsed.bytes      # RFC order, use this
parsed.bytes_le   # mixed-endian, for Windows APIs
parsed.int        # the whole 128 bits as one integer
parsed.hex        # 32 digits, no hyphens
```

::note `bytes` and `bytes_le` are different byte arrays for the same identifier. Passing `bytes_le` to something expecting RFC order silently produces a different UUID.

## Go

```go
import "github.com/google/uuid"

id, _ := uuid.NewV7()
parsed, err := uuid.Parse("01890a5d-ac96-774b-bcce-b302099a8057")

b := parsed[:]                  // []byte over the 16, RFC order
back, _ := uuid.FromBytes(b)

parsed.Version()                // 7
parsed.Time()                   // defined for v1, v2, v6 and v7
```

## Java and Kotlin

```java
UUID id = UUID.randomUUID();                 // v4
UUID parsed = UUID.fromString("01890a5d-ac96-774b-bcce-b302099a8057");

long msb = parsed.getMostSignificantBits();  // signed, often negative
long lsb = parsed.getLeastSignificantBits();

ByteBuffer buf = ByteBuffer.allocate(16);
buf.putLong(msb).putLong(lsb);               // RFC order
byte[] bytes = buf.array();
```

Kotlin has its own `kotlin.uuid.Uuid`, and reaches the halves through `toLongs { msb, lsb -> … }` and `Uuid.fromLongs(msb, lsb)`, documented since Kotlin 2.4. The JDK still has no v7 generator, so that comes from a library either way.

## Rust

```rust
use uuid::Uuid;

let id = Uuid::now_v7();
let parsed = Uuid::parse_str("01890a5d-ac96-774b-bcce-b302099a8057")?;

let bytes = parsed.as_bytes();        // &[u8; 16], RFC order
let (hi, lo) = parsed.as_u64_pair();  // unsigned halves
```

## C# and .NET

```csharp
var id = Guid.NewGuid();                       // v4
var v7 = Guid.CreateVersion7();                // .NET 9+
var parsed = Guid.Parse("01890a5d-ac96-774b-bcce-b302099a8057");

byte[] mixed = parsed.ToByteArray();           // mixed-endian!
byte[] rfc = parsed.ToByteArray(bigEndian: true);   // .NET 8+

parsed.ToString("N");   // 32 digits
parsed.ToString("B");   // braces
```

## PHP and SQL

```php
use Ramsey\Uuid\Uuid;

$id = Uuid::uuid7();
$parsed = Uuid::fromString("01890a5d-ac96-774b-bcce-b302099a8057");

$parsed->getBytes();   // 16 bytes, RFC order
$parsed->toString();
```

```sql
-- PostgreSQL 18+
SELECT uuidv7();

-- MySQL: text to 16 bytes and back
SELECT UUID_TO_BIN('01890a5d-ac96-774b-bcce-b302099a8057');
SELECT BIN_TO_UUID(id) FROM orders;
```

## Protobuf, and the wire shape of an identifier

Protobuf has no 128-bit integer, so an identifier travels as two 64-bit fields. `bavix/apis` declares it once and every service in that family speaks it:

```protobuf
message UUID {
    int64 high = 1;
    int64 low = 2;
}
```

```go
import "github.com/bavix/apis/pkg/uuidconv"

high, low := uuidconv.UUID2DoubleInt(id)   // int64, int64
back := uuidconv.DoubleInt2UUID(high, low)
```

Those two numbers are the `signed` reading in this converter: the halves reinterpreted least significant byte first, which is what an `unsafe.Pointer` cast gives on any little-endian machine. Eighteen bytes on the wire against thirty-six for the text form, and no parsing on the way in.

::links
- https://github.com/bavix/apis/blob/master/bavix/api/v1/uuid.proto | bavix/apis — uuid.proto | The message definition
- https://github.com/bavix/apis/blob/master/pkg/uuidconv/uuid.go | bavix/apis — pkg/uuidconv | The Go conversion, both directions
- https://github.com/bavix/apis | bavix/apis | The shared protobuf definitions
::

## The three traps, in one place

| Platform | Trap |
| --- | --- |
| Python | `bytes_le` is mixed-endian; `bytes` is the RFC order |
| .NET before 8 | `ToByteArray()` is mixed-endian and has no big-endian overload |
| Java | `getMostSignificantBits` is signed, so the high half is usually negative |

::rfc 9562 4 The byte order every one of these should agree on

::rfc 9562 5.7 The v7 layout the generators above produce

::faq
Q: How do I generate a UUID v7?
A: uuid.v7() in JavaScript, uuid.NewV7() in Go, Uuid::now_v7() in Rust, Guid.CreateVersion7() in .NET 9, Uuid::uuid7() with ramsey/uuid, and uuidv7() in PostgreSQL 18.
Q: What is the difference between bytes and bytes_le in Python?
A: bytes is the RFC big-endian order; bytes_le reverses the first three fields for Windows APIs. They are different arrays for the same identifier.
Q: Does crypto.randomUUID work everywhere?
A: In Node, and in browsers only on a secure context; an HTTP page does not have it. It produces a v4 and nothing else.
::
