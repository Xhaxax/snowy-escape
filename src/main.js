// Snowy Escape — boot: load save + art, then start on the title screen.
'use strict';

(function () {
  SE.load();
  SE.weather.catchUp();
  window.addEventListener('beforeunload', () => SE.persist());
  const M = window.SE_MANIFEST || { images: [], anims: {} };
  const images = ['bg_living', 'bg_kitchen', 'bg_lake', 'bg_forest', 'bg_summit', 'bg_cabin', 'bg_map', 'bg_trail']
    .concat(M.images, Object.keys(M.anims));
  for (const [name, a] of Object.entries(M.anims)) SE.defAnim(name, name, a.frames, a.fps);

  // loading screen while images arrive
  let loaded = false;
  SE.addScene('loading', {
    draw(ctx) {
      SE.text('Snowy Escape', SE.W / 2, SE.H / 2 - 14, { align: 'center', size: 16, color: '#ffe6b8' });
      const dots = '.'.repeat(1 + (Math.floor(SE.time * 3) % 3));
      SE.text('warming up the cabin' + dots, SE.W / 2, SE.H / 2 + 8, { align: 'center', size: 8, color: '#b9b1d6' });
      SE.weather.draw(ctx);
      if (loaded) SE.go('title');
    },
  });
  SE.start('loading');
  const fontReady = document.fonts ? document.fonts.load('10px "Pixelify Sans"').catch(() => {}) : Promise.resolve();
  Promise.all([SE.loadImages(images), fontReady]).then(() => { loaded = true; });
})();
