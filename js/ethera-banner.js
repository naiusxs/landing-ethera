// Banner del lema: copia del script del banner oficial (sections/ethera-aura.liquid).
(function () {
  var el = document.querySelector(".e-aura");
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var t = { x: 0, y: 0, gx: 50, gy: 50, s: 0 },
    c = { x: 0, y: 0, gx: 50, gy: 50, s: 0 },
    raf = null;
  function set(e) {
    var r = el.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width,
      py = (e.clientY - r.top) / r.height;
    t.x = (px - 0.5) * 2;
    t.y = (py - 0.5) * 2;
    t.gx = px * 100;
    t.gy = py * 100;
    t.s = 1;
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    var k = 0.08;
    c.x += (t.x - c.x) * k;
    c.y += (t.y - c.y) * k;
    c.gx += (t.gx - c.gx) * 0.14;
    c.gy += (t.gy - c.gy) * 0.14;
    c.s += (t.s - c.s) * 0.08;
    el.style.setProperty("--mx", c.x.toFixed(3));
    el.style.setProperty("--my", c.y.toFixed(3));
    el.style.setProperty("--gx", c.gx.toFixed(2) + "%");
    el.style.setProperty("--gy", c.gy.toFixed(2) + "%");
    el.style.setProperty("--gs", c.s.toFixed(3));
    var moving = Math.abs(t.x - c.x) + Math.abs(t.y - c.y) + Math.abs(t.s - c.s) > 0.002;
    raf = moving ? requestAnimationFrame(tick) : null;
  }
  el.addEventListener("pointermove", set, { passive: true });
  el.addEventListener("pointerdown", set, { passive: true });
  el.addEventListener("pointerleave", function () {
    t.x = 0;
    t.y = 0;
    t.s = 0;
    if (!raf) raf = requestAnimationFrame(tick);
  });
})();
