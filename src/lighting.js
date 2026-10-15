// Light on the characters. Every frame the engine notes where each character sprite was drawn
// (SE.drawAnim) and every light that was drawn (SE.glow: the fire, lamps, lanterns, the headlamp, lit
// windows). Just before the HUD, each sprite near a light gets lit by it: a bright rim on the side
// that faces the light and a soft wash of its colour over the body, both kept inside the sprite's
// own pixels. Outdoors at night a cool rim of moonlight falls from above. So after dark Waffles is a
// dark shape with firelight along his back, and the traveler's lantern catches his coat.
'use strict';

(function () {
  const L = (SE.lighting = { sprites: [], lights: [], frame: -1, enabled: true });
  const OUTDOOR = ['map', 'lake', 'forest', 'summit', 'trail', 'yard', 'woodlot', 'encounter'];
  // animations that are not characters (props, effects): never lit this way
  const SKIP = /^(kitchen_|smoke|snow_|fx_)/;
  function fresh() { if (L.frame !== SE.time) { L.frame = SE.time; L.sprites.length = 0; L.lights.length = 0; } }

  const drawAnim = SE.drawAnim;
  SE.drawAnim = function (name, x, y, t, opts = {}) {
    drawAnim(name, x, y, t, opts);
    if (opts.unlit || SKIP.test(name) || (SE.momentPlaying && SE.momentPlaying())) return;
    const a = SE.anims[name], img = a && SE.images[a.img];
    if (!img) return;
    fresh();
    const fw = img.width / a.frames, fh = img.height;
    let f = opts.frame != null ? opts.frame : Math.floor(t * a.fps) % a.frames;
    if (opts.pingpong && a.frames > 2) { const n = a.frames * 2 - 2; f = Math.floor(t * a.fps) % n; if (f >= a.frames) f = n - f; }
    L.sprites.push({ img, f, fw, fh, x: Math.round(x), y: Math.round(y), s: opts.scale || 1, flip: !!opts.flip, alpha: opts.alpha == null ? 1 : opts.alpha });
  };
  const glow = SE.glow;
  SE.glow = function (ctx, x, y, r, rgb, strength) {
    glow(ctx, x, y, r, rgb, strength);
    if (SE.momentPlaying && SE.momentPlaying()) return;
    fresh();
    if (strength > 0.02 && r > 6) L.lights.push({ x, y, r, rgb, k: strength });
  };

  const c1 = document.createElement('canvas'), c2 = document.createElement('canvas');
  const x1 = c1.getContext('2d'), x2 = c2.getContext('2d');
  function prep(sp) {
    const w = Math.ceil(sp.fw * sp.s), h = Math.ceil(sp.fh * sp.s);
    for (const c of [c1, c2]) { if (c.width < w + 4) c.width = w + 4; if (c.height < h + 4) c.height = h + 4; }
    x1.setTransform(1, 0, 0, 1, 0, 0); x1.clearRect(0, 0, c1.width, c1.height);
    x1.imageSmoothingEnabled = false;
    x1.save();
    if (sp.flip) { x1.translate(2 + w, 2); x1.scale(-1, 1); x1.drawImage(sp.img, sp.f * sp.fw, 0, sp.fw, sp.fh, 0, 0, w, h); }
    else x1.drawImage(sp.img, sp.f * sp.fw, 0, sp.fw, sp.fh, 2, 2, w, h);
    x1.restore();
    return { w, h };
  }
  // the rim: sprite pixels whose neighbour toward the light is empty, filled with the light colour
  function rim(ctx, sp, dx, dy, rgb, a) {
    x2.setTransform(1, 0, 0, 1, 0, 0); x2.clearRect(0, 0, c2.width, c2.height);
    x2.globalCompositeOperation = 'source-over'; x2.drawImage(c1, 0, 0);
    x2.globalCompositeOperation = 'destination-out'; x2.drawImage(c1, -dx, -dy);
    x2.globalCompositeOperation = 'source-in'; x2.fillStyle = `rgb(${rgb})`; x2.fillRect(0, 0, c2.width, c2.height);
    x2.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = SE.clamp(a, 0, 1) * sp.alpha;
    ctx.drawImage(c2, sp.x - 2, sp.y - 2); ctx.restore();
  }
  // the wash: the light's colour over the body, strongest on the side nearest the light
  function wash(ctx, sp, lx, ly, r, rgb, a) {
    x2.setTransform(1, 0, 0, 1, 0, 0); x2.clearRect(0, 0, c2.width, c2.height);
    x2.globalCompositeOperation = 'source-over'; x2.drawImage(c1, 0, 0);
    x2.globalCompositeOperation = 'source-in';
    const g = x2.createRadialGradient(lx - sp.x + 2, ly - sp.y + 2, 1, lx - sp.x + 2, ly - sp.y + 2, r);
    g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`);
    x2.fillStyle = g; x2.fillRect(0, 0, c2.width, c2.height);
    x2.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = SE.clamp(a, 0, 1) * sp.alpha;
    ctx.drawImage(c2, sp.x - 2, sp.y - 2); ctx.restore();
  }

  SE.applyLighting = function (ctx) {
    if (!L.enabled || L.frame !== SE.time || !L.sprites.length) return;
    const W = SE.weather, night = W ? W.night() : 0, outdoor = OUTDOOR.includes(SE.sceneName);
    // indoors the lamps and the fire matter even by day; outdoors only once it gets dark
    const dark = outdoor ? SE.clamp((night - 0.25) * 1.6, 0, 1) : 0.45 + 0.55 * night;
    if (dark <= 0.02) return;
    for (const sp of L.sprites) {
      const { w, h } = prep(sp);
      const cx = sp.x + w / 2, cy = sp.y + h / 2, rad = Math.max(w, h) / 2;
      for (const li of L.lights) {
        const d = Math.max(0, Math.hypot(li.x - cx, li.y - cy) - rad * 0.6), reach = li.r * 1.5;
        if (d > reach) continue;
        const fall = Math.pow(1 - d / reach, 1.4), k = li.k * fall * dark;
        const len = Math.hypot(li.x - cx, li.y - cy) || 1;
        const dx = Math.round((li.x - cx) / len * 2), dy = Math.round((li.y - cy) / len * 2);
        // a light he carries himself (the headlamp, a lantern in hand) sits on his own sprite:
        // it lights what is around him, not his own outline
        const own = li.x > sp.x - 2 && li.x < sp.x + w + 2 && li.y > sp.y - 2 && li.y < sp.y + h + 2;
        if (own) continue;
        if (dx || dy) rim(ctx, sp, dx, dy, li.rgb, Math.min(0.55, k * 2));
        wash(ctx, sp, li.x, li.y, li.r, li.rgb, Math.min(0.32, k * 0.8));
      }
      // moonlight from above, outdoors after dark (not through storm clouds)
      if (outdoor && night > 0.5 && !W.stormy()) rim(ctx, sp, -1, -2, '150,175,255', 0.22 * (night - 0.5) * 2);
    }
  };
})();
