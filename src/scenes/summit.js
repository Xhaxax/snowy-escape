// Summit Trail: sit above the clouds cuddled up with Waffles. Guided breathing; when a shooting star
// crosses the sky, the two of them look up and watch it together.
'use strict';

(function () {
  const STAR_LINES = [
    'A shooting star! Waffles watches it with you.', 'The heavens declare the glory of God.', 'Waffles leans in a little closer.',
    'A streak of light, and then the quiet again.', 'You hold Waffles a little tighter. What a sky.',
  ];
  const PHASES = [['Breathe in…', 4], ['Hold…', 4], ['Breathe out…', 6]];
  let s = null;

  SE.addScene('summit', {
    enter(p) {
      SE.save.location = 'summit';
      SE.persist();
      s = { t: 0, clouds: [], star: null, starT: SE.rand(6, 14), breathe: null, look: -1 };
      SE.audio.setMusic('outdoors');
      if (p.arrived) SE.toast('You made it. Waffles flops down beside you, panting happily.', '#ffe6b8');
    },
    update(dt) {
      SE.weather.stormCheck();
      SE.audio.setAmbience({ wind: 0.5 + SE.weather.wind / 70, chimes: 1, storm: SE.weather.stormy() ? 1 : 0 });
    },
    draw(ctx, dt) {
      s.t += dt;
      SE.drawImg('bg_summit', 0, 0);
      SE.weather.sway(ctx, 'bg_summit', [[412, 128, 56, 92]]);

      // in a storm the sunset disappears behind a heavy grey overcast
      if (SE.weather.stormy() || SE.weather.fog > 0.05) {
        const k = Math.min(1, Math.max(SE.weather.stormy() ? 1 : 0, SE.weather.fog * 3));
        const g = ctx.createLinearGradient(0, 0, 0, 230);
        g.addColorStop(0, `rgba(104,110,128,${0.88 * k})`); g.addColorStop(1, `rgba(150,156,172,${0.7 * k})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, SE.W, 230);
      }
      drawCloudSea(ctx, dt);
      // the traveler and Waffles cuddled up on the ledge, seen from behind: frames 0-7 are a slow
      // breathing loop, 8-19 both of them lifting their heads to the sky and settling again
      if (SE.anims.summit_pair) {
        const sz = SE.animSize('summit_pair');
        let frame = Math.floor(s.t * 1.4) % 8;
        if (s.look >= 0) {
          s.look += dt;
          const k = Math.floor(s.look * 4); // a quick look up, a long look, then back down
          const seq = [8, 9, 10, 11, 12, 13, 13, 13, 13, 13, 13, 14, 15, 16, 17, 18, 19];
          if (k >= seq.length) s.look = -1; else frame = seq[k];
        }
        SE.drawAnim('summit_pair', 204 + SE.weather.shiver(0), 239 - sz.h, 0, { frame });
        SE.headphones(ctx, 204 + 23, 239 - sz.h + 6);
      } else if (SE.anims.summit_sit) {
        const sz = SE.animSize('summit_sit');
        SE.drawAnim('summit_sit', 196, 238 - sz.h, s.t * 0.6, { pingpong: true });
        SE.drawDogRest(234, 239, { seed: 1 });
      } else SE.drawActorFallback(ctx, 210, 196, '#a0522d');

      SE.weather.tint(ctx, 0.75);
      SE.travelerLight(ctx, 184, 234, 1, 1, { x: 228, y: 239 - (SE.animSize('summit_pair').h || 60) + 12 }); // the lantern on the ledge (or his headlamp)
      SE.weather.stars(ctx, 90);

      // shooting stars
      s.starT -= dt;
      if (s.starT <= 0 && !s.star && SE.weather.night() < 0.3) s.starT = 5; // shooting stars come out at dusk and night
      if (s.starT <= 0 && !s.star) { s.star = { x: SE.rand(60, 380), y: SE.rand(8, 50), t: 0, vx: SE.rand(140, 200), vy: SE.rand(40, 70) }; s.starT = SE.rand(10, 26); }
      if (s.star) {
        const st = s.star;
        st.t += dt;
        const x = st.x + st.vx * st.t, y = st.y + st.vy * st.t;
        const a = Math.sin(Math.min(1, st.t / 1.2) * Math.PI);
        for (let i = 0; i < 18; i++) {
          ctx.fillStyle = `rgba(255,250,220,${a * (1 - i / 18)})`;
          ctx.fillRect(Math.round(x - st.vx * i * 0.006), Math.round(y - st.vy * i * 0.006), i < 2 ? 2 : 1, 1);
        }
        // the two of them look up as soon as it appears (once per star)
        if (!st.seen) {
          st.seen = true;
          s.look = 0;
          SE.audio.sfx('star');
          SE.save.stars = (SE.save.stars || 0) + 1; SE.persist();
          setTimeout(() => { if (SE.sceneName === 'summit') SE.toast(SE.pick(STAR_LINES), '#fff4c2'); }, 900);
        }
        if (st.t > 1.2) s.star = null;
      }

      SE.weather.draw(ctx, { density: 0.6 });
      // watch mode: breathe along in long slow sessions with quiet pauses between
      if (SE.watching()) {
        s.autoB = (s.autoB == null ? 4 : s.autoB) - dt;
        if (s.autoB <= 0) { s.breathe = s.breathe ? null : { t: 0, phase: 0, cycles: 0 }; s.autoB = s.breathe ? SE.rand(60, 90) : SE.rand(25, 45); }
      }
      if (s.breathe) drawBreathe(ctx, dt);

      const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
      if (!SE.watching() && SE.button(SE.W - 106, SE.H - 24, 100, 18, s.breathe ? 'Stop breathing' : 'Breathe with me', { alpha: s.breathe ? 1 : a, active: !!s.breathe })) {
        s.breathe = s.breathe ? null : { t: 0, phase: 0, cycles: 0 };
      }
      if (s.t < 12 && !SE.watching() && SE.weather.night() < 0.3) SE.text('At dusk and at night, shooting stars cross the sky here', 8, SE.H - 40, { size: 7, color: '#ffe6b8', alpha: Math.min(1, 12 - s.t) * a });
      SE.hud.draw(ctx, { title: 'Summit Trail', subtitle: `shooting stars watched: ${SE.save.stars || 0}`, map: true });
    },
  });

  // The sea of clouds: many PixelLab cloud sprites overlapped into two seamless, wrapping banks, so
  // they read as one woven layer rather than single pictures. The banks scroll at different speeds
  // (parallax); in a storm they are rebuilt from the torn, wind-blown wisps and race past.
  const BAND_W = 960;
  const bands = {};
  function band(kind, seed) {
    const key = kind + seed;
    if (bands[key]) return bands[key];
    const names = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];
    const imgs = names.map((n) => SE.img('cloud/' + n)).filter(Boolean);
    if (!imgs.length) return null;
    const cv = document.createElement('canvas'); cv.width = BAND_W; cv.height = 64;
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    let r = seed * 9301 + 49297;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    const puffs = [];
    for (let i = 0; i < 30; i++) puffs.push({ img: imgs[Math.floor(rnd() * imgs.length)], x: (i / 30) * BAND_W + rnd() * 24, y: 4 + rnd() * 22, flip: rnd() < 0.5 });
    puffs.sort((a, b) => a.y - b.y);
    if (kind === 'storm') c.globalAlpha = 1;
    for (const p of puffs) for (const dx of [-BAND_W, 0, BAND_W]) {
      const x = Math.round(p.x + dx - p.img.width / 2), y = Math.round(p.y);
      if (p.flip) { c.save(); c.translate(x + p.img.width, y); c.scale(-1, 1); c.drawImage(p.img, 0, 0); c.restore(); } else c.drawImage(p.img, x, y);
    }
    if (kind === 'storm') { c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(120,124,146,0.55)'; c.fillRect(0, 0, BAND_W, 64); }
    return (bands[key] = cv);
  }
  function drawCloudSea(ctx, dt) {
    const storm = SE.weather.stormy(), kind = storm ? 'storm' : 'calm';
    const wind = (1 + SE.weather.wind / 15) * (storm ? 4 : 1);
    s.cloudX = (s.cloudX || 0) + dt * wind;
    const layers = [{ seed: 1, y: 158, v: 3, a: 0.8 }, { seed: 2, y: 178, v: 6, a: 1 }];
    // the clouds stay behind the rock ledge (it starts at x≈80, y≈216); on the far left they fall away below
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 120, SE.W, 98); ctx.rect(0, 218, 84, SE.H - 218); ctx.rect(412, 128, 56, 92); ctx.clip('evenodd'); // (hole: the pine on the ledge)
    for (const L of layers) {
      const b = band(kind, L.seed);
      if (!b) continue;
      const off = ((s.cloudX * L.v) % BAND_W + BAND_W) % BAND_W;
      ctx.save(); ctx.globalAlpha = L.a;
      for (let x = -off; x < SE.W; x += BAND_W) ctx.drawImage(b, Math.round(x), L.y + Math.round(Math.sin(s.t * 0.2 + L.seed) * 1.5));
      ctx.restore();
    }
    ctx.restore();
  }

  function drawBreathe(ctx, dt) {
    const b = s.breathe;
    b.t += dt;
    const [label, len] = PHASES[b.phase];
    if (b.t >= len) {
      b.t = 0;
      b.phase = (b.phase + 1) % PHASES.length;
      SE.audio.sfx('soft');
      if (b.phase === 0) {
        b.cycles++; SE.save.breaths++; SE.persist();
        if (b.cycles % 5 === 0) SE.celebrate('So calm', `${b.cycles} slow breaths above the clouds. ${SE.pick(SE.PROPS)}`, { y: 150 });
      }
    }
    const k = b.t / len;
    const r = b.phase === 0 ? 10 + 22 * SE.ease(k) : b.phase === 1 ? 32 : 32 - 22 * SE.ease(k);
    const cx = SE.W / 2, cy = 74;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(255,240,230,0.12)';
    ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,230,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.stroke();
    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
    g.addColorStop(0, 'rgba(255,236,210,0.85)'); g.addColorStop(1, 'rgba(255,190,170,0.25)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    SE.text(label, cx, cy + 42, { align: 'center', size: 10, color: '#fff7ea' });
    SE.text(`${b.cycles} breaths`, cx, cy + 56, { align: 'center', size: 7, color: '#ffe6b8' });
  }
})();
