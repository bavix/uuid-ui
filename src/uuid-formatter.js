export function uuidFormatter(input) {
    return input.slice(0, 8)
        + '-' + input.slice(8, 12)
        + '-' + input.slice(12, 16)
        + '-' + input.slice(16, 20)
        + '-' + input.slice(20, 32)
}
