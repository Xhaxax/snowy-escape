// The entrance hall: the one room with the front door. Coat and beanie on the hooks, boots on the
// mat, the lantern by the door. Coming home you stamp the snow off in here; going out is a little
// cutscene: coat on, boots on, the door opens and Waffles is first out into the snow.
'use strict';

(function () {
  const WINDOWS = [{ x: 60, y: 16, w: 76, h: 86 }]; // the frosty pane in the front door
  let s = null;

  SE.MOMENTS.leaveHome = [
    { img: 'cut/leave_coat', dur: 4.4, text: 'Coat on, beanie on. Boots laced tight.', pan: 1, sounds: [[0.4, 'rustle'], [1.6, 'rustle'], [2.8, 'wood'], [3.4, 'wood']] },
    { img: 'cut/leave_door', dur: 4.2, text: 'The door, the cold, the light — and Waffles is out first.', pan: -1, sounds: [[0.2, 'creak'], [0.9, 'gust'], [1.6, 'woof'], [2.6, 'step'], [3.1, 'step']] },
  ];

  function goOut() {
    if (SE.weather.stormy()) { SE.toast('Too stormy to go out. The fire and Mochi are right here.', '#cfe6ff'); return; }
    s.busy = true;
    SE.moment('leaveHome', { force: true, go: ['yard', {}] });
  }

  SE.addScene('hall', {
    enter(p) {
      SE.save.location = 'cabin';
      SE.persist();
      s = { t: 0, busy: false };
      SE.audio.setMusic('cabin');
      if (!p.fromOutside) SE.audio.woodSteps(3);
    },
    update() {
      SE.audio.setAmbience({ fire: 0.1, wind: 0.4 + SE.weather.wind / 70, storm: SE.weather.stormy() ? 0.7 : 0, muffled: true });
    },
    draw(ctx, dt) {
      s.t += dt;
      SE.drawImg('bg_hall', 0, 0);
      SE.weather.windows(ctx, WINDOWS);
      SE.weather.interior(ctx);
      const night = SE.weather.night(), fl = 0.85 + 0.1 * Math.sin(SE.time * 7) + 0.05 * Math.random();
      SE.glow(ctx, 408, 40, 46 * fl, '255,180,100', (0.1 + night * 0.2) * fl); // the lantern by the door
      if (!s.busy && !SE.momentPlaying() && !SE.watching()) {
        const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
        if (SE.button(SE.W - 86, SE.H - 46, 80, 18, 'Step outside', { alpha: a })) goOut();
        if (SE.button(SE.W - 86, SE.H - 24, 80, 18, 'Living room', { alpha: a })) SE.go('cabin', {});
      }
      SE.hud.draw(ctx, { title: 'Entrance', subtitle: SE.weather.stormy() ? 'the storm rattles the door' : 'coat, boots, the door', map: false });
    },
  });
})();
