export type SoundCue = 'click' | 'start' | 'success' | 'error';

/* Short synthesized square-wave blips — no audio files. [frequency Hz, seconds] */
const CUES: Record<SoundCue, Array<[number, number]>> = {
  click: [[880, 0.04]],
  start: [[523, 0.07], [784, 0.11]],
  success: [[523, 0.07], [659, 0.07], [784, 0.07], [1047, 0.14]],
  error: [[220, 0.1], [165, 0.14]]
};

let audioCtx: AudioContext | null = null;

export function playCue(cue: SoundCue) {
  if (typeof window === 'undefined') return;
  const Ctor = window.AudioContext ?? (window as unknown as {webkitAudioContext?: typeof AudioContext;}).webkitAudioContext;
  if (!Ctor) return;
  try {
    audioCtx = audioCtx ?? new Ctor();
    const ctx = audioCtx;
    let t = ctx.currentTime;
    CUES[cue].forEach(([freq, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.035, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
      t += dur * 0.9;
    });
  } catch {

    /* audio blocked or unavailable */}
}