/* Común a todas las páginas: idioma, año, copiar correo, índice activo y notas a mano */
(() => {
  const root = document.documentElement;

  /* ---------- Idioma (EN/ES), recordado entre visitas ---------- */
  const langButtons = document.querySelectorAll(".lang [data-set]");
  const markLang = () => langButtons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.set === root.dataset.lang));
  langButtons.forEach((b) => b.addEventListener("click", () => {
    root.dataset.lang = root.lang = b.dataset.set;
    localStorage.setItem("lang", b.dataset.set);
    markLang();
    dispatchEvent(new Event("langchange"));
  }));
  markLang();

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Copiar el correo al hacer clic ---------- */
  document.querySelectorAll("[data-copy]").forEach((el) => el.addEventListener("click", async (e) => {
    e.preventDefault();
    try { await navigator.clipboard.writeText(el.dataset.copy); }
    catch { location.href = el.href; return; }               // sin portapapeles: abre el correo
    const box = el.closest(".contact") || el;
    box.classList.add("copied");
    clearTimeout(box._t);
    box._t = setTimeout(() => box.classList.remove("copied"), 2000);
  }));

  /* ---------- Índice: marca la sección que se está leyendo ----------
     La activa es la última cuyo inicio ya ha pasado del 35 % de la pantalla;
     al llegar al final se marca la última. */
  const spyLinks = [...document.querySelectorAll('.toc a[href^="#"], .toc-v a[href^="#"]')];
  const targets = spyLinks.map((a) => document.getElementById(a.hash.slice(1)));
  if (spyLinks.length && targets.every(Boolean)) {
    let ticking = false;
    const spy = () => {
      ticking = false;
      const line = innerHeight * 0.35;
      let idx = 0;
      targets.forEach((t, i) => { if (t.getBoundingClientRect().top <= line) idx = i; });
      if (innerHeight + scrollY >= root.scrollHeight - 4) idx = targets.length - 1;
      spyLinks.forEach((a, i) => a.classList.toggle("on", i === idx));
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    addEventListener("resize", spy);
    spy();
  }

  /* ---------- Notas a mano: se escriben al entrar en pantalla ---------- */
  const notes = document.querySelectorAll(".note");
  if (notes.length) {
    root.classList.add("js-notes");
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -15% 0px" });
    notes.forEach((n) => io.observe(n));
  }
})();
