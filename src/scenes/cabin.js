// The cabin living room: fire, couch + cocoa + Mochi on your lap, petting Waffles and Mochi.
'use strict';

(function () {
  const WINDOWS = [{ x: 265, y: 66, w: 78, h: 64 }, { x: 443, y: 58, w: 34, h: 104 }]; // big window + the tall side window
  const POS = {
    dog: { x: 120, y: 254 },  // Waffles on the rug in front of the fire
    cat: { x: 292, y: 134 },  // Mochi on the windowsill, watching the snow
    fire: { x: 76, y: 150, w: 56, h: 66 },
    couch: { x: 250, y: 197 }, // traveler sitting on the couch
  };
  // where Mochi can be in the living room, and the jumps between those spots
  // (cat spots, not the middle of the couch: the armrests, the corner of the couch back, the sill)
  const CAT_SURF = { sill: [262, 336, 134], armL: [203, 209, 167], armR: [365, 371, 170], couchBack: [222, 232, 146], coffee: [318, 326, 202], shelf: [198, 234, 68], shelfR: [416, 432, 177], rug: [212, 300, 256] }; // paw heights measured on bg_living // the rug starts past Waffles (120–184)
  const CAT_LINKS = [['rug', 'armL'], ['armL', 'couchBack'], ['couchBack', 'sill'], ['couchBack', 'shelf'], ['rug', 'armR'], ['armR', 'sill'], ['rug', 'coffee'], ['armR', 'shelfR']];
  let mochi = null;
  const dir = { t: 0, dur: 0 }; // (kept for the petting callbacks)
  let mode = 'room', sip = 0, sips = 0, drink = 'cocoa', steam = [], idleHint = 0;

  function bottomOf(anim, x, y) { const s = SE.animSize(anim); return { x: Math.round(x), y: Math.round(y - s.h), w: s.w, h: s.h }; }

  // Petting is a little cutscene: two close-up stills (out of three per pet), purring or a happy
  // thump of the tail carrying it; no minigame.
  function startPet(kind) {
    mode = 'busy';
    SE.petMoment(kind, () => {
      mode = 'room';
      if (kind === 'dog') SE.save.petsDog++; else SE.save.petsCat++;
      SE.ach.note('pet', kind === 'dog' ? 'dog' : 'cat');
      SE.persist();
      SE.toast(kind === 'dog' ? 'Waffles sighs happily and flops back onto the rug.' : 'Mochi slow-blinks at you. That means love.', '#ffe6b8');
      dir.dur = 0;
    });
  }

  // The Bible on the coffee table: a chapter by the fire, a verse noted in the notebook
  const BIBLE = { x: 296, y: 194, w: 32, h: 16 };
  function readBible() {
    mode = 'busy';
    const [text, ref] = SE.pick(SE.VERSES || [['Be still, and know that I am God.', 'Psalm 46:10']]);
    SE.MOMENTS.bible = [
      { img: 'cut/bible_read', dur: 4.2, text: 'A chapter by the fire, and a few notes in the margin.', pan: 1, sounds: [[0.3, 'bible'], [1.8, 'bible'], [2.6, 'scribble']] },
      { black: 3.6, text: `“${text}” — ${ref}`, sounds: [[0.4, 'soft'], [2.6, 'bible']] },
    ];
    SE.moment('bible', { force: true, then: () => {
      mode = 'room';
      const sv = SE.save;
      sv.bibleReads = (sv.bibleReads || 0) + 1; SE.ach.note('bible');
      sv.verses = (sv.verses || []).filter((v) => v[1] !== ref).concat([[text, ref]]).slice(-24);
      SE.persist();
      SE.toast(`Noted in the notebook: ${ref}`, '#ffe6b8');
      dir.dur = 0;
    } });
  }

  function sitDown(auto) {
    mode = 'couch';
    sips = 0;
    if (auto) { drink = 'cocoa'; return; } // watch-mode loop: there is always cocoa
    if (SE.save.cocoa > 0) {
      SE.save.cocoa--; drink = 'cocoa'; SE.persist();
      SE.toast('You sink into the couch with a hot chocolate.', '#ffe6b8');
    } else {
      drink = 'tea';
      SE.toast('No cocoa left — a warm cup of tea will do. (The kitchen can fix that.)');
    }
  }

  function addLog(auto) {
    const sv = SE.save;
    if (sv.wood <= 0) { SE.toast('No firewood left — chop some out in the yard.', '#cfe6ff'); return false; }
    if (sv.fire > 0.92) { SE.toast('The fire is already roaring happily.'); return false; }
    // a cold hearth has to be laid and lit again: a little cutscene of his hands at the grate
    if (sv.fire < 0.08 && !auto && SE.img('cut/fire_lay')) {
      sv.wood--; SE.persist(); mode = 'busy';
      SE.moment('fireStart', { force: true, then: () => {
        mode = 'room'; sv.fire = 0.55; SE.persist();
        SE.celebrate('The fire is going again!', `Warm in a minute. ${SE.pick(SE.PROPS)}`);
      } });
      return true;
    }
    sv.wood--; sv.fire = Math.min(1, sv.fire + 0.45); SE.persist(); SE.ach.note('fire');
    SE.audio.sfx('whoosh'); SE.audio.sfx('chop');
    for (let i = 0; i < 14; i++) SE.spawnFloater(SE.rand(86, 120), SE.rand(180, 200), 'spark', '#ffb36b');
    if (!auto && sv.fire > 0.85) SE.celebrate('Cozy fire!', `The cabin glows warm again. ${SE.pick(SE.PROPS)}`);
    else SE.toast(auto ? 'A fresh log on the fire. Crackle, pop.' : 'The fire crackles happily.', '#ffe6b8');
    return true;
  }
  // the front door is in the entrance hall now
  function goOutside() { SE.go('hall', {}); }

  SE.addScene('cabin', {
    enter(p) {
      SE.save.location = 'cabin';
      SE.persist();
      mode = p.mode || 'room';
      mochi = SE.Mochi(CAT_SURF, CAT_LINKS);
      SE.audio.setMusic('cabin');
      SE.audio.woodSteps(p.arrived || p.from === 'yard' || p.inDoor ? 2 : 3);
      if (p.arrived) SE.toast('Home. Mochi was waiting by the door.', '#ffe6b8');
      // coming in from outside: the front door is still swinging shut behind you
      // the first time in the cabin after dark each day, he lights the lantern (a little moment)
      if (SE.weather.night() > 0.5 && SE.save.lanternDay !== SE.save.day) { SE.save.lanternDay = SE.save.day; SE.persist(); setTimeout(() => { if (SE.sceneName === 'cabin') SE.moment('lantern'); }, 700); }
    },
    update(dt) {
      SE.audio.setAmbience({ fire: 0.2 + SE.save.fire * 0.8, wind: 0.3 + SE.weather.wind / 80, storm: SE.weather.stormy() ? 0.6 : 0, muffled: true });
    },
    draw(ctx, dt) {
      // just watching: he settles on the couch and stays there (no errands of his own)
      if (SE.watching() && mode === 'room' && !SE.momentPlaying()) sitDown(true);
      SE.drawImg('bg_living', 0, 0);
      if (mode === 'couch') drawCouchArt(ctx);
      SE.weather.windows(ctx, WINDOWS);
      // Waffles and Mochi are part of the room: drawn before the night falls over it, so after dark
      // they sink into the dusk like the furniture and only the firelight picks them out
      const dogR = SE.drawDogRest(POS.dog.x, POS.dog.y, {});
      let catR = null;
      if (mode !== 'couch' && mochi) { mochi.update(dt); catR = mochi.draw(); }
      {
        // after dark the fire and the reading lamp carve their light out of the room; the rest goes dim
        const f0 = 0.25 + 0.75 * SE.save.fire, fk = 0.9 + 0.08 * Math.sin(SE.time * 9);
        SE.weather.interior(ctx, [
          { x: 102, y: 196, r: 110 + 120 * f0, k: SE.save.fire > 0.05 ? (0.45 + 0.5 * f0) * fk : 0.15 },
          { x: 181, y: 136, r: 90, k: 0.75 },
        ]);
      }
      if (mode === 'room' && !SE.watching() && hotspot(BIBLE, 'Read the Bible')) readBible();

      // fire (its size follows the fire level) + lamps that matter more at night
      const fire = SE.save.fire, night = SE.weather.night();
      const flick = 0.75 + 0.12 * Math.sin(SE.time * 9) + 0.1 * Math.sin(SE.time * 15.7) + 0.05 * Math.random();
      const fl = 0.25 + 0.75 * fire;
      if (fire < 0.3) { ctx.fillStyle = `rgba(20,10,10,${0.5 * (1 - fire / 0.3)})`; ctx.fillRect(80, 170, 46, 44); }
      SE.glow(ctx, 102, 196, (50 + 50 * fl) * flick, '255,140,60', (0.12 + 0.22 * fl + night * 0.08) * flick);
      SE.glow(ctx, 102, 200, 14 + 16 * fl, '255,210,120', 0.32 * fl * flick);
      SE.glow(ctx, 181, 136, 34, '255,200,120', 0.12 + night * 0.14);
      if (fire > 0.1) SE.drawEmbers(ctx, 86, 196, 30, dt * fl);
      if (mode === 'room' && !SE.watching() && hotspot(POS.fire, fire < 0.35 ? `Add a log (${SE.save.wood} left) — fire is low` : `Add a log (${SE.save.wood} left)`)) addLog(false);

      // the dog dozing on the rug by the fire
      // Waffles naps on the rug by the fire, lifting his head now and then
      if (dogR && mode === 'room' && !SE.watching() && hotspot(dogR, 'Pet Waffles')) startPet('dog');
      if (mode === 'couch') drawCouch(ctx, dt);
      else if (catR && mode === 'room' && !SE.watching() && hotspot(catR, 'Pet Mochi')) startPet('cat');


      // warm vignette
      const v = ctx.createRadialGradient(SE.W / 2, SE.H / 2, 120, SE.W / 2, SE.H / 2, 300);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(30,12,20,0.45)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, SE.W, SE.H);

      if (mode === 'busy') { SE.hud.draw(ctx, { title: 'The Cabin', map: false }); return; }

      const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
      if (mode === 'room' && !SE.watching()) {
        const by = SE.H - 24;
        const items = [
          ['Settle on the couch', 92, () => sitDown()],
          ['Read the Bible', 78, readBible],
          ['Kitchen', 52, () => SE.go('kitchen')],
          ['Bedroom', 52, () => SE.go('bedroom')],
          ['Entrance', 56, goOutside],
        ];
        let x = SE.W - 6 - items.reduce((s, i) => s + i[1] + 4, 0);
        for (const [label, w, cb] of items) { if (SE.button(x, by, w, 18, label, { alpha: a })) cb(); x += w + 4; }
        idleHint += dt;
        if (idleHint < 8) SE.text('Tip: click Waffles, Mochi or the Bible', 8, SE.H - 36, { size: 7, alpha: Math.min(1, (8 - idleHint)) * a, color: '#ffe6b8' });
      }
      const fireWord = SE.save.fire > 0.7 ? 'roaring' : SE.save.fire > 0.35 ? 'cozy' : SE.save.fire > 0.1 ? 'getting low' : 'embers';
      SE.hud.draw(ctx, { title: 'The Cabin', subtitle: `fire: ${fireWord} · firewood: ${SE.save.wood} · cocoa: ${SE.save.cocoa}`, map: false });
    },
  });

  function hotspot(r, label) {
    if (SE.modal) return false;
    const over = SE.inRect(SE.mouse.x, SE.mouse.y, r);
    if (over) {
      SE.cursor = 'pointer';
      const w = SE.measure(label, 7) + 10;
      SE.panel(r.x + r.w / 2 - w / 2, r.y - 14, w, 12);
      SE.text(label, r.x + r.w / 2, r.y - 12, { align: 'center', size: 7, color: '#ffe6b8' });
      if (SE.mouse.released) { SE.mouse.released = false; SE.audio.sfx('pop'); return true; }
    }
    return false;
  }

  // On the couch: a PixelLab painting of him leaning back on the left cushion, coat and boots off
  // (the boots stand on the rug, his wool socks up on the seat), Mochi asleep on his lap. It is laid
  // over the room (couch_scene, the changed pixels only), and a sip is a short animation of him
  // lifting the mug to his lips (couch_sip) over the same spot.
  const COUCH = { x: 176, y: 16 }, SIP = { x: 212, y: 104 }, SIP_LEN = 2.4;
  function drawCouchArt(ctx) {
    const img = SE.img('couch_scene');
    if (!img) return;
    ctx.drawImage(img, COUCH.x, COUCH.y);
    if (sip > 0 && SE.anims.couch_sip) {
      const a = SE.anims.couch_sip, frame = Math.min(a.frames - 1, Math.floor((SIP_LEN - sip) / SIP_LEN * a.frames));
      SE.drawAnim('couch_sip', SIP.x, SIP.y, 0, { frame });
    }
  }
  function takeSip() { sip = SIP_LEN; setTimeout(() => SE.audio.sfx('sip'), 700); }
  function drawCouch(ctx, dt) {
    SE.headphones(ctx, 241, 113);
    if (!SE.img('couch_scene')) SE.drawActorFallback(ctx, POS.couch.x + 20, POS.couch.y - 50, '#a0522d');
    // steam from the mug while it rests in his hands
    sip = Math.max(0, sip - dt);
    const mug = { x: 262, y: 139 };
    if (sips < 6 && sip <= 0 && Math.random() < dt * 3) steam.push({ x: mug.x + SE.rand(-2, 2), y: mug.y, t: 0 });
    for (let i = steam.length - 1; i >= 0; i--) {
      const p = steam[i];
      p.t += dt;
      if (p.t > 1.6 || sip > 0) { steam.splice(i, 1); continue; }
      p.y -= 10 * dt;
      p.x += Math.sin(p.t * 4 + i) * 0.15;
      ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - p.t / 1.6)})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 2);
    }
    // stroke the cat on the lap
    const lap = { x: 264, y: 152, w: 36, h: 18 };
    if (!SE.modal && SE.inRect(SE.mouse.x, SE.mouse.y, lap)) {
      SE.cursor = 'grab';
      if (SE.mouse.down && SE.mouse.moved > 0) {
        SE.cursor = 'grabbing';
        if (Math.random() < 0.04) SE.spawnFloater(SE.mouse.x, SE.mouse.y - 6, 'heart');
        if (!drawCouch.purrT || SE.time > drawCouch.purrT) { drawCouch.purrT = SE.time + 2.6; SE.audio.sfx('purr'); }
      }
    }
    if (SE.watching()) {
      // sip now and then, and give Mochi a little scratch
      drawCouch.autoSip = (drawCouch.autoSip || SE.rand(5, 9)) - dt;
      if (drawCouch.autoSip <= 0) { drawCouch.autoSip = SE.rand(7, 12); takeSip(); sips = (sips + 1) % 6; }
      drawCouch.autoPet = (drawCouch.autoPet || SE.rand(3, 6)) - dt;
      if (drawCouch.autoPet <= 0) {
        drawCouch.autoPet = SE.rand(6, 11);
        SE.audio.sfx('purr');
        for (let i = 0; i < 1; i++) setTimeout(() => { if (SE.sceneName === 'cabin' && mode === 'couch') SE.spawnFloater(lap.x + lap.w * Math.random(), lap.y, 'heart'); }, i * 300);
      }
      return;
    }
    const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
    const by = SE.H - 24;
    if (SE.button(SE.W - 160, by, 70, 18, sips < 6 ? 'Take a sip' : 'Mug empty', { alpha: a, icon: 'cup' }) && sips < 6 && sip <= 0) {
      sips++; takeSip();
      if (sips === 6) SE.celebrate('Every last drop', drink === 'cocoa' ? 'Chocolatey bliss. ' + SE.pick(SE.PROPS) : 'A lovely cup of tea.');
    }
    if (SE.button(SE.W - 86, by, 80, 18, 'Get up', { alpha: a })) mode = 'room';
    if (SE.sceneTime < 10 || a > 0.5) SE.text('drag over Mochi to stroke her', 8, SE.H - 20, { size: 7, alpha: 0.8 * a, color: '#ffe6b8' });
  }
})();
