// Snowy Escape — boot: load save + art, then start on the title screen.
'use strict';

(function () {
  SE.load();
  SE.weather.catchUp();
  window.addEventListener('beforeunload', () => SE.persist());
  const M = window.SE_MANIFEST || { images: [], anims: {} };
  const images = ['bg_living', 'bg_kitchen', 'bg_lake', 'bg_forest', 'bg_summit', 'bg_cabin', 'bg_map', 'bg_trail', 'bg_trail2', 'bg_climb',
    'cut/leave', 'cut/lake', 'cut/chapel', 'cut/summit', 'cut/alert', 'cut/home', 'cut/lantern', 'cut/cocoa', 'cut/forest', 'cut/trail', 'cut/chop', 'cut/shovel', 'cut/porch', 'cut/pray',
    'lake_hands', 'kitchen_scale', 'kitchen_head', 'kitchen_fillet', 'props/dish', 'props/woodpile', 'props/mug', 'props/paw', 'snow/heap_big', 'snow/heap_small', 'smoke/p0', 'smoke/p1', 'smoke/p2', 'smoke/p3', 'smoke/p4',
    'world_ground', 'map/pine', 'map/spruce', 'map/cabin_td', 'map/mountain_td', 'map/chop_td', 'map/fishing_td', 'map/chapel_td', 'bg_chapel', 'lit/bg_cabin', 'lit/cabin_td', 'lit/chapel_td', 'bg_forest_dim']
    .concat(M.images, Object.keys(M.anims))
    // each cutscene still in its other weathers and times of day (src/moments.js)
    .concat(...Object.entries(SE.CUT_VARIANTS || {}).map(([n, vs]) => vs.map((v) => `cut/${n}_${v}`)))
    .concat([0, 1, 2, 3, 4, 5, 6, 7].map((i) => `cloud/c${i}`), [0, 1, 2, 3, 4, 5].map((i) => `cloud/w${i}`))
    // three camera-only photos per animal (wildlife encounters)
    .concat(...['deer', 'elk', 'fox', 'hare', 'owl', 'bird', 'bear'].map((k) => [0, 1, 2].map((i) => `photo/${k}_${i}`)));
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
