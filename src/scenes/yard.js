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

  SE.addScene('yard', {
    enter(p) {
      SE.save.location = 'cabin';
      mode = 'yard';
      // arriving to shovel (the path was buried) or to sit on the porch: straight into its cutscene
      if (p.mode === 'shovel' || p.mode === 'porch') setTimeout(() => { if (SE.sceneName === 'yard' && mode === 'yard') (p.mode === 'shovel' ? shovel : porch)(); }, 700);
      s = { t: 0, chips: [], dir: { t: 0, dur: 0, last: null } };
      SE.audio.setMusic('outdoors');
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
      SE.hud.draw(ctx, { title: 'Porch & Yard', subtitle: `firewood: ${SE.save.wood}`, map: false });
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
    SE.moment('porchRest', { force: true, then: () => { mode = 'rock'; s.rockT = 0; s.nextSip = null; SE.save.porchSits = (SE.save.porchSits || 0) + 1; SE.persist(); } });
  }
  const ROCK_FRAMES = 16, ROCK_FPS = 5;
  function drawRock(ctx, dt) {
    s.rockT += dt;
    const f = Math.floor(s.rockT * ROCK_FPS) % ROCK_FRAMES, name = `cut/porch_rock_${f}`;
    // the same light as the stills before it: day, overcast, windy, dusk (lantern lit) or night
    const key = SE.stillFor(name), img = SE.img(key);
    ctx.fillStyle = '#06050a'; ctx.fillRect(0, 0, SE.W, SE.H);
    if (img) {
      const k = Math.max(1, Math.floor(Math.min(SE.W / img.width, SE.H / img.height)));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, Math.round((SE.W - img.width * k) / 2), Math.round((SE.H - img.height * k) / 2), img.width * k, img.height * k);
    }
    if (SE.weather.mode !== 'sunny') SE.weather.draw(ctx, { density: 0.6 });
    // the whole picture, no bars. The chair creaks softly now and then (not every swing), and
    // a sip of cocoa comes only every half a minute or so
    const loop = Math.floor(s.rockT * ROCK_FPS / ROCK_FRAMES);
    if (f === 2 && s.creaked !== loop) { s.creaked = loop; if (Math.random() < 0.3) SE.audio.sfx('rock', { gain: 0.35 + Math.random() * 0.25 }); }
    s.nextSip = s.nextSip == null ? s.rockT + SE.rand(12, 20) : s.nextSip;
    if (f === 9 && s.rockT > s.nextSip) { s.nextSip = s.rockT + SE.rand(25, 50); SE.audio.sfx('sip', { gain: 0.6 }); }
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
      ? [['Chop wood', 62, () => SE.go('woodlot')], ['Shovel snow', 70, shovel], ['Rocking chair', 74, porch], ['Go inside', 58, () => SE.moment('home', { force: true, go: ['hall', { fromOutside: true }] })], ['Wander off', 64, leave]]
      : [];
    // a column on the right, so the woodpile and Waffles stay visible along the bottom
    let y = SE.H - 6 - items.length * 20;
    for (const [label, , cb] of items) { if (SE.button(SE.W - 86, y, 80, 18, label, { alpha: a })) cb(); y += 20; }
  }
  function leave() {
    if (SE.weather.stormy()) { SE.toast('Too stormy to wander. Stay cozy.', '#cfe6ff'); return; }
    SE.moment('leave', { go: ['map', {}] }); // a little cutscene: the door, the snow, Waffles bounding off
  }
  function direct(dt) {
    const d = s.dir;
    if (mode === 'busy' || SE.momentPlaying()) return;
    d.t += dt;
    if (d.t < d.dur) return;
    d.t = 0;
    let next;
    // no rocking chair in a snowstorm: then it's the woodlot
    const opts = SE.weather.stormy() ? ['woodlot'] : ['woodlot', 'porch', 'porch'].filter((m) => m !== d.last);
    next = SE.pick(opts);
    d.last = next;
    if (next === 'shovel') { shovel(); d.dur = 999; return; }
    if (next === 'porch') { porch(); d.dur = 999; return; }
    SE.go('woodlot');
  }
})();
