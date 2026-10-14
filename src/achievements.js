// Achievements. All of them are hidden: in the notebook they are a "?" until you earn them, then
// they show their name and their little PixelLab icon (assets/img/ach/<id>.png). Most are checked
// straight from the save once a second; a few need watching over time (idling, the fire burning
// through a whole day, staying up all night) and are counted here frame by frame. Scenes report a
// handful of moments with SE.ach.note(event, data).
'use strict';

(function () {
  const KINDS = ['fox', 'hare', 'deer', 'elk', 'bird', 'owl', 'bear'];
  const NAMES = { fox: 'fox', hare: 'hare', deer: 'deer', elk: 'elk', bird: 'cardinal', owl: 'owl', bear: 'grizzly' };
  // everything a day at the cabin asks of you, in and outside
  const CHORES = ['fire', 'oven', 'cook', 'cocoa', 'shovel', 'chop', 'fish', 'petDog', 'petCat', 'bible'];
  const IDLE_SCENES = ['cabin', 'kitchen', 'bedroom', 'chapel', 'yard', 'lake', 'woodlot', 'summit'];
  const SUMMIT_WX = ['sunny', 'calm', 'snowy', 'windy'];
  const sv = () => SE.save;
  const flag = (k) => !!((sv().achFlags || {})[k]);
  const setFlag = (k) => { const s = sv(); s.achFlags = s.achFlags || {}; if (!s.achFlags[k]) { s.achFlags[k] = Date.now(); SE.persist(); } };

  const sketchDone = (k) => ((sv().sketches || {})[k] || 0) >= (SE.sketchTrips ? SE.sketchTrips(k) : 99);
  const photosDone = (k) => SE.pinesConds && ((sv().pinesAlbum || {})[k] || []).length >= SE.pinesConds(k).length * 3 && ((sv().album || {})[k] || []).length >= 3;

  const SKETCH_NAMES = { fox: 'Sly Strokes', hare: 'Quick Study', deer: 'Gentle Lines', elk: 'Antlers in Graphite', bird: 'A Spot of Red', owl: 'Drawn by Moonlight', bear: 'Steady Hand, Big Bear' };
  const PHOTO_NAMES = { fox: 'Fox Fire', hare: 'Snowshoe Shots', deer: 'Doe-Eyed Gallery', elk: 'Elk in Every Light', bird: 'Birdwatcher', owl: 'Night Shift', bear: 'Bear Necessities' };
  const LIST = [
    ...KINDS.map((k) => ({ id: 'sketch_' + k, name: SKETCH_NAMES[k], desc: `Finished the full sketch of the ${NAMES[k]}.`, test: () => sketchDone(k) })),
    { id: 'sketch_all', name: "The Naturalist's Notebook", desc: 'Every animal of the valley sketched in full.', test: () => KINDS.every(sketchDone) },
    ...KINDS.map((k) => ({ id: 'photo_' + k, name: PHOTO_NAMES[k], desc: `Every photo of the ${NAMES[k]}, in every light and weather.`, test: () => photosDone(k) })),
    { id: 'album_all', name: 'The Whole Album', desc: 'The photo album is complete.', test: () => KINDS.every(photosDone) },
    { id: 'summit_all', name: 'Every Sky from the Top', desc: 'Stood on the summit in every weather, by day and by night.', test: () => { const c = sv().summitConds || {}; return SUMMIT_WX.every((w) => c[w + '_day'] && c[w + '_night']); } },
    { id: 'fish_all', name: 'Full Bucket', desc: 'Caught every kind of fish in the Frozen Lake.', test: () => Object.keys(SE.FISH || {}).every((f) => (sv().caught || {})[f]) },
    { id: 'mugs_all', name: 'Mug Collector', desc: 'Drank hot chocolate from every mug on the shelf.', test: () => (SE.MUGS || []).every((m) => (sv().mugsUsed || {})[m.id || 'red']) },
    { id: 'pet_week', name: 'Daily Cuddles', desc: 'Petted Waffles and Mochi every day for a week.', test: () => {
      const log = sv().petLog || {}, days = Object.keys(log).map(Number).filter((d) => log[d] === 3).sort((a, b) => a - b);
      let run = 0, best = 0, prev = -9; for (const d of days) { run = d === prev + 1 ? run + 1 : 1; prev = d; best = Math.max(best, run); }
      return best >= 7;
    } },
    { id: 'shovel_storm', name: 'Shoveling Against the Tide', desc: 'Cleared the path while the heavy snow kept falling. Bold.', test: () => flag('shovelHeavy') },
    { id: 'wild_all', name: 'Wild Neighbours', desc: 'Met every animal of the valley out on the trails.', test: () => Object.keys(SE.WILDLIFE || {}).every((k) => (sv().metWild || {})[k]) },
    { id: 'fire_day', name: 'Keeper of the Flame', desc: 'The fireplace never went out for a whole day.', test: () => flag('fireDay') },
    { id: 'dishes_all', name: 'Five Fish Feast', desc: 'Cooked every kind of fish in the kitchen.', test: () => Object.values(SE.FISH || {}).every((f) => (sv().dishes || {})[f.dish]) },
    { id: 'idle_1', name: 'Just Sitting', desc: 'Let the mountains be for an hour.', test: () => flag('idle1') },
    { id: 'idle_2', name: 'Unhurried', desc: 'Two quiet hours in one place.', test: () => flag('idle2') },
    { id: 'idle_4', name: 'Deep Calm', desc: 'Four hours of snow, fire and nothing to do.', test: () => flag('idle4') },
    { id: 'idle_8', name: 'Snowed In', desc: 'Eight whole hours. The snow kept falling, and that was fine.', test: () => flag('idle8') },
    { id: 'discover_all', name: 'Every Corner, with Waffles', desc: 'Found every place in the valley.', test: () => SE.PLACES && Object.keys(SE.PLACES).every((id) => SE.placeFound(id)) },
    { id: 'skip_sleep', name: 'Up Until Sunrise', desc: 'Stayed up through the night and saw the morning come.', test: () => flag('skipSleep') },
    { id: 'cabin_care', name: 'Cabin Keeper', desc: 'In one day: the fire, the oven, a meal, cocoa, the path, firewood, a fish, both pets and a chapter.', test: () => flag('cabinCare') },
    { id: 'idle_scenes', name: 'Quiet Corners', desc: 'Sat back and just watched in every corner of the valley.', test: () => IDLE_SCENES.every((k) => (sv().watchedIn || {})[k]) },
    { id: 'stars', name: 'Wishing with Waffles', desc: 'Watched a shooting star from the summit, together.', test: () => (sv().stars || 0) > 0 },
  ];
  const A = (SE.ach = { list: LIST, queue: [], shown: null });
  A.has = (id) => !!((sv().ach || {})[id]);
  A.count = () => LIST.filter((a) => A.has(a.id)).length;

  function unlock(a) {
    const s = sv(); s.ach = s.ach || {};
    if (s.ach[a.id]) return;
    s.ach[a.id] = Date.now();
    SE.persist();
    A.queue.push(a);
  }
  A.check = function () { for (const a of LIST) if (!A.has(a.id)) { try { if (a.test()) unlock(a); } catch (e) { /* data not ready yet */ } } };

  // things the scenes tell us about
  function chore(c) {
    const s = sv();
    if (!s.chores || s.chores.day !== s.day) s.chores = { day: s.day, done: {} };
    s.chores.done[c] = 1;
    if (CHORES.every((k) => s.chores.done[k])) setFlag('cabinCare');
  }
  A.note = function (ev, data) {
    const s = sv(), W = SE.weather;
    if (ev === 'pet') {
      s.petLog = s.petLog || {};
      s.petLog[s.day] = (s.petLog[s.day] || 0) | (data === 'dog' ? 1 : 2);
      // keep only the last few weeks
      for (const d of Object.keys(s.petLog)) if (+d < s.day - 20) delete s.petLog[d];
      chore(data === 'dog' ? 'petDog' : 'petCat');
    } else if (ev === 'shovel') {
      if (W && (W.mode === 'snowy' || W.mode === 'storm' || W.mode === 'windy')) setFlag('shovelHeavy');
      chore('shovel');
    } else if (ev === 'summit') {
      s.summitConds = s.summitConds || {};
      s.summitConds[`${W.mode}_${W.night() > 0.5 ? 'night' : 'day'}`] = 1;
    } else if (ev === 'wild') {
      s.metWild = s.metWild || {}; s.metWild[data] = 1;
    } else if (ev === 'sleep') {
      s.awakeH = 0;
    } else if (CHORES.includes(ev)) chore(ev);
    SE.persist();
    A.check();
  };

  // the slow ones, counted while the game runs
  let lastClock = null, checkT = 0;
  const watchT = {};
  SE.frameHooks.push(function achievements(ctx, dt) {
    const s = sv();
    if (!s || !SE.weather) return;
    // idling: no input at all for 1, 2, 4, 8 hours
    const idleH = (SE.idleTime || 0) / 3600;
    if (idleH >= 1) setFlag('idle1'); if (idleH >= 2) setFlag('idle2'); if (idleH >= 4) setFlag('idle4'); if (idleH >= 8) setFlag('idle8');
    // in-game hours passing: the fire's unbroken run, and hours awake
    const c = s.clock;
    if (lastClock != null) {
      let dh = c - lastClock; if (dh < 0) dh += 24;
      if (dh > 0 && dh < 3) {
        if (s.fire > 0.06) s.fireRun = (s.fireRun || 0) + dh; else s.fireRun = 0;
        if (s.fireRun >= 24) setFlag('fireDay');
        s.awakeH = (s.awakeH || 0) + dh;
        if (lastClock < 6 && c >= 6 && s.awakeH >= 10) setFlag('skipSleep');
      }
    }
    lastClock = c;
    // just watching in each corner of the valley (20 quiet seconds counts)
    if (SE.watching() && IDLE_SCENES.includes(SE.sceneName) && !SE.momentPlaying()) {
      watchT[SE.sceneName] = (watchT[SE.sceneName] || 0) + dt;
      if (watchT[SE.sceneName] > 20 && !(s.watchedIn || {})[SE.sceneName]) { s.watchedIn = Object.assign({}, s.watchedIn, { [SE.sceneName]: 1 }); SE.persist(); }
    }
    checkT -= dt;
    if (checkT <= 0) { checkT = 1; A.check(); }
    drawBanner(ctx, dt);
  });

  // "Achievement unlocked": a small card that slides in at the bottom left, one at a time
  function drawBanner(ctx, dt) {
    if (!A.shown) {
      if (!A.queue.length || SE.momentPlaying() || (SE.notebook && SE.notebook.open)) return;
      A.shown = { a: A.queue.shift(), t: 0 };
      SE.audio && SE.audio.sfx('chime');
    }
    const b = A.shown; b.t += dt;
    const life = 5;
    if (b.t > life) { A.shown = null; return; }
    const k = Math.min(1, b.t * 4, (life - b.t) * 3), w = Math.max(118, SE.measure(b.a.name, 8) + 52), h = 40;
    const x = Math.round(6 - (1 - k) * (w + 10)), y = 50;
    SE.panel(x, y, w, h, { alpha: 0.96, fill: 'rgba(48,40,70,0.95)' });
    const icon = SE.img('ach/' + b.a.id);
    if (icon) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(icon, x + 5, y + 4, 32, 32); ctx.restore(); }
    SE.text('Achievement unlocked', x + 42, y + 7, { size: 6, color: '#cfe6ff' });
    SE.text(b.a.name, x + 42, y + 17, { size: 8, color: '#ffe6b8' });
  }

  // the achievements pages in the notebook: 12 to a page, "?" until earned
  A.drawPage = function (ctx, page, P, write, mouse) {
    const per = 12, items = LIST.slice(page * per, page * per + per);
    let hover = null;
    items.forEach((a, i) => {
      const cx = P.x + (i % 3) * 33, cy = P.y + 4 + Math.floor(i / 3) * 34, got = A.has(a.id);
      ctx.fillStyle = got ? 'rgba(255,248,230,0.55)' : 'rgba(122,102,86,0.16)'; ctx.fillRect(cx, cy, 32, 32);
      ctx.strokeStyle = got ? 'rgba(156,59,46,0.6)' : 'rgba(122,102,86,0.45)'; ctx.strokeRect(cx + 0.5, cy + 0.5, 31, 31);
      const icon = got && SE.img('ach/' + a.id);
      if (icon) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(icon, cx, cy, 32, 32); ctx.restore(); }
      else write('?', cx + 16, cy + 8, { align: 'center', size: 16, color: '#9a8672' });
      if (SE.inRect(mouse.x, mouse.y, { x: cx, y: cy, w: 32, h: 32 })) hover = { a, got, cx, cy };
    });
    return hover;
  };
})();
