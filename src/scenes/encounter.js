// Wildlife encounter: out walking, an animal turns up out of nowhere (Waffles notices first). Take a
// photo with the camera (each animal has three special shots you can only get this way), sketch it in
// the notebook, or let it be. A bear is different: only when he is calm can you photograph him or
// write a note; if he is agitated, you and Waffles back away slowly until he loses interest.
'use strict';

(function () {
  const FEET = 242;
  const TRAV = { x: 96 }, DOG = { x: 134 };
  const MARK = 300; // where the animal stops
  // walk/act sprites (shared with Whispering Pines), the three photos, and what goes in the notebook
  const ANIMALS = {
    deer: { name: 'Deer', walk: 'deer_walk', act: 'deer_graze', speed: 16, note: 'A doe, nibbling at the bark of a young pine.',
      shots: ['Eye to eye with a doe in the falling snow.', 'A deer leaping over a snowy log.', 'A doe and her fawn at the edge of the forest.'] },
    elk: { name: 'Elk', walk: 'elk_walk', act: 'elk_graze', speed: 11, note: 'A bull elk, antlers like a winter tree.',
      shots: ['A bull elk, breath steaming in the cold.', 'An elk by the frozen lake at first light.', 'An elk at the edge of the forest at sunrise.'] },
    fox: { name: 'Fox', walk: 'fox_walk', act: 'fox_sniff', speed: 26, note: 'A red fox listening for mice under the snow.',
      shots: ['A fox diving head-first into the snow.', 'A fox curled up asleep, tail over its nose.', 'Snowflakes on a red fox’s fur.'] },
    hare: { name: 'Snowshoe hare', walk: 'hare_hop', act: 'hare_sniff', speed: 22, hops: true, note: 'A snowshoe hare, almost invisible in its white coat.',
      shots: ['A snowshoe hare, ears up, under the pines.', 'A hare bounding across fresh snow.', 'Two hares nose to nose.'] },
    owl: { name: 'Great grey owl', act: 'owl_idle', perch: { x: 336, y: 120 }, note: 'An owl, watching you as closely as you watch it.',
      shots: ['An owl’s golden eyes among the snowy pines.', 'An owl gliding silently over the snow.', 'A close-up of an owl’s round face.'] },
    bird: { name: 'Cardinal', fly: 'bird_fly', act: 'bird_peck', note: 'A bright red cardinal, the only colour in the snow.',
      shots: ['A cardinal in flight, wings spread wide.', 'A cardinal swooping over snowy pine branches.', 'A cardinal on a snowy branch with red berries.'] },
    bear: { name: 'Grizzly bear', walk: 'bear_walk', act: 'bear_idle', angry: 'bear_rear', speed: 12, bear: true, note: 'A grizzly, calm and foraging. Keep your distance.',
      shots: ['A grizzly walking calmly through the pines.', 'A grizzly crossing a snowy clearing, far off.', 'A grizzly among the tall pines.'] },
  };
  SE.WILDLIFE = ANIMALS;
  let s = null;
  const has = (n) => !!(n && SE.anims[n]);

  // the next photo you get of an animal: one you have not taken yet, if there is one
  function nextShot(kind) {
    const album = SE.save.album || (SE.save.album = {});
    const got = album[kind] || (album[kind] = []);
    const missing = [0, 1, 2].filter((i) => !got.includes(i));
    const i = missing.length ? SE.pick(missing) : SE.pick([0, 1, 2]);
    const isNew = !got.includes(i);
    if (isNew) got.push(i);
    SE.persist();
    return { i, isNew };
  }

  SE.addScene('encounter', {
    retreating: () => !!s && s.state === 'retreat',
    enter(p) {
      const kind = ANIMALS[p.animal] ? p.animal : 'deer';
      const A = ANIMALS[kind];
      s = {
        kind, A, from: p.from || 'map', t: 0, state: 'alert', bang: 1.6, ax: SE.W + 30, ay: FEET - 8, animT: 0, mood: 'calm',
        moodT: SE.rand(6, 12), back: 0, photo: null, sketch: null, flash: 0, leaveT: 0, msg: null, huffT: 0,
      };
      if (A.bear) s.mood = Math.random() < 0.55 ? 'calm' : 'agitated';
      if (kind === 'bird') { s.ax = SE.W + 20; s.ay = 90; }
      if (kind === 'owl') { s.ax = SE.W + 20; s.ay = 70; }
      SE.audio.sfx('woof');
      SE.audio.setMusic('outdoors');
    },
    update() {
      SE.audio.setAmbience({ wind: 0.35 + SE.weather.wind / 90, birds: 0.3 * (1 - SE.weather.night()), storm: 0 });
    },
    draw(ctx, dt) {
      s.t += dt; s.animT += dt;
      SE.drawForest(ctx, [[0, 0, 175, 200], [255, 0, 225, 195]]);
      updateAnimal(dt);
      drawAnimal(ctx);
      drawPair(ctx, dt);
      SE.weather.tint(ctx, 0.75 + 0.25 * SE.weather.night()); // a real night out here, not a filter
      SE.moonlight(ctx);
      // after dark he carries the lantern: a small warm circle around the two of them
      const nl = SE.weather.night();
      if (nl > 0.1) {
        const lx = TRAV.x - s.back + 10, ly = FEET - 22, fl = 0.9 + 0.1 * Math.sin(SE.time * 8) * Math.sin(SE.time * 3.3);
        SE.glow(ctx, lx, ly + 10, 64 * fl, '255,180,100', 0.22 * nl);
        SE.glow(ctx, lx, ly, 10 * fl, '255,225,160', 0.5 * nl);
      }
      SE.weather.stars(ctx, 60);
      SE.weather.draw(ctx, { density: 0.5 });
      if (s.flash > 0) { s.flash -= dt * 3; ctx.fillStyle = `rgba(255,255,255,${Math.max(0, s.flash)})`; ctx.fillRect(0, 0, SE.W, SE.H); }
      if (s.state === 'camera') drawViewfinder(ctx);
      if (s.photo) drawPhoto(ctx, dt);
      else if (s.sketch) drawSketch(ctx, dt);
      else drawChoices(ctx);
      if (s.msg) { s.msg.t += dt; if (s.msg.t > 5) s.msg = null; else banner(s.msg.text, s.msg.color); }
      SE.hud.draw(ctx, { watch: false, title: 'A wild encounter', subtitle: A_title() });
    },
  });
  const A_title = () => (s.A.bear ? `${s.A.name} · ${s.mood === 'calm' ? 'calm' : 'agitated!'}` : s.A.name);

  // ------------------------------------------------------------ the animal
  function updateAnimal(dt) {
    const A = s.A;
    if (s.state === 'alert') {
      s.bang -= dt;
      if (s.bang <= 0) s.state = 'enter';
      return;
    }
    if (s.state === 'enter') {
      if (A.perch) { const k = Math.min(1, s.animT / 2.2); s.ax = SE.lerp(SE.W + 20, A.perch.x, SE.ease(k)); s.ay = SE.lerp(60, A.perch.y, SE.ease(k)); if (k >= 1) arrive(); return; }
      if (s.kind === 'bird') { const k = Math.min(1, s.animT / 2); s.ax = SE.lerp(SE.W + 20, MARK, SE.ease(k)); s.ay = SE.lerp(90, FEET - 6, SE.ease(k)) - Math.sin(k * Math.PI) * 20; if (k >= 1) arrive(); return; }
      // they trot in briskly, then slow to a stop at their spot
      let v = A.speed * 2.6 * SE.clamp((s.ax - MARK) / 60, 0.35, 1);
      if (A.hops) v = (s.animT % 1.2) < 0.55 ? A.speed * 2.6 : 0;
      s.ax -= v * dt;
      if (s.ax <= MARK) arrive();
      return;
    }
    if (s.state === 'leave') {
      s.leaveT += dt;
      if (A.perch || s.kind === 'bird') { s.ax += 60 * dt; s.ay -= 30 * dt; }
      else s.ax += (A.hops && (s.animT % 1.2) >= 0.55 ? 0 : (A.speed || 20) * (A.hops ? 1.8 : 1.2)) * dt;
      if (s.leaveT > 4.5) goBack();
      return;
    }
    // a bear's mood can change while you stand there
    if (A.bear && s.state !== 'retreat') {
      s.moodT -= dt;
      if (s.moodT <= 0) { s.moodT = SE.rand(8, 14); if (s.mood === 'calm' && Math.random() < 0.3) agitate(); }
    }
  }
  function arrive() { s.state = 'meet'; s.animT = 0; }
  function agitate() {
    s.mood = 'agitated';
    s.state = 'meet';
    s.animT = 0;
    SE.audio.sfx('woof');
    s.msg = { text: `The bear rises up and huffs. Back away slowly — ${SE.touch && SE.touch.on ? 'hold the button' : 'hold ← or A'}.`, color: '#ffb3a3', t: 0 };
  }
  function drawAnimal(ctx) {
    const A = s.A;
    if (s.state === 'alert') return;
    const walking = s.state === 'enter' || s.state === 'leave';
    let anim = walking ? (A.walk || A.fly) : A.act;
    if (A.bear && s.mood === 'agitated' && !walking && has(A.angry)) anim = A.angry;
    if (s.kind === 'bird') anim = walking ? A.fly : A.act;
    if (s.kind === 'owl') anim = A.act;
    const flip = !(s.state === 'leave'); // the sprites face right; they come in from the right
    if (!has(anim)) {
      SE.drawActorFallback(ctx, s.ax, (A.perch ? s.ay : FEET) - 30, A.bear ? '#5a3a24' : '#9a6a44', true);
      return;
    }
    const sz = SE.animSize(anim), n = SE.anims[anim].frames;
    let frame;
    if (walking) frame = A.hops ? ((s.animT % 1.2) < 0.55 ? Math.floor(((s.animT % 1.2) / 0.55) * n) % n : 0) : Math.floor(s.animT * 9) % n;
    else { const f = Math.floor(s.animT * 3); frame = f < n - 2 ? f : n - 3 + (Math.floor(s.animT * 2.5) % 2); }
    if (A.bear && s.mood === 'agitated' && !walking) frame = Math.min(n - 1, Math.floor(s.animT * 6));
    if (A.perch || s.kind === 'bird') { SE.drawAnim(anim, s.ax - sz.w / 2, s.ay - sz.h, 0, { frame, flip: s.kind === 'bird' ? s.state !== 'leave' : false }); return; }
    ctx.fillStyle = 'rgba(70,90,140,0.25)';
    ctx.fillRect(Math.round(s.ax + 4), FEET - 1, Math.round(sz.w - 8), 2);
    SE.drawAnim(anim, s.ax, FEET - sz.h, 0, { frame, flip });
  }

  // ------------------------------------------------------------ the traveler and Waffles
  function drawPair(ctx, dt) {
    // backing away from an agitated bear: hold ← / A, and do not rush it
    if (s.state === 'retreat') {
      const left = SE.held('ArrowLeft', 'KeyA'), rush = SE.held('ShiftLeft', 'ShiftRight');
      s.huffT -= dt;
      if (left && !rush) { s.back += 14 * dt; s.walkT = (s.walkT || 0) + dt; }
      if (left && rush && s.huffT <= 0) { s.huffT = 3; SE.audio.sfx('woof'); s.msg = { text: 'Slowly… never run from a bear.', color: '#ffb3a3', t: 0 }; }
      if (s.back > 80) {
        s.state = 'leave'; s.leaveT = 0; s.animT = 0; s.mood = 'calm';
        SE.save.bears = (SE.save.bears || 0) + 1; SE.persist();
        s.msg = { text: 'You back away slowly. The bear loses interest and lumbers off into the pines.', color: '#ffe6b8', t: 0 };
      }
    }
    const bx = -s.back + (s.state === 'retreat' ? 0 : SE.weather.shiver(0));
    const walkA = SE.anims.trav_walk_e ? 'trav_walk_e' : null;
    const moving = s.state === 'retreat' && SE.held('ArrowLeft', 'KeyA') && !SE.held('ShiftLeft', 'ShiftRight');
    const tA = moving && walkA ? walkA : SE.anims.trav_pray ? 'trav_pray' : null;
    if (tA) {
      const sz = SE.animSize(tA), n = SE.anims[tA].frames;
      // walking backwards, still facing the bear: the walk cycle played in reverse
      const frame = tA === walkA ? (n - 1 - (Math.floor((s.walkT || 0) * 6) % n)) : 0;
      ctx.fillStyle = 'rgba(40,46,90,0.25)';
      ctx.beginPath(); ctx.ellipse(TRAV.x + bx, FEET, 10, 2, 0, 0, Math.PI * 2); ctx.fill();
      SE.drawAnim(tA, Math.round(TRAV.x + bx - sz.w / 2), FEET - sz.h, 0, { frame });
    } else SE.drawActorFallback(ctx, TRAV.x + bx - 7, FEET - 36, '#8a5a34');
    // Waffles is not at ease: he heard something he does not know. He stands right by your side,
    // low and tense, head stretched toward it, sniffing — until the animal is gone again.
    const wary = s.state !== 'leave' || s.mood === 'agitated';
    const dA = moving && has('dog_walk') ? 'dog_walk' : wary && has('dog_cautious') ? 'dog_cautious' : 'dog_sit';
    if (has(dA)) {
      const sz = SE.animSize(dA), n = SE.anims[dA].frames;
      let frame = dA === 'dog_walk' ? (n - 1 - (Math.floor((s.walkT || 0) * 8) % n)) : Math.floor(SE.time * 3) % Math.min(3, n);
      if (dA === 'dog_cautious') {
        // lower the head and lean in over the first moments, then hold there, sniffing now and then
        const t = s.t * 5, hold = n - 4;
        frame = t < hold ? Math.floor(t) : hold + Math.floor((Math.sin(s.t * 1.7) * 0.5 + 0.5) * 3.99);
        if (s.mood === 'agitated') frame = Math.min(frame, 3) + (Math.floor(SE.time * 8) % 2); // bristling, uneasy
      }
      SE.drawAnim(dA, Math.round(DOG.x + bx - sz.w / 2), FEET - sz.h + 2, 0, { frame });
      // Waffles notices first: a bouncing "!" over his head
      if (s.state === 'alert' || s.t < 2.4) drawBang(ctx, DOG.x + bx, FEET - sz.h - 6, s.t);
    }
  }
  SE.drawBang = (ctx, x, y, t) => drawBang(ctx, x, y, t);
  function drawBang(ctx, x, y, t) {
    const bob = Math.round(Math.abs(Math.sin(t * 9)) * -3 * Math.max(0, 1 - t / 1.2));
    x = Math.round(x); y = Math.round(y + bob);
    ctx.fillStyle = '#2a2236'; ctx.fillRect(x - 5, y - 15, 11, 14); ctx.fillRect(x - 6, y - 14, 13, 12);
    ctx.fillStyle = '#fff7ea'; ctx.fillRect(x - 4, y - 14, 9, 12); ctx.fillRect(x - 5, y - 13, 11, 10);
    ctx.fillStyle = '#2a2236'; ctx.fillRect(x - 1, y - 1, 3, 3);
    ctx.fillStyle = '#fff7ea'; ctx.fillRect(x, y - 1, 1, 2);
    ctx.fillStyle = '#e04848'; ctx.fillRect(x - 1, y - 12, 3, 6); ctx.fillRect(x - 1, y - 5, 3, 2);
  }

  // ------------------------------------------------------------ choices: camera, notebook, let it be
  function drawChoices() {
    if (s.state !== 'meet') return;
    const A = s.A, by = SE.H - 24;
    if (A.bear && s.mood === 'agitated') {
      s.state = 'retreat'; s.back = 0;
      if (!s.msg) s.msg = { text: `The bear is agitated. Back away slowly — ${SE.touch && SE.touch.on ? 'hold the button' : 'hold ← or A (no rushing)'}.`, color: '#ffb3a3', t: 0 };
      return;
    }
    const items = [
      ['Take a photo', 84, () => { s.state = 'camera'; }, 'cam'],
      [A.bear ? 'Note it down' : 'Sketch it', 76, () => startSketch(), 'book'],
      [A.bear ? 'Back away' : 'Let it be', 66, () => (A.bear ? (s.state = 'retreat', s.back = 0) : leave()), null],
    ];
    let x = SE.W - 6 - items.reduce((t, i) => t + i[1] + 4, 0);
    for (const [label, w, cb, icon] of items) { if (SE.button(x, by, w, 18, label, { icon })) cb(); x += w + 4; }
  }
  function leave() { s.state = 'leave'; s.leaveT = 0; s.animT = 0; }
  function goBack() {
    if (s.from === 'trail') SE.go('trail', {});
    else SE.go('map', { resume: true });
  }

  function drawViewfinder(ctx) {
    // corner brackets, a focus box on the animal and a shutter hint
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, SE.W, 22); ctx.fillRect(0, SE.H - 22, SE.W, 22);
    ctx.fillStyle = '#fff7ea';
    const L = 14, m = 30;
    for (const [x, y, dx, dy] of [[m, m, 1, 1], [SE.W - m, m, -1, 1], [m, SE.H - m, 1, -1], [SE.W - m, SE.H - m, -1, -1]]) {
      ctx.fillRect(x, y, dx * L, dy); ctx.fillRect(x, y, dx, dy * L);
    }
    const fx = s.A.perch || s.kind === 'bird' ? s.ax : s.ax + 24, fy = s.A.perch || s.kind === 'bird' ? s.ay - 10 : FEET - 22;
    ctx.strokeStyle = 'rgba(255,209,102,0.9)'; ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(fx - 22) + 0.5, Math.round(fy - 16) + 0.5, 44, 32);
    ctx.fillStyle = '#e04848'; ctx.fillRect(SE.W - 48, 28, 4, 4);
    SE.text('REC', SE.W - 42, 27, { size: 6, color: '#fff7ea' });
    SE.text('Click or press Space to take the photo · Esc to lower the camera', SE.W / 2, SE.H - 16, { align: 'center', size: 7, color: '#fff7ea' });
    if (SE.key('Escape')) { s.state = 'meet'; return; }
    if (!SE.modal && (SE.mouse.released || SE.key('Space'))) {
      SE.mouse.released = false;
      SE.audio.sfx('camera');
      s.flash = 1;
      const shot = nextShot(s.kind);
      s.photo = { ...shot, t: 0 };
      // the click of the shutter can unsettle a bear
      if (s.A.bear && Math.random() < 0.25) s.photo.spooks = true;
    }
  }
  function drawPhoto(ctx, dt) {
    const p = s.photo;
    p.t += dt;
    const img = SE.img(`photo/${s.kind}_${p.i}`);
    const w = 256, h = 192, x = SE.W / 2 - w / 2 - 4, y = 26;
    const pop = Math.min(1, p.t * 4);
    ctx.save(); ctx.globalAlpha = pop;
    // a white print with a thick bottom edge, like an instant photo
    ctx.fillStyle = 'rgba(20,14,30,0.5)'; ctx.fillRect(x + 4, y + 6, w + 16, h + 40);
    ctx.fillStyle = '#fbf6ec'; ctx.fillRect(x - 2, y, w + 16, h + 36);
    if (img) { ctx.imageSmoothingEnabled = false; ctx.drawImage(img, x + 6, y + 6, w, h); }
    else { ctx.fillStyle = '#9fb0c8'; ctx.fillRect(x + 6, y + 6, w, h); }
    ctx.restore();
    SE.text(s.A.shots[p.i], SE.W / 2, y + h + 12, { align: 'center', size: 8, color: '#3a2a2a', shadow: false, alpha: pop });
    if (p.t > 0.4 && p.isNew && !p.cheered) { p.cheered = true; SE.celebrate('New photo!', `${s.A.name} · ${(SE.save.album[s.kind] || []).length}/3 in your album`, { y: 2 }); }
    if (SE.button(SE.W / 2 - 44, SE.H - 24, 88, 18, p.spooks ? 'Uh oh…' : 'Lovely', { icon: 'heart' }) || (p.t > 0.6 && SE.key('Space'))) {
      const spooks = p.spooks;
      s.photo = null;
      if (spooks) agitate();
      else if (s.A.bear) s.state = 'meet';
      else leave();
    }
  }
  function startSketch() {
    s.sketch = { t: 0 };
    SE.save.sketches = SE.save.sketches || {};
    SE.save.sketches[s.kind] = (SE.save.sketches[s.kind] || 0) + 1;
    SE.persist();
  }
  function drawSketch(ctx, dt) {
    const k = s.sketch;
    k.t += dt;
    const w = 220, h = 150, x = SE.W / 2 - w / 2, y = 36;
    ctx.fillStyle = 'rgba(20,14,30,0.5)'; ctx.fillRect(x + 4, y + 5, w, h);
    ctx.fillStyle = '#f4ead2'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(120,150,190,0.35)';
    for (let ly = y + 18; ly < y + h - 6; ly += 10) ctx.fillRect(x + 8, ly, w - 16, 1);
    ctx.fillStyle = '#c96b5b'; ctx.fillRect(x + 22, y, 1, h);
    // the animal, drawn in pencil: its sprite as a soft grey silhouette that fills in as you sketch
    const anim = s.A.act || s.A.walk;
    if (has(anim)) {
      const sz = SE.animSize(anim);
      const sc = Math.min(2, Math.floor(120 / Math.max(sz.w, sz.h)) || 1);
      ctx.save(); ctx.globalAlpha = Math.min(1, k.t / 1.5) * 0.75; ctx.filter = 'grayscale(1) sepia(0.6) contrast(1.3)';
      SE.drawAnim(anim, x + w / 2 - (sz.w * sc) / 2, y + h / 2 - (sz.h * sc) / 2 - 6, 0, { frame: 0, scale: sc, alpha: Math.min(1, k.t / 1.5) * 0.75 });
      ctx.restore();
    }
    SE.text(s.A.note, x + w / 2, y + h - 18, { align: 'center', size: 7, color: '#4a3a32', shadow: false });
    if (k.t < 1.5 && Math.random() < 0.4) SE.audio.sfx('click');
    if (k.t > 1.5 && SE.button(SE.W / 2 - 40, SE.H - 24, 80, 18, 'Close notebook') ) { s.sketch = null; if (s.A.bear) s.state = 'meet'; else leave(); }
  }
  function banner(text, color) {
    const w = SE.measure(text, 8) + 16;
    SE.panel(SE.W / 2 - w / 2, 30, w, 16, { alpha: 0.9 });
    SE.text(text, SE.W / 2, 34, { align: 'center', size: 8, color: color || '#fff7ea' });
  }

  // ------------------------------------------------------------ which animal turns up
  // encounters stay rare: at least ENC_GAP seconds of play between any two, wherever you walk
  const ENC_GAP = 300;
  SE.encounterReady = () => SE.time - (SE._lastEncounter != null ? SE._lastEncounter : -1e9) > ENC_GAP;
  SE.pickEncounter = function () {
    SE._lastEncounter = SE.time;
    const night = SE.weather.night() > 0.6;
    const pool = night ? [['owl', 4], ['fox', 2], ['hare', 2]] : [['deer', 4], ['fox', 3], ['hare', 3], ['bird', 3], ['elk', 1.5], ['bear', 1]];
    let r = Math.random() * pool.reduce((t, p) => t + p[1], 0);
    for (const [k, w] of pool) { r -= w; if (r <= 0) return k; }
    return pool[0][0];
  };
})();
