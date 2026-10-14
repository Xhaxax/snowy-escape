// The Little Chapel: a quiet log chapel in the valley. Kneel and pray at the altar while Waffles
// rests by the pews, light a candle, ring the bell, read a verse from the open Bible. Now and then
// a cardinal comes to the window ledge.
'use strict';

(function () {
  // short verses (King James Version), shown while you pray or read the open Bible
  const VERSES = [
    ['Be still, and know that I am God.', 'Psalm 46:10'],
    ['The Lord is my shepherd; I shall not want.', 'Psalm 23:1'],
    ['I will lift up mine eyes unto the hills, from whence cometh my help.', 'Psalm 121:1'],
    ['Wash me, and I shall be whiter than snow.', 'Psalm 51:7'],
    ['Thy word is a lamp unto my feet, and a light unto my path.', 'Psalm 119:105'],
    ['Come unto me, all ye that labour and are heavy laden, and I will give you rest.', 'Matthew 11:28'],
    ['Peace I leave with you, my peace I give unto you.', 'John 14:27'],
    ['This is the day which the Lord hath made; we will rejoice and be glad in it.', 'Psalm 118:24'],
    ['Casting all your care upon him; for he careth for you.', '1 Peter 5:7'],
    ['He giveth snow like wool.', 'Psalm 147:16'],
  ];
  SE.VERSES = VERSES; // the cabin Bible reads from the same verses
  // the arched window (glass area) and the scene's marks, in background pixels
  const WIN = { x: 30, y: 56, w: 48, h: 126, spring: 80 }; // spring: where the arch meets the straight sides
  const FLAMES = [{ x: 393, y: 136 }, { x: 436, y: 140 }];
  const BIBLE = { x: 398, y: 144, w: 32, h: 14 };
  const KNEEL = { x: 368, y: 208 };   // the traveler's feet, on the altar step facing the altar
  const DOG = { x: 394, y: 241 };     // Waffles stretched out at the foot of the altar step
  const LEDGE = { x: 54, y: 180 };    // outside the window, where the cardinal lands
  const VOTIVES = [384, 389, 446, 451, 456, 380, 461]; // little candles on the altar, either side of the Bible
  const PRAY_LEN = 26;                // seconds of quiet for one prayer

  let s = null;

  // the kneel animation: frame 0 standing, then down onto the knees; the last few frames are the
  // held prayer pose, which breathes gently back and forth
  function prayAnim() { return SE.anims.trav_pray ? 'trav_pray' : null; }
  function holdFrom() { const a = SE.anims.trav_pray; return a ? Math.max(1, a.frames - 4) : 0; }

  function startPrayer() {
    if (s.mode !== 'stand') return;
    if (!SE.watching()) SE.moment('pray'); // hands folded over the Bible, a candle, the bell far off
    s.mode = 'kneel'; s.k = 0; s.prayT = 0; s.prayed = false;
    s.verse = SE.pick(VERSES.filter((v) => v !== s.verse));
    s.verseT = 0;
  }
  function standUp() {
    if (s.mode === 'pray' || s.mode === 'kneel') { s.mode = 'rise'; s.k = Math.min(s.k, holdFrom()); }
  }
  function lightCandle(auto) {
    const free = VOTIVES.length - s.votives.length;
    if (free <= 0) { if (!auto) SE.toast('Every little candle is already burning.', '#ffe6b8'); return; }
    s.votives.push({ x: VOTIVES[s.votives.length], t: 0, life: SE.rand(300, 480) });
    SE.save.candles = (SE.save.candles || 0) + 1; SE.persist();
    SE.audio.sfx('soft');
    const v = s.votives[s.votives.length - 1];
    for (let i = 0; i < 5; i++) SE.spawnFloater(v.x + SE.rand(-1, 1), 154, 'spark', '#ffd38a');
    if (!auto) SE.toast(SE.pick(['A little flame for someone you love.', 'You light a candle. It flickers, then stands tall.', 'One more small light against the dark.']), '#ffe6b8');
  }
  function ringBell(auto) {
    if (s.bell > 0) return;
    s.bell = 5.5;
    for (let i = 0; i < 3; i++) setTimeout(() => { if (SE.sceneName === 'chapel') SE.audio.sfx('bell'); }, i * 1800);
    if (!auto) SE.toast('The bell rings out over the snowy valley.', '#cfe6ff');
  }

  // Watch mode: a slow film — pray for a long while, rise, light a candle, sometimes ring the bell.
  function direct(dt) {
    s.dirT -= dt;
    if (s.dirT > 0) return;
    if (s.mode === 'stand') {
      if (Math.random() < 0.35) lightCandle(true);
      if (Math.random() < 0.15) ringBell(true);
      startPrayer();
      s.dirT = SE.rand(55, 85);
    } else if (s.mode === 'pray') { standUp(); s.dirT = SE.rand(8, 14); } else s.dirT = 2;
  }

  SE.addScene('chapel', {
    enter(p) {
      SE.save.location = 'chapel';
      SE.persist();
      SE.audio.woodSteps(4);
      s = {
        t: 0, mode: 'stand', k: 0, prayT: 0, prayed: false, verse: null, verseT: 0, reading: null,
        votives: [], bell: 0, dirT: SE.rand(3, 6), motes: [],
        bird: { state: 'away', t: 0, next: SE.rand(18, 40) },
      };
      for (let i = 0; i < 18; i++) s.motes.push(newMote(true));
      SE.audio.setMusic('chapel');
      if (p.arrived) {
        SE.toast('You stamp the snow off your boots and step inside. Waffles pads in after you.', '#ffe6b8');
        setTimeout(() => { if (SE.sceneName === 'chapel') SE.audio.sfx('door'); }, 200);
      }
    },
    update(dt) {
      SE.audio.setAmbience({ wind: 0.25 + SE.weather.wind / 90, storm: SE.weather.stormy() ? 0.5 : 0, muffled: true, fire: 0.08 });
    },
    draw(ctx, dt) {
      s.t += dt;
      s.bell = Math.max(0, s.bell - dt);
      // just watching: he stays quietly in the chapel

      // 1 background, then the window (night, storm and snowfall seen through the glass)
      SE.drawImg('bg_chapel', 0, 0);
      drawWindow(ctx);
      SE.weather.interior(ctx);
      drawBird(ctx, dt);

      // 2 environment animation: candlelight and dust drifting in the cool window light
      const night = SE.weather.night();
      for (const [i, f] of FLAMES.entries()) {
        const flick = 0.8 + 0.1 * Math.sin(SE.time * (8 + i) + i * 2) + 0.07 * Math.sin(SE.time * 17.3 + i) + 0.04 * Math.random();
        SE.glow(ctx, f.x, f.y + 4, 46 * flick, '255,170,90', (0.13 + night * 0.12) * flick);
        SE.glow(ctx, f.x, f.y, 7 * flick, '255,230,160', 0.45 * flick);
      }
      drawMotes(ctx, dt, night);
      drawVotives(ctx, dt);

      // 3 ground shadows, 4 characters
      SE.drawDogRest(DOG.x, DOG.y, { flip: true, seed: 2 });
      drawTraveler(ctx, dt);

      // warm vignette, darker toward the back of the chapel
      const v = ctx.createRadialGradient(390, 170, 60, SE.W / 2, SE.H / 2, 320);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(24,10,18,0.5)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, SE.W, SE.H);

      drawVerse(ctx, dt);
      if (!SE.watching() && s.mode === 'stand' && hotspot(BIBLE, 'Read from the Bible')) {
        s.reading = { v: SE.pick(VERSES), t: 0 };
        SE.audio.sfx('soft');
      }
      drawControls(ctx);
      const subtitle = `prayers: ${SE.save.prayers || 0} · candles lit: ${SE.save.candles || 0}`;
      SE.hud.draw(ctx, { title: 'Little Chapel', subtitle, map: true });
    },
  });

  // ------------------------------------------------------------ the arched window
  function archPath(ctx) {
    const r = WIN.w / 2, cx = WIN.x + r;
    ctx.beginPath();
    ctx.moveTo(WIN.x, WIN.y + WIN.h);
    ctx.lineTo(WIN.x, WIN.spring);
    ctx.ellipse(cx, WIN.spring, r, WIN.spring - WIN.y, 0, Math.PI, 0);
    ctx.lineTo(WIN.x + WIN.w, WIN.y + WIN.h);
    ctx.closePath();
  }
  function drawWindow(ctx) {
    const n = SE.weather.night();
    ctx.save();
    archPath(ctx); ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(60,70,150,${0.1 + 0.5 * n})`;
    ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    ctx.globalCompositeOperation = 'source-over';
    if (SE.weather.fog > 0.05) { ctx.fillStyle = `rgba(220,226,240,${SE.weather.fog})`; ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h); }
    ctx.restore();
    SE.weather.draw(ctx, { clip: [{ x: WIN.x + 1, y: WIN.spring - 8, w: WIN.w - 2, h: WIN.y + WIN.h - WIN.spring + 6 }], density: 0.75, windScale: 0.6 });
  }

  // dust motes floating through the light from the window
  function newMote(anywhere) {
    return { x: SE.rand(60, 170), y: anywhere ? SE.rand(80, 230) : SE.rand(70, 120), v: SE.rand(2, 5), p: Math.random() * 6, life: SE.rand(8, 16), t: anywhere ? SE.rand(0, 8) : 0 };
  }
  function drawMotes(ctx, dt, night) {
    // the beam slants from the window down to the right
    const inBeam = (x, y) => y > 60 + (x - 70) * 0.55 && y < 190 + (x - 70) * 0.4 && x > 70 && x < 190;
    for (const m of s.motes) {
      m.t += dt;
      m.y += m.v * dt * 0.5; m.x += Math.sin(s.t * 0.4 + m.p) * dt * 1.5 + dt;
      if (m.t > m.life || m.x > 200 || m.y > 250) Object.assign(m, newMote(false));
      if (!inBeam(m.x, m.y)) continue;
      const a = Math.sin(Math.PI * Math.min(1, m.t / m.life)) * (0.35 + 0.25 * Math.sin(s.t * 2 + m.p)) * (1 - night * 0.4);
      ctx.fillStyle = `rgba(220,232,255,${a})`;
      ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
    }
  }

  // ------------------------------------------------------------ votive candles along the step
  function drawVotives(ctx, dt) {
    const y = 160;
    for (let i = s.votives.length - 1; i >= 0; i--) {
      const c = s.votives[i];
      c.t += dt;
      if (c.t > c.life) { s.votives.splice(i, 1); continue; }
      const h = Math.max(2, Math.round(6 * (1 - c.t / c.life)));
      const x = Math.round(c.x);
      ctx.fillStyle = 'rgba(30,14,10,0.45)'; ctx.fillRect(x - 2, y, 6, 1);
      ctx.fillStyle = '#f2e6cc'; ctx.fillRect(x, y - h, 2, h);
      ctx.fillStyle = '#c9b48f'; ctx.fillRect(x + 1, y - h, 1, h);
      const fl = 0.8 + 0.2 * Math.sin(SE.time * 11 + i * 1.7);
      ctx.fillStyle = '#ffd166'; ctx.fillRect(x, y - h - 2, 2, 2);
      ctx.fillStyle = '#fff4c2'; ctx.fillRect(x, y - h - 3, 1, 1);
      SE.glow(ctx, x + 1, y - h - 2, 12 * fl, '255,190,110', 0.22 * fl);
    }
  }

  // ------------------------------------------------------------ the traveler
  function drawTraveler(ctx, dt) {
    const name = prayAnim();
    // a soft contact shadow on the step, wider when he kneels
    const low = s.mode === 'pray' || s.mode === 'kneel' ? 1 : 0;
    ctx.fillStyle = 'rgba(30,12,10,0.35)';
    ctx.beginPath(); ctx.ellipse(KNEEL.x, KNEEL.y, 9 + low * 4, 2, 0, 0, Math.PI * 2); ctx.fill();
    if (!name) { SE.drawActorFallback(ctx, KNEEL.x - 7, KNEEL.y - 36, '#8a5a34'); advance(dt, 0); return; }
    const a = SE.anims[name], sz = SE.animSize(name), hold = holdFrom();
    const fps = 5;
    let frame = 0;
    if (s.mode === 'kneel') {
      s.k += dt * fps;
      frame = Math.min(a.frames - 1, Math.floor(s.k));
      if (s.k >= a.frames - 1) s.mode = 'pray';
    } else if (s.mode === 'pray') {
      // slow breathing across the held frames
      const n = a.frames - hold, cyc = n * 2 - 2 || 1;
      let f = Math.floor(s.t * 1.6) % cyc; if (f >= n) f = cyc - f;
      frame = hold + f;
      advance(dt, 1);
    } else if (s.mode === 'rise') {
      s.k -= dt * fps * 1.2;
      frame = Math.max(0, Math.floor(s.k));
      if (s.k <= 0) { s.mode = 'stand'; s.k = 0; }
    }
    SE.drawAnim(name, Math.round(KNEEL.x - sz.w / 2), Math.round(KNEEL.y - sz.h + footPad(name)), 0, { frame });
  }
  // the PixelLab canvas leaves empty rows under the boots; measured once from the image
  const pads = {};
  function footPad(name) {
    if (pads[name] != null) return pads[name];
    const a = SE.anims[name], img = SE.images[a.img];
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width / a.frames, img.height).data;
    let bottom = img.height - 1;
    outer: for (; bottom > 0; bottom--) for (let x = 0; x < img.width / a.frames; x++) if (d[(bottom * (img.width / a.frames) + x) * 4 + 3] > 0) break outer;
    return (pads[name] = img.height - 1 - bottom);
  }
  function advance(dt, praying) {
    if (!praying) return;
    s.prayT += dt;
    if (!s.prayed && s.prayT > PRAY_LEN) {
      s.prayed = true;
      SE.save.prayers = (SE.save.prayers || 0) + 1; SE.persist();
      SE.audio.sfx('chime');
      SE.toast(SE.pick(['Amen. The quiet settles over you like fresh snow.', 'Amen. Your heart feels a little lighter.', 'Amen. Waffles sighs contentedly by the pews.']), '#ffe6b8');
    }
    if (s.prayT > PRAY_LEN + 10) { s.prayT = 0; s.prayed = false; s.verse = SE.pick(VERSES.filter((v) => v !== s.verse)); s.verseT = 0; }
  }

  // ------------------------------------------------------------ verses
  function drawVerse(ctx, dt) {
    let v = null, a = 0;
    if ((s.mode === 'pray' || s.mode === 'kneel') && s.verse) {
      s.verseT += dt;
      v = s.verse;
      a = Math.min(1, Math.max(0, (s.verseT - 2) / 2.5)) * Math.min(1, Math.max(0, (PRAY_LEN + 8 - s.prayT) / 2.5));
    } else if (s.reading) {
      s.reading.t += dt;
      v = s.reading.v;
      a = Math.min(1, s.reading.t * 2) * Math.min(1, Math.max(0, (9 - s.reading.t) / 1.5));
      if (s.reading.t > 9 || s.mode !== 'stand') s.reading = null;
    }
    if (!v || a <= 0) return;
    const lines = SE.wrap(v[0], 230, 9);
    const h = lines.length * 12 + 22, w = 250, x = SE.W / 2 - w / 2 - 20, y = 52;
    SE.panel(x, y, w, h, { alpha: a * 0.85, fill: 'rgba(40,26,34,0.82)' });
    lines.forEach((l, i) => SE.text(l, x + w / 2, y + 7 + i * 12, { align: 'center', size: 9, color: '#fff3dc', alpha: a }));
    SE.text(v[1], x + w / 2, y + h - 12, { align: 'center', size: 7, color: '#e8bd86', alpha: a });
  }

  // ------------------------------------------------------------ the cardinal at the window
  function drawBird(ctx, dt) {
    const b = s.bird;
    b.t += dt;
    if (b.state === 'away') {
      b.next -= dt;
      if (b.next <= 0) { b.state = 'in'; b.t = 0; b.x = WIN.x - 14; b.y = LEDGE.y - 30; b.stay = SE.rand(8, 16); }
      return;
    }
    ctx.save();
    archPath(ctx); ctx.clip();
    if (b.state === 'in') {
      const k = Math.min(1, b.t / 1.4);
      b.x = WIN.x - 14 + (LEDGE.x - WIN.x + 14) * SE.ease(k); b.y = LEDGE.y - 30 * (1 - SE.ease(k)) - Math.sin(k * Math.PI) * 6;
      if (SE.anims.bird_fly) SE.drawAnim('bird_fly', b.x - 10, b.y - 14, b.t * 1.4, {});
      if (k >= 1) { b.state = 'perch'; b.t = 0; }
    } else if (b.state === 'perch') {
      const pecking = Math.sin(b.t * 0.9) > 0.2;
      if (SE.anims.bird_peck) SE.drawAnim('bird_peck', b.x - 10, b.y - 17, pecking ? b.t * 1.1 : 0, { frame: pecking ? undefined : 0 });
      if (b.t > b.stay) { b.state = 'out'; b.t = 0; }
    } else if (b.state === 'out') {
      b.x += 34 * dt; b.y -= 22 * dt;
      if (SE.anims.bird_fly) SE.drawAnim('bird_fly', b.x - 10, b.y - 14, b.t * 1.4, {});
      if (b.t > 2.5) { b.state = 'away'; b.next = SE.rand(50, 110); }
    }
    ctx.restore();
  }

  // ------------------------------------------------------------ buttons & hotspots
  function drawControls() {
    if (SE.watching()) return;
    const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
    const by = SE.H - 24;
    const kneeling = s.mode !== 'stand';
    const items = [
      [kneeling ? 'Stand up' : 'Kneel and pray', 84, () => (kneeling ? standUp() : startPrayer()), { active: kneeling }],
      ['Light a candle', 76, () => lightCandle(false), {}],
      ['Ring the bell', 70, () => ringBell(false), { active: s.bell > 0 }],
    ];
    let x = SE.W - 6 - items.reduce((sum, i) => sum + i[1] + 4, 0);
    for (const [label, w, cb, o] of items) { if (SE.button(x, by, w, 18, label, Object.assign({ alpha: kneeling ? 1 : a }, o))) cb(); x += w + 4; }
    if (SE.sceneTime < 10 && s.mode === 'stand') SE.text('Tip: click the open Bible on the altar to read a verse', 8, SE.H - 40, { size: 7, color: '#ffe6b8', alpha: Math.min(1, 10 - SE.sceneTime) * a });
  }
  function hotspot(r, label) {
    if (SE.modal || !SE.inRect(SE.mouse.x, SE.mouse.y, r)) return false;
    SE.cursor = 'pointer';
    const w = SE.measure(label, 7) + 10;
    SE.panel(r.x + r.w / 2 - w / 2, r.y - 14, w, 12);
    SE.text(label, r.x + r.w / 2, r.y - 12, { align: 'center', size: 7, color: '#ffe6b8' });
    if (SE.mouse.released) { SE.mouse.released = false; return true; }
    return false;
  }
})();
