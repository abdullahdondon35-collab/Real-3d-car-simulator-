// DriveZone 3D - Audio Engine (Procedural Web Audio API Synthesis)
class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.muted = false;

    // Engine sound nodes
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineGain = null;
    this.engineFilter = null;

    // Tire squeal nodes
    this.tireNoiseNode = null;
    this.tireGain = null;
    this.tireFilter = null;

    // Horn nodes
    this.hornOsc1 = null;
    this.hornOsc2 = null;
    this.hornGain = null;

    // Nitro sound
    this.nitroGain = null;
    this.nitroNoiseNode = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();

      // Master Compressor to prevent clipping
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);

      this.setupEngineSound();
      this.setupTireSound();
      this.setupNitroSound();
      this.initialized = true;
    } catch (e) {
      console.warn("WebAudio init error:", e);
    }
  }

  ensureRunning() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupEngineSound() {
    if (!this.ctx) return;
    // Dual sawtooth oscillators for aggressive engine rumble
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2.type = 'triangle';

    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);
    this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.compressor);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  setupTireSound() {
    if (!this.ctx) return;
    // White noise generator for tire friction
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.tireNoiseNode = this.ctx.createBufferSource();
    this.tireNoiseNode.buffer = noiseBuffer;
    this.tireNoiseNode.loop = true;

    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.setValueAtTime(950, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(5.0, this.ctx.currentTime);

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.tireNoiseNode.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.compressor);

    this.tireNoiseNode.start();
  }

  setupNitroSound() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.nitroNoiseNode = this.ctx.createBufferSource();
    this.nitroNoiseNode.buffer = noiseBuffer;
    this.nitroNoiseNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.nitroNoiseNode.connect(filter);
    filter.connect(this.nitroGain);
    this.nitroGain.connect(this.compressor);

    this.nitroNoiseNode.start();
  }

  updateEngine(rpmRatio, throttle, active = true) {
    if (!this.initialized || this.muted || !this.ctx) return;
    this.ensureRunning();

    if (!active) {
      this.engineGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.05);
      return;
    }

    // Base idle 50Hz, redline up to 360Hz
    const baseFreq = 48 + rpmRatio * 260;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.03);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, this.ctx.currentTime, 0.03);

    const filterFreq = 300 + rpmRatio * 1800 + (throttle > 0 ? 600 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.04);

    const targetGain = 0.15 + (throttle * 0.18) + (rpmRatio * 0.12);
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.04);
  }

  updateTireSqueal(slipIntensity) {
    if (!this.initialized || this.muted || !this.ctx) return;
    const gain = Math.min(Math.max((slipIntensity - 0.25) * 1.4, 0), 0.35);
    this.tireGain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.05);
  }

  setNitro(active) {
    if (!this.initialized || this.muted || !this.ctx) return;
    this.nitroGain.gain.setTargetAtTime(active ? 0.25 : 0.0, this.ctx.currentTime, 0.08);
  }

  playGearShift() {
    if (!this.initialized || this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playCrash(intensity = 1.0) {
    if (!this.initialized || this.muted || !this.ctx) return;
    this.ensureRunning();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.3);

    const crashGain = Math.min(0.4 * intensity, 0.6);
    gain.gain.setValueAtTime(crashGain, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  startHorn() {
    if (!this.initialized || this.muted || !this.ctx) return;
    this.ensureRunning();
    if (this.hornGain) return; // already sounding

    this.hornOsc1 = this.ctx.createOscillator();
    this.hornOsc2 = this.ctx.createOscillator();
    this.hornGain = this.ctx.createGain();

    this.hornOsc1.type = 'sawtooth';
    this.hornOsc2.type = 'sawtooth';
    // Dual automotive chord (F4 & A4)
    this.hornOsc1.frequency.setValueAtTime(370, this.ctx.currentTime);
    this.hornOsc2.frequency.setValueAtTime(440, this.ctx.currentTime);

    this.hornGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    this.hornOsc1.connect(filter);
    this.hornOsc2.connect(filter);
    filter.connect(this.hornGain);
    this.hornGain.connect(this.compressor);

    this.hornOsc1.start();
    this.hornOsc2.start();
  }

  stopHorn() {
    if (this.hornGain) {
      try {
        this.hornGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
        setTimeout(() => {
          if (this.hornOsc1) this.hornOsc1.stop();
          if (this.hornOsc2) this.hornOsc2.stop();
          this.hornOsc1 = null;
          this.hornOsc2 = null;
          this.hornGain = null;
        }, 60);
      } catch (e) {}
    }
  }

  playCoinSound() {
    if (!this.initialized || this.muted || !this.ctx) return;
    this.ensureRunning();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
    osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playClick() {
    if (!this.initialized || this.muted || !this.ctx) return;
    this.ensureRunning();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.engineGain) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.muted;
  }
}

window.audioManager = new AudioManager();
