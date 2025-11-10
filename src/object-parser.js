'use strict';

import JSON5 from 'json5';

export function objectParse(val) {
    const hlrg = /^(-?\d+)[;:,](-?\d+)$/
    const trg = /["']?(-?\d+)["']?/g

    if (val[0] === '[') {
        return JSON5.parse(val.replace(trg, '$1'))
    }

    if (val.match(hlrg)) {
        const split = val.replace(hlrg, '$1;$2').split(';')

        return {
            high: split[0].toString(),
            low: split[1].toString()
        }
    }

    const obj = JSON5.parse(val.replace(trg, '"$1"'))

    return {
        high: obj.high,
        low: obj.low
    }
}
