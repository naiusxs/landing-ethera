// ETHERA · interactividad de la página; el aura WebGL vive en scene.js.
const cfg = window.ETHERA_CONFIG || {};
const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
const wide = () => innerWidth >= 960;

// Modo ligero en equipos modestos (<=4 núcleos, <=4 GB de RAM, ahorro de datos o ?lite=1)
let lite = false;
try {
  const c = navigator.connection || {};
  lite =
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    !!c.saveData ||
    /[?&]lite=1/.test(location.search);
} catch (e) {}
if (lite) root.classList.add("eth-lite");

// ---------- Píxel de Meta: solo si config.js trae metaPixelId ----------
if (/^\d+$/.test(cfg.metaPixelId || "") && !window.fbq) {
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  window.fbq("init", cfg.metaPixelId);
  window.fbq("track", "PageView");
}

// ---------- Datos del cliente (precios, checkout, contacto) ----------
Object.keys(cfg.plans || {}).forEach((key) => {
  const p = cfg.plans[key];
  const priceEl = $('[data-price="' + key + '"]');
  const btn = $('[data-plan="' + key + '"]');
  if (priceEl && p.price) priceEl.textContent = p.price;
  if (btn && p.checkoutUrl) {
    btn.disabled = false;
    btn.textContent = "Elegir este plan";
    btn.addEventListener("click", () => {
      if (window.fbq) {
        try {
          window.fbq("track", "InitiateCheckout");
        } catch (e) {}
      }
      location.href = p.checkoutUrl;
    });
  }
});
const wa = $("[data-whatsapp]");
if (wa) {
  if (cfg.whatsappNumber)
    wa.href = "https://wa.me/" + cfg.whatsappNumber + "?text=" + encodeURIComponent(cfg.whatsappMessage || "");
  else wa.style.display = "none";
}
const socials = { instagram: cfg.instagramUrl, facebook: cfg.facebookUrl };
$$("[data-social]").forEach((a) => {
  const url = socials[a.dataset.social];
  if (url) a.href = url;
  else a.style.display = "none";
});
$$("[data-privacy]").forEach((a) => {
  if (cfg.privacyUrl) a.href = cfg.privacyUrl;
});

// ---------- Navegación ----------
const nav = $("#nav");
const onScrollNav = () => nav.classList.toggle("is-solid", scrollY > 40);
addEventListener("scroll", onScrollNav, { passive: true });
onScrollNav();

// ---------- Preguntas: un ítem abierto a la vez ----------
const qas = $$("#faq-list .qa");
qas.forEach((qa) => {
  const btn = qa.querySelector("button");
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") !== "true";
    qas.forEach((o) => {
      o.classList.remove("is-open");
      o.querySelector("button").setAttribute("aria-expanded", "false");
    });
    if (open) {
      qa.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
    }
  });
});

// ---------- Experiencias: scroll con snap, flechas y arrastre con el mouse ----------
const viewport = $("#carousel");
if (viewport) {
  const navEl = $("#carousel-nav");
  const syncNav = () => (navEl.hidden = viewport.scrollWidth <= viewport.clientWidth + 4);
  syncNav();
  addEventListener("resize", syncNav);
  const step = (dir) => {
    const first = $("#carousel-track").children[0];
    viewport.scrollBy({ left: dir * (first.getBoundingClientRect().width + 20), behavior: "smooth" });
  };
  $('[data-carousel="prev"]').addEventListener("click", () => step(-1));
  $('[data-carousel="next"]').addEventListener("click", () => step(1));
  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  let down = false,
    startX = 0,
    startLeft = 0;
  viewport.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    down = true;
    startX = e.clientX;
    startLeft = viewport.scrollLeft;
  });
  addEventListener("pointermove", (e) => {
    if (!down) return;
    viewport.classList.add("is-drag");
    viewport.scrollLeft = startLeft - (e.clientX - startX);
  });
  addEventListener("pointerup", () => {
    if (!down) return;
    down = false;
    viewport.classList.remove("is-drag");
  });
}

// ---------- Experiencias: videos en bucle (como GIF), cargan al acercarse y se pausan fuera de pantalla ----------
const expVideos = $$(".exp__video");
if (expVideos.length && !reduce && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ target: v, isIntersecting }) => {
        if (isIntersecting) {
          if (!v.src) v.src = v.dataset.src;
          v.play().catch(() => {});
        } else v.pause();
      }),
    { rootMargin: "200px" },
  );
  expVideos.forEach((v) => io.observe(v));
}

// ---------- Interacciones con puntero fino ----------
if (fine && !reduce) {
  // Planes: inclinación suave
  $$("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 6).toFixed(2) + "deg");
      card.style.setProperty("--rx", (-((e.clientY - r.top) / r.height - 0.5) * 6).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--rx", "0deg");
    });
  });
  // Ingredientes: la luz sigue al puntero
  $$("[data-spot]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });
  // Orbe de color: se desplaza hacia el puntero y vuelve a su sitio al salir
  $$(".panel--orb").forEach((panel) => {
    const fig = panel.closest(".split__fig");
    const img = panel.querySelector("img");
    fig.addEventListener("pointermove", (e) => {
      const r = panel.getBoundingClientRect();
      img.style.setProperty("--ox", (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(2));
      img.style.setProperty("--oy", (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(2));
    });
    fig.addEventListener("pointerleave", () => {
      img.style.setProperty("--ox", 0);
      img.style.setProperty("--oy", 0);
    });
  });
  // Botones magnéticos
  $$("[data-magnet]").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      b.style.translate = dx * 0.16 + "px " + dy * 0.26 + "px";
    });
    b.addEventListener("pointerleave", () => (b.style.translate = ""));
  });
}

// ---------- Banner de video (el de la tienda oficial): carga al acercarse y se pausa fuera de pantalla ----------
const bannerVideo = $(".e-banner__video");
if (bannerVideo && !reduce && !lite && "IntersectionObserver" in window) {
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (!bannerVideo.src) bannerVideo.src = bannerVideo.dataset.src;
        bannerVideo.play().catch(() => {});
      } else bannerVideo.pause();
    },
    { rootMargin: "200px" },
  ).observe(bannerVideo);
}

// ---------- Cookies y popup ----------
const cookies = $("#cookies");
const COOKIE_KEY = "ethera_cookies_ok";
try {
  if (!localStorage.getItem(COOKIE_KEY)) cookies.classList.add("is-on");
} catch (e) {
  cookies.classList.add("is-on");
}
$("#cookies-close").addEventListener("click", () => {
  cookies.classList.remove("is-on");
  try {
    localStorage.setItem(COOKIE_KEY, "1");
  } catch (e) {}
});

const overlay = $("#eth-popup");
const POP_KEY = "ethera_popup_seen";
let seen = false;
try {
  seen = !!localStorage.getItem(POP_KEY);
} catch (e) {}
const closePopup = () => {
  overlay.classList.remove("open");
  try {
    localStorage.setItem(POP_KEY, "1");
  } catch (e) {}
};
if (!seen) setTimeout(() => overlay.classList.add("open"), cfg.popupDelayMs || 3000);
$("#eth-popup-close").addEventListener("click", closePopup);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closePopup();
});
addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePopup();
});
const form = $("#eth-popup-form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const btn = form.querySelector("button[type=submit]");
  const done = () => {
    const code = cfg.discountCode ? " Tu código: <strong>" + cfg.discountCode + "</strong>" : "";
    form.innerHTML = '<p class="eth-msg">¡Gracias! Revisa tu correo para tu 10% de descuento.' + code + "</p>";
    try {
      localStorage.setItem(POP_KEY, "1");
    } catch (e) {}
    if (window.fbq) {
      try {
        window.fbq("track", "Lead");
      } catch (e) {}
    }
  };
  btn.disabled = true;
  if (!cfg.newsletterEndpoint) return done();
  fetch(cfg.newsletterEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: form.email.value }),
  })
    .then(done)
    .catch(() => (btn.disabled = false));
});

// ---------- Animación con GSAP ----------
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
let scene = null;

if (gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  // Título del hero: entrada palabra por palabra (la única secuencia de carga)
  const title = $("[data-split]");
  if (title) {
    const wrap = (node) =>
      Array.from(node.childNodes)
        .map((n) =>
          n.nodeType === 3
            ? n.textContent
                .split(/\s+/)
                .filter(Boolean)
                .map((w) => '<span class="w" aria-hidden="true"><span>' + w + "</span></span>")
                .join(" ")
            : "<em>" + wrap(n) + "</em>",
        )
        .join(" ");
    title.setAttribute("aria-label", title.textContent.trim().replace(/\s+/g, " "));
    title.innerHTML = wrap(title);
  }

  if (!reduce) {
    gsap
      .timeline({ defaults: { ease: "power4.out" } })
      .from(".hero__pill", { opacity: 0, y: 14, duration: 0.7 }, 0)
      .from(".hero__title .w > span", { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.1)
      .from(".hero__lede, .hero__cta, .checks", { opacity: 0, y: 22, duration: 0.8, stagger: 0.12 }, 0.7)
      .from(".hero__disc", { scale: 0.6, opacity: 0, duration: 1.3 }, 0.2)
      .from(".hero__jar", { y: 60, opacity: 0, rotate: -8, duration: 1.2 }, 0.35)
      .from(".tag", { opacity: 0, scale: 0.7, duration: 0.7, stagger: 0.15, ease: "back.out(1.6)" }, 1.1);

    // Aparición al hacer scroll. El estado inicial se fija ANTES de entrar en pantalla
    // (con gsap.from el contenido se veía y luego saltaba a invisible: ese era el parpadeo).
    const reveal = (sel, from, { duration = 0.9, stagger = 0.09, ease = "power3.out", start = "top 92%" } = {}) => {
      const els = $$(sel);
      if (!els.length) return;
      const hidden = { opacity: 0, ...from };
      const show = (batch) =>
        gsap.to(batch, {
          opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, rotateX: 0, filter: "blur(0px)",
          duration, stagger, ease, overwrite: true, clearProps: "transform,filter,opacity",
        });
      // Se reinicia al salir de pantalla, por arriba o por abajo, y vuelve a entrar al regresar
      ScrollTrigger.batch(els, {
        start,
        end: "bottom 6%",
        onEnter: show,
        onEnterBack: show,
        onLeave: (batch) => gsap.set(batch, { ...hidden, overwrite: true }),
        onLeaveBack: (batch) => gsap.to(batch, { ...hidden, duration: 0.25, stagger: 0, overwrite: true }),
      });
      gsap.set(els, hidden);
    };
    // Cada tipo de contenido entra distinto
    reveal(".head > *", { y: 30, filter: "blur(8px)" }, { duration: 1, stagger: 0.12 });
    reveal(".card", { y: 60, scale: 0.92, rotate: 2 }, { duration: 1, stagger: 0.1, ease: "back.out(1.3)" });
    reveal(".step", { x: -50, rotate: -2 }, { stagger: 0.14 });
    reveal(".plan", { y: 80, scale: 0.9 }, { duration: 1.1, stagger: 0.16, ease: "expo.out" });
    reveal(".qa", { x: -24 }, { duration: 0.7, stagger: 0.05 });
    reveal(".extras > *", { scale: 0.6 }, { duration: 0.6, stagger: 0.05, ease: "back.out(2)" });
    reveal(".split__copy > *", { x: -34, filter: "blur(6px)" }, { stagger: 0.1 });
    reveal(".split__fig", { scale: 0.85, rotate: 3 }, { duration: 1.2, ease: "expo.out" });
    reveal(".exp", { y: 60, scale: 0.94 }, { stagger: 0.1 });

    // Paneles: flotan con el scroll
    $$("[data-float]").forEach((el) =>
      gsap.fromTo(
        el,
        { yPercent: 6, rotate: -2 },
        {
          yPercent: -6,
          rotate: 2,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
        },
      ),
    );
    gsap.from(".final__orb", {
      scale: 0.7,
      opacity: 0,
      duration: 1.4,
      ease: "power2.out",
      scrollTrigger: { trigger: ".final", start: "top 70%", once: true },
    });

    // Pasos: se encienden al cruzar la mitad de la pantalla
    $$(".step").forEach((s) =>
      ScrollTrigger.create({ trigger: s, start: "top 62%", end: "bottom 38%", toggleClass: { targets: s, className: "is-on" } }),
    );

    // Cita de la filosofía: se ilumina con el scroll
    const quote = $("#quote");
    if (quote)
      gsap.fromTo(
        quote,
        { opacity: 0.55, x: -16 },
        { opacity: 1, x: 0, ease: "none", scrollTrigger: { trigger: quote, start: "top 92%", end: "top 62%", scrub: 0.4 } },
      );
  }

  // Paralaje del hero y orbe de color que sigue al puntero
  const stage = $(".hero__stage");
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener(
    "pointermove",
    (e) => {
      par.tx = (e.clientX / innerWidth) * 2 - 1;
      par.ty = (e.clientY / innerHeight) * 2 - 1;
      if (scene) scene.setPointer(e.clientX / innerWidth, 1 - e.clientY / innerHeight);
    },
    { passive: true },
  );
  gsap.ticker.add(() => {
    if (!stage || reduce) return;
    par.x += (par.tx - par.x) * 0.08;
    par.y += (par.ty - par.y) * 0.08;
    stage.style.setProperty("--px", par.x.toFixed(3));
    stage.style.setProperty("--py", par.y.toFixed(3));
  });

  // Aura WebGL: avanza con el scroll de toda la página
  const canvas = $("#aura");
  const progress = () => scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  addEventListener("scroll", () => scene && scene.setScroll(progress()), { passive: true });
  document.addEventListener("visibilitychange", () => scene && scene.setActive(!document.hidden));
  (async () => {
    try {
      const mod = await import("./scene.js");
      scene = mod.createScene(canvas, { lite, reducedMotion: reduce });
      if (!scene) canvas.remove();
      else scene.setScroll(progress());
    } catch (err) {
      console.warn("Aura WebGL no disponible:", err);
      canvas.remove();
    }
  })();

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener("load", () => ScrollTrigger.refresh());
}
