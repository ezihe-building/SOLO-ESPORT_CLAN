// Global CODM-style UI click sound — Web Audio API (no file needed, instant, offline)
let audioCtx: AudioContext | null = null;
let globalMuted = false;
let globalVolume = 1.0;

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
  const vol = globalVolume;

  // HIGH-IMPACT CODM-STYLE UI CLICK
  // Layer 1: Sharp filtered noise burst (metallic snap)
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, Math.floor(bufferSize), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(Math.max(0, 1 - i / (bufferSize * 0.08)), 3);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(0.9 * vol, now + 0.002);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(5000, now);
  bandpass.Q.setValueAtTime(2.0, now);

  // Layer 2: Short punchy sine click (body)
  const clickOsc = ctx.createOscillator();
  clickOsc.type = "sine";
  clickOsc.frequency.setValueAtTime(1800, now);
  clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0, now);
  clickGain.gain.linearRampToValueAtTime(0.7 * vol, now + 0.001);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  // Layer 3: High freq tick (crisp top)
  const tickOsc = ctx.createOscillator();
  tickOsc.type = "triangle";
  tickOsc.frequency.setValueAtTime(8000, now);
  tickOsc.frequency.exponentialRampToValueAtTime(4000, now + 0.015);

  const tickGain = ctx.createGain();
  tickGain.gain.setValueAtTime(0, now);
  tickGain.gain.linearRampToValueAtTime(0.4 * vol, now + 0.001);
  tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  // Master compressor for punch
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.setValueAtTime(-10, now);
  comp.ratio.setValueAtTime(4, now);
  comp.attack.setValueAtTime(0.001, now);
  comp.release.setValueAtTime(0.01, now);

  // Connect everything
  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(comp);

  clickOsc.connect(clickGain);
  clickGain.connect(comp);

  tickOsc.connect(tickGain);
  tickGain.connect(comp);

  comp.connect(ctx.destination);

  // Start
  noise.start(now);
  noise.stop(now + 0.05);
  clickOsc.start(now);
  clickOsc.stop(now + 0.05);
  tickOsc.start(now);
  tickOsc.stop(now + 0.03);
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
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      tag === "video" ||
      tag === "img" ||
      role === "button" ||
      role === "link" ||
      role === "tab" ||
      el.closest("button") ||
      el.closest("a") ||
      el.closest("[role='button']") ||
      el.closest("[role='link']") ||
      el.closest(".clickable") ||
      el.closest("[data-clickable]");
    if (!clickable) return false;
    return true;
  };

  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (isClickable(target)) {
      playClickSound();
    }
  };

  document.addEventListener("click", onClick, { passive: true });
  return () => {
    document.removeEventListener("click", onClick);
  };
}

export { globalVolume, globalMuted };
