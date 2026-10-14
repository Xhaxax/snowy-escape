// Title screen: the cabin at dusk, chimney smoke, glowing windows.
'use strict';

(function () {
  const smoke = [];
  const WINDOWS = [{ x: 186, y: 175, r: 20 }, { x: 277, y: 176, r: 20 }, { x: 230, y: 118, r: 16 }, { x: 356, y: 183, r: 18 }, { x: 256, y: 171, r: 9 }];
  let menu = 'main', confirmT = 0;
  // where a saved journey picks up again
  const RESUME = { cabin: 'cabin', woodlot: 'woodlot', lake: 'lake', forest: 'forest', summit: 'summit', trail: 'map', chapel: 'chapel' };
  const hasJourney = () => !!SE.hadSave && (SE.save.day > 1 || SE.save.distance > 0 || SE.save.cooked > 0 || SE.save.logs > 0 || SE.fishCount() > 0 || SE.save.prayers > 0);
  function start(scene, params) { SE.audio.unlock(); SE.audio.sfx('door'); menu = 'main'; SE.go(scene, params || {}); }

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
      const tg = ctx.createLinearGradient(0, 0, 0, 72);
      tg.addColorStop(0, 'rgba(18,14,28,0.45)'); tg.addColorStop(1, 'rgba(18,14,28,0)');
      ctx.fillStyle = tg; ctx.fillRect(0, 0, SE.W, 72);
      SE.text('Snowy Escape', SE.W / 2, 14 + bob, { align: 'center', size: 26, color: '#fff3dc', bold: true, shadowColor: 'rgba(40,30,70,0.9)' });
      SE.text('a cozy little place to rest your mind', SE.W / 2, 44 + bob, { align: 'center', size: 8, color: '#cfd8ff' });

      const a = 1;
      if (menu === 'main') {
        const items = [];
        if (hasJourney()) items.push([`Continue · day ${SE.save.day}`, () => start(RESUME[SE.save.location] || 'cabin', { inDoor: true })]);
        items.push([hasJourney() ? 'New journey' : 'Begin', () => { if (hasJourney()) { menu = 'confirm'; confirmT = 0; } else start('cabin', { inDoor: true }); }]);
        items.push(['Settings', () => { menu = 'settings'; }]);
        let y = 196 - (items.length - 2) * 12;
        for (const [label, cb] of items) { if (SE.button(SE.W / 2 - 62, y, 124, 20, label, { size: 9, alpha: a })) cb(); y += 24; }
        SE.text('your journey is saved on this device · music is generated live', SE.W / 2, 254, { align: 'center', size: 6, color: 'rgba(230,230,255,0.7)' });
      } else if (menu === 'confirm') {
        confirmT += dt;
        SE.panel(SE.W / 2 - 110, 150, 220, 84, { fill: 'rgba(48,40,70,0.96)' });
        SE.text('Start a new journey?', SE.W / 2, 160, { align: 'center', size: 10, color: '#ffe6b8' });
        SE.text(`Day ${SE.save.day}, your photos, fish and notes will be gone.`, SE.W / 2, 176, { align: 'center', size: 7, color: '#dfe8ff' });
        if (SE.button(SE.W / 2 - 100, 202, 96, 20, 'Keep my journey', { size: 8 })) menu = 'main';
        if (confirmT > 0.4 && SE.button(SE.W / 2 + 4, 202, 96, 20, 'Start over', { size: 8 })) {
          const keep = SE.save.settings;
          SE.save = SE.defaultSave(); SE.save.settings = Object.assign(SE.save.settings, keep, { watch: false });
          SE.persist();
          start('cabin', { inDoor: true });
        }
      } else drawSettings(ctx);
    },
  });

  // ------------------------------------------------------------ settings (also reachable in game)
  SE.drawSettingsPanel = drawSettings;
  function drawSettings(ctx) {
    const s = SE.save.settings, px = SE.W / 2 - 150, py = 70, pw = 300, ph = 170;
    SE.panel(px, py, pw, ph, { fill: 'rgba(48,40,70,0.97)' });
    SE.text('Settings', px + 12, py + 8, { size: 10, color: '#ffe6b8' });
    // sound
    [['Music', 'music'], ['Ambience', 'ambience'], ['Effects', 'sfx']].forEach(([label, key], i) => {
      const y = py + 34 + i * 20;
      SE.text(label, px + 14, y - 4, { size: 7 });
      const v = SE.slider('set-' + key, px + 62, y, 80, s[key]);
      if (v !== s[key]) { s[key] = v; SE.audio.applyVolumes(); SE.persist(); }
    });
    // screen size: on a phone, leave room if the browser covers the edges
    SE.text('Screen size', px + 14, py + 94, { size: 7 });
    const sv = SE.slider('set-screen', px + 62, py + 98, 80, ((s.screen || 1) - 0.6) / 0.4);
    const ns = Math.round((0.6 + sv * 0.4) * 100) / 100;
    if (ns !== (s.screen || 1)) { s.screen = ns; SE.persist(); SE.resize(); }
    SE.text(`${Math.round((s.screen || 1) * 100)}%`, px + 148, py + 94, { size: 7, color: '#b9b1d6' });
    // weather & time of day
    SE.text('Weather', px + 172, py + 26, { size: 7, color: '#dfe8ff' });
    [['auto', 'Nature decides'], ['sunny', 'Sunny'], ['calm', 'Gentle snow'], ['storm', 'Snowstorm']].forEach(([k, label], i) => {
      if (SE.button(px + 172, py + 36 + i * 15, 56, 13, label, { active: s.weather === k, size: 6 })) { s.weather = k; if (k !== 'auto') SE.weather.set(k); SE.persist(); }
    });
    SE.text('Time', px + 234, py + 26, { size: 7, color: '#dfe8ff' });
    [['cycle', 'Day cycle'], ['live', 'My clock'], ['day', 'Day'], ['night', 'Night']].forEach(([k, label], i) => {
      if (SE.button(px + 234, py + 36 + i * 15, 56, 13, label, { active: (s.time || 'cycle') === k, size: 6 })) { s.time = k; SE.persist(); }
    });
    if (SE.button(px + 14, py + ph - 26, 120, 18, s.hideUi ? 'UI fades when idle: on' : 'UI fades when idle: off', { size: 7 })) { s.hideUi = !s.hideUi; SE.persist(); }
    if (SE.button(px + pw - 74, py + ph - 26, 62, 18, 'Done', { size: 8, active: true })) menu = 'main';
  }
})();
