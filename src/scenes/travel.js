// Long Walk: an endless stroll through the snow with Waffles. Crunchy footsteps, footprints, little thoughts.
'use strict';

(function () {
  const GROUND = 240; // feet line
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
  let s = null;

  SE.addScene('trail', {
    enter() {
      SE.save.location = 'trail';
      SE.persist();
      s = {
        t: 0, scroll: 0, prints: [], lastFrame: -1, lastDogFrame: -1,
        thought: SE.pick(THOUGHTS), thoughtT: 0, hurry: false, arrived: false, walked: 0,
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

      // background panorama (mirrored tiling = seamless)
      const bg = SE.img('bg_trail');
      if (bg) {
        const off = (s.scroll * 0.45) % (bg.width * 2);
        for (let k = -1; k < 3; k++) {
          const x = Math.round(k * bg.width - off);
          if (x > SE.W || x + bg.width < 0) continue;
          SE.drawImg('bg_trail', x, 0, { flip: ((k % 2) + 2) % 2 === 1 });
        }
      }
      SE.weather.tint(ctx, 0.8);
      SE.weather.stars(ctx, 50);
      SE.weather.sunshine(ctx, 200);

      // foreground snow bank where footprints stay behind
      const g = ctx.createLinearGradient(0, GROUND - 6, 0, SE.H);
      g.addColorStop(0, 'rgba(236,242,255,0.0)');
      g.addColorStop(0.25, 'rgba(236,242,255,0.85)');
      g.addColorStop(1, 'rgba(200,214,240,0.95)');
      ctx.fillStyle = g;
      ctx.fillRect(0, GROUND - 6, SE.W, SE.H - GROUND + 6);
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
        if (walking && frame !== s.lastDogFrame && frame % 4 === 0) s.prints.push({ x: dx + dSize.w / 2, y: GROUND + 6, s: s.scroll, dog: true });
        s.lastDogFrame = frame;
      } else SE.drawActorFallback(ctx, dx, GROUND - 22, '#2b2220', true);

      SE.weather.draw(ctx);

      // how far we've wandered today
      const stepM = (walking ? 34 * dt : 0) * 0.5;
      s.walked += stepM;
      SE.save.distance += stepM;
      // little thoughts
      s.thoughtT += rdt;
      if (s.thoughtT > 7) { s.thoughtT = 0; let n; do n = SE.pick(THOUGHTS); while (n === s.thought); s.thought = n; }
      const ta = Math.min(1, s.thoughtT * 2, (7 - s.thoughtT) * 1.5);
      if (s.thoughtT > 0.6 || s.t > 1) {
        const w = SE.measure(s.thought, 8) + 16;
        SE.panel(SE.W / 2 - w / 2, 50, w, 16, { alpha: ta * 0.85 });
        SE.text(s.thought, SE.W / 2, 54, { align: 'center', size: 8, alpha: ta, color: '#fff7ea' });
      }

      const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
      if (SE.button(SE.W - 96, SE.H - 24, 90, 18, s.hurry ? 'Stroll slowly' : 'Walk faster', { active: s.hurry, alpha: a })) s.hurry = !s.hurry;
      if (SE.button(6, SE.H - 24, 84, 18, 'Head back', { icon: 'back', alpha: a })) SE.go('map', { walkTo: 'cabin' });
      SE.hud.draw(ctx, { watch: false, title: 'Long Walk', subtitle: `${Math.round(s.walked)} m wandered`, map: true });
    },
  });
})();
