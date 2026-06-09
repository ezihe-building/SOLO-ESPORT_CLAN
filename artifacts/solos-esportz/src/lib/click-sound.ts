// Global CODM-style UI click sound — Web Audio API (no file needed, instant, offline)
let audioCtx: AudioContext | null = null;
let globalMuted = false;
let globalVolume = 0.35;

function ensureAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playClickSound() {
  if (globalMuted) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Create a crisp metallic click with noise + short envelope
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / (bufferSize * 0.15));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(0.6 * globalVolume, now + 0.005);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(3500, now);
  bandpass.Q.setValueAtTime(1.2, now);

  const clickOsc = ctx.createOscillator();
  clickOsc.type = "square";
  clickOsc.frequency.setValueAtTime(1200, now);
  clickOsc.frequency.exponentialRampToValueAtTime(600, now + 0.03);

  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0, now);
  clickGain.gain.linearRampToValueAtTime(0.25 * globalVolume, now + 0.003);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.08);
  clickOsc.start(now);
  clickOsc.stop(now + 0.06);
}

export function useClickSound() {
  return { playClickSound };
}

export function initGlobalClickSound() {
  if (typeof window === "undefined") return;

  const isClickable = (el: HTMLElement): boolean => {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role");
    const clickable =
      tag === "button" ||
      tag === "a" ||
      tag === "label" ||
      tag === "summary" ||
      role === "button" ||
      role === "link" ||
      role === "tab" ||
      el.closest("button") ||
      el.closest("a") ||
      el.closest("[role='button']") ||
      el.closest("[role='link']");
    if (!clickable) return false;
    // Skip text inputs and their labels
    const editable = el.closest("input, textarea, [contenteditable='true']");
    if (editable && (editable.tagName === "INPUT" || editable.tagName === "TEXTAREA")) {
      // Allow if the click is on the actual button element itself
      if (tag === "button") return true;
      return false;
    }
    return true;
  };

  const onPointerDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement;
    if (isClickable(target)) {
      playClickSound();
    }
  };

  document.addEventListener("pointerdown", onPointerDown, { passive: true });
  return () => {
    document.removeEventListener("pointerdown", onPointerDown);
  };
}

export { globalVolume, globalMuted };
