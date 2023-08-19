'use strict';

const rg = /"?([a-zA-Z0-9]*)"?:/g

export function objectParse (val) {
    return JSON.parse(val.replace(rg, '"$1":'));
}
