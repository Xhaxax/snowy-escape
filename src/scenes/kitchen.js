// Kitchen: hot chocolate and cooking your catch. Both are told as little cutscenes (stills, the frying
// pan, sound), Coffee Talk style: you choose what to make, the kitchen does the rest.
'use strict';

(function () {
  const WINDOWS = [{ x: 258, y: 52, w: 74, h: 70 }, { x: 37, y: 44, w: 42, h: 92 }];
  let mode = 'idle', steam = [];

  // ------------------------------------------------------------ hot chocolate & cooking: cutscenes
  function startCocoa(mug) {
    mode = 'busy';
    const m = mug || SE.MUGS[0];
    const beats = SE.MOMENTS.cocoaMake;
    beats[3].img = m.id ? 'cut/cocoa_pour_' + m.id : 'cut/cocoa_pour';
    beats[3].text = m.line;
    SE.moment('cocoaMake', { force: true, then: () => {
      mode = 'idle';
      const sv = SE.save;
      sv.cocoa++; sv.dishes['Hot Chocolate'] = (sv.dishes['Hot Chocolate'] || 0) + 1;
      sv.mugsUsed = sv.mugsUsed || {}; sv.mugsUsed[m.id || 'red'] = true;
      SE.persist();
      SE.celebrate('Hot chocolate!', `${m.name}, marshmallows on top. ${SE.pick(SE.PROPS)}`);
    } });
  }
  function startCook(fish) {
    mode = 'busy';
    const f = SE.FISH[fish] || {};
    const beats = SE.MOMENTS.cook;
    beats[0].img = f.cut ? 'cut/cook_prep_' + f.cut : 'cut/cook_prep';
    beats[3].img = f.cut ? 'cut/cook_plate_' + f.cut : 'cut/cook_plate';
    if (f.prep) beats[0].text = f.prep;
    if (f.plate) beats[3].text = f.plate;
    SE.moment('cook', { force: true, then: () => {
      const sv = SE.save;
      sv.fish[fish]--;
      if (sv.fish[fish] <= 0) delete sv.fish[fish];
      const dish = f.dish || 'Pan-fried Fish';
      sv.dishes[dish] = (sv.dishes[dish] || 0) + 1;
      sv.cooked++;
      SE.persist();
      // and then dinner, with Waffles and Mochi watching every bite
      SE.moment('eat', { force: true, then: () => { mode = 'share'; g = { fish, t: 0 }; } });
    } });
  }
  // which mug? the shelf of mugs, one button each
  function drawMugs(ctx) {
    const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
    const used = SE.save.mugsUsed || {};
    const bw = 112, bh = 18, x0 = SE.W - bw - 8;
    let y = SE.H - 26 - (SE.MUGS.length + 1) * (bh + 3);
    SE.text('Which mug?', x0 + bw / 2, y - 12, { align: 'center', size: 8, color: '#ffe6b8', alpha: a });
    for (const m of SE.MUGS) {
      if (SE.button(x0, y, bw, bh, m.name + (used[m.id || 'red'] ? '' : ' · new'), { alpha: a })) startCocoa(m);
      y += bh + 3;
    }
    if (SE.button(x0, y, bw, bh, 'Never mind', { alpha: a, icon: 'back' })) mode = 'idle';
  }
  // after dinner: share a bite? Each choice is its own little cutscene
  let g = null;
  function drawShare(ctx, dt) {
    g.t += dt;
    SE.drawStill(ctx, 'cut/eat');
    const fish = g.fish;
    const done = () => { mode = 'idle'; g = null; SE.celebrate('Dinner is served!', `${(SE.FISH[fish] || {}).dish || 'Pan-fried ' + fish}, cooked with love. ${SE.pick(SE.PROPS)}`); };
    const pick = (what) => { mode = 'busy'; SE.moment(what, { force: true, then: () => { mode = 'share'; g.gave = (g.gave || []).concat(what); g.t = 0; } }); };
    const gave = g.gave || [];
    const opts = [];
    if (!gave.includes('treat_dog')) opts.push(['A piece for Waffles', 112, () => pick('treat_dog')]);
    if (!gave.includes('treat_cat')) opts.push(['A bite for Mochi', 96, () => pick('treat_cat')]);
    opts.push([opts.length === 2 ? 'Keep it all' : 'All done', 70, done]);
    if (SE.watching() && g.t > 2.5) { if (opts.length > 1) opts[0][2](); else done(); return; }
    let x = SE.W - 6 - opts.reduce((t, o) => t + o[1] + 4, 0);
    for (const [label, w, cb] of opts) { if (SE.button(x, SE.H - 24, w, 18, label, {})) cb(); x += w + 4; }
  }

  // ------------------------------------------------------------ the oven needs wood to cook
  const STOVE = { x: 352, y: 150, w: 92, h: 100 };
  function feedStove(auto) {
    const sv = SE.save;
    if (sv.wood <= 0) { SE.toast('No firewood — chop some out in the yard.', '#cfe6ff'); return false; }
    if (sv.stove > 0.9) { SE.toast('The oven is nice and hot already.'); return false; }
    const wasCold = sv.stove < 0.12;
    sv.wood--; sv.stove = Math.min(1, sv.stove + 0.6); SE.persist();
    SE.audio.sfx('whoosh');
    for (let i = 0; i < 12; i++) SE.spawnFloater(SE.rand(380, 410), SE.rand(185, 200), 'spark', '#ffb36b');
    if (wasCold && !auto) SE.celebrate('Oven lit!', `Warm and ready for cooking. ${SE.pick(SE.PROPS)}`);
    else SE.toast('A log for the oven. It ticks as it warms.', '#ffe6b8');
    return true;
  }
  const stoveCold = () => SE.save.stove < 0.12;

  // Mochi wanders the counters, the island, the sill and the shelf
  function drawMochi(ctx, dt) {
    if (!kmochi) kmochi = SE.Mochi(KCAT_SURF, KCAT_LINKS);
    kmochi.update(dt);
    kmochi.draw();
  }
  // Mochi in the kitchen: the back counter, the island, the window sill, the shelf, the floor
  const KCAT_SURF = { counter: [180, 345, 156], island: [192, 248, 188], sill: [280, 318, 134], shelf: [196, 222, 62], floor: [150, 330, 262], right: [448, 476, 158] };
  const KCAT_LINKS = [['floor', 'island'], ['island', 'counter'], ['counter', 'sill'], ['counter', 'shelf'], ['floor', 'counter']];
  let kmochi = null;

  // ------------------------------------------------------------ scene
  SE.addScene('kitchen', {
    enter() { mode = 'idle'; kmochi = null; SE.audio.setMusic('cabin'); SE.audio.woodSteps(3); },
    update(dt) {
      SE.audio.setAmbience({ fire: SE.save.stove * 0.6, wind: 0.3 + SE.weather.wind / 80, storm: SE.weather.stormy() ? 0.6 : 0, muffled: true });
    },
    draw(ctx, dt) {
      SE.drawImg('bg_kitchen', 0, 0);
      SE.weather.windows(ctx, WINDOWS);
      const flick = 0.8 + 0.15 * Math.sin(SE.time * 8) + 0.05 * Math.random();
      const heat = SE.save.stove, night = SE.weather.night();
      // the lanterns are only lit after dusk; in daylight they stand there cold
      const lit = SE.clamp((night - 0.3) * 4, 0, 1);
      // the oven fire is the room's main light: after dark everything away from it and the lanterns sinks into shadow
      SE.weather.interior(ctx, [
        { x: 398, y: 205, r: 70 + 120 * heat, k: heat > 0.12 ? (0.55 + 0.4 * heat) * flick : 0 },
        { x: 463, y: 140, r: 85, k: 0.85 * lit * flick },
        { x: 167, y: 186, r: 80, k: 0.85 * lit * flick },
      ]);
      if (heat < 0.12) { ctx.fillStyle = 'rgba(20,12,14,0.6)'; ctx.fillRect(374, 178, 50, 34); }
      else {
        // the flames behind the glass flicker and burn bright
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (0.25 + 0.35 * heat) * flick * (0.7 + 0.3 * night);
        const g = ctx.createRadialGradient(398, 202, 1, 398, 202, 26);
        g.addColorStop(0, 'rgba(255,214,120,1)'); g.addColorStop(0.6, 'rgba(255,130,40,0.6)'); g.addColorStop(1, 'rgba(255,90,20,0)');
        ctx.fillStyle = g; ctx.fillRect(374, 178, 50, 34); ctx.restore();
      }
      if (lit < 1 && SE.img('props/kitchen_unlit')) { ctx.save(); ctx.globalAlpha = 1 - lit; SE.drawImg('props/kitchen_unlit', 0, 0); ctx.restore(); }
      // warm light thrown out of the firebox: on the floor in front and up the stove pipe
      SE.glow(ctx, 398, 200, (34 + 50 * heat) * flick, '255,140,60', (0.12 + 0.3 * heat) * flick);
      if (heat > 0.12) SE.glow(ctx, 398, 250, (40 + 50 * heat) * flick, '255,150,70', (0.08 + 0.18 * heat) * flick);
      SE.glow(ctx, 463, 140, 30, '255,200,120', (0.14 + night * 0.12) * flick * lit);
      SE.glow(ctx, 167, 186, 30, '255,200,120', (0.12 + night * 0.12) * flick * lit);
      // steam from the pot on the stove
      if (Math.random() < dt * 4 * SE.save.stove) steam.push({ x: 378 + SE.rand(-6, 6), y: 138, t: 0 });
      for (let i = steam.length - 1; i >= 0; i--) {
        const p = steam[i]; p.t += dt;
        if (p.t > 2) { steam.splice(i, 1); continue; }
        p.y -= 9 * dt; p.x += Math.sin(p.t * 3 + i) * 0.2;
        ctx.fillStyle = `rgba(255,255,255,${0.28 * (1 - p.t / 2)})`;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
      }

      drawMochi(ctx, dt);
      if (mode === 'idle') drawIdle(ctx);
      else if (mode === 'share') drawShare(ctx, dt);
      else if (mode === 'mug') drawMugs(ctx);
      const ovenWord = SE.save.stove > 0.6 ? 'hot' : SE.save.stove > 0.12 ? 'warm' : 'cold';
      SE.hud.draw(ctx, { title: 'Kitchen', subtitle: `oven: ${ovenWord} · firewood: ${SE.save.wood} · fish: ${SE.fishCount()}`, map: false, back: mode === 'idle' ? () => SE.go('cabin') : null });
    },
  });

  let idleT = 0;
  function drawIdle(ctx) {
    if (SE.watching()) return; // just watching: the kitchen stays quiet
    const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
    const fishes = Object.entries(SE.save.fish).filter(([, n]) => n > 0);
    let x = SE.W - 6;
    const btn = (label, w, cb, opts = {}) => { x -= w + 4; if (SE.button(x, SE.H - 24, w, 18, label, Object.assign({ alpha: a }, opts))) cb(); };
    const needHeat = (fn) => () => { if (stoveCold()) SE.toast('The oven is cold — add a log first.', '#cfe6ff'); else fn(); };
    btn('Make hot chocolate', 100, needHeat(() => { mode = 'mug'; }), { icon: 'cup' });
    if (fishes.length) {
      fishes.slice(0, 2).forEach(([name, n]) => btn(`Cook ${name.split(' ').pop()} ×${n}`, Math.max(84, SE.measure(`Cook ${name.split(' ').pop()} ×${n}`, 8) + 26), needHeat(() => startCook(name)), { icon: 'fish' }));
    } else {
      btn('No fish yet', 70, () => SE.toast('Catch some at the Frozen Lake first!'), { icon: 'fish', fill: 'rgba(60,54,80,0.6)' });
    }
    btn(stoveCold() ? 'Light the oven' : 'Feed the oven', 78, () => feedStove(false), { active: stoveCold() && SE.save.wood > 0 });
  }
})();
