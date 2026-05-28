/**
 * Web Audio API Synthesis and Voice Coach Engine
 * Provides fully customizable procedural soundscapes for Beast Mode Timer.
 * Resilient against browser autoplay limitations.
 */

class AudioSynthEngine {
  private ctx: AudioContext | null = null;
  private workPulseIntervalId: any = null;
  private restSynthNodes: { oscs: OscillatorNode[]; filter: BiquadFilterNode; gain: GainNode } | null = null;
  private restAmbienceIntervalId: any = null;
  
  // Settings
  public isSoundEnabled: boolean = true;
  public isVoiceCoachEnabled: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Resume context if suspended (common browser restriction)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public speak(text: string) {
    if (!this.isVoiceCoachEnabled || !('speechSynthesis' in window)) return;
    try {
      // Cancel existing speech in queue to avoid lag
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Slightly peppier
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed', e);
    }
  }

  /**
   * Loud clear metallic bell/gong sound
   */
  public playGong() {
    if (!this.isSoundEnabled) return;
    this.initCtx();
    const ctx = this.ctx;
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Gong is a blend of frequencies that decay slowly
      const freqs = [180, 220, 275, 340, 440, 500];
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0, now);
      masterGain.gain.linearRampToValueAtTime(0.6, now + 0.05);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5); // 2.5 seconds decay
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 2.0);

      freqs.forEach((f, index) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        // Slightly detune or different wave types to make it rich
        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now);
        
        // Relative volume of harmonics
        oscGain.gain.setValueAtTime(1.0 / (index + 1), now);
        
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start(now);
        osc.stop(now + 2.5);
      });

      filter.connect(masterGain);
      masterGain.connect(ctx.destination);
    } catch (e) {
      console.warn('Gong synth failed to execute', e);
    }
  }

  /**
   * Active Pulse Sound (Work heartbeat synthesizer)
   * Plays a nice energetic synth bass drum / synth pulse on beat
   */
  public startWorkPulse(bpm: number = 110) {
    if (!this.isSoundEnabled) return;
    this.initCtx();
    this.stopWorkPulse(); // Clean up if any
    
    const intervalMs = (60 / bpm) * 1000;
    
    const playPulseBeat = () => {
      const ctx = this.ctx;
      if (!ctx || ctx.state === 'suspended') return;
      try {
        const now = ctx.currentTime;
        
        // Kick synthesis
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(130, now);
        // Exponentially sweep pitch down, simulating a bass kick or energetic synth beat
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.2);

        // Subtly play a tick at 2x tempo or alternative beats?
        // Let's just keep a driving, nice heartbeat.
      } catch (e) {
        console.warn('Pulse beat sound failed', e);
      }
    };

    // Trigger first beat immediately
    playPulseBeat();
    this.workPulseIntervalId = setInterval(playPulseBeat, intervalMs);
  }

  public stopWorkPulse() {
    if (this.workPulseIntervalId) {
      clearInterval(this.workPulseIntervalId);
      this.workPulseIntervalId = null;
    }
  }

  /**
   * Rest Ambience Sound (Soothing deep breath synth / meditation pad)
   * We synthesize slow sweeping peaceful chords with a low-pass filter mapping an inhale/exhale wave.
   */
  public startRestAmbience() {
    if (!this.isSoundEnabled) return;
    this.initCtx();
    this.stopRestAmbience();
    const ctx = this.ctx;
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Rest Ambience: We will run low frequency oscillators (LFO) of synth pads
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 1.0); // Fade in

      // Warm ambient chords notes: C2 (65.4Hz), G2 (98Hz), C3 (130.8Hz), E3 (164.8Hz)
      const pitches = [65.4, 98.0, 130.8, 164.8];
      const oscs: OscillatorNode[] = [];

      pitches.forEach((hz) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(hz, now);
        osc.connect(filter);
        osc.start(now);
        oscs.push(osc);
      });

      filter.connect(gain);
      gain.connect(ctx.destination);

      this.restSynthNodes = { oscs, filter, gain };

      // Recreate a rhythmic respiratory sweep (4 seconds cycle: 2s inhale, 2s exhale)
      let timeOffset = 0;
      const breathingModulation = () => {
        const activeCtx = this.ctx;
        if (!activeCtx || !this.restSynthNodes) return;
        try {
          const t = activeCtx.currentTime;
          
          // Smooth sweeping low-pass filter from 180Hz to 600Hz and back
          // Filter mimics breathing
          this.restSynthNodes.filter.frequency.cancelScheduledValues(t);
          this.restSynthNodes.filter.frequency.setValueAtTime(this.restSynthNodes.filter.frequency.value, t);
          this.restSynthNodes.filter.frequency.linearRampToValueAtTime(550, t + 2.0); // Inhale
          this.restSynthNodes.filter.frequency.linearRampToValueAtTime(180, t + 4.0); // Exhale

          this.restSynthNodes.gain.gain.cancelScheduledValues(t);
          this.restSynthNodes.gain.gain.setValueAtTime(this.restSynthNodes.gain.gain.value, t);
          this.restSynthNodes.gain.gain.linearRampToValueAtTime(0.14, t + 2.0);
          this.restSynthNodes.gain.gain.linearRampToValueAtTime(0.04, t + 4.0);
        } catch (e) {
          console.warn('Breathing modulation error', e);
        }
      };

      breathingModulation();
      this.restAmbienceIntervalId = setInterval(breathingModulation, 4000);
    } catch (e) {
      console.warn('Rest ambient sound failed', e);
    }
  }

  public stopRestAmbience() {
    if (this.restAmbienceIntervalId) {
      clearInterval(this.restAmbienceIntervalId);
      this.restAmbienceIntervalId = null;
    }
    if (this.restSynthNodes) {
      try {
        const now = this.ctx ? this.ctx.currentTime : 0;
        const nodes = this.restSynthNodes;
        
        // Fade out nicely
        if (this.ctx && now) {
          nodes.gain.gain.cancelScheduledValues(now);
          nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
          nodes.gain.gain.linearRampToValueAtTime(0.0, now + 0.5);
          setTimeout(() => {
            nodes.oscs.forEach(o => {
              try { o.stop(); } catch (e) {}
            });
          }, 600);
        } else {
          nodes.oscs.forEach(o => {
            try { o.stop(); } catch (e) {}
          });
        }
      } catch (e) {}
      this.restSynthNodes = null;
    }
  }

  /**
   * Final 5 seconds custom alert sound
   */
  public playCountdownBeep(num: number) {
    if (!this.isSoundEnabled) return;
    this.initCtx();
    const ctx = this.ctx;
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pitch: GO (num == 0) is higher and has longer ring than regular seconds 5,4,3,2,1
      osc.type = 'sine';
      osc.frequency.setValueAtTime(num === 0 ? 880 : 587.33, now); // A5 vs D5 (bell tones)

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (num === 0 ? 0.4 : 0.15));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + (num === 0 ? 0.45 : 0.2));
    } catch (e) {}
  }
}

export const audioSynth = new AudioSynthEngine();
