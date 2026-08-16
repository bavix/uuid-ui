export function createConfetti(x, y, colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F']) {
    const confettiCount = 30;
    const confetti = [];
    
    for (let i = 0; i < confettiCount; i++) {
        const element = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 8 + 4;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 8 + 4;
        
        element.style.position = 'fixed';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        element.style.backgroundColor = color;
        element.style.borderRadius = '50%';
        element.style.pointerEvents = 'none';
        element.style.zIndex = '99999';
        element.style.opacity = '1';
        element.style.willChange = 'transform, opacity';
        element.style.transform = 'translateZ(0)';
        
        document.body.appendChild(element);
        
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity - 5;
        const rotation = Math.random() * 360;
        const rotationSpeed = (Math.random() - 0.5) * 8;
        
        let posX = x;
        let posY = y;
        let currentRotation = rotation;
        let frame = 0;
        let animationId = null;
        
        const animate = () => {
            frame++;
            posX += vx;
            posY += vy + frame * 0.08;
            currentRotation += rotationSpeed;
            
            element.style.transform = `translate3d(${posX}px, ${posY}px, 0) rotate(${currentRotation}deg)`;
            element.style.opacity = `${Math.max(0, 1 - frame / 80)}`;
            
            if (frame < 80 && posY < window.innerHeight + 100) {
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
    const targetNumber = Math.floor(Math.random() * 100) + 1;
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
    panel.addEventListener('click', e => { if (e.target === panel) close(false); });
}

export function shakeElement(selector, intensity = 10, duration = 500) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    const originalTransform = element.style.transform;
    const startTime = Date.now();
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < duration) {
            const shakeX = (Math.random() - 0.5) * intensity;
            const shakeY = (Math.random() - 0.5) * intensity;
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

    const radioButtons = document.querySelectorAll('.custom-radio');
    if (radioButtons.length === 0) return;

    const targetRect = targetElement.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    const startTime = Date.now();
    const originalTransforms = new Map();

    radioButtons.forEach(radio => {
        originalTransforms.set(radio, {
            transform: radio.style.transform || '',
            zIndex: radio.style.zIndex || ''
        });

        radio.style.transition = 'transform 0.1s ease-out';
        radio.style.zIndex = '10';
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
                const original = originalTransforms.get(radio) || { transform: '', zIndex: '' };
                radio.style.transition = 'transform 0.5s ease-out';
                radio.style.transform = original.transform;
                radio.style.zIndex = original.zIndex;

                setTimeout(() => {
                    radio.style.transition = '';
                }, 500);
            });
        }
    };

    requestAnimationFrame(animate);
}

export function createPulseWaveEffect(targetElement, duration = 2000) {
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
    
    const isDark = document.documentElement.classList.contains('dark');
    wave.style.borderColor = isDark ? '#60a5fa' : '#2563eb';
    wave.style.backgroundColor = isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(37, 99, 235, 0.3)';
    
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

    const canvas = document.createElement('canvas');
    canvas.setAttribute('data-uuid-rain', '');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:99996;pointer-events:none;opacity:0;transition:opacity .4s ease';
    document.body.appendChild(canvas);
    // Not requestAnimationFrame: a hidden tab never fires one, and the layer
    // would stay invisible even after the user came back to it.
    setTimeout(() => { canvas.style.opacity = '1'; }, 0);

    const ctx = canvas.getContext('2d');
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
        canvas.width = window.innerWidth * scale;
        canvas.height = window.innerHeight * scale;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const isDark = document.documentElement.classList.contains('dark');
    const glyphs = '0123456789abcdef-';
    const step = 14;
    const columns = Math.ceil(window.innerWidth / step);
    const drops = Array.from({ length: columns }, () => Math.random() * -40);

    const startedAt = Date.now();
    let frame = null;

    const draw = () => {
        const elapsed = Date.now() - startedAt;
        const fading = Math.max(0, 1 - Math.max(0, elapsed - (duration - 800)) / 800);

        ctx.fillStyle = isDark ? 'rgba(17,24,39,0.18)' : 'rgba(255,255,255,0.22)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = isDark
            ? `rgba(94,234,212,${0.85 * fading})`
            : `rgba(15,118,110,${0.75 * fading})`;

        for (let i = 0; i < columns; i++) {
            ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * step, drops[i] * step);
            drops[i] = drops[i] * step > window.innerHeight && Math.random() > 0.975 ? 0 : drops[i] + 1;
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
