import { randomFloat, randomInt, randomPick, randomRange } from './random.js';

export const FORMAT_KEYS = ['uuid', 'highlow', 'base64', 'ulid', 'bytes', 'words', 'hex'];

export function stillPreferred() {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function formatHues() {
    const root = getComputedStyle(document.documentElement);

    return FORMAT_KEYS
        .map(key => root.getPropertyValue(`--fmt-${key}`).trim())
        .filter(hue => hue !== '');
}

/** A theme's colour with an alpha on it, for canvas work that cannot use var(). */
function toneOf(name, alpha, fallback) {
    const held = getComputedStyle(document.documentElement).getPropertyValue(name).trim().match(/[\d.]+/g);

    return held && held.length >= 3 ? `rgba(${held.slice(0, 3).join(',')},${alpha})` : fallback;
}

/** What to paint with when a theme has said nothing: the theme's own accent. */
function accentHue() {
    const held = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

    return held === '' ? '#4ECDC4' : held;
}

export function hueOf(element) {
    if (!element) {
        return null;
    }

    const own = getComputedStyle(element).getPropertyValue('--fmt').trim();

    return own === '' ? null : own;
}

export function createConfetti(x, y, colors = null, count = 26) {
    if (stillPreferred()) {
        return [];
    }

    const palette = Array.isArray(colors) && colors.length > 0 ? colors : formatHues();
    const confetti = [];

    for (let i = 0; i < count; i++) {
        const element = document.createElement('div');
        const depth = randomFloat();
        const near = 0.55 + depth * 0.65;
        const size = randomRange(5, 11) * near;
        const angle = randomFloat() * Math.PI * 2;
        const velocity = randomRange(5, 13) * near;
        const shape = randomFloat();
        const ribbon = shape > 0.72;
        const round = !ribbon && shape < 0.4;

        element.style.position = 'fixed';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.width = `${ribbon ? size * 0.42 : size}px`;
        element.style.height = `${ribbon ? size * 1.5 : (round ? size : size * 0.62)}px`;
        element.style.backgroundColor = palette.length > 0 ? randomPick(palette) : accentHue();
        element.style.borderRadius = round ? '50%' : `${ribbon ? 1 : 2}px`;
        element.style.pointerEvents = 'none';
        element.style.zIndex = `${99990 + Math.round(depth * 9)}`;
        element.style.opacity = `${0.55 + depth * 0.45}`;
        element.style.willChange = 'transform, opacity';

        if (depth < 0.28) {
            element.style.filter = 'blur(0.6px)';
        }

        document.body.appendChild(element);

        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity - 6 * near;
        const drag = 0.982 - depth * 0.012;
        const gravity = 0.16 + depth * 0.12;
        const sway = randomRange(6, 18) * (0.4 + depth);
        const swayRate = randomRange(4, 9) / 100;
        const spin = (randomFloat() - 0.5) * 9 * near;
        const flutter = randomRange(3, 8) / 100;
        const life = Math.round(70 + depth * 40);

        let offsetX = 0;
        let offsetY = 0;
        let speedX = vx;
        let speedY = vy;
        let turn = randomFloat() * 360;
        let frame = 0;
        let animationId = null;

        const animate = () => {
            frame++;
            speedX *= drag;
            speedY = speedY * drag + gravity;
            offsetX += speedX + Math.sin(frame * swayRate) * sway * 0.06;
            offsetY += speedY;
            turn += spin;

            const tilt = ribbon ? Math.sin(frame * flutter) * 70 : Math.sin(frame * flutter) * 40;

            element.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${turn}deg) rotate3d(1, 0.4, 0, ${tilt}deg)`;
            element.style.opacity = `${Math.max(0, (0.55 + depth * 0.45) * (1 - frame / life))}`;

            if (frame < life && y + offsetY < window.innerHeight + 120) {
                animationId = requestAnimationFrame(animate);
            } else {
                element.style.willChange = 'auto';
                element.remove();
            }
        };

        animationId = requestAnimationFrame(animate);
        confetti.push({ element, animationId });
    }

    return confetti;
}

export function startNumberGuessingGame(onComplete) {
    const targetNumber = randomInt(100) + 1;
    const maxAttempts = 7;
    let attempts = 0;

    // A real <dialog> rather than prompt()/alert(): those freeze the tab, are
    // blocked in sandboxed iframes, and cannot be styled. The shell is the
    // app's (.modal-*), so it matches every other dialog.
    const panel = document.createElement('dialog');
    panel.className = 'modal-panel is-narrow';
    panel.setAttribute('aria-label', 'Guess the number');
    panel.dataset.modal = 'guess';

    const head = document.createElement('div');
    head.className = 'modal-head';

    const heading = document.createElement('div');
    const title = document.createElement('p');
    title.className = 'modal-title';
    title.textContent = 'Guess the number';
    const subtitle = document.createElement('p');
    subtitle.className = 'modal-subtitle';
    subtitle.textContent = `Between 1 and 100, in ${maxAttempts} attempts.`;
    heading.append(title, subtitle);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'modal-close';
    closeButton.setAttribute('aria-label', 'Give up');
    closeButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
        '<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';

    head.append(heading, closeButton);

    const body = document.createElement('div');
    body.className = 'modal-body';
    body.style.padding = '1.25rem 1.375rem 1.375rem';

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '100';
    input.className = 'modal-input';
    input.setAttribute('aria-label', 'Your guess, 1 to 100');

    const hint = document.createElement('p');
    hint.className = 'modal-hint';
    // Announced, because the only feedback this game gives is this one line.
    hint.setAttribute('role', 'status');

    body.append(input, hint);
    panel.append(head, body);
    document.body.appendChild(panel);
    panel.showModal();
    input.focus();

    const attemptsLeft = () => {
        const left = maxAttempts - attempts;
        return `${left} attempt${left === 1 ? '' : 's'} left. Enter to try, Esc to give up.`;
    };

    hint.textContent = attemptsLeft();

    let finished = false;
    const finish = (won) => {
        if (finished) {
            return;
        }

        finished = true;
        panel.remove();

        if (onComplete) {
            onComplete(won, attempts, targetNumber);
        }
    };

    const close = (won) => {
        panel.close();
        finish(won);
    };

    // Escape closes the dialog without going through close(); giving up counts
    // as a loss either way.
    panel.addEventListener('close', () => finish(false));

    const submit = () => {
        const guess = parseInt(input.value, 10);
        if (isNaN(guess)) {
            hint.textContent = `Numbers only. ${attemptsLeft()}`;
            return;
        }

        attempts++;
        input.value = '';

        if (guess === targetNumber) {
            close(true);
            return;
        }

        if (attempts >= maxAttempts) {
            close(false);
            return;
        }

        hint.textContent = `${guess} is too ${guess < targetNumber ? 'low' : 'high'}. ${attemptsLeft()}`;
    };

    // Escape is the dialog's own; only Enter needs handling.
    function onKeyDown(e) {
        if (e.key === 'Enter') {
            e.stopPropagation();
            submit();
        }
    }

    panel.addEventListener('keydown', onKeyDown);
    closeButton.addEventListener('click', () => close(false));

    const openedAt = Date.now();
    let startedOnBackdrop = false;

    panel.addEventListener('pointerdown', (e) => { startedOnBackdrop = e.target === panel; });
    panel.addEventListener('click', (e) => {
        if (e.target !== panel || !startedOnBackdrop) {
            return;
        }

        if (Date.now() - openedAt < 500) {
            return;
        }

        close(false);
    });
}

export function shakeElement(selector, intensity = 10, duration = 500) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    const originalTransform = element.style.transform;
    const startTime = Date.now();
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < duration) {
            const shakeX = (randomFloat() - 0.5) * intensity;
            const shakeY = (randomFloat() - 0.5) * intensity;
            element.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
            requestAnimationFrame(animate);
        } else {
            element.style.transform = originalTransform;
        }
    };
    
    animate();
}

export function createMagneticFieldEffect(targetElement, duration = 3000) {
    if (!targetElement) return;

    const radioButtons = document.querySelectorAll('.choice-cell, .custom-radio');
    if (radioButtons.length === 0) return;

    const targetRect = targetElement.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    const startTime = Date.now();
    const originalTransforms = new Map();

    radioButtons.forEach(radio => {
        originalTransforms.set(radio, {
            transform: radio.style.transform || '',
            zIndex: radio.style.zIndex || '',
            boxShadow: radio.style.boxShadow || ''
        });

        radio.style.transition = 'transform 0.1s ease-out, box-shadow 0.3s ease-out';
        radio.style.zIndex = '10';

        const hue = hueOf(radio);

        if (hue) {
            radio.style.boxShadow = `0 0 0 1px ${hue}, 0 0 14px ${hue}`;
        }
    });

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const intensity = Math.sin(progress * Math.PI * 4) * (1 - progress);
        const pullStrength = 15 * (1 - progress) * intensity;

        radioButtons.forEach(radio => {
            if (radio === targetElement || radio.contains(targetElement)) {
                const scale = 1 + (0.3 * (1 - progress));
                radio.style.transform = `scale(${scale})`;
                return;
            }

            const rect = radio.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const dx = targetX - centerX;
            const dy = targetY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const pullX = (dx / distance) * pullStrength;
                const pullY = (dy / distance) * pullStrength;
                
                radio.style.transform = `translate(${pullX}px, ${pullY}px) scale(${1 + pullStrength * 0.01})`;
            }
        });

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            radioButtons.forEach(radio => {
                // A re-render between the two passes swaps the elements out,
                // and the lookup then yields undefined.
                const original = originalTransforms.get(radio) || { transform: '', zIndex: '', boxShadow: '' };
                radio.style.transition = 'transform 0.5s ease-out, box-shadow 0.5s ease-out';
                radio.style.transform = original.transform;
                radio.style.zIndex = original.zIndex;
                radio.style.boxShadow = original.boxShadow;

                setTimeout(() => {
                    radio.style.transition = '';
                }, 500);
            });
        }
    };

    requestAnimationFrame(animate);
}

export function createPulseWaveEffect(targetElement, duration = 2000, hue = null) {
    if (!targetElement) return;

    const wave = document.createElement('div');
    const rect = targetElement.getBoundingClientRect();
    
    wave.style.position = 'fixed';
    wave.style.left = `${rect.left + rect.width / 2}px`;
    wave.style.top = `${rect.top + rect.height / 2}px`;
    wave.style.width = '4px';
    wave.style.height = '4px';
    wave.style.borderRadius = '50%';
    wave.style.border = '2px solid';
    wave.style.pointerEvents = 'none';
    wave.style.zIndex = '99998';
    wave.style.transform = 'translate(-50%, -50%)';
    wave.style.transition = 'all 0.6s ease-out';
    
    const colour = hue || hueOf(targetElement) || accentHue();

    wave.style.borderColor = colour;
    wave.style.backgroundColor = `color-mix(in oklab, ${colour} 30%, transparent)`;
    
    document.body.appendChild(wave);

    setTimeout(() => {
        const maxSize = Math.max(window.innerWidth, window.innerHeight) * 1.5;
        wave.style.width = `${maxSize}px`;
        wave.style.height = `${maxSize}px`;
        wave.style.opacity = '0';
    }, 10);

    setTimeout(() => {
        wave.remove();
    }, duration);
}

const activeSpinAnimations = new Map();

export function spinElement(selector, rotations = 3, duration = 1000) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    const existingAnimation = activeSpinAnimations.get(element);
    if (existingAnimation) {
        if (existingAnimation.resetTimeout) {
            clearTimeout(existingAnimation.resetTimeout);
        }
        element.classList.remove('spin-animation-active');
        element.style.transform = '';
    }
    
    const totalDegrees = rotations * 360;
    const currentRotation = parseFloat(element.dataset.currentRotation || '0');
    const newRotation = currentRotation + totalDegrees;
    
    element.dataset.currentRotation = newRotation.toString();
    element.style.transition = `transform ${duration}ms linear`;
    element.style.transform = `rotate(${newRotation}deg)`;
    element.classList.add('spin-animation-active');
    
    const resetTimeout = setTimeout(() => {
        element.style.transition = 'transform 0.3s ease-out';
        element.style.transform = 'rotate(0deg)';
        element.dataset.currentRotation = '0';
        
        setTimeout(() => {
            element.classList.remove('spin-animation-active');
            element.style.removeProperty('transform');
            element.style.removeProperty('transition');
            activeSpinAnimations.delete(element);
        }, 300);
    }, duration);
    
    activeSpinAnimations.set(element, { resetTimeout });
}


/**
 * Columns of hex raining down the page. Cheap enough to run over the real UI:
 * one canvas, one animation frame, and it removes itself when it is done.
 */
export function uuidRain(duration = 6000) {
    if (document.querySelector('[data-uuid-rain]')) {
        return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    // The trail is drawn by veiling the frame before, which fills the canvas
    // edge to edge. Held below one so the page keeps showing through it —
    // over white, a full-strength veil looks like the app has gone away.
    const veil = isDark ? '0.8' : '0.55';

    const canvas = document.createElement('canvas');
    canvas.setAttribute('data-uuid-rain', '');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:99996;pointer-events:none;opacity:0;transition:opacity .4s ease';
    document.body.appendChild(canvas);
    // Not requestAnimationFrame: a hidden tab never fires one, and the layer
    // would stay invisible even after the user came back to it.
    setTimeout(() => { canvas.style.opacity = veil; }, 0);

    const ctx = canvas.getContext('2d');
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
        canvas.width = window.innerWidth * scale;
        canvas.height = window.innerHeight * scale;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const glyphs = '0123456789abcdef-';
    const step = 14;
    const columns = Math.ceil(window.innerWidth / step);
    const drops = Array.from({ length: columns }, () => randomFloat() * -40);

    const startedAt = Date.now();
    let frame = null;

    const draw = () => {
        const elapsed = Date.now() - startedAt;
        const fading = Math.max(0, 1 - Math.max(0, elapsed - (duration - 800)) / 800);

        // The trail is wiped with the page's own colour and the glyphs fall in
        // the theme's uuid hue: a fixed teal on cream read as somebody else's
        // easter egg.
        ctx.fillStyle = toneOf('--surface', isDark ? 0.18 : 0.22, isDark ? 'rgba(17,24,39,0.18)' : 'rgba(255,255,255,0.22)');
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = toneOf('--fmt-uuid', (isDark ? 0.85 : 0.95) * fading, `rgba(94,234,212,${0.85 * fading})`);

        for (let i = 0; i < columns; i++) {
            ctx.fillText(randomPick(glyphs), i * step, drops[i] * step);
            drops[i] = drops[i] * step > window.innerHeight && randomFloat() > 0.975 ? 0 : drops[i] + 1;
        }

        if (elapsed < duration) {
            frame = requestAnimationFrame(draw);
            return;
        }

        window.removeEventListener('resize', resize);
        canvas.style.opacity = '0';
        setTimeout(() => canvas.remove(), 400);
    };

    frame = requestAnimationFrame(draw);

    return () => {
        if (frame) {
            cancelAnimationFrame(frame);
        }
        window.removeEventListener('resize', resize);
        canvas.remove();
    };
}
