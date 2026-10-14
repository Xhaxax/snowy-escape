// The bedroom: the big quilted bed, the frosted window, the lamp. Mochi likes the quilt, Waffles the
// rug. At night you can go to sleep: a little cutscene of the three of them asleep (zzz), and the
// night passes until morning.
'use strict';

(function () {
  const WINDOW = [{ x: 238, y: 54, w: 92, h: 70 }];
  const BED_SURF = { quilt: [190, 290, 162], chest: [298, 334, 152], rug: [150, 330, 262] };
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
      sv.sleeps = (sv.sleeps || 0) + 1;
      sv.fire = Math.max(0.2, sv.fire * 0.5);
      SE.persist();
      SE.toast(`Good morning. Day ${sv.day} in the mountains.`, '#ffe6b8');
      SE.audio.sfx('woof');
    } });
  }

  SE.addScene('bedroom', {
    enter() { mochi = SE.Mochi(BED_SURF, BED_LINKS); busy = false; SE.audio.setMusic('cabin'); },
    update() { SE.audio.setAmbience({ fire: 0.15, wind: 0.3 + SE.weather.wind / 80, storm: SE.weather.stormy() ? 0.5 : 0, muffled: true }); },
    draw(ctx, dt) {
      SE.drawImg('bg_bedroom', 0, 0);
      SE.weather.windows(ctx, WINDOW);
      SE.weather.interior(ctx);
      const night = SE.weather.night(), fl = 0.85 + 0.1 * Math.sin(SE.time * 7) + 0.05 * Math.random();
      SE.glow(ctx, 112, 148, 70 * fl, '255,180,100', (0.12 + night * 0.16) * fl); // the bedside lamp
      SE.glow(ctx, 112, 140, 12, '255,230,160', 0.4 * fl);
      SE.drawDogRest(214, 266, {});
      if (mochi) { mochi.update(dt); mochi.draw(); }
      if (!busy && !SE.momentPlaying() && !SE.watching()) {
        const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
        const canSleep = night >= 0.5 || (SE.save.settings.time || 'cycle') === 'night';
        if (SE.button(SE.W - 86, SE.H - 46, 80, 18, canSleep ? 'Go to sleep' : 'Sleep (at night)', { alpha: a, active: canSleep })) sleep();
        if (SE.button(SE.W - 86, SE.H - 24, 80, 18, 'Living room', { alpha: a })) SE.go('cabin');
      }
      if (SE.watching() && !busy && night > 0.7 && !SE.momentPlaying() && Math.random() < dt * 0.05) sleep();
      SE.hud.draw(ctx, { title: 'Bedroom', subtitle: SE.weather.clockLabel ? SE.weather.clockLabel() : '', map: false });
    },
  });
})();
