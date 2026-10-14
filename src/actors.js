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

  // The pine clearing (Whispering Pines and wild encounters). Its painted sunbeams only belong to a
  // sunny spell: toward night, while it snows and in storms it fades into an overcast version
  // with no beams at all; the night tint then turns that into a proper dark, moonlit forest.
  SE.forestDim = function () {
    const W = SE.weather;
    // beams need the sun: snowfall means cloud cover, so only a sunny spell by day keeps them
    return SE.clamp(Math.max(W.night() * 1.6, 1 - W.sun, W.stormy() ? 1 : 0, W.fog * 3, W.golden() * 0.5), 0, 1);
  };
  SE.drawForest = function (ctx, swayRegions) {
    const k = SE.forestDim();
    if (k < 1) SE.drawImg('bg_forest', 0, 0);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; SE.drawImg('bg_forest_dim', 0, 0); ctx.restore(); }
    if (swayRegions) SE.weather.sway(ctx, k > 0.5 ? 'bg_forest_dim' : 'bg_forest', swayRegions);
    return k;
  };
  // A cold moon wash over the snow at night, so the dark forest still reads.
  SE.moonlight = function (ctx, x = 300, y = 40) {
    const n = SE.weather.night() * (SE.weather.stormy() ? 0.3 : 1);
    if (n < 0.05) return;
    SE.glow(ctx, x, y, 260, '120,140,210', 0.10 * n);
    SE.glow(ctx, x - 40, 230, 180, '150,170,230', 0.07 * n);
  };

  // While you just watch, he is listening to music: headphones over his hat and little notes
  // drifting up. Scenes call this right after drawing him, with the top of his head.
  // Switched off for now: drawn over the beanie they never sat on his ears properly. Doing it right
  // means painting them into his sprites (a future feature); flip this on to bring them back.
  SE.HEADPHONES = false;
  SE.headphones = function (ctx, x, y, scale = 1) {
    if (!SE.HEADPHONES || !SE.watching()) return;
    x = Math.round(x); y = Math.round(y);
    const k = Math.max(1, Math.round(scale)), px = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + dx * k, y + dy * k, w * k, h * k); };
    px(-6, -2, 13, 1, '#1b1720');                          // the band arching over his hat
    px(-7, -1, 1, 6, '#1b1720'); px(7, -1, 1, 6, '#1b1720');
    px(-9, 5, 4, 6, '#1b1720'); px(6, 5, 4, 6, '#1b1720');  // ear cups, outlined
    px(-8, 6, 2, 4, '#5a5266'); px(7, 6, 2, 4, '#5a5266');
    px(-8, 6, 1, 1, '#a8a0b8'); px(8, 6, 1, 1, '#a8a0b8');  // a little shine
    if (Math.random() < SE.dt * 0.9) SE.spawnFloater(x + SE.rand(-4, 6) * k, y - 4, 'note', SE.pick(['#ffe6b8', '#cfe6ff', '#ffd1dc']));
  };

  // What he carries when it is dark out: a lantern swinging at his side at night, and a headlamp
  // when the snow comes down hard (its beam cuts a cone through the flakes the way he faces).
  // (x, y) is about his hand; dir is +1 facing right, -1 facing left. Drawn after the night tint.
  // head: where his forehead is in this scene's sprite, so the headlamp sits on his beanie
  SE.travelerLight = function (ctx, x, y, dir = 1, scale = 1, head = null) {
    const W = SE.weather, n = W.night();
    // the headlamp only comes out in a real snowstorm; any other night he carries the oil lantern
    const heavy = W.stormy();
    if (heavy) {
      const hx = head ? head.x : x, hy = head ? head.y : y - 14 * scale, k = 1;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(hx, hy, hx + dir * 120 * scale, hy + 30 * scale);
      g.addColorStop(0, `rgba(235,240,255,${0.32 * k})`); g.addColorStop(1, 'rgba(235,240,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + dir * 120 * scale, hy - 18 * scale); ctx.lineTo(hx + dir * 120 * scale, hy + 46 * scale); ctx.closePath(); ctx.fill();
      ctx.restore();
      SE.glow(ctx, hx, hy, 8 * scale, '240,245,255', 0.6 * k);
      // the lamp itself, strapped over the beanie: a dark band and the bright little lens
      ctx.fillStyle = '#1c1a22'; ctx.fillRect(Math.round(hx - 3 * scale), Math.round(hy), Math.max(2, Math.round(6 * scale)), 1);
      ctx.fillStyle = '#3a3640'; ctx.fillRect(Math.round(hx - (dir < 0 ? 1 : 0)), Math.round(hy - 1), 2, 2);
      ctx.fillStyle = '#fffbe8'; ctx.fillRect(Math.round(hx + (dir < 0 ? -1 : 1)), Math.round(hy - 1), 1, 1);
      return;
    }
    if (n < 0.35) return;
    const k = SE.clamp((n - 0.35) * 2.5, 0, 1);
    const calm = 0.96 + 0.04 * Math.sin(SE.time * 2.3) * Math.sin(SE.time * 1.3); // a steady, calm flame
    const im = SE.img('props/lantern'), s = scale >= 0.9 ? 1 : 0.5;
    const sw = s < 1 ? Math.sin(SE.time * 1.6) * 0.8 : 0; // carried on the map it sways a little; set down it stands still
    const lx = Math.round(x + sw), ly = Math.round(y);
    // the lantern itself (its flame sits at 10,18 in the sprite), then the soft light it throws
    if (im) {
      const w = Math.round(im.width * s), h = Math.round(im.height * s);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 0.5 + 0.5 * k;
      ctx.drawImage(im, lx - Math.round(10 * s), ly - Math.round(18 * s), w, h); ctx.restore();
    }
    SE.glow(ctx, lx, ly, 110 * scale * calm, '255,170,90', 0.38 * k * calm);
    SE.glow(ctx, lx, ly, 20 * scale * calm, '255,214,150', 0.55 * k * calm);
    // a warm pool of light on the snow it stands on
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.28 * k * calm;
    ctx.translate(lx, ly + 11 * s); ctx.scale(1, 0.32);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 60 * scale);
    g.addColorStop(0, 'rgba(255,190,110,1)'); g.addColorStop(1, 'rgba(255,150,70,0)');
    ctx.fillStyle = g; ctx.fillRect(-60 * scale, -60 * scale, 120 * scale, 120 * scale); ctx.restore();
  };

  // Lit windows after dark: drawn AFTER the night tint, so the warm panes keep their full colour and
  // bloom out into the dark while everything around them sinks into blue-black. `img` holds only the
  // lit pixels of a backdrop (assets/img/lit/*), `spots` are window centres for halos and pools of
  // light on the snow below them. Storms darken the day too, so the lights come on then as well.
  SE.nightLights = function (ctx, img, x, y, spots = [], scale = 1) {
    const W = SE.weather;
    const k = SE.clamp(W.night() * 1.15 + (W.stormy() ? 0.45 : 0) + W.fog * 0.6, 0, 1);
    if (k < 0.04) return;
    const im = SE.img(img);
    const flick = 0.92 + 0.08 * Math.sin(SE.time * 7.3) * Math.sin(SE.time * 3.1);
    for (const p of spots) {
      const r = (p.r || 12) * scale;
      // light falling out onto the snow, then the halo around the pane
      if (p.pool !== false) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(p.x, p.y + r * 1.6, 1, p.x, p.y + r * 1.6, r * 2.2);
        g.addColorStop(0, `rgba(255,170,80,${0.22 * k * flick})`); g.addColorStop(1, 'rgba(255,170,80,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(p.x, p.y + r * 1.6, r * 2.2, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      SE.glow(ctx, p.x, p.y, r * 2.4, '255,180,90', 0.28 * k * flick);
      SE.glow(ctx, p.x, p.y, r, '255,220,150', 0.3 * k * flick);
    }
    if (im) {
      ctx.save();
      ctx.globalAlpha = k;
      ctx.drawImage(im, Math.round(x), Math.round(y), im.width * scale, im.height * scale);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 * k * flick;
      ctx.drawImage(im, Math.round(x), Math.round(y), im.width * scale, im.height * scale);
      ctx.restore();
    }
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
    const info = SE.FISH[species] || (SE.FOOD && SE.FOOD[species]) || { color: '#ccc', size: 1 };
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
  SE.dogCheer = () => (SE.anims.dog_lie_cheer ? 'dog_lie_cheer' : SE.anims.dog_bark && SE.celebration && SE.celebration.t < 2.6 ? 'dog_bark' : 'dog_happy');
  // Waffles stays lying where he is, lifts his head for a bark or two and then grins with his tongue
  // out. `t` is seconds since it started; returns false once it has played through (then he rests).
  SE.drawDogLieCheer = function (x, feetY, t, opts = {}) {
    const a = SE.anims.dog_lie_cheer;
    if (!a || t < 0) return false;
    const frame = Math.floor(t * a.fps);
    if (frame >= a.frames && !opts.loop) return false;
    const sz = SE.animSize('dog_lie_cheer');
    SE.drawAnim('dog_lie_cheer', x, feetY - sz.h, 0, { frame: frame % a.frames, flip: opts.flip });
    return true;
  };

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
  // `links` are the jumps between them. Each time a room is entered she is somewhere new: most often
  // lying in a loaf (counter, shelf, quilt…) or sitting up, watching the room; now and then she strolls
  // along or hops to another spot. She is always seen from the front-diagonal, never side-on.
  SE.Mochi = function (surfaces, links) {
    const ids = Object.keys(surfaces);
    const m = { state: 'rest', t: 0, dur: SE.rand(10, 20), pose: SE.pick(['loaf', 'loaf', 'loaf', 'sit']), face: SE.pick(['se', 'sw']) };
    const place = (id) => { const [a, b, y] = surfaces[id]; m.surf = id; m.x = SE.rand(a, b); m.y = y; };
    place(SE.pick(ids));
    const neighbours = () => links.filter((l) => l.includes(m.surf)).map((l) => (l[0] === m.surf ? l[1] : l[0]));
    const has = (n) => !!SE.anims[n];
    const frames = (n) => (SE.anims[n] ? SE.anims[n].frames : 1);
    function rest(pose, dur) { m.state = 'rest'; m.t = 0; m.pose = pose; m.dur = dur; m.face = SE.pick(['se', 'sw']); }
    function decide() {
      const [a, b] = surfaces[m.surf], r = Math.random(), nb = neighbours();
      m.t = 0;
      if (r < 0.25 && b - a > 24) { m.state = 'walk'; m.tx = SE.rand(a, b); m.face = m.tx < m.x ? 'sw' : 'se'; return; }
      if (r < 0.5 && nb.length) {
        const to = SE.pick(nb), [c, d, y] = surfaces[to];
        m.state = 'jump'; m.from = [m.x, m.y]; m.to = [SE.clamp(m.x, c, d), y]; m.toSurf = to; m.face = m.to[0] < m.x ? 'sw' : 'se';
        m.dur = 0.8; return;
      }
      const pose = SE.pick(['loaf', 'loaf', 'sit']);
      rest(pose, pose === 'loaf' ? SE.rand(18, 36) : SE.rand(6, 12));
    }
    m.update = function (dt) {
      m.t += dt;
      if (m.state === 'rest' && m.t > m.dur) decide();
      else if (m.state === 'walk') {
        const d = m.tx - m.x, step = 14 * dt;
        if (Math.abs(d) <= step) { m.x = m.tx; rest(SE.pick(['sit', 'loaf']), SE.rand(6, 14)); }
        else m.x += Math.sign(d) * step;
      } else if (m.state === 'jump') {
        const k = Math.min(1, m.t / m.dur);
        m.x = SE.lerp(m.from[0], m.to[0], k);
        const lift = Math.max(14, m.from[1] - m.to[1] + 12);
        m.y = SE.lerp(m.from[1], m.to[1], k) - Math.sin(k * Math.PI) * lift * (m.to[1] < m.from[1] ? 1 : 0.5);
        if (k >= 1) { m.y = m.to[1]; m.surf = m.toSurf; rest(SE.pick(['sit', 'loaf']), SE.rand(5, 10)); }
      }
    };
    // which strip and frame to show
    function look() {
      const f = m.face;
      const loop = (n, fps) => Math.floor(m.t * fps) % frames(n);
      const settle = (n, fps) => Math.min(frames(n) - 1, Math.floor(m.t * fps)); // play once, then hold
      if (m.state === 'walk') return [`mochi_walk_${f}`, loop(`mochi_walk_${f}`, 10)];
      if (m.state === 'jump') return [`mochi_jump_${f}`, Math.min(frames(`mochi_jump_${f}`) - 1, Math.floor((m.t / m.dur) * frames(`mochi_jump_${f}`)))];
      if (m.pose === 'loaf') {
        const n = has(`mochi_loaf_${f}`) ? `mochi_loaf_${f}` : 'mochi_loaf_se';
        // she settles into the loaf, then just breathes (the last frames, slowly)
        const k = Math.floor(m.t * 5);
        return [n, k < frames(n) ? k : frames(n) - 2 + (Math.floor(m.t * 0.8) % 2)];
      }
      return ['mochi_sit_se', settle('mochi_sit_se', 6), f === 'sw']; // sitting: one strip, mirrored for the other diagonal
    }
    // draws her (feet at m.y) and returns her box for petting hotspots
    m.draw = function () {
      let [anim, frame, flip] = look();
      if (!SE.anims[anim]) { anim = 'mochi_sit_se'; frame = frames(anim) - 1; }
      if (!SE.anims[anim]) return null;
      const sz = SE.animSize(anim);
      const x = Math.round(m.x - sz.w / 2), y = Math.round(m.y - sz.h);
      SE.drawAnim(anim, x, y, 0, { frame, flip: !!flip });
      return { x, y, w: sz.w, h: sz.h };
    };
    return m;
  };
})();
