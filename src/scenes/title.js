// Title screen: the cabin at dusk, chimney smoke, glowing windows.
'use strict';

(function () {
  const smoke = [];
  const WINDOWS = [
    { x: 188, y: 183, r: 22 }, { x: 275, y: 183, r: 22 }, { x: 230, y: 118, r: 16 }, { x: 354, y: 183, r: 18 }, { x: 231, y: 180, r: 10 },
  ];

  // Chimney smoke: PixelLab smoke puffs that rise, drift off with the wind, swell a little and fade.
  // Pixel puffs are drawn at 1x (no blurry scaling); `scale` only slows and thins them for far views.
  SE.drawChimneySmoke = function (ctx, cx, cy, dt, scale = 1) {
    if (Math.random() < dt * (scale < 1 ? 1.1 : 1.6)) smoke.push({ x: cx + SE.rand(-2, 2), y: cy, t: 0, life: SE.rand(4.5, 6.5), i: Math.floor(Math.random() * 5), flip: Math.random() < 0.5, s: scale });
    for (let i = smoke.length - 1; i >= 0; i--) {
      const p = smoke[i];
      p.t += dt;
      if (p.t > p.life) { smoke.splice(i, 1); continue; }
      p.y -= 8 * dt * p.s;
      p.x += (5 + SE.weather.wind * 0.45) * dt * p.s + Math.sin(p.t * 1.3) * 0.06;
      const k = p.t / p.life;
      const a = Math.min(1, p.t * 2) * (1 - k) * (p.s < 1 ? 0.35 : 0.55);
      const img = SE.img('smoke/p' + p.i);
      if (img) {
        ctx.save(); ctx.globalAlpha = a;
        const x = Math.round(p.x - img.width / 2), y = Math.round(p.y - img.height / 2);
        if (p.flip) { ctx.translate(x + img.width, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); } else ctx.drawImage(img, x, y);
        ctx.restore();
      } else {
        ctx.fillStyle = `rgba(150,150,170,${a * 0.6})`;
        ctx.beginPath(); ctx.arc(Math.round(p.x), Math.round(p.y), Math.round(3 + k * 8), 0, Math.PI * 2); ctx.fill();
      }
    }
  };

  SE.drawWindowGlow = function (ctx, list, warm = '255,190,110') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const w of list) {
      const flick = 0.75 + 0.15 * Math.sin(SE.time * 3.1 + w.x) + 0.1 * Math.sin(SE.time * 7.3 + w.y);
      const g = ctx.createRadialGradient(w.x, w.y, 1, w.x, w.y, w.r * 2.2);
      g.addColorStop(0, `rgba(${warm},${0.22 * flick})`);
      g.addColorStop(1, `rgba(${warm},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(w.x - w.r * 2.2, w.y - w.r * 2.2, w.r * 4.4, w.r * 4.4);
    }
    ctx.restore();
  };

  SE.addScene('title', {
    enter() {
      SE.audio.setMusic('cabin');
      SE.audio.setAmbience({ wind: 0.6, fire: 0, birds: 0 });
    },
    update() {},
    draw(ctx, dt) {
      SE.drawImg('bg_cabin', 0, 0);
      SE.drawChimneySmoke(ctx, 346, 62, dt);
      SE.drawWindowGlow(ctx, WINDOWS);
      SE.weather.draw(ctx);

      // title card
      const bob = Math.sin(SE.time * 1.2) * 1.5;
      ctx.fillStyle = 'rgba(18,14,28,0.35)';
      ctx.fillRect(0, 0, SE.W, 64);
      SE.text('Snowy Escape', SE.W / 2, 14 + bob, { align: 'center', size: 26, color: '#fff3dc', bold: true, shadowColor: 'rgba(40,30,70,0.9)' });
      SE.text('a cozy little place to rest your mind', SE.W / 2, 44 + bob, { align: 'center', size: 8, color: '#cfd8ff' });

      const has = SE.save.distance > 0 || SE.save.cooked > 0 || SE.fishCount() > 0;
      if (SE.button(SE.W / 2 - 50, 222, 100, 20, has ? 'Continue' : 'Begin', { size: 10 })) {
        SE.audio.unlock();
        SE.audio.sfx('door');
        SE.go('cabin');
      }
      SE.text('click to start · music is generated live', SE.W / 2, 248, { align: 'center', size: 6, color: 'rgba(230,230,255,0.7)' });
    },
  });
})();
