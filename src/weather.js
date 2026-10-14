// Snowy Escape — world simulation: continuous snowfall, shifting wind, sunny spells, storms,
// an in-game day/night clock, snow piling up by the cabin and the fire slowly burning down.
'use strict';

(function () {
  // Snow never fully stops; what changes is how much, how windy, and whether the sun is out.
  const MODES = {
    sunny: { intensity: 0.035, wind: 4, fog: 0, sun: 1, label: 'Sunny spell', icon: 'sun' },
    calm: { intensity: 0.4, wind: 7, fog: 0, sun: 0, label: 'Gentle snow', icon: 'snow' },
    snowy: { intensity: 0.78, wind: 12, fog: 0.04, sun: 0, label: 'Heavy snowfall', icon: 'snow' },
    windy: { intensity: 0.66, wind: 42, fog: 0.08, sun: 0, label: 'Windy', icon: 'snow' },
    storm: { intensity: 1, wind: 72, fog: 0.24, sun: 0, label: 'Snowstorm', icon: 'snow' },
  };
  // Plausible transitions: weather builds up and calms down gradually.
  const NEXT = {
    sunny: [['calm', 0.7], ['sunny', 0.3]],
    calm: [['sunny', 0.3], ['snowy', 0.4], ['windy', 0.2], ['calm', 0.1]],
    snowy: [['calm', 0.35], ['windy', 0.35], ['storm', 0.2], ['snowy', 0.1]],
    windy: [['storm', 0.35], ['snowy', 0.35], ['calm', 0.3]],
    storm: [['windy', 0.5], ['snowy', 0.5]],
  };
  const MAX = 1200;
  const W = (SE.weather = {
    MODES, mode: 'calm', intensity: 0.4, wind: 7, fog: 0, sun: 0, gust: 0, timer: 150, flakes: [], saveT: 0,
  });

  for (let i = 0; i < MAX; i++) W.flakes.push(newFlake(true));
  function newFlake(anywhere) {
    const z = Math.random();
    return { x: Math.random() * (SE.W + 120) - 60, y: anywhere ? Math.random() * SE.H : -4 - Math.random() * 20, z, phase: Math.random() * Math.PI * 2, wob: 0.6 + Math.random() * 1.4 };
  }

  W.stormy = () => W.mode === 'storm';
  W.set = function (mode, silent) {
    if (!MODES[mode] || mode === W.mode) return;
    const prev = W.mode;
    W.mode = mode;
    W.timer = mode === 'storm' ? SE.rand(120, 210) : SE.rand(150, 300);
    if (SE.save) { SE.save.weather = mode; }
    if (silent) return;
    if (mode === 'storm') SE.toast('A snowstorm rolls in. Time to stay cozy inside.', '#cfe6ff');
    else if (prev === 'storm') SE.toast('The storm is calming down. Fresh snow everywhere!', '#cfe6ff');
    else if (mode === 'sunny') SE.toast('The sun breaks through the clouds. Everything sparkles.', '#ffe6b8');
    else if (mode === 'windy') SE.toast('The wind is picking up…', '#cfe6ff');
    else if (prev === 'windy') SE.toast('The wind calms down.', '#cfe6ff');
    else SE.toast(MODES[mode].label + '.', '#cfe6ff');
    if (mode === 'storm') W.stormCheck();
  };
  function autoNext() {
    const opts = NEXT[W.mode];
    let r = Math.random(), acc = 0;
    for (const [m, p] of opts) { acc += p; if (r <= acc) return m; }
    return 'calm';
  }

  // ------------------------------------------------------------ clock (1 real minute = 1 game hour)
  W.HOURS_PER_SEC = 1 / 60;
  W.hour = function () {
    const pref = SE.save.settings.time || 'cycle';
    if (pref === 'live') { const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
    if (pref === 'day') return 12;
    if (pref === 'dusk') return 16.6;
    if (pref === 'night') return 23;
    return SE.save.clock;
  };
  // 0 = full day, 1 = deep night. Deep winter in the mountains: the sun is late and leaves
  // early, with a smooth dawn (6:30-8:30) and dusk (15:45-18:00); by early evening it is night.
  W.night = function () {
    const h = W.hour();
    if (h >= 18 || h < 6.5) return 1;
    if (h >= 15.75) return SE.ease((h - 15.75) / 2.25);
    if (h < 8.5) return 1 - SE.ease((h - 6.5) / 2);
    return 0;
  };
  // golden light around sunrise and sunset
  W.golden = function () {
    const h = W.hour();
    const g = (c) => Math.max(0, 1 - Math.abs(h - c) / 1.6);
    return Math.max(g(8.2), g(16));
  };
  W.phase = function () {
    const n = W.night(), h = W.hour();
    if (n > 0.8) return 'night';
    if (n > 0.15) return h < 12 ? 'dawn' : 'dusk';
    return 'day';
  };
  W.clockLabel = function () {
    const h = W.hour();
    const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm - (mm % 10)).padStart(2, '0')}`;
  };

  // ------------------------------------------------------------ update
  W.update = function (dt) {
    const sv = SE.save;
    const setting = sv.settings.weather;
    if (setting !== 'auto' && MODES[setting] && W.mode !== setting) W.set(setting, true);
    if (setting === 'auto') {
      W.timer -= dt;
      if (W.timer <= 0) W.set(autoNext());
    }
    const m = MODES[W.mode];
    W.intensity = SE.approach(W.intensity, m.intensity, 0.2, dt);
    W.wind = SE.approach(W.wind, m.wind, 0.25, dt);
    W.fog = SE.approach(W.fog, m.fog, 0.25, dt);
    W.sun = SE.approach(W.sun, m.sun * (1 - W.night()), 0.3, dt);
    W.gust = Math.sin(SE.time * 0.7) * Math.sin(SE.time * 0.23 + 2) * (W.wind * 0.6);

    // time flows, snow piles up (or melts a little in the sun), the fire burns down
    const prevH = sv.clock;
    sv.clock = (sv.clock + dt * W.HOURS_PER_SEC) % 24;
    if (sv.clock < prevH - 12) { sv.day++; SE.toast(`Day ${sv.day}. A new morning in the mountains.`, '#ffe6b8'); }
    sv.snowDepth = SE.clamp(sv.snowDepth + (W.intensity * 0.0009 - W.sun * 0.0004) * dt, 0, 1);
    sv.fire = SE.clamp(sv.fire - dt / (35 * 60), 0, 1);
    sv.stove = SE.clamp(sv.stove - dt / (25 * 60), 0, 1);
    W.saveT += dt;
    if (W.saveT > 10) { W.saveT = 0; SE.persist(); }
  };
  // Catch up a little on time spent away (capped so you never come back to chaos).
  W.catchUp = function () {
    const sv = SE.save;
    if (sv.lastSeen) {
      const away = SE.clamp((Date.now() - sv.lastSeen) / 1000, 0, 4 * 3600);
      sv.snowDepth = SE.clamp(sv.snowDepth + away * 0.00008, 0, 0.8);
      sv.fire = SE.clamp(sv.fire - away / (60 * 60), 0.15, 1);
      sv.stove = SE.clamp(sv.stove - away / (60 * 60), 0, 1);
    }
    W.mode = MODES[sv.weather] ? sv.weather : 'calm';
    if (W.mode === 'storm') W.mode = 'windy';
    const m = MODES[W.mode];
    W.intensity = m.intensity; W.wind = m.wind; W.fog = m.fog; W.sun = m.sun;
  };

  // ------------------------------------------------------------ drawing
  // opts: clip {x,y,w,h}|[...] (draw only inside, e.g. windows), density, windScale, alpha, speed
  W.draw = function (ctx, opts = {}) {
    // the flakes move once per frame, however many times they are drawn (scene, windows, cutscene)
    const dt = opts.frozen || W._drawnAt === SE.time ? 0 : SE.dt;
    W._drawnAt = SE.time;
    const count = Math.floor(MAX * W.intensity * (opts.density || 1));
    const speed = opts.speed || 1;
    const wind = (W.wind + W.gust) * (opts.windScale == null ? 1 : opts.windScale);
    ctx.save();
    if (opts.clip) {
      ctx.beginPath();
      for (const r of [].concat(opts.clip)) ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
    }
    const streaks = W.wind > 30;
    const nightDim = 1 - W.night() * 0.35;
    for (let i = 0; i < count; i++) {
      const f = W.flakes[i];
      const fall = (10 + f.z * 26) * speed * (1 + (W.wind > 30 ? 0.4 : 0));
      f.y += fall * dt;
      f.x += (wind * (0.4 + f.z) + Math.sin(SE.time * f.wob + f.phase) * 6) * dt;
      if (f.y > SE.H + 4 || f.x > SE.W + 70 || f.x < -70) Object.assign(f, newFlake(false), { x: wind > 20 ? Math.random() * SE.W * 1.4 - SE.W * 0.5 : Math.random() * (SE.W + 120) - 60 });
      const a = (0.35 + f.z * 0.65) * (opts.alpha || 1) * nightDim;
      ctx.fillStyle = f.z > 0.7 ? `rgba(255,255,255,${a})` : `rgba(226,236,255,${a})`;
      const x = Math.round(f.x), y = Math.round(f.y);
      if (streaks && f.z > 0.4 && !opts.clip) ctx.fillRect(x, y, 2 + Math.round(f.z * 3 * (W.wind / 50)), 1);
      else if (f.z > 0.82) ctx.fillRect(x, y, 2, 2);
      else ctx.fillRect(x, y, 1, 1);
    }
    if (W.fog > 0.01 && !opts.clip) {
      const pulse = W.fog * (0.75 + 0.25 * Math.sin(SE.time * 0.8));
      const g = ctx.createLinearGradient(0, 0, 0, SE.H);
      const c = W.night() > 0.5 ? '170,180,215' : '230,238,255';
      g.addColorStop(0, `rgba(${c},${pulse * 0.9})`);
      g.addColorStop(1, `rgba(${c},${pulse * 0.4})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SE.W, SE.H);
    }
    ctx.restore();
  };

  // Outdoor light: night blue, golden hour, grey storms, warm sun. strength scales everything.
  W.tint = function (ctx, strength = 1) {
    const n = W.night(), gold = W.golden(), storm = W.fog;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    if (gold > 0.01) { ctx.fillStyle = `rgba(255,190,160,${0.45 * gold * strength})`; ctx.fillRect(0, 0, SE.W, SE.H); }
    if (n > 0.01) { ctx.fillStyle = `rgba(36,44,104,${Math.min(0.92, n * strength * 1.1)})`; ctx.fillRect(0, 0, SE.W, SE.H); }
    // deep night is properly dark: only moonlit snow, lit windows and fires stay readable
    if (n > 0.5) { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(4,6,18,${0.55 * (n - 0.5) * 2 * strength})`; ctx.fillRect(0, 0, SE.W, SE.H); }
    if (storm > 0.05) { ctx.fillStyle = `rgba(150,158,180,${storm * 1.2 * strength})`; ctx.fillRect(0, 0, SE.W, SE.H); }
    ctx.restore();
  };
  // Stars over the sky band at night.
  const STARS = Array.from({ length: 70 }, () => ({ x: Math.random() * SE.W, y: Math.random(), p: Math.random() * 6 }));
  W.stars = function (ctx, skyH = 90) {
    const n = W.night() * (1 - W.fog * 3);
    if (n < 0.05) return;
    for (const s of STARS) {
      const a = n * (0.35 + 0.35 * Math.sin(SE.time * 1.4 + s.p));
      ctx.fillStyle = `rgba(255,250,230,${a})`;
      ctx.fillRect(Math.round(s.x), Math.round(s.y * skyH), 1, 1);
    }
  };
  // Sunbeams and glittering snow during sunny spells.
  W.sunshine = function (ctx, groundY = 200) {
    if (W.sun < 0.05) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const x = 60 + i * 120 + Math.sin(SE.time * 0.1 + i) * 10;
      const g = ctx.createLinearGradient(x, 0, x + 80, SE.H);
      g.addColorStop(0, `rgba(255,236,190,${0.1 * W.sun})`);
      g.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 26, 0); ctx.lineTo(x + 110, SE.H); ctx.lineTo(x + 60, SE.H); ctx.fill();
    }
    for (let i = 0; i < 26; i++) {
      const x = (i * 83.7) % SE.W, y = groundY + ((i * 41) % (SE.H - groundY));
      if (Math.sin(SE.time * 3 + i * 1.7) > 0.85) { ctx.fillStyle = `rgba(255,255,240,${W.sun})`; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
    }
    ctx.restore();
  };
  // Windows of an interior: darker blue at night, brighter in sun, grey in storms.
  W.windows = function (ctx, rects) {
    const n = W.night();
    ctx.save();
    for (const r of rects) {
      ctx.fillStyle = `rgba(20,26,70,${0.15 + 0.5 * n})`;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      if (W.sun > 0.05) { ctx.fillStyle = `rgba(255,240,200,${0.18 * W.sun})`; ctx.fillRect(r.x, r.y, r.w, r.h); }
      if (W.fog > 0.05) { ctx.fillStyle = `rgba(220,226,240,${W.fog})`; ctx.fillRect(r.x, r.y, r.w, r.h); }
    }
    ctx.restore();
    W.draw(ctx, { clip: rects, density: 0.75, windScale: 0.6 });
  };
  // Interior darkness at night (lamps and fire then glow brighter on top).
  // After dark a room gets a cool dim wash. Give it the room's light sources ({x, y, r, k}) and the
  // dark is cut away around them, so the fire and the lamps light their corner and the rest falls
  // into shadow.
  const dk = document.createElement('canvas'), dx = dk.getContext('2d');
  W.interior = function (ctx, lights) {
    const n = W.night();
    if (n < 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    if (!lights || !lights.length) {
      ctx.fillStyle = `rgba(70,60,110,${0.6 * n})`;
      ctx.fillRect(0, 0, SE.W, SE.H);
      ctx.restore();
      return;
    }
    if (dk.width !== SE.W) { dk.width = SE.W; dk.height = SE.H; }
    dx.globalCompositeOperation = 'source-over';
    dx.clearRect(0, 0, SE.W, SE.H);
    dx.fillStyle = `rgba(48,40,88,${0.84 * n})`;
    dx.fillRect(0, 0, SE.W, SE.H);
    dx.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      if (!(l.k > 0.01)) continue;
      const g = dx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, `rgba(0,0,0,${Math.min(1, l.k)})`);
      g.addColorStop(0.5, `rgba(0,0,0,${Math.min(1, l.k) * 0.55})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      dx.fillStyle = g; dx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    ctx.drawImage(dk, 0, 0);
    ctx.restore();
  };
  W.label = () => MODES[W.mode].label;

  // Storms (and thick fog) hide the sun: a heavy grey overcast over the sky part of a backdrop.
  W.overcast = function (ctx, skyH = 160) {
    const k = Math.min(1, Math.max(W.stormy() ? 1 : 0, W.fog * 3, W.mode === 'windy' ? 0.55 : 0, W.mode === 'snowy' ? 0.45 : 0));
    if (k < 0.02) return;
    const g = ctx.createLinearGradient(0, 0, 0, skyH);
    g.addColorStop(0, `rgba(104,110,128,${0.85 * k})`); g.addColorStop(0.75, `rgba(140,146,164,${0.6 * k})`); g.addColorStop(1, 'rgba(150,156,172,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, SE.W, skyH);
  };
  // How hard the wind blows for the eye (0 calm … ~3 storm): used for swaying trees and shivering.
  W.windForce = () => Math.max(0, (W.wind + W.gust) / 24);
  // In a cold, windy spell the traveler and Waffles shiver now and then: a quick 1px tremble for
  // ~0.7s every few seconds. Returns an x offset; `seed` keeps the two out of step.
  W.shiver = function (seed = 0) {
    const f = W.windForce();
    if (f < 1.2 && !W.stormy()) return 0;
    const cycle = W.stormy() ? 4.5 : 7, t = (SE.time + seed * 1.7) % cycle;
    return t < 0.7 ? (Math.floor(SE.time * 22) % 2 ? 1 : -1) : 0;
  };
  // Trees sway in the wind: redraw the tree areas of a background row by row, shifting the rows
  // sideways a little more the higher they are (the trunk stays put). rects: [x, y, w, h].
  W.sway = function (ctx, imgName, rects, x0 = 0) {
    const img = SE.img(imgName), f = W.windForce();
    if (!img || f < 0.35) return;
    const amp = Math.min(3, f * 1.2);
    for (const [rx, ry, rw, rh] of rects) {
      for (let y = ry; y < ry + rh; y++) {
        const k = Math.pow(1 - (y - ry) / rh, 1.6);
        const off = Math.round(amp * k * Math.sin(SE.time * (1.1 + f * 0.5) + rx * 0.05 + y * 0.012));
        if (off) ctx.drawImage(img, rx, y, rw, 1, rx + off + x0, y, rw, 1);
      }
    }
  };

  // Outdoors when a storm is (or gets) going: head home along the paths. Called on storm start
  // and by each outdoor scene on enter, so arriving somewhere mid-storm also sends you home.
  const OUTDOORS = ['lake', 'forest', 'summit', 'trail'];
  let homeTimer = null;
  W.stormCheck = function () {
    if (!W.stormy() || !OUTDOORS.includes(SE.sceneName) || homeTimer) return;
    homeTimer = setTimeout(() => {
      homeTimer = null;
      if (!W.stormy() || !OUTDOORS.includes(SE.sceneName)) return;
      SE.toast('You and Waffles head home through the storm.', '#cfe6ff');
      SE.go('map', { walkTo: 'cabin' });
    }, 3000);
  };
})();
