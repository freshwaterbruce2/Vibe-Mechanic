/**
 * Web Audio API Synthesizer for Classic Vehicle Mechanical Failures
 * Fully client-side, self-contained, highly realistic synthesizers.
 */

let audioCtx: AudioContext | null = null;
let activeSource: { stop: () => void } | null = null;
let activeType: string | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Helper to generate white noise buffer
function createNoiseBuffer(ctx: AudioContext) {
  const bufferSize = ctx.sampleRate * 2; // 2 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * 1. Squealing Serpentine Belt
 * Synthesizes a high-pitched, piercing rubber slipping sound.
 */
function playBeltSqueal(ctx: AudioContext) {
  // We combine a high-pitched oscillator modulate with an LFO and a noise slide
  const osc = ctx.createOscillator();
  const oscLFO = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const mainGain = ctx.createGain();
  const noiseNode = ctx.createBufferSource();
  const noiseFilter = ctx.createBiquadFilter();
  const noiseGain = ctx.createGain();

  // Primary squeal oscillator (piercing)
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2400, ctx.currentTime);

  // Low frequency oscillator representing the belt rotational speed (slip modulation)
  oscLFO.type = 'triangle';
  oscLFO.frequency.setValueAtTime(14, ctx.currentTime); // ~14Hz rotational frequency
  lfoGain.gain.setValueAtTime(350, ctx.currentTime); // pitch mod depth

  // Connect LFO map to Primary frequency
  oscLFO.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  // Noise generator to simulate rubber sliding friction friction
  noiseNode.buffer = createNoiseBuffer(ctx);
  noiseNode.loop = true;

  // Highpass filter white noise to sound like a sliding hiss
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.setValueAtTime(3200, ctx.currentTime);

  noiseGain.gain.setValueAtTime(0.015, ctx.currentTime);

  // Combine systems
  mainGain.gain.setValueAtTime(0.08, ctx.currentTime);

  osc.connect(mainGain);
  noiseNode.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(mainGain);
  mainGain.connect(ctx.destination);

  // Start sound
  osc.start();
  oscLFO.start();
  noiseNode.start();

  return {
    stop: () => {
      try {
        osc.stop();
        oscLFO.stop();
        noiseNode.stop();
        osc.disconnect();
        oscLFO.disconnect();
        noiseNode.disconnect();
        mainGain.disconnect();
      } catch (e) {
        // Safe catch
      }
    }
  };
}

/**
 * 2. Metallic Ticking (Hydraulic Lifter / Valve Train Tick)
 * Synthesizes a sharp, repetitive metallic tick at normal engine idle speed.
 */
function playLifterTick(ctx: AudioContext) {
  let timerId: any = null;
  const bpm = 340; // 340 ticks per minute (~1130 RPM engine speed / 4 lifters relative frequency)
  const interval = 60 / bpm;

  const playTick = () => {
    const now = ctx.currentTime;
    
    // Very short high frequency metallic impulse
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.02);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.Q.setValueAtTime(5, now);

    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  };

  playTick();
  timerId = setInterval(playTick, interval * 1000);

  return {
    stop: () => {
      if (timerId) clearInterval(timerId);
    }
  };
}

/**
 * 3. Deep Engine Rod Knock
 * Synthesizes a heavy, low-pitched, rhythmic mechanical thud representing bearing tolerance knock.
 */
function playRodKnock(ctx: AudioContext) {
  let timerId: any = null;
  const bpm = 180; // Slow idle-like engine thud (180 knocks per minute)
  const interval = 60 / bpm;

  const playKnock = () => {
    const now = ctx.currentTime;
    
    // 1. Heavy low-frequency thump
    const oscThump = ctx.createOscillator();
    const thumpGain = ctx.createGain();

    oscThump.type = 'sine';
    oscThump.frequency.setValueAtTime(110, now);
    oscThump.frequency.exponentialRampToValueAtTime(45, now + 0.09);

    thumpGain.gain.setValueAtTime(0.65, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    oscThump.connect(thumpGain);
    thumpGain.connect(ctx.destination);

    // 2. High metallic impact click (bearing slop)
    const oscClick = ctx.createOscillator();
    const clickGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(800, now);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, now);
    filter.Q.setValueAtTime(3, now);

    clickGain.gain.setValueAtTime(0.12, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    oscClick.connect(filter);
    filter.connect(clickGain);
    clickGain.connect(ctx.destination);

    // Start
    oscThump.start(now);
    oscThump.stop(now + 0.1);
    
    oscClick.start(now);
    oscClick.stop(now + 0.1);
  };

  playKnock();
  timerId = setInterval(playKnock, interval * 1000);

  return {
    stop: () => {
      if (timerId) clearInterval(timerId);
    }
  };
}

/**
 * 4. Exhaust Rattle & Vibe
 * Synthesizes a thin, raspy, metallic buzzing vibration (loose heatshield/baffling).
 */
function playExhaustRattle(ctx: AudioContext) {
  const mainGain = ctx.createGain();
  const noiseNode = ctx.createBufferSource();
  const noiseFilter = ctx.createBiquadFilter();
  
  // High-frequency resonance oscillator to simulate metal shield rattle
  const resonanceOsc = ctx.createOscillator();
  const resGain = ctx.createGain();

  resonanceOsc.type = 'triangle';
  resonanceOsc.frequency.setValueAtTime(380, ctx.currentTime);

  noiseNode.buffer = createNoiseBuffer(ctx);
  noiseNode.loop = true;

  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(1200, ctx.currentTime);
  noiseFilter.Q.setValueAtTime(8, ctx.currentTime);

  // Fast LFO to modulate noise volume to simulate shaky metal vibrations
  const rattleMod = ctx.createOscillator();
  const modGain = ctx.createGain();
  rattleMod.type = 'sawtooth';
  rattleMod.frequency.setValueAtTime(32, ctx.currentTime); // ~32Hz vibration rate

  modGain.gain.setValueAtTime(0.18, ctx.currentTime);

  rattleMod.connect(modGain);
  // Connect mod to noise gain
  const noiseVolume = ctx.createGain();
  noiseVolume.gain.setValueAtTime(0.12, ctx.currentTime);
  modGain.connect(noiseVolume.gain);

  // Connections
  noiseNode.connect(noiseFilter);
  noiseFilter.connect(noiseVolume);

  // Put a bit of pitch modulation on the metal shield resonance
  const pitchLFO = ctx.createOscillator();
  const pitchGain = ctx.createGain();
  pitchLFO.type = 'sine';
  pitchLFO.frequency.setValueAtTime(45, ctx.currentTime);
  pitchGain.gain.setValueAtTime(25, ctx.currentTime);
  pitchLFO.connect(pitchGain);
  pitchGain.connect(resonanceOsc.frequency);

  resGain.gain.setValueAtTime(0.03, ctx.currentTime);

  mainGain.gain.setValueAtTime(0.35, ctx.currentTime);

  noiseVolume.connect(mainGain);
  resonanceOsc.connect(resGain);
  resGain.connect(mainGain);
  mainGain.connect(ctx.destination);

  // Start
  noiseNode.start();
  resonanceOsc.start();
  rattleMod.start();
  pitchLFO.start();

  return {
    stop: () => {
      try {
        noiseNode.stop();
        resonanceOsc.stop();
        rattleMod.stop();
        pitchLFO.stop();
        noiseNode.disconnect();
        resonanceOsc.disconnect();
        rattleMod.disconnect();
        pitchLFO.disconnect();
        mainGain.disconnect();
      } catch (e) {
        // Safe catch
      }
    }
  };
}

/**
 * Main sound controller export
 */
export const playSoundSimulation = (type: 'belt' | 'lifter' | 'rod' | 'exhaust') => {
  stopSoundSimulation();
  
  try {
    const ctx = getAudioContext();
    activeType = type;

    if (type === 'belt') {
      activeSource = playBeltSqueal(ctx);
    } else if (type === 'lifter') {
      activeSource = playLifterTick(ctx);
    } else if (type === 'rod') {
      activeSource = playRodKnock(ctx);
    } else if (type === 'exhaust') {
      activeSource = playExhaustRattle(ctx);
    }
    return true;
  } catch (error) {
    console.error("Failed to play mechanical audio simulation:", error);
    return false;
  }
};

export const stopSoundSimulation = () => {
  if (activeSource) {
    try {
      activeSource.stop();
    } catch (e) {
      console.warn("Error stopping audio source:", e);
    }
    activeSource = null;
    activeType = null;
  }
};

export const getActivePlayingType = () => activeType;
