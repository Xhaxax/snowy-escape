// Whispering Pines: hide behind a snowy bush with Waffles and sketch the deer when they look up.
'use strict';

(function () {
  let s = null;
  const photo = document.createElement('canvas');

  function spawnDeer() {
    const fromLeft = Math.random() < 0.5;
    const fawn = Math.random() < 0.3;
    s.deer.push({
      x: fromLeft ? -60 : SE.W + 10, y: SE.rand(206, 226), dir: fromLeft ? 1 : -1,
      state: 'walk', t: 0, target: SE.rand(150, 340), stay: SE.rand(40, 80), age: 0, fawn,
      sketched: false,
    });
  }

  SE.addScene('forest', {
    enter(p) {
      SE.save.location = 'forest';
      SE.persist();
      s = { t: 0, deer: [], spawnT: 2, sketch: false, flash: 0, polaroid: null, motes: [], tip: SE.save.deerPhotos === 0 };
      SE.audio.setMusic('outdoors');
      if (p.arrived) SE.toast('Shh… Waffles lies low behind the bush with you.', '#cfe6ff');
    },
    update(dt) {
      SE.audio.setAmbience({ wind: 0.2 + SE.weather.wind / 100, birds: 1 - SE.weather.night(), storm: SE.weather.stormy() ? 0.8 : 0 });
    },
    draw(ctx, dt) {
      s.t += dt;
      SE.drawImg('bg_forest', 0, 0);
      // drifting light motes in the sun rays
      if (Math.random() < dt * 6) s.motes.push({ x: SE.rand(150, 330), y: SE.rand(10, 160), t: 0, life: SE.rand(3, 6) });
      for (let i = s.motes.length - 1; i >= 0; i--) {
        const m = s.motes[i]; m.t += dt;
        if (m.t > m.life) { s.motes.splice(i, 1); continue; }
        m.x += Math.sin(m.t + i) * 3 * dt; m.y += 4 * dt;
        ctx.fillStyle = `rgba(255,246,210,${0.6 * Math.sin((m.t / m.life) * Math.PI)})`;
        ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
      }

      // deer
      s.spawnT -= dt;
      if (s.spawnT <= 0 && s.deer.length < 2 && !SE.weather.stormy()) { spawnDeer(); s.spawnT = SE.rand(14, 30) * (1 + SE.weather.night()); }
      s.deer.sort((a, b) => a.y - b.y);
      for (let i = s.deer.length - 1; i >= 0; i--) if (updateDeer(s.deer[i], dt)) s.deer.splice(i, 1);
      for (const d of s.deer) drawDeer(ctx, d);

      SE.weather.tint(ctx, 0.9);
      SE.weather.sunshine(ctx, 190);
      SE.weather.draw(ctx, { density: 0.8 });

      // the traveler and Waffles hiding in the foreground
      if (SE.anims.hide) {
        const sz = SE.animSize('hide');
        SE.drawAnim('hide', 6, SE.H - sz.h + 4, s.t * 0.6, { pingpong: true });
      } else if (SE.img('hide')) SE.drawImg('hide', 6, SE.H - SE.img('hide').height + 4);

      // watch mode: the traveler sketches by himself when a deer looks up
      if (SE.watching()) {
        s.autoCd = (s.autoCd == null ? 3 : s.autoCd) - dt;
        if (!s.aim && s.autoCd <= 0) {
          const d = s.deer.find((d) => d.state === 'look' && d.t < d.dur - 1.2);
          if (d) s.aim = { deer: d, t: 0 };
        }
        if (s.aim) {
          const b = deerBox(s.aim.deer);
          s.aim.t += dt;
          const ax = b.x + b.w / 2, ay = b.y + b.h / 2;
          ctx.strokeStyle = `rgba(255,247,234,${Math.min(1, s.aim.t * 3)})`; ctx.lineWidth = 1;
          ctx.strokeRect(Math.round(ax - 32) + 0.5, Math.round(ay - 24) + 0.5, 64, 48);
          if (s.aim.t > 1) {
            if (s.aim.deer.state === 'look' && s.deer.includes(s.aim.deer)) takeSketch(ax, ay, 64, 48, s.aim.deer);
            s.aim = null;
            s.autoCd = SE.rand(10, 22);
          }
        }
      }
      // sketch mode
      if (s.sketch && !SE.modal && !SE.watching()) {
        const mx = SE.mouse.x, my = SE.mouse.y;
        ctx.strokeStyle = 'rgba(255,247,234,0.9)'; ctx.lineWidth = 1;
        const fw = 64, fh = 48;
        ctx.strokeRect(Math.round(mx - fw / 2) + 0.5, Math.round(my - fh / 2) + 0.5, fw, fh);
        ctx.fillStyle = 'rgba(255,247,234,0.9)';
        ctx.fillRect(Math.round(mx) - 2, Math.round(my), 5, 1); ctx.fillRect(Math.round(mx), Math.round(my) - 2, 1, 5);
        SE.cursor = 'none';
        if (SE.mouse.released && my < SE.H - 30) {
          SE.mouse.released = false;
          const hit = s.deer.find((d) => SE.inRect(mx, my, deerBox(d)));
          if (!hit) SE.toast('Only snow and trees in that frame.', '#cfe6ff');
          else if (hit.state !== 'look') SE.toast(`${hit.fawn ? 'The fawn' : 'She'} is grazing — wait until ${hit.fawn ? 'it' : 'she'} looks up.`, '#cfe6ff');
          else takeSketch(mx, my, fw, fh, hit);
        }
      }
      if (s.flash > 0) {
        s.flash -= dt * 3;
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, s.flash)})`;
        ctx.fillRect(0, 0, SE.W, SE.H);
      }
      if (s.polaroid) drawPolaroid(ctx, dt);

      const a = SE.uiAlpha == null ? 1 : SE.uiAlpha;
      if (!SE.watching() && SE.button(SE.W - 96, SE.H - 24, 90, 18, s.sketch ? 'Put it away' : 'Sketchbook', { alpha: s.sketch ? 1 : a, active: s.sketch, icon: 'cam' })) s.sketch = !s.sketch;
      if (s.tip && s.t < 14 && !SE.watching()) SE.text(s.deer.length ? 'Open the sketchbook and click a deer while it looks up' : 'Wait quietly… the deer will come', 8, SE.H - 40, { size: 7, color: '#ffe6b8', alpha: Math.min(1, 14 - s.t) * a });
      SE.hud.draw(ctx, { title: 'Whispering Pines', subtitle: `deer sketched: ${SE.save.deerPhotos}`, map: true });
    },
  });

  function deerBox(d) {
    const sz = SE.animSize(d.state === 'walk' ? 'deer_walk' : 'deer_graze');
    const sc = d.fawn ? 0.75 : 1;
    return { x: d.x, y: d.y - sz.h * sc, w: sz.w * sc, h: sz.h * sc };
  }
  function updateDeer(d, dt) {
    d.t += dt; d.age += dt;
    if (d.state === 'walk') {
      const speed = 14;
      d.x += d.dir * speed * dt;
      if (d.leaving) { if (d.x < -80 || d.x > SE.W + 20) return true; }
      else if ((d.dir > 0 && d.x >= d.target) || (d.dir < 0 && d.x <= d.target)) { d.state = 'graze'; d.t = 0; d.dur = SE.rand(4, 8); }
    } else if (d.state === 'graze') {
      if (d.t > d.dur) { d.state = 'look'; d.t = 0; d.dur = SE.rand(2.5, 4.5); }
    } else if (d.state === 'look') {
      if (d.t > d.dur) {
        d.t = 0;
        if (d.age > d.stay) { d.state = 'walk'; d.leaving = true; d.dir = d.x > SE.W / 2 ? 1 : -1; }
        else if (Math.random() < 0.3) { d.state = 'walk'; d.target = SE.clamp(d.x + SE.rand(-80, 80), 120, 360); d.dir = d.target > d.x ? 1 : -1; }
        else { d.state = 'graze'; d.dur = SE.rand(4, 8); }
      }
    }
    return false;
  }
  function drawDeer(ctx, d) {
    const sc = d.fawn ? 0.75 : 1;
    const flip = d.dir < 0;
    const anim = d.state === 'walk' ? 'deer_walk' : 'deer_graze';
    if (!SE.anims[anim]) { SE.drawActorFallback(ctx, d.x, d.y - 24, '#9a6a44', true); return; }
    const sz = SE.animSize(anim);
    // soft shadow
    ctx.fillStyle = 'rgba(80,100,150,0.25)';
    ctx.fillRect(Math.round(d.x + 4), Math.round(d.y - 2), Math.round(sz.w * sc - 8), 2);
    let frame;
    if (d.state === 'walk') frame = Math.floor(d.t * 8) % SE.anims.deer_walk.frames;
    else if (d.state === 'look') frame = 0;
    else {
      // lower the head, nibble, stay down
      const n = SE.anims.deer_graze.frames;
      frame = Math.min(n - 1, Math.floor(d.t * 6));
      if (frame === n - 1) frame = n - 2 + (Math.floor(d.t * 3) % 2);
    }
    SE.drawAnim(anim, d.x, d.y - sz.h * sc, 0, { frame, flip, scale: sc });
    if (d.state === 'look' && s.sketch) {
      const b = deerBox(d);
      SE.text('looking!', b.x + b.w / 2, b.y - 9, { align: 'center', size: 6, color: '#ffd166' });
    }
  }

  function takeSketch(mx, my, fw, fh, deer) {
    SE.audio.sfx('camera');
    s.flash = 0.9;
    // capture what is on screen right now (minus the frame overlay) as a polaroid
    photo.width = fw * 2; photo.height = fh * 2;
    const p = photo.getContext('2d');
    p.imageSmoothingEnabled = false;
    const sc = SE.scale;
    p.drawImage(SE.canvas, (mx - fw / 2) * sc, (my - fh / 2) * sc, fw * sc, fh * sc, 0, 0, fw * 2, fh * 2);
    // soft sepia "sketch" wash
    p.globalCompositeOperation = 'color';
    p.fillStyle = 'rgba(180,150,120,0.35)';
    p.fillRect(0, 0, photo.width, photo.height);
    s.polaroid = { t: 0, fawn: deer.fawn };
    SE.save.deerPhotos++;
    SE.save.photos.push({ kind: deer.fawn ? 'fawn' : 'deer', t: Date.now() });
    if (SE.save.photos.length > 30) SE.save.photos.shift();
    SE.persist();
    setTimeout(() => SE.celebrate('Lovely sketch!', `${deer.fawn ? 'A curious fawn' : 'A doe'} for the journal. ${SE.pick(SE.PROPS)}`), 350);
  }
  function drawPolaroid(ctx, dt) {
    const p = s.polaroid;
    p.t += dt;
    const life = 4.5;
    const slide = Math.min(1, p.t * 3) - Math.max(0, (p.t - life + 0.4) * 3);
    const x = SE.W - 150 + (1 - slide) * 160, y = 46;
    ctx.save();
    ctx.translate(x + 70, y + 60);
    ctx.rotate(-0.05);
    ctx.fillStyle = 'rgba(20,14,30,0.4)'; ctx.fillRect(-66, -54, 136, 120);
    ctx.fillStyle = '#fbf6ec'; ctx.fillRect(-68, -56, 136, 120);
    ctx.drawImage(photo, -62, -50, 124, 92);
    ctx.restore();
    SE.text(p.fawn ? 'a curious fawn' : 'a doe in the pines', x + 70, y + 108, { align: 'center', size: 7, color: '#5a4a5a', shadow: false });
    if (p.t > life) s.polaroid = null;
  }
})();
