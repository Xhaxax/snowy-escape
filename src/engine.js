// Snowy Escape — tiny canvas engine: scaling, loop, input, assets, scenes, UI helpers.
'use strict';

const SE = (window.SE = {
  W: 480,
  H: 272,
  scale: 1,
  time: 0,
  dt: 0,
  scenes: {},
  scene: null,
  sceneName: '',
  images: {},
  anims: {},
  mouse: { x: 0, y: 0, down: false, pressed: false, released: false, moved: 0, wheel: 0 },
  keys: new Set(),
  keysPressed: new Set(),
  cursor: 'default',
  idleTime: 0,
  fade: { a: 1, target: 0, next: null, params: null, speed: 2.2 },
  toasts: [],
  frameHooks: [],
});

// ---------------------------------------------------------------- helpers
SE.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
SE.lerp = (a, b, t) => a + (b - a) * t;
SE.rand = (a, b) => a + Math.random() * (b - a);
SE.randi = (a, b) => Math.floor(SE.rand(a, b + 1));
SE.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
SE.ease = (t) => t * t * (3 - 2 * t);
SE.inRect = (x, y, r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;

// ---------------------------------------------------------------- canvas
SE.canvas = document.getElementById('game');
SE.ctx = SE.canvas.getContext('2d');

SE.resize = function () {
  const dpr = window.devicePixelRatio || 1;
  const fit = Math.min(window.innerWidth / SE.W, window.innerHeight / SE.H);
  // Prefer whole-number device-pixel scaling for crisp pixels, unless it wastes a lot of screen.
  let s = Math.floor(fit * dpr);
  if (s < 1 || s / (fit * dpr) < 0.8) s = Math.max(1, fit * dpr);
  SE.scale = s;
  SE.canvas.width = Math.round(SE.W * s);
  SE.canvas.height = Math.round(SE.H * s);
  SE.canvas.style.width = (SE.W * s) / dpr + 'px';
  SE.canvas.style.height = (SE.H * s) / dpr + 'px';
  SE.ctx.imageSmoothingEnabled = false;
};
window.addEventListener('resize', SE.resize);

// ---------------------------------------------------------------- input
function toLogical(e) {
  const r = SE.canvas.getBoundingClientRect();
  SE.mouse.x = ((e.clientX - r.left) / r.width) * SE.W;
  SE.mouse.y = ((e.clientY - r.top) / r.height) * SE.H;
}
SE.canvas.addEventListener('pointermove', (e) => {
  const ox = SE.mouse.x, oy = SE.mouse.y;
  toLogical(e);
  SE.mouse.moved += Math.hypot(SE.mouse.x - ox, SE.mouse.y - oy);
  SE.idleTime = 0;
});
SE.canvas.addEventListener('pointerdown', (e) => {
  toLogical(e);
  SE.mouse.down = true;
  SE.mouse.pressed = true;
  SE.idleTime = 0;
  SE.canvas.setPointerCapture(e.pointerId);
  if (SE.audio) SE.audio.unlock();
});
SE.canvas.addEventListener('pointerup', (e) => {
  toLogical(e);
  SE.mouse.down = false;
  SE.mouse.released = true;
});
SE.canvas.addEventListener('wheel', (e) => { SE.mouse.wheel += Math.sign(e.deltaY); }, { passive: true });
SE.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('keydown', (e) => {
  if (!SE.keys.has(e.code)) SE.keysPressed.add(e.code);
  SE.keys.add(e.code);
  SE.idleTime = 0;
  if (SE.audio) SE.audio.unlock();
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => SE.keys.delete(e.code));
window.addEventListener('blur', () => { SE.keys.clear(); SE.mouse.down = false; });
SE.key = (code) => SE.keysPressed.has(code);
SE.anyKey = (...codes) => codes.some((c) => SE.keysPressed.has(c));
SE.held = (...codes) => codes.some((c) => SE.keys.has(c));

// ---------------------------------------------------------------- assets
SE.loadImages = function (list) {
  return Promise.all(
    list.map(
      (name) =>
        new Promise((res) => {
          const img = new Image();
          img.onload = () => { SE.images[name] = img; res(); };
          img.onerror = () => { console.warn('missing image', name); res(); };
          img.src = 'assets/img/' + name + '.png';
        })
    )
  );
};
SE.img = (name) => SE.images[name];

// Horizontal strip sprite sheets: frames of equal width.
SE.defAnim = function (name, img, frames, fps) {
  SE.anims[name] = { img, frames, fps };
};
SE.drawAnim = function (name, x, y, t, opts = {}) {
  const a = SE.anims[name];
  const img = a && SE.images[a.img];
  if (!img) return;
  const fw = img.width / a.frames, fh = img.height;
  let f = opts.frame != null ? opts.frame : Math.floor(t * a.fps) % a.frames;
  if (opts.pingpong && a.frames > 2) {
    const n = a.frames * 2 - 2;
    f = Math.floor(t * a.fps) % n;
    if (f >= a.frames) f = n - f;
  }
  const s = opts.scale || 1;
  const ctx = SE.ctx;
  ctx.save();
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  if (opts.flip) {
    ctx.translate(Math.round(x + fw * s), Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(img, f * fw, 0, fw, fh, 0, 0, fw * s, fh * s);
  } else {
    ctx.drawImage(img, f * fw, 0, fw, fh, Math.round(x), Math.round(y), fw * s, fh * s);
  }
  ctx.restore();
};
SE.animSize = (name) => {
  const a = SE.anims[name];
  const img = a && SE.images[a.img];
  return img ? { w: img.width / a.frames, h: img.height } : { w: 0, h: 0 };
};
SE.drawImg = function (name, x, y, opts = {}) {
  const img = SE.images[name];
  if (!img) return;
  const s = opts.scale || 1;
  const ctx = SE.ctx;
  ctx.save();
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  if (opts.flip) {
    ctx.translate(Math.round(x + img.width * s), Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, img.width * s, img.height * s);
  } else ctx.drawImage(img, Math.round(x), Math.round(y), img.width * s, img.height * s);
  ctx.restore();
};

// ---------------------------------------------------------------- save
SE.defaultSave = () => ({
  v: 1,
  location: 'cabin',
  fish: {},          // name -> count in the bucket
  caught: {},        // name -> total caught (journal)
  dishes: {},        // dish -> count
  cocoa: 1,
  cooked: 0,
  deerPhotos: 0,
  sketches: {},
  photos: [],        // {kind, t}
  wishes: 0,
  breaths: 0,
  prayers: 0,        // quiet prayers in the chapel
  candles: 0,        // candles lit in the chapel
  petsDog: 0,
  petsCat: 0,
  distance: 0,
  focusSessions: 0,
  clock: 10,         // in-game hour (one real minute = one hour)
  day: 1,
  weather: 'calm',
  snowDepth: 0.45,   // snow piled on the path (0 clear … 1 buried)
  fire: 0.8,         // fireplace (0 embers … 1 roaring)
  stove: 0.5,        // kitchen oven (needs to be warm to cook)
  wood: 6,           // split firewood in the stack
  shoveled: 0,
  logs: 0,
  rocks: 0,
  lastSeen: 0,
  settings: { music: 0.55, ambience: 0.7, sfx: 0.8, weather: 'auto', time: 'cycle', hideUi: true, watch: false },
});
SE.load = function () {
  try {
    const raw = localStorage.getItem('snowy-escape-save');
    if (raw) {
      const data = JSON.parse(raw);
      const d = SE.defaultSave();
      SE.save = Object.assign(d, data, { settings: Object.assign(d.settings, data.settings || {}) });
      return;
    }
  } catch (e) { /* storage blocked: play without saving */ }
  SE.save = SE.defaultSave();
};
SE.persist = function () {
  SE.save.lastSeen = Date.now();
  try { localStorage.setItem('snowy-escape-save', JSON.stringify(SE.save)); } catch (e) { /* ignore */ }
};
SE.addFish = function (name) {
  SE.save.fish[name] = (SE.save.fish[name] || 0) + 1;
  SE.save.caught[name] = (SE.save.caught[name] || 0) + 1;
  SE.persist();
};
SE.fishCount = () => Object.values(SE.save.fish).reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------- scenes
SE.addScene = (name, scene) => { SE.scenes[name] = scene; };
SE.go = function (name, params) {
  if (SE.fade.next) return;
  SE.fade.next = name;
  SE.fade.params = params || {};
  SE.fade.target = 1;
  if (SE.audio) SE.audio.sfx('pop');
};
SE.switchNow = function (name, params) {
  if (SE.scene && SE.scene.exit) SE.scene.exit();
  SE.scene = SE.scenes[name];
  SE.sceneName = name;
  SE.sceneTime = 0;
  if (SE.scene.enter) SE.scene.enter(params || {});
};

// ---------------------------------------------------------------- text & UI
SE.FONT = '"Pixelify Sans", "Silkscreen", monospace';
SE.text = function (str, x, y, opts = {}) {
  const ctx = SE.ctx;
  ctx.save();
  ctx.font = `${opts.bold ? 'bold ' : ''}${opts.size || 8}px ${opts.font || SE.FONT}`;
  ctx.textAlign = opts.align || 'left';
  ctx.textBaseline = opts.baseline || 'top';
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  if (opts.shadow !== false) {
    ctx.fillStyle = opts.shadowColor || 'rgba(20,14,30,0.75)';
    ctx.fillText(str, x + 0.75, y + 0.75);
  }
  ctx.fillStyle = opts.color || '#fff7ea';
  ctx.fillText(str, x, y);
  ctx.restore();
};
SE.measure = function (str, size = 8) {
  SE.ctx.save();
  SE.ctx.font = `${size}px ${SE.FONT}`;
  const w = SE.ctx.measureText(str).width;
  SE.ctx.restore();
  return w;
};
SE.wrap = function (str, maxW, size = 8) {
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (SE.measure(t, size) > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
};

// Soft pixel panel (rounded by chopping corners).
SE.panel = function (x, y, w, h, opts = {}) {
  const ctx = SE.ctx;
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.save();
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  ctx.fillStyle = opts.border || 'rgba(26,22,40,0.92)';
  ctx.fillRect(x + 1, y, w - 2, h);
  ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = opts.fill || 'rgba(54,46,78,0.9)';
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = opts.light || 'rgba(255,255,255,0.08)';
  ctx.fillRect(x + 2, y + 1, w - 4, 1);
  ctx.restore();
};

SE._hot = false;
// Immediate-mode button; returns true when clicked this frame.
SE.button = function (x, y, w, h, label, opts = {}) {
  const hover = !SE.uiBlocked(opts) && SE.inRect(SE.mouse.x, SE.mouse.y, { x, y, w, h });
  if (hover) { SE.cursor = 'pointer'; SE._hot = true; }
  const pressed = hover && SE.mouse.down;
  const active = opts.active;
  SE.panel(x, y + (pressed ? 1 : 0), w, h, {
    fill: active ? 'rgba(232,170,96,0.95)' : hover ? 'rgba(92,80,128,0.95)' : opts.fill || 'rgba(54,46,78,0.88)',
    alpha: opts.alpha,
  });
  if (opts.icon) {
    SE.ctx.save();
    SE.ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
    SE.drawIcon(opts.icon, x + (label ? 5 : w / 2 - 4), y + h / 2 - 4 + (pressed ? 1 : 0), active ? '#3a2433' : '#fff7ea');
    SE.ctx.restore();
  }
  if (label) {
    SE.text(label, x + (opts.icon ? w / 2 + 5 : w / 2), y + h / 2 - (opts.size || 8) / 2 + (pressed ? 1 : 0), {
      align: 'center',
      size: opts.size || 8,
      color: active ? '#3a2433' : hover ? '#ffe6b8' : '#fff7ea',
      shadow: !active,
      alpha: opts.alpha,
    });
  }
  const clicked = hover && SE.mouse.released;
  if (clicked && SE.audio) SE.audio.sfx('pop');
  if (clicked) SE.mouse.released = false; // consume
  return clicked;
};
SE.modal = null; // when set, only UI flagged as modal reacts
SE.uiBlocked = (opts) => SE.modal && !opts.modal;

// Tiny 8x8 icons drawn from bitmaps so they stay crisp.
const ICONS = {
  map: ['01111110', '11011011', '10111101', '11011011', '10111101', '11011011', '01111110', '00000000'],
  book: ['01111110', '11000011', '11011011', '11000011', '11011011', '11000011', '11111111', '01111110'],
  clock: ['00111100', '01000010', '10010001', '10010001', '10011101', '10000001', '01000010', '00111100'],
  note: ['00011111', '00010001', '00010001', '00010001', '01110001', '11110111', '11101111', '01000110'],
  snow: ['00011000', '01011010', '00111100', '11111111', '11111111', '00111100', '01011010', '00011000'],
  eye: ['00000000', '00111100', '01100110', '11011011', '11011011', '01100110', '00111100', '00000000'],
  full: ['11100111', '11000011', '10000001', '00000000', '00000000', '10000001', '11000011', '11100111'],
  heart: ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000', '00000000'],
  back: ['00010000', '00110000', '01111111', '11111111', '01111111', '00110000', '00010000', '00000000'],
  home: ['00011000', '00111100', '01111110', '11111111', '01100110', '01100110', '01111110', '00000000'],
  fish: ['00000000', '00011000', '10111100', '11111110', '11111111', '10111100', '00011000', '00000000'],
  cup: ['00000000', '01010100', '00000000', '11111100', '11111111', '11111101', '11111110', '01111000'],
  cam: ['00000000', '00110000', '11111111', '10011001', '10100101', '10011001', '11111111', '00000000'],
  play: ['01000000', '01100000', '01110000', '01111000', '01111000', '01110000', '01100000', '01000000'],
  hand: ['00011000', '00011010', '01011011', '11011011', '11111111', '11111110', '01111110', '00111100'],
};
SE.drawIcon = function (name, x, y, color = '#fff7ea', scale = 1) {
  const rows = ICONS[name];
  if (!rows) return;
  const ctx = SE.ctx;
  ctx.fillStyle = color;
  for (let j = 0; j < 8; j++)
    for (let i = 0; i < 8; i++) if (rows[j][i] === '1') ctx.fillRect(Math.round(x) + i * scale, Math.round(y) + j * scale, scale, scale);
};

SE.heart = function (x, y, size, color, alpha) {
  const ctx = SE.ctx;
  ctx.save();
  ctx.globalAlpha = alpha;
  SE.drawIcon('heart', x, y, color || '#ff8fa3', size || 1);
  ctx.restore();
};

SE.toast = function (msg, color) {
  SE.toasts.push({ msg, t: 0, life: 3.6, color: color || '#fff7ea' });
  if (SE.toasts.length > 3) SE.toasts.shift();
};
SE.drawToasts = function (dt) {
  let y = SE.H - 46;
  for (let i = SE.toasts.length - 1; i >= 0; i--) {
    const t = SE.toasts[i];
    t.t += dt;
    if (t.t > t.life) { SE.toasts.splice(i, 1); continue; }
    const a = Math.min(1, t.t * 4, (t.life - t.t) * 2);
    const w = SE.measure(t.msg, 8) + 16;
    SE.panel(SE.W / 2 - w / 2, y - (1 - Math.min(1, t.t * 4)) * 6, w, 15, { alpha: a * 0.95 });
    SE.text(t.msg, SE.W / 2, y + 4 - (1 - Math.min(1, t.t * 4)) * 6, { align: 'center', color: t.color, alpha: a });
    y -= 18;
  }
};

// Floating hearts / sparkles shared by scenes.
SE.floaters = [];
SE.spawnFloater = function (x, y, kind = 'heart', color) {
  SE.floaters.push({ x, y, vx: SE.rand(-8, 8), vy: SE.rand(-26, -16), t: 0, life: SE.rand(1.1, 1.6), kind, color });
};
SE.drawFloaters = function (dt) {
  for (let i = SE.floaters.length - 1; i >= 0; i--) {
    const f = SE.floaters[i];
    f.t += dt;
    if (f.t > f.life) { SE.floaters.splice(i, 1); continue; }
    f.x += f.vx * dt + Math.sin(f.t * 6) * 0.2;
    f.y += f.vy * dt;
    const a = 1 - f.t / f.life;
    if (f.kind === 'heart') SE.heart(f.x, f.y, 1, f.color, a);
    else if (f.kind === 'note') { SE.ctx.save(); SE.ctx.globalAlpha = a; SE.drawIcon('note', f.x, f.y, f.color || '#ffe6b8'); SE.ctx.restore(); }
    else {
      SE.ctx.fillStyle = f.color || '#fff4c2';
      SE.ctx.globalAlpha = a;
      const s = f.t % 0.3 < 0.15 ? 1 : 0;
      SE.ctx.fillRect(Math.round(f.x), Math.round(f.y) - s, 1, 1 + 2 * s);
      SE.ctx.fillRect(Math.round(f.x) - s, Math.round(f.y), 1 + 2 * s, 1);
      SE.ctx.globalAlpha = 1;
    }
  }
};

// Ease a value toward a target, frame-rate independent.
SE.approach = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));

// ---------------------------------------------------------------- watch mode & celebrations
// "Just watch": every scene plays its own activity on a loop so you can sit back.
SE.watching = () => !!SE.save.settings.watch;
SE.toggleWatch = function () {
  SE.save.settings.watch = !SE.save.settings.watch;
  SE.persist();
  SE.toast(SE.save.settings.watch ? 'Just watching — sit back and enjoy.' : 'Your turn again — the activities are all yours.', '#ffe6b8');
};

SE.PROPS = [
  'You did great!', "You're a natural.", 'Waffles is so proud of you.', 'Mochi approves (silently).',
  'Look at you go!', 'That was lovely.', 'Cozy skills: maxed.', 'Wonderful, truly.', 'Gold star for you.',
];
SE.celebration = null;
// opts.y: draw the banner lower (e.g. when the top of the screen is busy)
SE.celebrate = function (title, sub, opts = {}) {
  if (SE.audio) SE.audio.sfx('jingle');
  SE.celebration = { title, sub: sub || SE.pick(SE.PROPS), t: 0, y: opts.y };
  for (let i = 0; i < 16; i++) SE.spawnFloater(SE.W / 2 + SE.rand(-80, 80), 54 + SE.rand(-6, 10), Math.random() < 0.5 ? 'spark' : 'heart', SE.pick(['#ffd166', '#ff8fa3', '#cfe6ff', '#fff4c2']));
};
SE.frameHooks.push(function drawCelebration(ctx, dt) {
  const c = SE.celebration;
  // while a result card is open the jingle already played; the banner waits for the card to close
  if (!c || SE.cardOpen) return;
  c.t += dt;
  const life = 3.2;
  if (c.t > life) { SE.celebration = null; return; }
  const inn = Math.min(1, c.t * 5), out = Math.min(1, (life - c.t) * 3);
  const a = Math.min(inn, out);
  const bounce = Math.sin(Math.min(1, c.t * 3) * Math.PI) * 4;
  const w = Math.max(SE.measure(c.title, 14), SE.measure(c.sub, 8)) + 34;
  const y = (c.y || 44) - bounce - (1 - inn) * 10;
  SE.panel(SE.W / 2 - w / 2, y, w, 38, { alpha: a, fill: 'rgba(72,52,96,0.96)' });
  SE.ctx.save(); SE.ctx.globalAlpha = a;
  SE.drawIcon('heart', SE.W / 2 - w / 2 + 6, y + 6, '#ff8fa3');
  SE.drawIcon('heart', SE.W / 2 + w / 2 - 14, y + 6, '#ff8fa3');
  SE.ctx.restore();
  SE.text(c.title, SE.W / 2, y + 5, { align: 'center', size: 14, color: '#ffd166', alpha: a, bold: true });
  SE.text(c.sub, SE.W / 2, y + 24, { align: 'center', size: 8, color: '#fff7ea', alpha: a });
});

// ---------------------------------------------------------------- main loop

let last = performance.now();
function frame(now) {
  const dt = SE.clamp((now - last) / 1000, 0, 0.05);
  last = now;
  SE.dt = dt;
  SE.time += dt;
  SE.sceneTime += dt;
  SE.idleTime += dt;
  SE.cursor = 'default';
  SE._hot = false;

  const ctx = SE.ctx;
  ctx.setTransform(SE.scale, 0, 0, SE.scale, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#120e1c';
  ctx.fillRect(0, 0, SE.W, SE.H);

  if (SE.save && SE.weather) SE.weather.update(dt);
  if (SE.scene) {
    try {
      SE.scene.update && SE.scene.update(dt);
      SE.scene.draw && SE.scene.draw(ctx, dt);
    } catch (e) {
      // never freeze the cozy loop over one bad frame
      if (!SE._lastErr || SE.time - SE._lastErr > 5) { console.error(e); SE._lastErr = SE.time; }
    }
  }
  for (const h of SE.frameHooks) h(ctx, dt);
  SE.drawFloaters(dt);
  SE.drawToasts(dt);

  // scene fade
  const f = SE.fade;
  f.a = SE.clamp(f.a + Math.sign(f.target - f.a) * f.speed * dt, 0, 1);
  if (f.next && f.a >= 1) {
    SE.switchNow(f.next, f.params);
    f.next = null;
    f.target = 0;
  }
  if (f.a > 0) {
    ctx.fillStyle = `rgba(18,14,28,${SE.ease(f.a)})`;
    ctx.fillRect(0, 0, SE.W, SE.H);
  }

  SE.canvas.style.cursor = SE.cursor;
  SE.mouse.pressed = false;
  SE.mouse.released = false;
  SE.mouse.moved = 0;
  SE.mouse.wheel = 0;
  SE.keysPressed.clear();
  requestAnimationFrame(frame);
}
SE.start = function (sceneName) {
  SE.resize();
  SE.switchNow(sceneName);
  requestAnimationFrame(frame);
};
