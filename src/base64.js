'use strict';

import {bytesToUuid, uuidToBytes} from "./uuid-bytes.js";

export function base64StdToUuid(base64) {
    const bytes = atob(base64)
        .split('')
        .map(c => c.charCodeAt(0));

    return bytesToUuid(bytes);
}

export function uuidToBase64Std(uuid) {
    const bytes = uuidToBytes(uuid);

    return btoa(
        String.fromCharCode.apply(null, new Uint8Array(bytes))
    );
}
