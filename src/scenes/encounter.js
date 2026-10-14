// Wildlife encounter, told in stills (no animation): Waffles notices something, a dark pause while
// you both listen ("Something in the woods got Waffles' attention…"), then the animal is revealed.
// Over that picture you choose: take a photo (a cutscene of the camera, then the print: each animal
// has three shots you can only get this way), note it down in the notebook (the pencil, then the
// page), or let it be. A bear may be agitated: then there is only one choice, backing away slowly.
'use strict';

(function () {
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
    bear: { name: 'Grizzly bear', walk: 'bear_walk', act: 'bear_idle', angry: 'bear_bluff', sniff: 'bear_sniff', speed: 12, bear: true, note: 'A grizzly, calm and foraging. Keep your distance.',
      shots: ['A grizzly walking calmly through the pines.', 'A grizzly crossing a snowy clearing, far off.', 'A grizzly among the tall pines.'] },
  };
  const REVEAL = {"deer": "A doe steps out between the pines.", "elk": "A bull elk. Antlers like a winter tree.", "fox": "A red fox, listening to the snow.", "hare": "A snowshoe hare — almost invisible.", "owl": "Two golden eyes in the branches. An owl.", "bird": "A flash of red: a cardinal.", "bear": "A grizzly. Calm, for now. Keep your distance."};
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
    retreating: () => false,
    enter(p) {
      const kind = ANIMALS[p.animal] ? p.animal : 'deer';
      const A = ANIMALS[kind];
      s = { kind, A, from: p.from || 'map', state: 'intro', mood: 'calm', photo: null, sketch: null, flash: 0, msg: null, t: 0 };
      if (A.bear && Math.random() < 0.4) s.mood = 'agitated';
      SE.audio.setMusic('outdoors');
      SE.moment(`see_${kind}`, { force: true, then: () => {
        if (A.bear && s.mood === 'agitated') agitate(); else s.state = 'meet';
      } });
    },
    update() {
      SE.audio.setAmbience({ wind: 0.35 + SE.weather.wind / 90, birds: 0.3 * (1 - SE.weather.night()), storm: SE.weather.stormy() ? 0.6 : 0 });
    },
    draw(ctx, dt) {
      s.t += dt;
      // the revealed animal stays on screen (in this weather and light) while you decide
      SE.drawStill(ctx, s.mood === 'agitated' ? 'cut/see_bear_angry' : `cut/see_${s.kind}`);
      if (s.flash > 0) { s.flash -= dt * 3; ctx.fillStyle = `rgba(255,255,255,${Math.max(0, s.flash)})`; ctx.fillRect(0, 0, SE.W, SE.H); }
      if (s.photo) drawPhoto(ctx, dt);
      else if (s.sketch) drawSketch(ctx, dt);
      else drawChoices(ctx);
      if (s.msg) { s.msg.t += dt; if (s.msg.t > 5) s.msg = null; else banner(s.msg.text, s.msg.color); }
      SE.hud.draw(ctx, { watch: false, title: 'A wild encounter', subtitle: s.A.bear ? `${s.A.name} · ${s.mood === 'calm' ? 'calm' : 'agitated!'}` : s.A.name });
    },
  });
  // the moments that tell it: listen, then see (built from the stills for each animal)
  for (const kind of Object.keys(ANIMALS)) {
    SE.MOMENTS[`see_${kind}`] = [
      { black: 2.6, text: 'Something in the woods got Waffles’ attention…', sounds: [[0.3, 'twig'], [1.4, 'rustle'], [2.2, 'twig']] },
      { img: `cut/see_${kind}`, dur: 3.6, text: REVEAL[kind], pan: 1, sounds: [[0.2, kind === 'bear' ? 'stomp' : kind === 'owl' || kind === 'bird' ? 'rustle' : 'step']] },
    ];
  }
  SE.MOMENTS.bear_angry = [
    { img: 'cut/see_bear_angry', dur: 3.4, text: 'He lowers his head and huffs, slapping the snow. Back away slowly.', pan: -1, sounds: [[0.2, 'woof'], [1.0, 'stomp'], [2.2, 'stomp']] },
  ];
  SE.MOMENTS.bear_retreat = [
    { img: 'cut/retreat', dur: 3.8, text: 'Step by step. Never turn your back. Waffles stays close.', pan: 1, sounds: [[0.4, 'step'], [1.4, 'step'], [2.4, 'step']] },
    { black: 2.2, text: 'Branches snap far behind you… then nothing.', sounds: [[0.5, 'twig'], [1.6, 'rustle']] },
  ];
  SE.MOMENTS.animal_leaves = [
    { black: 1.6, text: 'It slips back between the trees.', sounds: [[0.3, 'rustle']] },
  ];

  function agitate() {
    s.mood = 'agitated';
    s.state = 'busy';
    SE.moment('bear_angry', { force: true, then: () => { s.state = 'meet'; } });
  }
  function retreat() {
    s.state = 'busy';
    SE.moment('bear_retreat', { force: true, then: () => {
      SE.save.bears = (SE.save.bears || 0) + 1; SE.persist();
      SE.toast('You made it back to the path. Waffles leans against your legs.', '#ffe6b8');
      goBack();
    } });
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
    const items = A.bear && s.mood === 'agitated'
      ? [['Back away slowly', 104, retreat, null]]
      : [
        ['Take a photo', 84, takePhoto, 'cam'],
        [A.bear ? 'Note it down' : 'Sketch it', 76, sketchIt, 'book'],
        [A.bear ? 'Back away' : 'Let it be', 66, () => (A.bear ? retreat() : leave()), null],
      ];
    let x = SE.W - 6 - items.reduce((t, i) => t + i[1] + 4, 0);
    for (const [label, w, cb, icon] of items) { if (SE.button(x, by, w, 18, label, { icon })) cb(); x += w + 4; }
  }
  function leave() { s.state = 'busy'; SE.moment('animal_leaves', { force: true, then: goBack }); }
  function goBack() {
    if (s.from === 'trail') SE.go('trail', {});
    else SE.go('map', { resume: true });
  }
  // Photo and sketch are little cutscenes: his hands raising the camera (the shutter clicks), or the
  // pencil moving over the notebook, and then the print or the finished page.
  function takePhoto() {
    s.state = 'busy';
    SE.moment('photo', { force: true, then: () => {
      s.flash = 1;
      s.photo = { ...nextShot(s.kind), t: 0 };
      // the click of the shutter can unsettle a bear
      if (s.A.bear && Math.random() < 0.25) s.photo.spooks = true;
      s.state = 'meet';
    } });
  }
  function sketchIt() {
    s.state = 'busy';
    SE.moment('sketch', { force: true, then: () => { s.state = 'meet'; startSketch(); } });
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
