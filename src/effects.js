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

let rainbowAnimationId = null;
let rainbowTimeoutId = null;

export function createRainbowEffect(duration = 3000) {
    const body = document.body;
    const originalClass = body.className;
    
    if (rainbowTimeoutId) {
        clearTimeout(rainbowTimeoutId);
    }
    if (rainbowAnimationId) {
        cancelAnimationFrame(rainbowAnimationId);
    }
    
    let startTime = Date.now();
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    ];
    
    let colorIndex = 0;
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < duration) {
            body.style.background = colors[colorIndex % colors.length];
            body.style.transition = 'background 0.25s ease';
            body.style.willChange = 'background';
            colorIndex++;
            rainbowTimeoutId = setTimeout(animate, 250);
        } else {
            body.style.background = '';
            body.style.transition = 'background 0.3s ease';
            body.style.willChange = 'auto';
            body.className = originalClass;
            rainbowTimeoutId = null;
            rainbowAnimationId = null;
        }
    };
    
    animate();
}

export function startNumberGuessingGame(onComplete) {
    const targetNumber = Math.floor(Math.random() * 100) + 1;
    let attempts = 0;
    const maxAttempts = 7;
    
    const showPrompt = () => {
        const userInput = prompt(`🎮 Number Guessing Game!\n\nI'm thinking of a number between 1 and 100.\nYou have ${maxAttempts - attempts} attempts left.\n\nEnter your guess:`);
        
        if (userInput === null) {
            return;
        }
        
        const guess = parseInt(userInput, 10);
        attempts++;
        
        if (isNaN(guess)) {
            alert('Please enter a valid number!');
            if (attempts < maxAttempts) {
                showPrompt();
            }
            return;
        }
        
        if (guess === targetNumber) {
            if (onComplete) onComplete(true, attempts);
            return;
        }
        
        if (attempts >= maxAttempts) {
            if (onComplete) onComplete(false, attempts, targetNumber);
            return;
        }
        
        const hint = guess < targetNumber ? 'higher' : 'lower';
        alert(`Try ${hint}! You have ${maxAttempts - attempts} attempts left.`);
        showPrompt();
    };
    
    showPrompt();
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
        const rect = radio.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
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
                const original = originalTransforms.get(radio);
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

