import assert from 'node:assert';
import test from 'node:test';
import { readBestScores, readBestTimes, writeBestScore, writeBestTime } from '../src/records.js';

function storageOf(initial) {
    const store = new Map(Object.entries(initial ?? {}));

    return {
        getItem: k => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, v),
    };
}

test('the first finish becomes the record', (t) => {
    const storage = storageOf();

    assert.strictEqual(writeBestTime('Small', 42, storage), 42);
    assert.deepStrictEqual(readBestTimes(storage), { Small: 42 });
});

test('a slower game leaves the record alone', (t) => {
    const storage = storageOf();

    writeBestTime('Small', 42, storage);
    assert.strictEqual(writeBestTime('Small', 90, storage), 42);
    assert.deepStrictEqual(readBestTimes(storage), { Small: 42 });
});

test('a faster game takes the record', (t) => {
    const storage = storageOf();

    writeBestTime('Small', 42, storage);
    assert.strictEqual(writeBestTime('Small', 30, storage), 30);
    assert.deepStrictEqual(readBestTimes(storage), { Small: 30 });
});

test('each board size keeps its own record', (t) => {
    const storage = storageOf();

    writeBestTime('Small', 30, storage);
    writeBestTime('Large', 300, storage);

    assert.deepStrictEqual(readBestTimes(storage), { Small: 30, Large: 300 });
});

test('nonsense in storage reads as no records', (t) => {
    assert.deepStrictEqual(readBestTimes(storageOf({ uuidMinesBest: 'not json' })), {});
    assert.deepStrictEqual(readBestTimes(storageOf({ uuidMinesBest: '[1,2]' })), {});
    assert.deepStrictEqual(readBestTimes(storageOf({ uuidMinesBest: 'null' })), {});
    // one bad entry must not take the good ones with it
    assert.deepStrictEqual(
        readBestTimes(storageOf({ uuidMinesBest: '{"Small":30,"Large":"fast","Medium":-4}' })),
        { Small: 30 },
    );
});

test('a storage that refuses to write still reports the time', (t) => {
    const storage = {
        getItem: () => null,
        setItem: () => { throw new Error('quota'); },
    };

    assert.strictEqual(writeBestTime('Small', 12, storage), 12);
});

test('a score record keeps the larger number', (t) => {
    const storage = storageOf();

    assert.strictEqual(writeBestScore('2048', 1200, storage), 1200);
    assert.strictEqual(writeBestScore('2048', 800, storage), 1200);
    assert.strictEqual(writeBestScore('2048', 4096, storage), 4096);
    assert.deepStrictEqual(readBestScores(storage), { '2048': 4096 });
});

test('scores and times live in different stores', (t) => {
    const storage = storageOf();

    writeBestTime('Small', 30, storage);
    writeBestScore('2048', 30, storage);

    assert.deepStrictEqual(readBestTimes(storage), { Small: 30 });
    assert.deepStrictEqual(readBestScores(storage), { '2048': 30 });
});
