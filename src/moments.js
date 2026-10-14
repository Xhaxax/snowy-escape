// Moments: little cutscenes told the Coffee Talk way. There is no animation: the screen dips to black
// and a sound starts the story (a door creaks, boots crunch, the ice cracks); then one still picture
// fades in between letterbox bars, drifting a pixel or two like a slow camera, with a single line of
// text, while more sounds carry the action. Then it fades back into the game. Click / Space skips.
'use strict';

(function () {
  // beats: { black: seconds } or { img, dur, text } — each may have sounds: [[seconds, sfx], ...]
  // and go: [scene, params] to switch scenes behind the moment (so it ends in the new place).
  SE.MOMENTS = {
    leave: [
      { black: 0.8, sounds: [[0.05, 'creak']] },
      { img: 'cut/leave', dur: 3.6, text: 'Out into the snow. Waffles is already ahead.', pan: 1, sounds: [[0.15, 'step'], [0.55, 'step'], [0.9, 'woof'], [1.3, 'step'], [1.75, 'step'], [2.4, 'latch']] },
    ],
    lake: [
      { black: 0.7, sounds: [[0.1, 'icecrack']] },
      { img: 'cut/lake', dur: 3.8, text: 'A fresh hole in the ice.', pan: -1, sounds: [[0.15, 'auger'], [1.9, 'auger'], [3.2, 'splash']] },
    ],
    chapel: [
      { black: 0.7, sounds: [[0.05, 'stomp']] },
      { img: 'cut/chapel', dur: 3.6, text: 'Quiet. Candlelight.', pan: 1, sounds: [[0.35, 'creak'], [2.3, 'bell']] },
    ],
    summit: [
      { black: 0.8, sounds: [[0.0, 'gust']] },
      { img: 'cut/climb1', dur: 3.4, text: 'Step by step up the ridge. Waffles leads the way.', pan: 1, sounds: [[0.3, 'stomp'], [0.9, 'step'], [1.5, 'stomp'], [2.1, 'step'], [2.7, 'woof']] },
      { img: 'cut/climb2', dur: 3.4, text: 'Breathless — and then the whole world opens up.', pan: -1, sounds: [[0.2, 'gust']] },
      { img: 'cut/summit', dur: 4.0, text: 'Above the clouds.', pan: -1, sounds: [[0.3, 'step'], [0.75, 'step'], [1.2, 'step'], [1.9, 'gust']] },
    ],
    alert: [
      { img: 'cut/alert', dur: 2.3, text: '', pan: 1, sounds: [[0.05, 'twig'], [0.45, 'rustle'], [1.25, 'woof']] },
    ],
    home: [
      { black: 0.8, sounds: [[0.0, 'stomp'], [0.6, 'creak']] },
      { img: 'cut/home', dur: 3.6, text: 'Home. Coat on the hook, snow melting on the mat.', pan: 1, sounds: [[0.2, 'latch'], [1.5, 'purr']] },
    ],
    lantern: [
      { img: 'cut/lantern', dur: 3.6, text: 'Dusk already. Time to light the lantern.', pan: -1, sounds: [[0.35, 'match']] },
    ],
    forest: [
      { black: 0.7, sounds: [[0.1, 'rustle']] },
      { img: 'cut/forest', dur: 3.8, text: 'Low and quiet. Waffles knows the drill.', pan: 1, sounds: [[0.6, 'twig'], [1.8, 'rustle']] },
    ],
    trail: [
      { black: 0.6, sounds: [[0.05, 'gust']] },
      { img: 'cut/trail', dur: 3.6, text: 'The old trail out of the valley.', pan: -1, sounds: [[0.4, 'step'], [0.85, 'step'], [1.3, 'step'], [1.75, 'step']] },
    ],
    chop: [
      { img: 'cut/chop', dur: 2.6, text: '', pan: 1, sounds: [[0.15, 'chop'], [0.5, 'twig']] },
    ],
    shovel: [
      { img: 'cut/shovel', dur: 2.8, text: 'Clearing the path.', pan: -1, sounds: [[0.2, 'stomp'], [0.8, 'step'], [1.4, 'stomp']] },
    ],
    porch: [
      { img: 'cut/porch', dur: 3.6, text: 'A blanket, a mug, the slow creak of the chair.', pan: 1, sounds: [[0.3, 'creak'], [1.8, 'sip']] },
    ],
    pray: [
      { black: 0.6 },
      { img: 'cut/pray', dur: 3.8, text: '', pan: 0, sounds: [[0.4, 'soft'], [2.4, 'bell']] },
    ],
    cocoa: [
      { img: 'cut/cocoa', dur: 2.8, text: 'Milk on the stove…', pan: 1, sounds: [[0.2, 'pour']] },
    ],

    // ---- whole actions told in stills (no minigame): each ends with the job done
    shovelling: [
      { black: 0.5, sounds: [[0.05, 'stomp']] },
      { img: 'cut/shovel', dur: 3.4, text: 'Knee-deep. One scoop at a time.', pan: -1, sounds: [[0.3, 'scrape'], [0.9, 'stomp'], [1.7, 'scrape'], [2.4, 'stomp']] },
      { img: 'cut/shovel2', dur: 3.4, text: 'Scrape… lift… fwump.', pan: 1, sounds: [[0.2, 'scrape'], [0.8, 'stomp'], [1.6, 'scrape'], [2.3, 'stomp'], [2.9, 'woof']] },
      { img: 'cut/shovel3', dur: 3.6, text: 'Clear, all the way to the door.', pan: -1, sounds: [[0.4, 'step'], [0.8, 'step'], [1.6, 'soft']] },
    ],
    porchRest: [
      { img: 'cut/porch', dur: 3.6, text: 'A blanket, a mug, the slow creak of the chair.', pan: 1, sounds: [[0.3, 'creak'], [1.6, 'creak']] },
      { img: 'cut/porch2', dur: 4.2, text: 'Warm hands, cold nose. The snow keeps falling.', pan: -1, sounds: [[0.6, 'sip'], [2.2, 'creak'], [3.2, 'purr']] },
    ],
    climb: [
      { black: 0.6, sounds: [[0.05, 'gust']] },
      { img: 'cut/climb1', dur: 3.6, text: 'Step by step up the ridge. Waffles leads the way.', pan: 1, sounds: [[0.3, 'stomp'], [0.9, 'step'], [1.5, 'stomp'], [2.1, 'step'], [2.7, 'woof']] },
      { img: 'cut/climb2', dur: 3.8, text: 'Breathless — and then the whole world opens up.', pan: -1, sounds: [[0.2, 'gust'], [1.8, 'soft']] },
    ],
    cocoaMake: [
      { img: 'cut/cocoa', dur: 3.0, text: 'Milk on the stove…', pan: 1, sounds: [[0.2, 'pour']] },
      { img: 'cut/cocoa2', dur: 3.0, text: 'Two heaped spoons of cocoa.', pan: -1, sounds: [[0.5, 'stir'], [1.4, 'stir']] },
      { anim: 'cocoa_stir', dur: 3.2, text: 'Stir until it is smooth and dark.', sounds: [[0.3, 'stir'], [1.0, 'stir'], [1.7, 'stir'], [2.4, 'stir']] },
      { img: 'cut/cocoa3', dur: 3.4, text: 'Marshmallows. Obviously.', pan: 1, sounds: [[0.5, 'pop'], [1.1, 'pop'], [1.6, 'pop'], [2.4, 'sip']] },
    ],
    cook: [
      { img: 'kitchen_cut', dur: 2.6, text: 'A sharp knife, a steady hand.', sounds: [[0.3, 'chop'], [1.0, 'chop']] },
      { img: 'kitchen_scale', dur: 2.6, text: 'Scales off, against the grain…', sounds: [[0.2, 'scrape'], [0.8, 'scrape'], [1.4, 'scrape']] },
      { img: 'kitchen_head', dur: 2.4, text: 'Head and fins off.', sounds: [[0.3, 'chop'], [0.9, 'chop'], [1.4, 'chop']] },
      { img: 'kitchen_fillet', dur: 2.8, text: 'Two neat fillets. Dill and salt.', sounds: [[0.4, 'stir'], [1.4, 'soft']] },
      { anim: 'kitchen_fry_raw', dur: 3.4, text: 'Into the hot pan. Sssss.', sounds: [[0.1, 'sizzle'], [1.6, 'sizzle']] },
      { anim: 'kitchen_fry_gold', dur: 3.2, text: 'Flip. Golden.', sounds: [[0.05, 'whoosh'], [0.3, 'sizzle']] },
      { img: 'cut/eat', dur: 3.8, text: 'Dinner by the window. Everyone is very interested.', pan: 1, sounds: [[0.6, 'purr'], [1.8, 'woof']] },
    ],
    photo: [
      { img: 'cut/camera', dur: 2.6, text: '', pan: 1, sounds: [[0.4, 'rustle'], [1.7, 'camera']] },
    ],
    sketch: [
      { img: 'cut/sketch', dur: 3.4, text: 'A few quick lines while it holds still.', pan: -1, sounds: [[0.4, 'scrape'], [1.2, 'scrape'], [2.0, 'scrape']] },
    ],
  };
  // petting: two of these stills each time, never the same pair in a row
  SE.PET_STILLS = {
    dog: [['cut/pet_dog1', 'Right behind the ears. His favourite spot.'], ['cut/pet_dog2', 'A big fluffy head lands in your lap.'], ['cut/pet_dog3', 'Belly up. Tail thumping the rug.']],
    cat: [['cut/pet_cat1', 'Chin scratches. She approves.'], ['cut/pet_cat2', 'A head bump. You have been chosen.'], ['cut/pet_cat3', 'Kneading, purring, a little bit of claw.']],
  };
  SE.petMoment = function (kind, then) {
    const list = SE.PET_STILLS[kind].filter(([img]) => SE.img(img));
    const pick = list.sort(() => Math.random() - 0.5).slice(0, 2);
    SE.MOMENTS.pet = pick.map(([img, text], i) => ({ img, dur: 3.4, text, pan: i ? -1 : 1, sounds: kind === 'dog' ? [[0.5, 'soft'], [1.6, i ? 'woof' : 'soft']] : [[0.4, 'purr'], [2.0, 'purr']] }));
    if (!pick.length) { if (then) then(); return; }
    SE.moment('pet', { force: true, then });
  };
  // Every still exists for the weather and the time of day it is shown in: 'day' (a sunny spell),
  // 'snow' (overcast, snowing), 'storm' (wind and whiteout) and 'night'. BASE says which of those the
  // plain cut/<name>.png already is; the others live in cut/<name>_<variant>.png.
  const BASE = {
    alert: 'day', chop: 'day', lake: 'day', trail: 'day', forest: 'day', summit: 'day', porch: 'day',
    shovel: 'snow', shovel2: 'snow', shovel3: 'snow', porch2: 'day', climb1: 'day', climb2: 'day', camera: 'day', sketch: 'day',
    leave: 'night', chapel: 'night', home: 'night', pray: 'night', lantern: 'night', cocoa: 'any',
  };
  SE.CUT_VARIANTS = {
    alert: ['snow', 'storm', 'night'], chop: ['snow', 'storm', 'night'], lake: ['snow', 'storm', 'night'],
    trail: ['snow', 'storm', 'night'], forest: ['snow', 'storm', 'night'], summit: ['snow', 'storm', 'night'],
    porch: ['snow', 'storm', 'night'], shovel: ['day', 'storm', 'night'], leave: ['day', 'snow', 'storm'],
    chapel: ['day', 'snow', 'storm'], home: ['day', 'storm'], pray: ['day'],
  };
  const PREFER = { day: ['day', 'snow'], snow: ['snow', 'storm', 'day'], storm: ['storm', 'snow', 'day'], night: ['night'] };
  function wanted() {
    const W = SE.weather;
    if (W.night() > 0.5) return 'night';
    if (W.stormy() || W.mode === 'windy') return 'storm';
    return W.mode === 'sunny' ? 'day' : 'snow';
  }
  function stillFor(img) {
    const name = img.replace(/^cut\//, '');
    if (!BASE[name] || BASE[name] === 'any') return img;
    for (const v of PREFER[wanted()]) {
      if (v === BASE[name]) return img;
      if (SE.img(`${img}_${v}`)) return `${img}_${v}`;
    }
    return img;
  }

  const COOLDOWN = 120; // seconds before the same moment plays again (they stay special)
  const lastPlayed = {};
  let m = null;

  // Play a moment. then() runs when it ends (or right away if it is cooling down / missing).
  SE.moment = function (name, opts = {}) {
    const beats = SE.MOMENTS[name];
    const fresh = !lastPlayed[name] || SE.time - lastPlayed[name] > COOLDOWN || opts.force;
    if (!beats || !fresh || m) { if (opts.go) SE.go(...opts.go); if (opts.then) opts.then(); return false; }
    lastPlayed[name] = SE.time;
    m = { beats: beats.map((b) => ({ ...b, img: b.img && stillFor(b.img) })), i: 0, t: 0, played: new Set(), opts, fadeIn: 0 };
    if (opts.go) m.beats[m.beats.length - 1].go = opts.go; // switch scenes during the last beat
    SE.modal = 'moment';
    return true;
  };
  SE.momentPlaying = () => !!m;

  function finish() {
    const done = m.opts.then;
    m = null;
    if (SE.modal === 'moment') SE.modal = null;
    if (done) done();
  }

  SE.frameHooks.push(function drawMoment(ctx, dt) {
    if (!m) return;
    const b = m.beats[m.i];
    m.t += dt;
    for (const [i, [at, name]] of (b.sounds || []).entries()) {
      const key = m.i + ':' + i;
      if (m.t >= at && !m.played.has(key)) { m.played.add(key); SE.audio.sfx(name); }
    }
    const len = b.black != null ? b.black : b.dur;
    // fade in from the scene at the start, out to the (new) scene at the very end
    const first = m.i === 0, last = m.i === m.beats.length - 1;
    const a = Math.min(1, first ? m.t / 0.35 : 1) * Math.min(1, last ? (len - m.t) / 0.45 : 1);
    ctx.fillStyle = `rgba(6,5,10,${SE.clamp(a, 0, 1)})`;
    ctx.fillRect(0, 0, SE.W, SE.H);
    if (b.img || b.anim) {
      // a still picture, or (rarely) a looping PixelLab strip such as the frying pan
      const img = b.img ? SE.img(b.img) : null;
      const size = b.anim ? (SE.anims[b.anim] && SE.animSize(b.anim)) : img && { w: img.width, h: img.height };
      if (size) {
        const k = SE.clamp(m.t / b.dur, 0, 1);
        const ia = Math.min(1, m.t / 0.5) * Math.min(1, (b.dur - m.t) / 0.45);
        const s = Math.max(1, Math.floor(Math.min(SE.W / size.w, SE.H / size.h))); // whole pixels; bars crop the top/bottom
        const w = size.w * s, h = size.h * s;
        const pan = Math.round(((b.pan || 0) * (k - 0.5)) * 4); // a 4px drift across the shot
        const x = Math.round((SE.W - w) / 2) + pan, y = Math.round((SE.H - h) / 2);
        ctx.save();
        ctx.globalAlpha = SE.clamp(ia, 0, 1);
        ctx.beginPath(); ctx.rect(4, 22, SE.W - 8, SE.H - 44); ctx.clip();
        if (b.anim) SE.drawAnim(b.anim, x, y, m.t, { scale: s }); else ctx.drawImage(img, x, y, w, h);
        // smaller pictures (the cooking panels) get a thin warm frame, like a photo on the table
        if (w < SE.W - 40) { ctx.strokeStyle = 'rgba(243,230,207,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3); }
        ctx.restore();
        if (b.draw) b.draw(ctx, { x, y, w, h, s, t: m.t, k }); // extras on top (falling herbs, …)
      }
      // letterbox bars, with the line of text in the lower one (typed out gently)
      ctx.fillStyle = `rgba(6,5,10,${SE.clamp(a, 0, 1)})`;
      ctx.fillRect(0, 0, SE.W, 22); ctx.fillRect(0, SE.H - 22, SE.W, 22);
      if (b.text) {
        const n = Math.floor(SE.clamp((m.t - 0.4) * 32, 0, b.text.length));
        SE.text(b.text.slice(0, n), SE.W / 2, SE.H - 16, { align: 'center', size: 8, color: '#f3e6cf', alpha: SE.clamp(a, 0, 1) });
      }
    }
    if (b.go && !b.went && m.t > len * 0.4) { b.went = true; SE.fade.a = 0; SE.switchNow(...b.go); SE.modal = 'moment'; }
    const skip = SE.mouse.released || SE.key('Space') || SE.key('Escape') || SE.key('Enter');
    if (skip && m.t > 0.25) { SE.mouse.released = false; m.t = len; }
    if (m.t >= len) {
      if (b.go && !b.went) { b.went = true; SE.fade.a = 0; SE.switchNow(...b.go); }
      m.i++; m.t = 0;
      if (m.i >= m.beats.length) finish();
    }
  });
})();
