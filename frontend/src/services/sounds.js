/**
 * Sound effects using Web Audio API — no external files needed.
 */
const ctx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

// Keep track of last play time to avoid audio spam
let lastPlay = 0;
let _muted = false;
let _volume = 0.15; // global volume multiplier

export const setMuted = (val) => { _muted = val; };
export const isMuted = () => _muted;
export const setVolume = (val) => { _volume = Math.max(0, Math.min(1, val)); };
export const getVolume = () => _volume;

const play = (freq, duration, type = 'sine', volume = 0.15) => {
  if (!ctx || _muted) return;
  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();

  const now = Date.now();
  if (now - lastPlay < 80) return; // debounce
  lastPlay = now;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume * _volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
};

export const playMove = () => {
  play(200, 0.15, 'square', 0.08);
};

export const playCapture = () => {
  play(300, 0.12, 'sawtooth', 0.12);
  setTimeout(() => play(180, 0.15, 'square', 0.10), 80);
};

export const playCheck = () => {
  play(600, 0.1, 'square', 0.1);
  setTimeout(() => play(750, 0.15, 'square', 0.12), 100);
};

export const playGameStart = () => {
  play(330, 0.1, 'sine', 0.08);
  setTimeout(() => play(440, 0.1, 'sine', 0.08), 120);
  setTimeout(() => play(550, 0.15, 'sine', 0.10), 240);
};

export const playGameOver = () => {
  play(440, 0.15, 'sine', 0.1);
  setTimeout(() => play(350, 0.15, 'sine', 0.1), 150);
  setTimeout(() => play(280, 0.2, 'sine', 0.12), 300);
  setTimeout(() => play(220, 0.3, 'sine', 0.15), 500);
};

export const playNotify = () => {
  play(500, 0.08, 'sine', 0.08);
  setTimeout(() => play(600, 0.12, 'sine', 0.1), 100);
};
