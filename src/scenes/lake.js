// Frozen Lake: ice fishing with Waffles. Wait for a nibble, then keep the fish in the green zone.
'use strict';

(function () {
  const HOLE = { x: 190, y: 235, rx: 44, ry: 9 };
  // he sits on his stool on the ice, rod held out so its tip is right above the hole
  const POS = { man: { x: 132, y: 249 }, dog: { x: 58, y: 254 } };
  // rod-tip pixel in each frame of the PixelLab fishing strips (measured from the art)
  const TIPS = {
    fishing: [[61, 42], [60, 45], [55, 46], [49, 45], [47, 41], [49, 42], [51, 44], [59, 45]],
    fishing_reel: [[61, 43], [65, 47], [64, 53], [60, 25], [57, 21], [52, 21], [65, 24], [65, 38]],
  };
  let s = null;

  function pickSpecies() {
    let r = Math.random(), acc = 0;
    for (const [name, f] of Object.entries(SE.FISH)) { acc += f.rarity; if (r <= acc) return name; }
    return 'Brook Trout';
  }
  function reset() {
    s.state = 'wait';
    s.next = SE.rand(5, 13);
    s.dip = 0;
  }

  SE.addScene('lake', {
    enter(p) {
      SE.save.location = 'lake';
      SE.persist();
      s = { t: 0, ripples: [], bob: 0, state: 'wait', next: SE.rand(3, 7), dip: 0, mini: null, card: null, tip: !SE.fishCount() };
      SE.audio.setMusic('outdoors');
      if (p.arrived) SE.toast('Waffles sniffs the ice and settles down beside you.', '#cfe6ff');
    },
    exit() { SE.cardOpen = false; },
    update(dt) {
      SE.weather.stormCheck();
      SE.audio.setAmbience({ wind: 0.4 + SE.weather.wind / 80, creaks: 1, storm: SE.weather.stormy() ? 1 : 0 });
    },
    draw(ctx, dt) {
      s.t += dt;
      SE.drawImg('bg_lake', 0, 0);
      SE.weather.sway(ctx, 'bg_lake', [[0, 10, 120, 165], [355, 30, 125, 160]]);
      SE.weather.overcast(ctx, 170);

      // ripples in the fishing hole
      if (Math.random() < dt * (s.state === 'nibble' ? 6 : 0.8)) s.ripples.push({ t: 0 });
      ctx.save();
      ctx.beginPath(); ctx.ellipse(HOLE.x, HOLE.y, HOLE.rx - 4, HOLE.ry - 2, 0, 0, Math.PI * 2); ctx.clip();
      for (let i = s.ripples.length - 1; i >= 0; i--) {
        const r = s.ripples[i]; r.t += dt;
        if (r.t > 2) { s.ripples.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(200,220,255,${0.4 * (1 - r.t / 2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(s.bobX || HOLE.x, HOLE.y, 3 + r.t * 16, 1 + r.t * 3.5, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();

      // fishing line + bobber
      if (s.state === 'nibble') s.dip = Math.max(0, Math.sin(s.t * 9)) * 3;
      else s.dip = SE.approach(s.dip, 0, 6, dt);
      const bob = Math.sin(s.t * 1.6) * 0.8 + s.dip;
      const reeling = !!(s.mini || s.land || s.miss);
      const anim = reeling && SE.anims.fishing_reel ? 'fishing_reel' : 'fishing';
      const fsz = SE.animSize(anim);
      const nfr = SE.anims[anim] ? SE.anims[anim].frames : 1;
      const manFrame = Math.floor(s.t * (reeling ? 8 : 4)) % nfr;
      const tp = (TIPS[anim] || [])[manFrame] || [fsz.w - 4, 40];
      const tip = { x: POS.man.x + tp[0], y: POS.man.y - fsz.h + tp[1] };
      // the line hangs straight down from the rod tip into the hole
      let bx = SE.clamp(tip.x, HOLE.x - HOLE.rx + 10, HOLE.x + HOLE.rx - 10), by = HOLE.y - 2 + bob;
      s.bobX = bx;
      const hooked = s.land && fishPos();
      if (hooked) { bx = hooked.x; by = hooked.y - hooked.half; }
      if (s.miss) { by = HOLE.y - 2; } // the line goes slack once the fish is off
      ctx.strokeStyle = 'rgba(235,235,245,0.7)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(tip.x + 0.5, tip.y); ctx.quadraticCurveTo((tip.x + bx) / 2 + (s.miss ? 6 : 0), (tip.y + by) / 2, bx + 0.5, by); ctx.stroke();
      if (!hooked) {
        ctx.fillStyle = '#e04a4a'; ctx.fillRect(Math.round(bx) - 1, Math.round(by) - 2, 3, 2);
        ctx.fillStyle = '#fff7ea'; ctx.fillRect(Math.round(bx) - 1, Math.round(by), 3, 1);
      }
      drawCatchMoment(ctx, dt);
      // the lantern stands on the ice behind the two of them
      const LANT = { x: POS.man.x - 16, y: POS.man.y - 26 };
      SE.lanternBehind(ctx, LANT.x, LANT.y);

      // the traveler and Waffles
      // the traveler on his stool (the art faces left, so it is mirrored toward the hole)
      if (SE.anims[anim]) {
        ctx.fillStyle = 'rgba(60,80,130,0.28)';
        ctx.beginPath(); ctx.ellipse(POS.man.x + 26, POS.man.y, 18, 3, 0, 0, Math.PI * 2); ctx.fill();
        SE.drawAnim(anim, POS.man.x + (reeling ? 0 : SE.weather.shiver(0)), POS.man.y - fsz.h, 0, { frame: manFrame });
        SE.headphones(ctx, POS.man.x + 31, POS.man.y - fsz.h + 3);
        s.headAt = { x: POS.man.x + 35, y: POS.man.y - fsz.h + 10 };
      } else SE.drawActorFallback(ctx, POS.man.x + 20, POS.man.y - 40, '#a0522d');
      // Waffles keeps you company: resting, then sitting up when a fish bites
      if (s.state === 'nibble' || s.mini || s.card || s.land || s.miss) {
        // he stays lying beside you on the ice: a bark, then a big grin
        s.dogT = (s.dogT || 0) + SE.dt;
        if (!SE.drawDogLieCheer(POS.dog.x - 16, POS.dog.y + 2, s.dogT % 3.2, {})) SE.drawDogRest(POS.dog.x - 16, POS.dog.y + 2, { seed: 2 });
      } else { s.dogT = 0; SE.drawDogRest(POS.dog.x - 16 + SE.weather.shiver(1), POS.dog.y + 2, { seed: 2 }); }

      // night and weather light fall on everyone in the scene, not just the background
      SE.weather.tint(ctx);
      SE.travelerLight(ctx, LANT.x, LANT.y, 1, 1, s.headAt, { behind: true }); // the lantern behind them (or the headlamp on his beanie)
      SE.weather.stars(ctx, 40);
      SE.weather.sunshine(ctx, 180);
      SE.weather.draw(ctx);

      // bite logic
      if (s.state === 'wait' && !s.mini && !s.card && !s.land && !s.miss) {
        s.next -= dt;
        if (s.next <= 0) { s.state = 'nibble'; s.nibbleT = 4.5; s.react = SE.rand(0.8, 2); s.species = pickSpecies(); SE.audio.sfx('bite'); }
      } else if (s.state === 'nibble') {
        s.nibbleT -= dt;
        const ex = POS.man.x + 30, ey = POS.man.y - 84 + Math.sin(s.t * 10) * 1.5;
        SE.panel(ex - 6, ey, 13, 15, { fill: 'rgba(255,240,200,0.95)' });
        SE.text('!', ex, ey + 2, { align: 'center', size: 11, color: '#c14b4b', shadow: false, bold: true });
        if (Math.random() < dt * 2.5) SE.audio.sfx('bite');

        else if (s.nibbleT <= 0) { reset(); SE.toast('The nibble drifted off. No rush.', '#cfe6ff'); }
      }

      if (s.mini) drawMini(ctx, dt);
      else if (s.card) drawCard(ctx);

      const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
      if (!s.mini && !s.card && !s.land && !s.miss) {
        const nib = s.state === 'nibble';
        if (!SE.watching() && (SE.button(SE.W - 96, SE.H - 24, 90, 18, nib ? 'Reel in!' : 'Waiting…', { alpha: nib ? 1 : a, active: nib, icon: 'fish' }) || (nib && SE.key('Space')))) {
          if (nib) startMini();
          else SE.toast('Patience… watch the bobber.', '#cfe6ff');
        }
        if (s.tip && s.t < 12 && !SE.watching()) SE.text('When the bobber dips and "!" appears, reel in', 8, SE.H - 20, { size: 7, color: '#ffe6b8', alpha: Math.min(1, 12 - s.t) * a });
      }
      SE.hud.draw(ctx, { title: 'Frozen Lake', subtitle: `in the bucket: ${SE.fishCount()}`, map: true });
    },
  });

  // ------------------------------------------------------------ reel minigame
  function startMini() {
    const f = SE.FISH[s.species];
    s.state = 'reel';
    s.mini = {
      zone: 120, zv: 0, fish: 100, ft: 100, retarget: 0, prog: 0.3,
      speed: 26 + (1 - f.rarity) * 46, zoneH: 46, t: 0,
    };
    SE.audio.sfx('reel');
  }
  function drawMini(ctx, dt) {
    const m = s.mini;
    m.t += dt;
    const P = { x: SE.W - 92, y: 40, w: 80, h: 190 }, bar = { x: P.x + 14, y: P.y + 12, w: 22, h: 166 };
    SE.panel(P.x, P.y, P.w, P.h, { fill: 'rgba(48,40,70,0.95)' });
    ctx.fillStyle = '#20304e'; ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    ctx.fillStyle = 'rgba(140,190,255,0.08)';
    for (let i = 0; i < 8; i++) ctx.fillRect(bar.x, bar.y + ((i * 23 + m.t * 10) % bar.h), bar.w, 1);

    // player zone: hold to rise, release to sink — floaty and forgiving
    let hold = !SE.modal && (SE.mouse.down || SE.held('Space', 'ArrowUp', 'KeyW'));
    if (SE.watching()) {
      // the traveler reels by himself: steer the zone toward the fish, a little lazily
      const center = m.zone + m.zoneH / 2 + m.zv * 0.3;
      hold = center > m.fish + 4 + Math.sin(m.t * 1.3) * 6;
    }
    m.zv += (hold ? -230 : 170) * dt;
    m.zv *= Math.pow(0.12, dt);
    m.zone += m.zv * dt;
    if (m.zone < 0) { m.zone = 0; m.zv = 0; }
    if (m.zone > bar.h - m.zoneH) { m.zone = bar.h - m.zoneH; m.zv = 0; }
    // fish wanders lazily
    m.retarget -= dt;
    if (m.retarget <= 0) { m.retarget = SE.rand(0.7, 1.8); m.ft = SE.rand(6, bar.h - 14); }
    m.fish += SE.clamp(m.ft - m.fish, -m.speed * dt, m.speed * dt);

    const inside = m.fish + 4 > m.zone && m.fish + 4 < m.zone + m.zoneH;
    m.prog = SE.clamp(m.prog + (inside ? 0.26 : -0.12) * dt, 0, 1);
    ctx.fillStyle = inside ? 'rgba(127,211,138,0.85)' : 'rgba(127,211,138,0.5)';
    ctx.fillRect(bar.x + 1, Math.round(bar.y + m.zone), bar.w - 2, m.zoneH);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(bar.x + 1, Math.round(bar.y + m.zone), bar.w - 2, 1);
    SE.drawIcon('fish', bar.x + 7, Math.round(bar.y + m.fish), SE.FISH[s.species].color);
    // catch meter
    const mx = bar.x + bar.w + 8;
    ctx.fillStyle = '#20304e'; ctx.fillRect(mx, bar.y, 8, bar.h);
    ctx.fillStyle = m.prog > 0.75 ? '#ffd166' : '#e8aa60';
    const ph = Math.round(bar.h * m.prog);
    ctx.fillRect(mx, bar.y + bar.h - ph, 8, ph);
    SE.text('hold to lift', P.x + P.w / 2, P.y + P.h - 10, { align: 'center', size: 6, color: '#dfe8ff' });
    if (inside && Math.random() < dt * 6) SE.audio.sfx('click');

    if (m.prog >= 1) {
      s.mini = null;
      SE.audio.sfx('splash');
      const f = SE.FISH[s.species];
      // up it comes: the fish on the hook, wriggling and gasping, then a close look in your hands
      s.land = { t: 0, species: s.species, cm: Math.round((22 + Math.random() * 20) * f.size), first: !SE.save.caught[s.species], drops: [] };
      SE.addFish(s.species);
      for (let i = 0; i < 10; i++) SE.spawnFloater(HOLE.x + SE.rand(-20, 20), HOLE.y - 10, 'spark', '#cfe6ff');
    } else if (m.prog <= 0) {
      s.mini = null;
      SE.audio.sfx('splash');
      s.miss = { t: 0, species: s.species, splashed: false };
    }
  }
  // ------------------------------------------------------------ the fish on the line, a miss, and a close look
  function fishPos() {
    const k = SE.ease(Math.min(1, s.land.t / 1.1));
    return { x: (s.bobX || HOLE.x) - k * 6, y: HOLE.y - 4 - k * 40 + Math.sin(s.land.t * 7) * 1.5 * k, half: 12 };
  }
  function drawCatchMoment(ctx, dt) {
    if (s.land) {
      const L = s.land;
      L.t += dt;
      const p = fishPos();
      // hanging head-up by its mouth from the hook, thrashing
      SE.drawFishWiggle(ctx, L.species, p.x, p.y + 4, 1, L.t, -Math.PI / 2 + Math.sin(L.t * 9) * 0.25, 1.6);
      if (Math.random() < dt * 14) L.drops.push({ x: p.x + SE.rand(-4, 4), y: p.y + 8, v: 0 });
      for (let i = L.drops.length - 1; i >= 0; i--) {
        const d = L.drops[i]; d.v += 220 * dt; d.y += d.v * dt;
        if (d.y > HOLE.y) { L.drops.splice(i, 1); continue; }
        ctx.fillStyle = 'rgba(210,230,255,0.85)'; ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 2);
      }
      if (L.t > 2.4) {
        s.card = { species: L.species, cm: L.cm, first: L.first, t: 0 };
        SE.cardOpen = true;
        s.land = null;
        SE.celebrate(s.card.first ? 'New species!' : 'Nice catch!', `${s.card.species} · ${s.card.cm} cm — ${SE.pick(SE.PROPS)}`, { y: 8 });
      }
    } else if (s.miss) {
      // it leaps clear of the hole, shakes the hook loose and drops back in with a splash
      const M = s.miss;
      M.t += dt;
      const k = Math.min(1, M.t / 1.1);
      const x = (s.bobX || HOLE.x) + k * 26, y = HOLE.y - 4 - Math.sin(k * Math.PI) * 34;
      if (k < 1) SE.drawFishWiggle(ctx, M.species, x, y, 1, M.t, -0.6 + k * 1.8, 2);
      if (k >= 1 && !M.splashed) {
        M.splashed = true;
        SE.audio.sfx('splash');
        for (let i = 0; i < 4; i++) s.ripples.push({ t: -i * 0.15 });
        for (let i = 0; i < 8; i++) SE.spawnFloater(HOLE.x + 30 + SE.rand(-8, 8), HOLE.y - 6, 'spark', '#cfe6ff');
      }
      if (M.t > 2) {
        s.miss = null;
        SE.toast('It shook the hook and slipped back under the ice. Plenty more fish down there.', '#cfe6ff');
        reset();
      }
    }
  }
  // looking down at the fish in your mittens: the close-up
  function drawCard(ctx) {
    const c = s.card;
    c.t += SE.dt;
    const pop = Math.min(1, c.t * 3);
    ctx.save();
    ctx.globalAlpha = pop;
    if (SE.img('lake_hands')) SE.drawImg('lake_hands', 0, 0, { scale: 2 });
    else { ctx.fillStyle = 'rgba(30,40,70,0.9)'; ctx.fillRect(0, 0, SE.W, SE.H); }
    SE.weather.tint(ctx, 0.6);
    ctx.restore();
    // the fish across your palms, still flapping now and then
    const flap = (c.t % 3) < 1.1;
    SE.drawFishWiggle(ctx, c.species, HANDS.x, HANDS.y + Math.sin(SE.time * 2) * 1, 4.5, flap ? c.t : 0, HANDS.rot, 1.2); // big, filling your mittens
    const W = 220, x = SE.W / 2 - W / 2, y = SE.H - 58;
    SE.panel(x, y, W, 50, { fill: 'rgba(48,40,70,0.92)', alpha: pop });
    SE.text(c.species, SE.W / 2, y + 5, { align: 'center', size: 11, color: '#ffe6b8', alpha: pop });
    SE.text(`${c.cm} cm · ${c.first ? 'the first one in your journal!' : 'into the bucket'} · cook it at the cabin`, SE.W / 2, y + 20, { align: 'center', size: 7, color: '#dfe8ff', alpha: pop });
    if (SE.button(SE.W / 2 - 34, y + 31, 68, 15, 'Lovely ♥', { active: true }) || (c.t > 0.8 && SE.key('Space')) || (SE.watching() && c.t > 4.5)) {
      s.card = null;
      SE.cardOpen = false;
      reset();
      if (Math.random() < 0.5) { SE.audio.sfx('woof'); SE.toast('Waffles approves. Loudly.', '#cfe6ff'); }
    }
  }
  const HANDS = { x: 244, y: 172, rot: -0.12 }; // where the fish lies in the close-up (tuned to the art)
  SE.FISHING_TIP = { x: 53, y: 27 }; // rod tip inside the (mirrored) fishing sprite
})();
