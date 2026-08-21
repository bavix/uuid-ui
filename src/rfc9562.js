'use strict';

export function fieldsFor(version) {
    const fixed = [
        [48, 51, 'version', 'version'],
        [64, 65, 'variant', 'variant'],
    ];

    switch (version) {
        case 1:
            return [
                [0, 31, 'time', 'time_low'], [32, 47, 'time', 'time_mid'], ...fixed,
                [52, 63, 'time', 'time_high'], [66, 79, 'clock', 'clock_seq'], [80, 127, 'node', 'node'],
            ];
        // 5.2: DCE Security. The local identifier takes the place of time_low,
        // and a local domain takes the low half of the clock sequence.
        case 2:
            return [
                [0, 31, 'clock', 'local_id'], [32, 47, 'time', 'time_mid'], ...fixed,
                [52, 63, 'time', 'time_high'], [66, 71, 'clock', 'clock_seq_hi'],
                [72, 79, 'clock', 'local_domain'], [80, 127, 'node', 'node'],
            ];
        case 6:
            return [
                [0, 31, 'time', 'time_high'], [32, 47, 'time', 'time_mid'], ...fixed,
                [52, 63, 'time', 'time_low'], [66, 79, 'clock', 'clock_seq'], [80, 127, 'node', 'node'],
            ];
        case 7:
            return [
                [0, 47, 'time', 'unix_ts_ms'], ...fixed,
                [52, 63, 'random', 'rand_a'], [66, 127, 'random', 'rand_b'],
            ];
        case 3:
            return [
                [0, 47, 'hash', 'md5_high'], ...fixed,
                [52, 63, 'hash', 'md5_mid'], [66, 127, 'hash', 'md5_low'],
            ];
        case 5:
            return [
                [0, 47, 'hash', 'sha1_high'], ...fixed,
                [52, 63, 'hash', 'sha1_mid'], [66, 127, 'hash', 'sha1_low'],
            ];
        // 5.8: whatever the implementation decided. Only the version and the
        // variant are spoken for.
        case 8:
            return [
                [0, 47, 'random', 'custom_a'], ...fixed,
                [52, 63, 'random', 'custom_b'], [66, 127, 'random', 'custom_c'],
            ];
        default:
            return [
                [0, 47, 'random', 'random'], ...fixed,
                [52, 63, 'random', 'random'], [66, 127, 'random', 'random'],
            ];
    }
}

export function variantOf(hex) {
    const nibble = parseInt(hex[16], 16);

    if (nibble < 8) {
        return 'NCS (0xxx) — reserved, backward compatibility';
    }

    if (nibble < 12) {
        return 'RFC 9562 (10xx)';
    }

    if (nibble < 14) {
        return 'Microsoft (110x) — reserved, backward compatibility';
    }

    return 'reserved for the future (111x)';
}