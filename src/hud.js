// Snowy Escape — HUD: location label, top bar, journal, sound, weather & focus timer panels.
'use strict';

(function () {
  const H = (SE.hud = { panel: null, alpha: 1, tab: 0 });

  SE.FISH = {
    'Brook Trout': { color: '#d98b6a', rarity: 0.32, size: 1, img: 'fish/brook' },
    'Arctic Char': { color: '#e86f5b', rarity: 0.24, size: 1.1, img: 'fish/char' },
    'Lake Whitefish': { color: '#c9d4e2', rarity: 0.22, size: 1, img: 'fish/white' },
    'Northern Pike': { color: '#8fae6a', rarity: 0.14, size: 1.35, img: 'fish/pike' },
    'Golden Perch': { color: '#f2c84b', rarity: 0.08, size: 0.9, img: 'fish/perch' },
  };
  SE.DISHES = {
    'Pan-fried Fish': 'Crispy skin, butter and dill.',
    'Hot Chocolate': 'With a tiny cloud of marshmallows.',
  };

  // ------------------------------------------------------------ focus timer
  const F = (SE.focus = { running: false, phase: 'focus', left: 0, len: 25, brk: 5 });
  F.start = function (len, brk) {
    F.len = len; F.brk = brk;
    F.running = true; F.phase = 'focus'; F.left = len * 60;
    SE.toast(`Focus for ${len} minutes. You've got this.`, '#ffe6b8');
  };
  F.stop = function () { F.running = false; };
  F.update = function (dt) {
    if (!F.running) return;
    F.left -= dt;
    if (F.left <= 0) {
      SE.audio.sfx('chime');
      if (F.phase === 'focus') {
        SE.save.focusSessions++; SE.persist();
        F.phase = 'break'; F.left = F.brk * 60;
        SE.celebrate('Focus session done!', 'Time for a little break. Stretch, sip something warm.');
      } else {
        F.phase = 'focus'; F.left = F.len * 60;
        SE.toast('Break over — back to it, gently.', '#ffe6b8');
      }
    }
  };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  // ------------------------------------------------------------ slider
  let dragging = null;
  SE.slider = function (id, x, y, w, val) {
    const r = { x: x - 2, y: y - 4, w: w + 4, h: 10 };
    const hover = SE.inRect(SE.mouse.x, SE.mouse.y, r);
    if (hover) SE.cursor = 'pointer';
    if (hover && SE.mouse.pressed) dragging = id;
    if (!SE.mouse.down) dragging = null;
    if (dragging === id) val = SE.clamp((SE.mouse.x - x) / w, 0, 1);
    const ctx = SE.ctx;
    ctx.fillStyle = 'rgba(20,16,30,0.9)';
    ctx.fillRect(x, y, w, 3);
    ctx.fillStyle = '#e8aa60';
    ctx.fillRect(x, y, Math.round(w * val), 3);
    ctx.fillStyle = '#fff7ea';
    ctx.fillRect(Math.round(x + w * val) - 2, y - 2, 4, 7);
    return val;
  };

  // ------------------------------------------------------------ main draw
  // opts: { title, back: fn|null, map: bool }
  H.draw = function (ctx, opts = {}) {
    F.update(SE.dt);
    const hideUi = SE.save.settings.hideUi && !H.panel && !SE.modal;
    const target = hideUi && SE.idleTime > 7 ? 0 : 1;
    H.alpha = SE.approach(H.alpha, target, target ? 10 : 1.2, SE.dt);
    SE.uiAlpha = H.alpha;
    const a = H.alpha;
    if (a < 0.02 && !H.panel) {
      drawTimerPill(ctx, 0.55);
      // keep a faint "Watching" toggle so watch mode can always be switched off
      if (SE.watching() && opts.watch !== false && SE.button(SE.W - 76, 6, 70, 18, 'Watching', { icon: 'play', active: true, alpha: 0.5 })) SE.toggleWatch();
      return;
    }

    // location label
    if (opts.title) {
      const w = SE.measure(opts.title, 10) + 20;
      SE.panel(6, 6, w, 18, { alpha: a * 0.9 });
      SE.text(opts.title, 16, 10, { size: 10, alpha: a, color: '#ffe6b8' });
      const status = `Day ${SE.save.day} · ${SE.weather.clockLabel()} · ${SE.weather.label()}`;
      // a soft backing so the status lines stay readable on bright snow
      const sw = Math.max(SE.measure(status, 7), opts.subtitle ? SE.measure(opts.subtitle, 7) : 0) + 8;
      ctx.fillStyle = `rgba(26,22,40,${0.45 * a})`;
      ctx.fillRect(5, 26, sw, opts.subtitle ? 20 : 11);
      SE.text(status, 8, 27, { size: 7, alpha: a * 0.9, color: '#ffe6b8' });
      if (opts.subtitle) SE.text(opts.subtitle, 8, 37, { size: 7, alpha: a * 0.85, color: '#dfe8ff' });
    }

    // top-right buttons
    let x = SE.W - 6;
    const btn = (icon, cb, active) => {
      x -= 20;
      if (SE.button(x, 6, 18, 18, '', { icon, alpha: a, active })) cb();
    };
    btn('full', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
    });
    btn('eye', () => {
      SE.save.settings.hideUi = !SE.save.settings.hideUi; SE.persist();
      SE.toast(SE.save.settings.hideUi ? 'UI fades away when you sit still' : 'UI always visible');
    }, SE.save.settings.hideUi);
    btn('note', () => toggle('sound'), H.panel === 'sound');
    btn('snow', () => toggle('weather'), H.panel === 'weather');
    btn('clock', () => toggle('focus'), H.panel === 'focus' || F.running);
    btn('book', () => toggle('journal'), H.panel === 'journal');
    if (opts.map) btn('map', () => { H.panel = null; SE.go('map'); });
    // the big "Just watch" toggle: activities play themselves on a loop
    if (opts.watch !== false) {
      const on = SE.watching();
      const label = on ? 'Watching' : 'Just watch';
      const w = SE.measure(label, 8) + 24;
      x -= w + 2;
      if (SE.button(x, 6, w, 18, label, { icon: 'play', active: on, alpha: Math.max(a, on ? 0.5 : 0) })) SE.toggleWatch();
    }
    if (opts.back) {
      if (SE.button(6, SE.H - 24, 54, 18, 'Back', { icon: 'back', alpha: a })) opts.back();
    }
    drawTimerPill(ctx, a);
    if (H.panel) drawPanel(ctx);
  };
  function toggle(p) { H.panel = H.panel === p ? null : p; SE.modal = H.panel; }
  H.close = () => { H.panel = null; SE.modal = null; };

  function drawTimerPill(ctx, a) {
    if (!F.running) return;
    const label = `${F.phase === 'focus' ? 'Focus' : 'Break'} ${fmt(F.left)}`;
    const w = SE.measure(label, 8) + 22;
    SE.panel(SE.W - 6 - w, 28, w, 15, { alpha: Math.max(a, 0.55) * 0.9, fill: F.phase === 'focus' ? 'rgba(54,46,78,0.9)' : 'rgba(60,98,92,0.9)' });
    SE.drawIcon('clock', SE.W - w + 1, 31.5, '#ffe6b8');
    SE.text(label, SE.W - 6 - w / 2 + 6, 31.5, { align: 'center', alpha: Math.max(a, 0.55) });
  }

  // ------------------------------------------------------------ panels
  function drawPanel(ctx) {
    ctx.fillStyle = 'rgba(14,10,24,0.45)';
    ctx.fillRect(0, 0, SE.W, SE.H);
    const pw = H.panel === 'journal' ? 300 : 200, ph = H.panel === 'journal' ? 200 : 132;
    const px = SE.W / 2 - pw / 2, py = SE.H / 2 - ph / 2;
    SE.panel(px, py, pw, ph, { fill: 'rgba(48,40,70,0.97)' });
    if (SE.button(px + pw - 20, py + 4, 16, 14, 'x', { modal: true })) { H.close(); return; }
    // click outside closes
    if (SE.mouse.released && !SE.inRect(SE.mouse.x, SE.mouse.y, { x: px, y: py, w: pw, h: ph })) { H.close(); return; }
    const s = SE.save.settings;
    if (H.panel === 'sound') {
      SE.text('Sound', px + 12, py + 8, { size: 10, color: '#ffe6b8' });
      const rows = [['Music', 'music'], ['Ambience', 'ambience'], ['Effects', 'sfx']];
      rows.forEach(([label, key], i) => {
        const y = py + 34 + i * 26;
        SE.text(label, px + 14, y - 4, { size: 8 });
        const v = SE.slider('vol-' + key, px + 72, y, 110, s[key]);
        if (v !== s[key]) { s[key] = v; SE.audio.applyVolumes(); SE.persist(); }
      });
      SE.text('Synthesized live — drop mp3s in assets/audio to swap.', px + pw / 2, py + ph - 16, { align: 'center', size: 6, color: '#b9b1d6' });
    } else if (H.panel === 'weather') {
      SE.text('Weather', px + 12, py + 8, { size: 10, color: '#ffe6b8' });
      const opts = [['auto', 'Let nature decide'], ['sunny', 'Sunny spell'], ['calm', 'Gentle snow'], ['snowy', 'Heavy snowfall'], ['windy', 'Windy'], ['storm', 'Snowstorm']];
      opts.forEach(([k, label], i) => {
        if (SE.button(px + 10, py + 24 + i * 16, 108, 14, label, { modal: true, active: s.weather === k, size: 7 })) {
          s.weather = k; if (k !== 'auto') SE.weather.set(k); SE.persist();
        }
      });
      SE.text('Time of day', px + 128, py + 24, { size: 7, color: '#dfe8ff' });
      [['cycle', 'Day cycle'], ['live', 'My clock'], ['day', 'Day'], ['dusk', 'Dusk'], ['night', 'Night']].forEach(([k, label], i) => {
        if (SE.button(px + 128, py + 34 + i * 16, 62, 14, label, { modal: true, active: (s.time || 'cycle') === k, size: 7 })) { s.time = k; SE.persist(); }
      });
    } else if (H.panel === 'focus') {
      SE.text('Focus timer', px + 12, py + 8, { size: 10, color: '#ffe6b8' });
      SE.text('Study or work alongside the traveler.', px + 12, py + 24, { size: 7, color: '#dfe8ff' });
      if (F.running) {
        SE.text(`${F.phase === 'focus' ? 'Focusing' : 'On a break'} — ${fmt(F.left)}`, px + pw / 2, py + 50, { align: 'center', size: 12 });
        if (SE.button(px + pw / 2 - 40, py + 76, 80, 18, 'Stop timer', { modal: true })) F.stop();
      } else {
        [[25, 5], [50, 10], [90, 15]].forEach(([l, b], i) => {
          if (SE.button(px + 14, py + 40 + i * 22, pw - 28, 18, `${l} min focus · ${b} min break`, { modal: true })) { F.start(l, b); H.close(); }
        });
      }
      SE.text(`Sessions completed: ${SE.save.focusSessions}`, px + pw / 2, py + ph - 14, { align: 'center', size: 7, color: '#b9b1d6' });
    } else if (H.panel === 'journal') drawJournal(px, py, pw, ph);
  }

  function drawJournal(px, py, pw, ph) {
    SE.text("Traveler's Journal", px + 12, py + 8, { size: 10, color: '#ffe6b8' });
    const tabs = ['Fish', 'Kitchen', 'Moments', 'Photos'];
    tabs.forEach((t, i) => { if (SE.button(px + 12 + i * 62, py + 24, 58, 15, t, { modal: true, active: H.tab === i })) H.tab = i; });
    const sv = SE.save;
    let y = py + 48;
    const line = (l, r, c) => {
      SE.text(l, px + 16, y, { size: 8, color: c || '#fff7ea' });
      if (r != null) SE.text(String(r), px + pw - 16, y, { size: 8, align: 'right', color: '#ffe6b8' });
      y += 13;
    };
    if (H.tab === 0) {
      SE.text('species', px + 16, y - 2, { size: 6, color: '#b9b1d6' });
      SE.text('in bucket · caught', px + pw - 16, y - 2, { size: 6, align: 'right', color: '#b9b1d6' });
      y += 8;
      for (const [name, f] of Object.entries(SE.FISH)) {
        const seen = sv.caught[name];
        SE.drawIcon('fish', px + 16, y, seen ? f.color : '#5d5577');
        SE.text(seen ? name : '???', px + 28, y, { size: 8, color: seen ? '#fff7ea' : '#8a82a8' });
        SE.text(`${sv.fish[name] || 0} · ${seen || 0}`, px + pw - 16, y, { size: 8, align: 'right', color: '#ffe6b8' });
        y += 14;
      }
      SE.text('Catch fish at the Frozen Lake, cook them in the cabin kitchen.', px + pw / 2, py + ph - 14, { align: 'center', size: 6, color: '#b9b1d6' });
    } else if (H.tab === 1) {
      line('Hot chocolate ready', sv.cocoa);
      for (const d of Object.keys(SE.DISHES)) line(d + ' made', sv.dishes[d] || 0);
      line('Meals cooked in total', sv.cooked);
    } else if (H.tab === 3) {
      // the photo album: three camera-only shots per animal, met on walks through the valley
      const W = SE.WILDLIFE || {};
      const kinds = ['deer', 'elk', 'fox', 'hare', 'owl', 'bird', 'bear'];
      const album = sv.album || {};
      const tw = 32, th = 24, colW = 39, x0 = px + 14, y0 = y - 2;
      let count = 0;
      kinds.forEach((k, c) => {
        const cx = x0 + c * colW;
        SE.text(W[k] ? W[k].name.split(' ').pop() : k, cx + tw / 2, y0, { size: 6, align: 'center', color: '#b9b1d6' });
        for (let i = 0; i < 3; i++) {
          const ty = y0 + 10 + i * (th + 4);
          const got = (album[k] || []).includes(i), img = SE.img(`photo/${k}_${i}`);
          SE.ctx.fillStyle = got ? '#fbf6ec' : 'rgba(20,16,32,0.6)';
          SE.ctx.fillRect(cx - 1, ty - 1, tw + 2, th + 2);
          if (got && img) { SE.ctx.imageSmoothingEnabled = false; SE.ctx.drawImage(img, cx, ty, tw, th); count++; }
          else SE.text('?', cx + tw / 2, ty + 7, { size: 8, align: 'center', color: '#5d5577' });
          if (got && SE.inRect(SE.mouse.x, SE.mouse.y, { x: cx, y: ty, w: tw, h: th })) { SE.cursor = 'pointer'; if (SE.mouse.released) { SE.mouse.released = false; H.photo = { k, i }; } }
        }
      });
      SE.text(`${count} / 21 photos · animals turn up on walks through the valley`, px + pw / 2, py + ph - 14, { align: 'center', size: 6, color: '#b9b1d6' });
      if (H.photo) {
        const img = SE.img(`photo/${H.photo.k}_${H.photo.i}`);
        const w = 256, h = 192, bx = SE.W / 2 - w / 2, by = 20;
        SE.ctx.fillStyle = '#fbf6ec'; SE.ctx.fillRect(bx - 6, by - 6, w + 12, h + 26);
        if (img) SE.ctx.drawImage(img, bx, by, w, h);
        const cap = W[H.photo.k] ? W[H.photo.k].shots[H.photo.i] : '';
        SE.text(cap, SE.W / 2, by + h + 6, { align: 'center', size: 8, color: '#3a2a2a', shadow: false });
        if (SE.mouse.released) { SE.mouse.released = false; H.photo = null; }
      }
    } else {
      const sk = sv.sketches || {};
      line('Sketched: deer · elk · fox · hare · owl · bird', `${sk.deer || sv.deerPhotos || 0}·${sk.elk || 0}·${sk.fox || 0}·${sk.hare || 0}·${sk.owl || 0}·${sk.bird || 0}`);
      line('Shooting stars watched with Waffles', sv.stars || 0);
      line('Calm breaths at the summit', sv.breaths);
      line('Prayers · candles lit in the chapel', `${sv.prayers || 0} · ${sv.candles || 0}`);
      line('Belly rubs for Waffles', sv.petsDog);
      line('Paths shoveled', sv.shoveled);
      line('Armfuls of firewood', sv.logs);
      line('Chin scratches for Mochi', sv.petsCat);
      line('Kilometres walked in snow', (sv.distance / 1000).toFixed(1));
      line('Focus sessions finished', sv.focusSessions);
      line('Days in the mountains', sv.day);
    }
  }
})();
