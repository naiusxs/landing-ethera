// Campo de color del banner del lema: degradado fluido y vibrante con las seis tintas de la marca.
// Mismo lenguaje que la animación de la marca (manchas que se deforman y se mezclan), generado en vivo.
// WebGL puro, resolución interna baja (el difuminado es el efecto). Devuelve null si no hay WebGL.
const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const FRAG = `
precision highp float;
uniform vec2 uRes, uPtr; uniform float uT, uHover;
const vec3 CYAN = vec3(0., .70, 1.), GREEN = vec3(.45, .80, .25), YELLOW = vec3(1., .86, 0.),
           ORANGE = vec3(1., .42, .06), RED = vec3(.98, .16, .08), PURPLE = vec3(.46, .10, .95);
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  for (int i = 0; i < 3; i++){ v += a * noise(p); p = p * 2.03 + 11.7; a *= .45; }
  return v;
}
vec3 pal(float x){
  x = fract(x) * 6.;
  float k = fract(x); k = k * k * (3. - 2. * k);
  if (x < 1.) return mix(CYAN, GREEN, k);
  if (x < 2.) return mix(GREEN, YELLOW, k);
  if (x < 3.) return mix(YELLOW, ORANGE, k);
  if (x < 4.) return mix(ORANGE, RED, k);
  if (x < 5.) return mix(RED, PURPLE, k);
  return mix(PURPLE, CYAN, k);
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (uv - .5) * vec2(uRes.x / uRes.y, 1.) * .8;
  float t = uT * .16;
  // el puntero atrae y deforma el campo
  vec2 q = (uPtr - .5) * vec2(uRes.x / uRes.y, 1.) * .8;
  float d = length(p - q);
  p += (q - p) * exp(-d * d * 2.) * .25 * uHover;
  // deformación de dominio: las manchas se estiran y se funden como tinta en agua
  vec2 w = vec2(fbm(p + vec2(t, -t * .7)), fbm(p + vec2(5.2 - t * .6, 1.3 + t)));
  vec2 w2 = vec2(fbm(p + 1.6 * w + vec2(1.7, 9.2) + t * .5), fbm(p + 1.6 * w + vec2(8.3, 2.8) - t * .4));
  float f = fbm(p + 1.8 * w2);
  vec3 col = pal(f * .95 + p.x * .3 - t * .25 + w2.x * .35);
  // más profundidad: segunda capa desfasada
  col = mix(col, pal(f * 1.1 + w.y + t * .25 + .5), .28 * smoothstep(.3, .8, w2.y));
  col = mix(vec3(dot(col, vec3(.3, .59, .11))), col, 1.18);
  col += vec3(1., .86, .62) * exp(-d * d * 4.) * .2 * uHover;
  gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
}`;

export function createBanner(canvas, { lite = false, reducedMotion = false } = {}) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return null;
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = sh(gl.VERTEX_SHADER, VERT);
  const fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = Object.fromEntries(["uRes", "uPtr", "uT", "uHover"].map((n) => [n, gl.getUniformLocation(prog, n)]));

  const host = canvas.parentElement;
  const scale = lite ? 0.3 : 0.5;
  const st = { px: 0.5, py: 0.5, tx: 0.5, ty: 0.5, h: 0, th: 0, on: false, raf: 0, last: 0 };
  const draw = (now) => {
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uPtr, st.px, st.py);
    gl.uniform1f(U.uT, reducedMotion ? 4 : now / 1000);
    gl.uniform1f(U.uHover, st.h);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const resize = () => {
    const r = host.getBoundingClientRect();
    canvas.width = Math.max(2, Math.round(Math.min(r.width, 1600) * scale));
    canvas.height = Math.max(2, Math.round(Math.min(r.height, 1000) * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (reducedMotion) draw(0);
  };
  resize();
  new ResizeObserver(resize).observe(host);

  const frame = (now) => {
    st.raf = 0;
    if (!st.on) return;
    st.raf = requestAnimationFrame(frame);
    if (lite && now - st.last < 50) return;
    st.last = now;
    st.px += (st.tx - st.px) * 0.07;
    st.py += (st.ty - st.py) * 0.07;
    st.h += (st.th - st.h) * 0.06;
    draw(now);
  };
  const setOn = (on) => {
    st.on = on;
    if (on && !st.raf && !reducedMotion) st.raf = requestAnimationFrame(frame);
  };

  host.addEventListener("pointermove", (e) => {
    const r = host.getBoundingClientRect();
    st.tx = (e.clientX - r.left) / r.width;
    st.ty = 1 - (e.clientY - r.top) / r.height;
    st.th = 1;
  });
  host.addEventListener("pointerleave", () => (st.th = 0));
  new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: "100px" }).observe(host);
  return { setOn };
}
