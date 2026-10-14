// Porch & Yard: the cabin from outside. Shovelling the path and resting on the porch are little
// cutscenes (stills and sound); chopping happens at the woodlot next door.
'use strict';

(function () {
  const WINDOWS = [{ x: 186, y: 175, r: 20 }, { x: 277, y: 176, r: 20 }, { x: 230, y: 118, r: 16, pool: false }, { x: 356, y: 183, r: 18 }, { x: 256, y: 171, r: 9, pool: false }];
  const PATH = { x: 168, y: 230, w: 140, h: 42 };
  const SPOT = {
    dog: { x: 128, y: 262 },
  };
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
      mode = 'yard';
      // arriving to shovel (the path was buried) or to sit on the porch: straight into its cutscene
      if (p.mode === 'shovel' || p.mode === 'porch') setTimeout(() => { if (SE.sceneName === 'yard' && mode === 'yard') (p.mode === 'shovel' ? shovel : porch)(); }, 700);
      s = { t: 0, chips: [], dir: { t: 0, dur: 0, last: null } };
      SE.audio.setMusic('outdoors');
      if (SE.save.snowDepth > 0.6) SE.toast('So much snow on the path! Grab the shovel when you like.', '#cfe6ff');
    },
    update() {
      SE.audio.setAmbience({ wind: 0.7, fire: 0, birds: SE.weather.night() > 0.6 ? 0 : 0.4, storm: SE.weather.stormy() ? 1 : 0 });
    },
    draw(ctx, dt) {
      s.t += dt;
      if (SE.weather.stormy() && s.t > 2 && !s.leaving) {
        s.leaving = true;
        SE.toast('The storm is too strong — back inside you go!', '#cfe6ff');
        setTimeout(() => { if (SE.sceneName === 'yard') SE.go('hall', { fromOutside: true }); }, 1600);
      }
      // just watching: he stays put in the yard
      if (mode === 'rock') { drawRock(ctx, dt); SE.hud.draw(ctx, { title: 'The rocking chair', subtitle: 'creak… creak…', map: false }); return; }

      SE.drawImg('bg_cabin', 0, 0);
      SE.weather.sway(ctx, 'bg_cabin', [[0, 40, 120, 200], [400, 10, 80, 240]]);
      SE.weather.overcast(ctx, 150);
      drawMounds(ctx);
      drawActors(ctx, dt);
      // night light falls on the whole yard; the windows and the smoke glow on top of it
      SE.drawChimneySmoke(ctx, 346, 62, dt); // smoke sits in the night air too, so it is tinted
      SE.weather.tint(ctx);
      SE.weather.stars(ctx, 60);
      SE.nightLights(ctx, 'lit/bg_cabin', 0, 0, WINDOWS);
      ctx.save(); ctx.globalAlpha = 0.6 * (1 - SE.weather.night()); SE.drawWindowGlow(ctx, WINDOWS); ctx.restore();
      SE.weather.sunshine(ctx, 215);
      SE.weather.draw(ctx);

      for (let i = s.chips.length - 1; i >= 0; i--) {
        const c = s.chips[i];
        c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 160 * dt;
        if (c.t > 1.2) { s.chips.splice(i, 1); continue; }
        ctx.fillStyle = c.c; ctx.fillRect(Math.round(c.x), Math.round(c.y), c.s, c.s);
      }

      drawButtons(ctx);
      const snowPct = Math.round(SE.save.snowDepth * 100);
      SE.hud.draw(ctx, { title: 'Porch & Yard', subtitle: `firewood: ${SE.save.wood} · snow on the path: ${snowPct}%`, map: false });
    },
  });

  // ------------------------------------------------------------ actors
  function drawActors(ctx, dt) {
    // Waffles rests in the snow by the steps
    SE.drawDogRest(236, 270, { flip: true });
  }

  // ------------------------------------------------------------ shovelling & the porch: cutscenes
  // Three stills carry the shovelling (deep snow, the trench half dug, the path clear), sound does
  // the work; when they end the path really is clear.
  function shovel() {
    if (SE.save.snowDepth < 0.04) { SE.toast('The path is already clear!'); return; }
    mode = 'busy';
    SE.moment('shovelling', { force: true, then: () => {
      SE.save.snowDepth = 0; SE.save.shoveled++; SE.persist(); SE.ach.note('shovel');
      mode = 'yard'; s.dir.dur = 0;
      SE.celebrate('Path is clear!', `The valley is all yours again. ${SE.pick(SE.PROPS)}`);
    } });
  }
  // The rocking chair: the cutscene, then you stay out there with him, rocking slowly with his mug
  // and Waffles at his feet, for as long as you like (not in a snowstorm).
  function porch() {
    if (SE.weather.stormy()) { SE.toast('Too stormy for the rocking chair. Maybe later.', '#cfe6ff'); return; }
    mode = 'busy';
    SE.moment('porchRest', { force: true, then: () => { mode = 'rock'; s.rockT = 0; s.sipped = -1; SE.save.porchSits = (SE.save.porchSits || 0) + 1; SE.persist(); } });
  }
  const ROCK_FRAMES = 16, ROCK_FPS = 5;
  function drawRock(ctx, dt) {
    s.rockT += dt;
    const f = Math.floor(s.rockT * ROCK_FPS) % ROCK_FRAMES, name = `cut/porch_rock_${f}`;
    // bright: a sunny-day light unless it is night
    const key = SE.stillFor(name, SE.weather.night() > 0.5 ? 'night' : 'day'), img = SE.img(key);
    ctx.fillStyle = '#06050a'; ctx.fillRect(0, 0, SE.W, SE.H);
    if (img) {
      const k = Math.max(1, Math.floor(Math.min(SE.W / img.width, SE.H / img.height)));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, Math.round((SE.W - img.width * k) / 2), Math.round((SE.H - img.height * k) / 2), img.width * k, img.height * k);
    }
    if (SE.weather.mode !== 'sunny') SE.weather.draw(ctx, { density: 0.6 });
    ctx.fillStyle = '#06050a'; ctx.fillRect(0, 0, SE.W, 22); ctx.fillRect(0, SE.H - 22, SE.W, 22);
    // the creak of the chair and a sip each time round
    const loop = Math.floor(s.rockT * ROCK_FPS / ROCK_FRAMES);
    if (f === 2 && s.creaked !== loop) { s.creaked = loop; SE.audio.sfx('creak'); }
    if (f === 9 && s.sipped !== loop) { s.sipped = loop; SE.audio.sfx('sip'); }
    if (SE.weather.stormy()) { mode = 'yard'; SE.toast('The wind picks up — time to head in.', '#cfe6ff'); return; }
    if (!SE.watching()) {
      const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
      if (SE.button(SE.W - 76, SE.H - 20, 70, 16, 'Get up', { alpha: a })) mode = 'yard';
    }
  }

  // ------------------------------------------------------------ buttons & watch director
  function drawButtons(ctx) {
    const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
    if (SE.watching() || mode === 'busy' || SE.momentPlaying()) return;
    const items = mode === 'yard'
      ? [['Chop wood', 62, () => SE.go('woodlot')], ['Shovel snow', 70, shovel], ['Rocking chair', 74, porch], ['Go inside', 58, () => SE.moment('home', { go: ['hall', { fromOutside: true }] })], ['Wander off', 64, leave]]
      : [];
    // a column on the right, so the woodpile and Waffles stay visible along the bottom
    let y = SE.H - 6 - items.length * 20;
    for (const [label, , cb] of items) { if (SE.button(SE.W - 86, y, 80, 18, label, { alpha: a })) cb(); y += 20; }
  }
  function leave() {
    if (SE.weather.stormy()) { SE.toast('Too stormy to wander. Stay cozy.', '#cfe6ff'); return; }
    if (SE.save.snowDepth >= 0.6) { SE.toast('The path is buried in snow — shovel it first.', '#cfe6ff'); shovel(); return; }
    SE.moment('leave', { go: ['map', {}] }); // a little cutscene: the door, the snow, Waffles bounding off
  }
  function direct(dt) {
    const d = s.dir;
    if (mode === 'busy' || SE.momentPlaying()) return;
    d.t += dt;
    if (d.t < d.dur) return;
    d.t = 0;
    let next;
    if (SE.save.snowDepth > 0.35 && d.last !== 'shovel') next = 'shovel';
    else next = SE.pick(['woodlot', 'porch', 'porch'].filter((m) => m !== d.last));
    d.last = next;
    if (next === 'shovel') { shovel(); d.dur = 999; return; }
    if (next === 'porch') { porch(); d.dur = 999; return; }
    SE.go('woodlot');
  }
})();
