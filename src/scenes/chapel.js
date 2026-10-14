// The Little Chapel: a quiet log chapel in the valley. Kneel and pray at the altar while Waffles
// rests by the pews, light a candle, read a verse from the open Bible. Now and then
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
    ['God is our refuge and strength, a very present help in trouble.', 'Psalm 46:1'],
    ['The Lord is my light and my salvation; whom shall I fear?', 'Psalm 27:1'],
    ['Weeping may endure for a night, but joy cometh in the morning.', 'Psalm 30:5'],
    ['Create in me a clean heart, O God; and renew a right spirit within me.', 'Psalm 51:10'],
    ['He healeth the broken in heart, and bindeth up their wounds.', 'Psalm 147:3'],
    ['He maketh me to lie down in green pastures: he leadeth me beside the still waters.', 'Psalm 23:2'],
    ['The heavens declare the glory of God; and the firmament sheweth his handywork.', 'Psalm 19:1'],
    ['He shall cover thee with his feathers, and under his wings shalt thou trust.', 'Psalm 91:4'],
    ['The Lord shall preserve thy going out and thy coming in.', 'Psalm 121:8'],
    ['O give thanks unto the Lord; for he is good: for his mercy endureth for ever.', 'Psalm 136:1'],
    ['So teach us to number our days, that we may apply our hearts unto wisdom.', 'Psalm 90:12'],
    ['Thou hast made summer and winter.', 'Psalm 74:17'],
    ['Delight thyself also in the Lord; and he shall give thee the desires of thine heart.', 'Psalm 37:4'],
    ['Rest in the Lord, and wait patiently for him.', 'Psalm 37:7'],
    ['The Lord is nigh unto them that are of a broken heart.', 'Psalm 34:18'],
    ['O taste and see that the Lord is good.', 'Psalm 34:8'],
    ['I laid me down and slept; I awaked; for the Lord sustained me.', 'Psalm 3:5'],
    ['I will both lay me down in peace, and sleep: for thou, Lord, only makest me dwell in safety.', 'Psalm 4:8'],
    ['Hast thou entered into the treasures of the snow?', 'Job 38:22'],
    ['For he saith to the snow, Be thou on the earth.', 'Job 37:6'],
    ['Though your sins be as scarlet, they shall be as white as snow.', 'Isaiah 1:18'],
    ['They that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles.', 'Isaiah 40:31'],
    ['The grass withereth, the flower fadeth: but the word of our God shall stand for ever.', 'Isaiah 40:8'],
    ['Fear thou not; for I am with thee: be not dismayed; for I am thy God.', 'Isaiah 41:10'],
    ['Thou wilt keep him in perfect peace, whose mind is stayed on thee.', 'Isaiah 26:3'],
    ['Arise, shine; for thy light is come.', 'Isaiah 60:1'],
    ['His compassions fail not. They are new every morning: great is thy faithfulness.', 'Lamentations 3:22-23'],
    ['Trust in the Lord with all thine heart; and lean not unto thine own understanding.', 'Proverbs 3:5'],
    ['A merry heart doeth good like a medicine.', 'Proverbs 17:22'],
    ['To every thing there is a season, and a time to every purpose under the heaven.', 'Ecclesiastes 3:1'],
    ['He hath made every thing beautiful in his time.', 'Ecclesiastes 3:11'],
    ['Be strong and of a good courage; for the Lord thy God is with thee whithersoever thou goest.', 'Joshua 1:9'],
    ['The Lord bless thee, and keep thee: the Lord make his face shine upon thee.', 'Numbers 6:24-25'],
    ['In the beginning was the Word, and the Word was with God, and the Word was God.', 'John 1:1'],
    ['The light shineth in darkness; and the darkness comprehended it not.', 'John 1:5'],
    ['I am the light of the world: he that followeth me shall not walk in darkness.', 'John 8:12'],
    ['I am the good shepherd: the good shepherd giveth his life for the sheep.', 'John 10:11'],
    ['Let not your heart be troubled: ye believe in God, believe also in me.', 'John 14:1'],
    ['In my Father\'s house are many mansions.', 'John 14:2'],
    ['Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.', 'Matthew 7:7'],
    ['Blessed are the pure in heart: for they shall see God.', 'Matthew 5:8'],
    ['Blessed are the peacemakers: for they shall be called the children of God.', 'Matthew 5:9'],
    ['Ye are the light of the world.', 'Matthew 5:14'],
    ['Behold the fowls of the air: they sow not, neither do they reap; yet your heavenly Father feedeth them.', 'Matthew 6:26'],
    ['Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself.', 'Matthew 6:34'],
    ['With God all things are possible.', 'Matthew 19:26'],
    ['Lo, I am with you alway, even unto the end of the world.', 'Matthew 28:20'],
    ['And we know that all things work together for good to them that love God.', 'Romans 8:28'],
    ['Rejoicing in hope; patient in tribulation; continuing instant in prayer.', 'Romans 12:12'],
    ['Be kindly affectioned one to another with brotherly love.', 'Romans 12:10'],
    ['Charity suffereth long, and is kind.', '1 Corinthians 13:4'],
    ['And now abideth faith, hope, charity, these three; but the greatest of these is charity.', '1 Corinthians 13:13'],
    ['My grace is sufficient for thee: for my strength is made perfect in weakness.', '2 Corinthians 12:9'],
    ['Bear ye one another\'s burdens.', 'Galatians 6:2'],
    ['Let us not be weary in well doing: for in due season we shall reap, if we faint not.', 'Galatians 6:9'],
    ['The fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith.', 'Galatians 5:22'],
    ['Be ye kind one to another, tenderhearted, forgiving one another.', 'Ephesians 4:32'],
    ['Rejoice in the Lord alway: and again I say, Rejoice.', 'Philippians 4:4'],
    ['In every thing by prayer and supplication with thanksgiving let your requests be made known unto God.', 'Philippians 4:6'],
    ['I can do all things through Christ which strengtheneth me.', 'Philippians 4:13'],
    ['Whatsoever ye do, do it heartily, as to the Lord.', 'Colossians 3:23'],
    ['Pray without ceasing. In every thing give thanks.', '1 Thessalonians 5:17-18'],
    ['For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', '2 Timothy 1:7'],
    ['Now faith is the substance of things hoped for, the evidence of things not seen.', 'Hebrews 11:1'],
    ['Jesus Christ the same yesterday, and to day, and for ever.', 'Hebrews 13:8'],
    ['Every good gift and every perfect gift is from above.', 'James 1:17'],
    ['Draw nigh to God, and he will draw nigh to you.', 'James 4:8'],
    ['He that loveth not knoweth not God; for God is love.', '1 John 4:8'],
  ];
  SE.VERSES = VERSES; // the cabin Bible reads from the same verses
  // what he prays over: the passages he studied by the cabin fire (noted in the notebook),
  // or any verse if he hasn't read there yet
  function prayVerse(prev) {
    const studied = (SE.save.verses || []).filter((v) => Array.isArray(v) && v[0]);
    const pool = studied.length ? studied : VERSES;
    const fresh = pool.filter((v) => !prev || v[1] !== prev[1]);
    return SE.pick(fresh.length ? fresh : pool);
  }
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
  // trav_pray (96px PixelLab frames, like the woodlot chop): 0 standing bareheaded with the beanie in
  // hand, 1-11 kneeling down, 11-17 the held prayer pose breathing, 18-26 looking up to the cross; his feet sit at x 40 of the frame
  const PRAY_HOLD = 11, PRAY_AX = 40;
  // frames LOOK_FROM.. : still kneeling, he raises his eyes to the cross, rests there, bows again
  const LOOK_FROM = 18, LOOK_PEAK = 4, LOOK_REST = 3.5;
  function lookFrame(dt, a) {
    const n = a.frames - LOOK_FROM;
    if (n <= 0) return null;
    if (s.look == null) {
      s.lookIn = (s.lookIn == null ? SE.rand(8, 16) : s.lookIn) - dt;
      if (s.lookIn > 0) return null;
      s.look = 0; s.lookIn = null;
    }
    s.look += dt;
    const fps = 4, up = LOOK_PEAK / fps;
    let i;
    if (s.look < up) i = Math.floor(s.look * fps);
    else if (s.look < up + LOOK_REST) i = LOOK_PEAK;
    else i = LOOK_PEAK + Math.floor((s.look - up - LOOK_REST) * fps);
    if (i >= n) { s.look = null; s.lookIn = SE.rand(18, 40); return null; }
    return LOOK_FROM + i;
  }
  function holdFrom() { const a = SE.anims.trav_pray; return a ? Math.min(PRAY_HOLD, a.frames - 1) : 0; }

  function startPrayer() {
    if (s.mode !== 'stand') return;
    // before kneeling he lights a candle if none is burning: a little light to pray by
    if (!s.votives.length) lightCandle(true);
    if (!SE.watching()) SE.moment('pray'); // kneeling at the altar, hands folded
    s.mode = 'kneel'; s.k = 0; s.prayT = 0; s.prayed = false; s.look = null; s.lookIn = null;
    s.verse = prayVerse(s.verse);
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


  // Watch mode: a slow film — light a candle, pray for a long while, rise.
  function direct(dt) {
    s.dirT -= dt;
    if (s.dirT > 0) return;
    if (s.mode === 'stand') {
      if (Math.random() < 0.35) lightCandle(true);
      startPrayer();
      s.dirT = SE.rand(55, 85);
    } else if (s.mode === 'pray') {
      // he stays kneeling: now and then another little candle, but he doesn't get up
      if (Math.random() < 0.25) lightCandle(true);
      s.dirT = SE.rand(60, 120);
    } else s.dirT = 2;
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
      // by day the slanting beam from the window is warm sunlight rather than cold moonlight
      { const dayK = 1 - SE.weather.night();
        if (dayK > 0.02) {
          ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.35 * dayK;
          ctx.fillStyle = '#ffd9a0';
          ctx.beginPath(); ctx.moveTo(62, 56); ctx.lineTo(196, 128); ctx.lineTo(196, 242); ctx.lineTo(62, 190); ctx.closePath(); ctx.fill();
          ctx.restore();
        } }
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
    // by day the glass shows daylight, not the painted night
    const day = SE.weather.dayGlass(ctx, WIN);
    if (day && n < 0.98) { ctx.globalAlpha = 1 - n; ctx.drawImage(day, WIN.x, WIN.y); ctx.globalAlpha = 1; }
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(60,70,150,${0.5 * n})`;
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
      ctx.fillStyle = night > 0.5 ? `rgba(220,232,255,${a})` : `rgba(255,240,205,${a})`;
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
      frame = Math.min(hold, Math.floor(s.k));
      if (s.k >= hold) s.mode = 'pray';
    } else if (s.mode === 'pray') {
      // slow breathing across the held frames; every so often he lifts his head to the cross
      const n = LOOK_FROM - hold, cyc = n * 2 - 2 || 1;
      let f = Math.floor(s.t * 2.4) % cyc; if (f >= n) f = cyc - f;
      frame = hold + f;
      const lf = lookFrame(dt, a);
      if (lf != null) frame = lf;
      advance(dt, 1);
    } else if (s.mode === 'rise') {
      s.k -= dt * fps * 1.2;
      frame = Math.max(0, Math.floor(s.k));
      if (s.k <= 0) { s.mode = 'stand'; s.k = 0; }
    }
    SE.drawAnim(name, Math.round(KNEEL.x - PRAY_AX), Math.round(KNEEL.y - sz.h + footPad(name)), 0, { frame });
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
    if (s.prayT > PRAY_LEN + 10) { s.prayT = 0; s.prayed = false; s.verse = prayVerse(s.verse); s.verseT = 0; }
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
