// Datos que cambian por cliente. Todo lo demás vive en index.html.
window.ETHERA_CONFIG = {
  // Número en formato internacional, sin "+" ni espacios (ej. 573001234567)
  whatsappNumber: "",
  whatsappMessage: "Hola, quiero saber más de Ethera Melena de León",

  instagramUrl: "",
  facebookUrl: "",
  privacyUrl: "",

  // ID del píxel de Meta (solo números). Vacío = no se carga el píxel ni se envía ningún evento.
  metaPixelId: "",

  // Enlace de checkout de cada plan. Mientras checkoutUrl esté vacío el botón queda deshabilitado
  // ("Muy pronto"). Los precios ya están en index.html; si pones price aquí, reemplaza al del HTML.
  plans: {
    "1frasco": { price: "", checkoutUrl: "" },
    "2frascos": { price: "", checkoutUrl: "" },
    "3frascos": { price: "", checkoutUrl: "" },
  },

  // Popup de descuento. newsletterEndpoint recibe un POST JSON {email}
  // (Klaviyo, Mailchimp, Make/Zapier, tu backend...). Vacío = solo muestra el mensaje de gracias.
  newsletterEndpoint: "",
  popupDelayMs: 3000,
  discountCode: "",
};
