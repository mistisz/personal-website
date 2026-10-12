(() => {
  "use strict";
  const S = window.SITE;
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  root.classList.add("js");

  /* ---------- Components (data -> DOM) ---------- */
  const icon = (n) => `<svg class="ico" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ext = (h) => (h.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : "");

  const components = {
    "social-icons": () => S.social.map((s) =>
      `<a class="social-btn" href="${esc(s.href)}"${ext(s.href)} aria-label="${esc(s.label)}">${icon(s.icon)}</a>`).join(""),
    "social-list": () => [
      `<li><a href="mailto:${esc(S.email)}">${icon("mail")}${esc(S.email)}</a></li>`,
      ...S.social.map((s) => `<li><a href="${esc(s.href)}"${ext(s.href)}>${icon(s.icon)}${esc(s.label)}<span class="sr-only"> (${esc(s.handle)})</span></a></li>`),
    ].join(""),
    projects: () => S.projects.map((p, i) => `
      <article class="card reveal" style="--i:${i % 2}" data-tilt>
        <div class="card-icon">${icon(p.icon)}</div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        <ul class="tags">${p.tags.map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>
        <div class="card-links">${p.links.map((l) => `<a href="${esc(l.href)}"${ext(l.href)}>${esc(l.label)} ${icon("arrow")}</a>`).join("")}</div>
      </article>`).join(""),
    skills: () => S.skills.map((g, gi) => `
      <div class="skill glass reveal" style="--i:${gi}" data-glow>
        <div class="skill-head">${icon(g.icon)}<h3>${esc(g.group)}</h3></div>
        ${g.items.map(([n, v], i) => `
          <div class="meter" style="--i:${i}">
            <div class="meter-top"><span>${esc(n)}</span><span>${v}%</span></div>
            <div class="bar" role="img" aria-label="${esc(n)} proficiency ${v} percent"><i style="--v:${v / 100}"></i></div>
          </div>`).join("")}
      </div>`).join(""),
    interests: () => S.interests.map((x, i) =>
      `<li class="interest glass reveal" style="--i:${i}" data-glow>${icon(x.icon)}${esc(x.label)}</li>`).join(""),
  };
  $$("[data-render]").forEach((el) => { el.innerHTML = components[el.dataset.render]?.() ?? ""; });

  /* ---------- Content bindings ---------- */
  $$('[data-bind="name"]').forEach((e) => (e.textContent = S.name));
  $$('[data-bind="name-short"]').forEach((e) => (e.textContent = S.name.split(" ")[0]));
  $$('[data-bind="email"]').forEach((e) => (e.textContent = S.email));
  $('[data-bind="mailto"]').href = `mailto:${S.email}`;
  $("#year").textContent = new Date().getFullYear();
  document.title = `${S.name} — Developer & Designer`;

  /* ---------- Theme ---------- */
  const themeBtn = $("#theme-toggle");
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  themeBtn.addEventListener("click", (e) => {
    const next = isDark() ? "light" : "dark";
    const apply = () => { root.dataset.theme = next; try { localStorage.setItem("theme", next); } catch (_) {} };
    themeBtn.setAttribute("aria-pressed", String(next === "dark"));
    if (reduced) return apply();
    const b = themeBtn.getBoundingClientRect();
    const x = e.clientX || b.left + b.width / 2, y = e.clientY || b.top + b.height / 2;
    if (document.startViewTransition) {
      // Circular reveal expanding from the toggle.
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.startViewTransition(apply).ready.then(() => root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 1000, easing: "cubic-bezier(.22,1,.36,1)", pseudoElement: "::view-transition-new(root)" }
      )).catch(() => {});
    } else {
      root.classList.add("theme-fade"); apply();
      setTimeout(() => root.classList.remove("theme-fade"), 700);
    }
  });
  themeBtn.setAttribute("aria-pressed", String(isDark()));

  /* ---------- Mobile menu ---------- */
  const nav = $(".nav"), menuBtn = $("#menu-toggle");
  const setMenu = (open) => {
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  $$(".nav-links a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  document.addEventListener("click", (e) => { if (!nav.contains(e.target)) setMenu(false); });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));
  // skill bars animate when their card enters (class "in" is on the card)

  /* ---------- Scroll spy + hide-on-scroll nav ---------- */
  const links = $$(".nav-links a");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + en.target.id)));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => spy.observe(s));

  const wrap = $(".nav-wrap");
  let lastY = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY;
    if (!nav.classList.contains("open") && !root.dataset.travel) wrap.classList.toggle("hide", y > lastY && y > 400);
    lastY = y;
  }, { passive: true });

  /* ---------- Copy email ---------- */
  const copyBtn = $("#copy-email"), live = $("#live");
  copyBtn.addEventListener("click", async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(S.email); ok = true; } catch (e) {
      const t = Object.assign(document.createElement("textarea"), { value: S.email });
      document.body.append(t); t.select(); try { ok = document.execCommand("copy"); } catch (_) {} t.remove();
    }
    const label = $("span", copyBtn);
    label.textContent = ok ? "Copied!" : "Copy failed";
    live.textContent = ok ? "Email copied to clipboard" : "Could not copy email";
    copyBtn.classList.toggle("done", ok);
    setTimeout(() => { label.textContent = "Copy email"; copyBtn.classList.remove("done"); }, 2000);
  });

  /* ---------- Cursor-responsive effects (fine pointers only) ---------- */
  if (finePointer && !reduced) {
    // Glass highlight follows the cursor
    const trackGlow = (el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
        el.style.setProperty("--glow", "1");
      });
      el.addEventListener("pointerleave", () => el.style.setProperty("--glow", "0"));
    };
    $$(".glass, .glass-strong, .btn-primary, .card").forEach(trackGlow);
  }
})();
