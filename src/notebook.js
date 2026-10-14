// The traveler's notebook. The book button plays a little still of him pulling it out of his coat
// pocket, then the real notebook lies open on screen: leather, lined pages, pencil in the spine.
// Turn the pages with the arrows (or ← →): wildlife sketches, the photo album, the fish log and
// the kitchen, and the Bible notes and days in the mountains. Esc or the corner closes it.
'use strict';

(function () {
  const NB = { open: false, spread: 0, photo: null, turn: 0 };
  SE.notebook = NB;
  const BOOK = { w: 400, h: 240 };
  // page areas inside ui/notebook.png (the ribbon hangs below the gutter)
  const LEFT = { x: 94, y: 42, w: 98, h: 140 }, RIGHT = { x: 216, y: 42, w: 98, h: 140 };
  const INK = '#3b2c26', SOFT = '#7a6656', RED = '#9c3b2e';
  // the field guide: one spread per animal (sketch on the left, the photo album on the right)
  const KINDS = ['fox', 'hare', 'deer', 'elk', 'bird', 'owl', 'bear'];
  const SPREADS = ['Days & wildlife', 'Valley map', ...KINDS.map((k) => 'field:' + k), 'Fish & kitchen', 'Notes from the Word', 'Achievements', 'Achievements II'];
  const HINTS = { owl: 'Only out at night.', bird: 'Never in heavy snow or wind.', bear: 'Rare. Stays in its den in a storm.', elk: 'Rare, in the daytime.', fox: 'Day or night.', hare: 'Day or night, hard to spot.', deer: 'Often, if you are patient.' };
  const seenKind = (k) => { const sv = SE.save; return !!(((sv.pinesSeen || {})[k]) || ((sv.album || {})[k] || []).length || (sv.sketches || {})[k]); };
  const spreadTitle = (i) => { const t = SPREADS[i]; if (!t.startsWith('field:')) return t; const k = t.slice(6); return seenKind(k) ? `Field guide · ${(SE.PINES[k] || {}).name}` : 'Field guide · ???'; };

  SE.MOMENTS.pocket = [{ img: 'cut/pocket', dur: 2.0, text: '', pan: 1, sounds: [[0.2, 'rustle'], [1.1, 'rustle']] }];
  SE.openNotebook = function () {
    if (NB.open || SE.momentPlaying()) return;
    SE.moment('pocket', { force: true, then: () => { NB.open = true; NB.photo = null; SE.modal = 'notebook'; SE.audio.sfx('page'); } });
  };
  function close() { NB.open = false; NB.photo = null; if (SE.modal === 'notebook') SE.modal = null; SE.audio.sfx('page'); }
  function turn(d) {
    const n = SE.clamp(NB.spread + d, 0, SPREADS.length - 1);
    if (n !== NB.spread) { NB.spread = n; NB.turn = 1; SE.audio.sfx('page'); }
  }

  const write = (text, x, y, o = {}) => SE.text(text, x, y, Object.assign({ size: 7, color: INK, shadow: false }, o));
  // a long line, wrapped to the page width
  function para(text, x, y, w, o = {}) {
    const words = String(text).split(' ');
    let line = '';
    for (const word of words) {
      const t = line ? line + ' ' + word : word;
      if (SE.measure(t, o.size || 7) > w && line) { write(line, x, y, o); y += 9; line = word; } else line = t;
    }
    if (line) { write(line, x, y, o); y += 9; }
    return y;
  }
  // a small picture glued onto the page, in pencil tones (sketches) or as a little print (photos)
  function pasteIn(ctx, img, x, y, w, h, pencil) {
    if (!img) return;
    ctx.save();
    if (pencil) ctx.filter = 'grayscale(1) sepia(0.55) contrast(1.15) brightness(1.08)';
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }

  // ------------------------------------------------------------ the valley map, drawn as you walk it
  // A pencil-and-ink map of the real valley layout (src/world_layout.js): little inked pines where the
  // forest is, dashed footpaths, the lake in a blue wash, the peak. Only the parts you have walked
  // through with Waffles are drawn in; places get their little picture and name once discovered.
  const INKC = '#5a4030', PEN = '#8a6a4c';
  let mapSketch = null;
  function buildSketch(w, h) {
    const Wd = window.SE_WORLD, k = w / Wd.W, c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d'), N = Wd.nodes;
    const curves = Wd.edges.map(([a, b, q]) => [N[a], q, N[b]]);
    const nearPath = (px, py) => curves.some(([a, q, b]) => {
      for (let t = 0; t <= 1; t += 0.05) {
        const u = 1 - t, cx = u * u * a[0] + 2 * u * t * q[0] + t * t * b[0], cy = u * u * a[1] + 2 * u * t * q[1] + t * t * b[1];
        if (Math.hypot(cx - px, cy - py) < 46) return true;
      }
      return false;
    });
    const lk = Wd.lake, inLake = (px, py) => ((px - lk.cx) / (lk.rx + 30)) ** 2 + ((py - lk.cy) / (lk.ry + 30)) ** 2 < 1;
    const inClear = (px, py) => Wd.clearings.some((cl) => Math.hypot(cl.x - px, cl.y - py) < cl.r + 14);
    const mtn = (Wd.objects.find((o) => o.img === 'map/mountain_td') || {}).solid || [1060, 60, 200, 150];
    // forest: a loose grid of tiny inked pines
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let gy = 3; gy < h - 1; gy += 6) for (let gx = 2; gx < w - 2; gx += 6) {
      const tx = gx + Math.round(rnd() * 3 - 1.5), ty = gy + Math.round(rnd() * 2 - 1), wx = tx / k, wy = ty / k;
      if (inClear(wx, wy) || nearPath(wx, wy) || inLake(wx, wy) || (wx > mtn[0] - 20 && wx < mtn[0] + mtn[2] + 20 && wy < mtn[1] + mtn[3] + 10)) continue;
      x.fillStyle = rnd() < 0.3 ? PEN : INKC;
      x.fillRect(tx, ty - 3, 1, 1); x.fillRect(tx - 1, ty - 2, 3, 1); x.fillRect(tx - 1, ty - 1, 3, 1); x.fillRect(tx - 2, ty, 5, 1);
      x.fillStyle = PEN; x.fillRect(tx, ty + 1, 1, 1);
    }
    // footpaths: pencil dashes
    x.fillStyle = PEN;
    for (const [a, q, b] of curves) {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) * k, steps = Math.max(4, Math.round(len / 2));
      for (let i = 0; i <= steps; i++) {
        if (i % 3 === 2) continue;
        const t = i / steps, u = 1 - t;
        x.fillRect(Math.round((u * u * a[0] + 2 * u * t * q[0] + t * t * b[0]) * k), Math.round((u * u * a[1] + 2 * u * t * q[1] + t * t * b[1]) * k), 1, 1);
      }
    }
    // the frozen lake: a blue wash and an inked shore
    x.fillStyle = 'rgba(126,166,196,0.55)'; x.strokeStyle = INKC; x.lineWidth = 1;
    x.beginPath(); x.ellipse(lk.cx * k, lk.cy * k, lk.rx * k, lk.ry * k, 0, 0, Math.PI * 2); x.fill(); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.moveTo((lk.cx - 40) * k, (lk.cy - 20) * k); x.lineTo((lk.cx + 10) * k, (lk.cy - 26) * k); x.stroke();
    // the peak: two inked triangles with snow on top
    const peak = (px, py, pw, ph) => {
      x.fillStyle = '#efe6d2'; x.strokeStyle = INKC;
      x.beginPath(); x.moveTo(px - pw / 2, py + ph); x.lineTo(px, py); x.lineTo(px + pw / 2, py + ph); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = PEN; x.beginPath(); x.moveTo(px, py); x.lineTo(px + pw / 2, py + ph); x.lineTo(px + pw / 6, py + ph); x.closePath(); x.fill();
    };
    peak((mtn[0] + 60) * k, (mtn[1] + 10) * k, 90 * k, 120 * k);
    peak((mtn[0] + 130) * k, (mtn[1] - 10) * k, 120 * k, 150 * k);
    return c;
  }
  // the little picture for each place once found
  function placeMark(ctx, id, px, py) {
    ctx.fillStyle = INKC;
    const house = (cross) => {
      ctx.fillStyle = '#efe6d2'; ctx.fillRect(px - 3, py - 3, 7, 5);
      ctx.fillStyle = INKC; ctx.fillRect(px - 4, py - 4, 9, 1); ctx.fillRect(px - 3, py - 5, 7, 1); ctx.fillRect(px - 2, py - 6, 5, 1); ctx.fillRect(px - 1, py - 7, 3, 1);
      ctx.fillRect(px - 3, py + 2, 7, 1); ctx.fillRect(px - 3, py - 3, 1, 5); ctx.fillRect(px + 3, py - 3, 1, 5); ctx.fillStyle = '#c0703a'; ctx.fillRect(px, py - 1, 1, 3);
      if (cross) { ctx.fillStyle = INKC; ctx.fillRect(px, py - 11, 1, 4); ctx.fillRect(px - 1, py - 10, 3, 1); }
    };
    if (id === 'cabin') house(false);
    else if (id === 'chapel') house(true);
    else if (id === 'woodlot') { ctx.fillRect(px - 3, py, 7, 2); ctx.fillStyle = '#c0703a'; ctx.fillRect(px - 3, py, 1, 2); ctx.fillStyle = INKC; ctx.fillRect(px + 2, py - 4, 1, 4); ctx.fillRect(px + 1, py - 4, 3, 1); }
    else if (id === 'lake') { ctx.fillStyle = '#2f4a60'; ctx.fillRect(px - 1, py - 1, 3, 2); ctx.fillStyle = INKC; ctx.fillRect(px + 2, py - 5, 1, 4); ctx.fillRect(px + 3, py - 5, 2, 1); }
    else if (id === 'summit') { ctx.fillRect(px, py - 6, 1, 6); ctx.fillStyle = '#b8402e'; ctx.fillRect(px + 1, py - 6, 3, 2); }
    else if (id === 'forest') { for (const [dx, dy] of [[-3, 0], [3, 1], [0, -2]]) { ctx.fillStyle = '#3c5a3a'; ctx.fillRect(px + dx, py + dy - 4, 1, 1); ctx.fillRect(px + dx - 1, py + dy - 3, 3, 2); ctx.fillRect(px + dx - 2, py + dy - 1, 5, 1); } }
    else if (id === 'trail') { ctx.fillRect(px, py - 4, 1, 5); ctx.fillRect(px - 1, py, 3, 1); ctx.fillRect(px - 2, py - 1, 1, 1); ctx.fillRect(px + 2, py - 1, 1, 1); }
  }
  function drawValleyMap(ctx, x, y, w, h) {
    const Wd = window.SE_WORLD, k = w / Wd.W, mh = Math.min(h, Math.round(Wd.H * k));
    if (!mapSketch || mapSketch.width !== w) mapSketch = buildSketch(w, mh);
    const sv = SE.save, S = SE.MAP_SEEN || { c: 64, w: Math.ceil(Wd.W / 64), h: Math.ceil(Wd.H / 64) };
    // reveal what has been walked through (and the cabin you started from)
    const fog = document.createElement('canvas'); fog.width = w; fog.height = mh;
    const f = fog.getContext('2d');
    const reveal = (wx, wy, r) => {
      const g = f.createRadialGradient(wx * k, wy * k, 0, wx * k, wy * k, r * k);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      f.fillStyle = g; f.fillRect(0, 0, w, mh);
    };
    reveal(Wd.nodes.cabin[0], Wd.nodes.cabin[1], 150);
    const seen = sv.seenMap || '';
    for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) if (seen[j * S.w + i] === '1') reveal((i + 0.5) * S.c, (j + 0.5) * S.c, S.c * 1.05);
    f.globalCompositeOperation = 'source-in'; f.drawImage(mapSketch, 0, 0);
    ctx.drawImage(fog, x, y);
    // the places you found, with their names
    let found = 0;
    for (const [id, p] of Object.entries(SE.PLACES || {})) {
      if (!SE.placeFound || !SE.placeFound(id)) continue;
      found++;
      const n = Wd.nodes[p.node], px = Math.round(x + n[0] * k), py = Math.round(y + Math.min(n[1], Wd.H - 30) * k);
      placeMark(ctx, id, px, py);
      const above = id === 'woodlot' || id === 'summit';
      write(p.label, px + (id === 'woodlot' ? 10 : 0), above ? py - 15 : py + 3, { align: 'center', size: 6, color: RED });
    }
    const here = (SE.PLACES || {})[sv.location];
    if (here) { const n = Wd.nodes[here.node]; ctx.fillStyle = RED; const hx = Math.round(x + n[0] * k) + 6, hy = Math.round(y + n[1] * k) - 8; ctx.fillRect(hx - 1, hy - 1, 3, 3); }
    write(`Places found ${found}/${Object.keys(SE.PLACES || {}).length}`, x + 4, y + mh - 9, { size: 6, color: SOFT });
    write('N', x + w - 8, y + 2, { size: 7, color: INKC }); ctx.fillStyle = INKC; ctx.fillRect(x + w - 6, y + 10, 1, 6);
  }

  // the red ribbon bookmark: it lies across the right-hand page from the top of the gutter and
  // hangs out at the bottom (the hanging end is part of ui/notebook.png)
  function drawRibbon(ctx, bx, by) {
    const top = [bx + 204, by + 34], end = [bx + 229, by + 188];
    for (let y = top[1]; y <= end[1]; y++) {
      const t = (y - top[1]) / (end[1] - top[1]);
      const x = Math.round(top[0] + (end[0] - top[0]) * (t * t * 0.4 + t * 0.6)); // a soft curve, like silk lying on paper
      ctx.fillStyle = '#5c1a1e'; ctx.fillRect(x - 3, y, 1, 1); ctx.fillRect(x + 3, y, 1, 1);
      ctx.fillStyle = '#8e2a2c'; ctx.fillRect(x - 2, y, 5, 1);
      ctx.fillStyle = '#b84a44'; ctx.fillRect(x - 1, y, 1, 1);
    }
  }
  // sticky notes on the edge of the book: shortcuts to each part of it
  const TABS = [
    ['Notes', '#f2d16b', () => 0], ['Map', '#9fd3a8', () => SPREADS.indexOf('Valley map')], ['Wildlife', '#f4a7a0', () => SPREADS.indexOf('field:fox')],
    ['Kitchen', '#f6c18c', () => SPREADS.indexOf('Fish & kitchen')], ['Word', '#b9c8f0', () => SPREADS.indexOf('Notes from the Word')], ['Awards', '#e6b8f0', () => SPREADS.indexOf('Achievements')],
  ];
  function tabOf(i) {
    for (let t = TABS.length - 1; t >= 0; t--) if (i >= TABS[t][2]()) return t;
    return 0;
  }
  function drawTabs(ctx, bx, by) {
    const cur = tabOf(NB.spread);
    TABS.forEach(([label, col, to], t) => {
      const on = t === cur, w = 38, h = 15, x = bx + BOOK.w - 14 + (on ? 4 : 0), y = by + 26 + t * 21;
      const r = { x, y, w, h };
      const hover = !NB.photo && SE.inRect(SE.mouse.x, SE.mouse.y, r);
      ctx.fillStyle = 'rgba(20,12,20,0.35)'; ctx.fillRect(x + 1, y + 2, w, h);
      ctx.fillStyle = col; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y, w, 2);   // the sticky strip
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x, y + h - 1, w, 1);
      write(label, x + 5 + (hover ? 1 : 0), y + 3, { size: 7, color: '#3b2c26' });
      if (hover) { SE.cursor = 'pointer'; if (SE.mouse.released) { SE.mouse.released = false; const n = to(); if (n >= 0 && n !== NB.spread) { NB.spread = n; NB.turn = 1; SE.audio.sfx('page'); } } }
    });
  }

  SE.frameHooks.push(function drawNotebook(ctx, dt) {
    if (!NB.open) return;
    const img = SE.img('ui/notebook');
    const bx = Math.round((SE.W - BOOK.w) / 2), by = Math.round((SE.H - BOOK.h) / 2) + 6;
    ctx.fillStyle = 'rgba(10,8,16,0.72)'; ctx.fillRect(0, 0, SE.W, SE.H);
    NB.turn = Math.max(0, NB.turn - dt * 5);
    if (img) ctx.drawImage(img, bx, by - Math.round(NB.turn * 3));
    drawRibbon(ctx, bx, by - Math.round(NB.turn * 3));
    drawTabs(ctx, bx, by);
    const L = { x: bx + LEFT.x, y: by + LEFT.y, w: LEFT.w, h: LEFT.h }, R = { x: bx + RIGHT.x, y: by + RIGHT.y, w: RIGHT.w, h: RIGHT.h };
    const sv = SE.save, W = SE.WILDLIFE || {};
    write(spreadTitle(NB.spread), SE.W / 2, by + 16, { align: 'center', size: 8, color: '#f3e6cf', shadow: true });

    if (NB.spread === 0) {
      write("Traveler's Notes", L.x, L.y, { size: 8, color: RED });
      let y = L.y + 14;
      const row = (a, b) => { write(a, L.x, y); write(String(b), L.x + L.w, y, { align: 'right', color: SOFT }); y += 10; };
      row('Days in the mountains', sv.day);
      row('Km walked in snow', (sv.distance / 1000).toFixed(1));
      row('Firewood split', sv.logs);
      row('Paths shovelled', sv.shoveled);
      row('Shooting stars', sv.stars || 0);
      row('Belly rubs · Waffles', sv.petsDog);
      row('Chin scratches · Mochi', sv.petsCat);
      row('Bears backed away from', sv.bears || 0);
      row('Focus sessions', sv.focusSessions);
      y += 4;
      write(`Achievements ${SE.ach.count()}/${SE.ach.list.length}  ▶`, L.x, y, { color: RED });
      if (SE.inRect(SE.mouse.x, SE.mouse.y, { x: L.x, y, w: L.w, h: 9 })) { SE.cursor = 'pointer'; if (SE.mouse.released) { SE.mouse.released = false; NB.spread = SPREADS.indexOf('Achievements'); NB.turn = 1; SE.audio.sfx('page'); } }
      write('Field guide', R.x, R.y, { size: 8, color: RED });
      KINDS.forEach((k, i) => {
        const cx = R.x + (i % 2) * 52, cy = R.y + 12 + Math.floor(i / 2) * 32;
        const seen = seenKind(k), n = Math.min(SE.sketchTrips(k), (sv.sketches || {})[k] || 0), N = SE.sketchTrips(k);
        ctx.strokeStyle = 'rgba(122,102,86,0.5)'; ctx.strokeRect(cx + 0.5, cy + 0.5, 47, 23);
        if (seen) SE.drawSketchPage(ctx, k, cx + 1, cy + 1, 46, 22, Math.max(0.12, n / N)); else write('?', cx + 24, cy + 7, { align: 'center', color: SOFT });
        write(seen ? `${(SE.PINES[k] || {}).name.split(' ').pop()} ${n}/${N}` : '???', cx + 24, cy + 25, { align: 'center', size: 6, color: seen ? INK : SOFT });
        if (SE.inRect(SE.mouse.x, SE.mouse.y, { x: cx, y: cy, w: 48, h: 30 })) { SE.cursor = 'pointer'; if (SE.mouse.released) { SE.mouse.released = false; NB.spread = SPREADS.indexOf('field:' + k); NB.turn = 1; SE.audio.sfx('page'); } }
      });
    } else if (SPREADS[NB.spread].startsWith('Achievements')) {
      const first = SPREADS[NB.spread] === 'Achievements' ? 0 : 2;
      const hl = SE.ach.drawPage(ctx, first, L, write, SE.mouse), hr = SE.ach.drawPage(ctx, first + 1, R, write, SE.mouse);
      const h = hl || hr;
      write(`${SE.ach.count()} of ${SE.ach.list.length} found`, R.x + R.w, by + BOOK.h - 44, { align: 'right', size: 6, color: SOFT });
      if (h) {
        const name = h.got ? h.a.name : '???', desc = h.got ? h.a.desc : 'Hidden. Keep living in the mountains and it will find you.';
        const tw = Math.max(SE.measure(name, 8), SE.measure(desc, 6)) + 12, tx = SE.clamp(h.cx + 16 - tw / 2, 4, SE.W - tw - 4), ty = Math.min(h.cy + 34, SE.H - 28);
        ctx.fillStyle = 'rgba(48,40,70,0.95)'; ctx.fillRect(tx, ty, tw, 24);
        write(name, tx + 6, ty + 3, { size: 8, color: '#ffe6b8' }); write(desc, tx + 6, ty + 14, { size: 6, color: '#dfe8ff' });
      }
    } else if (SPREADS[NB.spread] === 'Valley map') {
      drawValleyMap(ctx, L.x - 2, L.y - 1, R.x + R.w - L.x + 4, 142);
    } else if (SPREADS[NB.spread].startsWith('field:')) {
      const k = SPREADS[NB.spread].slice(6), P = SE.PINES[k] || {}, seen = seenKind(k);
      if (!seen) {
        write('Not seen yet', L.x, L.y, { size: 8, color: RED });
        para('Lie low in the Whispering Pines with Waffles and wait. ' + (HINTS[k] || ''), L.x, L.y + 16, L.w, { color: SOFT });
        write('?', R.x + R.w / 2, R.y + R.h / 2 - 10, { align: 'center', size: 16, color: SOFT });
      } else {
        // left page: the sketch, as far as you have got with it
        const n = Math.min(SE.sketchTrips(k), (sv.sketches || {})[k] || 0), N = SE.sketchTrips(k);
        write(P.name, L.x, L.y, { size: 8, color: RED });
        SE.drawSketchPage(ctx, k, L.x + 1, L.y + 13, L.w - 2, 55, n / N);
        let y = L.y + 74;
        write(n >= N ? 'Sketch finished!' : `Sketch: ${n} of ${N} sittings`, L.x, y, { color: n >= N ? RED : INK }); y += 10;
        write(`Watched in the pines: ${(sv.pinesSeen || {})[k] || 0}×`, L.x, y, { size: 6, color: SOFT }); y += 9;
        para(HINTS[k] || '', L.x, y, L.w, { size: 6, color: SOFT });
        // right page: one photo of each moment in each light and weather
        const conds = SE.pinesConds(k), got = (sv.pinesAlbum || {})[k] || [];
        const cw = Math.floor((R.w - (conds.length - 1) * 2) / conds.length), ch = Math.round(cw * 136 / 240);
        write(`Photos ${got.length}/${conds.length * 3}`, R.x, R.y, { size: 8, color: RED });
        conds.forEach((c, ci) => write(SE.PINES_COND_LABEL[c], R.x + ci * (cw + 2) + cw / 2, R.y + 11, { align: 'center', size: 5, color: SOFT }));
        for (let b = 1; b <= 3; b++) {
          conds.forEach((c, ci) => {
            const x = R.x + ci * (cw + 2), py = R.y + 18 + (b - 1) * (ch + 3), has = got.includes(`${b}_${c}`);
            ctx.fillStyle = has ? '#fbf6ec' : 'rgba(122,102,86,0.18)'; ctx.fillRect(x, py, cw, ch);
            if (has) {
              const src = SE.stillFor(`cut/pines_${k}_${b}`, SE.pinesLight(c));
              pasteIn(ctx, SE.img(src), x + 1, py + 1, cw - 2, ch - 2, false);
              if (SE.inRect(SE.mouse.x, SE.mouse.y, { x, y: py, w: cw, h: ch })) { SE.cursor = 'pointer'; if (SE.mouse.released) { SE.mouse.released = false; NB.photo = { src, caption: `${P.name} · ${SE.PINES_COND_LABEL[c]}`, wide: true }; } }
            } else write('?', x + cw / 2, py + ch / 2 - 3, { align: 'center', size: 6, color: SOFT });
          });
        }
        // and the prints from wild encounters on your walks
        const prints = (sv.album || {})[k] || [], py = R.y + 18 + 3 * (ch + 3) + 6;
        write(`From the trail ${prints.length}/3`, R.x, py, { size: 6, color: SOFT });
        for (let j = 0; j < 3; j++) {
          const x = R.x + j * 33, has = prints.includes(j);
          ctx.fillStyle = has ? '#fbf6ec' : 'rgba(122,102,86,0.18)'; ctx.fillRect(x, py + 9, 31, 20);
          if (has) {
            pasteIn(ctx, SE.img(`photo/${k}_${j}`), x + 1, py + 10, 29, 18, false);
            if (SE.inRect(SE.mouse.x, SE.mouse.y, { x, y: py + 9, w: 31, h: 20 })) { SE.cursor = 'pointer'; if (SE.mouse.released) { SE.mouse.released = false; NB.photo = { src: `photo/${k}_${j}`, caption: W[k] ? W[k].shots[j] : '' }; } }
          }
        }
      }
    } else if (SPREADS[NB.spread] === 'Fish & kitchen') {
      write('Fish log', L.x, L.y, { size: 8, color: RED });
      let y = L.y + 14;
      for (const [name, f] of Object.entries(SE.FISH || {})) {
        const seen = sv.caught[name];
        SE.drawIcon('fish', L.x, y, seen ? f.color : '#b9a890');
        write(seen ? name : '???', L.x + 11, y, { color: seen ? INK : SOFT });
        write(`${sv.fish[name] || 0} · ${seen || 0}`, L.x + L.w, y, { align: 'right', color: SOFT });
        y += 12;
      }
      para('in the bucket · caught in all', L.x, y + 4, L.w, { size: 6, color: SOFT });
      write('Kitchen', R.x, R.y, { size: 8, color: RED });
      y = R.y + 14;
      for (const d of Object.keys(SE.DISHES || {})) {
        const n = sv.dishes[d] || 0, known = n || d === 'Hot Chocolate';
        write(known ? d : '???', R.x, y, { color: known ? INK : SOFT }); write(String(n), R.x + R.w, y, { align: 'right', color: SOFT }); y += 10;
      }
      write('Mugs tried', R.x, y); write(`${Object.keys(sv.mugsUsed || {}).length}/${(SE.MUGS || []).length}`, R.x + R.w, y, { align: 'right', color: SOFT }); y += 10;
      write('Meals cooked', R.x, y); write(String(sv.cooked), R.x + R.w, y, { align: 'right', color: SOFT }); y += 16;
      para('Catch fish at the Frozen Lake; the kitchen turns them into dinner for three.', R.x, y, R.w, { size: 6, color: SOFT });
    } else {
      write('From the Bible', L.x, L.y, { size: 8, color: RED });
      let y = L.y + 14;
      const notes = (sv.verses || []).slice(-6).reverse();
      if (!notes.length) y = para('Read by the fire in the cabin — the verses you mark end up here.', L.x, y, L.w, { color: SOFT });
      for (const [text, ref] of notes) { y = para(`“${text}”`, L.x, y, L.w); write(ref, L.x + L.w, y - 2, { align: 'right', size: 6, color: SOFT }); y += 6; if (y > L.y + L.h - 8) break; }
      write('Chapel', R.x, R.y, { size: 8, color: RED });
      y = R.y + 14;
      write('Prayers', R.x, y); write(String(sv.prayers || 0), R.x + R.w, y, { align: 'right', color: SOFT }); y += 10;
      write('Candles lit', R.x, y); write(String(sv.candles || 0), R.x + R.w, y, { align: 'right', color: SOFT }); y += 10;
      write('Chapters read', R.x, y); write(String(sv.bibleReads || 0), R.x + R.w, y, { align: 'right', color: SOFT }); y += 10;
      write('Nights slept', R.x, y); write(String(sv.sleeps || 0), R.x + R.w, y, { align: 'right', color: SOFT });
    }

    // a photo lifted out of the album, bigger
    if (NB.photo) {
      const p = SE.img(NB.photo.src), w = NB.photo.wide ? 336 : 256, h = NB.photo.wide ? 190 : 192, x = SE.W / 2 - w / 2, y = 22;
      ctx.fillStyle = '#fbf6ec'; ctx.fillRect(x - 6, y - 6, w + 12, h + 26);
      if (p) { ctx.imageSmoothingEnabled = false; ctx.drawImage(p, x, y, w, h); }
      write(NB.photo.caption || '', SE.W / 2, y + h + 6, { align: 'center', size: 8, color: '#3a2a2a' });
      if (SE.mouse.released || SE.key('Escape')) { SE.mouse.released = false; NB.photo = null; }
      return;
    }
    if (NB.spread > 0 && (SE.button(bx + 22, by + BOOK.h - 30, 22, 16, '◀', { modal: true, size: 9 }) || SE.key('ArrowLeft'))) turn(-1);
    if (NB.spread < SPREADS.length - 1 && (SE.button(bx + BOOK.w - 44, by + BOOK.h - 30, 22, 16, '▶', { modal: true, size: 9 }) || SE.key('ArrowRight'))) turn(1);
    write(`${NB.spread + 1} / ${SPREADS.length}`, SE.W / 2, by + BOOK.h - 26, { align: 'center', size: 6, color: '#f3e6cf', shadow: true });
    if (SE.button(bx + BOOK.w - 34, by + 4, 16, 14, 'x', { modal: true }) || SE.key('Escape')) close();
  });
})();
