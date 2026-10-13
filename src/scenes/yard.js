// Porch & Yard: chop firewood (Waffles cheers or naps), shovel the path, rock on the porch.
'use strict';

(function () {
  const WINDOWS = [{ x: 188, y: 183, r: 22 }, { x: 275, y: 183, r: 22 }, { x: 230, y: 118, r: 16 }, { x: 354, y: 183, r: 18 }, { x: 231, y: 180, r: 10 }];
  const PATH = { x: 168, y: 230, w: 140, h: 42 };
  const SPOT = {
    chop: { x: 30, y: 268 },   // feet of the chopper (his stump is part of the sprite)
    dog: { x: 128, y: 262 },
    porch: { x: 282, y: 236 }, // rocking chair on the porch
    shovel: { x: 196, y: 264 },
  };
  const THOUGHTS = [
    'The air smells like pine and woodsmoke.', 'Snow settles on your shoulders.', 'Waffles catches a snowflake on his tongue.',
    'The chair creaks softly. Back and forth.', 'Somewhere, an owl hoots once.', 'The chimney puffs little clouds.',
  ];
  let mode = 'yard', s = null;

  // the mounds of snow on the path come from the snow depth
  // snow piled on the path: PixelLab snow heaps that grow in number (and size) as the snow deepens
  function drawMounds(ctx) {
    const d = SE.save.snowDepth;
    const n = Math.ceil(d * 5);
    for (let i = 0; i < n; i++) {
      const big = d > 0.45 && i % 2 === 0;
      const name = big ? 'snow/heap_big' : 'snow/heap_small';
      const img = SE.img(name);
      const x = PATH.x + ((i * 0.61803) % 1) * Math.max(10, PATH.w - 60) - 10, y = PATH.y + 6 + ((i * 37) % Math.max(6, PATH.h - 10));
      if (img) { ctx.save(); ctx.globalAlpha = Math.min(1, d * 3); SE.drawImg(name, Math.round(x), Math.round(y - img.height + 4), { flip: i % 2 === 1 }); ctx.restore(); }
      else for (const m of mounds()) { ctx.fillStyle = '#eef3ff'; ctx.beginPath(); ctx.ellipse(m.x, m.y, m.r, m.r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  function mounds() {
    const n = Math.round(SE.save.snowDepth * 14);
    const out = [];
    for (let i = 0; i < n; i++) {
      const k = (i * 7919) % 97;
      out.push({ x: PATH.x + 6 + ((i * 37 + k) % (PATH.w - 16)), y: PATH.y + 8 + ((i * 23 + k) % (PATH.h - 14)), r: 5 + (k % 5), i });
    }
    return out;
  }

  SE.addScene('yard', {
    enter(p) {
      SE.save.location = 'cabin';
      mode = p.mode || 'yard';
      s = { t: 0, chips: [], meter: 0, chopAnim: 0, cheer: true, cheerT: SE.rand(10, 20), thought: null, thoughtT: 4, dir: { t: 0, dur: 0, last: null }, auto: 0, splitT: 0 };
      SE.audio.setMusic('outdoors');
      if (SE.save.snowDepth > 0.6) SE.toast('So much snow on the path! Grab the shovel when you like.', '#cfe6ff');
    },
    update() {
      SE.audio.setAmbience({ wind: 0.7, fire: 0, birds: SE.weather.night() > 0.6 ? 0 : 0.4, storm: SE.weather.stormy() ? 1 : 0 });
    },
    draw(ctx, dt) {
      s.t += dt;
      if (SE.weather.stormy() && mode !== 'yard') mode = 'yard';
      if (SE.weather.stormy() && s.t > 2 && !s.leaving) {
        s.leaving = true;
        SE.toast('The storm is too strong — back inside you go!', '#cfe6ff');
        setTimeout(() => { if (SE.sceneName === 'yard') SE.go('cabin', {}); }, 1600);
      }
      if (SE.watching()) direct(dt);

      SE.drawImg('bg_cabin', 0, 0);
      SE.weather.sway(ctx, 'bg_cabin', [[0, 40, 120, 200], [400, 10, 80, 240]]);
      SE.weather.overcast(ctx, 150);
      drawMounds(ctx);
      drawActors(ctx, dt);
      // night light falls on the whole yard; the windows and the smoke glow on top of it
      SE.weather.tint(ctx);
      SE.weather.stars(ctx, 60);
      SE.drawChimneySmoke(ctx, 346, 62, dt);
      ctx.save(); ctx.globalAlpha = 0.6 + SE.weather.night() * 0.8; SE.drawWindowGlow(ctx, WINDOWS); ctx.restore();
      SE.weather.sunshine(ctx, 215);
      SE.weather.draw(ctx);

      for (let i = s.chips.length - 1; i >= 0; i--) {
        const c = s.chips[i];
        c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 160 * dt;
        if (c.t > 1.2) { s.chips.splice(i, 1); continue; }
        ctx.fillStyle = c.c; ctx.fillRect(Math.round(c.x), Math.round(c.y), c.s, c.s);
      }
      if (mode === 'chop') drawChopMeter(ctx, dt);
      if (mode === 'porch') drawThoughts(dt);

      drawButtons(ctx);
      const snowPct = Math.round(SE.save.snowDepth * 100);
      SE.hud.draw(ctx, { title: 'Porch & Yard', subtitle: `firewood: ${SE.save.wood} · snow on the path: ${snowPct}%`, map: false });
    },
  });

  // ------------------------------------------------------------ actors
  function drawActors(ctx, dt) {
    const sz = (n) => SE.animSize(n);
    // the chopping corner: stump with the axe waiting in it, and a woodpile that grows
    SE.drawWoodpile(ctx, 100, 256, SE.save.wood);
    if (mode === 'chop' && SE.anims.chop) {
      const frame = s.chopAnim > 0 ? Math.floor(s.chopAnim) % SE.anims.chop.frames : 0;
      SE.drawAnim('chop', SPOT.chop.x, SPOT.chop.y - sz('chop').h, 0, { frame });
    } else if (SE.img('chop_area')) SE.drawImg('chop_area', 22, 268 - SE.img('chop_area').height);

    // Waffles: cheering while you chop or shovel, otherwise resting on his tummy
    const cheering = (mode === 'chop' && s.cheer) || mode === 'shovel';
    const dA = SE.dogCheer();
    if (cheering && SE.anims[dA]) {
      const d = sz(dA);
      const pos = mode === 'shovel' ? { x: 300, y: 266 } : { x: 160, y: 266 };
      const hop = Math.abs(Math.sin(s.t * 6)) * 2;
      SE.drawAnim(dA, pos.x, pos.y - d.h - hop, s.t * 1.6, { pingpong: dA === 'dog_happy' });
      if (Math.random() < dt * 0.8) SE.spawnFloater(pos.x + d.w / 2, pos.y - d.h, Math.random() < 0.5 ? 'note' : 'heart');
    } else {
      const pos = mode === 'porch' ? { x: 336, y: 240, flip: true } : mode === 'chop' ? { x: 150, y: 268 } : { x: 236, y: 270, flip: true };
      SE.drawDogRest(pos.x, pos.y, { flip: pos.flip });
    }
    s.cheerT -= dt;
    if (s.cheerT <= 0) {
      s.cheer = !s.cheer;
      s.cheerT = s.cheer ? SE.rand(12, 22) : SE.rand(15, 30);
      if (mode === 'chop') SE.toast(s.cheer ? 'Waffles jumps up to cheer you on!' : 'Waffles lies down for a calm little rest.', '#ffe6b8');
    }
    if (mode === 'porch') {
      if (SE.anims.porch) SE.drawAnim('porch', SPOT.porch.x, SPOT.porch.y - sz('porch').h, s.t * 0.9, { pingpong: true });
      else SE.drawActorFallback(ctx, SPOT.porch.x, SPOT.porch.y - 40, '#a0522d');
    }
    if (mode === 'shovel') {
      if (SE.anims.shovel) SE.drawAnim('shovel', SPOT.shovel.x, SPOT.shovel.y - sz('shovel').h, s.t * 1.2, {});
      else SE.drawActorFallback(ctx, SPOT.shovel.x, SPOT.shovel.y - 40, '#a0522d');
    }
  }

  // ------------------------------------------------------------ chopping: stop the swing in the sweet spot
  function drawChopMeter(ctx, dt) {
    s.meter += dt * 0.9;
    const v = (Math.sin(s.meter * 2.4) + 1) / 2;
    const x = 30, y = 70, h = 90;
    SE.panel(x - 6, y - 16, 30, h + 34, { alpha: 0.92 });
    SE.text('swing', x + 9, y - 12, { size: 6, align: 'center', color: '#dfe8ff' });
    ctx.fillStyle = '#20304e'; ctx.fillRect(x, y, 18, h);
    ctx.fillStyle = 'rgba(127,211,138,0.85)'; ctx.fillRect(x, y, 18, h * 0.22);
    ctx.fillStyle = 'rgba(232,194,122,0.7)'; ctx.fillRect(x, y + h * 0.22, 18, h * 0.16);
    const my = Math.round(y + h * (1 - v));
    ctx.fillStyle = '#fff7ea'; ctx.fillRect(x - 3, my - 1, 24, 3);
    if (s.chopAnim > 0 && SE.anims.chop) s.chopAnim = Math.min(SE.anims.chop.frames - 0.01, s.chopAnim + dt * 12);
    if (SE.anims.chop && s.chopAnim >= SE.anims.chop.frames - 0.02) s.chopAnim = 0;

    const auto = SE.watching() && v > 0.84 && (s.auto -= dt) <= 0;
    const tap = !SE.modal && ((SE.mouse.pressed && SE.mouse.y < SE.H - 30 && SE.mouse.y > 30) || SE.key('Space'));
    if (tap || auto) {
      s.auto = SE.rand(2.2, 4);
      s.chopAnim = 0.01;
      SE.audio.sfx('chop');
      const good = v > 0.62;
      const perfect = v > 0.78;
      for (let i = 0; i < (perfect ? 16 : 7); i++) s.chips.push({ x: SPOT.chop.x + 44, y: SPOT.chop.y - 20, vx: SE.rand(-60, 60), vy: SE.rand(-90, -30), t: 0, s: Math.random() < 0.3 ? 2 : 1, c: SE.pick(['#c99a62', '#e8c99a', '#8a5a34']) });
      if (good) {
        SE.save.wood = Math.min(40, SE.save.wood + (perfect ? 2 : 1));
        SE.save.logs++;
        SE.persist();
        s.splitT++;
        if (perfect) SE.toast(perfect ? 'Clean split! +2 firewood' : '+1 firewood', '#ffe6b8');
        else SE.toast('+1 firewood', '#ffe6b8');
        if (s.splitT % 5 === 0) SE.celebrate('Woodpile growing!', `${SE.save.wood} pieces of firewood stacked. ${SE.pick(SE.PROPS)}`);
        if (s.cheer && Math.random() < 0.5) SE.audio.sfx('woof');
      } else SE.toast('Glanced off — try again, no hurry.', '#cfe6ff');
    }
  }

  // ------------------------------------------------------------ shoveling
  function shovelTick(auto) {
    const ms = mounds();
    if (!ms.length) return;
    let target = null;
    if (auto) target = ms[ms.length - 1];
    else {
      target = ms.find((m) => Math.hypot(SE.mouse.x - m.x, SE.mouse.y - m.y) < m.r + 6);
      if (!target && SE.inRect(SE.mouse.x, SE.mouse.y, PATH)) target = ms[ms.length - 1];
    }
    if (!target) return;
    SE.audio.sfx('step', { deep: true });
    for (let i = 0; i < 10; i++) s.chips.push({ x: target.x, y: target.y - 2, vx: SE.rand(-50, 80), vy: SE.rand(-90, -40), t: 0, s: Math.random() < 0.4 ? 2 : 1, c: '#f4f7ff' });
    SE.save.snowDepth = Math.max(0, SE.save.snowDepth - 1 / 14);
    if (SE.save.snowDepth < 0.04) {
      SE.save.snowDepth = 0;
      SE.save.shoveled++;
      SE.persist();
      SE.celebrate('Path is clear!', `The valley is all yours again. ${SE.pick(SE.PROPS)}`);
      mode = 'yard';
      s.dir.dur = 0; // let the watch-mode director pick the next little scene right away
    }
  }

  function drawThoughts(dt) {
    s.thoughtT -= dt;
    if (s.thoughtT <= 0) { s.thought = SE.pick(THOUGHTS); s.thoughtT = 9; }
    if (!s.thought) return;
    const a = Math.min(1, (9 - s.thoughtT) * 2, s.thoughtT * 1.5);
    const w = SE.measure(s.thought, 8) + 16;
    SE.panel(SE.W / 2 - w / 2, 52, w, 16, { alpha: a * 0.85 });
    SE.text(s.thought, SE.W / 2, 56, { align: 'center', size: 8, alpha: a });
  }

  // ------------------------------------------------------------ buttons & watch director
  function drawButtons(ctx) {
    const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
    if (mode === 'shovel') {
      const clickable = !SE.modal && SE.mouse.y < SE.H - 28 && SE.mouse.y > 30;
      if (clickable) SE.cursor = 'pointer';
      if (!SE.watching() && clickable && SE.mouse.pressed) shovelTick(false);
      SE.text(SE.watching() ? 'Scrape… scrape… fwump.' : 'Click the snow piles to shovel them away', SE.W / 2, SE.H - 40, { align: 'center', size: 8, color: '#ffe6b8', alpha: 0.7 + 0.3 * Math.sin(SE.time * 3) });
    }
    if (mode === 'chop' && !SE.watching()) SE.text('Click (or Space) when the swing is high — no rush', SE.W / 2, SE.H - 40, { align: 'center', size: 8, color: '#ffe6b8', alpha: 0.6 * a + 0.2 });
    if (SE.watching()) return;
    const items = mode === 'yard'
      ? [['Chop wood', 62, () => { mode = 'chop'; SE.moment('chop'); }], ['Shovel snow', 70, () => { if (SE.save.snowDepth < 0.04) SE.toast('The path is already clear!'); else { mode = 'shovel'; SE.moment('shovel'); } }], ['Rocking chair', 74, () => { mode = 'porch'; SE.moment('porch'); }], ['Go inside', 58, () => SE.moment('home', { go: ['cabin', {}] })], ['Wander off', 64, leave]]
      : [['Done', 50, () => (mode = 'yard')]];
    // a column on the right, so the woodpile and Waffles stay visible along the bottom
    let y = SE.H - 6 - items.length * 20;
    for (const [label, , cb] of items) { if (SE.button(SE.W - 86, y, 80, 18, label, { alpha: a })) cb(); y += 20; }
  }
  function leave() {
    if (SE.weather.stormy()) { SE.toast('Too stormy to wander. Stay cozy.', '#cfe6ff'); return; }
    if (SE.save.snowDepth >= 0.6) { SE.toast('The path is buried in snow — shovel it first.', '#cfe6ff'); mode = 'shovel'; return; }
    SE.moment('leave', { go: ['map', {}] }); // a little cutscene: the door, the snow, Waffles bounding off
  }
  function direct(dt) {
    const d = s.dir;
    d.t += dt;
    if (mode === 'shovel') {
      s.autoShovel = (s.autoShovel || 1) - dt;
      if (s.autoShovel <= 0) { s.autoShovel = SE.rand(1.1, 1.8); shovelTick(true); }
      if (SE.save.snowDepth > 0) return;
    }
    if (d.t < d.dur) return;
    d.t = 0;
    let next;
    if (SE.save.snowDepth > 0.35 && d.last !== 'shovel') next = 'shovel';
    else next = SE.pick(['chop', 'porch', 'chop', 'porch'].filter((m) => m !== d.last));
    d.last = next;
    mode = next;
    d.dur = next === 'chop' ? SE.rand(35, 55) : next === 'porch' ? SE.rand(45, 70) : 999;
  }
})();
