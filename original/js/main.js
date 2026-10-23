(function () {
  var cfg = window.ETHERA_CONFIG || {};

  // Píxel de Meta: solo se carga si config.js trae metaPixelId (snippet oficial de Meta)
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

  // Barra superior rotativa
  var topbar = document.querySelector("#topbar > div");
  if (topbar) {
    var truck = topbar.querySelector("svg").outerHTML;
    var msgs = [
      { svg: truck, text: "Envío Gratis a toda Colombia" },
      {
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
        text: "Garantía de satisfacción",
      },
      {
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>',
        text: "+2,500 clientes satisfechos · 4.9/5",
      },
    ];
    var i = 0;
    setInterval(function () {
      i = (i + 1) % msgs.length;
      // reinsertar el nodo reinicia la animación fade-up, igual que la referencia
      var clone = topbar.cloneNode(false);
      clone.innerHTML = msgs[i].svg + "<span>" + msgs[i].text + "</span>";
      topbar.parentNode.replaceChild(clone, topbar);
      topbar = clone;
    }, 4000);
  }

  // Navbar: fondo sólido al hacer scroll
  var nav = document.getElementById("nav");
  var solid = "bg-background/95 backdrop-blur-md border-b border-border/50 py-3 shadow-lg".split(" ");
  var clear = "bg-transparent py-5".split(" ");
  function onScroll() {
    var scrolled = window.scrollY > 50;
    solid.forEach(function (c) {
      nav.classList.toggle(c, scrolled);
    });
    clear.forEach(function (c) {
      nav.classList.toggle(c, !scrolled);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // FAQ: un ítem abierto a la vez
  // El estado vive en [data-open] / aria-expanded; la apariencia se define en index.html con group-data-[open]:*
  var items = document.querySelectorAll("#faq [data-faq]");
  function setFaq(item, open) {
    item.toggleAttribute("data-open", open);
    item.querySelector("button").setAttribute("aria-expanded", String(open));
  }
  items.forEach(function (item) {
    item.querySelector("button").addEventListener("click", function () {
      var open = !item.hasAttribute("data-open");
      items.forEach(function (o) {
        setFaq(o, false);
      });
      setFaq(item, open);
    });
  });

  // Carrusel de testimonios (scroll horizontal con snap + flechas)
  var viewport = document.getElementById("carousel-viewport");
  if (viewport) {
    viewport.style.overflowX = "auto";
    viewport.style.scrollSnapType = "x mandatory";
    viewport.style.scrollbarWidth = "none";
    viewport.style.webkitOverflowScrolling = "touch";
    Array.prototype.forEach.call(document.getElementById("carousel-track").children, function (s) {
      s.style.scrollSnapAlign = "center";
    });
    var step = function (dir) {
      var slide = document.getElementById("carousel-track").children[0];
      var w = slide.getBoundingClientRect().width + 24;
      viewport.scrollBy({ left: dir * w, behavior: "smooth" });
    };
    document.querySelector('[data-carousel="prev"]').addEventListener("click", function () {
      step(-1);
    });
    document.querySelector('[data-carousel="next"]').addEventListener("click", function () {
      step(1);
    });
  }

  // Precios + checkout
  var plans = cfg.plans || {};
  Object.keys(plans).forEach(function (key) {
    var p = plans[key];
    var priceEl = document.querySelector('[data-price="' + key + '"]');
    var btn = document.querySelector('[data-plan="' + key + '"]');
    if (priceEl && p.price) priceEl.textContent = p.price;
    if (btn && p.checkoutUrl) {
      btn.disabled = false;
      btn.addEventListener("click", function () {
        if (window.fbq) {
          try {
            window.fbq("track", "InitiateCheckout");
          } catch (e) {}
        }
        window.location.href = p.checkoutUrl;
      });
    }
  });

  // WhatsApp y enlaces sociales
  var wa = document.querySelector("[data-whatsapp]");
  if (wa) {
    if (cfg.whatsappNumber) {
      wa.href = "https://wa.me/" + cfg.whatsappNumber + "?text=" + encodeURIComponent(cfg.whatsappMessage || "");
    } else {
      wa.style.display = "none";
    }
  }
  var map = { instagram: cfg.instagramUrl, facebook: cfg.facebookUrl };
  document.querySelectorAll("[data-social]").forEach(function (a) {
    var url = map[a.getAttribute("data-social")];
    if (url) a.href = url;
    else a.style.display = "none";
  });
  document.querySelectorAll("[data-privacy]").forEach(function (a) {
    if (cfg.privacyUrl) a.href = cfg.privacyUrl;
  });

  // Scroll con offset para el navbar fijo
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href").slice(1);
      if (!id) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      var t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: window.scrollY + t.getBoundingClientRect().top - 110, behavior: "smooth" });
    });
  });

  // Popup de descuento (captura de email)
  var overlay = document.getElementById("eth-popup");
  if (overlay) {
    var KEY = "ethera_popup_seen";
    var seen = false;
    try {
      seen = !!localStorage.getItem(KEY);
    } catch (e) {}
    var close = function () {
      overlay.classList.remove("open");
      try {
        localStorage.setItem(KEY, "1");
      } catch (e) {}
    };
    if (!seen)
      setTimeout(function () {
        overlay.classList.add("open");
      }, cfg.popupDelayMs || 3000);
    document.getElementById("eth-popup-close").addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
    var form = document.getElementById("eth-popup-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type=submit]");
      var perfil = form.querySelector("input[name=perfil]:checked");
      var data = { email: form.email.value, perfil: perfil ? perfil.value : "" };
      var done = function () {
        var code = cfg.discountCode ? " Tu código: <strong>" + cfg.discountCode + "</strong>" : "";
        form.innerHTML = '<p class="eth-msg">¡Gracias! Revisa tu correo para tu 10% de descuento.' + code + "</p>";
        try {
          localStorage.setItem(KEY, "1");
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
        .catch(function () {
          btn.disabled = false;
        });
    });
  }

  // Pausar animaciones de las secciones que no están en pantalla
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          en.target.classList.toggle("eth-offscreen", !en.isIntersecting);
        });
      },
      { rootMargin: "100px" },
    );
    document.querySelectorAll("main > section").forEach(function (sec) {
      io.observe(sec);
    });
  }

  // Modo ligero en equipos modestos (<=4 núcleos, <=4 GB de RAM o ahorro de datos)
  try {
    var c = navigator.connection || {};
    if (
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
      c.saveData ||
      /[?&]lite=1/.test(location.search)
    ) {
      document.documentElement.classList.add("eth-lite");
    }
  } catch (e) {}
})();
