// ETHERA · rediseño. Interactividad de la página; la escena WebGL vive en scene.js.
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
  if (priceEl && p.price) {
    priceEl.textContent = p.price;
    priceEl.dataset.set = "";
  }
  if (btn && p.checkoutUrl) {
    btn.disabled = false;
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

// ---------- FAQ: un ítem abierto a la vez ----------
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

// ---------- Testimonios: scroll con snap, flechas y arrastre con el mouse ----------
const viewport = $("#carousel-viewport");
if (viewport) {
  const step = (dir) => {
    const first = $("#carousel-track").children[0];
    viewport.scrollBy({ left: dir * (first.getBoundingClientRect().width + 18), behavior: "smooth" });
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

// ---------- Planes: inclinación suave con el puntero ----------
if (fine && !reduce) {
  $$("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
      card.style.setProperty("--rx", (-y * 7).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--rx", "0deg");
    });
  });
}

// ---------- Botones magnéticos ----------
if (fine && !reduce) {
  $$("[data-magnet]").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      b.style.translate = dx * 0.18 + "px " + dy * 0.28 + "px";
    });
    b.addEventListener("pointerleave", () => (b.style.translate = ""));
  });
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
if (!seen) {
  setTimeout(() => {
    try {
      const saved = sessionStorage.getItem("ethera_perfil");
      const radio = saved && $('input[name="perfil"][value="' + saved + '"]', overlay);
      if (radio) radio.checked = true;
    } catch (e) {}
    overlay.classList.add("open");
  }, cfg.popupDelayMs || 3000);
}
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
  const perfil = form.querySelector("input[name=perfil]:checked");
  const data = { email: form.email.value, perfil: perfil ? perfil.value : "" };
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
    body: JSON.stringify(data),
  })
    .then(done)
    .catch(() => (btn.disabled = false));
});

// ---------- Todo lo que usa GSAP ----------
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
let scene = null; // se asigna más abajo si WebGL está disponible
let userAccent = "#DC4E88";
let sectionAccent = null;
const applyAccent = () => {
  const c = sectionAccent || userAccent;
  root.style.setProperty("--accent", c);
  if (scene) scene.setAccent(c);
};

// Selector "¿Qué quieres despertar?"
const chips = $$(".chip");
chips.forEach((chip) =>
  chip.addEventListener("click", () => {
    chips.forEach((c) => {
      const on = c === chip;
      c.classList.toggle("is-on", on);
      c.setAttribute("aria-selected", String(on));
    });
    $$(".perfil__copy").forEach((p) => {
      const on = p.dataset.for === chip.dataset.perfil;
      p.hidden = !on;
      p.classList.toggle("is-on", on);
    });
    userAccent = chip.dataset.accent;
    applyAccent();
    if (scene) {
      const r = chip.getBoundingClientRect();
      scene.pulse(((r.left + r.width / 2) / innerWidth) * 2 - 1, -(((r.top + r.height / 2) / innerHeight) * 2 - 1));
    }
    try {
      sessionStorage.setItem("ethera_perfil", chip.dataset.perfil);
    } catch (e) {}
  }),
);

if (gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  if (window.Draggable) gsap.registerPlugin(window.Draggable);

  // Título del hero: entrada palabra por palabra (única secuencia de carga)
  const title = $("[data-split]");
  if (title) {
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute("aria-label", words.join(" "));
    title.innerHTML = words.map((w) => '<span class="w" aria-hidden="true"><span>' + w + "</span></span>").join(" ");
  }
  root.classList.add("ready");
  if (!reduce) {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".hero__lab", { opacity: 0, y: 14, duration: 0.7 }, 0)
      .from(".hero__title .w > span", { yPercent: 115, duration: 1.1, stagger: 0.08 }, 0.1)
      .from(".hero__lede, .hero__cta, .proof", { opacity: 0, y: 22, duration: 0.8, stagger: 0.12 }, 0.7)
      .from(".hero__product", { opacity: 0, scale: 0.86, rotate: -6, duration: 1.2 }, 0.3)
      .from(".stk", { opacity: 0, scale: 0.4, duration: 0.9, stagger: 0.1, ease: "back.out(1.6)" }, 0.8);
  }

  // Paralaje del hero con el puntero
  const stage = $(".hero__stage");
  $$("[data-depth]", stage).forEach((el) => el.style.setProperty("--d", el.dataset.depth));
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener(
    "pointermove",
    (e) => {
      par.tx = (e.clientX / innerWidth) * 2 - 1;
      par.ty = (e.clientY / innerHeight) * 2 - 1;
    },
    { passive: true },
  );

  // Pegatinas arrastrables de la "mesa"
  const table = $("#sticker-table");
  if (window.Draggable && table) {
    window.Draggable.create($$(".drag", table), {
      type: "x,y",
      bounds: table,
      zIndexBoost: true,
      onPress() {
        gsap.to(this.target, { scale: 1.07, duration: 0.2 });
        const hint = $(".table__hint", table);
        if (hint) hint.style.display = "none";
      },
      onRelease() {
        gsap.to(this.target, { scale: 1, duration: 0.4, ease: "back.out(2)" });
      },
    });
  }

  // Texto de la filosofía: se ilumina palabra por palabra con el scroll
  const big = $("#philo-big");
  if (big) {
    big.innerHTML = big.textContent
      .trim()
      .split(/\s+/)
      .map((w) => '<span class="wd">' + w + "</span>")
      .join(" ");
    const wds = $$(".wd", big);
    if (reduce) gsap.set(wds, { opacity: 1 });
    else
      gsap.to(wds, {
        opacity: 1,
        ease: "none",
        stagger: 0.12,
        scrollTrigger: { trigger: big, start: "top 82%", end: "bottom 52%", scrub: 0.4 },
      });
  }

  // ---------- Cómo funciona: pasos + progreso ----------
  const how = $("#como-funciona");
  const steps = $$("#how-steps .step");
  const fill = $("#how-fill");
  const stepAccents = ["#DC4E88", "#6C93E6", "#E3B05A", "#DC4E88"];
  let stepIdx = -1;
  const setStep = (i) => {
    if (i === stepIdx) return;
    stepIdx = i;
    steps.forEach((s, k) => s.classList.toggle("is-on", k === i));
    sectionAccent = stepAccents[i];
    applyAccent();
  };
  const stepAt = (t) => (t < 0.28 ? 0 : t < 0.52 ? 1 : t < 0.78 ? 2 : 3);
  ScrollTrigger.create({
    trigger: how,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      fill.style.transform = "scaleX(" + self.progress.toFixed(4) + ")";
      setStep(stepAt(self.progress));
    },
    onToggle: (self) => {
      if (!self.isActive) {
        sectionAccent = null;
        stepIdx = -1;
        applyAccent();
      }
    },
  });

  // ---------- Escena WebGL: forma y posición según el scroll ----------
  const canvas = $("#mycelium");
  const sec = (id) => document.getElementById(id);
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  // Cada parada: posición de scroll (y), forma (p) y desplazamiento horizontal (o)
  let stops = [{ y: 0, p: 0, o: 0 }];
  const buildStops = () => {
    const vh = innerHeight;
    const o = wide() ? 1 : 0;
    const howTop = top(how);
    const howLen = how.offsetHeight - vh;
    const at = (t, p) => ({ y: howTop + howLen * t, p, o: o * 0.17 });
    // La red solo se ve en hero, "Cómo funciona" y cierre; entre medias hay fondo sólido,
    // así que la forma cambia sin que se note.
    stops = [
      { y: 0, p: 0, o: o * 0.2 },
      { y: top(sec("perfil")), p: 0, o: 0 },
      { y: howTop - vh * 0.6, p: 1, o: o * 0.1 },
      at(0, 1),
      at(0.14, 1),
      at(0.32, 2),
      at(0.45, 2),
      at(0.58, 3),
      at(0.7, 3),
      at(0.84, 4),
      at(1, 4),
      { y: top(sec("final")) - vh, p: 4, o: 0 },
    ].sort((a, b) => a.y - b.y);
  };
  const sample = (y) => {
    if (y <= stops[0].y) return stops[0];
    for (let i = 1; i < stops.length; i++) {
      const a = stops[i - 1],
        b = stops[i];
      if (y <= b.y) {
        const k = b.y === a.y ? 1 : (y - a.y) / (b.y - a.y);
        const s = k * k * (3 - 2 * k);
        return { p: a.p + (b.p - a.p) * s, o: a.o + (b.o - a.o) * s };
      }
    }
    return stops[stops.length - 1];
  };
  ScrollTrigger.addEventListener("refresh", buildStops);

  const cur = { p: 0, o: wide() ? 0.2 : 0 };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener(
    "pointermove",
    (e) => {
      ptr.tx = (e.clientX / innerWidth) * 2 - 1;
      ptr.ty = -((e.clientY / innerHeight) * 2 - 1);
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => {
    ptr.tx = ptr.ty = 0;
  });

  gsap.ticker.add(() => {
    // paralaje de las pegatinas del hero
    const k = reduce ? 1 : 0.08;
    par.x += (par.tx - par.x) * k;
    par.y += (par.ty - par.y) * k;
    if (stage) {
      stage.style.setProperty("--px", par.x.toFixed(3));
      stage.style.setProperty("--py", par.y.toFixed(3));
    }
    if (!scene) return;
    const t = sample(scrollY);
    cur.p += (t.p - cur.p) * (reduce ? 1 : 0.1);
    cur.o += (t.o - cur.o) * (reduce ? 1 : 0.1);
    ptr.x += (ptr.tx - ptr.x) * 0.2;
    ptr.y += (ptr.ty - ptr.y) * 0.2;
    scene.setProgress(cur.p);
    scene.setOffset(cur.o);
    scene.setPointer(ptr.x, ptr.y);
  });

  // La escena solo corre mientras hay un panel oscuro a la vista
  const dark = $$(".panel--net");
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => (en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)));
    if (scene) scene.setActive(visible.size > 0 && !document.hidden);
  });
  dark.forEach((s) => io.observe(s));
  document.addEventListener("visibilitychange", () => {
    if (scene) scene.setActive(visible.size > 0 && !document.hidden);
  });
  addEventListener("pointerdown", (e) => {
    if (scene) scene.pulse((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
  });

  (async () => {
    try {
      const mod = await import("./scene.js");
      scene = mod.createScene(canvas, { lite, reducedMotion: reduce });
      if (!scene) canvas.remove();
      else applyAccent();
    } catch (err) {
      console.warn("Escena WebGL no disponible:", err);
      canvas.remove();
    }
  })();

  buildStops();
  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  addEventListener("load", refresh);
}
