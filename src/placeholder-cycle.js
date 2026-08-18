'use strict';

export const EXAMPLES = [
    '71a46cec-4809-4cc5-9689-5b0441b46186',
    '71a46cec48094cc596895b0441b46186',
    '{71A46CEC-4809-4CC5-9689-5B0441B46186}',
    'urn:uuid:71a46cec-4809-4cc5-9689-5b0441b46186',
    'caRs7EgJTMWWiVsEQbRhhg==',
    '3HMHPERJ099K2SD2AV0H0V8RC6',
    '[113, 164, 108, 236, 72, 9, 76, 197, 150, 137, 91, 4, 65, 180, 97, 134]',
    '71 a4 6c ec 48 09 4c c5 96 89 5b 04 41 b4 61 86',
    '{"high": -4229995741198900111, "low": -8763525208547292778}',
    '-4229995741198900111;-8763525208547292778',
    '{"w1": 1906601196, "w2": 1208569029, "w3": -1769383164, "w4": 1102340486}',
    '1906601196;1208569029;-1769383164;1102340486',
    '"71a46cec-4809-4cc5-9689-5b0441b46186",',
    '"caRs7EgJTMWWiVsEQbRhhg=="',
    '71a46cec-4809-4cc5-9689-5b0441b46186  // a note travels with the row',
];

export const TIMING = { type: 32, hold: 1400, erase: 14, pause: 320 };

export function createCycle({ examples = EXAMPLES, source = null, timing = TIMING, start = 0 } = {}) {
    let index = examples.length === 0 ? 0 : start % examples.length;
    let shown = 0;
    let phase = 'typing';
    let held = source ? source() : null;

    function current() {
        return source ? (held ?? '') : (examples[index] ?? '');
    }

    function advance() {
        if (source) {
            held = source();

            return;
        }

        index = (index + 1) % examples.length;
    }

    return {
        text() {
            return current().slice(0, shown);
        },

        phase() {
            return phase;
        },

        step() {
            const example = current();

            if (example === '') {
                return timing.hold;
            }

            if (phase === 'typing') {
                shown += 1;

                if (shown >= example.length) {
                    shown = example.length;
                    phase = 'holding';

                    return timing.hold;
                }

                return timing.type;
            }

            if (phase === 'holding') {
                phase = 'erasing';

                return timing.erase;
            }

            shown -= Math.max(3, Math.round(example.length / 14));

            if (shown <= 0) {
                shown = 0;
                phase = 'typing';
                advance();

                return timing.pause;
            }

            return timing.erase;
        },
    };
}
