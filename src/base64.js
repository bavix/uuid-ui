import {bytesToUuid, uuidToBytes} from "./uuid-bytes.js";

export function base64StdToUuid(base64) {
    return bytesToUuid(atob(base64).split('').map(c => c.charCodeAt(0)))
}

export function uuidToBase64Std(uuid) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(uuidToBytes(uuid))))
}
