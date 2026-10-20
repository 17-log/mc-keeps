/*
 * KeepsMotion — original, dependency-free sticker tray.
 * mount(container, { items: [{ id, src, label }], onSelect(id), reducedMotion? })
 * mounts at most 18 local SVG/photo images. Returns cleanup(), with cleanup.shake().
 * The tray owns only its descendants and its km-tray class. Call cleanup before
 * remounting. Pointer drag throws stickers; a tap or Enter/Space selects one.
 * Motion sleeps after settling. Reduced motion uses a static, clickable layout.
 */
(function () {
  'use strict';

  const instances = new WeakMap();
  const clamp = (n, min, max) => Math.min(Math.max(n, min), Math.max(min, max));
  const random = (min, max) => min + Math.random() * (max - min);

  function mount(container, options) {
    if (!(container instanceof HTMLElement)) throw new TypeError('KeepsMotion needs a container element.');
    if (instances.has(container)) instances.get(container)();

    const config = options || {};
    const items = (Array.isArray(config.items) ? config.items : []).slice(0, 18);
    const onSelect = typeof config.onSelect === 'function' ? config.onSelect : function () {};
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = Boolean(config.reducedMotion) || preference.matches;
    let disposed = false;
    let frameId = 0;
    let previousTime = 0;
    let lastActivity = performance.now();
    let quietFrames = 0;
    let width = 1;
    let height = 1;
    let active = null;
    let pointerId = null;
    let pointerStart = null;
    let pointerPrevious = null;
    let pointerOffset = null;
    let dragged = false;
    let tapTimer = 0;
    let topZ = 2;
    const bodies = [];
    const byNode = new WeakMap();
    const rootHadClass = container.classList.contains('km-tray');
    container.classList.add('km-tray');
    container.classList.toggle('km-reduced', reduced);

    const decor = document.createElement('div');
    decor.className = 'km-tray-decoration';
    decor.setAttribute('aria-hidden', 'true');
    decor.innerHTML = '<span class="km-tray-star km-tray-star-one">✳</span><span class="km-tray-star km-tray-star-two">✧</span><span class="km-tray-word">little moments, kept.</span>';
    container.replaceChildren(decor);

    items.forEach(function (item, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'km-sticker';
      button.setAttribute('aria-label', '查看' + (item.label || '这段回忆'));
      button.dataset.stickerId = String(item.id);
      const art = document.createElement('span');
      art.className = 'km-sticker-art';
      const img = document.createElement('img');
      img.src = item.src || '';
      img.alt = '';
      img.draggable = false;
      art.appendChild(img);
      const tag = document.createElement('span');
      tag.className = 'km-sticker-label';
      tag.textContent = item.label || '小小的好时光';
      button.append(art, tag);
      button.style.zIndex = String(index + 2);
      container.appendChild(button);
      const body = {
        id: item.id, el: button, index: index,
        x: 0, y: 0, vx: 0, vy: 0, angle: random(-0.24, 0.24), spin: 0,
        radius: 35, size: 80, dragVX: 0, dragVY: 0
      };
      bodies.push(body);
      byNode.set(button, body);
    });

    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'km-empty';
      empty.textContent = '第一张回忆贴纸，等你来放。';
      container.appendChild(empty);
    }

    function measure() {
      const bounds = container.getBoundingClientRect();
      width = Math.max(bounds.width, 1);
      height = Math.max(bounds.height, 1);
    }

    function paint() {
      bodies.forEach(function (body) {
        body.el.style.transform = 'translate3d(' + (body.x - body.size / 2).toFixed(2) + 'px,' + (body.y - body.size / 2).toFixed(2) + 'px,0) rotate(' + body.angle.toFixed(3) + 'rad)';
      });
    }

    function layout(initial) {
      const oldWidth = width;
      const oldHeight = height;
      measure();
      const baseSize = clamp(width / 4.7, 64, 104);
      const columns = Math.max(2, Math.min(items.length || 2, Math.floor((width - 20) / (baseSize * 0.87))));
      const rows = Math.max(1, Math.ceil(bodies.length / columns));
      bodies.forEach(function (body, index) {
        body.size = baseSize * (0.89 + (index % 4) * 0.055);
        body.radius = body.size * 0.38;
        body.el.style.width = body.size + 'px';
        body.el.style.height = body.size + 'px';
        if (reduced || initial) {
          const col = index % columns;
          const row = Math.floor(index / columns);
          const cellWidth = (width - 26) / columns;
          const rowGap = reduced ? Math.min((height - 50) / rows, baseSize * 0.9) : Math.min(baseSize * 0.72, 65);
          const yStart = reduced ? (height - rowGap * (rows - 1)) / 2 : body.radius + 14;
          body.x = 13 + cellWidth * (col + 0.5) + (row % 2 ? cellWidth * 0.12 : -cellWidth * 0.06);
          body.y = yStart + row * rowGap;
          body.x = clamp(body.x, body.radius + 6, width - body.radius - 6);
          body.y = clamp(body.y, body.radius + 6, height - body.radius - 6);
          body.vx = reduced ? 0 : random(-34, 34);
          body.vy = reduced ? 0 : random(5, 50);
          body.spin = reduced ? 0 : random(-0.75, 0.75);
          body.angle = ((index * 7) % 13 - 6) * 0.035;
        } else {
          body.x = clamp(body.x / oldWidth * width, body.radius + 6, width - body.radius - 6);
          body.y = clamp(body.y / oldHeight * height, body.radius + 6, height - body.radius - 6);
        }
      });
      paint();
      if (!reduced) wake();
    }

    function bounds(body) {
      const r = body.radius + 7;
      if (body.x < r) { body.x = r; body.vx = Math.abs(body.vx) * 0.38; body.spin *= 0.8; }
      if (body.x > width - r) { body.x = width - r; body.vx = -Math.abs(body.vx) * 0.38; body.spin *= 0.8; }
      if (body.y < r) { body.y = r; body.vy = Math.abs(body.vy) * 0.28; }
      if (body.y > height - r) {
        body.y = height - r;
        body.vy = Math.abs(body.vy) < 54 ? 0 : -Math.abs(body.vy) * 0.22;
        body.vx *= 0.82;
        body.spin *= 0.77;
      }
    }

    function physics(dt) {
      const held = dragged ? active : null;
      bodies.forEach(function (body) {
        if (body === held) return;
        body.vy += 960 * dt;
        body.vx *= Math.pow(0.984, dt * 60);
        body.vy *= Math.pow(0.997, dt * 60);
        body.spin *= Math.pow(0.977, dt * 60);
        body.x += body.vx * dt;
        body.y += body.vy * dt;
        body.angle += body.spin * dt;
        bounds(body);
      });
      for (let pass = 0; pass < 4; pass++) {
        for (let a = 0; a < bodies.length; a++) {
          for (let b = a + 1; b < bodies.length; b++) {
            const first = bodies[a];
            const second = bodies[b];
            let dx = second.x - first.x;
            let dy = second.y - first.y;
            let distance = Math.hypot(dx, dy);
            const minimum = first.radius + second.radius;
            if (distance >= minimum) continue;
            if (distance < 0.01) { dx = 0.01; dy = 0.02; distance = Math.hypot(dx, dy); }
            const nx = dx / distance;
            const ny = dy / distance;
            const overlap = minimum - distance;
            const firstWeight = first === held ? 0 : 1;
            const secondWeight = second === held ? 0 : 1;
            const weights = firstWeight + secondWeight;
            if (!weights) continue;
            first.x -= nx * overlap * firstWeight / weights;
            first.y -= ny * overlap * firstWeight / weights;
            second.x += nx * overlap * secondWeight / weights;
            second.y += ny * overlap * secondWeight / weights;
            const firstVX = first === held ? clamp(first.dragVX, -800, 800) : first.vx;
            const firstVY = first === held ? clamp(first.dragVY, -800, 800) : first.vy;
            const secondVX = second === held ? clamp(second.dragVX, -800, 800) : second.vx;
            const secondVY = second === held ? clamp(second.dragVY, -800, 800) : second.vy;
            const relative = (secondVX - firstVX) * nx + (secondVY - firstVY) * ny;
            if (relative < 0) {
              const impulse = -1.16 * relative / weights;
              first.vx -= impulse * nx * firstWeight;
              first.vy -= impulse * ny * firstWeight;
              second.vx += impulse * nx * secondWeight;
              second.vy += impulse * ny * secondWeight;
              if (pass === 0) {
                first.spin += clamp(-ny * impulse * 0.0008, -0.09, 0.09) * firstWeight;
                second.spin += clamp(ny * impulse * 0.0008, -0.09, 0.09) * secondWeight;
              }
            }
            if (pass === 3) {
              if (first !== held) { first.vx *= 0.975; first.spin *= 0.96; bounds(first); }
              if (second !== held) { second.vx *= 0.975; second.spin *= 0.96; bounds(second); }
            }
          }
        }
      }
    }

    function tick(now) {
      frameId = 0;
      if (disposed || reduced) return;
      const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.033) : 1 / 60;
      previousTime = now;
      physics(dt / 2);
      physics(dt / 2);
      paint();
      const quiet = bodies.every(function (body) { return Math.abs(body.vx) < 6 && Math.abs(body.vy) < 22 && Math.abs(body.spin) < 0.08; });
      quietFrames = quiet && !active ? quietFrames + 1 : 0;
      const settled = !active && (quietFrames > 40 || now - lastActivity > 6800);
      if (settled) {
        previousTime = 0;
        bodies.forEach(function (body) { body.vx = 0; body.vy = 0; body.spin = 0; });
        container.classList.remove('km-moving');
      } else frameId = requestAnimationFrame(tick);
    }

    function wake() {
      if (disposed || reduced || !bodies.length) return;
      quietFrames = 0;
      lastActivity = performance.now();
      container.classList.add('km-moving');
      if (!frameId) { previousTime = 0; frameId = requestAnimationFrame(tick); }
    }

    function point(event) {
      const rect = container.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, time: performance.now() };
    }

    function select(body) {
      if (!body || disposed) return;
      bodies.forEach(function (other) { other.el.classList.remove('km-selected'); });
      body.el.classList.add('km-selected');
      clearTimeout(tapTimer);
      tapTimer = setTimeout(function () { if (!disposed) body.el.classList.remove('km-selected'); }, 420);
      onSelect(body.id);
    }

    function down(event) {
      if (active || event.button !== 0 || event.isPrimary === false) return;
      const node = event.target.closest('.km-sticker');
      const body = node && byNode.get(node);
      if (!body) return;
      active = body;
      pointerId = event.pointerId;
      pointerStart = point(event);
      pointerPrevious = pointerStart;
      pointerOffset = { x: pointerStart.x - body.x, y: pointerStart.y - body.y };
      dragged = false;
      body.dragVX = 0;
      body.dragVY = 0;
      body.el.style.zIndex = String(++topZ + bodies.length);
      container.setPointerCapture(event.pointerId);
      if (!reduced) wake();
    }

    function move(event) {
      if (!active || event.pointerId !== pointerId || reduced) return;
      const next = point(event);
      if (!dragged && Math.hypot(next.x - pointerStart.x, next.y - pointerStart.y) < 6) return;
      dragged = true;
      active.el.classList.add('km-dragging');
      const dt = Math.max((next.time - pointerPrevious.time) / 1000, 0.008);
      active.dragVX = active.dragVX * 0.48 + clamp((next.x - pointerPrevious.x) / dt, -1600, 1600) * 0.52;
      active.dragVY = active.dragVY * 0.48 + clamp((next.y - pointerPrevious.y) / dt, -1600, 1600) * 0.52;
      active.x = clamp(next.x - pointerOffset.x, active.radius + 7, width - active.radius - 7);
      active.y = clamp(next.y - pointerOffset.y, active.radius + 7, height - active.radius - 7);
      active.vx = 0;
      active.vy = 0;
      active.spin = 0;
      active.angle += clamp(active.dragVX * 0.000013, -0.025, 0.025);
      pointerPrevious = next;
      wake();
      paint();
      event.preventDefault();
    }

    function release(event) {
      if (!active || event.pointerId !== pointerId) return;
      const body = active;
      const didDrag = dragged;
      const cancelled = event.type === 'pointercancel' || event.type === 'lostpointercapture';
      if (didDrag) {
        const fresh = performance.now() - pointerPrevious.time < 110;
        body.vx = fresh ? clamp(body.dragVX * 0.72, -1100, 1100) : 0;
        body.vy = fresh ? clamp(body.dragVY * 0.72, -1100, 1100) : 0;
        body.spin = clamp(body.vx * 0.003, -2, 2);
      }
      body.el.classList.remove('km-dragging');
      active = null;
      dragged = false;
      pointerId = null;
      if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId);
      if (!didDrag && !cancelled) select(body);
      if (!reduced) wake();
    }

    function click(event) {
      const node = event.target.closest('.km-sticker');
      if (!node) return;
      // Pointer taps are handled above, so drag release never becomes a click.
      if (event.detail === 0) select(byNode.get(node));
    }

    function preventNativeDrag(event) { event.preventDefault(); }

    function shake() {
      if (disposed || !bodies.length) return;
      if (reduced) { layout(true); return; }
      bodies.forEach(function (body, index) {
        if (body === active) return;
        body.vx = random(-210, 210) + (index % 2 ? 60 : -60);
        body.vy = random(-690, -420);
        body.spin = random(-2.4, 2.4);
      });
      wake();
    }

    function preferenceChanged() {
      reduced = Boolean(config.reducedMotion) || preference.matches;
      container.classList.toggle('km-reduced', reduced);
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      previousTime = 0;
      container.classList.remove('km-moving');
      layout(true);
    }

    let measuredWidth = 0;
    let measuredHeight = 0;
    const resizeObserver = new ResizeObserver(function () {
      const rect = container.getBoundingClientRect();
      if (Math.abs(rect.width - measuredWidth) < 0.5 && Math.abs(rect.height - measuredHeight) < 0.5) return;
      measuredWidth = rect.width;
      measuredHeight = rect.height;
      layout(false);
    });

    container.addEventListener('pointerdown', down);
    container.addEventListener('pointermove', move, { passive: false });
    container.addEventListener('pointerup', release);
    container.addEventListener('pointercancel', release);
    container.addEventListener('lostpointercapture', release);
    container.addEventListener('click', click);
    container.addEventListener('dragstart', preventNativeDrag);
    preference.addEventListener('change', preferenceChanged);
    layout(true);
    measuredWidth = width;
    measuredHeight = height;
    resizeObserver.observe(container);

    function cleanup() {
      if (disposed) return;
      disposed = true;
      if (frameId) cancelAnimationFrame(frameId);
      clearTimeout(tapTimer);
      resizeObserver.disconnect();
      container.removeEventListener('pointerdown', down);
      container.removeEventListener('pointermove', move);
      container.removeEventListener('pointerup', release);
      container.removeEventListener('pointercancel', release);
      container.removeEventListener('lostpointercapture', release);
      container.removeEventListener('click', click);
      container.removeEventListener('dragstart', preventNativeDrag);
      preference.removeEventListener('change', preferenceChanged);
      if (pointerId !== null && container.hasPointerCapture(pointerId)) container.releasePointerCapture(pointerId);
      container.classList.remove('km-reduced', 'km-moving');
      if (!rootHadClass) container.classList.remove('km-tray');
      container.replaceChildren();
      instances.delete(container);
    }
    cleanup.shake = shake;
    instances.set(container, cleanup);
    return cleanup;
  }

  window.KeepsMotion = {
    mount: mount,
    shake: function (container) {
      const cleanup = instances.get(container);
      if (cleanup) cleanup.shake();
    }
  };
})();
