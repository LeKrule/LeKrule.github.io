/* Adrián Medina — Portfolio
   Sin dependencias. Todo lo que se mueve en la web está aquí. */

(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Idioma (EN / ES) ---------- */
  const setLang = (lang) => {
    root.dataset.lang = lang;
    root.lang = lang;
    localStorage.setItem("lang", lang);
  };
  document.querySelectorAll(".lang [data-set]").forEach((btn) =>
    btn.addEventListener("click", () => setLang(btn.dataset.set))
  );

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
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
    const loop = () => {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      tag.style.left = `${cx}px`; tag.style.top = `${cy}px`;
      requestAnimationFrame(loop);
    };
    loop();
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
     el scroll para dar profundidad. */
  const canvas = document.getElementById("field");
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext("2d");
  const GAP = 26;
  const RADIUS = 170;
  let W, H, dpr, cols, rows;
  let colors = {};
  const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, energy: 0 };
  const trail = []; // puntos recientes del cursor

  const readColors = () => {
    const cs = getComputedStyle(root);
    const dark = root.dataset.theme === "dark";
    colors = {
      dot: dark ? "rgba(236,235,230,0.13)" : "rgba(20,20,19,0.13)",
      hot: cs.getPropertyValue("--accent").trim() || "#4b5d8a",
      hotDark: "#9fb0e0",
      dark,
    };
  };

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / GAP) + 2;
    rows = Math.ceil(H / GAP) + 2;
  };

  addEventListener("resize", resize);
  addEventListener("themechange", readColors);
  addEventListener("mousemove", (e) => {
    const dx = e.clientX - mouse.x, dy = e.clientY - mouse.y;
    mouse.energy = Math.min(1, mouse.energy + Math.hypot(dx, dy) / 400);
    mouse.x = e.clientX; mouse.y = e.clientY;
    trail.push({ x: e.clientX, y: e.clientY + scrollY, life: 1 });
    if (trail.length > 24) trail.shift();
  });
  document.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; });

  resize();
  readColors();

  const draw = (t) => {
    ctx.clearRect(0, 0, W, H);
    mouse.sx += (mouse.x - mouse.sx) * 0.12;
    mouse.sy += (mouse.y - mouse.sy) * 0.12;
    mouse.energy *= 0.94;
    trail.forEach((p) => (p.life *= 0.93));

    const off = (scrollY * 0.25) % GAP;  // parallax vertical
    const r2 = RADIUS * RADIUS;
    const time = t * 0.0006;

    for (let j = -1; j < rows; j++) {
      const baseY = j * GAP - off;
      for (let i = -1; i < cols; i++) {
        const baseX = i * GAP;
        let x = baseX, y = baseY;

        // ondulación casi imperceptible para que el fondo nunca esté muerto
        const wave = Math.sin(baseX * 0.012 + time) * Math.cos(baseY * 0.01 + time * 0.8);

        // influencia del cursor
        const dx = baseX - mouse.sx, dy = baseY - mouse.sy;
        const d2 = dx * dx + dy * dy;
        let f = d2 < r2 * 2.5 ? Math.exp(-d2 / r2) : 0;

        // influencia de la estela
        for (let k = 0; k < trail.length; k++) {
          const p = trail[k];
          if (p.life < 0.05) continue;
          const tx = baseX - p.x, ty = baseY - (p.y - scrollY);
          const td = tx * tx + ty * ty;
          if (td < 6400) f = Math.max(f, Math.exp(-td / 2200) * p.life * 0.8);
        }

        if (f > 0.01) {
          const d = Math.sqrt(d2) || 1;
          const push = f * (10 + mouse.energy * 18);
          x += (dx / d) * push;
          y += (dy / d) * push;
        }

        const size = 1.4 + wave * 0.35 + f * 2.6;
        if (f > 0.04) {
          ctx.globalAlpha = Math.min(0.55, 0.15 + f * 0.6);
          ctx.fillStyle = colors.dark ? colors.hotDark : colors.hot;
        } else {
          ctx.globalAlpha = 1;
          ctx.fillStyle = colors.dot;
        }
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
})();
