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
  const SPREADS = ['Days & wildlife', 'Photo album', 'Fish & kitchen', 'Notes from the Word'];

  SE.MOMENTS.pocket = [{ img: 'cut/pocket', dur: 2.0, text: '', pan: 1, sounds: [[0.2, 'rustle'], [1.1, 'rustle']] }];
  SE.openNotebook = function () {
    if (NB.open || SE.momentPlaying()) return;
    SE.moment('pocket', { force: true, then: () => { NB.open = true; NB.photo = null; SE.modal = 'notebook'; SE.audio.sfx('rustle'); } });
  };
  function close() { NB.open = false; NB.photo = null; if (SE.modal === 'notebook') SE.modal = null; SE.audio.sfx('rustle'); }
  function turn(d) {
    const n = SE.clamp(NB.spread + d, 0, SPREADS.length - 1);
    if (n !== NB.spread) { NB.spread = n; NB.turn = 1; SE.audio.sfx('rustle'); }
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
    write(SPREADS[NB.spread], SE.W / 2, by + 16, { align: 'center', size: 8, color: '#f3e6cf', shadow: true });

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
      write('Wildlife (sketched)', R.x, R.y, { size: 8, color: RED });
      const kinds = ['deer', 'elk', 'fox', 'hare', 'owl', 'bird', 'bear'];
      const sk = sv.sketches || {}, album = sv.album || {};
      kinds.forEach((k, i) => {
        const cx = R.x + (i % 2) * 56, cy = R.y + 12 + Math.floor(i / 2) * 32;
        const seen = sk[k] || (album[k] || []).length;
        if (seen) pasteIn(ctx, SE.img(`cut/see_${k}`), cx, cy, 48, 24, true);
        else { ctx.strokeStyle = 'rgba(122,102,86,0.5)'; ctx.strokeRect(cx + 0.5, cy + 0.5, 47, 23); write('?', cx + 24, cy + 7, { align: 'center', color: SOFT }); }
        write(W[k] ? W[k].name.split(' ').pop() : k, cx + 24, cy + 25, { align: 'center', size: 6, color: seen ? INK : SOFT });
      });
    } else if (NB.spread === 1) {
      // three camera-only photos per animal, tucked into the pages like little prints
      const kinds = ['deer', 'elk', 'fox', 'hare', 'owl', 'bird', 'bear'];
      const album = sv.album || {};
      let count = 0;
      kinds.forEach((k, i) => {
        const page = i < 4 ? L : R, row = i < 4 ? i : i - 4;
        const y = page.y + 4 + row * 34;
        write(W[k] ? W[k].name.split(' ').pop() : k, page.x, y, { size: 6, color: SOFT });
        for (let j = 0; j < 3; j++) {
          const x = page.x + j * 36, py = y + 8, got = (album[k] || []).includes(j);
          ctx.fillStyle = got ? '#fbf6ec' : 'rgba(122,102,86,0.18)'; ctx.fillRect(x, py, 32, 22);
          if (got) { pasteIn(ctx, SE.img(`photo/${k}_${j}`), x + 1, py + 1, 30, 18, false); count++; }
          if (got && SE.inRect(SE.mouse.x, SE.mouse.y, { x, y: py, w: 32, h: 22 })) { SE.cursor = 'pointer'; if (SE.mouse.released) { SE.mouse.released = false; NB.photo = { k, j }; } }
        }
      });
      write(`${count} / 21 photos`, R.x + R.w, R.y + R.h - 8, { align: 'right', size: 6, color: SOFT });
    } else if (NB.spread === 2) {
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
      const p = SE.img(`photo/${NB.photo.k}_${NB.photo.j}`), w = 256, h = 192, x = SE.W / 2 - w / 2, y = 22;
      ctx.fillStyle = '#fbf6ec'; ctx.fillRect(x - 6, y - 6, w + 12, h + 26);
      if (p) { ctx.imageSmoothingEnabled = false; ctx.drawImage(p, x, y, w, h); }
      write(W[NB.photo.k] ? W[NB.photo.k].shots[NB.photo.j] : '', SE.W / 2, y + h + 6, { align: 'center', size: 8, color: '#3a2a2a' });
      if (SE.mouse.released || SE.key('Escape')) { SE.mouse.released = false; NB.photo = null; }
      return;
    }
    if (NB.spread > 0 && (SE.button(bx + 22, by + BOOK.h - 30, 22, 16, '◀', { modal: true, size: 9 }) || SE.key('ArrowLeft'))) turn(-1);
    if (NB.spread < SPREADS.length - 1 && (SE.button(bx + BOOK.w - 44, by + BOOK.h - 30, 22, 16, '▶', { modal: true, size: 9 }) || SE.key('ArrowRight'))) turn(1);
    write(`${NB.spread + 1} / ${SPREADS.length}`, SE.W / 2, by + BOOK.h - 26, { align: 'center', size: 6, color: '#f3e6cf', shadow: true });
    if (SE.button(bx + BOOK.w - 34, by + 4, 16, 14, 'x', { modal: true }) || SE.key('Escape')) close();
  });
})();
