// Whispering Pines: lie low with Waffles and watch the wildlife — deer and a big elk grazing, a fox
// sniffing and pouncing in the snow, a snowshoe hare, cardinals that flit up into the trees, and a
// snowy owl at night. Sketch them for the journal.
'use strict';

(function () {
  // each species: its animations and how it moves. `acts` are the things it does while it stays.
  const SPECIES = {
    deer: { walk: 'deer_walk', acts: ['deer_graze'], speed: 14, weight: 4, name: 'deer' },
    elk: { walk: 'elk_walk', acts: ['elk_graze'], speed: 10, weight: 1.4, name: 'elk' },
    fox: { walk: 'fox_walk', acts: ['fox_sniff', 'fox_pounce', 'fox_sniff'], speed: 26, weight: 2, name: 'fox' },
    hare: { walk: 'hare_hop', acts: ['hare_sniff'], speed: 22, weight: 2.4, name: 'hare', hops: true },
  };
  const LABELS = { deer: 'a doe in the pines', elk: 'a mighty elk', fox: 'a curious fox', hare: 'a snowshoe hare', owl: 'a snowy owl at night', bird: 'a little cardinal' };
  const OWL = { x: 404, y: 62 };
  // branches the cardinals like to land on
  const PERCHES = [[58, 108], [112, 84], [86, 148], [392, 96], [436, 132], [368, 150]];
  let s = null;
  const photo = document.createElement('canvas');

  const has = (n) => !!SE.anims[n];
  function pickSpecies() {
    const opts = Object.entries(SPECIES).filter(([k]) => !(k === 'elk' && s.animals.some((a) => a.kind === 'elk')));
    const total = opts.reduce((t, [, v]) => t + v.weight, 0);
    let r = Math.random() * total;
    for (const [k, v] of opts) { r -= v.weight; if (r <= 0) return k; }
    return 'deer';
  }
  function spawn(kind) {
    kind = kind || pickSpecies();
    const fromLeft = Math.random() < 0.5;
    const w = SE.animSize(SPECIES[kind].walk).w || 40;
    s.animals.push({
      kind, x: fromLeft ? -w - 4 : SE.W + 4, y: kind === 'elk' ? SE.rand(206, 214) : SE.rand(214, 238), dir: fromLeft ? 1 : -1,
      state: 'walk', t: 0, target: SE.rand(110, 350), stay: SE.rand(35, 75), age: 0, hopT: 0, act: null, actI: 0,
    });
  }
  function newBird(i) {
    return { x: SE.rand(150, 330), y: SE.rand(226, 248), state: 'ground', t: Math.random() * 5, hop: 0, flip: Math.random() < 0.5, from: null, to: null, rest: SE.rand(8, 20), i };
  }

  SE.addScene('forest', {
    enter(p) {
      SE.save.location = 'forest';
      SE.save.sketches = SE.save.sketches || {};
      SE.persist();
      s = { t: 0, animals: [], spawnT: 1.5, sketch: false, flash: 0, polaroid: null, motes: [], birds: [0, 1, 2].map(newBird), tip: SE.save.deerPhotos === 0 };
      SE.audio.setMusic('outdoors');
      if (p.arrived) SE.toast('Shh… Waffles lies low in the snow with you.', '#cfe6ff');
    },
    update(dt) {
      SE.weather.stormCheck();
      SE.audio.setAmbience({ wind: 0.2 + SE.weather.wind / 100, birds: 1 - SE.weather.night(), storm: SE.weather.stormy() ? 0.8 : 0 });
    },
    draw(ctx, dt) {
      s.t += dt;
      SE.drawForest(ctx, [[0, 0, 175, 200], [255, 0, 225, 195]]);
      // drifting light motes in the sun rays
      if (SE.weather.night() < 0.5 && Math.random() < dt * 6) s.motes.push({ x: SE.rand(150, 330), y: SE.rand(10, 160), t: 0, life: SE.rand(3, 6) });
      for (let i = s.motes.length - 1; i >= 0; i--) {
        const m = s.motes[i]; m.t += dt;
        if (m.t > m.life) { s.motes.splice(i, 1); continue; }
        m.x += Math.sin(m.t + i) * 3 * dt; m.y += 4 * dt;
        ctx.fillStyle = `rgba(255,246,210,${0.6 * Math.sin((m.t / m.life) * Math.PI)})`;
        ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
      }

      // the owl comes out at dusk and night: blinks, turns its head, ruffles
      const owlA = SE.clamp((SE.weather.night() - 0.3) * 2, 0, 1);
      if (owlA > 0) {
        ctx.save(); ctx.globalAlpha = owlA;
        if (has('owl_idle')) SE.drawAnim('owl_idle', OWL.x, OWL.y, s.t * 0.8, { pingpong: true });
        else SE.drawImg('owl', OWL.x, OWL.y);
        ctx.restore();
      }

      // wildlife comes and goes
      s.spawnT -= dt;
      const maxAnimals = SE.weather.night() > 0.6 ? 1 : 3;
      if (s.spawnT <= 0 && s.animals.length < maxAnimals && !SE.weather.stormy()) { spawn(); s.spawnT = SE.rand(10, 24) * (1 + SE.weather.night()); }
      for (let i = s.animals.length - 1; i >= 0; i--) if (updateAnimal(s.animals[i], dt)) s.animals.splice(i, 1);
      const scene = s.animals.map((a) => ({ y: a.y, draw: () => drawAnimal(ctx, a) }));
      if (SE.weather.night() < 0.55) for (const b of s.birds) { updateBird(b, dt); scene.push({ y: b.state === 'ground' ? b.y : 0, draw: () => drawBird(b) }); }
      scene.sort((a, b) => a.y - b.y).forEach((o) => o.draw());

      SE.weather.tint(ctx, 0.9 + 0.1 * SE.weather.night());
      SE.moonlight(ctx);
      if (SE.forestDim() < 0.5) SE.weather.sunshine(ctx, 190);
      SE.weather.draw(ctx, { density: 0.8 });

      // Waffles lying low in the snow in the foreground, watching too
      SE.drawDogRest(10 + SE.weather.shiver(1), SE.H + 4, { seed: 3 });

      sketchLogic(ctx, dt);
      if (s.flash > 0) {
        s.flash -= dt * 3;
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, s.flash)})`;
        ctx.fillRect(0, 0, SE.W, SE.H);
      }
      if (s.polaroid) drawPolaroid(ctx, dt);

      const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
      if (!SE.watching() && SE.button(SE.W - 96, SE.H - 24, 90, 18, s.sketch ? 'Put it away' : 'Sketchbook', { alpha: s.sketch ? 1 : a, active: s.sketch, icon: 'cam' })) s.sketch = !s.sketch;
      if (s.tip && s.t < 14 && !SE.watching()) SE.text(s.animals.length ? 'Open the sketchbook and click an animal while it holds still' : 'Wait quietly… the animals will come', 8, SE.H - 40, { size: 7, color: '#ffe6b8', alpha: Math.min(1, 14 - s.t) * a });
      const total = Object.values(SE.save.sketches || {}).reduce((x, y) => x + y, 0);
      SE.hud.draw(ctx, { title: 'Whispering Pines', subtitle: `wildlife sketched: ${total}`, map: true });
    },
  });

  // ------------------------------------------------------------ animals: walk in, do their thing, look up, wander off
  function updateAnimal(a, dt) {
    const sp = SPECIES[a.kind];
    a.t += dt; a.age += dt;
    if (a.state === 'walk') {
      let move = sp.speed;
      if (sp.hops) { a.hopT += dt; move = (a.hopT % 1.2) < 0.55 ? sp.speed * 1.8 : 0; } // hop, pause, hop
      a.x += a.dir * move * dt;
      if (a.leaving) { if (a.x < -110 || a.x > SE.W + 20) return true; }
      else if ((a.dir > 0 && a.x >= a.target) || (a.dir < 0 && a.x <= a.target)) startAct(a);
    } else if (a.state === 'act') {
      const n = has(a.act) ? SE.anims[a.act].frames : 8;
      if (a.t > Math.max(a.dur, n / 6)) { a.state = 'look'; a.t = 0; a.dur = SE.rand(2.5, 4.5); }
    } else if (a.state === 'look') {
      if (a.t > a.dur) {
        a.t = 0;
        if (a.age > a.stay) { a.state = 'walk'; a.leaving = true; a.dir = a.x > SE.W / 2 ? 1 : -1; }
        else if (Math.random() < 0.35) { a.state = 'walk'; a.target = SE.clamp(a.x + SE.rand(-90, 90), 90, 370); a.dir = a.target > a.x ? 1 : -1; }
        else startAct(a);
      }
    }
    return false;
  }
  function startAct(a) {
    const sp = SPECIES[a.kind];
    a.act = sp.acts[a.actI++ % sp.acts.length];
    a.state = 'act'; a.t = 0; a.dur = SE.rand(3, 6);
    if (a.act === 'fox_pounce') { a.dur = 1.6; scareBirds(a.x); }
  }
  function animalBox(a) {
    const sp = SPECIES[a.kind];
    const sz0 = SE.animSize(a.state === 'walk' ? sp.walk : a.act || sp.walk);
    const sz = sz0.w ? sz0 : { w: 30, h: 24 };
    return { x: a.x, y: a.y - sz.h, w: sz.w, h: sz.h };
  }
  function drawAnimal(ctx, a) {
    const sp = SPECIES[a.kind];
    const anim = a.state === 'walk' ? sp.walk : (has(a.act) ? a.act : sp.walk);
    if (!has(anim)) { SE.drawActorFallback(ctx, a.x, a.y - 24, '#9a6a44', true); return; }
    const sz = SE.animSize(anim), n = SE.anims[anim].frames;
    ctx.fillStyle = 'rgba(80,100,150,0.25)';
    ctx.fillRect(Math.round(a.x + 4), Math.round(a.y - 2), Math.round(sz.w - 8), 2);
    let frame;
    if (a.state === 'walk') frame = sp.hops ? ((a.hopT % 1.2) < 0.55 ? Math.floor(((a.hopT % 1.2) / 0.55) * n) % n : 0) : Math.floor(a.t * 9) % n;
    else if (a.state === 'look') frame = 0; // head up, alert
    else if (a.act === 'fox_pounce') frame = Math.min(n - 1, Math.floor(a.t * 6));
    else {
      // grazing / sniffing: play through, then linger on the head-down frames
      const f = Math.floor(a.t * 3);
      frame = f < n - 2 ? f : n - 3 + (Math.floor(a.t * 2.5) % 2);
    }
    SE.drawAnim(anim, a.x, a.y - sz.h, 0, { frame, flip: a.dir < 0 });
    if (stillFor(a) && s.sketch) {
      const b = animalBox(a);
      SE.text('holding still!', b.x + b.w / 2, b.y - 9, { align: 'center', size: 6, color: '#ffd166' });
    }
  }
  const stillFor = (a) => a.state === 'look' || (a.state === 'act' && a.act !== 'fox_pounce' && a.kind !== 'deer' && a.kind !== 'elk');

  // ------------------------------------------------------------ cardinals: peck & hop, flit up into the trees, come back down
  function scareBirds(x) {
    for (const b of s.birds) if (b.state === 'ground' && Math.abs(b.x - x) < 120) flyTo(b, SE.pick(PERCHES));
  }
  function flyTo(b, [x, y]) {
    b.state = 'fly'; b.t = 0; b.from = [b.x, b.y]; b.to = [x, y]; b.flip = x < b.x; b.dur = Math.max(1.2, Math.hypot(x - b.x, y - b.y) / 90);
  }
  function updateBird(b, dt) {
    b.t += dt;
    if (b.state === 'ground') {
      if (b.hop <= 0 && Math.random() < dt * 0.4) { b.hop = 0.35; b.x = SE.clamp(b.x + (b.flip ? -1 : 1) * SE.rand(3, 8), 120, 360); if (Math.random() < 0.3) b.flip = !b.flip; }
      b.hop -= dt;
      for (const a of s.animals) if (a.state === 'walk' && Math.abs(a.x + 20 - b.x) < 40) flyTo(b, SE.pick(PERCHES));
      if (b.t > b.rest) flyTo(b, SE.pick(PERCHES));
    } else if (b.state === 'fly') {
      const k = Math.min(1, b.t / b.dur), arc = Math.sin(k * Math.PI) * -30;
      b.x = SE.lerp(b.from[0], b.to[0], k); b.y = SE.lerp(b.from[1], b.to[1], k) + arc;
      if (k >= 1) { b.state = b.to[1] > 200 ? 'ground' : 'perch'; b.t = 0; b.rest = SE.rand(8, 22); }
    } else if (b.state === 'perch' && b.t > b.rest) {
      flyTo(b, [SE.rand(150, 330), SE.rand(226, 248)]);
    }
  }
  function drawBird(b) {
    if (b.state === 'fly' && has('bird_fly')) { SE.drawAnim('bird_fly', b.x - 10, b.y - 14, b.t * 1.4, { flip: b.flip }); return; }
    if (has('bird_peck')) {
      const pecking = b.state === 'ground' && b.hop <= 0;
      const lift = b.hop > 0 ? Math.sin((b.hop / 0.35) * Math.PI) * 3 : 0;
      SE.drawAnim('bird_peck', b.x - 10, b.y - 18 - lift, pecking ? b.t * 1.1 : 0, { flip: b.flip, frame: pecking ? undefined : 0 });
      return;
    }
    if (SE.img('bird')) SE.drawImg('bird', b.x - 10, b.y - 18, { flip: b.flip });
  }

  // ------------------------------------------------------------ sketching
  function sketchLogic(ctx, dt) {
    // watch mode: the traveler sketches by himself when an animal holds still
    if (SE.watching()) {
      s.autoCd = (s.autoCd == null ? 3 : s.autoCd) - dt;
      if (!s.aim && s.autoCd <= 0) { const a = s.animals.find((x) => stillFor(x) && x.t < (x.dur || 3) - 1.2); if (a) s.aim = { a, t: 0 }; }
      if (!s.aim && s.autoCd <= 0 && SE.weather.night() > 0.6 && Math.random() < dt * 0.1) s.aim = { owl: true, t: 0 };
      if (s.aim) {
        const b = s.aim.owl ? { x: OWL.x, y: OWL.y, w: 32, h: 32 } : animalBox(s.aim.a);
        s.aim.t += dt;
        const ax = b.x + b.w / 2, ay = b.y + b.h / 2;
        if (s.aim.t > 1) {
          if (s.aim.owl) takeSketch(ax, ay, 64, 48, 'owl');
          else if (stillFor(s.aim.a) && s.animals.includes(s.aim.a)) takeSketch(ax, ay, 64, 48, s.aim.a.kind);
          s.aim = null; s.autoCd = SE.rand(10, 22);
        } else {
          ctx.strokeStyle = `rgba(255,247,234,${Math.min(1, s.aim.t * 3)})`; ctx.lineWidth = 1;
          ctx.strokeRect(Math.round(ax - 32) + 0.5, Math.round(ay - 24) + 0.5, 64, 48);
        }
      }
      return;
    }
    if (!s.sketch || SE.modal) return;
    const mx = SE.mouse.x, my = SE.mouse.y, fw = 64, fh = 48;
    if (SE.mouse.released && my < SE.H - 30 && my > 30) {
      SE.mouse.released = false;
      const hit = s.animals.find((a) => SE.inRect(mx, my, animalBox(a)));
      const owlHit = SE.weather.night() > 0.5 && SE.inRect(mx, my, { x: OWL.x, y: OWL.y, w: 32, h: 32 });
      const bird = s.birds.find((b) => SE.weather.night() < 0.55 && b.state !== 'fly' && Math.hypot(b.x - mx, b.y - 10 - my) < 12);
      if (owlHit) takeSketch(mx, my, fw, fh, 'owl');
      else if (bird) takeSketch(mx, my, fw, fh, 'bird');
      else if (!hit) SE.toast('Only snow and trees in that frame.', '#cfe6ff');
      else if (!stillFor(hit)) SE.toast(`The ${SPECIES[hit.kind].name} is busy — wait until it holds still.`, '#cfe6ff');
      else takeSketch(mx, my, fw, fh, hit.kind);
    }
    ctx.strokeStyle = 'rgba(255,247,234,0.9)'; ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(mx - fw / 2) + 0.5, Math.round(my - fh / 2) + 0.5, fw, fh);
    ctx.fillStyle = 'rgba(255,247,234,0.9)';
    ctx.fillRect(Math.round(mx) - 2, Math.round(my), 5, 1); ctx.fillRect(Math.round(mx), Math.round(my) - 2, 1, 5);
    SE.cursor = 'none';
  }

  function takeSketch(mx, my, fw, fh, kind) {
    SE.audio.sfx('camera');
    s.flash = 0.9;
    // capture what is on screen right now as a polaroid
    photo.width = fw * 2; photo.height = fh * 2;
    const p = photo.getContext('2d');
    p.imageSmoothingEnabled = false;
    const sc = SE.scale;
    p.drawImage(SE.canvas, (mx - fw / 2) * sc, (my - fh / 2) * sc, fw * sc, fh * sc, 0, 0, fw * 2, fh * 2);
    p.globalCompositeOperation = 'color';
    p.fillStyle = 'rgba(180,150,120,0.35)';
    p.fillRect(0, 0, photo.width, photo.height);
    s.polaroid = { t: 0, label: LABELS[kind] || kind };
    const first = !SE.save.sketches[kind];
    SE.save.sketches[kind] = (SE.save.sketches[kind] || 0) + 1;
    if (kind === 'deer') SE.save.deerPhotos++;
    SE.save.photos.push({ kind, t: Date.now() });
    if (SE.save.photos.length > 30) SE.save.photos.shift();
    SE.persist();
    setTimeout(() => {
      if (SE.sceneName === 'forest') SE.celebrate(first ? 'New animal sketched!' : 'Lovely sketch!', `${LABELS[kind]} for the journal. ${SE.pick(SE.PROPS)}`, { y: 190 });
    }, 350);
  }
  function drawPolaroid(ctx, dt) {
    const p = s.polaroid;
    p.t += dt;
    const life = 4.5;
    const slide = Math.min(1, p.t * 3) - Math.max(0, (p.t - life + 0.4) * 3);
    const x = SE.W - 150 + (1 - slide) * 160, y = 50;
    ctx.save();
    ctx.translate(x + 70, y + 60);
    ctx.rotate(-0.05);
    ctx.fillStyle = 'rgba(20,14,30,0.4)'; ctx.fillRect(-66, -54, 136, 120);
    ctx.fillStyle = '#fbf6ec'; ctx.fillRect(-68, -56, 136, 120);
    ctx.drawImage(photo, -62, -50, 124, 92);
    ctx.restore();
    SE.text(p.label, x + 70, y + 108, { align: 'center', size: 7, color: '#5a4a5a', shadow: false });
    if (p.t > life) s.polaroid = null;
  }
})();
