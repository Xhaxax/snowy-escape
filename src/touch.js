// Touch play (phones, tablets): a floating thumb-stick on the left half of the valley that stands in
// for WASD / the arrow keys (always the calm walking pace, no hurrying), and a hold button for backing away from a
// bear. Everything else in the game is already tap-friendly. It switches itself on with the first
// touch, so desktop play never sees it. Add ?touch to the URL to force it on.
'use strict';

(function () {
  const T = SE.touch = { on: /[?&]touch\b/.test(location.search), stick: null, hold: null };
  const R = 22; // stick radius in game pixels
  const STICK_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ShiftLeft'];
  const BACK = { x: SE.W / 2 - 46, y: SE.H - 40, w: 92, h: 30 }; // bottom middle, clear of the pair

  // which touch controls the current moment of play wants
  function wants() {
    if (!T.on || SE.momentPlaying() || SE.modal) return {};
    const n = SE.sceneName;
    return {
      stick: n === 'map',
      back: n === 'encounter' && SE.scene.retreating && SE.scene.retreating(),
    };
  }

  function setStickKeys(dx, dy) {
    for (const k of STICK_KEYS) SE.vkeys.delete(k);
    const d = Math.hypot(dx, dy);
    if (d < R * 0.25) return;
    const ax = dx / d, ay = dy / d;
    if (ax > 0.38) SE.vkeys.add('ArrowRight');
    if (ax < -0.38) SE.vkeys.add('ArrowLeft');
    if (ay > 0.38) SE.vkeys.add('ArrowDown');
    if (ay < -0.38) SE.vkeys.add('ArrowUp');
  }
  function release(id) {
    if (T.stick && T.stick.id === id) { T.stick = null; setStickKeys(0, 0); return true; }
    if (T.hold && T.hold.id === id) { T.hold = null; SE.vkeys.delete('ArrowLeft'); return true; }
    return false;
  }

  // the engine asks us first about every pointer; returning true keeps it away from SE.mouse
  SE.pointerFilter = function (type, e, x, y) {
    if (e.pointerType === 'touch' && !T.on) T.on = true;
    if (!T.on) return false;
    if (type === 'down') {
      const w = wants();
      // the stick lives in the lower-left of the valley, clear of the top bar and the place card
      if (w.stick && !T.stick && x < SE.W * 0.45 && y > 78) {
        T.stick = { id: e.pointerId, ox: x, oy: y, x, y };
        return true;
      }
      if (w.back && !T.hold && SE.inRect(x, y, BACK)) {
        T.hold = { id: e.pointerId };
        SE.vkeys.add('ArrowLeft');
        return true;
      }
      return false;
    }
    if (type === 'move' && T.stick && T.stick.id === e.pointerId) {
      let dx = x - T.stick.ox, dy = y - T.stick.oy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      T.stick.x = T.stick.ox + dx; T.stick.y = T.stick.oy + dy;
      setStickKeys(dx, dy);
      return true;
    }
    if (type === 'up') return release(e.pointerId);
    return T.hold && T.hold.id === e.pointerId;
  };

  SE.frameHooks.push(function drawTouch(ctx) {
    if (!T.on) return;
    const w = wants();
    if (!w.stick && T.stick) release(T.stick.id);
    if (!w.back && T.hold) release(T.hold.id);
    if (w.stick) {
      // resting position hint when idle; follows the thumb when held
      const st = T.stick || { ox: 52, oy: SE.H - 50, x: 52, y: SE.H - 50 };
      const a = T.stick ? 0.8 : 0.6;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(30,24,46,0.55)';
      ctx.beginPath(); ctx.arc(Math.round(st.ox), Math.round(st.oy), R + 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff7ea'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(Math.round(st.ox) + 0.5, Math.round(st.oy) + 0.5, R + 3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = SE.vkeys.has('ShiftLeft') ? '#e8aa60' : '#fff7ea';
      ctx.beginPath(); ctx.arc(Math.round(st.x), Math.round(st.y), 9, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (w.back) {
      const held = !!T.hold;
      SE.panel(BACK.x, BACK.y, BACK.w, BACK.h, { fill: held ? 'rgba(232,170,96,0.95)' : 'rgba(48,40,70,0.9)' });
      SE.text('◀ Back away', BACK.x + BACK.w / 2, BACK.y + 7, { align: 'center', size: 10, color: held ? '#3a2433' : '#fff7ea', shadow: !held });
      SE.text('hold · slowly', BACK.x + BACK.w / 2, BACK.y + 19, { align: 'center', size: 7, color: held ? '#3a2433' : '#dfe8ff', shadow: !held });
    }
  });

  // portrait phones: ask for landscape (shown by CSS only when it applies)
  const turn = document.getElementById('turn');
  if (turn) turn.addEventListener('click', () => turn.classList.add('dismissed'));
})();
