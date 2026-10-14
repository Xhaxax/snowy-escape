// Whispering Pines, told in stills like an encounter but longer: you and Waffles settle low in the
// snow and wait, and if you are lucky one animal comes by and you watch it for a while (three
// pictures of what it does: a fox listening and pouncing, an owl dropping onto a hare, a bear on the
// trail of a deer...). Who comes depends on the hour and the weather: the owl only at night, the
// cardinal never in heavy snow or wind, the bear stays in its den in a storm. Each trip you may take
// one photo (a beat you have not got yet in this light and weather, if there is one) and add a few
// lines to that animal's sketch, which takes several calm trips to finish.
'use strict';

(function () {
  // three beats per animal: the still, what is told over it, and the sounds that carry it
  const PINES = {
    fox: { name: 'Red fox', trips: 4, beats: [
      ['Two red foxes trot between the pines, noses on a fresh trail.', [[0.4, 'step'], [2.2, 'sniff'], [3.8, 'sniff']]],
      ['It stops. Head tilted. Something is moving under the snow.', [[1.0, 'rustle'], [3.2, 'yip']]],
      ['Up — and head first into the snow. Mousing.', [[0.3, 'pounce'], [1.4, 'rustle'], [3.6, 'yip']]],
    ] },
    hare: { name: 'Snowshoe hare', trips: 3, beats: [
      ['A snowshoe hare nibbling a willow twig. Almost invisible.', [[0.6, 'hop'], [2.4, 'rustle']]],
      ['A shadow glides over the snow. The hare goes flat and still.', [[0.3, 'wings'], [2.6, 'hoot']]],
      ['Then it bolts — big bounds, a spray of powder, gone.', [[0.2, 'hop'], [0.8, 'hop'], [1.5, 'hop'], [2.6, 'rustle']]],
    ] },
    owl: { name: 'Great grey owl', trips: 6, night: true, beats: [
      ['Moonlight. A great grey owl, staring down at the snow.', [[0.8, 'hoot'], [3.8, 'hoot']]],
      ['It drops without a sound, wings wide, talons first.', [[0.3, 'wings'], [2.0, 'pounce']]],
      ['Back on its branch, fluffed up round against the cold.', [[1.2, 'wings'], [3.4, 'hoot']]],
    ] },
    bird: { name: 'Cardinal', trips: 3, beats: [
      ['A flash of red: a cardinal among the rowan berries.', [[0.4, 'chirp'], [2.6, 'chirp']]],
      ['Two of them now, puffed up side by side on a twig.', [[0.8, 'chirp'], [2.2, 'chirp'], [3.6, 'chirp']]],
      ['Snow tumbles off the branch as they fly.', [[0.3, 'wings'], [1.0, 'chirp'], [2.4, 'rustle']]],
    ] },
    deer: { name: 'Deer', trips: 4, beats: [
      ['A deer steps out to browse the young trees.', [[0.4, 'step'], [1.6, 'twig'], [3.4, 'rustle']]],
      ['Head up. Ears forward. Breath steaming. It has smelled something.', [[0.6, 'sniff'], [2.0, 'sniff'], [3.6, 'twig']]],
      ['And it bounds away, white tail up like a flag.', [[0.2, 'step'], [0.7, 'stomp'], [1.3, 'step'], [2.4, 'rustle']]],
    ] },
    elk: { name: 'Elk', trips: 5, beats: [
      ['A bull elk lifts his head and bugles across the valley.', [[0.5, 'bugle'], [3.6, 'gust']]],
      ['He paws the snow down to the grass beneath.', [[0.4, 'stomp'], [1.3, 'stomp'], [2.4, 'stomp'], [3.6, 'sniff']]],
      ['The herd follows him, one by one, along the edge of the trees.', [[0.4, 'step'], [1.2, 'step'], [2.0, 'step'], [2.8, 'bugle']]],
    ] },
    bear: { name: 'Grizzly bear', trips: 7, bear: true, beats: [
      ['A grizzly, nose to the ground, on a deer’s fresh trail.', [[0.5, 'sniff'], [2.0, 'huff'], [3.6, 'sniff']]],
      ['It crouches low behind the bushes. Far off, a deer grazes, unaware.', [[1.0, 'growl'], [3.4, 'twig']]],
      ['The deer is gone. The bear gives up and shuffles off into the dark pines.', [[0.6, 'huff'], [1.6, 'stomp'], [2.8, 'stomp']]],
    ] },
  };
  SE.PINES = PINES;
  const BEAT_DUR = 5.4;
  // which light and weather a photo is taken in (a separate slot in the album for each)
  const CONDS = { owl: ['night', 'night_snow'], bird: ['day', 'snow'], bear: ['day', 'snow', 'storm'] };
  const condsOf = (k) => CONDS[k] || ['day', 'snow', 'storm', 'night'];
  const COND_LABEL = { day: 'sun', snow: 'snowfall', storm: 'storm', night: 'night', night_snow: 'snowy night' };
  SE.pinesConds = condsOf;
  SE.PINES_COND_LABEL = COND_LABEL;
  function condNow(kind) {
    const W = SE.weather;
    if (kind === 'owl') return W.mode === 'sunny' ? 'night' : 'night_snow';
    const c = SE.stillWanted('cut/pines_x');
    return condsOf(kind).includes(c) ? c : condsOf(kind)[0];
  }
  // the light a slot's photo is drawn in
  SE.pinesLight = (cond) => (cond === 'night_snow' ? 'night' : cond);

  // who might come by now
  function pickAnimal() {
    const W = SE.weather, night = W.night() > 0.6, storm = W.stormy(), heavy = storm || W.mode === 'windy' || W.mode === 'snowy';
    const pool = night
      ? [['owl', 5], ['fox', 2], ['hare', 2], ['deer', 0.8]]
      : [['deer', 4], ['hare', 3], ['fox', 3], ['bird', heavy ? 0 : 3], ['elk', 1.5], ['bear', storm ? 0 : 0.9]];
    // some trips nobody comes at all (more often in a storm): the animals are rare
    const nobody = storm ? 0.4 : heavy ? 0.22 : 0.14;
    if (Math.random() < nobody) return null;
    let r = Math.random() * pool.reduce((t, p) => t + p[1], 0);
    for (const [k, w] of pool) { r -= w; if (r <= 0) return k; }
    return pool[0][0];
  }

  let s = null;
  function build(kind) {
    const P = PINES[kind];
    SE.MOMENTS.pines_watch = [
      { black: 3.2, text: SE.pick(['You wait. Waffles’ ears twitch…', 'Snow ticks off the branches. Waffles goes very still…', 'Breath held. Something is coming through the trees…']), sounds: [[0.6, 'twig'], [1.9, 'rustle']] },
      ...P.beats.map(([text, sounds], i) => ({ img: `cut/pines_${kind}_${i + 1}`, dur: BEAT_DUR, text, pan: i % 2 ? -1 : 1, sounds })),
    ];
  }
  SE.MOMENTS.pines_nobody = [
    { black: 3.4, text: 'You wait a long while. Only the wind in the pines today.', sounds: [[0.8, 'gust'], [2.6, 'twig']] },
  ];
  SE.MOMENTS.pines_more = [
    { black: 3.0, text: 'A little longer, then. Waffles sighs into the snow.', sounds: [[0.6, 'rustle'], [2.0, 'twig']] },
  ];

  function arrive(again) {
    const kind = pickAnimal();
    s.kind = kind;
    if (!kind) { s.state = 'busy'; SE.moment(again ? 'pines_more' : 'pines_nobody', { force: true, then: () => { s.state = 'empty'; s.waited = (s.waited || 0) + 1; } }); return; }
    build(kind);
    s.state = 'busy';
    const seen = SE.save.pinesSeen || (SE.save.pinesSeen = {});
    seen[kind] = (seen[kind] || 0) + 1;
    SE.persist();
    SE.moment('pines_watch', { force: true, then: () => {
      if (seen[kind] === 1) SE.celebrate('New in your field guide!', `${PINES[kind].name} · see the notebook`, { y: 2 });
      // a bear may notice you once it gives up on the deer
      if (PINES[kind].bear && Math.random() < 0.3) { s.state = 'busy'; SE.moment('bear_angry', { force: true, then: () => { s.angry = true; s.state = 'meet'; } }); }
      else s.state = 'meet';
    } });
  }

  SE.addScene('forest', {
    enter() {
      SE.save.location = 'forest';
      SE.save.sketches = SE.save.sketches || {};
      SE.save.pinesAlbum = SE.save.pinesAlbum || {};
      SE.persist();
      s = { t: 0, state: 'busy', kind: null, photoTaken: false, sketched: false, photo: null, sketch: null, flash: 0, angry: false };
      SE.audio.setMusic('outdoors');
      arrive(false);
    },
    update() {
      SE.weather.stormCheck();
      SE.audio.setAmbience({ wind: 0.25 + SE.weather.wind / 90, birds: 0.5 * (1 - SE.weather.night()), storm: SE.weather.stormy() ? 0.7 : 0 });
    },
    draw(ctx, dt) {
      s.t += dt;
      SE.drawStill(ctx, s.angry ? 'cut/see_bear_angry' : s.kind ? `cut/pines_${s.kind}_3` : 'cut/forest');
      if (s.flash > 0) { s.flash -= dt * 3; ctx.fillStyle = `rgba(255,255,255,${Math.max(0, s.flash)})`; ctx.fillRect(0, 0, SE.W, SE.H); }
      if (s.photo) drawPhoto(ctx, dt);
      else if (s.sketch) drawSketch(ctx, dt);
      else drawChoices();
      SE.hud.draw(ctx, { watch: false, title: 'Whispering Pines', subtitle: s.kind ? PINES[s.kind].name : 'waiting quietly' });
    },
  });

  function goBack() { SE.go('map', { resume: true }); }
  function drawChoices() {
    if (SE.momentPlaying() || s.state === 'busy') return;
    const by = SE.H - 24, items = [];
    if (s.state === 'empty') {
      if ((s.waited || 0) < 2) items.push(['Wait a little longer', 108, () => arrive(true), null]);
      items.push(['Head back', 66, goBack, null]);
    } else if (s.angry) {
      items.push(['Back away slowly', 104, () => { s.state = 'busy'; SE.moment('bear_retreat', { force: true, then: () => { SE.save.bears = (SE.save.bears || 0) + 1; SE.persist(); goBack(); } }); }, null]);
    } else {
      if (!s.photoTaken) items.push(['Take a photo', 84, takePhoto, 'cam']);
      if (!s.sketched) items.push(['Sketch it', 62, sketchIt, 'book']);
      items.push(['Head back', 66, goBack, null]);
    }
    let x = SE.W - 6 - items.reduce((t, i) => t + i[1] + 4, 0);
    for (const [label, w, cb, icon] of items) { if (SE.button(x, by, w, 18, label, { icon })) cb(); x += w + 4; }
  }

  // ------------------------------------------------------------ the camera: one print per trip
  function takePhoto() {
    s.state = 'busy'; s.photoTaken = true;
    SE.moment('photo', { force: true, then: () => {
      const kind = s.kind, cond = condNow(kind);
      const album = SE.save.pinesAlbum[kind] || (SE.save.pinesAlbum[kind] = []);
      const open = [1, 2, 3].filter((b) => !album.includes(`${b}_${cond}`));
      const beat = open.length ? SE.pick(open) : SE.pick([1, 2, 3]);
      const key = `${beat}_${cond}`, isNew = !album.includes(key);
      if (isNew) album.push(key);
      SE.persist();
      s.flash = 1;
      s.photo = { beat, cond, isNew, t: 0, of: condsOf(kind).length * 3 };
      s.state = 'meet';
    } });
  }
  function drawPhoto(ctx, dt) {
    const p = s.photo;
    p.t += dt;
    const img = SE.img(SE.stillFor(`cut/pines_${s.kind}_${p.beat}`, SE.pinesLight(p.cond)));
    const w = 240, h = 136, x = SE.W / 2 - w / 2 - 6, y = 30, pop = Math.min(1, p.t * 4);
    ctx.save(); ctx.globalAlpha = pop;
    ctx.fillStyle = 'rgba(20,14,30,0.5)'; ctx.fillRect(x + 4, y + 6, w + 16, h + 40);
    ctx.fillStyle = '#fbf6ec'; ctx.fillRect(x - 2, y, w + 16, h + 36);
    if (img) { ctx.imageSmoothingEnabled = false; ctx.drawImage(img, x + 6, y + 6, w, h); }
    ctx.restore();
    SE.text(`${PINES[s.kind].name} · ${COND_LABEL[p.cond]}`, SE.W / 2, y + h + 14, { align: 'center', size: 8, color: '#3a2a2a', shadow: false, alpha: pop });
    if (p.t > 0.4 && !p.cheered) {
      p.cheered = true;
      const n = SE.save.pinesAlbum[s.kind].length;
      if (p.isNew) SE.celebrate('New photo!', `${PINES[s.kind].name} · ${n}/${p.of} in your album`, { y: 2 });
      else SE.toast('You already have this one in your album. Lovely anyway.', '#cfe6ff');
    }
    if (SE.button(SE.W / 2 - 44, SE.H - 24, 88, 18, 'Into the album', {}) || (p.t > 0.6 && SE.key('Space'))) s.photo = null;
  }

  // ------------------------------------------------------------ the sketch: a few more lines each trip
  SE.sketchTrips = (kind) => (PINES[kind] ? PINES[kind].trips : 4);
  SE.sketchDone = (kind) => ((SE.save.sketches || {})[kind] || 0) >= SE.sketchTrips(kind);
  function sketchIt() {
    s.state = 'busy'; s.sketched = true;
    SE.moment('sketch', { force: true, then: () => {
      const sk = SE.save.sketches;
      const before = sk[s.kind] || 0, N = SE.sketchTrips(s.kind);
      sk[s.kind] = Math.min(N, before + 1);
      SE.persist();
      s.sketch = { t: 0, from: before / N, to: sk[s.kind] / N, done: sk[s.kind] >= N && before < N };
      SE.audio.sfx('scribble');
      s.state = 'meet';
    } });
  }
  // The sketch on its page: the animal in pencil, drawn in from left to right as far as you got.
  SE.drawSketchPage = function (ctx, kind, x, y, w, h, frac) {
    const img = SE.img(`cut/pines_${kind}_1`) || SE.img(`cut/see_${kind}`);
    if (!img) return;
    const cw = Math.round(w * frac);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, cw, h); ctx.clip();
    ctx.filter = 'grayscale(1) sepia(0.55) contrast(1.25) brightness(1.12)';
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
    if (frac < 1) { // the unfinished edge: faint guide lines
      ctx.fillStyle = 'rgba(90,70,60,0.35)';
      for (let i = 0; i < h; i += 3) ctx.fillRect(x + cw, y + i, 1 + ((i * 7) % 5), 1);
    }
  };
  function drawSketch(ctx, dt) {
    const k = s.sketch;
    k.t += dt;
    const w = 240, h = 160, x = SE.W / 2 - w / 2, y = 30;
    ctx.fillStyle = 'rgba(20,14,30,0.5)'; ctx.fillRect(x + 4, y + 5, w, h);
    ctx.fillStyle = '#f4ead2'; ctx.fillRect(x, y, w, h);
    const frac = k.from + (k.to - k.from) * Math.min(1, k.t / 2.2);
    SE.drawSketchPage(ctx, s.kind, x + 12, y + 10, w - 24, Math.round((w - 24) * 136 / 240), frac);
    const n = SE.save.sketches[s.kind], N = SE.sketchTrips(s.kind);
    SE.text(n >= N ? `${PINES[s.kind].name} — finished!` : `${PINES[s.kind].name} — sketch ${n}/${N}. Come back to finish it.`, x + w / 2, y + h - 18, { align: 'center', size: 7, color: '#4a3a32', shadow: false });
    if (k.done && k.t > 2.3 && !k.cheered) { k.cheered = true; SE.celebrate('Sketch complete!', `${PINES[s.kind].name} · in your field guide`, { y: 2 }); }
    if (k.t > 1.2 && SE.button(SE.W / 2 - 40, SE.H - 24, 80, 18, 'Close notebook')) { s.sketch = null; SE.audio.sfx('page'); }
  }
})();
