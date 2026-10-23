# ETHERA – Landing

Landing estática (HTML + CSS + JS plano) de Melena de León. No tiene backend: se sube tal cual a cualquier hosting estático.

## Estructura

```
index.html        Contenido y marcado (clases de Tailwind)
src/input.css     FUENTE del CSS: tema, colores, animaciones y clases propias (btn-primary-cta, floating...)
css/styles.css    GENERADO por Tailwind desde src/input.css. No editar a mano.
css/popup.css     Popup de descuento
css/perf.css      Optimizaciones de rendimiento y modo ligero
js/config.js      Datos por cliente: WhatsApp, redes, precios, checkout, píxel de Meta, popup
js/main.js        Interactividad
assets/           Imágenes
```

## Trabajar

```bash
npm install          # una sola vez
npm run watch:css    # regenera css/styles.css al cambiar index.html, js/ o src/input.css
npm run build:css    # build puntual (minificado)
npx prettier --write index.html js css/popup.css css/perf.css
```

Tailwind lee `index.html` y `js/` para saber qué clases generar, así que ya se pueden usar clases nuevas
libremente (solo hay que tener `watch:css` corriendo o ejecutar `build:css` antes de subir).
**`css/styles.css` se versiona** para que el sitio funcione sin paso de build en el hosting.

## Configuración (js/config.js)

Todo vacío por defecto y la página se degrada sin romperse:

- `plans.*.checkoutUrl` vacío → botón de compra deshabilitado; `price` vacío → se muestra "—".
- `whatsappNumber`, `instagramUrl`, `facebookUrl` vacíos → el enlace se oculta.
- `metaPixelId` vacío → no se carga el píxel de Meta. Con un ID numérico se carga y dispara `PageView`,
  `InitiateCheckout` (clic en comprar) y `Lead` (popup).
- `newsletterEndpoint` vacío → el popup solo muestra el agradecimiento.

## Notas

- FAQ: el estado vive en `data-open` / `aria-expanded`; el estilo se define en el HTML con `group-data-[open]:*`.
- Modo ligero (`.eth-lite`): se activa solo en equipos modestos, o con `?lite=1`.
- Placeholders pendientes de contenido real: testimonios (`assets/placeholder-9x16.svg`) y foto de fundadores
  (`assets/placeholder-4x5.svg`).
