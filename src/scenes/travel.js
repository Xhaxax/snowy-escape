// Long Walk: an endless stroll through the snow with Waffles. Crunchy footsteps, footprints, little thoughts.
// Now and then the trail turns uphill: a little film of the two of them climbing a mountain path.
'use strict';

(function () {
  const GROUND = 246; // feet line, on the trodden path of the panorama
  const FLAT = [45, 75], CLIMB_LEN = 24; // seconds on the flat between climbs; length of a climb
  const THOUGHTS = [
    'The snow squeaks under your boots.',
    'Waffles found a stick. A very good stick.',
    'A raven calls somewhere far away.',
    'Your breath hangs in the air like a little cloud.',
    'Pine needles, cold air, nothing to hurry for.',
    'Waffles sneezes into a snowdrift. Happy dog.',
    'Somewhere a branch lets go of its snow. Fwump.',
    'Your cheeks are cold. Your heart is warm.',
    'The valley is so quiet you can hear the flakes land.',
    'Waffles looks back to check you are still there.',
  ];
  const CLIMB_THOUGHTS = [
    'The trail turns uphill. Your legs feel it, in a good way.',
    'Waffles bounds ahead, then waits for you on a rock.',
    'One step, then the next. The valley opens up below.',
    'Your breath puffs out in little clouds as you climb.',
    'Hold the rail, mind the ice. Waffles has four-paw drive.',
  ];
  // the climbing trail in bg_climb, from the bottom of the screen up into the distance
  const CLIMB_PATH = [[118, 290], [116, 240], [122, 205], [140, 178], [165, 153], [192, 134], [218, 118], [240, 104], [256, 90], [262, 80]];
  let s = null;

  SE.addScene('trail', {
    enter() {
      SE.save.location = 'trail';
      SE.persist();
      s = {
        t: 0, scroll: 0, prints: [], lastFrame: -1, lastDogFrame: -1,
        thought: SE.pick(THOUGHTS), thoughtT: 0, hurry: false, arrived: false, walked: 0,
        seg: 'flat', segT: SE.rand(20, 35), climb: null, fade: 0, wildT: SE.rand(40, 90),
      };
      SE.audio.setMusic('outdoors');
      SE.audio.setAmbience({ wind: 0.5 + SE.weather.wind / 80, birds: 0.25 * (1 - SE.weather.night()), storm: SE.weather.stormy() ? 1 : 0 });
    },
    update(dt) {
      SE.weather.stormCheck();
      SE.audio.setAmbience({ wind: 0.5 + SE.weather.wind / 80, birds: 0.25 * (1 - SE.weather.night()), storm: SE.weather.stormy() ? 1 : 0 });
    },
    draw(ctx, rdt) {
      const speed = s.hurry ? 2.2 : 1;
      const dt = rdt * speed;
      if (!s.arrived) s.t += dt;
      const walking = !s.arrived;
      const pxPerSec = 34;
      if (walking) s.scroll += pxPerSec * dt;

      // flat stretches alternate with a climb up the mountainside (its own little film)
      s.segT -= dt;
      if (s.segT <= 0) {
        if (s.seg === 'flat') { s.seg = 'climb'; s.segT = CLIMB_LEN; s.climb = { t: 0, lastStep: 0, puffs: [] }; s.thought = SE.pick(CLIMB_THOUGHTS); s.thoughtT = 0; }
        else { s.seg = 'flat'; s.segT = SE.rand(FLAT[0], FLAT[1]); s.climb = null; }
        s.fade = 1;
      }
      if (s.seg === 'climb') { drawClimb(ctx, dt, rdt, walking); return; }
      // on the flat, now and then something turns up beside the path (Waffles notices first)
      if (walking && SE.pickEncounter && !SE.weather.stormy()) {
        s.wildT -= dt;
        if (s.wildT <= 0 && !s.alertT) { s.alertT = 0.01; SE.audio.sfx('woof'); }
      }
      if (s.alertT) { s.alertT += rdt; if (s.alertT > 1.2) { s.alertT = 0; s.wildT = SE.rand(60, 120); SE.moment('alert', { go: ['encounter', { animal: SE.pickEncounter(), from: 'trail' }] }); } }

      // background panorama (mirrored tiling = seamless); the path runs along the bottom
      const bgName = SE.img('bg_trail2') ? 'bg_trail2' : 'bg_trail';
      const bg = SE.img(bgName);
      if (bg) {
        const off = (s.scroll * 0.45) % (bg.width * 2);
        for (let k = -1; k < 3; k++) {
          const x = Math.round(k * bg.width - off);
          if (x > SE.W || x + bg.width < 0) continue;
          SE.drawImg(bgName, x, 0, { flip: ((k % 2) + 2) % 2 === 1 });
        }
      }

      // foreground snow bank where footprints stay behind
      SE.weather.overcast(ctx, 200);
      if (bgName === 'bg_trail') {
        const g = ctx.createLinearGradient(0, GROUND - 6, 0, SE.H);
        g.addColorStop(0, 'rgba(236,242,255,0.0)');
        g.addColorStop(0.25, 'rgba(236,242,255,0.85)');
        g.addColorStop(1, 'rgba(200,214,240,0.95)');
        ctx.fillStyle = g;
        ctx.fillRect(0, GROUND - 6, SE.W, SE.H - GROUND + 6);
      }
      for (let i = 0; i < 40; i++) { // sparkles in snow
        const x = Math.round(((i * 97.3 - s.scroll) % SE.W + SE.W) % SE.W);
        const y = GROUND + 4 + ((i * 37) % 26);
        if (Math.sin(SE.time * 2 + i) > 0.6) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x, y, 1, 1); }
      }
      for (let i = s.prints.length - 1; i >= 0; i--) {
        const p = s.prints[i];
        const x = Math.round(p.x - (s.scroll - p.s));
        if (x < -10) { s.prints.splice(i, 1); continue; }
        ctx.fillStyle = 'rgba(140,155,195,0.55)';
        if (p.dog) { ctx.fillRect(x, p.y, 2, 1); ctx.fillRect(x + 3, p.y + 1, 2, 1); }
        else { ctx.fillRect(x, p.y, 4, 2); ctx.fillStyle = 'rgba(120,135,180,0.35)'; ctx.fillRect(x + 1, p.y + 2, 2, 1); }
      }

      // walkers
      // the canonical traveler (falls back to the older strip if it is missing)
      const walkAnim = SE.anims.trav_walk_e ? 'trav_walk_e' : 'traveler_walk';
      const tSize = SE.animSize(walkAnim);
      const tx = 180, ty = GROUND - (tSize.h || 54);
      const walkT = s.t;
      if (SE.anims[walkAnim]) {
        const fps = 10;
        const frame = walking ? Math.floor(walkT * fps) % SE.anims[walkAnim].frames : 0;
        SE.drawAnim(walkAnim, tx, ty, 0, { frame });
        if (walking && frame !== s.lastFrame && (frame === 1 || frame === 5)) {
          SE.audio.sfx('step', { deep: SE.weather.stormy() || SE.save.snowDepth > 0.6 });
          s.prints.push({ x: tx + (frame === 1 ? 4 : 14), y: GROUND + 2 + (frame === 1 ? 0 : 3), s: s.scroll });
        }
        s.lastFrame = frame;
      } else SE.drawActorFallback(ctx, tx + 6, ty + 10, '#a0522d');
      const dx = 228 + Math.sin(SE.time * 0.4) * 10, dSize = SE.animSize('dog_walk');
      if (SE.anims.dog_walk) {
        const frame = walking ? Math.floor(walkT * 11) % SE.anims.dog_walk.frames : 0;
        SE.drawAnim('dog_walk', dx, GROUND - dSize.h + SE.DOG_FOOT_PAD, 0, { frame });
        if (s.alertT && SE.drawBang) SE.drawBang(ctx, dx + dSize.w - 6, GROUND - dSize.h - 4, s.alertT);
        if (walking && frame !== s.lastDogFrame && frame % 4 === 0) s.prints.push({ x: dx + dSize.w / 2, y: GROUND + 6, s: s.scroll, dog: true });
        s.lastDogFrame = frame;
      } else SE.drawActorFallback(ctx, dx, GROUND - 22, '#2b2220', true);

      SE.weather.tint(ctx, 0.8);
      SE.weather.stars(ctx, 50);
      SE.weather.sunshine(ctx, 200);
      SE.weather.draw(ctx);

      overlay(ctx, dt, rdt, walking);
    },
  });

  function overlay(ctx, dt, rdt, walking) {
    // how far we've wandered today
    const stepM = (walking ? 34 * dt : 0) * 0.5;
    s.walked += stepM;
    SE.save.distance += stepM;
    // little thoughts
    const pool = s.seg === 'climb' ? CLIMB_THOUGHTS : THOUGHTS;
    s.thoughtT += rdt;
    if (s.thoughtT > 7) { s.thoughtT = 0; let n; do n = SE.pick(pool); while (n === s.thought); s.thought = n; }
    const ta = Math.min(1, s.thoughtT * 2, (7 - s.thoughtT) * 1.5);
    if (s.thoughtT > 0.6 || s.t > 1) {
      const w = SE.measure(s.thought, 8) + 16;
      SE.panel(SE.W / 2 - w / 2, 50, w, 16, { alpha: ta * 0.85 });
      SE.text(s.thought, SE.W / 2, 54, { align: 'center', size: 8, alpha: ta, color: '#fff7ea' });
    }
    // a soft dip to black between the flat and the climb
    if (s.fade > 0) { s.fade = Math.max(0, s.fade - rdt * 1.4); ctx.fillStyle = `rgba(12,10,20,${s.fade})`; ctx.fillRect(0, 0, SE.W, SE.H); }

    const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
    if (SE.button(SE.W - 96, SE.H - 24, 90, 18, s.hurry ? 'Stroll slowly' : 'Walk faster', { active: s.hurry, alpha: a })) s.hurry = !s.hurry;
    if (SE.button(6, SE.H - 24, 84, 18, 'Head back', { icon: 'back', alpha: a })) SE.go('map', { walkTo: 'cabin' });
    SE.hud.draw(ctx, { watch: false, title: s.seg === 'climb' ? 'Long Walk · the climb' : 'Long Walk', subtitle: `${Math.round(s.walked)} m wandered`, map: true });
  }

  // A point along the climbing trail (k from 0 at the bottom to 1 at the top), and how big a
  // walker looks there: they shrink as the path climbs away into the distance.
  function alongPath(k) {
    const P = CLIMB_PATH;
    const seg = [];
    let total = 0;
    for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(d); total += d; }
    let want = SE.clamp(k, 0, 1) * total;
    for (let i = 0; i < seg.length; i++) {
      if (want <= seg[i]) { const u = want / seg[i]; return [P[i][0] + (P[i + 1][0] - P[i][0]) * u, P[i][1] + (P[i + 1][1] - P[i][1]) * u]; }
      want -= seg[i];
    }
    return P[P.length - 1];
  }
  const depthScale = (y) => SE.clamp(0.4 + 0.6 * (y - 80) / 200, 0.4, 1);
  // nearest-neighbour scaling in 1/8 steps keeps the pixel art from shimmering as they recede
  const q8 = (v) => Math.max(0.375, Math.round(v * 8) / 8);

  function drawClimb(ctx, dt, rdt, walking) {
    const c = s.climb;
    if (walking) c.t += dt;
    SE.drawImg('bg_climb', 0, 0);
    SE.weather.sway(ctx, 'bg_climb', [[0, 0, 140, 140]]);
    SE.weather.overcast(ctx, 150);
    const k = c.t / (CLIMB_LEN - 1.5);
    // Waffles trots a few steps ahead, the traveler follows; both seen from behind
    const walkers = [
      { anim: SE.anims.trav_walk_n ? 'trav_walk_n' : 'traveler_walk', k: k - 0.03, fps: 8 },
      { anim: SE.anims.dog_walk_n ? 'dog_walk_n' : 'dog_walk', k: k + 0.06, fps: 10, dx: 10 },
    ].sort((a, b) => a.k - b.k).reverse(); // the one further up the trail is drawn first
    for (const w of walkers) {
      if (w.k < -0.05 || w.k > 1.02) continue;
      const [x, y] = alongPath(Math.max(0, w.k));
      const yy = w.k < 0 ? y - w.k * 400 : y;
      const sc = q8(depthScale(yy));
      const sz = SE.animSize(w.anim);
      const frame = walking ? Math.floor(c.t * w.fps * (0.6 + 0.4 * sc)) % (SE.anims[w.anim] ? SE.anims[w.anim].frames : 1) : 0;
      const px = Math.round(x + (w.dx || 0) * sc - (sz.w * sc) / 2), py = Math.round(yy - sz.h * sc);
      ctx.fillStyle = 'rgba(40,46,90,0.22)';
      ctx.beginPath(); ctx.ellipse(Math.round(x + (w.dx || 0) * sc), Math.round(yy), 8 * sc, 2 * sc, 0, 0, Math.PI * 2); ctx.fill();
      SE.drawAnim(w.anim, px, py, 0, { frame, scale: sc });
      // breath clouds in the cold air
      if (w.anim === 'trav_walk_n' && walking && Math.random() < dt * 1.6) c.puffs.push({ x: x, y: py + 8 * sc, t: 0, s: sc });
    }
    for (let i = c.puffs.length - 1; i >= 0; i--) {
      const p = c.puffs[i]; p.t += rdt;
      if (p.t > 1.6) { c.puffs.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - p.t / 1.6)})`;
      ctx.fillRect(Math.round(p.x + p.t * 6), Math.round(p.y - p.t * 5), Math.max(1, Math.round(2 * p.s)), 1);
    }
    // footsteps on the climb, slower and heavier
    c.lastStep -= dt;
    if (walking && c.lastStep <= 0 && k < 1) { c.lastStep = 0.42; SE.audio.sfx('step', { deep: true }); }
    SE.weather.tint(ctx, 0.8);
    SE.weather.sunshine(ctx, 200);
    SE.weather.draw(ctx);
    overlay(ctx, dt, rdt, walking);
  }
})();
