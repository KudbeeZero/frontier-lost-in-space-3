/**
 * weaponSynth.ts — Web Audio API synthesizer for weapon feedback cues.
 * V22.1: COMBAT FEELS REAL LAYER
 *
 * All sounds are synthesized (no audio files needed).
 * AudioContext is lazily initialized on first user gesture.
 * All operations wrapped in try/catch — never throws.
 */

let _ctx: AudioContext | null = null;
let _initialized = false;

/** Must be called from a user gesture handler (pointerdown/touchstart). */
export function initAudio(): void {
  try {
    if (!_ctx) {
      _ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
    }
    if (_ctx.state === "suspended") {
      _ctx.resume();
    }
    _initialized = true;
  } catch {
    // Browser may block AudioContext creation
  }
}

function getCtx(): AudioContext | null {
  if (!_initialized || !_ctx) {
    // Attempt lazy init — may succeed if called from within user gesture
    try {
      if (!_ctx) {
        _ctx = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        )();
      }
      if (_ctx.state === "suspended") _ctx.resume();
      _initialized = true;
    } catch {
      return null;
    }
  }
  try {
    if (_ctx && _ctx.state === "suspended") {
      _ctx.resume();
    }
  } catch {
    /* ignore */
  }
  return _ctx;
}

/**
 * Soft sine hum near zone — intentLevel 1.
 * ~80Hz, ~150ms, very quiet (gain 0.04).
 */
export function playNearZone(): void {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.06);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    /* ignore */
  }
}

/**
 * Rising tone on dwell hold — intentLevel 2.
 * Frequency sweep 180→520Hz mapped to progress 0→1, ~80ms pulse.
 */
export function playHoldRise(progress: number): void {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const freq = 180 + (520 - 180) * Math.max(0, Math.min(1, progress));
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    /* ignore */
  }
}

/**
 * Lock click — intentLevel 3 / confirm.
 * Short sine burst 800Hz ~12ms, gain 0.08.
 */
export function playLockClick(): void {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.012);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.013);
  } catch {
    /* ignore */
  }
}

/**
 * Discharge burst on fire — per weapon type.
 * pulse: high-freq noise burst ~60ms
 * missile: low thud ~80ms
 * railgun: sharp crack ~40ms
 * emp: wide sweep down 600→100Hz ~100ms
 * All at gain ~0.1.
 */
export function playDischargeBurst(weaponType: string): void {
  try {
    const ctx = getCtx();
    if (!ctx) return;

    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    if (weaponType === "pulse") {
      const bufLen = Math.floor(ctx.sampleRate * 0.06);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
      }
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      src.buffer = buf;
      src.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      src.start(ctx.currentTime);
    } else if (weaponType === "missile") {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = "sine";
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    } else if (weaponType === "railgun") {
      const bufLen = Math.floor(ctx.sampleRate * 0.04);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(gain);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      src.start(ctx.currentTime);
    } else if (weaponType === "emp") {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.11);
    }
  } catch {
    /* ignore */
  }
}

// ─── WEAPON FIRE SOUNDS ────────────────────────────────────────────────────────

/**
 * playFire — distinct synthesized launch sound per weapon type.
 *
 * pulse:   200Hz sine burst, 80ms, moderate gain — clean energy pop
 * railgun: 800→200Hz sweep over 150ms — metallic crack / whip
 * missile: 60Hz low rumble + noise layer, 300ms fade — launch roar
 * emp:     50ms wide-band noise burst + 120Hz sine ring, 400ms total
 */
export function playFire(type: "pulse" | "railgun" | "missile" | "emp"): void {
  try {
    initAudio();
    const ctx = getCtx();
    if (!ctx) return;

    if (type === "pulse") {
      // Short 200Hz sine burst — clean energy discharge
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1800, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    } else if (type === "railgun") {
      // 800→200Hz sweep — high-pitch metallic crack
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const dist = ctx.createWaveShaper();
      // Soft saturation curve for metallic crunch
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = ((Math.PI + 200) * x) / (Math.PI + 200 * Math.abs(x));
      }
      dist.curve = curve;
      osc.connect(dist);
      dist.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.16);
    } else if (type === "missile") {
      // Low 60Hz rumble + noise — launch roar
      const rumble = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      rumble.connect(rumbleGain);
      rumbleGain.connect(ctx.destination);
      rumble.type = "sawtooth";
      rumble.frequency.setValueAtTime(60, ctx.currentTime);
      rumble.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
      rumbleGain.gain.setValueAtTime(0.2, ctx.currentTime);
      rumbleGain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.3,
      );
      rumble.start(ctx.currentTime);
      rumble.stop(ctx.currentTime + 0.31);

      // Noise layer
      const noiseLen = Math.floor(ctx.sampleRate * 0.3);
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] =
          (Math.random() * 2 - 1) * (1 - i / noiseData.length) ** 1.5;
      }
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "lowpass";
      noiseFilter.frequency.setValueAtTime(400, ctx.currentTime);
      const noiseGain = ctx.createGain();
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseGain.gain.setValueAtTime(0.14, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      noiseSrc.start(ctx.currentTime);
    } else if (type === "emp") {
      // 50ms noise burst + 120Hz ring tone
      const burstLen = Math.floor(ctx.sampleRate * 0.05);
      const burst = ctx.createBuffer(1, burstLen, ctx.sampleRate);
      const burstData = burst.getChannelData(0);
      for (let i = 0; i < burstData.length; i++) {
        burstData[i] = Math.random() * 2 - 1;
      }
      const burstSrc = ctx.createBufferSource();
      burstSrc.buffer = burst;
      const burstGain = ctx.createGain();
      burstSrc.connect(burstGain);
      burstGain.connect(ctx.destination);
      burstGain.gain.setValueAtTime(0.22, ctx.currentTime);
      burstGain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.05,
      );
      burstSrc.start(ctx.currentTime);

      // 120Hz ring tail
      const ring = ctx.createOscillator();
      const ringGain = ctx.createGain();
      ring.connect(ringGain);
      ringGain.connect(ctx.destination);
      ring.type = "sine";
      ring.frequency.setValueAtTime(120, ctx.currentTime + 0.05);
      ringGain.gain.setValueAtTime(0, ctx.currentTime);
      ringGain.gain.setValueAtTime(0.14, ctx.currentTime + 0.05);
      ringGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      ring.start(ctx.currentTime + 0.05);
      ring.stop(ctx.currentTime + 0.41);
    }
  } catch {
    /* ignore */
  }
}

/**
 * playMissileWind — continuous low 40Hz hum while missile is in flight.
 * Call once on launch; auto-fades after 2s.
 */
export function playMissileWind(): void {
  try {
    initAudio();
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(40, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(28, ctx.currentTime + 1.8);

    // Ramp in, hold, ramp out
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.05);
  } catch {
    /* ignore */
  }
}

/**
 * playImpact — sound when projectile hits target.
 *
 * pulse:   300Hz pop, 60ms
 * railgun: metallic 'ping' 600Hz decay, 200ms
 * missile: explosion — noise burst + 80Hz bass, 500ms
 * emp:     crackle + static, 400ms
 */
export function playImpact(
  type: "pulse" | "railgun" | "missile" | "emp",
): void {
  try {
    initAudio();
    const ctx = getCtx();
    if (!ctx) return;

    if (type === "pulse") {
      // 300Hz pop, 60ms
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.07);
    } else if (type === "railgun") {
      // Metallic ping — 600Hz ring decay 200ms
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);

      // High crack layer
      const crackLen = Math.floor(ctx.sampleRate * 0.025);
      const crackBuf = ctx.createBuffer(1, crackLen, ctx.sampleRate);
      const crackData = crackBuf.getChannelData(0);
      for (let i = 0; i < crackData.length; i++) {
        crackData[i] =
          (Math.random() * 2 - 1) * (1 - i / crackData.length) ** 2;
      }
      const crackSrc = ctx.createBufferSource();
      crackSrc.buffer = crackBuf;
      const crackGain = ctx.createGain();
      crackSrc.connect(crackGain);
      crackGain.connect(ctx.destination);
      crackGain.gain.setValueAtTime(0.25, ctx.currentTime);
      crackSrc.start(ctx.currentTime);
    } else if (type === "missile") {
      // Explosion — wide noise burst + deep bass thud
      const noiseLen = Math.floor(ctx.sampleRate * 0.5);
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] =
          (Math.random() * 2 - 1) * (1 - i / noiseData.length) ** 1.2;
      }
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "lowpass";
      noiseFilter.frequency.setValueAtTime(1800, ctx.currentTime);
      const noiseGain = ctx.createGain();
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseGain.gain.setValueAtTime(0.28, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      noiseSrc.start(ctx.currentTime);

      // Bass thud
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.connect(bassGain);
      bassGain.connect(ctx.destination);
      bass.type = "sine";
      bass.frequency.setValueAtTime(80, ctx.currentTime);
      bass.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
      bassGain.gain.setValueAtTime(0.32, ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      bass.start(ctx.currentTime);
      bass.stop(ctx.currentTime + 0.46);
    } else if (type === "emp") {
      // Crackle static burst — 400ms
      const crackLen = Math.floor(ctx.sampleRate * 0.4);
      const crackBuf = ctx.createBuffer(1, crackLen, ctx.sampleRate);
      const crackData = crackBuf.getChannelData(0);
      for (let i = 0; i < crackData.length; i++) {
        // Intermittent crackle pattern
        const t = i / ctx.sampleRate;
        const envelope = (1 - t / 0.4) ** 0.8;
        const crackle = Math.random() < 0.15 ? Math.random() * 2 - 1 : 0;
        crackData[i] = crackle * envelope;
      }
      const crackSrc = ctx.createBufferSource();
      crackSrc.buffer = crackBuf;
      const crackFilter = ctx.createBiquadFilter();
      crackFilter.type = "bandpass";
      crackFilter.frequency.setValueAtTime(3000, ctx.currentTime);
      crackFilter.Q.setValueAtTime(0.8, ctx.currentTime);
      const crackGain = ctx.createGain();
      crackSrc.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(ctx.destination);
      crackGain.gain.setValueAtTime(0.22, ctx.currentTime);
      crackSrc.start(ctx.currentTime);

      // Low hum undertone
      const hum = ctx.createOscillator();
      const humGain = ctx.createGain();
      hum.connect(humGain);
      humGain.connect(ctx.destination);
      hum.type = "sine";
      hum.frequency.setValueAtTime(55, ctx.currentTime);
      humGain.gain.setValueAtTime(0.12, ctx.currentTime);
      humGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      hum.start(ctx.currentTime);
      hum.stop(ctx.currentTime + 0.36);
    }
  } catch {
    /* ignore */
  }
}
