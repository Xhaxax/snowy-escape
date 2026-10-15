// Whispering Pines, told in stills: you and Waffles settle low in the snow and wait (a black screen,
// Waffles sniffing), and if you are lucky one animal comes by and you see ONE moment of what it does.
// Each animal has three moments, seen in order over three trips (a fox listening, then pouncing...).
// Who comes depends on the hour and the weather: the owl only at night, the cardinal never in heavy
// snow or wind, the bear stays in its den in a storm. Then you get one chance: take a photo OR sit
// and add to its sketch. Either way the animal is gone afterwards and you head back.
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
  // the moment you get to see this trip: the next one you have not seen yet, in order
  function nextBeat(kind) {
    const n = (SE.save.pinesBeats || {})[kind] || 0;
    return n < 3 ? n + 1 : 1 + Math.floor(Math.random() * 3);
  }
  function build(kind, b) {
    const P = PINES[kind];
    const [text, sounds] = P.beats[b - 1];
    SE.MOMENTS.pines_watch = [
      { black: 3.2, text: SE.pick(['You wait. Waffles’ ears twitch…', 'Snow ticks off the branches. Waffles goes very still…', 'Breath held. Something is coming through the trees…']), sounds: [[0.6, 'twig'], [1.9, 'rustle']] },
      { img: `cut/pines_${kind}_${b}`, dur: BEAT_DUR + 1.6, text, pan: b % 2 ? 1 : -1, sounds },
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
    const b = nextBeat(kind);
    build(kind, b);
    s.state = 'busy';
    const seen = SE.save.pinesSeen || (SE.save.pinesSeen = {});
    seen[kind] = (seen[kind] || 0) + 1;
    const beats = SE.save.pinesBeats || (SE.save.pinesBeats = {});
    beats[kind] = Math.min(3, Math.max(beats[kind] || 0, b));
    SE.persist();
    SE.moment('pines_watch', { force: true, then: () => {
      s.beat = b;
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
      s = { t: 0, state: 'busy', kind: null, beat: 0, photoTaken: false, sketched: false, photo: null, sketch: null, flash: 0, angry: false };
      SE.audio.setMusic('outdoors');
      arrive(false);
    },
    update() {
      SE.weather.stormCheck();
      SE.audio.setAmbience({ wind: 0.25 + SE.weather.wind / 90, birds: 0.5 * (1 - SE.weather.night()), storm: SE.weather.stormy() ? 0.7 : 0 });
    },
    draw(ctx, dt) {
      s.t += dt;
      // until the moment has played the screen stays black (no flash of the picture before the wait)
      if (s.angry) SE.drawStill(ctx, 'cut/see_bear_angry');
      else if (s.kind && s.beat) SE.drawStill(ctx, `cut/pines_${s.kind}_${s.beat}`);
      else if (s.state === 'empty') SE.drawStill(ctx, 'cut/forest');
      else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SE.W, SE.H); }
      if (s.flash > 0) { s.flash -= dt * 3; ctx.fillStyle = `rgba(255,255,255,${Math.max(0, s.flash)})`; ctx.fillRect(0, 0, SE.W, SE.H); }
      if (s.photo) drawPhoto(ctx, dt);
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
      // one chance: the shutter or the pencil, then it is gone
      items.push(['Take a photo', 84, takePhoto, 'cam']);
      if (!SE.sketchDone(s.kind)) items.push(['Sketch it', 62, sketchIt, 'book']);
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
      const beat = s.beat || 1;
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
    if (SE.button(SE.W / 2 - 44, SE.H - 24, 88, 18, 'Into the album', {}) || (p.t > 0.6 && SE.key('Space'))) { s.photo = null; leaveAfter('The shutter clicks — and it is gone between the trees.'); }
  }

  // ------------------------------------------------------------ the sketch: a few more lines each trip
  SE.sketchTrips = (kind) => (PINES[kind] ? PINES[kind].trips : 4);
  SE.sketchDone = (kind) => ((SE.save.sketches || {})[kind] || 0) >= SE.sketchTrips(kind);
  function sketchIt() {
    s.state = 'busy'; s.sketched = true;
    const kind = s.kind, sk = SE.save.sketches, N = SE.sketchTrips(kind);
    const before = Math.min(N, sk[kind] || 0), after = Math.min(N, before + 1);
    sk[kind] = after;
    SE.persist();
    // the notebook on your knee: where the drawing was, then a few more minutes of pencil
    const beats = [];
    if (before > 0) beats.push({ img: SE.sketchStill(kind, before), dur: 2.2, text: 'The page from last time.', pan: 1, sounds: [[0.2, 'page']] });
    beats.push({ img: SE.sketchStill(kind, after), dur: 5.2, pan: -1,
      text: after >= N ? `The last lines. The ${PINES[kind].name.toLowerCase()} is finished.` : `A few more lines while it holds still. Sketch ${after} of ${N}.`,
      sounds: [[0.3, 'scribble'], [1.8, 'scribble'], [3.4, 'scribble']] });
    SE.MOMENTS.pines_sketch = beats;
    SE.moment('pines_sketch', { force: true, then: () => {
      if (after >= N && before < N) SE.celebrate('Sketch complete!', `${PINES[kind].name} · in your field guide`, { y: 2 });
      leaveAfter('You look up from the page. It has slipped away into the pines.');
    } });
  }
  // after the photo or the sketch the animal is gone, and so are you
  SE.MOMENTS.pines_gone = [{ black: 2.2, sounds: [[0.3, 'rustle'], [1.2, 'step']] }];
  function leaveAfter(text) {
    s.state = 'busy';
    SE.MOMENTS.pines_gone[0].text = text;
    SE.moment('pines_gone', { force: true, then: goBack });
  }
  // the notebook still for stage n of an animal's sketch (cut/sketch_<kind>_<n>)
  SE.sketchStill = (kind, n) => `cut/sketch_${kind}_${Math.max(1, Math.min(SE.sketchTrips(kind), n))}`;
  // The sketch on its page: just the pencil drawing as far as you have got (assets/img/sketch/
  // <kind>_<n>.png, the same drawing as the cutscene's notebook page, without page or glove), set
  // straight onto the paper so there are no edges. Nothing drawn yet: an empty page.
  SE.drawSketchPage = function (ctx, kind, x, y, w, h, frac) {
    const N = SE.sketchTrips(kind), n = Math.round(frac * N);
    if (n <= 0) return;
    const img = SE.img(`sketch/${kind}_${Math.min(N, n)}`);
    if (!img) return;
    const sc = Math.min(w / img.width, h / img.height, 2), dw = Math.round(img.width * sc), dh = Math.round(img.height * sc);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(x + (w - dw) / 2), Math.round(y + (h - dh) / 2), dw, dh);
    ctx.restore();
  };

})();
