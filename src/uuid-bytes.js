import {uuidFormatter} from "./uuid-formatter.js";

const uuidAlf = /[^a-z0-9]/g
const chunk = /.{1,2}/g

function _getUuid(input) {
    const uuidStr = input.toLowerCase().replaceAll(uuidAlf, '')
    if (uuidStr.length !== 32) {
        return null
    }

    return uuidStr
}

export function uuidToBytes (input) {
    const uuidStr = _getUuid(input)
    if (uuidStr === null) {
        return null
    }

    return  uuidStr
        .match(chunk)
        .map(b => parseInt(b, 16))
}

export function bytesToUuid (bytes) {
    return uuidFormatter(
        bytes.map(b => b.toString(16).padStart(2, '0')).join('')
    )
}

export function uuidToBytesString(input) {
    const bytes = uuidToBytes(input)
    if (bytes === null) {
        return null
    }

    return '[' + [...bytes].join(',') + ']'
}
