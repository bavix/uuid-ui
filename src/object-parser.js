'use strict';

const rg = /"?([a-zA-Z0-9]*)"?:/g
const hlrg = /-?\d+;-?\d+/

export function objectParse(val) {
    if (val.match(hlrg)) {
        const split = val.split(';')

        return {high: split[0], low: split[1]}
    }

    return JSON.parse(val.replace(rg, '"$1":'));
}
