// Shared actor helpers: sprite fallbacks, pet close-ups, cozy glows.
'use strict';

(function () {
  SE.DOG_FOOT_PAD = 0;

  // Simple silhouette if an art file is missing, so nothing ever breaks.
  SE.drawActorFallback = function (ctx, x, y, color, dog) {
    ctx.fillStyle = color;
    if (dog) { ctx.fillRect(x, y + 6, 26, 12); ctx.fillRect(x + 22, y, 8, 9); ctx.fillRect(x + 2, y + 18, 3, 5); ctx.fillRect(x + 20, y + 18, 3, 5); }
    else { ctx.fillRect(x, y + 10, 14, 26); ctx.fillStyle = '#e0b18d'; ctx.fillRect(x + 3, y, 9, 10); ctx.fillStyle = '#b63a3a'; ctx.fillRect(x + 2, y - 3, 11, 5); }
  };

  // Waffles resting on his tummy: mostly breathing with his chin down, now and then he lifts
  // his head to look around, then settles again. Each instance gets its own rhythm via `seed`.
  SE.drawDogRest = function (x, feetY, opts = {}) {
    const a = SE.anims.dog_rest;
    if (!a) return null;
    const sz = SE.animSize('dog_rest');
    const cycle = 14, t = (SE.time + (opts.seed || 0) * 5.3) % cycle;
    let frame;
    if (t < 9) frame = Math.floor(t * 0.8) % 2;            // slow breathing, head down
    else frame = 2 + Math.min(a.frames - 3, Math.floor((t - 9) * 1.6)); // look up, then settle
    SE.drawAnim('dog_rest', x, feetY - sz.h, 0, { frame, flip: opts.flip, scale: opts.scale });
    return { x, y: feetY - sz.h, w: sz.w, h: sz.h };
  };

  // A little stack of split firewood that grows with what you've chopped.
  SE.drawWoodpile = function (ctx, x, baseY, count) {
    // the PixelLab log pile: it shows more of itself as the stack grows (bottom rows first)
    const img = SE.img('props/woodpile');
    if (img) {
      if (count <= 0) return;
      // the whole stack, standing on the ground with a soft shadow (never sliced)
      ctx.fillStyle = 'rgba(40,46,90,0.25)';
      ctx.beginPath(); ctx.ellipse(Math.round(x + img.width / 2), Math.round(baseY - 1), img.width / 2 + 2, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(img, Math.round(x), Math.round(baseY - img.height));
      return;
    }
    const n = Math.min(count, 28);
    let i = 0;
    for (let row = 0; i < n; row++) {
      const perRow = Math.max(1, 7 - row);
      for (let k = 0; k < perRow && i < n; k++, i++) {
        // round log ends, seen from the front
        const lx = Math.round(x + k * 6 + row * 3), ly = Math.round(baseY - 6 - row * 5);
        ctx.fillStyle = '#3a2418'; ctx.fillRect(lx, ly - 1, 5, 7); ctx.fillRect(lx - 1, ly, 7, 5);
        ctx.fillStyle = '#8a5a34'; ctx.fillRect(lx, ly, 5, 5);
        ctx.fillStyle = '#e8bd86'; ctx.fillRect(lx + 1, ly, 3, 5); ctx.fillRect(lx, ly + 1, 5, 3);
        ctx.fillStyle = '#c08c58'; ctx.fillRect(lx + 2, ly + 2, 1, 1);
      }
    }
    if (n > 0) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(Math.round(x + 2), Math.round(baseY - 6 - Math.ceil(n / 7) * 5), Math.min(30, n * 3), 1); }
  };

  // Warm flickering light (fireplace, lamps).
  SE.glow = function (ctx, x, y, r, rgb, strength) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${strength})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  };

  // Embers rising from a fire.
  const embers = [];
  SE.drawEmbers = function (ctx, x, y, w, dt) {
    if (Math.random() < dt * 5) embers.push({ x: x + Math.random() * w, y, vx: SE.rand(-4, 4), vy: SE.rand(-22, -12), t: 0, life: SE.rand(0.8, 1.8) });
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.t += dt;
      if (e.t > e.life) { embers.splice(i, 1); continue; }
      e.x += (e.vx + Math.sin(e.t * 8) * 6) * dt;
      e.y += e.vy * dt;
      ctx.fillStyle = `rgba(255,${180 - e.t * 60 | 0},80,${1 - e.t / e.life})`;
      ctx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1);
    }
  };

  // Fish sprite tinted per species (and browned while cooking), drawn via an offscreen canvas.
  const tmp = document.createElement('canvas');
  SE.drawFishSprite = function (ctx, species, cx, cy, scale, cook = 0, flip = false) {
    const info = SE.FISH[species] || { color: '#ccc', size: 1 };
    const img = SE.img(info.img);
    const w = (img ? img.width : 32) * scale, h = (img ? img.height : 14) * scale;
    tmp.width = w; tmp.height = h;
    const t = tmp.getContext('2d');
    t.imageSmoothingEnabled = false;
    if (img) t.drawImage(img, 0, 0, w, h);
    else { t.fillStyle = info.color; t.fillRect(0, h * 0.2, w, h * 0.6); }
    t.globalCompositeOperation = 'source-atop';
    if (cook > 0) { t.globalAlpha = Math.min(0.75, cook * 0.85); t.fillStyle = cook > 0.85 ? '#5a3418' : '#c07a32'; t.fillRect(0, 0, w, h); }
    ctx.save();
    if (flip) { ctx.translate(Math.round(cx + w / 2), Math.round(cy - h / 2)); ctx.scale(-1, 1); ctx.drawImage(tmp, 0, 0); }
    else ctx.drawImage(tmp, Math.round(cx - w / 2), Math.round(cy - h / 2));
    ctx.restore();
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  };

  // Waffles celebrates with you: while a success banner is up he barks and grins.
  SE.dogCheer = () => (SE.anims.dog_bark && SE.celebration && SE.celebration.t < 2.6 ? 'dog_bark' : 'dog_happy');

  // The fish once it is cut: the same sprite in pieces, a small gap at each cut (fractions 0..1).
  SE.drawFishPieces = function (ctx, species, cx, cy, scale, cook, cuts, gap = 2) {
    const r = SE.drawFishSprite(ctx, species, -9999, -9999, scale, cook); // renders into the shared canvas
    const xs = [0, ...cuts.slice().sort((a, b) => a - b), 1];
    const total = r.w + gap * (xs.length - 2);
    let dx = Math.round(cx - total / 2);
    for (let i = 0; i < xs.length - 1; i++) {
      const a = Math.round(xs[i] * r.w), b = Math.round(xs[i + 1] * r.w);
      ctx.drawImage(tmp, a, 0, b - a, r.h, dx, Math.round(cy - r.h / 2), b - a, r.h);
      dx += b - a + gap;
    }
    return { x: cx - total / 2, y: cy - r.h / 2, w: total, h: r.h };
  };

  // A caught fish wriggling and gasping (PixelLab animation per species). rot turns it, e.g. -PI/2 to
  // hang it head-up from the line by its mouth. Falls back to the still sprite.
  SE.drawFishWiggle = function (ctx, species, cx, cy, scale, t, rot = 0, speed = 1) {
    const info = SE.FISH[species];
    const anim = info && info.img + '_w';
    if (!anim || !SE.anims[anim]) { SE.drawFishSprite(ctx, species, cx, cy, scale); return; }
    const a = SE.anims[anim], sz = SE.animSize(anim);
    const frame = Math.floor(t * a.fps * speed) % a.frames;
    ctx.save();
    ctx.translate(Math.round(cx), Math.round(cy));
    if (rot) ctx.rotate(rot);
    SE.drawAnim(anim, -Math.round((sz.w * scale) / 2), -Math.round((sz.h * scale) / 2), 0, { frame, scale });
    ctx.restore();
  };

  // Mochi's little life in a room. `surfaces` are the places she can be: { id: [x1, x2, feetY] };
  // `links` are the jumps between them. Each time a room is entered she is lounging somewhere new;
  // then she sits, washes herself, lies down, strolls along a counter or hops up onto a shelf.
  SE.Mochi = function (surfaces, links) {
    const ids = Object.keys(surfaces);
    const m = { state: 'rest', t: 0, dur: SE.rand(6, 12), flip: Math.random() < 0.5, pose: SE.pick(['lie', 'lie', 'sit', 'wash']) };
    const place = (id) => { const [a, b, y] = surfaces[id]; m.surf = id; m.x = SE.rand(a, b); m.y = y; };
    place(SE.pick(ids));
    const neighbours = () => links.filter((l) => l.includes(m.surf)).map((l) => (l[0] === m.surf ? l[1] : l[0]));
    function decide() {
      const [a, b] = surfaces[m.surf], r = Math.random(), nb = neighbours();
      m.t = 0;
      if (r < 0.35 && b - a > 24) { m.state = 'walk'; m.tx = SE.rand(a, b); m.flip = m.tx < m.x; return; }
      if (r < 0.7 && nb.length) {
        const to = SE.pick(nb), [c, d, y] = surfaces[to];
        m.state = 'jump'; m.from = [m.x, m.y]; m.to = [SE.clamp(m.x, c, d), y]; m.toSurf = to; m.flip = m.to[0] < m.x;
        m.dur = 0.75; return;
      }
      m.state = 'rest'; m.pose = SE.pick(['lie', 'sit', 'wash', 'lie']); m.dur = m.pose === 'lie' ? SE.rand(14, 30) : SE.rand(6, 12);
    }
    m.update = function (dt) {
      m.t += dt;
      if (m.state === 'rest' && m.t > m.dur) decide();
      else if (m.state === 'walk') {
        const d = m.tx - m.x, step = 15 * dt;
        if (Math.abs(d) <= step) { m.x = m.tx; m.state = 'rest'; m.t = 0; m.pose = SE.pick(['sit', 'lie', 'wash']); m.dur = SE.rand(5, 14); }
        else m.x += Math.sign(d) * step;
      } else if (m.state === 'jump') {
        const k = Math.min(1, m.t / m.dur);
        m.x = SE.lerp(m.from[0], m.to[0], k);
        const lift = Math.max(14, m.from[1] - m.to[1] + 12);
        m.y = SE.lerp(m.from[1], m.to[1], k) - Math.sin(k * Math.PI) * lift * (m.to[1] < m.from[1] ? 1 : 0.5);
        if (k >= 1) { m.y = m.to[1]; m.surf = m.toSurf; m.state = 'rest'; m.t = 0; m.pose = SE.pick(['sit', 'wash']); m.dur = SE.rand(4, 9); }
      }
    };
    // draws her (feet at m.y) and returns her box for petting hotspots
    m.draw = function () {
      let anim = 'cat_sit', frame = 0;
      if (m.state === 'walk' && SE.anims.cat_walk) { anim = 'cat_walk'; frame = Math.floor(m.t * 10) % SE.anims.cat_walk.frames; }
      else if (m.state === 'jump' && SE.anims.cat_jump) { anim = 'cat_jump'; frame = Math.min(SE.anims.cat_jump.frames - 1, Math.floor((m.t / m.dur) * SE.anims.cat_jump.frames)); }
      else if (m.pose === 'lie' && SE.anims.cat_lie) { anim = 'cat_lie'; const n = SE.anims.cat_lie.frames, c = n * 2 - 2; let f = Math.floor(m.t * 2) % c; if (f >= n) f = c - f; frame = f; }
      else if (m.pose === 'wash' && SE.anims.cat_sit) { frame = Math.floor(m.t * 5) % SE.anims.cat_sit.frames; }
      if (!SE.anims[anim]) return null;
      const sz = SE.animSize(anim);
      const x = Math.round(m.x - sz.w / 2), y = Math.round(m.y - sz.h);
      SE.drawAnim(anim, x, y, 0, { frame, flip: m.flip });
      return { x, y, w: sz.w, h: sz.h };
    };
    return m;
  };

  // Petting close-up: stroke the animal with the mouse to fill the happiness meter.
  // cfg: { anim, name, kind: 'dog'|'cat', scale, onDone }
  SE.PetCloseup = function (cfg) {
    const st = { love: 0, acc: 0, done: false, t: 0, soundT: 0, wag: 0 };
    return {
      st,
      draw(ctx, dt) {
        st.t += dt;
        ctx.fillStyle = 'rgba(18,12,26,0.55)';
        ctx.fillRect(0, 0, SE.W, SE.H);
        SE.glow(ctx, SE.W / 2, SE.H / 2 + 20, 150, '255,170,100', 0.18);
        const size = SE.animSize(cfg.anim);
        const s = cfg.scale || 2;
        const x = Math.round(SE.W / 2 - (size.w * s) / 2), y = Math.round(SE.H / 2 - (size.h * s) / 2 + 18);
        const box = { x, y, w: size.w * s, h: size.h * s };
        const happy = st.wag > 0.05;
        // gentle "breathing" when idle, faster loop while being petted
        SE.drawAnim(cfg.anim, x, y, st.t * (happy ? 1.8 : 0.7), { scale: s, pingpong: true });

        const auto = SE.watching();
        let px = SE.mouse.x, py = SE.mouse.y, stroking = false, moved = SE.mouse.moved;
        if (auto) {
          // a gentle hand strokes along the back on its own
          px = box.x + box.w * (0.5 + Math.sin(st.t * 1.8) * 0.28);
          py = box.y + box.h * 0.3 + Math.sin(st.t * 3.6) * 3;
          stroking = true;
          moved = Math.abs(Math.cos(st.t * 1.8)) * box.w * 0.5 * dt * 1.8 + 0.4;
          SE.drawIcon('hand', px - 4, py - 4, '#f4cfae', 2);
        } else {
          const over = SE.inRect(px, py, box);
          if (over) SE.cursor = 'grab';
          stroking = over && SE.mouse.down && !SE.modal;
          if (stroking) SE.cursor = 'grabbing';
        }
        if (stroking) {
          st.acc += moved;
          st.wag = 1;
          if (st.acc > 22) {
            st.acc = 0;
            st.love = Math.min(1, st.love + 0.045);
            SE.spawnFloater(px - 4, py - 8, Math.random() < 0.8 ? 'heart' : 'spark');
          }
          st.soundT -= dt;
          if (st.soundT <= 0) {
            st.soundT = cfg.kind === 'cat' ? 2.6 : 3.5;
            SE.audio.sfx(cfg.kind === 'cat' ? 'purr' : Math.random() < 0.5 ? 'woof' : 'soft');
          }
        }
        st.wag = Math.max(0, st.wag - dt * 0.6);

        // happiness meter
        SE.panel(SE.W / 2 - 70, 40, 140, 26, { alpha: 0.92 });
        SE.text(`${cfg.name}'s happiness`, SE.W / 2, 44, { align: 'center', size: 7, color: '#ffe6b8' });
        for (let i = 0; i < 10; i++) {
          const filled = st.love * 10 > i + 0.5;
          SE.drawIcon('heart', SE.W / 2 - 60 + i * 12, 54, filled ? '#ff8fa3' : '#5d5577');
        }
        if (!st.done && st.love >= 1) {
          st.done = true;
          st.doneAt = st.t;
          SE.celebrate(cfg.kind === 'cat' ? 'Purrfect!' : 'Best friends!', cfg.doneText);
          for (let i = 0; i < 12; i++) SE.spawnFloater(SE.W / 2 + SE.rand(-50, 50), SE.H / 2 + SE.rand(-20, 30), 'heart');
          cfg.onDone && cfg.onDone();
        }
        const hint = st.done ? 'So much love.' : SE.watching() ? `A slow, gentle ${cfg.kind === 'cat' ? 'chin scratch' : 'belly rub'}…` : 'Click and drag gently to pet';
        SE.text(hint, SE.W / 2, SE.H - 40, { align: 'center', size: 8, color: '#fff7ea', alpha: 0.7 + 0.3 * Math.sin(SE.time * 2) });
      },
    };
  };
})();
