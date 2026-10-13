// The valley: a big snowy world seen from above. Walk with Waffles along the paths through a dense
// pine forest to each place. The camera follows you; drag (or use the arrow keys) to look around.
'use strict';

(function () {
  const WW = window.SE_WORLD.W, WH = window.SE_WORLD.H; // world size in pixels (3x the screen)
  const SNOW = 'rgb(218,213,224)';

  SE.PLACES = {
    cabin: { node: 'cabin', label: 'The Cabin', desc: 'Fire, cocoa, Mochi, the woodpile and a warm kitchen.', scene: 'yard' },
    forest: { node: 'forest', label: 'Whispering Pines', desc: 'Deer come to graze in this quiet clearing.', scene: 'forest' },
    summit: { node: 'summit', label: 'Summit Trail', desc: 'Up past the cave to a ledge above the clouds.', scene: 'summit' },
    lake: { node: 'lake', label: 'Frozen Lake', desc: 'Ice fishing with Waffles by your side.', scene: 'lake' },
    trail: { node: 'trail', label: 'Long Walk', desc: 'The old trail out of the valley. Just keep walking.', scene: 'trail' },
  };
  // path network, lake, clearings and landmarks come from src/world_layout.js (also used by
  // tools/build_world.py, which auto-tiles the ground with the PixelLab Wang tilesets)
  const L = window.SE_WORLD;
  const N = L.nodes;
  const EDGES = L.edges;
  const ADJ = {}, CURVE = {};
  function bez(p0, c, p1, t) { const u = 1 - t; return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]; }
  for (const [u, v, c] of EDGES) {
    (ADJ[u] = ADJ[u] || []).push(v); (ADJ[v] = ADJ[v] || []).push(u);
    const pts = []; for (let k = 0; k <= 24; k++) pts.push(bez(N[u], c, N[v], k / 24));
    CURVE[u + '>' + v] = pts; CURVE[v + '>' + u] = pts.slice().reverse();
  }
  function route(from, to) {
    const prev = { [from]: null }, q = [from];
    while (q.length) { const u = q.shift(); if (u === to) break; for (const v of ADJ[u] || []) if (!(v in prev)) { prev[v] = u; q.push(v); } }
    const nodes = []; for (let u = to; u; u = prev[u]) nodes.unshift(u);
    const pts = [N[nodes[0]]];
    for (let k = 1; k < nodes.length; k++) pts.push(...CURVE[nodes[k - 1] + '>' + nodes[k]].slice(1));
    return pts;
  }
  const len = (pts) => { let d = 0; for (let k = 1; k < pts.length; k++) d += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); return d; };
  SE.placeDistance = (a, b) => len(route(a, b));

  // ------------------------------------------------------------ world building (once)
  let world = null, nearTrees = [];
  const CABIN = L.objects.find((o) => o.img === 'map/cabin_td') || { x: 244, y: 566 };

  function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function buildWorld() {
    const r = rng(7);
    const cv = document.createElement('canvas');
    cv.width = WW; cv.height = WH;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    const pathPts = [];
    for (const k in CURVE) { if (k.split('>')[0] < k.split('>')[1]) for (let t = 0; t < CURVE[k].length - 1; t++) { const [a, b] = [CURVE[k][t], CURVE[k][t + 1]]; for (let q = 0; q < 6; q++) pathPts.push([a[0] + (b[0] - a[0]) * q / 6, a[1] + (b[1] - a[1]) * q / 6]); } }
    if (SE.img('world_ground')) c.drawImage(SE.img('world_ground'), 0, 0);
    else {
      // fallback if the tiled ground is missing: flat snow + simple paths
      c.fillStyle = SNOW; c.fillRect(0, 0, WW, WH);
      c.fillStyle = 'rgb(124,114,98)';
      for (const [x, y] of pathPts) { c.beginPath(); c.arc(Math.round(x), Math.round(y), 9, 0, Math.PI * 2); c.fill(); }
    }
    // the trail leaves the valley over old stone steps
    for (let k = 0; k < 3; k++) { c.fillStyle = k % 2 ? 'rgb(120,116,112)' : 'rgb(146,140,132)'; c.fillRect(704, 872 + k * 8, 32, 6); }

    // landmarks that sit flat on the ground (drawn before the trees)
    for (const o of L.objects) { const img = SE.img(o.img); if (img && o.img !== 'map/cabin_td') c.drawImage(img, o.x, o.y); }

    // a dense pine forest everywhere except the paths, clearings, lake and landmarks
    const lk = L.lake;
    const solids = L.objects.filter((o) => o.solid).map((o) => o.solid);
    const blocked = (x, y) => {
      for (const cl of L.clearings) if (Math.hypot(x - cl.x, y - cl.y) < cl.r) return true;
      if (((x - lk.cx) / (lk.rx + 18)) ** 2 + ((y - lk.cy) / (lk.ry + 24)) ** 2 < 1) return true;
      for (const [sx, sy, sw, sh] of solids) if (x > sx && x < sx + sw && y > sy && y < sy + sh) return true;
      return false;
    };
    const grid = {};
    for (const [x, y] of pathPts) { const k = ((x / 30) | 0) + ',' + ((y / 30) | 0); (grid[k] = grid[k] || []).push([x, y]); }
    // distance to the nearest path point (and whether the tree stands south of it, where its
    // crown would hide the walkers)
    const pathDist = (x, y) => {
      let best = 1e9, south = false; const gx = (x / 30) | 0, gy = (y / 30) | 0;
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (const p of grid[(gx + i) + ',' + (gy + j)] || []) {
        const d = Math.hypot(p[0] - x, p[1] - y);
        if (d < best) { best = d; south = y > p[1]; }
      }
      return { d: best, south };
    };
    const trees = [];
    for (let gy = -16; gy < WH + 60; gy += 13) {
      for (let gx = -16; gx < WW + 16; gx += 21) {
        const x = gx + (r() - 0.5) * 14 + ((gy / 13) % 2) * 10, y = gy + (r() - 0.5) * 8;
        if (blocked(x, y)) continue;
        const pd = pathDist(x, y);
        if (pd.d < 24 || (pd.south && pd.d < 54)) continue;
        if (r() < 0.06) continue; // tiny natural gaps
        trees.push({ x, y, img: r() < 0.55 ? 'map/pine' : 'map/spruce', flip: r() < 0.5, near: pd.d < 90 });
      }
    }
    trees.sort((a, b) => a.y - b.y);
    nearTrees = [];
    const cab = SE.img('map/cabin_td');
    let cabinDrawn = false;
    for (const t of trees) {
      if (!cabinDrawn && cab && t.y > CABIN.y + cab.height - 14) { c.drawImage(cab, CABIN.x, CABIN.y); cabinDrawn = true; }
      if (t.near) { nearTrees.push(t); continue; }
      drawTree(c, t);
    }
    if (!cabinDrawn && cab) c.drawImage(cab, CABIN.x, CABIN.y);
    world = cv;
  }
  function drawTree(c, t) {
    const img = SE.img(t.img);
    if (!img) return;
    const x = Math.round(t.x - img.width / 2), y = Math.round(t.y - img.height + 6);
    if (t.flip) { c.save(); c.translate(x + img.width, y); c.scale(-1, 1); c.drawImage(img, 0, 0); c.restore(); }
    else c.drawImage(img, x, y);
  }

  // signposts at each place of interest
  function sign(ctx, x, y, text) {
    const w = SE.measure(text, 7) + 8;
    ctx.fillStyle = '#4a3226'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 12, 2, 12);
    SE.panel(x - w / 2, y - 24, w, 12, { fill: 'rgba(122,84,58,0.98)', border: 'rgba(60,38,28,1)' });
    SE.text(text, x, y - 22, { size: 7, align: 'center', color: '#fff3dc', shadow: false });
  }
  const SIGNS = L.signs;

  // ------------------------------------------------------------ scene
  let s = null;
  function dirOf(dx, dy) { return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n'; }

  SE.addScene('map', {
    enter(p) {
      if (!world) buildWorld();
      const here = SE.PLACES[SE.save.location] ? SE.save.location : 'cabin';
      const at = N[SE.PLACES[here].node];
      s = {
        here, selected: null, walking: null, t: 0, fast: false,
        hero: { x: at[0], y: at[1], dir: 's', moving: false, anim: 0 },
        dog: { x: at[0] - 12, y: at[1] + 4, dir: 's', moving: false, anim: 0 },
        trail: [], prints: [], stepT: 0, cam: { x: at[0] - SE.W / 2, y: at[1] - SE.H / 2 }, drag: null, follow: true,
      };
      for (let k = 0; k < 30; k++) s.trail.push({ x: s.dog.x, y: s.dog.y });
      clampCam();
      SE.audio.setMusic('outdoors');
      if (p && p.walkTo && p.walkTo !== here) setTimeout(() => { if (SE.sceneName === 'map' && !s.walking) startWalk(p.walkTo); }, 800);
    },
    update() {
      SE.audio.setAmbience({ wind: 0.4 + SE.weather.wind / 90, birds: 0.35 * (1 - SE.weather.night()), storm: SE.weather.stormy() ? 0.8 : 0 });
    },
    draw(ctx, dt) {
      s.t += dt;
      walk(dt);
      camera(dt);
      const cx = Math.round(s.cam.x), cy = Math.round(s.cam.y);
      ctx.drawImage(world, cx, cy, SE.W, SE.H, 0, 0, SE.W, SE.H);
      ctx.save();
      ctx.translate(-cx, -cy);
      SE.drawChimneySmoke(ctx, CABIN.x + 66, CABIN.y + 12, dt, 0.7);
      ctx.save(); ctx.globalAlpha = 0.45 + SE.weather.night() * 0.7;
      SE.drawWindowGlow(ctx, [{ x: CABIN.x + 36, y: CABIN.y + 52, r: 8 }, { x: CABIN.x + 84, y: CABIN.y + 70, r: 8 }, { x: CABIN.x + 56, y: CABIN.y + 40, r: 6 }]);
      ctx.restore();
      for (let k = s.prints.length - 1; k >= 0; k--) {
        const p = s.prints[k]; p.t += dt;
        if (p.t > 40) { s.prints.splice(k, 1); continue; }
        ctx.fillStyle = `rgba(110,118,165,${0.5 * (1 - p.t / 40)})`;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      // y-sorted: trees near the paths + the two walkers
      const view = (o) => o.x > cx - 40 && o.x < cx + SE.W + 40 && o.y > cy - 10 && o.y < cy + SE.H + 60;
      const list = nearTrees.filter(view).map((t) => ({ y: t.y, draw: () => drawTree(ctx, t) }));
      list.push({ y: s.dog.y, draw: () => drawWalker(ctx, 'dog', s.dog) }, { y: s.hero.y, draw: () => drawWalker(ctx, 'hero', s.hero) });
      list.sort((a, b) => a.y - b.y).forEach((o) => o.draw());
      for (const [id, [x, y]] of Object.entries(SIGNS)) if (x > cx - 60 && x < cx + SE.W + 60 && y > cy - 20 && y < cy + SE.H + 30) sign(ctx, x, y, SE.PLACES[id].label);
      drawPins(ctx, cx, cy);
      ctx.restore();

      SE.weather.tint(ctx, 0.75);
      SE.weather.sunshine(ctx, 0);
      SE.weather.draw(ctx, { density: 0.5 });
      drawOffscreen(ctx, cx, cy);
      if (SE.weather.stormy()) SE.text('Snowstorm — the trails are closed until it calms down', SE.W / 2, 46, { align: 'center', size: 8, color: '#cfe6ff', alpha: 0.7 + 0.3 * Math.sin(SE.time * 2) });
      drawCard(ctx);
      const back = () => (SE.weather.stormy() && s.here !== 'cabin' ? startWalk('cabin') : SE.go(SE.PLACES[s.here].scene));
      SE.hud.draw(ctx, { watch: false, title: 'The Valley', back: s.walking ? null : back });
    },
  });

  // ------------------------------------------------------------ camera: follow the walkers, or drag to look around
  function clampCam() { s.cam.x = SE.clamp(s.cam.x, 0, WW - SE.W); s.cam.y = SE.clamp(s.cam.y, 0, WH - SE.H); }
  function camera(dt) {
    const m = SE.mouse;
    if (!SE.modal && m.pressed && m.y > 30 && m.y < SE.H - 64) s.drag = { x: m.x, y: m.y, cx: s.cam.x, cy: s.cam.y, moved: 0 };
    if (s.drag && m.down) {
      s.drag.moved += SE.mouse.moved;
      if (s.drag.moved > 4) { s.cam.x = s.drag.cx - (m.x - s.drag.x); s.cam.y = s.drag.cy - (m.y - s.drag.y); s.follow = false; SE.cursor = 'grabbing'; }
    }
    if (!m.down && s.drag) { s.wasDrag = s.drag.moved > 4; s.drag = null; } else s.wasDrag = false;
    const kx = (SE.held('ArrowRight', 'KeyD') ? 1 : 0) - (SE.held('ArrowLeft', 'KeyA') ? 1 : 0);
    const ky = (SE.held('ArrowDown', 'KeyS') ? 1 : 0) - (SE.held('ArrowUp', 'KeyW') ? 1 : 0);
    if (kx || ky) { s.cam.x += kx * 220 * dt; s.cam.y += ky * 220 * dt; s.follow = false; }
    if (s.walking) s.follow = true;
    if (s.follow) {
      s.cam.x = SE.approach(s.cam.x, s.hero.x - SE.W / 2, 2.5, dt);
      s.cam.y = SE.approach(s.cam.y, s.hero.y - SE.H / 2 - 10, 2.5, dt);
    }
    clampCam();
  }

  // ------------------------------------------------------------ walking along the route
  function startWalk(to) {
    s.walking = { to, path: route(SE.PLACES[s.here].node, SE.PLACES[to].node), i: 1, len: 0 };
    s.selected = null;
    s.follow = true;
  }
  function walk(dt) {
    const h = s.hero;
    h.moving = false;
    if (s.walking) {
      const w = s.walking;
      let budget = (s.fast ? 52 : 20) * (SE.save.snowDepth > 0.6 ? 0.85 : 1) * dt;
      while (budget > 0 && w.path[w.i]) {
        const t = w.path[w.i];
        const dx = t[0] - h.x, dy = t[1] - h.y, d = Math.hypot(dx, dy);
        if (d <= budget) { h.x = t[0]; h.y = t[1]; budget -= d; w.len += d; w.i++; continue; }
        h.x += (dx / d) * budget; h.y += (dy / d) * budget; w.len += budget; budget = 0;
        h.dir = dirOf(dx, dy);
      }
      h.moving = true;
      h.anim += dt * (s.fast ? 1.8 : 1);
      s.stepT -= dt * (s.fast ? 1.8 : 1);
      if (s.stepT <= 0) {
        s.stepT = 0.34;
        SE.audio.sfx('step');
        const side = (Math.floor(h.anim / 0.34) % 2) ? 1 : -1;
        s.prints.push({ x: h.x + (h.dir === 'n' || h.dir === 's' ? side : 0), y: h.y + (h.dir === 'e' || h.dir === 'w' ? side : 0), t: 0 });
      }
      if (!w.path[w.i]) {
        const to = w.to;
        s.walking = null; s.here = to;
        SE.save.location = to;
        SE.save.distance += w.len * 3;
        SE.persist();
        if (to === 'cabin') SE.audio.sfx('door');
        SE.go(SE.PLACES[to].scene, { arrived: true });
      }
    }
    // Waffles trots along behind, sniffing the path
    if (h.moving) s.trail.push({ x: h.x, y: h.y });
    if (s.trail.length > 30) s.trail.shift();
    const d = s.dog, tgt = s.trail[0];
    const ddx = tgt.x - d.x, ddy = tgt.y - d.y, dd = Math.hypot(ddx, ddy);
    d.moving = dd > 0.4;
    if (d.moving) {
      d.x += ddx * Math.min(1, dt * 5); d.y += ddy * Math.min(1, dt * 5);
      d.dir = dirOf(ddx, ddy); d.anim += dt;
      if (Math.random() < dt * 2.5) s.prints.push({ x: d.x, y: d.y, t: 0 });
    }
  }
  function drawWalker(ctx, who, a) {
    const name = `${who === 'hero' ? 'td_trav' : 'td_dog'}_${a.dir === 'w' ? 'e' : a.dir}`;
    ctx.fillStyle = 'rgba(60,70,120,0.28)';
    ctx.beginPath(); ctx.ellipse(Math.round(a.x), Math.round(a.y), who === 'hero' ? 5 : 6, 2, 0, 0, Math.PI * 2); ctx.fill();
    if (SE.anims[name]) {
      const sz = SE.animSize(name);
      const frame = a.moving ? Math.floor(a.anim * (who === 'hero' ? 8 : 10)) % SE.anims[name].frames : 0;
      SE.drawAnim(name, Math.round(a.x - sz.w / 2), Math.round(a.y - sz.h + 2), 0, { frame, flip: a.dir === 'w' });
    } else if (who === 'hero') {
      ctx.fillStyle = '#8a5a34'; ctx.fillRect(Math.round(a.x) - 3, Math.round(a.y) - 10, 7, 9);
      ctx.fillStyle = '#c14b4b'; ctx.fillRect(Math.round(a.x) - 3, Math.round(a.y) - 14, 7, 4);
    } else {
      ctx.fillStyle = '#211e2e'; ctx.fillRect(Math.round(a.x) - 5, Math.round(a.y) - 6, 10, 6);
      ctx.fillStyle = '#fcfcf4'; ctx.fillRect(Math.round(a.x) - 1, Math.round(a.y) - 5, 2, 2);
    }
  }

  // ------------------------------------------------------------ pins, off-screen markers & destination card
  function drawPins(ctx, cx, cy) {
    s.hover = null;
    for (const [id, p] of Object.entries(SE.PLACES)) {
      const [x, y] = N[p.node];
      if (id === s.here && !s.walking) continue;
      const r = { x: x - 18, y: y - 40, w: 36, h: 44 };
      const over = !SE.modal && !s.walking && SE.inRect(SE.mouse.x + cx, SE.mouse.y + cy, r);
      if (over) { s.hover = id; SE.cursor = 'pointer'; }
      const bob = over || s.selected === id ? 2 + Math.sin(SE.time * 6) : Math.sin(SE.time * 2 + x) * 1;
      const py = y - 40 - bob;
      ctx.fillStyle = s.walking && s.walking.to === id ? '#ffd166' : '#ff8fa3';
      ctx.fillRect(x - 3, py, 7, 7); ctx.fillRect(x - 1, py + 7, 3, 3);
      ctx.fillStyle = '#fff7ea'; ctx.fillRect(x - 1, py + 2, 3, 3);
    }
    if (s.hover && SE.mouse.released && !s.wasDrag) { s.selected = s.hover; SE.audio.sfx('pop'); SE.mouse.released = false; }
  }
  function drawOffscreen(ctx, cx, cy) {
    for (const [id, p] of Object.entries(SE.PLACES)) {
      if (id === s.here && !s.walking) continue;
      const [x, y] = N[p.node];
      const sx = x - cx, sy = y - cy;
      if (sx > 10 && sx < SE.W - 10 && sy > 30 && sy < SE.H - 10) continue;
      const ex = SE.clamp(sx, 40, SE.W - 40), ey = SE.clamp(sy, 50, SE.H - 30);
      const label = `${p.label} ${sx < 10 ? '←' : sx > SE.W - 10 ? '→' : sy < 30 ? '↑' : '↓'}`;
      const w = SE.measure(label, 7) + 8;
      const r = { x: ex - w / 2, y: ey - 6, w, h: 12 };
      const over = !SE.modal && !s.walking && SE.inRect(SE.mouse.x, SE.mouse.y, r);
      SE.panel(r.x, r.y, w, 12, { alpha: over ? 1 : 0.7 });
      SE.text(label, ex, ey - 4, { size: 7, align: 'center', color: '#ffe6b8' });
      if (over) { SE.cursor = 'pointer'; if (SE.mouse.released) { s.selected = id; SE.mouse.released = false; s.follow = false; s.cam.x = x - SE.W / 2; s.cam.y = y - SE.H / 2; clampCam(); } }
    }
  }
  function drawCard(ctx) {
    const a = 1;
    if (s.walking) {
      const to = SE.PLACES[s.walking.to];
      const left = len(s.walking.path.slice(s.walking.i));
      const msg = `Walking to ${to.label} with Waffles… ${Math.round(left * 3)} m`;
      const w = SE.measure(msg, 8) + 16;
      SE.panel(SE.W / 2 - w / 2 - 50, SE.H - 24, w, 16, { alpha: 0.9 });
      SE.text(msg, SE.W / 2 - 50, SE.H - 20, { align: 'center', size: 8 });
      if (SE.button(SE.W / 2 + w / 2 - 44, SE.H - 25, 92, 18, s.fast ? 'Stroll slowly' : 'Walk faster', { active: s.fast, alpha: a })) s.fast = !s.fast;
      return;
    }
    if (!s.selected) {
      if (SE.sceneTime < 8) SE.text('Click a pin to walk there · drag to look around', SE.W / 2, SE.H - 16, { align: 'center', size: 8, color: '#fff7ea', alpha: 0.7 + 0.3 * Math.sin(SE.time * 2) });
      if (!s.follow && SE.button(SE.W - 96, SE.H - 24, 90, 18, 'Find us')) s.follow = true;
      return;
    }
    const sel = s.selected, p = SE.PLACES[sel];
    const meters = Math.round(SE.placeDistance(SE.PLACES[s.here].node, p.node) * 3);
    SE.panel(SE.W / 2 - 124, SE.H - 62, 248, 56, { fill: 'rgba(48,40,70,0.96)' });
    SE.text(p.label, SE.W / 2 - 114, SE.H - 56, { size: 10, color: '#ffe6b8' });
    SE.text(p.desc, SE.W / 2 - 114, SE.H - 42, { size: 7, color: '#dfe8ff' });
    const stormy = SE.weather.stormy() && sel !== 'cabin';
    const buried = s.here === 'cabin' && sel !== 'cabin' && SE.save.snowDepth >= 0.6;
    const label = stormy ? 'Too stormy…' : buried ? 'Path is buried' : `Walk there · ${meters} m`;
    if (SE.button(SE.W / 2 - 114, SE.H - 28, 116, 17, label, { fill: stormy || buried ? 'rgba(70,64,90,0.7)' : undefined })) {
      if (stormy) SE.toast('A snowstorm is blowing. Wait it out by the fire.', '#cfe6ff');
      else if (buried) { SE.toast('Too much snow on the path — shovel it first.', '#cfe6ff'); SE.go('yard', { mode: 'shovel' }); }
      else startWalk(sel);
    }
    if (SE.button(SE.W / 2 + 54, SE.H - 28, 60, 17, 'Not yet')) s.selected = null;
  }
})();
