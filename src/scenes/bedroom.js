// The bedroom: the big quilted bed, the frosted window, the lamp. Mochi likes the quilt, Waffles the
// rug. At night you can go to sleep: a little cutscene of the three of them asleep (zzz), and the
// night passes until morning.
'use strict';

(function () {
  const WINDOW = [{ x: 238, y: 54, w: 92, h: 70 }];
  const BED_SURF = { quilt: [190, 290, 162], chest: [306, 346, 168], rug: [302, 350, 262] }; // the rug right of Waffles (he sleeps at 214–278)
  const BED_LINKS = [['rug', 'quilt'], ['quilt', 'chest'], ['rug', 'chest']];
  let mochi = null, busy = false;

  // the zzz drifting up from the three sleepers (positions in the sleep still)
  const SLEEPERS = [[170, 58], [120, 80], [186, 106]];
  function zzz(ctx, r) {
    SLEEPERS.forEach(([px, py], i) => {
      for (let k = 0; k < 3; k++) {
        const t = (r.t * 0.5 + k / 3 + i * 0.27) % 1;
        const x = r.x + (px + t * 10 + Math.sin(t * 6 + i) * 2) * r.s, y = r.y + (py - t * 18) * r.s;
        SE.text('z', x, y, { size: 7 + Math.round(t * 4), color: '#e6ecff', alpha: Math.sin(t * Math.PI) * 0.9 });
      }
    });
  }
  function sleep() {
    if (SE.weather.night() < 0.5 && (SE.save.settings.time || 'cycle') !== 'night') { SE.toast('It is still light out. Sleep comes after dark.', '#cfe6ff'); return; }
    busy = true;
    SE.MOMENTS.sleep[1].draw = zzz;
    SE.moment('sleep', { force: true, then: () => {
      busy = false;
      const sv = SE.save;
      if (sv.clock > 7) sv.day++;
      sv.clock = 7.2; // morning
      sv.sleeps = (sv.sleeps || 0) + 1; SE.ach.note('sleep');
      sv.fire = Math.max(0.2, sv.fire * 0.5);
      SE.persist();
      SE.toast(`Good morning. Day ${sv.day} in the mountains.`, '#ffe6b8');
      SE.audio.sfx('woof');
    } });
  }

  SE.addScene('bedroom', {
    enter() { mochi = SE.Mochi(BED_SURF, BED_LINKS); busy = false; SE.audio.setMusic('cabin'); SE.audio.woodSteps(3); },
    update() { SE.audio.setAmbience({ fire: 0.15, wind: 0.3 + SE.weather.wind / 80, storm: SE.weather.stormy() ? 0.5 : 0, muffled: true }); },
    draw(ctx, dt) {
      SE.drawImg('bg_bedroom', 0, 0);
      SE.weather.windows(ctx, WINDOW);
      // Waffles and Mochi are part of the room: drawn before the night falls over it, so the oil lamp
      // is what lights them (and catches their outline)
      SE.drawDogRest(214, 266, {});
      if (mochi) { mochi.update(dt); mochi.draw(); }
      const night = SE.weather.night(), fl = 0.9 + 0.06 * Math.sin(SE.time * 5) + 0.04 * Math.random();
      // after dark only the lamp on the nightstand and the candles on the shelf light the room
      SE.weather.interior(ctx, [
        { x: 61, y: 160, r: 150, k: 0.9 * fl },
        { x: 96, y: 60, r: 46, k: 0.55 * fl },
      ]);
      // the oil lamp: a warm glow around its glass and a soft pool on the wall and the nightstand
      SE.glow(ctx, 61, 158, 80 * fl, '255,176,96', (0.14 + night * 0.2) * fl);
      SE.glow(ctx, 61, 160, 14 * fl, '255,226,160', (0.35 + night * 0.25) * fl);
      SE.glow(ctx, 96, 60, 20 * fl, '255,200,120', (0.08 + night * 0.12) * fl); // the shelf candles
      if (!busy && !SE.momentPlaying() && !SE.watching()) {
        const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
        const canSleep = night >= 0.5 || (SE.save.settings.time || 'cycle') === 'night';
        if (SE.button(SE.W - 86, SE.H - 46, 80, 18, canSleep ? 'Go to sleep' : 'Sleep (at night)', { alpha: a, active: canSleep })) sleep();
        if (SE.button(SE.W - 86, SE.H - 24, 80, 18, 'Living room', { alpha: a })) SE.go('cabin');
      }

      SE.hud.draw(ctx, { title: 'Bedroom', subtitle: SE.weather.clockLabel ? SE.weather.clockLabel() : '', map: false });
    },
  });
})();
