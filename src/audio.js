// Snowy Escape — procedural audio: generative lofi music, layered ambience, synthesized SFX.
// Any file dropped into assets/audio/<name>.mp3 (e.g. sfx_step1.mp3, music_cabin.mp3) replaces the synth.
'use strict';

(function () {
  const A = (SE.audio = {});
  let ctx = null;
  let master, musicBus, ambBus, sfxBus, reverb, reverbSend;
  let noiseBuf, brownBuf;
  const files = {}; // optional decoded overrides

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function makeNoise(seconds, brown) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return b;
  }
  function makeImpulse(seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  A.unlock = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    // iPhone: play through the silent switch like a game, not like a ringtone
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    musicBus = ctx.createGain();
    ambBus = ctx.createGain();
    sfxBus = ctx.createGain();
    reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(3.2, 2.6);
    reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.55;
    reverbSend.connect(reverb).connect(master);
    musicBus.connect(master); ambBus.connect(master); sfxBus.connect(master);
    noiseBuf = makeNoise(3, false);
    brownBuf = makeNoise(4, true);
    A.applyVolumes();
    loadOverrides();
    if (A._pendingMusic !== undefined) A.setMusic(A._pendingMusic);
    if (A._pendingAmb) A.setAmbience(A._pendingAmb);
  };
  A.ready = () => !!ctx;

  A.applyVolumes = function () {
    if (!ctx) return;
    const s = SE.save.settings;
    const t = ctx.currentTime;
    musicBus.gain.setTargetAtTime(s.music * 0.5, t, 0.3);
    ambBus.gain.setTargetAtTime(s.ambience * 0.8, t, 0.3);
    sfxBus.gain.setTargetAtTime(s.sfx * 0.9, t, 0.05);
  };

  // -------------------------------------------------------------- file overrides
  // Recorded/generated sounds (tools/gen_sfx.py writes them with ElevenLabs) replace the synth:
  // assets/audio/index.json lists what exists, e.g. ["sfx_step1", "sfx_creak", "music_cabin"]; any
  // sfx_<name>.mp3 then plays instead of SFX[name] (footsteps pick one of sfx_step1..N at random).
  function loadOverrides() {
    if (location.protocol === 'file:') return;
    fetch('assets/audio/index.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        for (const name of list) {
          fetch('assets/audio/' + name + '.mp3')
            .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
            .then((ab) => ctx.decodeAudioData(ab))
            .then((buf) => { files[name] = buf; })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }
  function playFile(name, bus, gain = 1, rate = 1) {
    const buf = files[name];
    if (!buf) return false;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(bus);
    src.start();
    return src;
  }

  // -------------------------------------------------------------- building blocks
  function env(g, t, a, peak, d, sustain = 0.0001) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
  }
  function noiseBurst(t, dur, { type = 'bandpass', freq = 1000, q = 1, gain = 0.3, attack = 0.002, bus = sfxBus, freqEnd, brown, send = 0 } = {}) {
    const src = ctx.createBufferSource();
    src.buffer = brown ? brownBuf : noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = ctx.createGain();
    env(g, t, attack, gain, dur);
    src.connect(f).connect(g).connect(bus);
    if (send) { const s = ctx.createGain(); s.gain.value = send; g.connect(s).connect(reverbSend); }
    src.start(t, Math.random() * 2, dur + attack + 0.05);
    return g;
  }
  function tone(t, freq, dur, { type = 'sine', gain = 0.2, attack = 0.005, bus = sfxBus, freqEnd, send = 0, detune = 0 } = {}) {
    const o = ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = ctx.createGain();
    env(g, t, attack, gain, dur);
    o.connect(g).connect(bus);
    if (send) { const s = ctx.createGain(); s.gain.value = send; g.connect(s).connect(reverbSend); }
    o.start(t); o.stop(t + attack + dur + 0.05);
    return o;
  }

  // -------------------------------------------------------------- SFX
  const SFX = {
    step(t, opts = {}) {
      // a boot sinking into dry, cold snow: a dull compressing thump, then a dense burst of tiny
      // crystals breaking (the crunch), with the squeaky 'scrunch' of packed snow on top
      const deep = opts.deep ? 1.35 : 1, len = 0.16 * deep;
      noiseBurst(t, 0.11 * deep, { type: 'lowpass', freq: 320, gain: 0.55, attack: 0.008, brown: true });
      noiseBurst(t + 0.01, len, { type: 'bandpass', freq: 1100, freqEnd: 650, q: 0.9, gain: 0.16, attack: 0.012 });
      const grains = 22 + Math.floor(Math.random() * 14);
      for (let i = 0; i < grains; i++) {
        const k = Math.random();
        const gt = t + 0.008 + k * k * len; // most crystals break early in the step
        noiseBurst(gt, 0.006 + Math.random() * 0.016, { type: 'bandpass', freq: 1600 + Math.random() * 4200, q: 2.6, gain: 0.08 + Math.random() * 0.12 });
      }
      // the squeak of compressed snow (only in proper cold)
      if (Math.random() < 0.7) tone(t + 0.03, 1900 + Math.random() * 500, 0.07, { type: 'sawtooth', gain: 0.012, freqEnd: 1500 + Math.random() * 300 });
    },
    pop(t) { tone(t, 620, 0.07, { type: 'sine', gain: 0.12, freqEnd: 900 }); },
    chime(t) {
      [72, 76, 79, 84].forEach((n, i) => {
        tone(t + i * 0.09, midi(n), 1.4, { type: 'sine', gain: 0.09, send: 0.6 });
        tone(t + i * 0.09, midi(n) * 2.01, 0.6, { type: 'sine', gain: 0.025, send: 0.6 });
      });
    },
    bite(t) { tone(t, 1300, 0.12, { type: 'sine', gain: 0.12, freqEnd: 500 }); noiseBurst(t, 0.15, { type: 'highpass', freq: 2000, gain: 0.05 }); },
    splash(t) {
      noiseBurst(t, 0.55, { type: 'lowpass', freq: 3500, freqEnd: 300, gain: 0.3, attack: 0.005, send: 0.2 });
      for (let i = 0; i < 7; i++) tone(t + 0.05 + Math.random() * 0.4, 900 + Math.random() * 1600, 0.06, { gain: 0.04, freqEnd: 2600 });
    },
    reel(t) { for (let i = 0; i < 24; i++) noiseBurst(t + i * 0.045, 0.006, { type: 'highpass', freq: 3500, gain: 0.12 }); },
    click(t) { noiseBurst(t, 0.008, { type: 'highpass', freq: 3000, gain: 0.08 }); },
    chop(t) {
      noiseBurst(t, 0.07, { type: 'lowpass', freq: 900, gain: 0.45, brown: true });
      noiseBurst(t, 0.03, { type: 'bandpass', freq: 2600, q: 1.5, gain: 0.18 });
      tone(t, 180, 0.08, { gain: 0.15, freqEnd: 90 });
    },
    sizzle(t) {
      noiseBurst(t, 2.6, { type: 'highpass', freq: 4200, gain: 0.07, attack: 0.15 });
      for (let i = 0; i < 40; i++) noiseBurst(t + Math.random() * 2.4, 0.01, { type: 'highpass', freq: 3000, gain: 0.06 + Math.random() * 0.06 });
    },
    pour(t) {
      const g = noiseBurst(t, 1.7, { type: 'bandpass', freq: 380, freqEnd: 1300, q: 4, gain: 0.22, attack: 0.08 });
      for (let i = 0; i < 12; i++) tone(t + Math.random() * 1.5, 300 + Math.random() * 500, 0.05, { gain: 0.03, freqEnd: 700 });
      return g;
    },
    stir(t) { tone(t, 2800, 0.25, { gain: 0.05, send: 0.3 }); tone(t, 4150, 0.15, { gain: 0.02 }); },
    purr(t) {
      for (let k = 0; k < 3; k++) {
        const st = t + k * 0.9;
        const src = ctx.createBufferSource(); src.buffer = brownBuf;
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220;
        const am = ctx.createGain(); am.gain.value = 0;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 24 + Math.random() * 4;
        const lg = ctx.createGain(); lg.gain.value = 0.5;
        lfo.connect(lg).connect(am.gain);
        const g = ctx.createGain(); env(g, st, 0.25, 0.5, 0.6);
        src.connect(f).connect(am).connect(g).connect(sfxBus);
        src.start(st, Math.random(), 1.0); lfo.start(st); lfo.stop(st + 1.0);
      }
    },
    woof(t) {
      tone(t, 260, 0.22, { type: 'triangle', gain: 0.22, freqEnd: 140, attack: 0.01 });
      noiseBurst(t, 0.18, { type: 'bandpass', freq: 650, q: 3, gain: 0.18, attack: 0.01, freqEnd: 400 });
    },
    camera(t) {
      noiseBurst(t, 0.02, { type: 'highpass', freq: 2500, gain: 0.25 });
      noiseBurst(t + 0.07, 0.03, { type: 'highpass', freq: 1800, gain: 0.2 });
      noiseBurst(t + 0.1, 0.35, { type: 'bandpass', freq: 1500, freqEnd: 600, gain: 0.04 });
    },
    door(t) {
      const o = tone(t, 140, 0.7, { type: 'sawtooth', gain: 0.03, attack: 0.1, freqEnd: 190 });
      o.frequency.setValueCurveAtTime(new Float32Array([140, 170, 150, 190, 160]), t, 0.6);
      [88, 93].forEach((n, i) => tone(t + 0.25 + i * 0.12, midi(n), 1.2, { gain: 0.05, send: 0.5 }));
    },
    star(t) {
      tone(t, 1800, 1.2, { gain: 0.05, freqEnd: 600, send: 0.8 });
      [84, 88, 91, 96].forEach((n, i) => tone(t + 0.15 + i * 0.07, midi(n), 0.9, { gain: 0.03, send: 0.8 }));
    },
    jingle(t) {
      // happy little 'well done' tune: bouncy arpeggio + a warm closing chord
      const notes = [[72, 0], [76, 0.1], [79, 0.2], [84, 0.3], [81, 0.45], [84, 0.55]];
      for (const [n, d] of notes) {
        tone(t + d, midi(n), 0.35, { type: 'triangle', gain: 0.08, send: 0.4 });
        tone(t + d, midi(n) * 2, 0.2, { type: 'sine', gain: 0.025, send: 0.4 });
      }
      [72, 76, 79, 84].forEach((n) => tone(t + 0.7, midi(n), 1.3, { type: 'sine', gain: 0.05, send: 0.7 }));
      tone(t + 0.7, midi(60), 1.2, { type: 'triangle', gain: 0.06 });
      for (let i = 0; i < 5; i++) tone(t + 0.72 + i * 0.06, midi(96 + (i % 3) * 3), 0.25, { gain: 0.015, send: 0.9 });
    },
    soft(t) { tone(t, midi(76), 0.6, { gain: 0.05, send: 0.5 }); },
    // the chapel bell, a little way off: inharmonic partials with a long tail
    bell(t) {
      [[1, 0.07], [2.0, 0.035], [2.4, 0.03], [3.0, 0.02], [4.2, 0.012]].forEach(([k, g]) => tone(t, 220 * k, 3.2 / Math.sqrt(k), { type: 'sine', gain: g, send: 0.9, attack: 0.005 }));
    },
    whoosh(t) { noiseBurst(t, 0.6, { type: 'bandpass', freq: 400, freqEnd: 1800, q: 1.2, gain: 0.1, attack: 0.25 }); },
    // a knife scraping scales off a fish: quick rasping strokes
    scrape(t) {
      for (let i = 0; i < 3; i++) noiseBurst(t + i * 0.16, 0.12, { type: 'bandpass', freq: 2600, freqEnd: 4200, q: 3, gain: 0.09, attack: 0.01 });
    },
    // ---- cutscene sounds (sound carries the action while the picture stays still)
    creak(t) { // an old wooden door swinging open
      const o = tone(t, 120, 1.3, { type: 'sawtooth', gain: 0.045, attack: 0.15, freqEnd: 210 });
      o.frequency.setValueCurveAtTime(new Float32Array([120, 150, 132, 180, 160, 205, 190]), t, 1.2);
      noiseBurst(t, 1.2, { type: 'bandpass', freq: 900, q: 6, gain: 0.03, attack: 0.2 });
    },
    latch(t) { noiseBurst(t, 0.12, { type: 'lowpass', freq: 500, gain: 0.5, brown: true }); tone(t, 140, 0.15, { gain: 0.12, freqEnd: 70 }); noiseBurst(t + 0.02, 0.03, { type: 'highpass', freq: 2500, gain: 0.12 }); },
    stomp(t) { for (let i = 0; i < 2; i++) { noiseBurst(t + i * 0.32, 0.12, { type: 'lowpass', freq: 380, gain: 0.6, brown: true }); noiseBurst(t + i * 0.32 + 0.02, 0.22, { type: 'highpass', freq: 3000, gain: 0.06, attack: 0.01 }); } },
    icecrack(t) {
      noiseBurst(t, 0.04, { type: 'highpass', freq: 1800, gain: 0.35 });
      tone(t, 2400, 0.9, { type: 'sine', gain: 0.05, freqEnd: 300, send: 0.9 });
      tone(t + 0.05, 1600, 0.7, { type: 'sine', gain: 0.03, freqEnd: 180, send: 0.9 });
    },
    auger(t) { // a hand auger biting into thick ice: rhythmic grinding
      for (let i = 0; i < 6; i++) noiseBurst(t + i * 0.28, 0.24, { type: 'bandpass', freq: 700 + (i % 2) * 300, freqEnd: 1400, q: 2, gain: 0.16, attack: 0.04 });
    },
    rustle(t) { for (let i = 0; i < 9; i++) noiseBurst(t + Math.random() * 0.7, 0.05 + Math.random() * 0.08, { type: 'bandpass', freq: 2500 + Math.random() * 2500, q: 1.2, gain: 0.07 + Math.random() * 0.06 }); },
    twig(t) { noiseBurst(t, 0.025, { type: 'highpass', freq: 1200, gain: 0.45 }); noiseBurst(t + 0.03, 0.02, { type: 'bandpass', freq: 3000, q: 3, gain: 0.25 }); },
    match(t) { noiseBurst(t, 0.18, { type: 'bandpass', freq: 3500, freqEnd: 1800, q: 1.5, gain: 0.22, attack: 0.01 }); noiseBurst(t + 0.16, 0.7, { type: 'lowpass', freq: 900, gain: 0.12, attack: 0.05, brown: true }); },
    gust(t) { noiseBurst(t, 2.6, { type: 'bandpass', freq: 380, freqEnd: 900, q: 1.4, gain: 0.32, attack: 1.1 }); },
    sip(t) { noiseBurst(t, 0.35, { type: 'bandpass', freq: 900, freqEnd: 500, q: 3, gain: 0.08, attack: 0.08 }); },
  };
  const FILE_FOR = { pop: 'sfx_pop', chime: 'sfx_chime', splash: 'sfx_splash', reel: 'sfx_reel', chop: 'sfx_chop',
    sizzle: 'sfx_sizzle', pour: 'sfx_pour', purr: 'sfx_purr', woof: 'sfx_woof', camera: 'sfx_camera', door: 'sfx_door' };

  A.sfx = function (name, opts) {
    if (!ctx) return;
    if (name === 'step') {
      const steps = Object.keys(files).filter((k) => k.startsWith('sfx_step'));
      if (steps.length) return playFile(SE.pick(steps), sfxBus, opts && opts.deep ? 0.7 : 0.55, 0.92 + Math.random() * 0.14);
    } else if (name === 'wood') {
      const steps = Object.keys(files).filter((k) => k.startsWith('sfx_wood'));
      if (steps.length) return playFile(SE.pick(steps), sfxBus, 0.8, 0.94 + Math.random() * 0.12);
      return SFX.click(ctx.currentTime);
    } else {
      const f = files['sfx_' + name] ? 'sfx_' + name : FILE_FOR[name];
      if (f && files[f]) return playFile(f, sfxBus, 1, 0.97 + Math.random() * 0.06);
    }
    if (!SFX[name]) return;
    return SFX[name](ctx.currentTime + 0.005, opts);
  };

  // -------------------------------------------------------------- music
  const SONGS = {
    cabin: {
      title: 'Fireside', bpm: 68,
      chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59], [46, 50, 53, 57], [45, 48, 52, 55], [50, 53, 57, 60], [43, 47, 50, 53]],
      scale: [72, 74, 76, 79, 81, 84, 86, 88],
      voice: 'keys', density: 0.32, bars: 1,
    },
    outdoors: {
      title: 'Valley Air', bpm: 56,
      chords: [[45, 52, 57, 59, 64], [41, 48, 53, 57, 64], [48, 55, 60, 64, 67], [43, 50, 55, 59, 64]],
      scale: [69, 72, 74, 76, 79, 81, 84, 88],
      voice: 'pad', density: 0.18, bars: 2,
    },
    // the chapel: a slow, hymn-like progression with a bell now and then
    chapel: {
      title: 'Vespers', bpm: 48,
      chords: [[48, 55, 60, 64], [41, 53, 57, 60], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 62], [48, 52, 55, 60], [48, 55, 60, 64]],
      scale: [72, 74, 76, 79, 81, 84],
      voice: 'pad', density: 0.1, bars: 2,
    },
    // more of the same quiet music, so a long work or study session doesn't loop one song for hours
    cabin2: {
      title: 'Cocoa Steam', bpm: 70,
      chords: [[41, 56, 60, 63, 67], [46, 56, 62, 67], [39, 55, 58, 62, 65], [36, 51, 55, 58, 62], [44, 55, 60, 63, 67], [43, 53, 58, 62, 65], [41, 56, 60, 63, 65], [46, 56, 60, 63, 65]],
      scale: [75, 77, 79, 82, 84, 87],
      voice: 'keys', density: 0.26, bars: 1,
    },
    cabin3: {
      title: 'Snow on the Sill', bpm: 62,
      chords: [[45, 57, 60, 64, 67], [41, 57, 60, 64], [40, 55, 60, 64], [43, 55, 59, 64]],
      scale: [76, 79, 81, 84, 86, 88],
      voice: 'box', density: 0.12, bars: 2,
    },
    study: {
      title: 'Study Lamp', bpm: 76,
      chords: [[38, 54, 57, 61, 64], [35, 50, 54, 57, 61], [43, 54, 57, 59, 62], [45, 54, 59, 61, 64]],
      scale: [74, 76, 78, 81, 83, 86],
      voice: 'keys', density: 0.2, bars: 2,
    },
    outdoors2: {
      title: 'Pine Trail', bpm: 60,
      chords: [[38, 53, 57, 60, 64], [38, 55, 59, 62, 67], [41, 53, 57, 60, 64], [36, 52, 55, 57, 64]],
      scale: [74, 76, 77, 79, 81, 83, 86],
      voice: 'padarp', density: 0.14, bars: 2,
    },
    outdoors3: {
      title: 'Blue Hour', bpm: 50,
      chords: [[41, 53, 57, 60, 64, 71], [41, 55, 59, 62, 67], [40, 55, 59, 62, 64], [45, 55, 60, 64, 71]],
      scale: [72, 74, 76, 79, 83, 84],
      voice: 'pad', density: 0.12, bars: 2,
    },
    chapel2: {
      title: 'Candlelight', bpm: 46,
      chords: [[43, 55, 59, 62], [40, 55, 59, 64], [36, 55, 60, 64], [38, 54, 57, 62]],
      scale: [74, 79, 81, 83, 86],
      voice: 'box', density: 0.06, bars: 2,
    },
  };
  // each place has a little playlist; a song plays ~4 minutes, then the next one takes over on a bar line
  const PLAYLISTS = { cabin: ['cabin', 'cabin2', 'cabin3', 'study'], outdoors: ['outdoors', 'outdoors2', 'outdoors3'], chapel: ['chapel', 'chapel2'] };
  const TRACK_LEN = 240;
  let list = null, listIdx = 0, trackStart = 0, wantNext = false;
  let song = null, songName = null, nextBeat = 0, beat = 0, schedTimer = null, songGain = null, fileMusic = null;

  function keys(t, n, dur, vel) {
    const f = midi(n);
    const g = ctx.createGain();
    env(g, t, 0.006, 0.11 * vel, dur);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800 + vel * 900;
    const o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2; o2.detune.value = 4;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    o1.connect(lp); o2.connect(g2).connect(lp);
    lp.connect(g).connect(songGain);
    const s = ctx.createGain(); s.gain.value = 0.35; g.connect(s).connect(reverbSend);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  }
  function pad(t, n, dur, vel) {
    const f = midi(n);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035 * vel, t + dur * 0.4);
    g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.05);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.5;
    for (const d of [-7, 7]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d;
      o.connect(lp); o.start(t); o.stop(t + dur * 1.1);
    }
    lp.connect(g).connect(songGain);
    const s = ctx.createGain(); s.gain.value = 0.6; g.connect(s).connect(reverbSend);
  }
  function bell(t, n, vel) {
    tone(t, midi(n), 2.2, { gain: 0.06 * vel, bus: songGain, send: 0.9 });
    tone(t, midi(n) * 3.01, 0.8, { gain: 0.012 * vel, bus: songGain, send: 0.9 });
  }
  // a music box: soft high plinks with a quick decay
  function box(t, n, vel) {
    tone(t, midi(n), 1.4, { gain: 0.045 * vel, bus: songGain, send: 0.7 });
    tone(t, midi(n) * 2.0, 0.5, { gain: 0.012 * vel, bus: songGain, send: 0.7 });
  }
  function vinyl(t, len) {
    for (let i = 0; i < 6; i++) noiseBurst(t + Math.random() * len, 0.004, { type: 'highpass', freq: 2500, gain: 0.02 + Math.random() * 0.03, bus: songGain });
  }

  function schedule() {
    if (!song) return;
    const spb = 60 / song.bpm;
    while (nextBeat < ctx.currentTime + 0.4) {
      const t = nextBeat;
      const beatsPerChord = 4 * song.bars;
      const ci = Math.floor(beat / beatsPerChord) % song.chords.length;
      const chord = song.chords[ci];
      const inChord = beat % beatsPerChord;
      // the next song starts on the first beat of a new round of chords
      if (list && inChord === 0 && beat > 0 && (wantNext || (ci === 0 && ctx.currentTime - trackStart > TRACK_LEN))) {
        wantNext = false; listIdx = (listIdx + 1) % list.length; song = SONGS[list[listIdx]]; trackStart = ctx.currentTime; beat = 0;
        continue;
      }
      if (song.voice === 'box') {
        if (inChord === 0) { tone(t, midi(chord[0] - 12), spb * beatsPerChord, { gain: 0.05, bus: songGain, attack: 0.8 }); }
        // a slow arpeggio up and down the chord, two octaves up
        const up = chord.slice(1).concat(chord.slice(1, -1).reverse());
        box(t, up[inChord % up.length] + 12, 0.55 + Math.random() * 0.3);
        if (Math.random() < song.density) box(t + spb * 0.5, SE.pick(song.scale), 0.4);
      } else if (song.voice === 'keys') {
        if (inChord === 0) {
          keys(t, chord[0] - 12, spb * 3.5, 0.9);
          chord.forEach((n, i) => keys(t + i * 0.03 + 0.02, n, spb * 3.6, 0.6));
          vinyl(t, spb * 4);
        } else if (inChord === 2 && Math.random() < 0.6) {
          chord.slice(1).forEach((n, i) => keys(t + i * 0.025, n, spb * 1.8, 0.4));
        }
        for (const off of [0, 0.5]) {
          if (Math.random() < song.density) keys(t + off * spb + Math.random() * 0.02, SE.pick(song.scale), spb * 1.4, 0.5 + Math.random() * 0.4);
        }
      } else {
        if (song.voice === 'padarp') keys(t + 0.01, chord[1 + (inChord % (chord.length - 1))] + 12, spb * 1.6, 0.32);
        if (inChord === 0) {
          chord.forEach((n) => pad(t, n, spb * beatsPerChord, 1));
          tone(t, midi(chord[0] - 12), spb * beatsPerChord, { gain: 0.06, bus: songGain, attack: 1.5 });
        }
        if (Math.random() < song.density) bell(t + Math.random() * spb * 0.5, SE.pick(song.scale), 0.6 + Math.random() * 0.4);
      }
      beat++;
      nextBeat += spb;
    }
  }

  A.setMusic = function (name) {
    A._pendingMusic = name;
    if (!ctx || name === songName) return;
    songName = name;
    const t = ctx.currentTime;
    if (songGain) { const old = songGain; old.gain.setTargetAtTime(0, t, 0.8); setTimeout(() => old.disconnect(), 4000); }
    if (fileMusic) { const fm = fileMusic; fm.g.gain.setTargetAtTime(0, t, 0.8); setTimeout(() => fm.src.stop(), 4000); fileMusic = null; }
    clearInterval(schedTimer);
    song = null;
    if (!name) return;
    songGain = ctx.createGain();
    songGain.gain.setValueAtTime(0, t);
    songGain.gain.setTargetAtTime(1, t + 0.3, 1.2);
    songGain.connect(musicBus);
    const fname = 'music_' + name;
    if (files[fname]) {
      const src = ctx.createBufferSource(); src.buffer = files[fname]; src.loop = true;
      src.connect(songGain); src.start();
      fileMusic = { src, g: songGain };
      return;
    }
    list = PLAYLISTS[name] || null;
    listIdx = list ? Math.floor(Math.random() * list.length) : 0;
    song = SONGS[list ? list[listIdx] : name];
    trackStart = t;
    beat = 0;
    nextBeat = t + 0.5;
    schedTimer = setInterval(schedule, 120);
  };

  A.nextTrack = function () { if (list && list.length > 1) wantNext = true; };
  // name of what plays now (on the next bar after "next", it changes)
  A.trackTitle = () => (song && song.title) || '';
  A.playlistSize = () => (list ? list.length : 1);

  // -------------------------------------------------------------- ambience
  const amb = {}; // layer name -> {gain node, level}
  let ambTimer = null, ambState = {};

  function loopNoise(buf, filterType, freq, q) {
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q || 0.7;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(f).connect(g).connect(ambBus);
    src.start(0, Math.random() * 2);
    return { src, f, g };
  }
  // a recorded loop (assets/audio/amb_*.mp3) on the ambience bus, faded by its own gain
  function loopFile(name) {
    const src = ctx.createBufferSource(); src.buffer = files[name]; src.loop = true;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(g).connect(ambBus);
    src.start(0, Math.random() * Math.max(0.1, files[name].duration - 1));
    return { src, g };
  }
  function ensureLayers() {
    if (amb.wind) return;
    amb.wind = loopNoise(noiseBuf, 'bandpass', 500, 0.8);
    amb.windHi = loopNoise(noiseBuf, 'bandpass', 1400, 6);
    amb.rumble = loopNoise(brownBuf, 'lowpass', 300, 0.5);
    amb.fire = loopNoise(brownBuf, 'lowpass', 500, 0.6);
    ambTimer = setInterval(ambTick, 100);
  }
  // Gentle random modulation + sparse one-shot events (crackles, birds, ice creaks).
  function ambTick() {
    const t = ctx.currentTime;
    const s = ambState;
    const storm = s.storm || 0;
    const gust = 0.6 + 0.4 * Math.sin(t * 0.37) * Math.sin(t * 0.13 + 1) + storm * 0.3 * Math.sin(t * 0.9);
    const windLevel = (s.wind || 0) * gust * (s.muffled ? 0.35 : 1);
    // recorded wind and fire, once they have loaded (the synth stays for storms and as a fallback)
    if (files.amb_wind && !amb.windFile) amb.windFile = loopFile('amb_wind');
    if (files.amb_fire && !amb.fireFile) amb.fireFile = loopFile('amb_fire');
    if (amb.windFile) amb.windFile.g.gain.setTargetAtTime(windLevel * 0.9, t, 0.6);
    amb.wind.g.gain.setTargetAtTime(windLevel * 0.35 * (amb.windFile ? storm * 0.8 : 1), t, 0.4);
    amb.wind.f.frequency.setTargetAtTime((s.muffled ? 260 : 380) + gust * 380 + storm * 300, t, 0.6);
    amb.windHi.g.gain.setTargetAtTime(s.muffled ? 0 : storm * gust * 0.05 + (s.wind || 0) * 0.008, t, 0.5);
    amb.windHi.f.frequency.setTargetAtTime(1100 + gust * 900, t, 0.8);
    amb.rumble.g.gain.setTargetAtTime((storm * 0.25 + (s.wind || 0) * 0.05) * (s.muffled ? 0.5 : 1), t, 0.6);
    amb.fire.g.gain.setTargetAtTime(amb.fireFile ? 0 : (s.fire || 0) * 0.25, t, 0.4);
    if (amb.fireFile) amb.fireFile.g.gain.setTargetAtTime((s.fire || 0) * 0.85, t, 0.5);
    if (!amb.fireFile && s.fire && Math.random() < 0.35 * s.fire) {
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) noiseBurst(t + Math.random() * 0.1, 0.004 + Math.random() * 0.01, { type: 'highpass', freq: 1500 + Math.random() * 3000, gain: (0.05 + Math.random() * 0.15) * s.fire, bus: ambBus });
    }
    if (s.birds && Math.random() < 0.012 * s.birds) {
      const base = 2600 + Math.random() * 1400, c = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < c; i++) tone(t + i * 0.13, base, 0.09, { gain: 0.025 * s.birds, freqEnd: base * 1.35, bus: ambBus, send: 0.6 });
    }
    if (s.creaks && Math.random() < 0.004 * s.creaks) {
      tone(t, 220 + Math.random() * 120, 1.6, { type: 'sine', gain: 0.05 * s.creaks, freqEnd: 60, bus: ambBus, send: 0.9, attack: 0.05 });
    }
    if (s.chimes && Math.random() < 0.01 * s.chimes) bell(t, SE.pick([84, 86, 88, 91, 93]), 0.3);
    // when the wind really picks up it howls: a resonant gust that swoops up and falls away
    const W = SE.weather, howly = W ? Math.max(0, (W.wind - 25) / 45) : 0;
    if (howly > 0 && Math.random() < 0.016 * howly) {
      const k = Math.min(1.2, howly) * (s.muffled ? 0.4 : 1), f0 = 260 + Math.random() * 160;
      noiseBurst(t, 1.7, { type: 'bandpass', freq: f0, freqEnd: f0 * 2.2, q: 16, gain: 0.5 * k, attack: 0.7, bus: ambBus, send: 0.5 });
      noiseBurst(t + 1.6, 2.4, { type: 'bandpass', freq: f0 * 2.2, freqEnd: f0 * 0.85, q: 16, gain: 0.42 * k, attack: 0.05, bus: ambBus, send: 0.5 });
    }
  }
  // a few heavy steps across the floorboards (walking between rooms, into the chapel)
  A.woodSteps = function (n = 3) { for (let i = 0; i < n; i++) setTimeout(() => A.sfx('wood'), 60 + i * 420); };
  A.setAmbience = function (state) {
    A._pendingAmb = state;
    if (!ctx) return;
    ensureLayers();
    ambState = state;
  };

  // -------------------------------------------------------------- pour / sizzle loops for minigames
  A.loop = function (kind) {
    if (!ctx) return { set() {}, stop() {} };
    const l = kind === 'sizzle' ? loopNoise(noiseBuf, 'highpass', 4000, 0.7) : loopNoise(noiseBuf, 'bandpass', 420, 4);
    l.g.disconnect(); l.g.connect(sfxBus);
    l.g.gain.setTargetAtTime(kind === 'sizzle' ? 0.08 : 0.2, ctx.currentTime, 0.1);
    let crack = null;
    if (kind === 'sizzle') crack = setInterval(() => { if (Math.random() < 0.6) SFX.click(ctx.currentTime); }, 70);
    return {
      set(v) { if (kind === 'pour') l.f.frequency.setTargetAtTime(420 + v * 1200, ctx.currentTime, 0.1); },
      stop() {
        clearInterval(crack);
        l.g.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
        setTimeout(() => l.src.stop(), 600);
      },
    };
  };
})();
