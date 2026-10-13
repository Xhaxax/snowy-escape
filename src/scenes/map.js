// The valley: a big snowy world seen from above. Walk with Waffles (WASD or the arrow keys) along the
// paths through a dense pine forest; near a place a little card pops up and E / Enter takes you in.
// The camera follows you; drag to look around.
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
    chapel: { node: 'chapel', label: 'Little Chapel', desc: 'A quiet log chapel with a bell tower. Candles, pews, peace.', scene: 'chapel' },
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
  let world = null, nearTrees = [], walkMask = null;
  const CABIN = L.objects.find((o) => o.img === 'map/cabin_td') || { x: 244, y: 566 };
  const CHAPEL = L.objects.find((o) => o.img === 'map/chapel_td') || { x: 142, y: 380 };
  const CABIN_LIGHTS = [{ x: CABIN.x + 39, y: CABIN.y + 69, r: 7 }, { x: CABIN.x + 78, y: CABIN.y + 69, r: 7 }, { x: CABIN.x + 51, y: CABIN.y + 80, r: 6 }];
  const CHAPEL_LIGHTS = [{ x: CHAPEL.x + 22, y: CHAPEL.y + 66, r: 6 }, { x: CHAPEL.x + 74, y: CHAPEL.y + 67, r: 6 }, { x: CHAPEL.x + 62, y: CHAPEL.y + 74, r: 6 }, { x: CHAPEL.x + 32, y: CHAPEL.y + 50, r: 5 }, { x: CHAPEL.x + 36, y: CHAPEL.y + 24, r: 4, pool: false }];

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
    for (const o of L.objects) { const img = SE.img(o.img); if (img && !isSorted(o)) c.drawImage(img, o.x, o.y); }

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
    // buildings stand among the trees, so they are drawn in the same top-to-bottom order
    const buildings = L.objects.filter(isSorted).map((o) => ({ o, img: SE.img(o.img) })).filter((b) => b.img)
      .sort((a, b) => (a.o.y + a.img.height) - (b.o.y + b.img.height));
    let bi = 0;
    for (const t of trees) {
      while (bi < buildings.length && t.y > buildings[bi].o.y + buildings[bi].img.height - 14) { c.drawImage(buildings[bi].img, buildings[bi].o.x, buildings[bi].o.y); bi++; }
      if (t.near) { nearTrees.push(t); continue; }
      drawTree(c, t);
    }
    for (; bi < buildings.length; bi++) c.drawImage(buildings[bi].img, buildings[bi].o.x, buildings[bi].o.y);
    world = cv;
    walkMask = buildMask(pathPts);
  }
  function isSorted(o) { return o.sorted || o.img === 'map/cabin_td'; }
  function drawTree(c, t) {
    const img = SE.img(t.img);
    if (!img) return;
    const x = Math.round(t.x - img.width / 2), y = Math.round(t.y - img.height + 6);
    if (t.flip) { c.save(); c.translate(x + img.width, y); c.scale(-1, 1); c.drawImage(img, 0, 0); c.restore(); }
    else c.drawImage(img, x, y);
  }

  // ------------------------------------------------------------ where you can walk
  // A coarse mask (4px cells): the trodden paths, the clearings and the frozen lake are walkable;
  // buildings and props are solid, so you walk around them instead of over their roofs.
  const CELL = 4, MW = Math.ceil(WW / CELL), MH = Math.ceil(WH / CELL);
  function buildMask(pathPts) {
    const m = new Uint8Array(MW * MH);
    const mark = (x, y, r) => {
      for (let j = Math.floor((y - r) / CELL); j <= (y + r) / CELL; j++) {
        for (let i = Math.floor((x - r) / CELL); i <= (x + r) / CELL; i++) {
          if (i < 0 || j < 0 || i >= MW || j >= MH) continue;
          if ((i * CELL + 2 - x) ** 2 + (j * CELL + 2 - y) ** 2 <= r * r) m[j * MW + i] = 1;
        }
      }
    };
    for (const [x, y] of pathPts) mark(x, y, 15);
    for (const cl of L.clearings) mark(cl.x, cl.y, cl.r - 12);
    const lk = L.lake;
    for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) {
      if (((i * CELL + 2 - lk.cx) / (lk.rx - 4)) ** 2 + ((j * CELL + 2 - lk.cy) / (lk.ry - 4)) ** 2 <= 1) m[j * MW + i] = 1;
    }
    for (const o of L.objects) {
      const b = o.block || o.solid;
      if (!b) continue;
      for (let j = Math.floor(b[1] / CELL); j < (b[1] + b[3]) / CELL; j++) for (let i = Math.floor(b[0] / CELL); i < (b[0] + b[2]) / CELL; i++) if (i >= 0 && j >= 0 && i < MW && j < MH) m[j * MW + i] = 0;
    }
    return m;
  }
  function canWalk(x, y) {
    const i = (x / CELL) | 0, j = (y / CELL) | 0;
    return !walkMask || (i >= 0 && j >= 0 && i < MW && j < MH && walkMask[j * MW + i] === 1);
  }

  // ------------------------------------------------------------ scene
  let s = null;
  function dirOf(dx, dy) { return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n'; }
  const ENTER_R = 30; // how close to a place before its card pops up

  SE.addScene('map', {
    enter(p) {
      if (!world) buildWorld();
      const here = SE.PLACES[SE.save.location] ? SE.save.location : 'cabin';
      // back from a wildlife encounter: carry on from exactly where you were
      const back = p && p.resume && SE.mapReturn;
      const at = back ? [SE.mapReturn.x, SE.mapReturn.y] : N[SE.PLACES[here].node];
      SE.mapReturn = null;
      s = {
        here, walking: null, t: 0, moved: 0, buriedT: 0,
        hero: { x: at[0], y: at[1], dir: 's', moving: false, anim: 0 },
        dog: { x: at[0] - 12, y: at[1] + 4, dir: 's', moving: false, anim: 0 },
        trail: [], prints: [], stepT: 0, cam: { x: at[0] - SE.W / 2, y: at[1] - SE.H / 2 }, drag: null, follow: true,
        pop: { id: null, a: 0 }, wild: 0, nextWild: SE.rand(2400, 4200), alert: null,
      };
      for (let k = 0; k < 30; k++) s.trail.push({ x: s.dog.x, y: s.dog.y });
      clampCam();
      SE.audio.setMusic('outdoors');
      // a scripted walk (e.g. heading home through a storm) plays by itself
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
      ctx.save(); ctx.globalAlpha = 0.45 * (1 - SE.weather.night()); // daytime: a faint warm hint only
      SE.drawWindowGlow(ctx, CABIN_LIGHTS);
      SE.drawWindowGlow(ctx, CHAPEL_LIGHTS);
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
      if (s.alert && SE.drawBang) SE.drawBang(ctx, s.dog.x, s.dog.y - 20, s.alert.t);
      ctx.restore();

      SE.weather.tint(ctx, 0.75);
      // after dark the cabin and the chapel shine out over the valley
      ctx.save(); ctx.translate(-cx, -cy);
      SE.nightLights(ctx, 'lit/cabin_td', CABIN.x, CABIN.y, CABIN_LIGHTS);
      SE.nightLights(ctx, 'lit/chapel_td', CHAPEL.x, CHAPEL.y, CHAPEL_LIGHTS);
      ctx.restore();
      SE.weather.sunshine(ctx, 0);
      SE.weather.draw(ctx, { density: 0.5 });
      drawOffscreen(ctx, cx, cy);
      if (SE.weather.stormy()) SE.text('Snowstorm — the trails are closed until it calms down', SE.W / 2, SE.H - 40, { align: 'center', size: 8, color: '#cfe6ff', alpha: 0.7 + 0.3 * Math.sin(SE.time * 2) });
      drawPopup(ctx, dt);
      drawFooter(ctx);
      SE.hud.draw(ctx, { watch: false, title: 'The Valley' });
    },
  });

  // ------------------------------------------------------------ camera: follow the walkers, or drag to look around
  function clampCam() { s.cam.x = SE.clamp(s.cam.x, 0, WW - SE.W); s.cam.y = SE.clamp(s.cam.y, 0, WH - SE.H); }
  function camera(dt) {
    const m = SE.mouse;
    if (!SE.modal && m.pressed && m.y > 30 && m.y < SE.H - 30) s.drag = { x: m.x, y: m.y, cx: s.cam.x, cy: s.cam.y, moved: 0 };
    if (s.drag && m.down) {
      s.drag.moved += SE.mouse.moved;
      if (s.drag.moved > 4) { s.cam.x = s.drag.cx - (m.x - s.drag.x); s.cam.y = s.drag.cy - (m.y - s.drag.y); s.follow = false; SE.cursor = 'grabbing'; }
    }
    if (!m.down && s.drag) s.drag = null;
    if (s.walking || s.hero.moving) s.follow = true;
    if (s.follow) {
      s.cam.x = SE.approach(s.cam.x, s.hero.x - SE.W / 2, 2.5, dt);
      s.cam.y = SE.approach(s.cam.y, s.hero.y - SE.H / 2 - 10, 2.5, dt);
    }
    clampCam();
  }

  // ------------------------------------------------------------ walking: your keys, or a scripted route
  function startWalk(to) {
    s.walking = { to, path: route(nearestNode(), SE.PLACES[to].node), i: 1, len: 0 };
    s.follow = true;
  }
  function nearestNode() {
    let best = SE.PLACES[s.here].node, bd = 1e9;
    for (const [id, [x, y]] of Object.entries(N)) { const d = Math.hypot(x - s.hero.x, y - s.hero.y); if (d < bd) { bd = d; best = id; } }
    return best;
  }
  function steer(dt) {
    const h = s.hero;
    if (SE.modal) return 0;
    const kx = (SE.held('ArrowRight', 'KeyD') ? 1 : 0) - (SE.held('ArrowLeft', 'KeyA') ? 1 : 0);
    const ky = (SE.held('ArrowDown', 'KeyS') ? 1 : 0) - (SE.held('ArrowUp', 'KeyW') ? 1 : 0);
    if (!kx && !ky) return 0;
    const hurry = SE.held('ShiftLeft', 'ShiftRight');
    const speed = (hurry ? 60 : 34) * (SE.save.snowDepth > 0.6 ? 0.85 : 1);
    const n = Math.hypot(kx, ky), vx = (kx / n) * speed * dt, vy = (ky / n) * speed * dt;
    h.dir = dirOf(kx, ky);
    const ox = h.x, oy = h.y;
    // slide along the edges of the path rather than sticking to them
    if (canWalk(h.x + vx, h.y)) h.x += vx;
    if (canWalk(h.x, h.y + vy)) h.y += vy;
    // the path out of the yard is buried: shovel it before you wander off
    const home = N[SE.PLACES.cabin.node];
    if (SE.save.snowDepth >= 0.6 && Math.hypot(h.x - home[0], h.y - home[1]) > 96 && Math.hypot(ox - home[0], oy - home[1]) <= 96) {
      h.x = ox; h.y = oy;
      if (s.buriedT <= 0) { SE.toast('The path is buried in snow — shovel it first (press E at the cabin).', '#cfe6ff'); s.buriedT = 4; }
    }
    if (hurry) h.anim += dt * 0.8;
    return Math.hypot(h.x - ox, h.y - oy);
  }
  function walk(dt) {
    const h = s.hero;
    s.buriedT -= dt;
    let moved = 0;
    if (s.walking) {
      const w = s.walking;
      let budget = 28 * (SE.save.snowDepth > 0.6 ? 0.85 : 1) * dt;
      while (budget > 0 && w.path[w.i]) {
        const t = w.path[w.i];
        const dx = t[0] - h.x, dy = t[1] - h.y, d = Math.hypot(dx, dy);
        if (d <= budget) { h.x = t[0]; h.y = t[1]; budget -= d; moved += d; w.i++; continue; }
        h.x += (dx / d) * budget; h.y += (dy / d) * budget; moved += budget; budget = 0;
        h.dir = dirOf(dx, dy);
      }
      if (!w.path[w.i]) { s.walking = null; enterPlace(w.to); }
    } else if (s.alert) alertTick(dt);
    else { moved = steer(dt); wildlife(moved); }
    h.moving = moved > 0.01;
    s.moved += moved;
    SE.save.distance += moved * 3;
    if (h.moving) {
      h.anim += dt;
      s.stepT -= dt * (SE.held('ShiftLeft', 'ShiftRight') ? 1.8 : 1);
      if (s.stepT <= 0) {
        s.stepT = 0.34;
        SE.audio.sfx('step', { deep: SE.save.snowDepth > 0.6 || SE.weather.stormy() });
        const side = (Math.floor(h.anim / 0.34) % 2) ? 1 : -1;
        s.prints.push({ x: h.x + (h.dir === 'n' || h.dir === 's' ? side : 0), y: h.y + (h.dir === 'e' || h.dir === 'w' ? side : 0), t: 0 });
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
  // Out on the trails an animal can turn up out of nowhere. Waffles notices first.
  function wildlife(moved) {
    if (!moved) return;
    s.wild += moved;
    if (s.wild < s.nextWild || SE.weather.stormy() || !SE.pickEncounter || !SE.encounterReady()) return;
    const h = s.hero, lk = L.lake;
    const nearPlace = Object.values(SE.PLACES).some((p) => Math.hypot(N[p.node][0] - h.x, N[p.node][1] - h.y) < 70);
    const onIce = ((h.x - lk.cx) / lk.rx) ** 2 + ((h.y - lk.cy) / lk.ry) ** 2 < 1.2;
    if (nearPlace || onIce) return;
    s.wild = 0; s.nextWild = SE.rand(3000, 5200);
    s.alert = { t: 0, kind: SE.pickEncounter() };
    SE.audio.sfx('woof');
  }
  function alertTick(dt) {
    s.alert.t += dt;
    if (s.alert.t > 1.2 && !s.alert.gone) {
      s.alert.gone = true;
      SE.mapReturn = { x: s.hero.x, y: s.hero.y };
      SE.moment('alert', { go: ['encounter', { animal: s.alert.kind, from: 'map' }] });
    }
  }
  function enterPlace(id) {
    if (SE.weather.stormy() && id !== 'cabin' && id !== 'chapel') { SE.toast('A snowstorm is blowing. Better head home to the fire.', '#cfe6ff'); return; }
    SE.save.location = id;
    SE.persist();
    if (id === 'cabin') SE.audio.sfx('door');
    const buried = id === 'cabin' && SE.save.snowDepth >= 0.6;
    const to = [buried ? 'yard' : SE.PLACES[id].scene, buried ? { mode: 'shovel' } : { arrived: s.moved > 40, inDoor: true }];
    // arriving somewhere special plays a little still-frame moment first (sound carries it)
    if (SE.MOMENTS && SE.MOMENTS[id]) SE.moment(id, { go: to });
    else SE.go(...to);
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

  // ------------------------------------------------------------ place card, off-screen hints & footer
  function nearPlace() {
    let best = null, bd = ENTER_R;
    for (const [id, p] of Object.entries(SE.PLACES)) {
      const [x, y] = N[p.node];
      const d = Math.hypot(s.hero.x - x, s.hero.y - y);
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }
  // near a place a small card slides in at the top middle; E / Enter / Space (or its button) goes in
  function drawPopup(ctx, dt) {
    const id = s.walking ? null : nearPlace();
    if (id) s.pop.id = id;
    s.pop.a = SE.approach(s.pop.a, id ? 1 : 0, 10, dt);
    if (!s.pop.id || s.pop.a < 0.03) return;
    const p = SE.PLACES[s.pop.id];
    const go = s.pop.id === 'cabin' ? 'go home' : 'go in';
    const hint = SE.touch.on ? `Tap here: ${go}` : `E · Enter: ${go}`;
    const w = Math.max(SE.measure(p.label, 10), SE.measure(p.desc, 7), SE.measure(hint, 7) + 40) + 20;
    const x = SE.W / 2 - w / 2, y = 30 - (1 - s.pop.a) * 8;
    SE.panel(x, y, w, 42, { alpha: s.pop.a, fill: 'rgba(48,40,70,0.94)' });
    SE.text(p.label, SE.W / 2, y + 4, { align: 'center', size: 10, color: '#ffe6b8', alpha: s.pop.a });
    SE.text(p.desc, SE.W / 2, y + 17, { align: 'center', size: 7, color: '#dfe8ff', alpha: s.pop.a });
    SE.text(hint, SE.W / 2, y + 29, { align: 'center', size: 7, color: '#fff7ea', alpha: s.pop.a * 0.85 });
    if (!id || SE.modal) return;
    const r = { x, y, w, h: 42 };
    if (SE.inRect(SE.mouse.x, SE.mouse.y, r)) SE.cursor = 'pointer';
    if (SE.key('KeyE') || SE.key('Enter') || SE.key('Space') || (SE.mouse.released && SE.inRect(SE.mouse.x, SE.mouse.y, r))) { SE.mouse.released = false; enterPlace(id); }
  }
  // faint arrows toward places that are off screen, so you can find your way
  function drawOffscreen(ctx, cx, cy) {
    for (const [id, p] of Object.entries(SE.PLACES)) {
      const [x, y] = N[p.node];
      const sx = x - cx, sy = y - cy;
      if (sx > 10 && sx < SE.W - 10 && sy > 30 && sy < SE.H - 10) continue;
      const ex = SE.clamp(sx, 40, SE.W - 40), ey = SE.clamp(sy, 80, SE.H - 30);
      const label = `${p.label} ${sx < 10 ? '←' : sx > SE.W - 10 ? '→' : sy < 30 ? '↑' : '↓'}`;
      const w = SE.measure(label, 7) + 8;
      SE.panel(ex - w / 2, ey - 6, w, 12, { alpha: 0.5 });
      SE.text(label, ex, ey - 4, { size: 7, align: 'center', color: '#ffe6b8', alpha: 0.85 });
    }
  }
  function drawFooter() {
    if (s.walking) {
      const to = SE.PLACES[s.walking.to];
      const msg = `Walking to ${to.label} with Waffles…`;
      const w = SE.measure(msg, 8) + 16;
      SE.panel(SE.W / 2 - w / 2, SE.H - 24, w, 16, { alpha: 0.9 });
      SE.text(msg, SE.W / 2, SE.H - 20, { align: 'center', size: 8 });
      return;
    }
    if (SE.sceneTime < 10 && s.moved < 30) {
      const tip = SE.touch.on ? 'Drag on the left to walk · tap the card to go in' : 'WASD or arrow keys to walk · hold Shift to hurry · E to go in';
      const cx = SE.W / 2 + (SE.touch.on ? 30 : 0), w = SE.measure(tip, 8) + 14; // touch: clear of the stick
      SE.panel(cx - w / 2, SE.H - 22, w, 15, { alpha: 0.85 });
      SE.text(tip, cx, SE.H - 18, { align: 'center', size: 8, color: '#fff7ea', alpha: 0.7 + 0.3 * Math.sin(SE.time * 2) });
    }
    if (!s.follow && SE.button(SE.W - 96, SE.H - 24, 90, 18, 'Find us')) s.follow = true;
  }
})();
