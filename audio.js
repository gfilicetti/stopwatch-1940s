/* ==========================================================================
   audio.js — Pure Web Audio API 1940s Mechanical Movement Synthesizer
   Zero external assets; all sound state lives purely in memory.
   ========================================================================== */

class MechanicalSoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.noiseBuffer = null;
  }

  ensureContext() {
    if (!this.enabled) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.noiseBuffer = this.createNoiseBuffer(0.08);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  createNoiseBuffer(durationSec) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.012));
    }
    return buffer;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
  }

  /* Crisp column-wheel crown actuation click-clack */
  playCrownClick(starting = true) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.triggerTransient(now, starting ? 2400 : 1950, 0.22, 0.025);
    this.triggerTransient(now + 0.028, starting ? 3400 : 2700, 0.14, 0.018);
  }

  /* Rattrapante pincer clamp click */
  playSplitClick() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.triggerTransient(now, 3100, 0.2, 0.02);
    this.triggerMetallicPing(now + 0.01, 4200, 0.05, 0.045);
  }

  /* Heart-cam flyback hammer reset snap */
  playResetSnap() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.triggerTransient(now, 1700, 0.25, 0.032);
    this.triggerTransient(now + 0.035, 2900, 0.18, 0.022);
    this.triggerMetallicPing(now + 0.036, 3650, 0.06, 0.065);
  }

  /* Subtle 5 Hz (18,000 vph) pallet-fork escapement tick-tock */
  playEscapementTick(isTock = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const centerFreq = isTock ? 4150 : 4650;
    this.triggerTransient(now, centerFreq, 0.042, 0.01);
  }

  triggerTransient(time, freq, gainPeak, duration) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, time);
    filter.Q.setValueAtTime(4.2, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(gainPeak, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start(time);
    src.stop(time + duration + 0.005);
  }

  triggerMetallicPing(time, freq, gainPeak, duration) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainPeak, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + duration + 0.005);
  }
}

window.MechanicalSoundEngine = MechanicalSoundEngine;
