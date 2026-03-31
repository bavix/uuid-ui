import React from 'preact/compat';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';

const PLAYER_SIZE = 20;
const PLAYER_SPEED = 3.5;
const BULLET_SIZE = 4;
const BULLET_SPEED = 10;
const ASTEROID_SIZE = 15;
const COMET_SIZE = 12;
const FAST_ENEMY_SIZE = 8;
const BIG_ENEMY_SIZE = 22;
const BOSS_SIZE = 40;
const ENERGY_SIZE = 10;
const POWERUP_SIZE = 12;
const SPAWN_RATE = 0.015;
const ENERGY_SPAWN_RATE = 0.008;
const POWERUP_SPAWN_RATE = 0.004;
const HYPERSPEED_DURATION = 5000;
const HYPERSPEED_MULTIPLIER = 2;
const SHOOT_COOLDOWN = 120;
const COMBO_TIMEOUT = 2000;
const BOSS_SPAWN_SCORE = 100;
const TRIPLE_SHOT_DURATION = 8000;

const BOSS_TYPES = {
  FORTRESS: 'fortress',
  HUNTER: 'hunter',
  STORM: 'storm',
  PHANTOM: 'phantom'
};

const BOSS_CONFIG = {
  [BOSS_TYPES.FORTRESS]: {
    name: 'FORTRESS',
    health: (level) => 12 + level * 3,
    speed: 0.3,
    chaseSpeed: 0.4,
    oscillationAmplitude: 40,
    canShoot: false,
    livesReward: 1,
    size: 50,
    color: { 
      dark: { main: '#dc2626', accent: '#f87171', core: '#991b1b' },
      light: { main: '#991b1b', accent: '#dc2626', core: '#7f1d1d' }
    },
    description: 'Heavy armored tank'
  },
  [BOSS_TYPES.HUNTER]: {
    name: 'HUNTER',
    health: (level) => 4 + Math.floor(level * 0.8),
    speed: 0.7,
    chaseSpeed: 0.8,
    oscillationAmplitude: 120,
    canShoot: true,
    shootCooldown: 150,
    bulletSpeed: 5,
    livesReward: 3,
    size: 35,
    color: { 
      dark: { main: '#7c3aed', accent: '#a78bfa', core: '#5b21b6' },
      light: { main: '#5b21b6', accent: '#7c3aed', core: '#4c1d95' }
    },
    description: 'Fast sniper'
  },
  [BOSS_TYPES.STORM]: {
    name: 'STORM',
    health: (level) => 6 + level,
    speed: 0.6,
    chaseSpeed: 1.8,
    oscillationAmplitude: 80,
    canShoot: false,
    livesReward: 2,
    size: 45,
    color: { 
      dark: { main: '#ea580c', accent: '#fb923c', core: '#c2410c' },
      light: { main: '#c2410c', accent: '#ea580c', core: '#9a3412' }
    },
    description: 'Aggressive berserker'
  },
  [BOSS_TYPES.PHANTOM]: {
    name: 'PHANTOM',
    health: (level) => 5 + Math.floor(level * 1.2),
    speed: 0.55,
    chaseSpeed: 1.2,
    oscillationAmplitude: 90,
    canShoot: true,
    shootCooldown: 200,
    bulletSpeed: 4.5,
    livesReward: 3,
    size: 38,
    color: { 
      dark: { main: '#06b6d4', accent: '#67e8f9', core: '#0891b2' },
      light: { main: '#0891b2', accent: '#06b6d4', core: '#0e7490' }
    },
    description: 'Elusive ghost'
  }
};

export default function SpaceRunner({ onClose }) {
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('spaceRunnerHighScore') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isHyperspeed, setIsHyperspeed] = useState(false);
  const [isTripleShot, setIsTripleShot] = useState(false);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [kills, setKills] = useState(0);
  const [comboFlash, setComboFlash] = useState(0);
  const [scoreFlash, setScoreFlash] = useState(0);
  const [lives, setLives] = useState(3);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const [gameWidth, setGameWidth] = useState(600);
  const [gameHeight, setGameHeight] = useState(400);
  const playerRef = useRef({ x: 50, y: 200 });
  const playerTrailRef = useRef([]);
  const keysRef = useRef({ up: false, down: false, left: false, right: false, shoot: false });
  const bulletsRef = useRef([]);
  const obstaclesRef = useRef([]);
  const energiesRef = useRef([]);
  const powerupsRef = useRef([]);
  const particlesRef = useRef([]);
  const starsRef = useRef([]);
  const floatingTextsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const hyperspeedEndTimeRef = useRef(0);
  const tripleShotEndTimeRef = useRef(0);
  const lastShotTimeRef = useRef(0);
  const lastKillTimeRef = useRef(0);
  const comboTimeoutRef = useRef(null);
  const bossRef = useRef(null);
  const bossPatternRef = useRef(0);
  const waveRef = useRef(1);
  const lastBossScoreRef = useRef(0);
  const isShieldActiveRef = useRef(false);
  const shieldEndTimeRef = useRef(0);
  const bossBulletsRef = useRef([]);
  const bossLastShotTimeRef = useRef(0);
  const isWallHackActiveRef = useRef(false);
  const isBlurDisabledRef = useRef(false);

  useEffect(() => {
    window.spaceRunnerWallHack = (enabled) => {
      if (enabled === undefined) {
        isWallHackActiveRef.current = !isWallHackActiveRef.current;
      } else {
        isWallHackActiveRef.current = Boolean(enabled);
      }
      console.log(`Wall Hack ${isWallHackActiveRef.current ? 'ENABLED' : 'DISABLED'}`);
      return isWallHackActiveRef.current;
    };
    
    window.spaceRunnerDisableBlur = (enabled) => {
      if (enabled === undefined) {
        isBlurDisabledRef.current = !isBlurDisabledRef.current;
      } else {
        isBlurDisabledRef.current = Boolean(enabled);
      }
      console.log(`Blur ${isBlurDisabledRef.current ? 'DISABLED' : 'ENABLED'}`);
      
      const canvas = canvasRef.current;
      const bgCanvas = bgCanvasRef.current;
      if (bgCanvas) {
        if (isBlurDisabledRef.current) {
          bgCanvas.style.filter = 'none';
        } else {
          bgCanvas.style.filter = isHyperspeed ? 'blur(3px) brightness(1.3)' : 'none';
        }
      }
      if (canvas) {
        canvas.style.filter = 'none';
      }
      
      return isBlurDisabledRef.current;
    };
    
    return () => {
      delete window.spaceRunnerWallHack;
      delete window.spaceRunnerDisableBlur;
    };
  }, []);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
        setTimeout(() => {
          if (containerRef.current) {
            setGameWidth(window.innerWidth);
            setGameHeight(window.innerHeight);
          }
        }, 100);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      if (containerRef.current) {
        if (isNowFullscreen) {
          setGameWidth(window.innerWidth);
          setGameHeight(window.innerHeight);
        } else {
          const rect = containerRef.current.getBoundingClientRect();
          setGameWidth(Math.max(500, rect.width - 16));
          setGameHeight(Math.max(400, rect.height - 60));
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (isFullscreen) {
          setGameWidth(window.innerWidth);
          setGameHeight(window.innerHeight);
        } else {
          const newWidth = Math.max(500, rect.width - 16);
          const newHeight = Math.max(400, rect.height - 60);
          setGameWidth(newWidth);
          setGameHeight(newHeight);
        }
        if (!gameStarted) {
          playerRef.current.y = isFullscreen ? window.innerHeight / 2 : (rect.height - 60) / 2;
        }
      }
    };

    const timer = setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, [gameStarted, isFullscreen]);

  const resetGame = useCallback(() => {
    playerRef.current = { x: 50, y: gameHeight / 2 };
    playerTrailRef.current = [];
    obstaclesRef.current = [];
    energiesRef.current = [];
    powerupsRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    starsRef.current = [];
    floatingTextsRef.current = [];
    keysRef.current = { up: false, down: false, left: false, right: false, shoot: false };
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
    setIsPaused(false);
    setIsHyperspeed(false);
    setIsTripleShot(false);
    setCombo(0);
    setLevel(1);
    setKills(0);
    setComboFlash(0);
    setScoreFlash(0);
    setLives(3);
    hyperspeedEndTimeRef.current = 0;
    tripleShotEndTimeRef.current = 0;
    lastShotTimeRef.current = 0;
    lastKillTimeRef.current = 0;
    bossRef.current = null;
    bossPatternRef.current = 0;
    waveRef.current = 1;
    lastBossScoreRef.current = 0;
    isShieldActiveRef.current = false;
    shieldEndTimeRef.current = 0;
    bossBulletsRef.current = [];
    bossLastShotTimeRef.current = 0;
    isWallHackActiveRef.current = false;
    isBlurDisabledRef.current = false;
    if (comboTimeoutRef.current) {
      clearTimeout(comboTimeoutRef.current);
      comboTimeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [gameHeight]);

  const handleKeyDown = useCallback((e) => {
    if (!gameStarted && !gameOver) {
      setGameStarted(true);
      return;
    }

    if (gameOver) {
      if (e.key === ' ') {
        resetGame();
      }
      return;
    }

    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      setIsPaused(prev => !prev);
      e.preventDefault();
      return;
    }

    if (isPaused) {
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        keysRef.current.up = true;
        e.preventDefault();
        break;
      case 'ArrowDown':
        keysRef.current.down = true;
        e.preventDefault();
        break;
      case 'ArrowLeft':
        keysRef.current.left = true;
        e.preventDefault();
        break;
      case 'ArrowRight':
        keysRef.current.right = true;
        e.preventDefault();
        break;
      case ' ':
      case 'Spacebar':
        keysRef.current.shoot = true;
        e.preventDefault();
        break;
    }
  }, [gameStarted, gameOver, isPaused, resetGame]);

  const handleKeyUp = useCallback((e) => {
    switch (e.key) {
      case 'ArrowUp':
        keysRef.current.up = false;
        e.preventDefault();
        break;
      case 'ArrowDown':
        keysRef.current.down = false;
        e.preventDefault();
        break;
      case 'ArrowLeft':
        keysRef.current.left = false;
        e.preventDefault();
        break;
      case 'ArrowRight':
        keysRef.current.right = false;
        e.preventDefault();
        break;
      case ' ':
      case 'Spacebar':
        keysRef.current.shoot = false;
        e.preventDefault();
        break;
    }
  }, []);

  const checkCollision = (rect1, rect2) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  const getPlayerRect = () => ({
    x: playerRef.current.x - PLAYER_SIZE / 2,
    y: playerRef.current.y - PLAYER_SIZE / 2,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE
  });

  const handlePlayerDamage = (damageColor, isDark) => {
    createParticles(playerRef.current.x, playerRef.current.y, 50, damageColor, isDark, 'explosion');
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameOver(true);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      } else {
        createFloatingText(playerRef.current.x, playerRef.current.y, `-1 LIFE`, damageColor, 10);
      }
      return newLives;
    });
  };

  const updateScoreWithHighScore = (points, flashDuration = 8, checkHyperspeed = true) => {
    setScore(prev => {
      const newScore = prev + points;
      if (newScore > highScore) {
        setHighScore(newScore);
        try {
          localStorage.setItem('spaceRunnerHighScore', newScore.toString());
        } catch {}
      }
      if (checkHyperspeed) {
        const prevScore = prev;
        if (newScore % 50 === 0 && newScore > 0 && prevScore % 50 !== 0) {
          setIsHyperspeed(true);
          hyperspeedEndTimeRef.current = Date.now() + HYPERSPEED_DURATION;
        }
      }
      setScoreFlash(flashDuration);
      return newScore;
    });
  };

  const createBossBullet = (bossX, bossY, playerX, playerY, bulletSpeed) => {
    const bulletDx = playerX - bossX;
    const bulletDy = playerY - bossY;
    const bulletDistance = Math.sqrt(bulletDx * bulletDx + bulletDy * bulletDy);
    if (bulletDistance > 0) {
      const normalizedDx = bulletDx / bulletDistance;
      const normalizedDy = bulletDy / bulletDistance;
      return {
        x: bossX,
        y: bossY,
        vx: normalizedDx * bulletSpeed,
        vy: normalizedDy * bulletSpeed
      };
    }
    return null;
  };

  const activatePowerup = (powerup, isDark) => {
    const { x, y, type } = powerup;
    
    if (type === 'rapid') {
      setIsHyperspeed(true);
      hyperspeedEndTimeRef.current = Date.now() + HYPERSPEED_DURATION;
      createParticles(x, y, 30, isDark ? '#8b5cf6' : '#7c3aed', isDark, 'explosion');
      createFloatingText(x, y, 'HYPERSPEED!', isDark ? '#8b5cf6' : '#7c3aed', 9);
    } else if (type === 'triple') {
      setIsTripleShot(true);
      tripleShotEndTimeRef.current = Date.now() + TRIPLE_SHOT_DURATION;
      createParticles(x, y, 30, isDark ? '#ec4899' : '#db2777', isDark, 'explosion');
      createFloatingText(x, y, 'TRIPLE!', isDark ? '#ec4899' : '#db2777', 9);
    } else if (type === 'shield') {
      isShieldActiveRef.current = true;
      shieldEndTimeRef.current = Date.now() + 10000;
      createParticles(x, y, 30, isDark ? '#10b981' : '#16a34a', isDark, 'explosion');
      createFloatingText(x, y, 'SHIELD!', isDark ? '#10b981' : '#16a34a', 9);
    } else if (type === 'life') {
      setLives(prev => {
        const newLives = Math.min(prev + 1, 5);
        createParticles(x, y, 30, isDark ? '#ef4444' : '#dc2626', isDark, 'explosion');
        createFloatingText(x, y, '+1 LIFE!', isDark ? '#ef4444' : '#dc2626', 9);
        return newLives;
      });
    }
  };

  const createFloatingText = (x, y, text, color, size = 8) => {
    floatingTextsRef.current.push({
      x,
      y,
      text,
      color,
      size,
      life: 60,
      maxLife: 60,
      vy: -1
    });
  };

  const createParticles = (x, y, count, color, isDark, type = 'normal') => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = type === 'explosion' ? Math.random() * 6 + 3 : Math.random() * 5 + 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: type === 'explosion' ? 50 : 40,
        maxLife: type === 'explosion' ? 50 : 40,
        size: Math.random() * 3 + 1,
        color: color || (isDark ? '#60a5fa' : '#1e3a8a')
      });
    }
  };

  const drawPixel = (ctx, x, y, size = 1) => {
    ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
  };

  const drawStar = (ctx, x, y, brightness, isDark) => {
    ctx.fillStyle = isDark ? `rgba(229, 231, 235, ${brightness})` : `rgba(15, 23, 42, ${Math.max(0.5, brightness * 0.8 + 0.5)})`;
    drawPixel(ctx, x, y, 1);
  };

  const drawBullet = (ctx, x, y, isDark, isBossBullet = false) => {
    const centerX = Math.floor(x);
    const centerY = Math.floor(y);
    
    ctx.save();
    if (isBossBullet) {
      ctx.fillStyle = isDark ? '#a78bfa' : '#4c1d95';
      ctx.fillRect(centerX, centerY - 1, 1, 1);
      ctx.fillRect(centerX - 1, centerY, 1, 1);
      ctx.fillRect(centerX, centerY, 1, 1);
      ctx.fillRect(centerX + 1, centerY, 1, 1);
      ctx.fillRect(centerX, centerY + 1, 1, 1);
      
      ctx.fillStyle = isDark ? '#c4b5fd' : '#5b21b6';
      ctx.fillRect(centerX, centerY, 1, 1);
      
      ctx.fillStyle = isDark ? '#ddd6fe' : '#6d28d9';
      ctx.fillRect(centerX, centerY, 1, 1);
    } else {
      ctx.fillStyle = isDark ? '#60a5fa' : '#1e3a8a';
      ctx.fillRect(centerX, centerY - 1, 1, 1);
      ctx.fillRect(centerX - 1, centerY, 1, 1);
      ctx.fillRect(centerX, centerY, 1, 1);
      ctx.fillRect(centerX + 1, centerY, 1, 1);
      ctx.fillRect(centerX, centerY + 1, 1, 1);
      
      ctx.fillStyle = isDark ? '#93c5fd' : '#1e40af';
      ctx.fillRect(centerX, centerY, 1, 1);
      
      ctx.fillStyle = isDark ? '#dbeafe' : '#1e3a8a';
      ctx.fillRect(centerX, centerY, 1, 1);
    }
    ctx.restore();
  };

  const drawPlayerTrail = (ctx, trail, isDark, isHyperspeed) => {
    if (trail.length < 2 || !isHyperspeed) return;
    
    const color = isDark ? '#fbbf24' : '#d97706';
    
    for (let i = 0; i < trail.length - 1; i++) {
      const progress = i / (trail.length - 1);
      const alpha = Math.max(0, 0.15 * (1 - progress));
      if (alpha <= 0) continue;
      
      const x = Math.floor(trail[i].x);
      const y = Math.floor(trail[i].y);
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
  };

  const drawPlayer = (ctx, x, y, isDark, isHyperspeed, isWallHack = false) => {
    let mainColor = isHyperspeed ? (isDark ? '#fbbf24' : '#ea580c') : (isDark ? '#60a5fa' : '#2563eb');
    let accentColor = isHyperspeed ? (isDark ? '#fcd34d' : '#f97316') : (isDark ? '#93c5fd' : '#3b82f6');
    let darkColor = isHyperspeed ? (isDark ? '#d97706' : '#c2410c') : (isDark ? '#3b82f6' : '#1e40af');
    
    if (isWallHack) {
      mainColor = isDark ? '#10b981' : '#16a34a';
      accentColor = isDark ? '#34d399' : '#22c55e';
      darkColor = isDark ? '#059669' : '#15803d';
    }
    
    const centerX = Math.floor(x);
    const centerY = Math.floor(y);
    
    ctx.fillStyle = mainColor;
    drawPixel(ctx, centerX, centerY - 7, 1);
    drawPixel(ctx, centerX - 1, centerY - 6, 1);
    drawPixel(ctx, centerX + 1, centerY - 6, 1);
    drawPixel(ctx, centerX - 2, centerY - 5, 1);
    drawPixel(ctx, centerX + 2, centerY - 5, 1);
    drawPixel(ctx, centerX - 3, centerY - 4, 1);
    drawPixel(ctx, centerX + 3, centerY - 4, 1);
    drawPixel(ctx, centerX - 3, centerY - 3, 1);
    drawPixel(ctx, centerX + 3, centerY - 3, 1);
    drawPixel(ctx, centerX - 4, centerY - 2, 1);
    drawPixel(ctx, centerX + 4, centerY - 2, 1);
    drawPixel(ctx, centerX - 4, centerY - 1, 1);
    drawPixel(ctx, centerX + 4, centerY - 1, 1);
    drawPixel(ctx, centerX - 5, centerY, 1);
    drawPixel(ctx, centerX - 1, centerY, 1);
    drawPixel(ctx, centerX, centerY, 1);
    drawPixel(ctx, centerX + 1, centerY, 1);
    drawPixel(ctx, centerX + 5, centerY, 1);
    drawPixel(ctx, centerX - 4, centerY + 1, 1);
    drawPixel(ctx, centerX + 4, centerY + 1, 1);
    drawPixel(ctx, centerX - 4, centerY + 2, 1);
    drawPixel(ctx, centerX + 4, centerY + 2, 1);
    drawPixel(ctx, centerX - 3, centerY + 3, 1);
    drawPixel(ctx, centerX + 3, centerY + 3, 1);
    drawPixel(ctx, centerX - 3, centerY + 4, 1);
    drawPixel(ctx, centerX + 3, centerY + 4, 1);
    drawPixel(ctx, centerX - 2, centerY + 5, 1);
    drawPixel(ctx, centerX + 2, centerY + 5, 1);
    drawPixel(ctx, centerX - 1, centerY + 6, 1);
    drawPixel(ctx, centerX + 1, centerY + 6, 1);
    drawPixel(ctx, centerX, centerY + 7, 1);
    
    ctx.fillStyle = accentColor;
    drawPixel(ctx, centerX, centerY - 5, 1);
    drawPixel(ctx, centerX - 1, centerY - 4, 1);
    drawPixel(ctx, centerX + 1, centerY - 4, 1);
    drawPixel(ctx, centerX - 2, centerY - 3, 1);
    drawPixel(ctx, centerX + 2, centerY - 3, 1);
    drawPixel(ctx, centerX - 3, centerY - 2, 1);
    drawPixel(ctx, centerX + 3, centerY - 2, 1);
    drawPixel(ctx, centerX - 2, centerY - 1, 1);
    drawPixel(ctx, centerX + 2, centerY - 1, 1);
    drawPixel(ctx, centerX - 1, centerY, 1);
    drawPixel(ctx, centerX + 1, centerY, 1);
    drawPixel(ctx, centerX - 2, centerY + 1, 1);
    drawPixel(ctx, centerX + 2, centerY + 1, 1);
    drawPixel(ctx, centerX - 3, centerY + 2, 1);
    drawPixel(ctx, centerX + 3, centerY + 2, 1);
    drawPixel(ctx, centerX - 2, centerY + 3, 1);
    drawPixel(ctx, centerX + 2, centerY + 3, 1);
    drawPixel(ctx, centerX - 1, centerY + 4, 1);
    drawPixel(ctx, centerX + 1, centerY + 4, 1);
    drawPixel(ctx, centerX, centerY + 5, 1);
    
    ctx.fillStyle = darkColor;
    drawPixel(ctx, centerX, centerY - 3, 1);
    drawPixel(ctx, centerX - 1, centerY - 2, 1);
    drawPixel(ctx, centerX + 1, centerY - 2, 1);
    drawPixel(ctx, centerX, centerY + 2, 1);
    
    if (isHyperspeed) {
      ctx.fillStyle = isDark ? '#ffffff' : '#000000';
      for (let i = -3; i <= 3; i++) {
        drawPixel(ctx, centerX - 6, centerY + i, 1);
        drawPixel(ctx, centerX - 7, centerY + i, 1);
        drawPixel(ctx, centerX - 8, centerY + i, 1);
        drawPixel(ctx, centerX - 9, centerY + i, 1);
        drawPixel(ctx, centerX - 10, centerY + i, 1);
      }
      ctx.fillStyle = isDark ? '#fbbf24' : '#f59e0b';
      drawPixel(ctx, centerX - 7, centerY, 1);
      drawPixel(ctx, centerX - 8, centerY, 1);
    } else {
      ctx.fillStyle = accentColor;
      drawPixel(ctx, centerX - 5, centerY - 1, 1);
      drawPixel(ctx, centerX - 5, centerY, 1);
      drawPixel(ctx, centerX - 5, centerY + 1, 1);
      drawPixel(ctx, centerX - 6, centerY, 1);
      ctx.fillStyle = isDark ? '#dbeafe' : '#bfdbfe';
      drawPixel(ctx, centerX - 5, centerY, 1);
    }
  };

  const drawAsteroid = (ctx, x, y, size, isDark) => {
    const centerX = Math.floor(x);
    const centerY = Math.floor(y);
    const r = Math.floor(size / 2);
    
    ctx.fillStyle = isDark ? '#9ca3af' : '#475569';
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= r && dist > r - 2) {
          drawPixel(ctx, centerX + dx, centerY + dy, 1);
        }
      }
    }
    
    ctx.fillStyle = isDark ? '#6b7280' : '#334155';
    for (let dy = -r + 2; dy <= r - 2; dy++) {
      for (let dx = -r + 2; dx <= r - 2; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= r - 2 && dist > r - 3) {
          drawPixel(ctx, centerX + dx, centerY + dy, 1);
        }
      }
    }
    
    ctx.fillStyle = isDark ? '#4b5563' : '#1e293b';
    drawPixel(ctx, centerX - 2, centerY - 2, 1);
    drawPixel(ctx, centerX + 2, centerY + 2, 1);
    drawPixel(ctx, centerX + 1, centerY - 1, 1);
    drawPixel(ctx, centerX - 1, centerY + 1, 1);
    drawPixel(ctx, centerX - 2, centerY + 1, 1);
    drawPixel(ctx, centerX + 1, centerY + 2, 1);
    
    ctx.fillStyle = isDark ? '#d1d5db' : '#64748b';
    drawPixel(ctx, centerX, centerY - 1, 1);
    drawPixel(ctx, centerX - 1, centerY, 1);
  };

  const drawComet = (ctx, x, y, size, isDark) => {
    const centerX = Math.floor(x);
    const centerY = Math.floor(y);
    const r = Math.floor(size / 2);
    
    ctx.fillStyle = isDark ? '#d1d5db' : '#64748b';
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= r) {
          drawPixel(ctx, centerX + dx, centerY + dy, 1);
        }
      }
    }
    
    ctx.fillStyle = isDark ? '#e5e7eb' : '#475569';
    drawPixel(ctx, centerX, centerY, 1);
    drawPixel(ctx, centerX - 1, centerY, 1);
    drawPixel(ctx, centerX + 1, centerY, 1);
    drawPixel(ctx, centerX, centerY - 1, 1);
    drawPixel(ctx, centerX, centerY + 1, 1);
    
    ctx.fillStyle = isDark ? '#60a5fa' : '#1e40af';
    for (let i = 2; i <= 8; i++) {
      const intensity = 1 - (i - 2) / 6;
      ctx.globalAlpha = intensity;
      drawPixel(ctx, centerX - r - i, centerY, 1);
      if (i % 2 === 0) {
        drawPixel(ctx, centerX - r - i, centerY - 1, 1);
        drawPixel(ctx, centerX - r - i, centerY + 1, 1);
      }
      if (i <= 4) {
        drawPixel(ctx, centerX - r - i, centerY - 2, 1);
        drawPixel(ctx, centerX - r - i, centerY + 2, 1);
      }
    }
    ctx.globalAlpha = 1;
    
    ctx.fillStyle = isDark ? '#93c5fd' : '#1e3a8a';
    drawPixel(ctx, centerX - r - 2, centerY, 1);
    drawPixel(ctx, centerX - r - 3, centerY, 1);
  };

  const drawFastEnemy = (ctx, x, y, size, isDark) => {
    const centerX = Math.floor(x);
    const centerY = Math.floor(y);
    const r = Math.floor(size / 2);
    
    ctx.fillStyle = isDark ? '#f87171' : '#dc2626';
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= r) {
          drawPixel(ctx, centerX + dx, centerY + dy, 1);
        }
      }
    }
    
    ctx.fillStyle = isDark ? '#fca5a5' : '#ef4444';
    drawPixel(ctx, centerX, centerY, 1);
    drawPixel(ctx, centerX - 1, centerY - 1, 1);
    drawPixel(ctx, centerX + 1, centerY - 1, 1);
    drawPixel(ctx, centerX - 1, centerY + 1, 1);
    drawPixel(ctx, centerX + 1, centerY + 1, 1);
    
    ctx.fillStyle = isDark ? '#dc2626' : '#b91c1c';
    drawPixel(ctx, centerX - 1, centerY, 1);
    drawPixel(ctx, centerX + 1, centerY, 1);
    drawPixel(ctx, centerX, centerY - 1, 1);
    drawPixel(ctx, centerX, centerY + 1, 1);
    
    ctx.fillStyle = isDark ? '#991b1b' : '#7f1d1d';
    drawPixel(ctx, centerX, centerY, 1);
    
    ctx.fillStyle = isDark ? '#fbbf24' : '#f59e0b';
    drawPixel(ctx, centerX - 2, centerY, 1);
    drawPixel(ctx, centerX + 2, centerY, 1);
  };

  const drawBigEnemy = (ctx, x, y, size, isDark) => {
    const centerX = Math.floor(x);
    const centerY = Math.floor(y);
    const r = Math.floor(size / 2);
    
    ctx.fillStyle = isDark ? '#6b7280' : '#475569';
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= r && dist > r - 3) {
          drawPixel(ctx, centerX + dx, centerY + dy, 1);
        }
      }
    }
    
    ctx.fillStyle = isDark ? '#9ca3af' : '#334155';
    for (let dy = -r + 3; dy <= r - 3; dy++) {
      for (let dx = -r + 3; dx <= r - 3; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= r - 3 && dist > r - 5) {
          drawPixel(ctx, centerX + dx, centerY + dy, 1);
        }
      }
    }
    
    ctx.fillStyle = isDark ? '#d1d5db' : '#64748b';
    for (let dy = -r + 5; dy <= r - 5; dy++) {
      for (let dx = -r + 5; dx <= r - 5; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= r - 5) {
          drawPixel(ctx, centerX + dx, centerY + dy, 1);
        }
      }
    }
    
    ctx.fillStyle = isDark ? '#4b5563' : '#111827';
    drawPixel(ctx, centerX - 4, centerY - 4, 1);
    drawPixel(ctx, centerX + 4, centerY - 4, 1);
    drawPixel(ctx, centerX - 4, centerY + 4, 1);
    drawPixel(ctx, centerX + 4, centerY + 4, 1);
    drawPixel(ctx, centerX - 3, centerY - 3, 1);
    drawPixel(ctx, centerX + 3, centerY - 3, 1);
    drawPixel(ctx, centerX - 3, centerY + 3, 1);
    drawPixel(ctx, centerX + 3, centerY + 3, 1);
    drawPixel(ctx, centerX, centerY - 3, 1);
    drawPixel(ctx, centerX, centerY + 3, 1);
    drawPixel(ctx, centerX - 3, centerY, 1);
    drawPixel(ctx, centerX + 3, centerY, 1);
    
    ctx.fillStyle = isDark ? '#1f2937' : '#030712';
    drawPixel(ctx, centerX - 2, centerY - 2, 1);
    drawPixel(ctx, centerX + 2, centerY - 2, 1);
    drawPixel(ctx, centerX - 2, centerY + 2, 1);
    drawPixel(ctx, centerX + 2, centerY + 2, 1);
  };

  const drawBoss = (ctx, x, y, health, maxHealth, isDark, pattern, bossType) => {
    const centerX = Math.floor(x);
    const centerY = Math.floor(y);
    const config = BOSS_CONFIG[bossType] || BOSS_CONFIG[BOSS_TYPES.FORTRESS];
    const r = Math.floor(config.size / 2);
    const colors = isDark ? config.color.dark : config.color.light;
    const pulse = Math.sin(pattern * 0.15) * 0.15 + 0.85;
    
    if (bossType === BOSS_TYPES.FORTRESS) {
      ctx.fillStyle = colors.main;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= r && dist > r - 6) {
            drawPixel(ctx, centerX + dx, centerY + dy, 1);
          }
        }
      }
      
      ctx.fillStyle = colors.accent;
      for (let dy = -r + 6; dy <= r - 6; dy++) {
        for (let dx = -r + 6; dx <= r - 6; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= r - 6 && dist > r - 10) {
            drawPixel(ctx, centerX + dx, centerY + dy, 1);
          }
        }
      }
      
      ctx.fillStyle = colors.core;
      for (let dy = -r + 10; dy <= r - 10; dy++) {
        for (let dx = -r + 10; dx <= r - 10; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= r - 10) {
            drawPixel(ctx, centerX + dx, centerY + dy, 1);
          }
        }
      }
      
      ctx.fillStyle = isDark ? '#fbbf24' : '#f59e0b';
      drawPixel(ctx, centerX - 8, centerY - 8, 1);
      drawPixel(ctx, centerX + 8, centerY - 8, 1);
      drawPixel(ctx, centerX - 8, centerY + 8, 1);
      drawPixel(ctx, centerX + 8, centerY + 8, 1);
      
    } else if (bossType === BOSS_TYPES.HUNTER) {
      const angle = pattern * 0.3;
      ctx.fillStyle = colors.main;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= r && dist > r - 3) {
            drawPixel(ctx, centerX + dx, centerY + dy, 1);
          }
        }
      }
      
      ctx.fillStyle = colors.accent;
      const spikeLength = 4;
      for (let i = 0; i < 8; i++) {
        const spikeAngle = (Math.PI * 2 * i) / 8 + angle;
        const spikeX = Math.cos(spikeAngle) * (r - 2);
        const spikeY = Math.sin(spikeAngle) * (r - 2);
        for (let j = 0; j < spikeLength; j++) {
          const px = Math.floor(centerX + spikeX * (1 + j * 0.3));
          const py = Math.floor(centerY + spikeY * (1 + j * 0.3));
          drawPixel(ctx, px, py, 1);
        }
      }
      
      ctx.fillStyle = colors.core;
      for (let dy = -r + 3; dy <= r - 3; dy++) {
        for (let dx = -r + 3; dx <= r - 3; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= r - 3) {
            drawPixel(ctx, centerX + dx, centerY + dy, 1);
          }
        }
      }
      
      ctx.fillStyle = isDark ? '#fbbf24' : '#f59e0b';
      drawPixel(ctx, centerX, centerY, 1);
      
    } else if (bossType === BOSS_TYPES.STORM) {
      const flameOffset = Math.sin(pattern * 0.5) * 3;
      ctx.fillStyle = colors.main;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= r && dist > r - 4) {
            drawPixel(ctx, centerX + dx, centerY + dy, 1);
          }
        }
      }
      
      ctx.fillStyle = colors.accent;
      for (let dy = -r + 4; dy <= r - 4; dy++) {
        for (let dx = -r + 4; dx <= r - 4; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= r - 4 && dist > r - 6) {
            drawPixel(ctx, centerX + dx, centerY + dy, 1);
          }
        }
      }
      
      ctx.fillStyle = colors.core;
      for (let dy = -r + 6; dy <= r - 6; dy++) {
        for (let dx = -r + 6; dx <= r - 6; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= r - 6) {
            drawPixel(ctx, centerX + dx, centerY + dy, 1);
          }
        }
      }
      
      ctx.fillStyle = colors.accent;
      for (let i = -2; i <= 2; i++) {
        const flameX = centerX + i * 2;
        const flameY = centerY + r + 2 + Math.abs(i) + flameOffset;
        drawPixel(ctx, flameX, flameY, 1);
        if (Math.abs(i) < 2) {
          drawPixel(ctx, flameX, flameY + 1, 1);
        }
      }
      
    } else if (bossType === BOSS_TYPES.PHANTOM) {
      const alpha = Math.sin(pattern * 0.2) * 0.3 + 0.7;
      ctx.globalAlpha = alpha;
      
      ctx.fillStyle = colors.main;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= r && dist > r - 3) {
            drawPixel(ctx, centerX + dx, centerY + dy, 1);
          }
        }
      }
      
      ctx.fillStyle = colors.accent;
      for (let dy = -r + 3; dy <= r - 3; dy++) {
        for (let dx = -r + 3; dx <= r - 3; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= r - 3 && dist > r - 5) {
            drawPixel(ctx, centerX + dx, centerY + dy, 1);
          }
        }
      }
      
      ctx.fillStyle = colors.core;
      for (let dy = -r + 5; dy <= r - 5; dy++) {
        for (let dx = -r + 5; dx <= r - 5; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= r - 5) {
            drawPixel(ctx, centerX + dx, centerY + dy, 1);
          }
        }
      }
      
      ctx.fillStyle = colors.accent;
      const trailCount = 3;
      for (let i = 0; i < trailCount; i++) {
        const trailX = centerX - 4 - i * 2;
        const trailY = centerY + Math.sin(pattern * 0.3 + i) * 2;
        ctx.globalAlpha = alpha * (1 - i * 0.3);
        drawPixel(ctx, trailX, trailY, 1);
      }
      
      ctx.globalAlpha = 1;
    }
    
    const healthBarWidth = config.size + 10;
    const healthBarHeight = 3;
    const healthPercent = health / maxHealth;
    const barY = centerY - r - 8;
    
    ctx.fillStyle = isDark ? '#374151' : '#e5e7eb';
    ctx.fillRect(centerX - healthBarWidth / 2, barY, healthBarWidth, healthBarHeight);
    
    const healthColor = healthPercent > 0.5 ? (isDark ? '#10b981' : '#16a34a') : 
                       healthPercent > 0.25 ? (isDark ? '#f59e0b' : '#d97706') : 
                       (isDark ? '#ef4444' : '#dc2626');
    
    ctx.fillStyle = healthColor;
    ctx.fillRect(centerX - healthBarWidth / 2, barY, healthBarWidth * healthPercent, healthBarHeight);
    
    ctx.strokeStyle = healthColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX - healthBarWidth / 2, barY, healthBarWidth, healthBarHeight);
  };

  const drawEnergy = (ctx, x, y, size, isDark) => {
    const centerX = Math.floor(x);
    const centerY = Math.floor(y);
    const time = Date.now();
    const pulse = Math.sin(time / 200) * 0.3 + 0.7;
    const rotation = Math.sin(time / 300) * 0.3;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);
    
    ctx.globalAlpha = pulse;
    ctx.fillStyle = isDark ? '#fbbf24' : '#d97706';
    drawPixel(ctx, centerX, centerY - 3, 1);
    drawPixel(ctx, centerX - 1, centerY - 2, 1);
    drawPixel(ctx, centerX + 1, centerY - 2, 1);
    drawPixel(ctx, centerX - 2, centerY - 1, 1);
    drawPixel(ctx, centerX + 2, centerY - 1, 1);
    drawPixel(ctx, centerX - 3, centerY, 1);
    drawPixel(ctx, centerX, centerY, 1);
    drawPixel(ctx, centerX + 3, centerY, 1);
    drawPixel(ctx, centerX - 2, centerY + 1, 1);
    drawPixel(ctx, centerX + 2, centerY + 1, 1);
    drawPixel(ctx, centerX - 1, centerY + 2, 1);
    drawPixel(ctx, centerX + 1, centerY + 2, 1);
    drawPixel(ctx, centerX, centerY + 3, 1);
    
      ctx.fillStyle = isDark ? '#fcd34d' : '#ea580c';
      drawPixel(ctx, centerX, centerY - 1, 1);
      drawPixel(ctx, centerX - 1, centerY, 1);
      drawPixel(ctx, centerX + 1, centerY, 1);
      drawPixel(ctx, centerX, centerY + 1, 1);
      
      ctx.fillStyle = isDark ? '#fde047' : '#f97316';
    drawPixel(ctx, centerX, centerY, 1);
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  const drawPowerup = (ctx, x, y, type, isDark) => {
    const centerX = Math.floor(x);
    const centerY = Math.floor(y);
    const time = Date.now();
    const pulse = Math.sin(time / 300) * 0.2 + 0.8;
    const rotation = Math.sin(time / 400) * 0.4;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);
    
    ctx.globalAlpha = pulse;
    
    if (type === 'rapid') {
      const mainColor = isDark ? '#8b5cf6' : '#6d28d9';
      const accentColor = isDark ? '#a78bfa' : '#7c3aed';
      const lightColor = isDark ? '#c4b5fd' : '#8b5cf6';
      
      ctx.fillStyle = mainColor;
      drawPixel(ctx, centerX, centerY - 3, 1);
      drawPixel(ctx, centerX - 1, centerY - 2, 1);
      drawPixel(ctx, centerX + 1, centerY - 2, 1);
      drawPixel(ctx, centerX - 2, centerY - 1, 1);
      drawPixel(ctx, centerX + 2, centerY - 1, 1);
      drawPixel(ctx, centerX - 3, centerY, 1);
      drawPixel(ctx, centerX, centerY, 1);
      drawPixel(ctx, centerX + 3, centerY, 1);
      drawPixel(ctx, centerX - 2, centerY + 1, 1);
      drawPixel(ctx, centerX + 2, centerY + 1, 1);
      drawPixel(ctx, centerX - 1, centerY + 2, 1);
      drawPixel(ctx, centerX + 1, centerY + 2, 1);
      drawPixel(ctx, centerX, centerY + 3, 1);
      
      ctx.fillStyle = accentColor;
      drawPixel(ctx, centerX, centerY - 1, 1);
      drawPixel(ctx, centerX - 1, centerY, 1);
      drawPixel(ctx, centerX + 1, centerY, 1);
      drawPixel(ctx, centerX, centerY + 1, 1);
      
      ctx.fillStyle = lightColor;
      drawPixel(ctx, centerX, centerY, 1);
    } else if (type === 'triple') {
      const mainColor = isDark ? '#ec4899' : '#be185d';
      const accentColor = isDark ? '#f472b6' : '#db2777';
      
      ctx.fillStyle = mainColor;
      for (let i = -1; i <= 1; i++) {
        drawPixel(ctx, centerX + i * 3, centerY - 3, 1);
        drawPixel(ctx, centerX + i * 3, centerY - 2, 1);
        drawPixel(ctx, centerX + i * 3, centerY, 1);
        drawPixel(ctx, centerX + i * 3, centerY + 2, 1);
        drawPixel(ctx, centerX + i * 3, centerY + 3, 1);
      }
      drawPixel(ctx, centerX, centerY - 1, 1);
      drawPixel(ctx, centerX, centerY + 1, 1);
      
      ctx.fillStyle = accentColor;
      drawPixel(ctx, centerX - 3, centerY, 1);
      drawPixel(ctx, centerX, centerY, 1);
      drawPixel(ctx, centerX + 3, centerY, 1);
    } else if (type === 'shield') {
      const mainColor = isDark ? '#10b981' : '#16a34a';
      const accentColor = isDark ? '#34d399' : '#22c55e';
      const lightColor = isDark ? '#6ee7b7' : '#4ade80';
      
      ctx.fillStyle = mainColor;
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= 4 && dist > 3) {
            drawPixel(ctx, centerX + dx, centerY + dy, 1);
          }
        }
      }
      
      ctx.fillStyle = accentColor;
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= 3 && dist > 2) {
            drawPixel(ctx, centerX + dx, centerY + dy, 1);
          }
        }
      }
      
      ctx.fillStyle = lightColor;
      drawPixel(ctx, centerX, centerY - 2, 1);
      drawPixel(ctx, centerX, centerY + 2, 1);
      drawPixel(ctx, centerX - 2, centerY, 1);
      drawPixel(ctx, centerX + 2, centerY, 1);
    } else if (type === 'life') {
      const mainColor = isDark ? '#ef4444' : '#dc2626';
      const accentColor = isDark ? '#f87171' : '#fca5a5';
      const lightColor = isDark ? '#fca5a5' : '#fee2e2';
      
      ctx.fillStyle = mainColor;
      drawPixel(ctx, centerX, centerY - 4, 1);
      drawPixel(ctx, centerX - 1, centerY - 3, 1);
      drawPixel(ctx, centerX + 1, centerY - 3, 1);
      drawPixel(ctx, centerX - 2, centerY - 2, 1);
      drawPixel(ctx, centerX + 2, centerY - 2, 1);
      drawPixel(ctx, centerX - 2, centerY - 1, 1);
      drawPixel(ctx, centerX + 2, centerY - 1, 1);
      drawPixel(ctx, centerX - 1, centerY, 1);
      drawPixel(ctx, centerX + 1, centerY, 1);
      drawPixel(ctx, centerX - 1, centerY + 1, 1);
      drawPixel(ctx, centerX + 1, centerY + 1, 1);
      drawPixel(ctx, centerX, centerY + 2, 1);
      
      ctx.fillStyle = accentColor;
      drawPixel(ctx, centerX, centerY - 2, 1);
      drawPixel(ctx, centerX - 1, centerY - 1, 1);
      drawPixel(ctx, centerX + 1, centerY - 1, 1);
      drawPixel(ctx, centerX, centerY, 1);
      
      ctx.fillStyle = lightColor;
      drawPixel(ctx, centerX, centerY - 1, 1);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  const drawParticle = (ctx, particle, isDark) => {
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color;
    drawPixel(ctx, particle.x, particle.y, Math.ceil(particle.size));
    ctx.globalAlpha = 1;
  };

  const drawFloatingText = (ctx, text, isDark) => {
    text.forEach(floating => {
      ctx.globalAlpha = floating.life / floating.maxLife;
      ctx.fillStyle = floating.color;
      ctx.font = `bold ${floating.size}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(floating.text, floating.x, floating.y);
      ctx.globalAlpha = 1;
    });
  };

  const drawBackground = (ctx, width, height, isDark) => {
    const bgColor = isDark ? '#111827' : '#f8fafc';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    ctx.save();

    if (starsRef.current.length === 0) {
      const starCount = isDark ? 80 : 120;
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          brightness: isDark ? (Math.random() * 0.8 + 0.2) : (Math.random() * 0.5 + 0.5),
          speed: Math.random() * 1.2 + 0.2
        });
      }
    }

    starsRef.current.forEach(star => {
      star.x -= star.speed * (isHyperspeed ? HYPERSPEED_MULTIPLIER : 1);
      if (star.x < 0) {
        star.x = width;
        star.y = Math.random() * height;
      }
      drawStar(ctx, star.x, star.y, star.brightness, isDark);
    });

    obstaclesRef.current.forEach(obstacle => {
      if (obstacle.type === 'asteroid') {
        drawAsteroid(ctx, obstacle.x, obstacle.y, obstacle.size, isDark);
      } else if (obstacle.type === 'comet') {
        drawComet(ctx, obstacle.x, obstacle.y, obstacle.size, isDark);
      } else if (obstacle.type === 'fast') {
        drawFastEnemy(ctx, obstacle.x, obstacle.y, obstacle.size, isDark);
      } else if (obstacle.type === 'big') {
        drawBigEnemy(ctx, obstacle.x, obstacle.y, obstacle.size, isDark);
      }
    });

    if (bossRef.current) {
      drawBoss(ctx, bossRef.current.x, bossRef.current.y, bossRef.current.health, bossRef.current.maxHealth, isDark, bossPatternRef.current, bossRef.current.type);
    }

    bossBulletsRef.current.forEach(bullet => {
      drawBullet(ctx, bullet.x, bullet.y, isDark, true);
    });

    energiesRef.current.forEach(energy => {
      drawEnergy(ctx, energy.x, energy.y, energy.size, isDark);
    });

    powerupsRef.current.forEach(powerup => {
      drawPowerup(ctx, powerup.x, powerup.y, powerup.type, isDark);
    });
    
    ctx.restore();
  };

  const updateGame = (width, height, isDark) => {
    if (isPaused || !gameStarted || gameOver) {
      return;
    }

    const speed = isHyperspeed ? PLAYER_SPEED * HYPERSPEED_MULTIPLIER : PLAYER_SPEED;
    const newLevel = Math.floor(score / 50) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      waveRef.current = newLevel;
      createParticles(width / 2, height / 2, 50, isDark ? '#10b981' : '#15803d', isDark, 'explosion');
      createFloatingText(width / 2, height / 2, `LEVEL ${newLevel}!`, isDark ? '#10b981' : '#15803d', 12);
    }

    const prevX = playerRef.current.x;
    const prevY = playerRef.current.y;
    
    if (keysRef.current.up && playerRef.current.y > PLAYER_SIZE) {
      playerRef.current.y -= speed;
    }
    if (keysRef.current.down && playerRef.current.y < height - PLAYER_SIZE) {
      playerRef.current.y += speed;
    }
    if (keysRef.current.left && playerRef.current.x > PLAYER_SIZE) {
      playerRef.current.x -= speed;
    }
    if (keysRef.current.right && playerRef.current.x < width - PLAYER_SIZE) {
      playerRef.current.x += speed;
    }

    const moved = Math.abs(playerRef.current.x - prevX) > 0.01 || Math.abs(playerRef.current.y - prevY) > 0.01;
    if (moved) {
      const lastTrail = playerTrailRef.current[playerTrailRef.current.length - 1];
      if (!lastTrail || Math.abs(lastTrail.x - playerRef.current.x) > 1 || Math.abs(lastTrail.y - playerRef.current.y) > 1) {
        playerTrailRef.current.push({ x: playerRef.current.x, y: playerRef.current.y });
        if (playerTrailRef.current.length > 10) {
          playerTrailRef.current.shift();
        }
      }
    }

    const currentTime = Date.now();
    const shootCooldown = isHyperspeed ? SHOOT_COOLDOWN / 2 : SHOOT_COOLDOWN;
    if (keysRef.current.shoot && currentTime - lastShotTimeRef.current >= shootCooldown) {
      lastShotTimeRef.current = currentTime;
      const bulletSpeed = BULLET_SPEED * (isHyperspeed ? HYPERSPEED_MULTIPLIER : 1);
      
      if (isTripleShot) {
        bulletsRef.current.push({
          x: playerRef.current.x + PLAYER_SIZE / 2 + 6,
          y: playerRef.current.y - 4,
          speed: bulletSpeed
        });
        bulletsRef.current.push({
          x: playerRef.current.x + PLAYER_SIZE / 2 + 6,
          y: playerRef.current.y,
          speed: bulletSpeed
        });
        bulletsRef.current.push({
          x: playerRef.current.x + PLAYER_SIZE / 2 + 6,
          y: playerRef.current.y + 4,
          speed: bulletSpeed
        });
      } else {
        bulletsRef.current.push({
          x: playerRef.current.x + PLAYER_SIZE / 2 + 6,
          y: playerRef.current.y,
          speed: bulletSpeed
        });
      }
    }

    if (bossRef.current) {
      const bossType = bossRef.current.type || BOSS_TYPES.FORTRESS;
      const config = BOSS_CONFIG[bossType];
      const bossSize = config.size;
      bossPatternRef.current += 0.08;
      
      const horizontalSpeed = config.speed * (isHyperspeed ? HYPERSPEED_MULTIPLIER : 1);
      bossRef.current.x -= horizontalSpeed;
      
      const dx = playerRef.current.x - bossRef.current.x;
      const dy = playerRef.current.y - bossRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      let targetY = bossRef.current.y;
      
      if (bossType === BOSS_TYPES.FORTRESS) {
        const oscillation = Math.sin(bossPatternRef.current) * config.oscillationAmplitude;
        if (distance > 0) {
          const normalizedDy = dy / distance;
          targetY = height / 2 + oscillation + normalizedDy * config.chaseSpeed * 20;
        } else {
          targetY = height / 2 + oscillation;
        }
      } else if (bossType === BOSS_TYPES.HUNTER) {
        const oscillation = Math.sin(bossPatternRef.current) * config.oscillationAmplitude;
        const fastOscillation = Math.sin(bossPatternRef.current * 2.8) * 35;
        const baseOscillation = oscillation + fastOscillation;
        
        const nearbyBullets = bulletsRef.current.filter(bullet => {
          const bulletDx = bullet.x - bossRef.current.x;
          const bulletDy = bullet.y - bossRef.current.y;
          const bulletDistance = Math.sqrt(bulletDx * bulletDx + bulletDy * bulletDy);
          return bulletDistance < 130 && bullet.x > bossRef.current.x - 80;
        });
        
        let dodgeOffset = 0;
        if (nearbyBullets.length > 0) {
          nearbyBullets.forEach(bullet => {
            const bulletDy = bullet.y - bossRef.current.y;
            if (Math.abs(bulletDy) < 55) {
              dodgeOffset += bulletDy > 0 ? -2.5 : 2.5;
            }
          });
        }
        
        if (distance > 0) {
          const normalizedDy = dy / distance;
          targetY = height / 2 + baseOscillation + normalizedDy * config.chaseSpeed * 18 + dodgeOffset;
        } else {
          targetY = height / 2 + baseOscillation + dodgeOffset;
        }
        
        if (config.canShoot && currentTime - bossLastShotTimeRef.current >= config.shootCooldown) {
          bossLastShotTimeRef.current = currentTime;
          const bullet = createBossBullet(
            bossRef.current.x - bossSize / 2,
            bossRef.current.y,
            playerRef.current.x,
            playerRef.current.y,
            config.bulletSpeed
          );
          if (bullet) {
            bossBulletsRef.current.push(bullet);
          }
        }
      } else if (bossType === BOSS_TYPES.STORM) {
        if (distance > 0) {
          const normalizedDy = dy / distance;
          const oscillation = Math.sin(bossPatternRef.current * 1.6) * config.oscillationAmplitude;
          targetY = height / 2 + oscillation + normalizedDy * config.chaseSpeed * 35;
        } else {
          targetY = height / 2 + Math.sin(bossPatternRef.current * 1.6) * config.oscillationAmplitude;
        }
      } else if (bossType === BOSS_TYPES.PHANTOM) {
        const oscillation = Math.sin(bossPatternRef.current) * config.oscillationAmplitude;
        const phaseOscillation = Math.sin(bossPatternRef.current * 1.8) * 25;
        const baseOscillation = oscillation + phaseOscillation;
        
        if (distance > 0) {
          const normalizedDy = dy / distance;
          targetY = height / 2 + baseOscillation + normalizedDy * config.chaseSpeed * 25;
        } else {
          targetY = height / 2 + baseOscillation;
        }
        
        if (config.canShoot && currentTime - bossLastShotTimeRef.current >= config.shootCooldown) {
          bossLastShotTimeRef.current = currentTime;
          const bullet = createBossBullet(
            bossRef.current.x - bossSize / 2,
            bossRef.current.y,
            playerRef.current.x,
            playerRef.current.y,
            config.bulletSpeed
          );
          if (bullet) {
            bossBulletsRef.current.push(bullet);
          }
        }
      }
      
      const currentY = bossRef.current.y;
      const smoothFactor = bossType === BOSS_TYPES.STORM ? 0.28 : bossType === BOSS_TYPES.PHANTOM ? 0.12 : 0.15;
      const newY = currentY + (targetY - currentY) * smoothFactor;
      
      const minY = bossSize / 2;
      const maxY = height - bossSize / 2;
      bossRef.current.y = Math.max(minY, Math.min(maxY, newY));
      
      const bossRect = {
        x: bossRef.current.x - bossSize / 2,
        y: bossRef.current.y - bossSize / 2,
        width: bossSize,
        height: bossSize
      };
      
      const playerRect = getPlayerRect();
      
      if (checkCollision(playerRect, bossRect) && !isShieldActiveRef.current && !isWallHackActiveRef.current) {
        handlePlayerDamage(isDark ? '#ef4444' : '#dc2626', isDark);
      }
      
      if (bossRef.current.x < -bossSize) {
        bossRef.current = null;
        bossPatternRef.current = 0;
        bossBulletsRef.current = [];
      }
    } else if (score >= BOSS_SPAWN_SCORE && Math.floor(score / BOSS_SPAWN_SCORE) > Math.floor(lastBossScoreRef.current / BOSS_SPAWN_SCORE) && obstaclesRef.current.length === 0 && !bossRef.current) {
      const bossTypes = Object.values(BOSS_TYPES);
      const randomType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
      const config = BOSS_CONFIG[randomType];
      const bossHealth = config.health(level);
      const colors = isDark ? config.color.dark : config.color.light;
      
      bossRef.current = {
        x: width,
        y: height / 2,
        health: bossHealth,
        maxHealth: bossHealth,
        type: randomType
      };
      bossPatternRef.current = 0;
      bossLastShotTimeRef.current = 0;
      lastBossScoreRef.current = score;
      
      createParticles(width, height / 2, 50, colors.main, isDark, 'explosion');
      createFloatingText(width, height / 2, `${config.name} BOSS!`, colors.main, 14);
    }
    
    bossBulletsRef.current = bossBulletsRef.current.map(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      return bullet;
    }).filter(bullet => {
      if (bullet.x < -10 || bullet.x > width + 10 || bullet.y < -10 || bullet.y > height + 10) {
        return false;
      }
      
      const bulletRect = {
        x: bullet.x - BULLET_SIZE / 2,
        y: bullet.y - BULLET_SIZE / 2,
        width: BULLET_SIZE,
        height: BULLET_SIZE
      };
      
      const playerRect = getPlayerRect();
      
      if (checkCollision(bulletRect, playerRect) && !isShieldActiveRef.current && !isWallHackActiveRef.current) {
        createParticles(playerRef.current.x, playerRef.current.y, 30, isDark ? '#7c3aed' : '#5b21b6', isDark, 'explosion');
        handlePlayerDamage(isDark ? '#7c3aed' : '#5b21b6', isDark);
        return false;
      }
      
      return true;
    });

    bulletsRef.current = bulletsRef.current.map(bullet => {
      bullet.x += bullet.speed;
      return bullet;
    }).filter(bullet => {
      if (bullet.x < 0) {
        return false;
      }
      if (bullet.x > width) {
        return false;
      }

      const bulletRect = {
        x: bullet.x - BULLET_SIZE / 2,
        y: bullet.y - BULLET_SIZE / 2,
        width: BULLET_SIZE,
        height: BULLET_SIZE
      };

      let hit = false;

      if (bossRef.current && bossRef.current.health > 0) {
        const bossConfig = BOSS_CONFIG[bossRef.current.type] || BOSS_CONFIG[BOSS_TYPES.FORTRESS];
        const bossSize = bossConfig.size;
        const bossRect = {
          x: bossRef.current.x - bossSize / 2,
          y: bossRef.current.y - bossSize / 2,
          width: bossSize,
          height: bossSize
        };

        if (checkCollision(bulletRect, bossRect)) {
          hit = true;
          bossRef.current.health--;
          createParticles(bossRef.current.x, bossRef.current.y, 30, isDark ? '#ef4444' : '#dc2626', isDark);
          
          if (bossRef.current.health <= 0) {
            const bossType = bossRef.current.type || BOSS_TYPES.FORTRESS;
            const bossConfig = BOSS_CONFIG[bossType];
            const livesReward = bossConfig.livesReward || 1;
            
            createParticles(bossRef.current.x, bossRef.current.y, 70, isDark ? '#fbbf24' : '#d97706', isDark, 'explosion');
            const points = 100 * combo;
            createFloatingText(bossRef.current.x, bossRef.current.y, `+${points}`, isDark ? '#fbbf24' : '#d97706', 10);
            updateScoreWithHighScore(points, 10, false);
            setKills(prev => prev + 1);
            setLives(prev => {
              const newLives = Math.min(prev + livesReward, 5);
              createFloatingText(bossRef.current.x, bossRef.current.y - 15, `+${livesReward} LIFE${livesReward > 1 ? 'S' : ''}!`, isDark ? '#ef4444' : '#dc2626', 9);
              return newLives;
            });
            bossRef.current = null;
            bossPatternRef.current = 0;
            bossBulletsRef.current = [];
            lastBossScoreRef.current = score + points;
          }
          return false;
        }
      }

      obstaclesRef.current = obstaclesRef.current.filter(obstacle => {
        const obstacleRect = {
          x: obstacle.x - obstacle.size / 2,
          y: obstacle.y - obstacle.size / 2,
          width: obstacle.size,
          height: obstacle.size
        };

        if (checkCollision(bulletRect, obstacleRect)) {
          hit = true;
          const now = Date.now();
          const timeSinceLastKill = now - lastKillTimeRef.current;
          
          let newCombo;
          if (timeSinceLastKill < COMBO_TIMEOUT) {
            newCombo = combo + 1;
            setCombo(newCombo);
            setComboFlash(15);
          } else {
            newCombo = 1;
            setCombo(1);
            setComboFlash(10);
          }
          
          lastKillTimeRef.current = now;
          
          if (comboTimeoutRef.current) {
            clearTimeout(comboTimeoutRef.current);
          }
          comboTimeoutRef.current = setTimeout(() => {
            setCombo(0);
          }, COMBO_TIMEOUT);
          
          const points = (obstacle.type === 'asteroid' ? 20 : obstacle.type === 'fast' ? 25 : obstacle.type === 'big' ? 30 : 15) * newCombo;
          createParticles(obstacle.x, obstacle.y, obstacle.type === 'big' ? 25 : 18, isDark ? '#60a5fa' : '#1d4ed8', isDark);
          createFloatingText(obstacle.x, obstacle.y, `+${points}`, isDark ? '#60a5fa' : '#1d4ed8', 8);
          updateScoreWithHighScore(points, 8, true);
          setKills(prev => prev + 1);
          return false;
        }
        return true;
      });

      return !hit;
    });

    const currentTime2 = Date.now();
    if (isHyperspeed && currentTime2 >= hyperspeedEndTimeRef.current) {
      setIsHyperspeed(false);
    }
    if (isTripleShot && currentTime2 >= tripleShotEndTimeRef.current) {
      setIsTripleShot(false);
    }
    if (isShieldActiveRef.current && currentTime2 >= shieldEndTimeRef.current) {
      isShieldActiveRef.current = false;
    }

    if (comboFlash > 0) {
      setComboFlash(prev => prev - 1);
    }
    if (scoreFlash > 0) {
      setScoreFlash(prev => prev - 1);
    }

    const spawnRate = SPAWN_RATE * (1 + level * 0.1);
    if (!bossRef.current && obstaclesRef.current.length < 15 && Math.random() < spawnRate * (isHyperspeed ? HYPERSPEED_MULTIPLIER : 1)) {
      const rand = Math.random();
      let type, size;
      if (rand < 0.45) {
        type = 'asteroid';
        size = ASTEROID_SIZE;
      } else if (rand < 0.7) {
        type = 'comet';
        size = COMET_SIZE;
      } else if (rand < 0.85 && level >= 3) {
        type = 'fast';
        size = FAST_ENEMY_SIZE;
      } else if (level >= 5) {
        type = 'big';
        size = BIG_ENEMY_SIZE;
      } else {
        type = 'asteroid';
        size = ASTEROID_SIZE;
      }
      
      const baseSpeed = type === 'fast' ? 5 : type === 'big' ? 1.5 : (Math.random() * 2 + 2);
      obstaclesRef.current.push({
        x: width,
        y: Math.random() * (height - size * 2) + size,
        size,
        type,
        speed: baseSpeed * (1 + level * 0.2) * (isHyperspeed ? HYPERSPEED_MULTIPLIER : 1)
      });
    }

    if (energiesRef.current.length < 5 && Math.random() < ENERGY_SPAWN_RATE) {
      energiesRef.current.push({
        x: width,
        y: Math.random() * (height - ENERGY_SIZE * 2) + ENERGY_SIZE,
        size: ENERGY_SIZE
      });
    }

    if (powerupsRef.current.length < 3 && Math.random() < POWERUP_SPAWN_RATE) {
      const rand = Math.random();
      let type;
      if (rand < 0.3) {
        type = 'rapid';
      } else if (rand < 0.55) {
        type = 'triple';
      } else if (rand < 0.75) {
        type = 'shield';
      } else {
        type = 'life';
      }
      powerupsRef.current.push({
        x: width,
        y: Math.random() * (height - POWERUP_SIZE * 2) + POWERUP_SIZE,
        type
      });
    }

    obstaclesRef.current = obstaclesRef.current.filter(obstacle => {
      obstacle.x -= obstacle.speed;

      const playerRect = getPlayerRect();

      const obstacleRect = {
        x: obstacle.x - obstacle.size / 2,
        y: obstacle.y - obstacle.size / 2,
        width: obstacle.size,
        height: obstacle.size
      };

      if (checkCollision(playerRect, obstacleRect) && !isShieldActiveRef.current && !isWallHackActiveRef.current) {
        handlePlayerDamage(isDark ? '#ef4444' : '#dc2626', isDark);
        return false;
      }

      return obstacle.x > -obstacle.size;
    });

    energiesRef.current = energiesRef.current.filter(energy => {
      energy.x -= 3 * (isHyperspeed ? HYPERSPEED_MULTIPLIER : 1);

      const playerRect = getPlayerRect();

      const energyRect = {
        x: energy.x - energy.size / 2,
        y: energy.y - energy.size / 2,
        width: energy.size,
        height: energy.size
      };

      if (checkCollision(playerRect, energyRect)) {
        updateScoreWithHighScore(10, 0, true);
        createParticles(energy.x, energy.y, 15, isDark ? '#fbbf24' : '#d97706', isDark);
        createFloatingText(energy.x, energy.y, '+10', isDark ? '#fbbf24' : '#d97706', 7);
        return false;
      }

      return energy.x > -energy.size;
    });

    powerupsRef.current = powerupsRef.current.filter(powerup => {
      powerup.x -= 2 * (isHyperspeed ? HYPERSPEED_MULTIPLIER : 1);

      const playerRect = getPlayerRect();

      const powerupRect = {
        x: powerup.x - POWERUP_SIZE / 2,
        y: powerup.y - POWERUP_SIZE / 2,
        width: POWERUP_SIZE,
        height: POWERUP_SIZE
      };

      if (checkCollision(playerRect, powerupRect)) {
        activatePowerup(powerup, isDark);
        return false;
      }

      return powerup.x > -POWERUP_SIZE;
    });

    particlesRef.current = particlesRef.current.map(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      particle.life--;
      return particle;
    }).filter(particle => particle.life > 0).slice(0, 200);

    floatingTextsRef.current = floatingTextsRef.current.map(text => {
      text.y += text.vy;
      text.life--;
      return text;
    }).filter(text => text.life > 0).slice(0, 50);
  };

  const drawForeground = (ctx, width, height, isDark) => {
    const textColor = isDark ? '#e5e7eb' : '#0f172a';
    const lineColor = isDark ? '#374151' : '#cbd5e1';

    const comboPulse = comboFlash > 0 ? 1 + Math.sin(Date.now() / 100) * 0.3 : 1;
    const scorePulse = scoreFlash > 0 ? 1 + Math.sin(Date.now() / 150) * 0.2 : 1;

    ctx.fillStyle = textColor;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('SPACE RUNNER', 8, 8);

    ctx.font = `${8 * scorePulse}px monospace`;
    ctx.fillText(`SCORE: ${score}`, 8, 22);
    ctx.font = '8px monospace';
    ctx.fillText(`HIGH: ${highScore}`, 8, 34);
    ctx.fillText(`LVL: ${level}`, 8, 46);
    ctx.fillText(`KILLS: ${kills}`, 8, 58);
    
    ctx.fillStyle = isDark ? '#ef4444' : '#dc2626';
    for (let i = 0; i < 5; i++) {
      if (i < lives) {
        ctx.fillText('♥', 8 + i * 8, 70);
      } else {
        ctx.globalAlpha = 0.3;
        ctx.fillText('♥', 8 + i * 8, 70);
        ctx.globalAlpha = 1;
      }
    }
    ctx.fillStyle = textColor;

    const levelProgress = (score % 50) / 50;
    const progressBarWidth = 60;
    const progressBarHeight = 3;
    ctx.fillStyle = isDark ? '#374151' : '#cbd5e1';
    ctx.fillRect(8, 82, progressBarWidth, progressBarHeight);
    ctx.fillStyle = isDark ? '#60a5fa' : '#2563eb';
    ctx.fillRect(8, 82, progressBarWidth * levelProgress, progressBarHeight);

    if (combo > 1) {
      const comboSize = 8 + (combo - 2) * 0.5;
      ctx.fillStyle = isDark ? '#fbbf24' : '#ea580c';
      ctx.font = `bold ${comboSize * comboPulse}px monospace`;
      ctx.fillText(`COMBO x${combo}!`, 8, 90);
      ctx.font = '8px monospace';
    }

    if (isHyperspeed) {
      const timeLeft = Math.ceil((hyperspeedEndTimeRef.current - Date.now()) / 1000);
      ctx.fillStyle = isDark ? '#fbbf24' : '#ea580c';
      ctx.fillText(`HYPERSPEED! ${timeLeft}s`, width - 110, 22);
    }

    if (isTripleShot) {
      const timeLeft = Math.ceil((tripleShotEndTimeRef.current - Date.now()) / 1000);
      ctx.fillStyle = isDark ? '#ec4899' : '#be185d';
      ctx.fillText(`TRIPLE! ${timeLeft}s`, width - 110, 34);
    }

    if (isShieldActiveRef.current) {
      const timeLeft = Math.ceil((shieldEndTimeRef.current - Date.now()) / 1000);
      ctx.fillStyle = isDark ? '#10b981' : '#16a34a';
      ctx.fillText(`SHIELD! ${timeLeft}s`, width - 110, 46);
    }

    if (isWallHackActiveRef.current) {
      ctx.fillStyle = isDark ? '#10b981' : '#16a34a';
      ctx.fillText('WALL HACK!', width - 110, 58);
    }

    if (isBlurDisabledRef.current) {
      ctx.fillStyle = isDark ? '#f59e0b' : '#ea580c';
      ctx.fillText('NO BLUR!', width - 110, 70);
    }

    if (isPaused) {
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = textColor;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', width / 2, height / 2 - 20);
      ctx.font = '8px monospace';
      ctx.fillText('PRESS P TO RESUME', width / 2, height / 2);
      return;
    }

    if (!gameStarted && !gameOver) {
      ctx.fillStyle = textColor;
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      const time = Date.now();
      const blink = Math.sin(time / 500) > 0;
      if (blink) {
        ctx.fillText('PRESS ANY KEY TO START', width / 2, height / 2 - 20);
      }
      ctx.fillText('ARROWS: MOVE | SPACE: SHOOT', width / 2, height / 2 - 8);
      ctx.fillText('P: PAUSE | ESC: PAUSE', width / 2, height / 2 + 4);
      ctx.fillText('DESTROY ENEMIES TO SCORE', width / 2, height / 2 + 16);
      return;
    }

    if (gameOver) {
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = textColor;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', width / 2, height / 2 - 40);
      ctx.font = '8px monospace';
      ctx.fillText(`FINAL SCORE: ${score}`, width / 2, height / 2 - 20);
      ctx.fillText(`KILLS: ${kills}`, width / 2, height / 2 - 10);
      ctx.fillText(`LEVEL REACHED: ${level}`, width / 2, height / 2);
      if (score === highScore && score > 0) {
        ctx.fillStyle = isDark ? '#fbbf24' : '#ea580c';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('NEW HIGH SCORE!', width / 2, height / 2 + 12);
        ctx.fillStyle = textColor;
        ctx.font = '8px monospace';
      }
      const time = Date.now();
      const blink = Math.sin(time / 500) > 0;
      if (blink) {
        ctx.fillText('PRESS SPACE TO RESTART', width / 2, height / 2 + 30);
      }
      return;
    }

    ctx.save();
    drawPlayerTrail(ctx, playerTrailRef.current, isDark, isHyperspeed);
    ctx.restore();
    
    ctx.save();
    particlesRef.current.forEach(particle => {
      drawParticle(ctx, particle, isDark);
    });
    ctx.restore();

    ctx.save();
    drawFloatingText(ctx, floatingTextsRef.current, isDark);
    ctx.restore();

    ctx.save();
    bulletsRef.current.forEach(bullet => {
      drawBullet(ctx, bullet.x, bullet.y, isDark);
    });
    ctx.restore();

    ctx.save();
    drawPlayer(ctx, playerRef.current.x, playerRef.current.y, isDark, isHyperspeed, isWallHackActiveRef.current);
    ctx.restore();
    
    if (isShieldActiveRef.current) {
      const shieldSize = PLAYER_SIZE + 8;
      const centerX = Math.floor(playerRef.current.x);
      const centerY = Math.floor(playerRef.current.y);
      const time = Date.now();
      const pulse = Math.sin(time / 200) * 0.3 + 0.7;
      
      ctx.globalAlpha = pulse * 0.5;
      ctx.strokeStyle = isDark ? '#10b981' : '#16a34a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, shieldSize / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.moveTo(0, height - 1);
    ctx.lineTo(width, height - 1);
    ctx.stroke();
  };

  const drawGame = (bgCtx, fgCtx, width, height, isDark) => {
    drawBackground(bgCtx, width, height, isDark);
    drawForeground(fgCtx, width, height, isDark);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
    
    const scale = 2;
    canvas.width = gameWidth * scale;
    canvas.height = gameHeight * scale;
    canvas.style.width = `${gameWidth}px`;
    canvas.style.height = `${gameHeight}px`;
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;

    if (bgCanvas && bgCtx) {
      bgCanvas.width = gameWidth * scale;
      bgCanvas.height = gameHeight * scale;
      bgCanvas.style.width = `${gameWidth}px`;
      bgCanvas.style.height = `${gameHeight}px`;
      bgCanvas.style.position = 'absolute';
      bgCanvas.style.top = '0';
      bgCanvas.style.left = '0';
      bgCanvas.style.zIndex = '0';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '1';
      bgCtx.scale(scale, scale);
      bgCtx.imageSmoothingEnabled = false;
    }

    const gameLoop = () => {
      updateGame(gameWidth, gameHeight, isDark);
      
      if (bgCanvas && bgCtx) {
        bgCtx.clearRect(0, 0, gameWidth, gameHeight);
        ctx.clearRect(0, 0, gameWidth, gameHeight);
        drawGame(bgCtx, ctx, gameWidth, gameHeight, isDark);
      } else {
        ctx.clearRect(0, 0, gameWidth, gameHeight);
        drawBackground(ctx, gameWidth, gameHeight, isDark);
        drawForeground(ctx, gameWidth, gameHeight, isDark);
      }
      
      if (!gameOver && !isPaused) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      } else if (isPaused) {
        if (bgCanvas && bgCtx) {
          bgCtx.clearRect(0, 0, gameWidth, gameHeight);
          ctx.clearRect(0, 0, gameWidth, gameHeight);
          drawGame(bgCtx, ctx, gameWidth, gameHeight, isDark);
        } else {
          ctx.clearRect(0, 0, gameWidth, gameHeight);
          drawBackground(ctx, gameWidth, gameHeight, isDark);
          drawForeground(ctx, gameWidth, gameHeight, isDark);
        }
      }
    };

    if (gameStarted && !gameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    } else {
      updateGame(gameWidth, gameHeight, isDark);
      if (bgCanvas && bgCtx) {
        drawGame(bgCtx, ctx, gameWidth, gameHeight, isDark);
      } else {
        drawBackground(ctx, gameWidth, gameHeight, isDark);
        drawForeground(ctx, gameWidth, gameHeight, isDark);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStarted, gameOver, isPaused, score, isHyperspeed, isTripleShot, isDark, gameWidth, gameHeight, combo, level, kills, comboFlash, scoreFlash, highScore, handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas) return;

    if (isHyperspeed && !isBlurDisabledRef.current) {
      if (bgCanvas) {
        bgCanvas.style.filter = 'blur(3px) brightness(1.3)';
        bgCanvas.style.transition = 'filter 0.2s ease';
      }
      canvas.style.filter = 'none';
      canvas.style.transition = 'filter 0.2s ease';
    } else {
      if (bgCanvas) {
        bgCanvas.style.filter = 'none';
        bgCanvas.style.transition = 'filter 0.3s ease';
      }
      canvas.style.filter = 'none';
      canvas.style.transition = 'filter 0.3s ease';
    }

    return () => {
      if (canvas) {
        canvas.style.filter = 'none';
        canvas.style.transition = '';
      }
      if (bgCanvas) {
        bgCanvas.style.filter = 'none';
        bgCanvas.style.transition = '';
      }
    };
  }, [isHyperspeed]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full flex flex-col relative m-0 p-0 ${isFullscreen ? 'fixed inset-0' : ''}`}
      style={isFullscreen ? { width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 } : {}}
    >
      <div className="absolute top-1 right-1 z-[10000] flex flex-col items-end gap-1">
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-800/80 dark:bg-gray-700/80 hover:bg-gray-700 dark:hover:bg-gray-600 text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-all hover:scale-110 active:scale-95 shadow-lg backdrop-blur-sm"
          aria-label="Close game"
          title="Close game"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={toggleFullscreen}
          className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-800/80 dark:bg-gray-700/80 hover:bg-gray-700 dark:hover:bg-gray-600 text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-all hover:scale-110 active:scale-95 shadow-lg backdrop-blur-sm"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      </div>

      <div className={`flex items-center justify-center m-0 p-0 relative ${isFullscreen ? 'absolute inset-0 w-full h-full' : 'flex-1 min-h-0 w-full h-full'}`}>
        <canvas
          ref={bgCanvasRef}
          className="cursor-pointer m-0 p-0"
          style={{ 
            imageRendering: 'pixelated', 
            width: isFullscreen ? '100vw' : '100%', 
            height: isFullscreen ? '100vh' : '100%', 
            maxWidth: '100%', 
            maxHeight: '100%', 
            display: 'block', 
            filter: 'none',
            position: isFullscreen ? 'absolute' : 'relative',
            top: isFullscreen ? 0 : 'auto',
            left: isFullscreen ? 0 : 'auto'
          }}
        />
        <canvas
          ref={canvasRef}
          className="cursor-pointer m-0 p-0"
          style={{ 
            imageRendering: 'pixelated', 
            width: isFullscreen ? '100vw' : '100%', 
            height: isFullscreen ? '100vh' : '100%', 
            maxWidth: '100%', 
            maxHeight: '100%', 
            display: 'block', 
            filter: 'none',
            position: isFullscreen ? 'absolute' : 'relative',
            top: isFullscreen ? 0 : 'auto',
            left: isFullscreen ? 0 : 'auto'
          }}
        />
      </div>
    </div>
  );
}
