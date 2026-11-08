/* Adrián Medina — Portfolio
   Sin dependencias. Todo lo que se mueve en la web está aquí. */

(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Idioma (EN / ES) ---------- */
  const langButtons = document.querySelectorAll(".lang [data-set]");
  const markLang = () => langButtons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.set === root.dataset.lang));
  const setLang = (lang) => {
    root.dataset.lang = lang;
    root.lang = lang;
    localStorage.setItem("lang", lang);
    markLang();
  };
  langButtons.forEach((btn) => btn.addEventListener("click", () => setLang(btn.dataset.set)));
  markLang();

  /* ---------- Hora en Madrid ---------- */
  const clock = document.querySelector(".clock");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit",
    });
    const tick = () => (clock.textContent = `Madrid ${fmt.format(new Date())}`);
    tick();
    setInterval(tick, 15000);
  }

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Entrada del titular ---------- */
  requestAnimationFrame(() => document.body.classList.add("loaded"));

  /* ---------- Aparición al hacer scroll ---------- */
  const revealObs = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); revealObs.unobserve(e.target); }
    }),
    { rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

  /* ---------- Cambio de tema según la sección visible ----------
     Las secciones con data-theme="dark" invierten la página cuando
     ocupan el centro de la pantalla. */
  const themed = [...document.querySelectorAll("[data-theme]")];
  if (themed.length) {
    const update = () => {
      const mid = innerHeight / 2;
      const active = themed.find((s) => {
        const r = s.getBoundingClientRect();
        return r.top < mid && r.bottom > mid;
      });
      const theme = active ? active.dataset.theme : "light";
      if (root.dataset.theme !== theme) {
        root.dataset.theme = theme;
        window.dispatchEvent(new Event("themechange"));
      }
    };
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* ---------- Menú inferior en móvil: se oculta al bajar, vuelve al subir ---------- */
  {
    let lastY = scrollY;
    addEventListener("scroll", () => {
      const y = scrollY;
      const nearEdge = y < 80 || innerHeight + y > document.documentElement.scrollHeight - 40;
      if (nearEdge || y < lastY - 6) root.classList.remove("nav-away");
      else if (y > lastY + 6) root.classList.add("nav-away");
      if (Math.abs(y - lastY) > 6) lastY = y;
    }, { passive: true });
  }

  /* ---------- Etiqueta que sigue al cursor sobre los proyectos ---------- */
  const tag = document.querySelector(".cursor-tag");
  if (tag && matchMedia("(hover: hover)").matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0, moving = false;
    // solo se anima mientras la etiqueta está alcanzando al cursor
    const loop = () => {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      tag.style.left = `${cx}px`; tag.style.top = `${cy}px`;
      if (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) requestAnimationFrame(loop);
      else moving = false;
    };
    addEventListener("mousemove", (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!moving) { moving = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.querySelectorAll(".project-media").forEach((m) => {
      m.addEventListener("mouseenter", () => tag.classList.add("on"));
      m.addEventListener("mouseleave", () => tag.classList.remove("on"));
    });
  }

  /* ---------- Palabra que rota en el cierre ---------- */
  document.querySelectorAll(".rotator").forEach((rot) => {
    const words = [...rot.children];
    let i = 0;
    words[0].classList.add("on");
    if (words.length < 2 || reduceMotion) return;
    setInterval(() => {
      if (document.hidden || !rot.offsetParent) return;
      const prev = words[i];
      i = (i + 1) % words.length;
      words.forEach((w) => w.classList.remove("out"));
      prev.classList.replace("on", "out");
      words[i].classList.add("on");
    }, 2400);
  });

  /* ---------- Copiar el correo al hacer clic ---------- */
  document.querySelectorAll("[data-copy]").forEach((el) => {
    el.addEventListener("click", async (e) => {
      e.preventDefault();
      const text = el.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = Object.assign(document.createElement("textarea"), { value: text });
        document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove();
      }
      el.classList.add("copied");
      clearTimeout(el._t);
      el._t = setTimeout(() => el.classList.remove("copied"), 2000);
    });
  });

  /* ---------- Fondo interactivo ----------
     Rejilla de puntos que reacciona al ratón: los puntos cercanos crecen,
     se apartan del cursor y toman el color de acento. El movimiento rápido
     deja una estela que se desvanece. La rejilla se desplaza un poco con
     el scroll para dar profundidad.

     Rendimiento: la rejilla estática se pinta de una vez con un patrón y
     solo se calculan los puntos cerca del cursor o de la estela. Cuando no
     pasa nada (ratón quieto, pestaña oculta) el bucle se detiene. */
  const canvas = document.getElementById("field");
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext("2d");
  const GAP = 26;
  const RADIUS = 170;
  const REACH = RADIUS * 1.6;          // más allá, la influencia del cursor es nula
  const TRAIL_REACH = 80;
  const BASE = 1.4;                    // tamaño del punto en reposo
  let W, H, dpr, pattern, colors = {};
  const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, energy: 0 };
  const trail = [];                    // puntos recientes del cursor (y en coordenadas de página)
  let running = false, lastScroll = -1;

  const readColors = () => {
    const cs = getComputedStyle(root);
    const dark = root.dataset.theme === "dark";
    colors = {
      dot: dark ? "rgba(236,235,230,0.13)" : "rgba(20,20,19,0.13)",
      hot: dark ? "#c2705f" : "#8d362e",
    };
    // patrón con un único punto: pinta toda la rejilla en una sola operación
    const tile = document.createElement("canvas");
    tile.width = tile.height = Math.round(GAP * dpr);
    const t = tile.getContext("2d");
    t.scale(dpr, dpr);
    t.fillStyle = colors.dot;
    t.fillRect(-BASE / 2, -BASE / 2, BASE, BASE);
    t.fillRect(GAP - BASE / 2, -BASE / 2, BASE, BASE);
    t.fillRect(-BASE / 2, GAP - BASE / 2, BASE, BASE);
    t.fillRect(GAP - BASE / 2, GAP - BASE / 2, BASE, BASE);
    pattern = ctx.createPattern(tile, "repeat");
  };

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    readColors();
    wake();
  };

  const wake = () => {
    if (running || document.hidden) return;
    running = true;
    requestAnimationFrame(frame);
  };

  addEventListener("resize", resize);
  addEventListener("themechange", () => { readColors(); wake(); });
  addEventListener("scroll", wake, { passive: true });
  document.addEventListener("visibilitychange", wake);
  addEventListener("mousemove", (e) => {
    const dx = e.clientX - mouse.x, dy = e.clientY - mouse.y;
    mouse.energy = Math.min(1, mouse.energy + Math.hypot(dx, dy) / 400);
    if (mouse.sx < -999) { mouse.sx = e.clientX; mouse.sy = e.clientY; }
    mouse.x = e.clientX; mouse.y = e.clientY;
    trail.push({ x: e.clientX, y: e.clientY + scrollY, life: 1 });
    if (trail.length > 24) trail.shift();
    wake();
  }, { passive: true });
  document.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; wake(); });

  // influencia (0–1) del cursor y la estela sobre un punto de la rejilla
  const influence = (x, y) => {
    const dx = x - mouse.sx, dy = y - mouse.sy;
    let f = Math.exp(-(dx * dx + dy * dy) / (RADIUS * RADIUS));
    for (const p of trail) {
      if (p.life < 0.05) continue;
      const tx = x - p.x, ty = y - (p.y - scrollY);
      const td = tx * tx + ty * ty;
      if (td < TRAIL_REACH * TRAIL_REACH) f = Math.max(f, Math.exp(-td / 2200) * p.life * 0.8);
    }
    return f;
  };

  const frame = () => {
    if (document.hidden) { running = false; return; }

    mouse.sx += (mouse.x - mouse.sx) * 0.12;
    mouse.sy += (mouse.y - mouse.sy) * 0.12;
    mouse.energy *= 0.94;
    for (const p of trail) p.life *= 0.93;
    while (trail.length && trail[0].life < 0.05) trail.shift();

    const off = (scrollY * 0.25) % GAP;   // parallax vertical

    // 1. rejilla estática de una vez
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(0, -off);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H + GAP);
    ctx.restore();

    // 2. celdas afectadas: alrededor del cursor y de la estela
    const cells = new Set();
    const addBox = (cx, cy, r) => {
      const i0 = Math.max(0, Math.floor((cx - r) / GAP)), i1 = Math.min(Math.ceil(W / GAP), Math.ceil((cx + r) / GAP));
      const j0 = Math.max(-1, Math.floor((cy - r + off) / GAP)), j1 = Math.min(Math.ceil(H / GAP) + 1, Math.ceil((cy + r + off) / GAP));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) cells.add(j * 10000 + i);
    };
    if (mouse.sx > -999) addBox(mouse.sx, mouse.sy, REACH);
    for (const p of trail) addBox(p.x, p.y - scrollY, TRAIL_REACH);

    // 3. puntos activos, agrupados por opacidad para dibujarlos de golpe
    const buckets = new Map();
    const push = mouse.energy * 18 + 10;
    for (const key of cells) {
      const j = Math.floor(key / 10000), i = key - j * 10000;
      const bx = i * GAP, by = j * GAP - off;
      const f = influence(bx, by);
      if (f < 0.01) continue;
      const dx = bx - mouse.sx, dy = by - mouse.sy, d = Math.hypot(dx, dy) || 1;
      const x = bx + (dx / d) * f * push, y = by + (dy / d) * f * push;
      const size = BASE + f * 2.6;
      ctx.clearRect(bx - 2, by - 2, 4, 4);          // borra el punto estático de debajo
      const hot = f > 0.04;
      const k = hot ? Math.round(Math.min(0.55, 0.15 + f * 0.6) * 20) : 0;
      if (!buckets.has(k)) buckets.set(k, new Path2D());
      buckets.get(k).rect(x - size / 2, y - size / 2, size, size);
    }
    for (const [k, path] of buckets) {
      ctx.globalAlpha = k ? k / 20 : 1;
      ctx.fillStyle = k ? colors.hot : colors.dot;
      ctx.fill(path);
    }
    ctx.globalAlpha = 1;

    // 4. ¿sigue pasando algo? si no, se duerme hasta el próximo evento
    const settling = Math.abs(mouse.x - mouse.sx) > 0.3 || Math.abs(mouse.y - mouse.sy) > 0.3;
    const busy = settling || mouse.energy > 0.01 || trail.length > 0 || scrollY !== lastScroll;
    lastScroll = scrollY;
    if (busy) requestAnimationFrame(frame);
    else running = false;
  };

  resize();
})();
