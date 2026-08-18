'use strict';

import JSON5 from 'json5';

const integer = /^-?\d+$/;
const hexBytes = /^[0-9a-f]{2}(?:[\s,]+[0-9a-f]{2}){15}$/i;

export function objectParse(val) {
    if (typeof val !== 'string') {
        throw new TypeError('objectParse expects a string')
    }

    const hlrg = /^(-?\d+)[;:,](-?\d+)$/
    const wrg = /^\s*(-?\d+)\s*[;:,]\s*(-?\d+)\s*[;:,]\s*(-?\d+)\s*[;:,]\s*(-?\d+)\s*$/
    // Numbers are quoted before parsing so that an int64 survives JSON5, which
    // would otherwise round it through a double. Only *values* qualify: the
    // old pattern also matched the digits inside a key, so {w1: 1} became
    // {w"1": "1"} and failed to parse at all.
    const trg = /(^|[[{,:]\s*)["']?(-?\d+)["']?(?=\s*([,}\]]|$))/g

    if (hexBytes.test(val.trim())) {
        return val.trim().split(/[\s,]+/).map(byte => parseInt(byte, 16))
    }

    if (val[0] === '[') {
        return JSON5.parse(val.replace(trg, '$1$2'))
    }

    const quad = val.match(wrg)

    if (quad) {
        return {
            w1: Number(quad[1]),
            w2: Number(quad[2]),
            w3: Number(quad[3]),
            w4: Number(quad[4]),
        }
    }

    if (val.match(hlrg)) {
        const split = val.replace(hlrg, '$1;$2').split(';')

        return {
            high: split[0].toString(),
            low: split[1].toString()
        }
    }

    const obj = JSON5.parse(val.replace(trg, '$1"$2"'))

    // Without this, any JSON that happens to parse (a bare number, `{a:1}`)
    // returns {high: undefined, low: undefined} and is misdetected as high/low.
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        throw new SyntaxError('Not a high/low object')
    }

    // The four-word shape protobuf schemas use: {w1, w2, w3, w4}.
    if (['w1', 'w2', 'w3', 'w4'].every(key => key in obj)) {
        const words = {}

        for (const key of ['w1', 'w2', 'w3', 'w4']) {
            const word = String(obj[key])

            if (!integer.test(word)) {
                throw new SyntaxError('w1..w4 must be integers')
            }

            words[key] = Number(word)
        }

        return words
    }

    const high = String(obj.high)
    const low = String(obj.low)

    if (!integer.test(high) || !integer.test(low)) {
        throw new SyntaxError('high and low must be integers')
    }

    return {high, low}
}
