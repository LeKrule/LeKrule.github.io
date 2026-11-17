/* Portada: hora de Madrid y vistas previas de la presentación */
(() => {
  const root = document.documentElement;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Hora de Madrid ---------- */
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" });
  const status = document.querySelector("[data-status]");
  const bigTime = document.querySelector("[data-madrid]");
  const renderTime = () => {
    const t = fmt.format(new Date());
    status.textContent = root.dataset.lang === "es"
      ? `Son las ${t} en Madrid. Abierto a nuevas oportunidades.`
      : `It's ${t} in Madrid. Open to new roles.`;
    bigTime.textContent = t;
  };
  renderTime();
  setInterval(renderTime, 15000);
  addEventListener("langchange", renderTime);

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
})();
