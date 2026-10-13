// Kitchen: hot chocolate (pour, scoop, stir, marshmallows) and cooking your catch (chop, season, fry, plate).
'use strict';

(function () {
  const WINDOWS = [{ x: 258, y: 52, w: 74, h: 70 }, { x: 37, y: 44, w: 42, h: 92 }];
  const ARROWS = { ArrowLeft: '←', ArrowUp: '↑', ArrowRight: '→', ArrowDown: '↓' };
  const ARROW_KEYS = Object.keys(ARROWS);
  let mode = 'idle', g = null, steam = [];

  const CARD = { x: 90, y: 50, w: 300, h: 194 };
  // a press inside the card (or Space/Enter) — never a click on the HUD, a panel or 'Leave it'
  const confirm = () => (g && g.tap) || (!SE.modal && ((SE.mouse.pressed && SE.inRect(SE.mouse.x, SE.mouse.y, CARD)) || SE.key('Space') || SE.key('Enter')));
  const playing = () => !SE.modal;
  function clearAuto() { if (!g) return; g.tap = false; g.autoKey = null; g.autoHold = false; g.autoDrop = false; g.autoServe = false; g.autoSprinkle = false; g.autoEnjoy = false; }

  function card(ctx, title, hint) {
    ctx.fillStyle = 'rgba(18,12,26,0.55)';
    ctx.fillRect(0, 0, SE.W, SE.H);
    SE.panel(CARD.x, CARD.y, CARD.w, CARD.h, { fill: 'rgba(60,44,52,0.97)' });
    ctx.fillStyle = '#6b4a3a';
    ctx.fillRect(CARD.x + 6, CARD.y + 26, CARD.w - 12, CARD.h - 52);
    ctx.fillStyle = 'rgba(255,220,170,0.06)';
    for (let i = 0; i < 9; i++) ctx.fillRect(CARD.x + 6, CARD.y + 32 + i * 16, CARD.w - 12, 1);
    SE.text(title, CARD.x + 10, CARD.y + 8, { size: 10, color: '#ffe6b8' });
    if (hint) SE.text(hint, CARD.x + CARD.w / 2, CARD.y + CARD.h - 20, { align: 'center', size: 8, color: '#fff7ea', alpha: 0.75 + 0.25 * Math.sin(SE.time * 3) });
  }

  // ------------------------------------------------------------ hot chocolate
  function drawMug(ctx, cx, cy, s) {
    // the PixelLab mug (a knitted red band, drawn at 2x); its opening shows what is inside
    const img = SE.img('props/mug');
    if (img) {
      const w = img.width * 2, h = img.height * 2, x = Math.round(cx - w / 2), y = Math.round(cy - h / 2);
      ctx.drawImage(img, x, y, w, h);
      const ex = x + 40, ey = y + 54, rx = 32, ry = 12;
      const col = s.level > 0 ? mix([246, 240, 228], [122, 70, 44], s.choc) : '58,36,40';
      ctx.fillStyle = `rgb(${col})`;
      ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(ex - rx + 6, ey - ry + 2, rx, 1);
      if (s.swirl) {
        ctx.fillStyle = `rgba(255,236,210,${0.5 * (1 - s.choc)})`;
        for (let i = 0; i < 6; i++) { const a = s.swirl + i; ctx.fillRect(Math.round(ex + Math.cos(a) * (6 + i * 3)), Math.round(ey + Math.sin(a) * (2 + i)), 2, 1); }
      }
      // how full it is: a little gauge beside the mug
      const gx = x - 14, gy = y + 40, gh = h - 50;
      ctx.fillStyle = 'rgba(20,16,30,0.85)'; ctx.fillRect(gx, gy, 6, gh);
      ctx.fillStyle = `rgb(${col})`; const lh = Math.round(gh * s.level); ctx.fillRect(gx + 1, gy + gh - lh, 4, lh);
      if (s.target) { ctx.fillStyle = '#7fd38a'; ctx.fillRect(gx - 3, Math.round(gy + gh - gh * s.target), 12, 1); }
      for (const m of s.marsh || []) {
        ctx.fillStyle = '#fffaf2'; ctx.fillRect(Math.round(m.x), Math.round(m.y), 6, 4);
        ctx.fillStyle = '#f0d9e0'; ctx.fillRect(Math.round(m.x), Math.round(m.y) + 3, 6, 1);
      }
      // marshmallows land on the surface inside the opening
      return { x, y, w, h, inner: { x: ex - rx + 8, y: ey - ry, w: rx * 2 - 22, h: ry * 2 + 2 } };
    }
    const w = 54, h = 58, x = Math.round(cx - w / 2), y = Math.round(cy - h / 2);
    ctx.fillStyle = '#efe2d0'; ctx.fillRect(x, y, w, h);
    const inner = { x: x + 4, y: y + 4, w: w - 8, h: h - 12 };
    if (s.level > 0) {
      const lh = Math.round(inner.h * s.level);
      ctx.fillStyle = `rgb(${mix([246, 240, 228], [122, 70, 44], s.choc)})`;
      ctx.fillRect(inner.x, inner.y + inner.h - lh, inner.w, lh);
    }
    // the fill target line
    if (s.target) {
      const ty = Math.round(inner.y + inner.h - inner.h * s.target);
      ctx.fillStyle = '#7fd38a';
      ctx.fillRect(x - 8, ty, 6, 1); ctx.fillRect(x + w + 2, ty, 4, 1);
      ctx.fillStyle = 'rgba(127,211,138,0.25)';
      ctx.fillRect(x - 8, Math.round(inner.y + inner.h - inner.h * (s.target + 0.08)), 3, Math.round(inner.h * 0.16));
    }
    for (const m of s.marsh || []) {
      ctx.fillStyle = '#fffaf2'; ctx.fillRect(Math.round(m.x), Math.round(m.y), 6, 4);
      ctx.fillStyle = '#f0d9e0'; ctx.fillRect(Math.round(m.x), Math.round(m.y) + 3, 6, 1);
    }
    return { x, y, w, h, inner };
  }
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',');

  function startCocoa() {
    mode = 'cocoa';
    SE.moment('cocoa'); // milk going into the pan: a still and the sound of pouring
    g = { stage: 'milk', level: 0, choc: 0, scoops: 0, stir: 0, swirl: 0, marsh: [], t: 0, spoonT: 0, lastAng: null, quality: 1, poured: false, pour: null, lastKey: null };
  }
  function autoCocoa(dt) {
    // the traveler makes it himself, slightly differently every time
    g.tap = false;
    g.autoT = (g.autoT || 0) + dt;
    if (!g.plan) g.plan = { fill: 0.74 + Math.random() * 0.1, marsh: SE.randi(0, 6), aim: SE.rand(4, 12) };
    if (g.stage === 'milk') g.autoHold = g.level < g.plan.fill;
    else g.autoHold = false;
    if (g.stage === 'cocoa' && Math.abs(Math.sin(g.spoonT * 2.2) * 90) < g.plan.aim && g.autoT > 0.6) { g.tap = true; g.autoT = 0; }
    if (g.stage === 'stir') { g.stir += dt * 0.32; g.swirl += dt * 6; if (Math.random() < dt * 3) SE.audio.sfx('stir'); }
    if (g.stage === 'top' && g.autoT > 0.55) {
      g.autoT = 0;
      if (g.marsh.length < g.plan.marsh) { g.autoDrop = true; SE.audio.sfx('pop'); }
      else g.autoServe = true;
    }
  }
  function cocoa(ctx, dt) {
    if (SE.momentPlaying()) return;
    g.t += dt;
    if (SE.watching()) autoCocoa(dt); else clearAuto();
    const titles = { milk: 'Pour the milk', cocoa: 'Two scoops of cocoa', stir: 'Stir it smooth', top: 'Marshmallows?' };
    const hints = {
      milk: 'Hold the mouse (or Space) to pour — stop at the green line',
      cocoa: `Click when the spoon is over the mug (${g.scoops}/2)`,
      stir: 'Circle the mouse around the mug, or tap ← →',
      top: 'Click the mug to drop marshmallows',
    };
    card(ctx, titles[g.stage], hints[g.stage]);
    const cx = SE.W / 2, cy = CARD.y + 112;
    let mug;
    if (g.stage === 'stir' && SE.anims.cocoa_stir) {
      // a close look: his hands stirring the mug with a spoon; your circles turn the spoon
      const sz = SE.animSize('cocoa_stir');
      const frame = Math.floor(Math.abs(g.swirl) * 1.9) % SE.anims.cocoa_stir.frames;
      SE.drawAnim('cocoa_stir', Math.round(cx - sz.w / 2), CARD.y + 52, 0, { frame });
      mug = { x: cx - sz.w / 2, y: CARD.y + 52, w: sz.w, h: sz.h, inner: { x: cx - 20, y: CARD.y + 90, w: 40, h: 20 } };
    } else mug = drawMug(ctx, cx, cy, { level: g.level, choc: g.choc, swirl: g.stage === 'stir' ? g.swirl : 0, target: g.stage === 'milk' ? 0.78 : 0, marsh: g.marsh });

    if (g.stage === 'milk') {
      const pouring = (playing() && (SE.mouse.down && SE.inRect(SE.mouse.x, SE.mouse.y, CARD) || SE.held('Space'))) || g.autoHold;
      // milk jug
      const jx = cx - 50, jy = CARD.y + 34 + (pouring ? 4 : 0);
      ctx.fillStyle = '#2b1d2a'; ctx.fillRect(jx - 1, jy - 1, 30, 26);
      ctx.fillStyle = '#dfe8f5'; ctx.fillRect(jx, jy, 28, 24);
      ctx.fillStyle = '#9fb6d6'; ctx.fillRect(jx, jy + 8, 28, 5);
      if (pouring) {
        g.poured = true;
        g.level = Math.min(1, g.level + dt * 0.32);
        if (!g.pour) g.pour = SE.audio.loop('pour');
        g.pour.set(g.level);
        ctx.fillStyle = '#f6f0e4';
        ctx.fillRect(jx + 28, jy + 4, 3, 2);
        ctx.fillRect(cx - 18, jy + 5, 2, mug.inner.y + mug.inner.h * (1 - g.level) - jy - 3);
      } else if (g.pour) { g.pour.stop(); g.pour = null; }
      if (!pouring && g.poured && g.level > 0.25) {
        const off = Math.abs(g.level - 0.78);
        g.quality = off < 0.06 ? 1 : off < 0.14 ? 0.8 : 0.6;
        SE.toast(off < 0.06 ? 'Perfect pour!' : g.level > 0.78 ? 'A generous pour.' : 'A modest pour. Still lovely.');
        g.stage = 'cocoa';
      }
    } else if (g.stage === 'cocoa') {
      g.spoonT += dt;
      const sx = cx + Math.sin(g.spoonT * 2.2) * 90, sy = CARD.y + 40;
      ctx.fillStyle = '#2b1d2a'; ctx.fillRect(Math.round(sx) - 9, sy - 1, 20, 9);
      ctx.fillStyle = '#c9ccd6'; ctx.fillRect(Math.round(sx) - 8, sy, 18, 7);
      ctx.fillStyle = '#6b3b22'; ctx.fillRect(Math.round(sx) - 6, sy + 1, 14, 4);
      ctx.fillStyle = '#c9ccd6'; ctx.fillRect(Math.round(sx) + 10, sy + 2, 18, 2);
      if (confirm()) {
        if (Math.abs(sx - cx) < 20) {
          g.scoops++; g.choc = Math.min(0.85, g.choc + 0.32); SE.audio.sfx('stir');
          for (let i = 0; i < 8; i++) SE.spawnFloater(cx + SE.rand(-12, 12), mug.y, 'spark', '#a0643c');
          if (g.scoops >= 2) g.stage = 'stir';
        } else {
          SE.audio.sfx('click');
          for (let i = 0; i < 5; i++) SE.spawnFloater(sx, sy + 6, 'spark', '#a0643c');
        }
      }
    } else if (g.stage === 'stir') {
      const ang = Math.atan2(SE.mouse.y - cy, SE.mouse.x - cx);
      if (g.lastAng != null && SE.mouse.moved > 0 && playing()) {
        let d = ang - g.lastAng;
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        g.stir += Math.abs(d) * 0.07;
        g.swirl += d;
      }
      g.lastAng = ang;
      const key = !playing() ? null : SE.key('ArrowLeft') ? 'L' : SE.key('ArrowRight') ? 'R' : null;
      if (key && key !== g.lastKey) { g.stir += 0.07; g.swirl += 0.9; g.lastKey = key; }
      if (Math.random() < SE.mouse.moved * 0.01) SE.audio.sfx('stir');
      if (key) SE.audio.sfx('stir');
      g.choc = Math.min(1, 0.6 + g.stir * 0.4);
      // progress
      ctx.fillStyle = 'rgba(20,16,30,0.9)'; ctx.fillRect(cx - 50, CARD.y + 40, 100, 4);
      ctx.fillStyle = '#e8aa60'; ctx.fillRect(cx - 50, CARD.y + 40, Math.round(100 * Math.min(1, g.stir)), 4);
      if (g.stir >= 1) { g.stage = 'top'; SE.audio.sfx('soft'); }
    } else if (g.stage === 'top') {
      if (g.autoDrop) {
        g.autoDrop = false;
        g.marsh.push({ x: SE.rand(mug.inner.x, mug.inner.x + mug.inner.w - 6), y: mug.inner.y + mug.inner.h * (1 - g.level) - 2 + SE.rand(-1, 1) });
      }
      if (SE.mouse.released && SE.inRect(SE.mouse.x, SE.mouse.y, { x: mug.x - 10, y: mug.y - 30, w: mug.w + 20, h: mug.h + 30 }) && g.marsh.length < 7) {
        SE.mouse.released = false;
        g.marsh.push({ x: SE.clamp(SE.mouse.x - 3, mug.inner.x, mug.inner.x + mug.inner.w - 6), y: mug.inner.y + mug.inner.h * (1 - g.level) - 2 + SE.rand(-1, 1) });
        SE.audio.sfx('pop');
      }
      if (SE.button(CARD.x + CARD.w - 84, CARD.y + 34, 74, 18, 'Serve ♥', { active: true }) || g.autoServe) {
        SE.save.cocoa++; SE.save.dishes['Hot Chocolate'] = (SE.save.dishes['Hot Chocolate'] || 0) + 1; SE.persist();
        SE.celebrate('Hot chocolate!', g.marsh.length ? `${g.marsh.length} marshmallows on top. ${SE.pick(SE.PROPS)}` : `Simple and perfect. ${SE.pick(SE.PROPS)}`);
        for (let i = 0; i < 10; i++) SE.spawnFloater(cx + SE.rand(-30, 30), cy - 20, 'heart', '#ffc3a0');
        mode = 'idle';
      }
    }
  }

  // ------------------------------------------------------------ cooking fish
  function startCook(fish) {
    mode = 'cook';
    g = { cutIn: 2.6, paw: { t: 0, next: SE.rand(3, 6) }, stage: 'chop', fish, seq: Array.from({ length: 5 }, () => SE.pick(ARROW_KEYS)), i: 0, wobble: 0, cuts: [], herbs: [], done1: 0, side: 0, scores: [], knife: 0, sizzle: null, t: 0 };
  }
  const drawFish = (ctx, cx, cy, scale, cook) => SE.drawFishSprite(ctx, g.fish, cx, cy, scale, cook);
  // once filleted, the fish is two neat fillets (PixelLab sprite), browning as they cook
  SE.FOOD = Object.assign(SE.FOOD || {}, { fillet: { color: '#f2a08a', size: 1, img: 'props/fillet' } });
  function drawFillets(ctx, x, y, scale, cook) {
    if (SE.img('props/fillet')) return SE.drawFishSprite(ctx, 'fillet', x, y, scale, cook);
    return SE.drawFishPieces(ctx, g.fish, x, y, scale, cook, g.cuts, 3);
  }
  // Mochi cannot help herself: now and then her paw sneaks in toward the fish, then pulls back
  function drawPaw(ctx, dt, f) {
    const p = g.paw, img = SE.img('props/paw');
    if (!img) return;
    p.t += dt;
    if (p.t < p.next) return;
    const k = (p.t - p.next) / 2.2; // reach out, hover, pull back
    if (k >= 1) { p.t = 0; p.next = SE.rand(5, 9); return; }
    const reach = Math.sin(Math.min(1, k) * Math.PI);
    const x = Math.round(CARD.x + CARD.w - 18 - reach * Math.min(70, CARD.x + CARD.w - (f.x + f.w) + 30)), y = Math.round(f.y + f.h * 0.4);
    ctx.save(); ctx.translate(x + img.width, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore();
    if (k > 0.45 && k < 0.5 && !p.mew) { p.mew = true; SE.audio.sfx('pop'); }
    if (k > 0.9) p.mew = false;
  }
  // where the pan's cooking surface is in the kitchen_pan art (centre and radii)
  const PAN = { x: 112, y: 62, rx: 50, ry: 20 };
  // hot oil: little bubbles that swell, pop and leave a glint, all over the pan around the fish
  const oil = [];
  function drawOil(ctx, dt, px, py) {
    if (oil.length < 40 && Math.random() < dt * 30) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
      oil.push({ x: px + Math.cos(a) * r * PAN.rx * 0.9, y: py + Math.sin(a) * r * PAN.ry * 0.9, t: 0, life: SE.rand(0.4, 1.1), big: Math.random() < 0.3 });
    }
    for (let i = oil.length - 1; i >= 0; i--) {
      const b = oil[i]; b.t += dt;
      if (b.t > b.life) { oil.splice(i, 1); if (Math.random() < 0.15) SE.spawnFloater(b.x, b.y - 2, 'spark', '#fff4d6'); continue; }
      const k = b.t / b.life, s = b.big ? 2 : 1;
      ctx.fillStyle = `rgba(255,214,120,${0.7 * (1 - k)})`;
      ctx.fillRect(Math.round(b.x), Math.round(b.y), s + (k > 0.6 ? 1 : 0), s);
      ctx.fillStyle = `rgba(255,250,225,${0.9 * (1 - k)})`;
      ctx.fillRect(Math.round(b.x), Math.round(b.y), 1, 1);
    }
  }

  function autoCook(dt) {
    g.tap = false;
    g.autoKey = null;
    g.autoT = (g.autoT || 0) + dt;
    if (!g.plan) g.plan = { flip: [SE.rand(0.6, 0.72), SE.rand(0.58, 0.76)] };
    if (g.stage === 'chop' && g.autoT > 0.55) { g.autoT = 0; g.autoKey = g.seq[g.i]; }
    if (g.stage === 'season' && g.autoT > 0.3) { g.autoT = 0; g.autoSprinkle = true; }
    if (g.stage === 'fry' && g.pos >= g.plan.flip[g.side]) g.tap = true;
    if (g.stage === 'plate' && g.autoT > 4) g.autoEnjoy = true;
  }
  function cook(ctx, dt) {
    g.t += dt;
    if (SE.watching()) autoCook(dt); else clearAuto();
    const titles = { chop: 'Chop', season: 'Season', fry: g.side === 0 ? 'Fry — first side' : 'Fry — second side', plate: 'Plate up' };
    const hints = {
      chop: 'Press the arrow shown (keyboard or the buttons below)',
      season: `Click over the fish to sprinkle dill & salt (${Math.floor(g.herbs.length / 9)}/6)`,
      fry: 'Flip when the marker is in the golden zone (click or Space)',
      plate: '',
    };
    card(ctx, `${titles[g.stage]} · ${g.fish}`, hints[g.stage]);
    const cx = SE.W / 2, cy = CARD.y + 100;

    if (g.stage === 'chop' || g.stage === 'season') {
      // cutting board
      ctx.fillStyle = '#2b1d2a'; ctx.fillRect(cx - 82, cy - 34, 164, 68);
      ctx.fillStyle = '#c99a62'; ctx.fillRect(cx - 80, cy - 32, 160, 64);
      ctx.fillStyle = '#b58650'; for (let i = 0; i < 5; i++) ctx.fillRect(cx - 80, cy - 26 + i * 13, 160, 1);
      // a still panel between cuts (descaling, head and fins off, the fillets): sound does the rest
      if (g.panel) { if (g.panel.draw(ctx, dt)) return; g.panel = null; if (g.afterPanel) { g.afterPanel(); g.afterPanel = null; } }
      // a close look first: his hands cutting the fish on the board (a short cut-in)
      if (g.stage === 'chop' && g.cutIn > 0 && SE.anims.kitchen_cut) {
        g.cutIn -= dt;
        const sz = SE.animSize('kitchen_cut');
        // one still frame (Coffee Talk style): the picture and the chopping sounds do the rest
        if (Math.floor(g.cutIn * 3) !== Math.floor((g.cutIn + dt) * 3)) SE.audio.sfx('chop');
        SE.drawAnim('kitchen_cut', Math.round(cx - sz.w / 2), CARD.y + 44, 0, { frame: 0 });
        return;
      }
      // while cutting: cut lines; once it is cut (seasoning) the pieces lie apart on the board
      const f = g.stage === 'chop' ? drawFish(ctx, cx, cy, 3, 0) : drawFillets(ctx, cx, cy, 3, 0);
      if (g.stage === 'chop') { ctx.fillStyle = '#5a3a3a'; for (const c of g.cuts) ctx.fillRect(Math.round(f.x + f.w * c), Math.round(f.y + 6), 1, f.h - 12); }
      drawPaw(ctx, dt, f);
      for (const h of g.herbs) { ctx.fillStyle = h.c; ctx.fillRect(Math.round(h.x), Math.round(h.y), 1, 1); }
      if (g.stage === 'chop') {
        g.knife = Math.max(0, g.knife - dt * 4);
        const kx = f.x + f.w * (0.2 + g.i * 0.14);
        ctx.fillStyle = '#2b1d2a'; ctx.fillRect(Math.round(kx) - 1, Math.round(cy - 56 + g.knife * -10 + (1 - g.knife) * 18), 4, 30);
        ctx.fillStyle = '#d7dbe6'; ctx.fillRect(Math.round(kx), Math.round(cy - 55 + g.knife * -10 + (1 - g.knife) * 18), 2, 20);
        ctx.fillStyle = '#6b3b22'; ctx.fillRect(Math.round(kx) - 1, Math.round(cy - 65 + g.knife * -10 + (1 - g.knife) * 18), 4, 10);
        // sequence
        g.wobble = Math.max(0, g.wobble - dt * 4);
        g.seq.forEach((k, i) => {
          const x = cx - 60 + i * 24, y = CARD.y + 32 + (i === g.i ? Math.sin(g.wobble * 20) * 2 : 0);
          SE.panel(x, y, 20, 18, { fill: i < g.i ? 'rgba(120,180,120,0.9)' : i === g.i ? 'rgba(232,170,96,0.95)' : 'rgba(54,46,78,0.9)' });
          SE.text(ARROWS[k], x + 10, y + 3, { align: 'center', size: 11, color: i === g.i ? '#3a2433' : '#fff7ea', shadow: i !== g.i });
        });
        let pressed = g.autoKey || ARROW_KEYS.find((k) => SE.key(k));
        ARROW_KEYS.forEach((k, i) => {
          if (SE.button(cx - 50 + i * 26, CARD.y + CARD.h - 46, 22, 18, ARROWS[k], { size: 10 })) pressed = k;
        });
        if (pressed) {
          if (pressed === g.seq[g.i]) {
            g.cuts.push(0.2 + g.i * 0.14); g.i++; g.knife = 1; SE.audio.sfx('chop');
            const panelAt = { x: cx, y: CARD.y + 40 };
            if (g.i === 2) g.panel = SE.Panel({ img: 'kitchen_scale', ...panelAt, dur: 2.4, caption: 'Scales off, against the grain…', sounds: [[0.15, 'scrape'], [0.7, 'scrape'], [1.25, 'scrape']] });
            if (g.i === 4) g.panel = SE.Panel({ img: 'kitchen_head', ...panelAt, dur: 2.2, caption: 'Head and fins off.', sounds: [[0.2, 'chop'], [0.75, 'chop'], [1.2, 'chop']] });
            if (g.i >= g.seq.length) {
              g.panel = SE.Panel({ img: 'kitchen_fillet', ...panelAt, dur: 2.6, caption: 'Two neat fillets.', sounds: [[0.25, 'stir'], [1.0, 'soft']] });
              g.afterPanel = () => { g.stage = 'season'; SE.toast('Neatly cut!'); };
            }
          } else { g.wobble = 1; SE.audio.sfx('click'); }
        }
      } else {
        let sp = null;
        if (g.autoSprinkle) { g.autoSprinkle = false; sp = { x: f.x + SE.rand(8, f.w - 8), y: f.y + SE.rand(6, f.h - 6) }; }
        else if (playing() && SE.mouse.pressed && SE.inRect(SE.mouse.x, SE.mouse.y, { x: f.x - 6, y: f.y - 6, w: f.w + 12, h: f.h + 12 })) sp = { x: SE.mouse.x, y: SE.mouse.y };
        if (sp) {
          for (let i = 0; i < 9; i++) g.herbs.push({ x: sp.x + SE.rand(-7, 7), y: sp.y + SE.rand(-5, 5), c: Math.random() < 0.6 ? '#5f9a4a' : '#ffffff' });
          SE.audio.sfx('click');
          if (g.herbs.length >= 54) { g.stage = 'fry'; g.pos = 0; g.sizzle = SE.audio.loop('sizzle'); }
        }
        ctx.save(); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(SE.time * 6);
        SE.drawIcon('heart', SE.mouse.x - 4, SE.mouse.y - 12, '#7fd38a'); ctx.restore();
      }
    } else if (g.stage === 'fry') {
      // the PixelLab cast-iron pan on the wood stove; the fish sizzles in bubbling oil
      let px = cx, py = cy;
      if (SE.img('kitchen_pan')) {
        const img = SE.img('kitchen_pan');
        const ix = Math.round(cx - img.width / 2), iy = CARD.y + 50;
        SE.drawImg('kitchen_pan', ix, iy);
        px = ix + PAN.x; py = iy + PAN.y;
      }
      g.pos += dt * 0.11;
      const cookLevel = (g.side === 0 ? g.pos : 0.65 + g.pos * 0.3) * 0.9;
      drawOil(ctx, dt, px, py);
      drawFillets(ctx, px, py - 2 + Math.sin(SE.time * 20) * 0.4, 2, cookLevel);
      if (Math.random() < dt * 10) SE.spawnFloater(px + SE.rand(-PAN.rx * 0.7, PAN.rx * 0.7), py - 6, 'spark', '#fff4d6');
      // doneness bar
      const bx = cx - 90, by = CARD.y + 38, bw = 180;
      const zones = [[0, 0.5, '#e6a3a3'], [0.5, 0.58, '#e8c27a'], [0.58, 0.74, '#7fd38a'], [0.74, 0.86, '#e8c27a'], [0.86, 1, '#a0643c']];
      for (const [a, b, c] of zones) { ctx.fillStyle = c; ctx.fillRect(Math.round(bx + a * bw), by, Math.round((b - a) * bw), 8); }
      ctx.fillStyle = '#2b1d2a'; ctx.fillRect(bx - 1, by - 1, bw + 2, 1); ctx.fillRect(bx - 1, by + 8, bw + 2, 1);
      const mx = Math.round(bx + Math.min(1, g.pos) * bw);
      ctx.fillStyle = '#fff7ea'; ctx.fillRect(mx - 1, by - 4, 3, 16);
      SE.text('raw', bx, by + 11, { size: 6, color: '#e6a3a3' });
      SE.text('golden', bx + bw * 0.66, by + 11, { size: 6, align: 'center', color: '#7fd38a' });
      SE.text('crispy', bx + bw, by + 11, { size: 6, align: 'right', color: '#c08a5a' });
      if (confirm() || g.pos >= 1) {
        const score = SE.clamp(1 - Math.abs(Math.min(1, g.pos) - 0.66) * 4, 0.2, 1);
        g.scores.push(score);
        SE.audio.sfx('whoosh');
        SE.toast(score > 0.85 ? 'Golden!' : g.pos < 0.5 ? 'A little rare — still tasty.' : 'Nice and crispy.');
        if (g.side === 0) { g.side = 1; g.pos = 0; }
        else { g.stage = 'plate'; g.sizzle.stop(); SE.cardOpen = true; finishDish(); }
      }
    } else if (g.stage === 'plate') {
      ctx.fillStyle = '#2b1d2a'; ctx.beginPath(); ctx.ellipse(cx, cy + 6, 64, 30, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2ece2'; ctx.beginPath(); ctx.ellipse(cx, cy + 4, 61, 27, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ddd3c4'; ctx.beginPath(); ctx.ellipse(cx, cy + 4, 46, 18, 0, 0, Math.PI * 2); ctx.fill();
      if (SE.img('item_dish')) SE.drawImg('item_dish', cx - SE.img('item_dish').width, cy - SE.img('item_dish').height + 8, { scale: 2 });
      else drawFillets(ctx, cx, cy, 2, 0.7);
      const stars = g.stars;
      for (let i = 0; i < 3; i++) SE.drawIcon('heart', cx - 18 + i * 13, CARD.y + 36, i < stars ? '#ffd166' : '#5d5577', 1);
      SE.text(`Pan-fried ${g.fish}`, cx, CARD.y + CARD.h - 44, { align: 'center', size: 10, color: '#ffe6b8' });
      SE.text(['', 'Rustic and honest.', 'Really good!', 'Chef-level. Waffles is drooling.'][stars], cx, CARD.y + CARD.h - 30, { align: 'center', size: 8 });
      if (SE.button(CARD.x + CARD.w - 74, CARD.y + 34, 64, 18, 'Enjoy ♥', { active: true }) || g.autoEnjoy) {
        SE.cardOpen = false;
        SE.toast('You eat by the window. Waffles and Mochi each get a tiny piece.', '#ffe6b8');
        SE.audio.sfx('purr');
        SE.audio.sfx('woof');
        mode = 'idle';
      }
    }
  }
  function finishDish() {
    const avg = g.scores.reduce((a, b) => a + b, 0) / g.scores.length;
    g.stars = avg > 0.85 ? 3 : avg > 0.55 ? 2 : 1;
    const sv = SE.save;
    sv.fish[g.fish]--;
    if (sv.fish[g.fish] <= 0) delete sv.fish[g.fish];
    sv.dishes['Pan-fried Fish'] = (sv.dishes['Pan-fried Fish'] || 0) + 1;
    sv.cooked++;
    SE.persist();
    SE.celebrate(g.stars === 3 ? "Chef's kiss!" : 'Dinner is served!', `Pan-fried ${g.fish}, ${g.stars === 3 ? 'golden and perfect' : 'cooked with love'}. ${SE.pick(SE.PROPS)}`);
  }

  // ------------------------------------------------------------ the oven needs wood to cook
  const STOVE = { x: 352, y: 150, w: 92, h: 100 };
  function feedStove(auto) {
    const sv = SE.save;
    if (sv.wood <= 0) { SE.toast('No firewood — chop some out in the yard.', '#cfe6ff'); return false; }
    if (sv.stove > 0.9) { SE.toast('The oven is nice and hot already.'); return false; }
    const wasCold = sv.stove < 0.12;
    sv.wood--; sv.stove = Math.min(1, sv.stove + 0.6); SE.persist();
    SE.audio.sfx('whoosh');
    for (let i = 0; i < 12; i++) SE.spawnFloater(SE.rand(380, 410), SE.rand(185, 200), 'spark', '#ffb36b');
    if (wasCold && !auto) SE.celebrate('Oven lit!', `Warm and ready for cooking. ${SE.pick(SE.PROPS)}`);
    else SE.toast('A log for the oven. It ticks as it warms.', '#ffe6b8');
    return true;
  }
  const stoveCold = () => SE.save.stove < 0.12;

  // Mochi sits on the counter; while fish is prepared she stares and sneaks a paw closer.
  function drawMochi(ctx, dt, cooking) {
    if (cooking && SE.anims.cat_eager) {
      const sz = SE.animSize('cat_eager');
      const x = CARD.x + CARD.w - sz.w * 2 + 6, y = CARD.y + CARD.h - sz.h * 2 - 26;
      SE.drawAnim('cat_eager', x, y, SE.time * 0.9, { pingpong: true, scale: 2 });
      drawMochi.bub = (drawMochi.bub || 4) - dt;
      if (drawMochi.bub < 1.6) {
        const msg = drawMochi.msg || (drawMochi.msg = SE.pick(['Mrrp?', 'Is that… for me?', '*stares at fish*', 'Mew!', '*licks lips*']));
        const w = SE.measure(msg, 7) + 10;
        SE.panel(x + 10 - w / 2, y - 16, w, 13, { fill: 'rgba(255,246,230,0.95)' });
        SE.text(msg, x + 10, y - 13, { align: 'center', size: 7, color: '#5a4a5a', shadow: false });
        if (drawMochi.bub <= 0) { drawMochi.bub = SE.rand(5, 9); drawMochi.msg = null; }
      }
      return;
    }
    if (!kmochi) kmochi = SE.Mochi(KCAT_SURF, KCAT_LINKS);
    kmochi.update(dt);
    kmochi.draw();
  }
  // Mochi in the kitchen: the back counter, the island, the window sill, the shelf, the floor
  const KCAT_SURF = { counter: [180, 345, 156], island: [192, 248, 188], sill: [280, 318, 134], shelf: [196, 222, 62], floor: [150, 330, 262], right: [448, 476, 158] };
  const KCAT_LINKS = [['floor', 'island'], ['island', 'counter'], ['counter', 'sill'], ['counter', 'shelf'], ['floor', 'counter']];
  let kmochi = null;

  // ------------------------------------------------------------ scene
  SE.addScene('kitchen', {
    enter() { mode = 'idle'; kmochi = null; SE.cardOpen = false; SE.audio.setMusic('cabin'); },
    exit() { SE.cardOpen = false; if (g && g.sizzle) g.sizzle.stop(); if (g && g.pour) g.pour.stop(); },
    update(dt) {
      SE.audio.setAmbience({ fire: SE.save.stove * 0.6, wind: 0.3 + SE.weather.wind / 80, storm: SE.weather.stormy() ? 0.6 : 0, muffled: true });
    },
    draw(ctx, dt) {
      SE.drawImg('bg_kitchen', 0, 0);
      SE.weather.windows(ctx, WINDOWS);
      SE.weather.interior(ctx);
      const flick = 0.8 + 0.15 * Math.sin(SE.time * 8) + 0.05 * Math.random();
      const heat = SE.save.stove, night = SE.weather.night();
      if (heat < 0.12) { ctx.fillStyle = 'rgba(20,12,14,0.6)'; ctx.fillRect(374, 178, 50, 34); }
      SE.glow(ctx, 398, 196, (20 + 30 * heat) * flick, '255,140,60', (0.08 + 0.22 * heat) * flick);
      SE.glow(ctx, 463, 140, 30, '255,200,120', (0.14 + night * 0.12) * flick);
      SE.glow(ctx, 167, 186, 30, '255,200,120', (0.12 + night * 0.12) * flick);
      // steam from the pot on the stove
      if (Math.random() < dt * 4 * SE.save.stove) steam.push({ x: 378 + SE.rand(-6, 6), y: 138, t: 0 });
      for (let i = steam.length - 1; i >= 0; i--) {
        const p = steam[i]; p.t += dt;
        if (p.t > 2) { steam.splice(i, 1); continue; }
        p.y -= 9 * dt; p.x += Math.sin(p.t * 3 + i) * 0.2;
        ctx.fillStyle = `rgba(255,255,255,${0.28 * (1 - p.t / 2)})`;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
      }

      if (mode !== 'cook') drawMochi(ctx, dt, false);
      if (mode === 'cocoa') { cocoa(ctx, dt); if (!SE.watching() && SE.button(CARD.x + 6, CARD.y + CARD.h + 4, 60, 16, 'Leave it', { size: 7 })) mode = 'idle'; }
      else if (mode === 'cook') {
        cook(ctx, dt);
        if (g && g.stage !== 'plate') drawMochi(ctx, dt, true);
        if (g.stage !== 'plate' && !SE.watching() && SE.button(CARD.x + 6, CARD.y + CARD.h + 4, 60, 16, 'Leave it', { size: 7 })) { if (g.sizzle) g.sizzle.stop(); mode = 'idle'; }
      } else drawIdle(ctx);
        const ovenWord = SE.save.stove > 0.6 ? 'hot' : SE.save.stove > 0.12 ? 'warm' : 'cold';
      SE.hud.draw(ctx, { title: 'Kitchen', subtitle: `oven: ${ovenWord} · firewood: ${SE.save.wood} · fish: ${SE.fishCount()}`, map: false, back: mode === 'idle' ? () => SE.go('cabin') : null });
    },
  });

  let idleT = 0;
  function drawIdle(ctx) {
    if (SE.watching()) {
      // watch loop: after a short pause, cook something new (lighting the oven first if needed)
      idleT += SE.dt;
      if (idleT > 4) {
        idleT = 0;
        if (SE.save.stove < 0.3 && SE.save.wood > 0) { feedStove(true); return; }
        if (stoveCold()) {
          // out of firewood: the traveler heads out to chop some (a little film of its own)
          SE.toast('Out of firewood — off to the chopping block.', '#ffe6b8');
          SE.go('yard', { mode: 'chop' });
          return;
        }
        const fishes = Object.entries(SE.save.fish).filter(([, n]) => n > 0);
        if (fishes.length && Math.random() < 0.5) startCook(SE.pick(fishes)[0]);
        else startCocoa();
      }
      return;
    }
    const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
    const fishes = Object.entries(SE.save.fish).filter(([, n]) => n > 0);
    let x = SE.W - 6;
    const btn = (label, w, cb, opts = {}) => { x -= w + 4; if (SE.button(x, SE.H - 24, w, 18, label, Object.assign({ alpha: a }, opts))) cb(); };
    const needHeat = (fn) => () => { if (stoveCold()) SE.toast('The oven is cold — add a log first.', '#cfe6ff'); else fn(); };
    btn('Make hot chocolate', 100, needHeat(startCocoa), { icon: 'cup' });
    if (fishes.length) {
      fishes.slice(0, 2).forEach(([name, n]) => btn(`Cook ${name.split(' ').pop()} ×${n}`, Math.max(84, SE.measure(`Cook ${name.split(' ').pop()} ×${n}`, 8) + 26), needHeat(() => startCook(name)), { icon: 'fish' }));
    } else {
      btn('No fish yet', 70, () => SE.toast('Catch some at the Frozen Lake first!'), { icon: 'fish', fill: 'rgba(60,54,80,0.6)' });
    }
    btn(stoveCold() ? 'Light the oven' : 'Feed the oven', 78, () => feedStove(false), { active: stoveCold() && SE.save.wood > 0 });
  }
})();
