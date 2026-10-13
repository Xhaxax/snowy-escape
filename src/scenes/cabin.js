// The cabin living room: fire, couch + cocoa + Mochi on your lap, petting Waffles and Mochi.
'use strict';

(function () {
  const WINDOWS = [{ x: 265, y: 66, w: 78, h: 64 }, { x: 443, y: 58, w: 34, h: 104 }];
  const POS = {
    dog: { x: 120, y: 254 },  // Waffles on the rug in front of the fire
    cat: { x: 292, y: 134 },  // Mochi on the windowsill, watching the snow
    fire: { x: 76, y: 150, w: 56, h: 66 },
    couch: { x: 250, y: 197 }, // traveler sitting on the couch
  };
  // where Mochi can be in the living room, and the jumps between those spots
  const CAT_SURF = { sill: [266, 340, 134], couchBack: [236, 350, 142], couch: [212, 365, 166], coffee: [278, 292, 200], shelf: [198, 234, 68], table: [408, 428, 171], rug: [200, 300, 256] };
  const CAT_LINKS = [['rug', 'couch'], ['couch', 'couchBack'], ['couchBack', 'sill'], ['couch', 'coffee'], ['coffee', 'rug'], ['rug', 'table'], ['couchBack', 'shelf']];
  let mochi = null;
  let mode = 'room', pet = null, sip = 0, sips = 0, drink = 'cocoa', steam = [], idleHint = 0;

  function bottomOf(anim, x, y) { const s = SE.animSize(anim); return { x: Math.round(x), y: Math.round(y - s.h), w: s.w, h: s.h }; }

  function startPet(kind) {
    mode = kind === 'dog' ? 'petDog' : 'petCat';
    pet = SE.PetCloseup(kind === 'dog'
      ? { anim: 'dog_happy', name: 'Waffles', kind: 'dog', scale: 3, doneText: 'Waffles rolls over, tail thumping the rug.', onDone: () => { SE.save.petsDog++; SE.persist(); } }
      : { anim: 'cat_sit', name: 'Mochi', kind: 'cat', scale: 3, doneText: 'Mochi slow-blinks at you. That means love.', onDone: () => { SE.save.petsCat++; SE.persist(); } });
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
    sv.wood--; sv.fire = Math.min(1, sv.fire + 0.45); SE.persist();
    SE.audio.sfx('whoosh'); SE.audio.sfx('chop');
    for (let i = 0; i < 14; i++) SE.spawnFloater(SE.rand(86, 120), SE.rand(180, 200), 'spark', '#ffb36b');
    if (!auto && sv.fire > 0.85) SE.celebrate('Cozy fire!', `The cabin glows warm again. ${SE.pick(SE.PROPS)}`);
    else SE.toast(auto ? 'A fresh log on the fire. Crackle, pop.' : 'The fire crackles happily.', '#ffe6b8');
    return true;
  }
  function goOutside() {
    if (SE.weather.stormy()) { SE.toast('Too stormy to go out. The fire and Mochi are right here.', '#cfe6ff'); return; }
    SE.audio.sfx('door');
    SE.go('yard');
  }

  // Watch mode: a gentle director cycles couch → pets → couch, each time a little different.
  const dir = { t: 0, dur: 0, last: null };
  function direct(dt) {
    dir.t += dt;
    const petDone = (mode === 'petDog' || mode === 'petCat') && pet.st.done && pet.st.t - pet.st.doneAt > 4;
    if (SE.save.fire < 0.4 && SE.save.wood > 0 && mode !== 'petDog' && mode !== 'petCat' && (dir.fireT = (dir.fireT || 0) + dt) > 3) { dir.fireT = 0; addLog(true); }
    if (dir.t < dir.dur && !petDone) return;
    const options = ['couch', 'couch', 'petDog', 'petCat', 'room'].filter((m) => m !== dir.last && m !== mode);
    const next = SE.pick(options);
    dir.last = next; dir.t = 0;
    if (next === 'couch') { sitDown(true); dir.dur = SE.rand(35, 55); }
    else if (next === 'room') { mode = 'room'; dir.dur = SE.rand(12, 20); }
    else { startPet(next === 'petDog' ? 'dog' : 'cat'); dir.dur = 60; }
  }

  SE.addScene('cabin', {
    enter(p) {
      SE.save.location = 'cabin';
      SE.persist();
      mode = p.mode || 'room';
      mochi = SE.Mochi(CAT_SURF, CAT_LINKS);
      SE.audio.setMusic('cabin');
      if (p.arrived) SE.toast('Home. Mochi was waiting by the door.', '#ffe6b8');
    },
    update(dt) {
      SE.audio.setAmbience({ fire: 0.2 + SE.save.fire * 0.8, wind: 0.3 + SE.weather.wind / 80, storm: SE.weather.stormy() ? 0.6 : 0, muffled: true });
    },
    draw(ctx, dt) {
      if (SE.watching()) direct(dt); else dir.t = dir.dur = 0;
      SE.drawImg('bg_living', 0, 0);
      SE.weather.windows(ctx, WINDOWS);
      SE.weather.interior(ctx);

      // fire (its size follows the fire level) + lamps that matter more at night
      const fire = SE.save.fire, night = SE.weather.night();
      const flick = 0.75 + 0.12 * Math.sin(SE.time * 9) + 0.1 * Math.sin(SE.time * 15.7) + 0.05 * Math.random();
      const fl = 0.25 + 0.75 * fire;
      if (fire < 0.3) { ctx.fillStyle = `rgba(20,10,10,${0.5 * (1 - fire / 0.3)})`; ctx.fillRect(80, 170, 46, 44); }
      SE.glow(ctx, 102, 196, (50 + 50 * fl) * flick, '255,140,60', (0.12 + 0.22 * fl + night * 0.08) * flick);
      SE.glow(ctx, 102, 200, 14 + 16 * fl, '255,210,120', 0.32 * fl * flick);
      SE.glow(ctx, 118, 96, 30, '255,200,120', 0.1 + night * 0.12);
      SE.glow(ctx, 181, 136, 34, '255,200,120', 0.12 + night * 0.14);
      if (fire > 0.1) SE.drawEmbers(ctx, 86, 196, 30, dt * fl);
      if (mode === 'room' && !SE.watching() && hotspot(POS.fire, fire < 0.35 ? `Add a log (${SE.save.wood} left) — fire is low` : `Add a log (${SE.save.wood} left)`)) addLog(false);

      // the dog dozing on the rug by the fire
      // Waffles naps on the rug by the fire, lifting his head now and then
      const r = SE.drawDogRest(POS.dog.x, POS.dog.y, {});
      if (r && mode === 'room' && !SE.watching() && hotspot(r, 'Pet Waffles')) startPet('dog');
      if (mode === 'couch') drawCouch(ctx, dt);
      else if (mochi) {
        mochi.update(dt);
        const r = mochi.draw();
        if (r && mode === 'room' && !SE.watching() && hotspot(r, 'Pet Mochi')) startPet('cat');
      }

      // warm vignette
      const v = ctx.createRadialGradient(SE.W / 2, SE.H / 2, 120, SE.W / 2, SE.H / 2, 300);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(30,12,20,0.45)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, SE.W, SE.H);

      if (mode === 'petDog' || mode === 'petCat') {
        pet.draw(ctx, dt);
        if (!SE.watching() && SE.button(SE.W / 2 - 36, SE.H - 26, 72, 18, 'All done')) mode = 'room';
        SE.hud.draw(ctx, { title: 'The Cabin', map: false });
        return;
      }

      const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
      if (mode === 'room' && !SE.watching()) {
        const by = SE.H - 24;
        const items = [
          ['Settle on the couch', 92, () => sitDown()],
          ['Kitchen', 56, () => SE.go('kitchen')],
          ['Step outside', 70, goOutside],
        ];
        let x = SE.W - 6 - items.reduce((s, i) => s + i[1] + 4, 0);
        for (const [label, w, cb] of items) { if (SE.button(x, by, w, 18, label, { alpha: a })) cb(); x += w + 4; }
        idleHint += dt;
        if (idleHint < 8) SE.text('Tip: click Waffles or Mochi to pet them', 8, SE.H - 20, { size: 7, alpha: Math.min(1, (8 - idleHint)) * a, color: '#ffe6b8' });
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

  function drawCouch(ctx, dt) {
    const r = bottomOf('couch_sit', POS.couch.x, POS.couch.y);
    if (SE.anims.couch_sit) SE.drawAnim('couch_sit', r.x, r.y, SE.time * 0.55, { pingpong: true });
    else SE.drawActorFallback(ctx, POS.couch.x + 20, POS.couch.y - 50, '#a0522d');
    // steam from the mug
    sip = Math.max(0, sip - dt);
    const mug = { x: r.x + r.w * 0.62, y: r.y + r.h * 0.42 };
    if (sips < 6 && Math.random() < dt * (sip > 0 ? 10 : 3)) steam.push({ x: mug.x + SE.rand(-2, 2), y: mug.y, t: 0 });
    for (let i = steam.length - 1; i >= 0; i--) {
      const p = steam[i];
      p.t += dt;
      if (p.t > 1.6) { steam.splice(i, 1); continue; }
      p.y -= 10 * dt;
      p.x += Math.sin(p.t * 4 + i) * 0.15;
      ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - p.t / 1.6)})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 2);
    }
    // stroke the cat on the lap
    const lap = { x: r.x + r.w * 0.2, y: r.y + r.h * 0.45, w: r.w * 0.6, h: r.h * 0.35 };
    if (!SE.modal && SE.inRect(SE.mouse.x, SE.mouse.y, lap)) {
      SE.cursor = 'grab';
      if (SE.mouse.down && SE.mouse.moved > 0) {
        SE.cursor = 'grabbing';
        if (Math.random() < 0.15) SE.spawnFloater(SE.mouse.x, SE.mouse.y - 6, 'heart');
        if (!drawCouch.purrT || SE.time > drawCouch.purrT) { drawCouch.purrT = SE.time + 2.6; SE.audio.sfx('purr'); }
      }
    }
    if (SE.watching()) {
      // sip now and then, and give Mochi a little scratch
      drawCouch.autoSip = (drawCouch.autoSip || SE.rand(5, 9)) - dt;
      if (drawCouch.autoSip <= 0) { drawCouch.autoSip = SE.rand(7, 12); sip = 0.8; SE.audio.sfx('sip'); sips = (sips + 1) % 6; }
      drawCouch.autoPet = (drawCouch.autoPet || SE.rand(3, 6)) - dt;
      if (drawCouch.autoPet <= 0) {
        drawCouch.autoPet = SE.rand(6, 11);
        SE.audio.sfx('purr');
        for (let i = 0; i < 4; i++) setTimeout(() => { if (SE.sceneName === 'cabin' && mode === 'couch') SE.spawnFloater(lap.x + lap.w * Math.random(), lap.y, 'heart'); }, i * 300);
      }
      return;
    }
    const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
    const by = SE.H - 24;
    if (SE.button(SE.W - 160, by, 70, 18, sips < 6 ? 'Take a sip' : 'Mug empty', { alpha: a, icon: 'cup' }) && sips < 6) {
      sips++; sip = 0.8; SE.audio.sfx('sip');
      if (sips === 6) SE.celebrate('Every last drop', drink === 'cocoa' ? 'Chocolatey bliss. ' + SE.pick(SE.PROPS) : 'A lovely cup of tea.');
    }
    if (SE.button(SE.W - 86, by, 80, 18, 'Get up', { alpha: a })) mode = 'room';
    if (SE.sceneTime < 10 || a > 0.5) SE.text('drag over Mochi to stroke her', 8, SE.H - 20, { size: 7, alpha: 0.8 * a, color: '#ffe6b8' });
  }
})();
