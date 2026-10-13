// Summit Trail: sit above the clouds with Waffles. Guided breathing and wishes on shooting stars.
'use strict';

(function () {
  const WISHES = [
    'a calm mind and a warm heart', 'more slow mornings like this', 'that the snow keeps falling softly',
    'good sleep for everyone you love', 'courage for the next chapter', 'a cozy winter for Mochi and Waffles',
    'that the hard things get a little lighter', 'to always find your way home',
  ];
  const PHASES = [['Breathe in…', 4], ['Hold…', 4], ['Breathe out…', 6]];
  let s = null;

  SE.addScene('summit', {
    enter(p) {
      SE.save.location = 'summit';
      SE.persist();
      s = { t: 0, clouds: [], star: null, starT: SE.rand(6, 14), breathe: null, tip: SE.save.wishes === 0 };
      for (let i = 0; i < 14; i++) s.clouds.push(newCloud(true));
      SE.audio.setMusic('outdoors');
      if (p.arrived) SE.toast('You made it. Waffles flops down beside you, panting happily.', '#ffe6b8');
    },
    update(dt) {
      SE.audio.setAmbience({ wind: 0.5 + SE.weather.wind / 70, chimes: 1, storm: SE.weather.stormy() ? 1 : 0 });
    },
    draw(ctx, dt) {
      s.t += dt;
      SE.drawImg('bg_summit', 0, 0);
      SE.weather.tint(ctx, 0.75);
      SE.weather.stars(ctx, 90);

      // drifting cloud wisps below the ledge line
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 100, SE.W, 122); ctx.clip();
      for (const c of s.clouds) {
        c.x += c.v * dt;
        if (c.x - c.w > SE.W) Object.assign(c, newCloud(false));
        ctx.fillStyle = `rgba(255,236,236,${c.a})`;
        for (const b of c.blobs) {
          ctx.beginPath();
          ctx.ellipse(Math.round(c.x + b.x), Math.round(c.y + b.y + Math.sin(s.t * 0.3 + b.x) * 0.6), b.r * 1.8, b.r, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // shooting stars
      s.starT -= dt;
      if (s.starT <= 0 && !s.star && SE.weather.night() < 0.3) s.starT = 5; // shooting stars come out at dusk and night
      if (s.starT <= 0 && !s.star) { s.star = { x: SE.rand(60, 380), y: SE.rand(8, 50), t: 0, vx: SE.rand(140, 200), vy: SE.rand(40, 70), autoRoll: Math.random() }; s.starT = SE.rand(10, 26); }
      if (s.star) {
        const st = s.star;
        st.t += dt;
        const x = st.x + st.vx * st.t, y = st.y + st.vy * st.t;
        const a = Math.sin(Math.min(1, st.t / 1.2) * Math.PI);
        for (let i = 0; i < 18; i++) {
          ctx.fillStyle = `rgba(255,250,220,${a * (1 - i / 18)})`;
          ctx.fillRect(Math.round(x - st.vx * i * 0.006), Math.round(y - st.vy * i * 0.006), i < 2 ? 2 : 1, 1);
        }
        const hit = { x: x - 40, y: y - 25, w: 70, h: 50 };
        if (!SE.modal && SE.inRect(SE.mouse.x, SE.mouse.y, hit)) SE.cursor = 'pointer';
        const autoWish = SE.watching() && st.t > 0.5 && st.autoRoll < 0.75;
        if (!SE.modal && (SE.mouse.released && SE.inRect(SE.mouse.x, SE.mouse.y, hit) || SE.key('Space') || autoWish)) {
          SE.mouse.released = false;
          SE.audio.sfx('wish');
          SE.save.wishes++; SE.persist();
          setTimeout(() => SE.celebrate('Wish made', 'You wish for ' + SE.pick(WISHES) + '.'), 400);
          for (let i = 0; i < 14; i++) SE.spawnFloater(x + SE.rand(-10, 10), y + SE.rand(-6, 6), 'spark', '#fff4c2');
          s.star = null;
        } else if (st.t > 1.2) s.star = null;
      }

      // traveler + Waffles on the ledge, seen from behind
      if (SE.anims.summit_sit) {
        const sz = SE.animSize('summit_sit');
        SE.drawAnim('summit_sit', 196, 238 - sz.h, s.t * 0.6, { pingpong: true });
      } else SE.drawActorFallback(ctx, 210, 196, '#a0522d');

      SE.weather.draw(ctx, { density: 0.6 });
      // watch mode: breathe along in long slow sessions with quiet pauses between
      if (SE.watching()) {
        s.autoB = (s.autoB == null ? 4 : s.autoB) - dt;
        if (s.autoB <= 0) { s.breathe = s.breathe ? null : { t: 0, phase: 0, cycles: 0 }; s.autoB = s.breathe ? SE.rand(60, 90) : SE.rand(25, 45); }
      }
      if (s.breathe) drawBreathe(ctx, dt);

      const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
      if (!SE.watching() && SE.button(SE.W - 106, SE.H - 24, 100, 18, s.breathe ? 'Stop breathing' : 'Breathe with me', { alpha: s.breathe ? 1 : a, active: !!s.breathe, icon: 'heart' })) {
        s.breathe = s.breathe ? null : { t: 0, phase: 0, cycles: 0 };
      }
      if (s.tip && s.t < 14 && !SE.watching()) SE.text(SE.weather.night() < 0.3 ? 'Come back at dusk or night to wish on shooting stars' : 'Click a shooting star (or press Space) to make a wish', 8, SE.H - 40, { size: 7, color: '#ffe6b8', alpha: Math.min(1, 14 - s.t) * a });
      SE.hud.draw(ctx, { title: 'Summit Trail', subtitle: `wishes made: ${SE.save.wishes}`, map: true });
    },
  });

  function newCloud(anywhere) {
    const w = SE.rand(60, 140);
    const blobs = Array.from({ length: 5 }, (_, i) => ({ x: (i / 4) * w - w / 2, y: SE.rand(-3, 3), r: SE.rand(4, 9) }));
    return { x: anywhere ? SE.rand(-60, SE.W) : -w - SE.rand(0, 80), y: SE.rand(130, 215), w, v: SE.rand(2, 6), a: SE.rand(0.08, 0.2), blobs };
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
        if (b.cycles % 5 === 0) SE.celebrate('So calm', `${b.cycles} slow breaths above the clouds. ${SE.pick(SE.PROPS)}`);
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
