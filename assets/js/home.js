/* Portada: hora de Madrid y vistas previas de la presentación */
(() => {
  const root = document.documentElement;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Hora de Madrid (solo en la vista previa de «Madrid») ---------- */
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" });
  const bigTime = document.querySelector("[data-madrid]");
  const renderTime = () => { bigTime.textContent = fmt.format(new Date()); };
  renderTime();
  setInterval(renderTime, 15000);

  /* ---------- Vistas previas: cada término subrayado abre la suya ---------- */
  const peek = document.querySelector(".peek");
  let open = null, hideTimer = 0;
  // sigue al cursor sin salirse de la pantalla
  const place = (x, y) => {
    if (!open || !fine) return;
    const w = open.offsetWidth, h = open.offsetHeight;
    const left = Math.min(x + 18, innerWidth - w - 12);
    const top = y + 22 + h > innerHeight - 12 ? y - h - 14 : y + 22;
    open.style.transform = `translate(${left}px, ${top}px)`;
  };
  const hide = () => {
    open?.classList.remove("on"); open = null;
    document.querySelectorAll(".term.on").forEach((t) => t.classList.remove("on"));
  };
  const show = (term, x, y) => {
    hide();
    open = peek.querySelector(`[data-for="${term.dataset.peek}"]`);
    term.classList.add("on");
    open.classList.add("on");
    place(x, y);
  };

  document.querySelectorAll(".term").forEach((term) => {
    if (fine) {
      term.addEventListener("pointerenter", (e) => show(term, e.clientX, e.clientY));
      term.addEventListener("pointermove", (e) => place(e.clientX, e.clientY));
      term.addEventListener("pointerleave", hide);
    } else {
      // en táctil: se toca para verla y se cierra sola
      term.addEventListener("click", () => {
        clearTimeout(hideTimer);
        if (term.classList.contains("on")) return hide();
        show(term);
        hideTimer = setTimeout(hide, 3500);
      });
    }
    term.addEventListener("focus", () => { const r = term.getBoundingClientRect(); show(term, r.left, r.bottom - 10); });
    term.addEventListener("blur", hide);
  });
  addEventListener("keydown", (e) => e.key === "Escape" && hide());

  /* ---------- Entrada escalonada: primero la columna izquierda, luego la derecha ---------- */
  if (root.classList.contains("intro")) {
    sessionStorage.setItem("intro-seen", "1");
    let i = 0;
    const tag = (el, n) => { el.setAttribute("data-in", ""); el.style.setProperty("--i", n); };
    tag(document.querySelector(".side-top"), i++);
    const es = [...document.querySelectorAll('.bio[data-l="es"] > *')], en = [...document.querySelectorAll('.bio[data-l="en"] > *')];
    es.forEach((el, k) => { tag(el, i + k); if (en[k]) tag(en[k], i + k); });
    i += es.length;
    document.querySelectorAll(".toc, .status").forEach((el) => tag(el, i++));
    i += 2;   // pausa breve antes de la columna derecha
    document.querySelectorAll("#work > .label, #work > .case, .main > section:not(#work), .main > .foot")
      .forEach((el, k) => tag(el, i + k * 2.4));   // 170 ms entre bloques grandes
    addEventListener("animationend", (e) => e.target.classList.add("in-done"));
    // arranca con la tipografía y la primera imagen listas (como mucho 700 ms)
    const cover = document.querySelector(".case img");
    const ready = Promise.all([document.fonts.ready, cover?.decode ? cover.decode().catch(() => {}) : 0]);
    Promise.race([ready, new Promise((r) => setTimeout(r, 700))])
      .then(() => requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("go"))));
  }
})();
