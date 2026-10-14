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
  const SPREADS = ['Days & wildlife', ...KINDS.map((k) => 'field:' + k), 'Fish & kitchen', 'Notes from the Word'];
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

  SE.frameHooks.push(function drawNotebook(ctx, dt) {
    if (!NB.open) return;
    const img = SE.img('ui/notebook');
    const bx = Math.round((SE.W - BOOK.w) / 2), by = Math.round((SE.H - BOOK.h) / 2) + 6;
    ctx.fillStyle = 'rgba(10,8,16,0.72)'; ctx.fillRect(0, 0, SE.W, SE.H);
    NB.turn = Math.max(0, NB.turn - dt * 5);
    if (img) ctx.drawImage(img, bx, by - Math.round(NB.turn * 3));
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
      write('Field guide', R.x, R.y, { size: 8, color: RED });
      KINDS.forEach((k, i) => {
        const cx = R.x + (i % 2) * 52, cy = R.y + 12 + Math.floor(i / 2) * 32;
        const seen = seenKind(k), n = Math.min(SE.sketchTrips(k), (sv.sketches || {})[k] || 0), N = SE.sketchTrips(k);
        ctx.strokeStyle = 'rgba(122,102,86,0.5)'; ctx.strokeRect(cx + 0.5, cy + 0.5, 47, 23);
        if (seen) SE.drawSketchPage(ctx, k, cx + 1, cy + 1, 46, 22, Math.max(0.12, n / N)); else write('?', cx + 24, cy + 7, { align: 'center', color: SOFT });
        write(seen ? `${(SE.PINES[k] || {}).name.split(' ').pop()} ${n}/${N}` : '???', cx + 24, cy + 25, { align: 'center', size: 6, color: seen ? INK : SOFT });
        if (SE.inRect(SE.mouse.x, SE.mouse.y, { x: cx, y: cy, w: 48, h: 30 })) { SE.cursor = 'pointer'; if (SE.mouse.released) { SE.mouse.released = false; NB.spread = 1 + i; NB.turn = 1; SE.audio.sfx('page'); } }
      });
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
        ctx.strokeStyle = 'rgba(122,102,86,0.45)'; ctx.strokeRect(L.x + 0.5, L.y + 12.5, L.w - 1, 56);
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
      write('Hot chocolate', R.x, y); write(String(sv.cocoa), R.x + R.w, y, { align: 'right', color: SOFT }); y += 10;
      for (const d of Object.keys(SE.DISHES || {})) { write(d, R.x, y); write(String(sv.dishes[d] || 0), R.x + R.w, y, { align: 'right', color: SOFT }); y += 10; }
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
