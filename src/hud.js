// Snowy Escape — HUD: location label, top bar (notebook, sound, weather & focus timer panels).
'use strict';

(function () {
  const H = (SE.hud = { panel: null, alpha: 1, tab: 0 });

  // cut: the variant of the cooking stills (cut/cook_prep_<cut>, cut/cook_plate_<cut>; none = the trout stills)
  SE.FISH = {
    'Brook Trout': { color: '#d98b6a', rarity: 0.32, size: 1, img: 'fish/brook', dish: 'Pan-fried Trout',
      prep: 'A speckled brook trout. A sharp knife, a steady hand. Two neat fillets.', plate: 'Onto the plate, with dill and lemon.' },
    'Arctic Char': { color: '#e86f5b', rarity: 0.24, size: 1.1, img: 'fish/char', cut: 'char', dish: 'Seared Arctic Char',
      prep: 'An arctic char, belly red as the embers. Two fillets, skin on.', plate: 'Skin crisp, flesh rosy pink. Dill and a wedge of lemon.' },
    'Lake Whitefish': { color: '#c9d4e2', rarity: 0.22, size: 1, img: 'fish/white', cut: 'white', dish: 'Butter Whitefish',
      prep: 'A silver whitefish, cold from the lake. Gently, the flesh is soft.', plate: 'Flaky and white, in brown butter, with little boiled potatoes.' },
    'Northern Pike': { color: '#8fae6a', rarity: 0.14, size: 1.35, img: 'fish/pike', cut: 'pike', dish: 'Crumbed Pike',
      prep: 'A long northern pike. Mind the teeth, mind the bones.', plate: 'Breaded and golden, with a spoon of lingonberries.' },
    'Golden Perch': { color: '#f2c84b', rarity: 0.08, size: 0.9, img: 'fish/perch', cut: 'perch', dish: 'Fried Perch',
      prep: 'A striped golden perch. Small, but the sweetest of them all.', plate: 'A little pile of golden fillets, brown butter, lemon.' },
  };
  // the mugs on the kitchen shelf; cocoa can go into any of them (cut/cocoa_pour_<id>, '' = the red one)
  SE.MUGS = [
    { id: '', name: 'Big red mug', line: 'Into the big red mug. One last stir.' },
    { id: 'blue', name: 'Enamel camp mug', line: 'Into the speckled camp mug. It has seen a lot of summits.' },
    { id: 'pine', name: 'Pine tree mug', line: 'Into the mug with the little pine tree on it.' },
    { id: 'stone', name: 'Pottery mug', line: 'Into the heavy pottery mug, glaze running down its sides.' },
    { id: 'paw', name: "Waffles' mug", line: "Into the paw-print mug. Waffles approves." },
    { id: 'cat', name: "Mochi's mug", line: "Into the sleeping-cat mug. Mochi pretends not to care." },
  ];
  SE.DISHES = {
    'Pan-fried Trout': 'Crispy skin, butter and dill.',
    'Seared Arctic Char': 'Rosy pink, crisp skin.',
    'Butter Whitefish': 'Flaky, with little potatoes.',
    'Crumbed Pike': 'Golden crumbs, lingonberries.',
    'Fried Perch': 'Small, golden, the sweetest.',
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
  // The timer belongs to the idle scenes: it only counts while you sit back and just watch.
  // Taking over again pauses it; watching again carries on.
  F.update = function (dt) {
    if (!F.running) return;
    if (!SE.watching()) return;
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
    if (SE.applyLighting) SE.applyLighting(ctx); // light the characters before the UI goes on top
    F.update(SE.dt);
    const hideUi = SE.save.settings.hideUi && !H.panel && !SE.modal;
    const target = hideUi && SE.idleTime > 7 ? 0 : 1;
    H.alpha = SE.approach(H.alpha, target, target ? 10 : 1.2, SE.dt);
    SE.uiAlpha = H.alpha;
    const a = H.alpha;
    if (a < 0.02 && !H.panel) {
      drawTimerPill(ctx, 0.55);
      // keep a faint "Watching" toggle so watch mode can always be switched off
      if (SE.watching() && opts.watch !== false && SE.button(SE.W - 96, 6, 90, 18, 'Stop watching', { icon: 'stop', active: true, alpha: 0.5 })) SE.toggleWatch();
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
      else if (SE.goFullscreen) SE.goFullscreen().catch(() => SE.toast('Full screen on iPhone: tap Share, then "Add to Home Screen"', '#ffe6b8'));
    });
    btn('eye', () => {
      SE.save.settings.hideUi = !SE.save.settings.hideUi; SE.persist();
      SE.toast(SE.save.settings.hideUi ? 'UI fades away when you sit still' : 'UI always visible');
    }, SE.save.settings.hideUi);
    btn('note', () => toggle('sound'), H.panel === 'sound');
    btn('snow', () => toggle('weather'), H.panel === 'weather');
    // while you just watch and no timer runs yet, the clock glows now and then: the timer lives here
    btn('clock', () => toggle('focus'), H.panel === 'focus' || (F.running && SE.watching()) || (SE.watching() && !F.running && Math.sin(SE.time * 2.5) > 0.6));
    btn('book', () => { H.close(); SE.openNotebook(); }, SE.notebook && SE.notebook.open);
    if (opts.map) btn('map', () => {
      H.panel = null;
      const leave = { chapel: 'chapelLeave', summit: 'summitLeave' }[SE.sceneName];
      if (leave) SE.moment(leave, { force: true, go: ['map', {}] }); else SE.go('map');
    });
    // the big "Just watch" toggle: activities play themselves on a loop
    if (opts.watch !== false) {
      const on = SE.watching();
      const label = on ? 'Stop watching' : 'Just watch';
      const w = SE.measure(label, 8) + 24;
      x -= w + 2;
      if (SE.button(x, 6, w, 18, label, { icon: on ? 'stop' : 'play', active: on, alpha: Math.max(a, on ? 0.5 : 0) })) SE.toggleWatch();
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
    const paused = !SE.watching();
    const label = paused ? `Paused ${fmt(F.left)}` : `${F.phase === 'focus' ? 'Focus' : 'Break'} ${fmt(F.left)}`;
    const w = SE.measure(label, 8) + 22;
    SE.panel(SE.W - 6 - w, 28, w, 15, { alpha: Math.max(a, 0.55) * 0.9, fill: F.phase === 'focus' ? 'rgba(54,46,78,0.9)' : 'rgba(60,98,92,0.9)' });
    SE.drawIcon('clock', SE.W - w + 1, 31.5, '#ffe6b8');
    SE.text(label, SE.W - 6 - w / 2 + 6, 31.5, { align: 'center', alpha: Math.max(a, 0.55) });
  }

  // ------------------------------------------------------------ panels
  function drawPanel(ctx) {
    ctx.fillStyle = 'rgba(14,10,24,0.45)';
    ctx.fillRect(0, 0, SE.W, SE.H);
    const pw = 200, ph = H.panel === 'sound' ? 144 : 132;
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
      // on phones: shrink the game if the browser covers its edges
      SE.text('Screen', px + 14, py + 108, { size: 8 });
      const sv = SE.slider('vol-screen', px + 72, py + 112, 110, ((s.screen || 1) - 0.6) / 0.4);
      const ns = Math.round((0.6 + sv * 0.4) * 100) / 100;
      if (ns !== (s.screen || 1)) { s.screen = ns; SE.persist(); SE.resize(); }
      // what is playing, and a way to skip to the next song
      const title = SE.audio.trackTitle ? SE.audio.trackTitle() : '';
      if (title) {
        SE.text('Now playing', px + 14, py + 119, { size: 6, color: '#b9b0d0' });
        SE.text(title, px + 14, py + 127, { size: 7, color: '#dfe8ff' });
        if (SE.audio.playlistSize() > 1 && SE.button(px + pw - 62, py + 121, 52, 14, 'Next song', { modal: true, size: 7 })) SE.audio.nextTrack();
      }
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
      SE.text('Study or work while the traveler just watches.', px + 12, py + 24, { size: 7, color: '#dfe8ff' });
      if (!SE.watching()) {
        // the timer runs in the idle scenes only: point the way there
        SE.text(F.running ? `Paused at ${fmt(F.left)}.` : 'It runs while you sit back and', px + pw / 2, py + 44, { align: 'center', size: 8 });
        SE.text(F.running ? 'It counts on while you just watch.' : 'let the mountains be: Just watch.', px + pw / 2, py + 56, { align: 'center', size: 8 });
        if (SE.button(px + pw / 2 - 52, py + 76, 104, 18, F.running ? 'Just watch again' : 'Just watch & focus', { modal: true, active: true })) {
          SE.toggleWatch();
          if (!F.running) F.start(25, 5);
          H.close();
        }
      } else if (F.running) {
        SE.text(`${F.phase === 'focus' ? 'Focusing' : 'On a break'} — ${fmt(F.left)}`, px + pw / 2, py + 50, { align: 'center', size: 12 });
        if (SE.button(px + pw / 2 - 40, py + 76, 80, 18, 'Stop timer', { modal: true })) F.stop();
      } else {
        [[25, 5], [50, 10], [90, 15]].forEach(([l, b], i) => {
          if (SE.button(px + 14, py + 40 + i * 22, pw - 28, 18, `${l} min focus · ${b} min break`, { modal: true })) { F.start(l, b); H.close(); }
        });
      }
      SE.text(`Sessions completed: ${SE.save.focusSessions}`, px + pw / 2, py + ph - 14, { align: 'center', size: 7, color: '#b9b1d6' });
    }
  }

})();
