// World map: a floating snowy valley. Pick a place, then walk there.
'use strict';

(function () {
  SE.PLACES = {
    cabin: { x: 120, y: 186, label: 'The Cabin', desc: 'Fire, cocoa, Mochi, chores on the porch and a warm kitchen.', scene: 'cabin' },
    forest: { x: 150, y: 74, label: 'Whispering Pines', desc: 'Quiet woods where the deer come to graze.', scene: 'forest' },
    summit: { x: 352, y: 58, label: 'Summit Trail', desc: 'A ledge above the clouds. Breathe. Make a wish.', scene: 'summit' },
    lake: { x: 360, y: 182, label: 'Frozen Lake', desc: 'Ice fishing with Waffles by your side.', scene: 'lake' },
  };
  const stars = Array.from({ length: 90 }, () => ({ x: Math.random() * SE.W, y: Math.random() * SE.H, p: Math.random() * 6 }));
  let hover = null, selected = null;

  SE.addScene('map', {
    enter() {
      selected = null;
      SE.audio.setMusic('outdoors');
      SE.audio.setAmbience({ wind: 0.5, fire: 0, birds: 0.2 });
    },
    update() {},
    draw(ctx) {
      // night sky around the floating valley
      const g = ctx.createLinearGradient(0, 0, 0, SE.H);
      g.addColorStop(0, '#1b1838'); g.addColorStop(1, '#2d2a55');
      ctx.fillStyle = g; ctx.fillRect(0, 0, SE.W, SE.H);
      for (const s of stars) {
        const a = 0.4 + 0.4 * Math.sin(SE.time * 1.5 + s.p);
        ctx.fillStyle = `rgba(255,250,230,${a})`;
        ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
      }
      const floatY = Math.round(Math.sin(SE.time * 0.6) * 2);
      ctx.save();
      ctx.translate(0, floatY);
      SE.drawImg('bg_map', 0, 0);
      SE.drawChimneySmoke(ctx, 132, 152, SE.dt, 0.6);

      const here = SE.save.location;
      hover = null;
      for (const [id, p] of Object.entries(SE.PLACES)) {
        const r = { x: p.x - 26, y: p.y - 26, w: 52, h: 46 };
        const over = !SE.modal && SE.inRect(SE.mouse.x, SE.mouse.y - floatY, r);
        if (over) { hover = id; SE.cursor = 'pointer'; }
        // pin
        const lift = over || selected === id ? 3 + Math.sin(SE.time * 6) : 0;
        const py = p.y - 20 - lift;
        ctx.fillStyle = 'rgba(20,16,30,0.35)';
        ctx.fillRect(p.x - 3, p.y - 2, 7, 2);
        ctx.fillStyle = id === here ? '#e8aa60' : '#ff8fa3';
        ctx.fillRect(p.x - 4, py, 9, 9);
        ctx.fillRect(p.x - 2, py + 9, 5, 3);
        ctx.fillRect(p.x, py + 12, 1, 6);
        ctx.fillStyle = '#fff7ea';
        ctx.fillRect(p.x - 1, py + 3, 3, 3);
        const lw = SE.measure(p.label, 8) + 10;
        SE.panel(p.x - lw / 2, py - 16, lw, 13, { alpha: over || selected === id ? 1 : 0.8 });
        SE.text(p.label, p.x, py - 13, { align: 'center', size: 8, color: id === here ? '#ffe6b8' : '#fff7ea' });
        if (id === here) {
          const hy = py - 30 + Math.sin(SE.time * 3) * 1.5;
          SE.text('you are here', p.x, hy, { align: 'center', size: 6, color: '#ffe6b8' });
        }
      }
      ctx.restore();
      SE.weather.tint(ctx, 0.7);
      SE.weather.draw(ctx, { density: 0.5 });
      if (SE.weather.stormy()) SE.text('Snowstorm — the trails are closed until it calms down', SE.W / 2, 40, { align: 'center', size: 8, color: '#cfe6ff', alpha: 0.7 + 0.3 * Math.sin(SE.time * 2) });

      if (hover && SE.mouse.released) { selected = hover; SE.audio.sfx('pop'); SE.mouse.released = false; }

      // destination card
      if (selected) {
        const p = SE.PLACES[selected];
        const dist = Math.round(Math.hypot(p.x - SE.PLACES[here].x, p.y - SE.PLACES[here].y) * 9);
        SE.panel(SE.W / 2 - 120, SE.H - 62, 240, 56, { fill: 'rgba(48,40,70,0.96)' });
        SE.text(p.label, SE.W / 2 - 110, SE.H - 56, { size: 10, color: '#ffe6b8' });
        SE.text(p.desc, SE.W / 2 - 110, SE.H - 42, { size: 7, color: '#dfe8ff' });
        const stormy = SE.weather.stormy() && selected !== 'cabin';
        const buried = here === 'cabin' && selected !== here && SE.save.snowDepth >= 0.6;
        const label = selected === here ? (here === 'cabin' ? 'Go home' : 'Go back') : stormy ? 'Too stormy…' : buried ? 'Path is buried' : `Walk there · ${dist} m`;
        if (SE.button(SE.W / 2 - 110, SE.H - 28, 110, 17, label, { fill: stormy || buried ? 'rgba(70,64,90,0.7)' : undefined })) {
          if (selected === here) SE.go(here === 'cabin' ? 'yard' : p.scene);
          else if (stormy) SE.toast('A snowstorm is blowing. Wait it out by the fire.', '#cfe6ff');
          else if (buried) { SE.toast('Too much snow on the path — shovel it first.', '#cfe6ff'); SE.go('yard', { mode: 'shovel' }); }
          else SE.go('travel', { from: here, to: selected, dist });
        }
        if (SE.button(SE.W / 2 + 50, SE.H - 28, 60, 17, 'Not yet')) selected = null;
      } else {
        SE.text('Choose where to wander next', SE.W / 2, SE.H - 16, { align: 'center', size: 8, color: '#dfe8ff', alpha: 0.6 + 0.3 * Math.sin(SE.time * 2) });
      }
      SE.hud.draw(ctx, { watch: false, title: 'The Valley', back: () => SE.go(here === 'cabin' ? 'yard' : SE.PLACES[here].scene) });
    },
  });
})();
