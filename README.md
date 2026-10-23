# ETHERA · rediseño interactivo

Copia independiente de la landing (la original sigue en la carpeta padre). CSS plano + Three.js + GSAP, **sin build**.

```
index.html     contenido y estructura
css/site.css   todo el diseño (tokens al inicio de :root)
js/main.js     interacciones, GSAP/ScrollTrigger y conexión con la escena
js/scene.js    micelio WebGL (Three.js): 5 formas, pulsos, reacción al cursor
js/config.js   datos del cliente (igual que la original; vacío = la página se degrada sin romperse)
vendor/        three, gsap, ScrollTrigger y Draggable locales (sin CDN)
```

Ver en local: `npm run serve` (los módulos ES no cargan desde `file://`).
Regenerar `vendor/` tras `npm i`: `npm run vendor`.

- Modo ligero automático (<=4 núcleos, <=4 GB, ahorro de datos o `?lite=1`): 2.200 nodos, sin sombras ni animaciones decorativas.
- Si WebGL no está disponible, la página funciona igual sin el micelio.
- `prefers-reduced-motion` desactiva la entrada animada, el paralaje y la deriva de la red.
