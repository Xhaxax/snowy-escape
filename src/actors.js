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
    const img = SE.img('item_fish');
    const info = SE.FISH[species] || { color: '#ccc', size: 1 };
    const w = (img ? img.width : 32) * scale, h = (img ? img.height : 14) * scale;
    tmp.width = w; tmp.height = h;
    const t = tmp.getContext('2d');
    t.imageSmoothingEnabled = false;
    if (img) t.drawImage(img, 0, 0, w, h);
    else { t.fillStyle = info.color; t.fillRect(0, h * 0.2, w, h * 0.6); }
    t.globalCompositeOperation = 'source-atop';
    t.globalAlpha = 0.3;
    t.fillStyle = info.color;
    t.fillRect(0, 0, w, h);
    if (cook > 0) { t.globalAlpha = Math.min(0.75, cook * 0.85); t.fillStyle = cook > 0.85 ? '#5a3418' : '#c07a32'; t.fillRect(0, 0, w, h); }
    ctx.save();
    if (flip) { ctx.translate(Math.round(cx + w / 2), Math.round(cy - h / 2)); ctx.scale(-1, 1); ctx.drawImage(tmp, 0, 0); }
    else ctx.drawImage(tmp, Math.round(cx - w / 2), Math.round(cy - h / 2));
    ctx.restore();
    return { x: cx - w / 2, y: cy - h / 2, w, h };
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
          stroking = over && SE.mouse.down;
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
