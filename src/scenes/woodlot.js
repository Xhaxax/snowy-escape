// The woodlot: a clearing near the cabin with the chopping block, a big snowy woodpile under its
// lean-to and felled pines. Chopping is the one skill here (stop the swing high); after five good
// splits a little cutscene stacks the wood and carries an armful inside to the fire.
'use strict';

(function () {
  const CHOP = { x: 262, y: 246 };  // feet of the chopper (his stump is part of the sprite)
  const DOG = { x: 330, y: 250 };
  const PILE = { x: 156, y: 244 };   // the fresh split logs, growing beside the block
  const ROUND = 5;                  // good splits before the wood is stacked and carried in
  let s = null;

  SE.addScene('woodlot', {
    enter() {
      SE.save.location = 'woodlot';
      SE.persist();
      s = { t: 0, chips: [], meter: 0, chopAnim: 0, auto: 0, splits: 0, busy: false };
      SE.audio.setMusic('outdoors');
      SE.moment('chop'); // the axe biting into a log: a still and the sound
    },
    update() {
      SE.audio.setAmbience({ wind: 0.6 + SE.weather.wind / 90, fire: 0, birds: SE.weather.night() > 0.6 ? 0 : 0.4, storm: SE.weather.stormy() ? 1 : 0 });
    },
    draw(ctx, dt) {
      s.t += dt;
      SE.drawImg('bg_woodlot', 0, 0);
      SE.weather.sway(ctx, 'bg_woodlot', [[0, 0, 110, 190], [380, 0, 100, 190]]);
      SE.weather.overcast(ctx, 120);
      drawActors(ctx, dt);
      for (let i = s.chips.length - 1; i >= 0; i--) {
        const c = s.chips[i];
        c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 160 * dt;
        if (c.t > 1.2) { s.chips.splice(i, 1); continue; }
        ctx.fillStyle = c.c; ctx.fillRect(Math.round(c.x), Math.round(c.y), c.s, c.s);
      }
      SE.weather.tint(ctx);
      SE.travelerLight && SE.travelerLight(ctx, CHOP.x + 20, CHOP.y - 30);
      SE.weather.stars(ctx, 60);
      SE.weather.sunshine(ctx, 215);
      SE.weather.draw(ctx);
      if (!s.busy && !SE.momentPlaying()) drawMeter(ctx, dt);
      drawButtons();
      SE.hud.draw(ctx, { title: 'Woodlot', subtitle: `firewood: ${SE.save.wood} · splits this round: ${s.splits}/${ROUND}`, map: false });
    },
  });

  function drawActors(ctx, dt) {
    SE.drawWoodpile(ctx, PILE.x, PILE.y, s.splits * 3 + 3);
    if (SE.anims.chop) {
      const frame = s.chopAnim > 0 ? Math.floor(s.chopAnim) % SE.anims.chop.frames : 0;
      SE.drawAnim('chop', CHOP.x - 40, CHOP.y - SE.animSize('chop').h, 0, { frame });
      SE.headphones(ctx, CHOP.x - 40 + 32, CHOP.y - SE.animSize('chop').h + 8);
    }
    // Waffles lies in the snow watching; a good split gets a bark from where he lies, then a grin
    s.woof = (s.woof == null ? -1 : s.woof) + (s.woof >= 0 ? dt : 0);
    if (!SE.drawDogLieCheer(DOG.x + 20, DOG.y + 4, s.woof, { flip: true })) { s.woof = -1; SE.drawDogRest(DOG.x + 20, DOG.y + 4, { flip: true }); }
    else if (s.woof > 0.3 && s.woof < 0.3 + dt) SE.spawnFloater(DOG.x + 34, DOG.y - 30, 'heart');
  }

  // stop the swing in the sweet spot
  function drawMeter(ctx, dt) {
    s.meter += dt * 0.9;
    const v = (Math.sin(s.meter * 2.4) + 1) / 2;
    const x = 30, y = 70, h = 90;
    SE.panel(x - 6, y - 16, 30, h + 34, { alpha: 0.92 });
    SE.text('swing', x + 9, y - 12, { size: 6, align: 'center', color: '#dfe8ff' });
    ctx.fillStyle = '#20304e'; ctx.fillRect(x, y, 18, h);
    ctx.fillStyle = 'rgba(127,211,138,0.85)'; ctx.fillRect(x, y, 18, h * 0.22);
    ctx.fillStyle = 'rgba(232,194,122,0.7)'; ctx.fillRect(x, y + h * 0.22, 18, h * 0.16);
    ctx.fillStyle = '#fff7ea'; ctx.fillRect(x - 3, Math.round(y + h * (1 - v)) - 1, 24, 3);
    if (s.chopAnim > 0 && SE.anims.chop) s.chopAnim = Math.min(SE.anims.chop.frames - 0.01, s.chopAnim + dt * 12);
    if (SE.anims.chop && s.chopAnim >= SE.anims.chop.frames - 0.02) s.chopAnim = 0;
    if (!SE.watching()) SE.text('Click (or Space) when the swing is high — no rush', SE.W / 2, SE.H - 40, { align: 'center', size: 8, color: '#ffe6b8', alpha: 0.8 });
    const auto = SE.watching() && v > 0.84 && (s.auto -= dt) <= 0;
    const tap = !SE.modal && ((SE.mouse.pressed && SE.mouse.y < SE.H - 30 && SE.mouse.y > 30) || SE.key('Space'));
    if (!tap && !auto) return;
    s.auto = SE.rand(2.2, 4);
    s.chopAnim = 0.01;
    SE.audio.sfx('chop');
    const good = v > 0.62, perfect = v > 0.78;
    for (let i = 0; i < (perfect ? 16 : 7); i++) s.chips.push({ x: CHOP.x + 4, y: CHOP.y - 20, vx: SE.rand(-60, 60), vy: SE.rand(-90, -30), t: 0, s: Math.random() < 0.3 ? 2 : 1, c: SE.pick(['#c99a62', '#e8c99a', '#8a5a34']) });
    if (!good) { SE.toast('Glanced off — try again, no hurry.', '#cfe6ff'); return; }
    SE.save.wood = Math.min(40, SE.save.wood + (perfect ? 2 : 1));
    SE.save.logs++;
    SE.persist();
    s.splits++;
    SE.toast(perfect ? 'Clean split! +2 firewood' : '+1 firewood', '#ffe6b8');
    if (!(s.woof >= 0)) { s.woof = 0; setTimeout(() => SE.audio.sfx('woof'), 160); }
    if (s.splits >= ROUND) finishRound();
  }
  // the round is done: stack it, carry an armful in, and the fire gets a fresh log
  function finishRound() {
    s.busy = true;
    SE.moment('woodDone', { force: true, then: () => {
      SE.save.fire = Math.min(1, SE.save.fire + 0.35); SE.persist();
      SE.celebrate('Woodpile stacked!', `${SE.save.wood} pieces of firewood. An armful is already by the fire. ${SE.pick(SE.PROPS)}`);
      SE.go('cabin', { inDoor: true });
    } });
  }
  function drawButtons() {
    if (SE.watching() || s.busy || SE.momentPlaying()) return;
    const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
    if (SE.button(SE.W - 86, SE.H - 46, 80, 18, 'To the cabin', { alpha: a })) SE.go('yard', {});
    if (SE.button(SE.W - 86, SE.H - 24, 80, 18, 'The valley', { alpha: a })) SE.go('map', {});
  }
})();
