/**
 * Короткие звуки при правильном/неправильном ответе и достижении цели.
 * Web Audio API — без внешних файлов.
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

function beep(frequency: number, durationMs: number, type: OscillatorType = 'sine', volume = 0.15): void {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // ignore
  }
}

/** Звук при правильном ответе */
export function playCorrect(): void {
  beep(523, 80, 'sine');
  setTimeout(() => beep(659, 80, 'sine'), 90);
}

/** Звук при ошибке */
export function playWrong(): void {
  beep(200, 120, 'sawtooth', 0.12);
}

/** Звук при достижении дневной цели */
export function playGoal(): void {
  beep(523, 100, 'sine');
  setTimeout(() => beep(659, 100, 'sine'), 110);
  setTimeout(() => beep(784, 100, 'sine'), 220);
  setTimeout(() => beep(1047, 180, 'sine'), 330);
}
