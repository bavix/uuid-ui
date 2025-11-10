import assert from 'node:assert';
import test from 'node:test';
import { isValid, ulidToUuid, uuidToUlid } from "../src/uuid-ulid.js";

test('ULID validation', (t) => {
  assert.strictEqual(isValid('01ARZ3NDEKSGZSAA0XWM0X584T'), true);
  assert.strictEqual(isValid('01ARZ3NDEKSGZSAA0XWM0X584X'), true);
  assert.strictEqual(isValid('I1ARZ3NDEKSGZSAA0XWM0X584T'), false); // invalid first char
  assert.strictEqual(isValid('01ARZ3NDEKSGZSA A0XWM0X584T'), false); // space not allowed
  assert.strictEqual(isValid('not-a-valid-ulid'), false);
  assert.strictEqual(isValid(''), false);
  assert.strictEqual(isValid(null), false);
  assert.strictEqual(isValid(undefined), false);
});

test('ulidToUuid conversion', (t) => {
  assert.strictEqual(
    ulidToUuid('00000000000000000000000000'),
    '00000000-0000-0000-0000-000000000000'
  );

  assert.strictEqual(
    ulidToUuid('00000000000000000000000001'),
    '00000000-0000-0000-0000-000000000001'
  );

  assert.strictEqual(
    ulidToUuid('7ZZZZZZZZZZZZZZZZZZZZZZZZZ'),
    'ffffffff-ffff-ffff-ffff-ffffffffffff'
  );

  assert.strictEqual(
    ulidToUuid('7ZZZZZZZZZZZZZZZZZZZZZZZZZ').length,
    36
  );
});

test('uuidToUlid conversion', (t) => {
  assert.strictEqual(
    uuidToUlid('00000000-0000-0000-0000-000000000000'),
    '00000000000000000000000000'
  );

  assert.strictEqual(
    uuidToUlid('00000000-0000-0000-0000-000000000001'),
    '00000000000000000000000001'
  );

  assert.strictEqual(
    uuidToUlid('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'),
    '7ZZZZZZZZZZZZZZZZZZZZZZZZZ'
  );

  assert.strictEqual(
    uuidToUlid('0c5b2444-70a0-4932-980c-b4dc0d3f02b5').length,
    26
  );
});

test('round-trip: uuid -> ulid -> uuid', (t) => {
  const uuid = '0c5b2444-70a0-4932-980c-b4dc0d3f02b5';
  const ulid = uuidToUlid(uuid);
  const convertedBack = ulidToUuid(ulid);
  assert.strictEqual(convertedBack, uuid.toLowerCase());
});

test('round-trip: ulid -> uuid -> ulid', (t) => {
  const ulid = '01HKT2YXQ09WJXG1Y7Y6JR120V';
  const uuid = ulidToUuid(ulid);
  const convertedBack = uuidToUlid(uuid);
  assert.strictEqual(convertedBack, ulid.toUpperCase());
});
