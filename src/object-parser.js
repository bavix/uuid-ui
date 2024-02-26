'use strict';

const rg = /"?([a-zA-Z0-9]*)"?:/g
const hlrg = /^(-?\d+)[;:,](-?\d+)$/
const trg = /["']?(-?\d+)["']?/g

export function objectParse(val) {
    val = val.replace(/[“”]/g, '"') // adhoc
    
    if (val[0] === '[') {
        return JSON.parse(val.replace(trg, '$1'))
    }

    if (val.match(hlrg)) {
        const split = val.replace(hlrg, '$1;$2').split(';')

        return {high: split[0].toString(), low: split[1].toString()}
    }

    const obj = JSON.parse(val.replace(trg, '"$1"').replace(rg, '"$1":'))

    return {high: obj.high, low: obj.low}
}
