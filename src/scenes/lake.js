// Frozen Lake: ice fishing with Waffles. Wait for a nibble, then keep the fish in the green zone.
'use strict';

(function () {
  const HOLE = { x: 190, y: 235, rx: 44, ry: 9 };
  const POS = { man: { x: 96, y: 246 }, dog: { x: 58, y: 248 } };
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
    update(dt) {
      SE.audio.setAmbience({ wind: 0.4 + SE.weather.wind / 80, creaks: 1, storm: SE.weather.stormy() ? 1 : 0 });
    },
    draw(ctx, dt) {
      s.t += dt;
      SE.drawImg('bg_lake', 0, 0);
      SE.weather.tint(ctx);
      SE.weather.stars(ctx, 40);
      SE.weather.sunshine(ctx, 180);

      // ripples in the fishing hole
      if (Math.random() < dt * (s.state === 'nibble' ? 6 : 0.8)) s.ripples.push({ t: 0 });
      ctx.save();
      ctx.beginPath(); ctx.ellipse(HOLE.x, HOLE.y, HOLE.rx - 4, HOLE.ry - 2, 0, 0, Math.PI * 2); ctx.clip();
      for (let i = s.ripples.length - 1; i >= 0; i--) {
        const r = s.ripples[i]; r.t += dt;
        if (r.t > 2) { s.ripples.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(200,220,255,${0.4 * (1 - r.t / 2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(HOLE.x + 14, HOLE.y, 3 + r.t * 16, 1 + r.t * 3.5, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();

      // fishing line + bobber
      if (s.state === 'nibble') s.dip = Math.max(0, Math.sin(s.t * 9)) * 3;
      else s.dip = SE.approach(s.dip, 0, 6, dt);
      const bob = Math.sin(s.t * 1.6) * 0.8 + s.dip;
      const tip = SE.anims.fishing ? { x: POS.man.x + SE.FISHING_TIP.x, y: POS.man.y - SE.animSize('fishing').h + SE.FISHING_TIP.y } : { x: 150, y: 200 };
      const bx = HOLE.x + 14, by = HOLE.y - 2 + bob;
      ctx.strokeStyle = 'rgba(235,235,245,0.7)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.quadraticCurveTo((tip.x + bx) / 2, tip.y + 6, bx, by); ctx.stroke();
      ctx.fillStyle = '#e04a4a'; ctx.fillRect(Math.round(bx) - 1, Math.round(by) - 2, 3, 2);
      ctx.fillStyle = '#fff7ea'; ctx.fillRect(Math.round(bx) - 1, Math.round(by), 3, 1);

      // the traveler and Waffles
      if (SE.anims.fishing) {
        const sz = SE.animSize('fishing');
        SE.drawAnim('fishing', POS.man.x, POS.man.y - sz.h, s.t * 0.8, { pingpong: true });
      } else SE.drawActorFallback(ctx, POS.man.x + 20, POS.man.y - 40, '#a0522d');
      if (SE.anims.dog_sit) {
        const sz = SE.animSize('dog_sit');
        SE.drawAnim('dog_sit', POS.dog.x, POS.dog.y - sz.h, s.t * 0.7, { pingpong: true });
      }

      SE.weather.draw(ctx);

      // bite logic
      if (s.state === 'wait' && !s.mini && !s.card) {
        s.next -= dt;
        if (s.next <= 0) { s.state = 'nibble'; s.nibbleT = 4.5; s.react = SE.rand(0.8, 2); s.species = pickSpecies(); SE.audio.sfx('bite'); }
      } else if (s.state === 'nibble') {
        s.nibbleT -= dt;
        const ex = POS.man.x + 30, ey = POS.man.y - 78 + Math.sin(s.t * 10) * 1.5;
        SE.panel(ex - 6, ey, 13, 15, { fill: 'rgba(255,240,200,0.95)' });
        SE.text('!', ex, ey + 2, { align: 'center', size: 11, color: '#c14b4b', shadow: false, bold: true });
        if (Math.random() < dt * 2.5) SE.audio.sfx('bite');
        if (SE.watching() && s.nibbleT < 4.5 - s.react) startMini();
        else if (s.nibbleT <= 0) { reset(); SE.toast('The nibble drifted off. No rush.', '#cfe6ff'); }
      }

      if (s.mini) drawMini(ctx, dt);
      else if (s.card) drawCard(ctx);

      const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
      if (!s.mini && !s.card) {
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
    let hold = SE.mouse.down || SE.held('Space', 'ArrowUp', 'KeyW');
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
      s.card = { species: s.species, cm: Math.round((22 + Math.random() * 20) * f.size), t: 0, first: !SE.save.caught[s.species] };
      SE.addFish(s.species);
      SE.celebrate(s.card.first ? 'New species!' : 'Nice catch!', `${s.species} · ${s.card.cm} cm — ${SE.pick(SE.PROPS)}`);
      for (let i = 0; i < 10; i++) SE.spawnFloater(HOLE.x + SE.rand(-20, 20), HOLE.y - 10, 'spark', '#cfe6ff');
    } else if (m.prog <= 0) {
      s.mini = null;
      SE.audio.sfx('splash');
      SE.toast('It slipped away. Plenty more fish under the ice.', '#cfe6ff');
      reset();
    }
  }
  function drawCard(ctx) {
    const c = s.card;
    c.t += SE.dt;
    const pop = Math.min(1, c.t * 4);
    const W = 200, H = 120, x = SE.W / 2 - W / 2, y = SE.H / 2 - H / 2 - 10 + (1 - pop) * 10;
    SE.panel(x, y, W, H, { fill: 'rgba(48,40,70,0.97)', alpha: pop });
    SE.text(c.first ? 'first one in the journal' : 'into the bucket', SE.W / 2, y + 8, { align: 'center', size: 8, color: '#ffd166', alpha: pop });
    SE.drawFishSprite(ctx, c.species, SE.W / 2, y + 48 + Math.sin(SE.time * 3) * 2, 3);
    SE.text(c.species, SE.W / 2, y + 74, { align: 'center', size: 11, color: '#ffe6b8' });
    SE.text(`${c.cm} cm · cook it in the cabin kitchen`, SE.W / 2, y + 89, { align: 'center', size: 7, color: '#dfe8ff' });
    if (SE.button(SE.W / 2 - 34, y + H - 22, 68, 16, 'Lovely ♥', { active: true }) || SE.key('Space') || (SE.watching() && c.t > 3.5)) {
      s.card = null;
      reset();
      if (Math.random() < 0.5) { SE.audio.sfx('woof'); SE.toast('Waffles approves. Loudly.', '#cfe6ff'); }
    }
  }
  SE.FISHING_TIP = { x: 60, y: 10 };
})();
