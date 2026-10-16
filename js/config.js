// Datos que cambian por cliente. Todo lo demás vive en index.html.
window.ETHERA_CONFIG = {
  // Número en formato internacional, sin "+" ni espacios (ej. 573001234567)
  whatsappNumber: "",
  whatsappMessage: "Hola, quiero saber más del Ritual 90 días",

  instagramUrl: "",
  facebookUrl: "",
  privacyUrl: "",

  // Precio mostrado (COP) y enlace de checkout de cada plan.
  // Mientras checkoutUrl esté vacío el botón queda deshabilitado.
  plans: {
    "1month":  { price: "", checkoutUrl: "" },
    "3months": { price: "", checkoutUrl: "" },
    "6months": { price: "", checkoutUrl: "" },
  },
};

// Popup de descuento. newsletterEndpoint recibe un POST JSON {email, perfil}
// (Klaviyo, Mailchimp, Make/Zapier, tu backend...). Vacío = solo muestra el mensaje de gracias.
window.ETHERA_CONFIG.newsletterEndpoint = "";
window.ETHERA_CONFIG.popupDelayMs = 3000;
window.ETHERA_CONFIG.discountCode = "";
