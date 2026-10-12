/* Motion engine — a single rAF loop drives springs for cursor, scroll, cards,
   magnetic buttons and particles. Only transform / opacity / translate are animated. */
(() => {
  "use strict";
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ready = () => root.classList.add("ready");

  if (reduced) {
    ready();
    $(".curtain")?.remove();
    $$("[data-count]").forEach((el) => (el.textContent = el.dataset.count + (el.dataset.suffix || "")));
    // Keep the nav indicator + smooth anchors working without motion.
  }

  /* ---------- Springs ---------- */
  const mk = (x = 0) => ({ x, v: 0 });
  const step = (s, target, dt, k = 170, c = 22) => { s.v += (k * (target - s.x) - c * s.v) * dt; s.x += s.v * dt; };

  /* ---------- Split-text headings (word mask reveal, letters on accent) ---------- */
  if (!reduced) {
    let n;
    const walk = (node, letters) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.append(" "); return; }
            const w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
            const wi = document.createElement("span"); wi.className = "wi"; wi.style.setProperty("--wi", n++);
            if (letters) [...tok].forEach((ch, i) => { const l = document.createElement("span"); l.className = "l"; l.style.setProperty("--li", i); l.textContent = ch; wi.append(l); });
            else wi.textContent = tok;
            w.append(wi); frag.append(w);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && c.tagName !== "BR") walk(c, letters || c.hasAttribute("data-letters"));
      });
    };
    const splitIO = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); splitIO.unobserve(e.target); }
    }), { threshold: 0.4 });
    $$(".split").forEach((h) => {
      h.setAttribute("aria-label", h.innerText.replace(/\s+/g, " ").trim());
      n = 0; walk(h, false); splitIO.observe(h);
    });
  }

  /* ---------- Cinematic intro hand-off ---------- */
  if (!reduced) setTimeout(ready, 1050);

  /* ---------- Count-up stats ---------- */
  if (!reduced) {
    const cio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now(), dur = 1600;
      const tick = (t) => {
        const p = clamp((t - t0) / dur, 0, 1), eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = Math.round(end * eased) + (p === 1 ? suf : "");
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = "0"; requestAnimationFrame(tick);
    }), { threshold: 0.6 });
    $$("[data-count]").forEach((el) => cio.observe(el));
  }

  /* ---------- Fluid anchor navigation ---------- */
  let travelId = 0;
  const ease = (t) => (t < 0.5 ? 8 * t ** 4 : 1 - ((-2 * t + 2) ** 4) / 2);
  const travel = (to) => {
    const from = scrollY, dist = to - from, id = ++travelId;
    if (reduced || Math.abs(dist) < 4) { scrollTo(0, to); return; }
    const dur = clamp(Math.abs(dist) * 0.45, 650, 1500), t0 = performance.now();
    root.dataset.travel = "1"; $(".nav-wrap").classList.remove("hide");
    const stop = () => { travelId++; delete root.dataset.travel; };
    addEventListener("wheel", stop, { once: true, passive: true });
    addEventListener("touchstart", stop, { once: true, passive: true });
    const tick = (t) => {
      if (id !== travelId) return;
      const p = clamp((t - t0) / dur, 0, 1);
      scrollTo(0, from + dist * ease(p));
      if (p < 1) requestAnimationFrame(tick); else setTimeout(() => { if (id === travelId) delete root.dataset.travel; }, 250);
    };
    requestAnimationFrame(tick);
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href").length < 2 || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const target = document.getElementById(a.getAttribute("href").slice(1));
    if (!target) return;
    e.preventDefault();
    travel(target.id === "top" ? 0 : target.getBoundingClientRect().top + scrollY);
    history.replaceState(null, "", "#" + target.id);
    target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true });
  });

  /* ---------- Nav: sliding active indicator ---------- */
  const ul = $(".nav-links"), ind = $(".nav-indicator"), links = $$("a", ul);
  const place = (a) => {
    if (!a) { ind.classList.remove("on"); return; }
    ind.style.setProperty("--x", a.offsetLeft + "px");
    ind.style.setProperty("--w", a.offsetWidth + "px");
    ind.classList.add("on");
  };
  const active = () => links.find((a) => a.getAttribute("aria-current") === "true");
  new MutationObserver(() => place(active())).observe(ul, { attributes: true, attributeFilter: ["aria-current"], subtree: true });
  links.forEach((a) => a.addEventListener("pointerenter", () => place(a)));
  ul.addEventListener("pointerleave", () => place(active()));
  links.forEach((a) => a.addEventListener("focus", () => place(a)));
  links.forEach((a) => a.addEventListener("blur", () => place(active())));
  addEventListener("resize", () => place(active()));
  document.fonts?.ready.then(() => place(active()));

  /* ---------- Button ripple (click feedback) ---------- */
  document.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(".btn");
    if (!b || reduced) return;
    const r = b.getBoundingClientRect(), s = document.createElement("span");
    s.className = "ripple"; s.style.left = e.clientX - r.left + "px"; s.style.top = e.clientY - r.top + "px";
    b.append(s); s.addEventListener("animationend", () => s.remove());
  });

  if (reduced) return;

  /* ---------- Engine state ---------- */
  const ptr = { x: 0, y: 0, cx: -9999, cy: -9999 };
  const px = mk(), py = mk();
  addEventListener("pointermove", (e) => {
    ptr.x = e.clientX - innerWidth / 2; ptr.y = e.clientY - innerHeight / 2; ptr.cx = e.clientX; ptr.cy = e.clientY;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { ptr.cx = ptr.cy = -9999; });

  // Ambient layers: pointer depth + scroll speed
  const layers = $$("[data-depth]").map((el) => ({ el, d: +el.dataset.depth, s: +(el.dataset.scroll || 0) }));
  const heroInner = $(".hero-inner");

  // Scroll-linked depth for headings & stats (cached document offsets)
  const depthEls = [...$$(".section h2.split").map((el) => ({ el, k: 0.07 })), ...$$(".stats").map((el) => ({ el, k: -0.05 })), ...$$(".contact").map((el) => ({ el, k: 0.035 }))];

  // Cards: spring tilt + float + scroll parallax
  const cards = $$("[data-tilt]").map((el, i) => ({
    el, icon: $(".card-icon", el), rx: mk(), ry: mk(), lift: mk(), ix: mk(), iy: mk(),
    tx: 0, ty: 0, hover: false, vis: false, ph: i * 1.7, top: 0, h: 0, col: i % 2 ? -1 : 1,
  }));
  const cardIO = new IntersectionObserver((es) => es.forEach((e) => { cards.find((c) => c.el === e.target).vis = e.isIntersecting; }), { rootMargin: "100px" });
  cards.forEach((c) => {
    cardIO.observe(c.el);
    if (!fine) return;
    c.el.addEventListener("pointermove", (e) => {
      const r = c.el.getBoundingClientRect();
      c.tx = (e.clientX - r.left) / r.width - 0.5; c.ty = (e.clientY - r.top) / r.height - 0.5; c.hover = true;
    });
    c.el.addEventListener("pointerleave", () => { c.tx = c.ty = 0; c.hover = false; });
  });

  // Magnetic elements
  const mags = fine ? $$(".btn, .social-btn, .icon-btn, .to-top").map((el) => ({ el, x: mk(), y: mk(), on: false })) : [];

  // Cache document offsets (no per-frame layout reads for scroll-linked items)
  const measure = () => {
    const sy = scrollY;
    depthEls.forEach((d) => { const r = d.el.getBoundingClientRect(); d.top = r.top + sy; d.h = r.height; });
    cards.forEach((c) => { const r = c.el.getBoundingClientRect(); c.top = r.top + sy - (c.last || 0); c.h = r.height; });
  };
  addEventListener("load", measure); addEventListener("resize", measure); document.fonts?.ready.then(measure);
  setTimeout(measure, 1500);

  /* ---------- Particles ---------- */
  const cvs = $(".particles"), ctx = cvs.getContext("2d");
  let W = 0, H = 0, dpr = 1, parts = [], rgb = "217,119,87";
  const readColor = () => {
    const c = getComputedStyle(root).getPropertyValue("--accent").trim();
    const m = c.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    if (m) rgb = `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
  };
  const initParticles = () => {
    dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight;
    cvs.width = W * dpr; cvs.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = clamp(Math.round((W * H) / 26000), 18, 48);
    parts = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() * 0.7,
      r: 0.8 + Math.random() * 2, ph: Math.random() * 6.28, ox: 0, oy: 0, vx: 0, vy: 0,
    }));
  };
  readColor(); initParticles();
  addEventListener("resize", initParticles);
  new MutationObserver(() => setTimeout(readColor, 120)).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => setTimeout(readColor, 120));

  /* ---------- The loop ---------- */
  const wrap = $(".nav-wrap"), bar = $(".progress");
  let last = performance.now(), lastSy = -1;
  const frame = (now) => {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    const t = now / 1000, sy = scrollY, vh = innerHeight;

    step(px, ptr.x, dt, 60, 14); step(py, ptr.y, dt, 60, 14);

    // reads (batched before writes)
    const magRects = mags.map((m) => m.el.getBoundingClientRect());

    // ambient layers
    layers.forEach((l) => {
      l.el.style.setProperty("--px", (px.x * l.d).toFixed(1) + "px");
      l.el.style.setProperty("--py", (py.x * l.d + sy * l.s).toFixed(1) + "px");
    });

    // hero parallax: content drifts slower and fades as you leave
    if (heroInner && sy < vh * 1.2) {
      heroInner.style.transform = `translate3d(0,${(sy * 0.2).toFixed(1)}px,0)`;
      heroInner.style.opacity = clamp(1 - (sy / vh) * 1.2, 0, 1).toFixed(3);
    }

    // scroll-linked depth
    depthEls.forEach((d) => {
      const off = d.top + d.h / 2 - sy - vh / 2;
      if (Math.abs(off) > vh * 1.2) return;
      d.el.style.transform = `translate3d(0,${(off * d.k).toFixed(1)}px,0)`;
    });

    // cards
    cards.forEach((c) => {
      if (!c.vis) return;
      step(c.rx, -c.ty * 10, dt, 150, 18); step(c.ry, c.tx * 10, dt, 150, 18);
      step(c.lift, c.hover ? -9 : 0, dt, 200, 20);
      step(c.ix, c.tx * 12, dt, 120, 16); step(c.iy, c.ty * 12, dt, 120, 16);
      const float = Math.sin(t * 0.8 + c.ph) * (c.hover ? 0.8 : 3.5);
      const sp = clamp((c.top + c.h / 2 - sy - vh / 2) / vh, -1, 1) * 14 * c.col;
      c.last = float + c.lift.x + sp;
      c.el.style.transform = `translate3d(0,${c.last.toFixed(2)}px,0) rotateX(${c.rx.x.toFixed(2)}deg) rotateY(${c.ry.x.toFixed(2)}deg)`;
      if (c.icon) c.icon.style.translate = `${c.ix.x.toFixed(1)}px ${c.iy.x.toFixed(1)}px`;
    });

    // magnetic buttons
    mags.forEach((m, i) => {
      const r = magRects[i];
      const cx = r.left + r.width / 2 - m.x.x, cy = r.top + r.height / 2 - m.y.x;
      const dx = ptr.cx - cx, dy = ptr.cy - cy, reach = Math.max(r.width, r.height) / 2 + 44;
      const near = Math.hypot(dx, dy) < reach;
      const k = Math.min(r.width, 160) / 160 + 0.15;
      step(m.x, near ? dx * 0.28 * k : 0, dt, 230, 17); step(m.y, near ? dy * 0.28 * k : 0, dt, 230, 17);
      const active = near || Math.abs(m.x.x) + Math.abs(m.y.x) > 0.05;
      if (active) { m.el.style.translate = `${m.x.x.toFixed(2)}px ${m.y.x.toFixed(2)}px`; m.on = true; }
      else if (m.on) { m.el.style.translate = ""; m.on = false; m.x.x = m.y.x = m.x.v = m.y.v = 0; }
    });

    // progress + nav condensing
    if (sy !== lastSy) {
      const max = document.documentElement.scrollHeight - vh;
      bar.style.transform = `scaleX(${max > 0 ? clamp(sy / max, 0, 1).toFixed(4) : 0})`;
      wrap.classList.toggle("scrolled", sy > 30);
      lastSy = sy;
    }

    // particles
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.y -= (4 + p.z * 10) * dt; p.x += Math.sin(t * 0.3 + p.ph) * 6 * dt;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      // gentle cursor repel with spring-back
      const dx = p.x + p.ox - ptr.cx, dy = p.y + p.oy - ptr.cy, d2 = dx * dx + dy * dy;
      if (d2 < 14400) { const f = (1 - Math.sqrt(d2) / 120) * 60 * dt; const d = Math.sqrt(d2) || 1; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
      p.vx += -p.ox * 3 * dt; p.vy += -p.oy * 3 * dt; p.vx *= 0.94; p.vy *= 0.94; p.ox += p.vx; p.oy += p.vy;
      const y = (((p.y + p.oy - sy * p.z * 0.25) % H) + H) % H;
      ctx.globalAlpha = (0.18 + 0.32 * (0.5 + 0.5 * Math.sin(t * 0.9 + p.ph))) * p.z;
      ctx.fillStyle = `rgb(${rgb})`;
      ctx.beginPath(); ctx.arc(p.x + p.ox, y, p.r * p.z, 0, 6.2832); ctx.fill();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
