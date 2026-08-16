'use strict';

import {bytesToUuid, uuidToBytes} from "./uuid-bytes.js";

function toBigIntBytes(input) {
    const bytes = uuidToBytes(input)
    if (bytes === null) {
        return null
    }

    return bytes.map(i => BigInt(i))
}

function toBigInt(value) {
    try {
        return BigInt(value)
    } catch (e) {
        return null
    }
}

export function uuidToInts(input) {
    const v = toBigIntBytes(input)
    if (v === null) {
        return null
    }

    const high = BigInt(v[0] | v[1] << BigInt(8) | v[2] << BigInt(16) | v[3] << BigInt(24) |
        v[4] << BigInt(32) | v[5] << BigInt(40) | v[6] << BigInt(48) | v[7] << BigInt(56))

    const low = BigInt(v[8] | v[9] << BigInt(8) | v[10] << BigInt(16) | v[11] << BigInt(24) |
        v[12] << BigInt(32) | v[13] << BigInt(40) | v[14] << BigInt(48) | v[15] << BigInt(56))

    return {
        high: BigInt.asIntN(64, high) + "",
        low: BigInt.asIntN(64, low) + "",
    }
}

export function intsToUuid(high, low) {
    const h = toBigInt(high)
    const l = toBigInt(low)
    if (h === null || l === null) {
        return null
    }

    return bytesToUuid([
        h & BigInt(0xff),
        h >> BigInt(8) & BigInt(0xff),
        h >> BigInt(16) & BigInt(0xff),
        h >> BigInt(24) & BigInt(0xff),
        h >> BigInt(32) & BigInt(0xff),
        h >> BigInt(40) & BigInt(0xff),
        h >> BigInt(48) & BigInt(0xff),
        h >> BigInt(56) & BigInt(0xff),
        l & BigInt(0xff),
        l >> BigInt(8) & BigInt(0xff),
        l >> BigInt(16) & BigInt(0xff),
        l >> BigInt(24) & BigInt(0xff),
        l >> BigInt(32) & BigInt(0xff),
        l >> BigInt(40) & BigInt(0xff),
        l >> BigInt(48) & BigInt(0xff),
        l >> BigInt(56) & BigInt(0xff),
    ])
}

export function uuidToUints(input) {
    const v = toBigIntBytes(input)
    if (v === null) {
        return null
    }

    const high = BigInt(
        v[7] | v[6] << BigInt(8) | v[5] << BigInt(16) | v[4] << BigInt(24) |
        v[3] << BigInt(32) | v[2] << BigInt(40) | v[1] << BigInt(48) | v[0] << BigInt(56)
    )

    const low = BigInt(
        v[15] | v[14] << BigInt(8) | v[13] << BigInt(16) | v[12] << BigInt(24) |
        v[11] << BigInt(32) | v[10] << BigInt(40) | v[9] << BigInt(48) | v[8] << BigInt(56)
    )

    return {
        high: BigInt.asUintN(64, high) + "",
        low: BigInt.asUintN(64, low) + "",
    }
}

export function uintsToUuid(high, low) {
    const h = toBigInt(high)
    const l = toBigInt(low)
    if (h === null || l === null) {
        return null
    }

    return bytesToUuid([
        h >> BigInt(56) & BigInt(0xff),
        h >> BigInt(48) & BigInt(0xff),
        h >> BigInt(40) & BigInt(0xff),
        h >> BigInt(32) & BigInt(0xff),
        h >> BigInt(24) & BigInt(0xff),
        h >> BigInt(16) & BigInt(0xff),
        h >> BigInt(8) & BigInt(0xff),
        h & BigInt(0xff),
        l >> BigInt(56) & BigInt(0xff),
        l >> BigInt(48) & BigInt(0xff),
        l >> BigInt(40) & BigInt(0xff),
        l >> BigInt(32) & BigInt(0xff),
        l >> BigInt(24) & BigInt(0xff),
        l >> BigInt(16) & BigInt(0xff),
        l >> BigInt(8) & BigInt(0xff),
        l & BigInt(0xff),
    ])
}
