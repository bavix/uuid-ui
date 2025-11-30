import assert from 'node:assert';
import test from 'node:test';
import { GistSync } from '../src/gist-sync.js';

test('GistSync.serializeData - serializes items and favorites correctly', () => {
    const gistSync = new GistSync('test-token');
    
    const items = [
        { input: '0;1', output: 'uuid1', info: 'comment1' },
        { input: 'uuid2', output: '0;2', info: '' }
    ];
    
    const favorites = {
        'myList': [
            { input: 'uuid3', output: '0;3', info: 'fav comment' }
        ]
    };
    
    const result = gistSync.serializeData(items, favorites);
    
    assert.strictEqual(result.version, 1);
    assert.ok(result.timestamp);
    assert.strictEqual(result.items.length, 2);
    assert.strictEqual(result.items[0].input, '0;1');
    assert.strictEqual(result.items[0].output, 'uuid1');
    assert.strictEqual(result.items[0].info, 'comment1');
    assert.strictEqual(result.items[1].input, 'uuid2');
    assert.strictEqual(result.items[1].output, '0;2');
    assert.strictEqual(result.items[1].info, '');
    assert.ok(result.favorites.myList);
    assert.strictEqual(result.favorites.myList.length, 1);
    assert.strictEqual(result.favorites.myList[0].input, 'uuid3');
});

test('GistSync.serializeData - handles empty data', () => {
    const gistSync = new GistSync('test-token');
    
    const result = gistSync.serializeData([], {});
    
    assert.strictEqual(result.version, 1);
    assert.ok(result.timestamp);
    assert.strictEqual(result.items.length, 0);
    assert.deepStrictEqual(result.favorites, {});
});

test('GistSync.serializeData - limits items to 100', () => {
    const gistSync = new GistSync('test-token');
    
    const items = Array(150).fill(null).map((_, i) => ({
        input: `input${i}`,
        output: `output${i}`,
        info: ''
    }));
    
    const result = gistSync.serializeData(items, {});
    
    assert.strictEqual(result.items.length, 100);
});

test('GistSync.getHeaders - returns correct headers', () => {
    const gistSync = new GistSync('test-token-123');
    
    const headers = gistSync.getHeaders();
    
    assert.strictEqual(headers['Authorization'], 'Bearer test-token-123');
    assert.strictEqual(headers['Accept'], 'application/vnd.github+json');
    assert.strictEqual(headers['Content-Type'], 'application/json');
    assert.strictEqual(headers['X-GitHub-Api-Version'], '2022-11-28');
});
