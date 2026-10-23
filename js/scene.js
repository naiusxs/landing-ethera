// ETHERA · escena de micelio / red neuronal (Three.js, un solo canvas fijo)
// API: createScene(canvas, {lite, reducedMotion}) -> {setProgress, setAccent, setPointer, setOffset, setActive, pulse, dispose} | null
import * as THREE from "three";

const PER_SHAPE_POINT_GAIN = [0.7, 0.7, 0.63, 0.7, 0.6];
const PER_SHAPE_LINE_GAIN = [0.62, 0.62, 0.52, 0.62, 0.62];

/* ------------------------------------------------------------------ */
/*  Utilidades de generación (solo en el arranque, pueden alocar)      */
/* ------------------------------------------------------------------ */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const vlen = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function makeGen(seed) {
  const r = mulberry32(seed);
  const g = () => (r() + r() + r() - 1.5) * 2;
  const dir = () => { const z = r() * 2 - 1, a = r() * 6.2832, s = Math.sqrt(1 - z * z); return [s * Math.cos(a), s * Math.sin(a), z]; };
  // gira `d` un ángulo `ang` hacia una dirección perpendicular aleatoria
  const perturb = (d, ang) => {
    const p = norm(cross(d, dir()));
    return norm(add(mul(d, Math.cos(ang)), mul(p, Math.sin(ang))));
  };
  return { r, g, dir, perturb };
}

// Arco sobre un elipsoide (superficie o interior) con ondulación: base de cerebro / globo
function surfaceArc(G, center, radii, opts) {
  const { r, dir, perturb } = G;
  const a = dir();
  const b = perturb(a, 0.5 + r() * 1.5);
  const seg = opts.seg || 14;
  const ph = r() * 6.28, wob = opts.wob ?? 0.12, rho = opts.rho ?? 1, gy = opts.gyri ?? 0;
  const side = norm(cross(a, b));
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    let d = norm(add(mul(a, 1 - u), mul(b, u)));
    d = norm(add(d, mul(side, Math.sin(u * 9 + ph) * wob)));
    const k = rho * (1 + gy * Math.sin(d[0] * 7 + ph) * Math.sin(d[1] * 6 + d[2] * 5));
    pts.push([center[0] + d[0] * radii[0] * k, center[1] + d[1] * radii[1] * k, center[2] + d[2] * radii[2] * k]);
  }
  return pts;
}

/* --- Forma 0: micelio disperso (hero) --- */
function genMicelio(k) {
  const G = makeGen(11), { r, g, dir, perturb } = G;
  const polys = [];
  const box = [8.8, 4.8, 3.6];
  const step = 0.3;
  function walk(p, d, steps, depth) {
    const pts = [p];
    let tv = [0, 0, 0];
    for (let i = 0; i < steps; i++) {
      tv = [tv[0] * 0.86 + g() * 0.05, tv[1] * 0.86 + g() * 0.05, tv[2] * 0.86 + g() * 0.04];
      d = norm(add(d, tv));
      for (let a = 0; a < 3; a++) if (Math.abs(p[a]) > box[a]) d[a] -= Math.sign(p[a]) * 0.22;
      d = norm(d);
      p = add(p, mul(d, step));
      pts.push(p);
      if (depth < 3 && r() < 0.065) walk(p, perturb(d, 0.7 + r() * 0.7), Math.floor(steps * (0.3 + r() * 0.3)), depth + 1);
    }
    polys.push({ pts, w: 1 - depth * 0.12 });
  }
  const roots = Math.round(34 * Math.max(k, 0.55));
  for (let i = 0; i < roots; i++) {
    const p = [(r() * 2 - 1) * box[0], (r() * 2 - 1) * box[1], (r() * 2 - 1) * box[2]];
    walk(p, dir(), 46 + Math.floor(r() * 30), 0);
  }
  return { polys, link: [0.5, 0.45] };
}

/* --- Forma 1: Melena de León --- */
function genMelena(k) {
  const G = makeGen(23), { r, g, dir } = G;
  const polys = [];
  const C = [0, 1.15, 0], R = [2.0, 1.75, 2.0];
  // masa globular: arcos sobre y dentro del elipsoide
  const nGlobe = Math.round(90 * k + 30);
  for (let i = 0; i < nGlobe; i++) {
    polys.push({ pts: surfaceArc(G, C, R, { seg: 10, wob: 0.2, rho: i % 3 ? 1 : 0.55 + r() * 0.35, gyri: 0.05 }), w: 0.8 });
  }
  // dientes: brotan de toda la masa, salen hacia fuera y caen por gravedad
  const nSpines = Math.round(700 * k + 60);
  let made = 0, guard = 0;
  while (made < nSpines && guard++ < nSpines * 20) {
    const d = dir();
    if (d[1] > 0.8) continue;
    const down = Math.max(0, 0.6 - d[1]); // más largos hacia abajo
    const len = 0.85 + r() * 0.8 + down * 0.55;
    const sx = C[0] + d[0] * R[0] * 0.96, sy = C[1] + d[1] * R[1] * 0.96, sz = C[2] + d[2] * R[2] * 0.96;
    const pts = [];
    const sway = (r() - 0.5) * 0.35;
    for (let i = 0; i <= 6; i++) {
      const u = i / 6, o = len * 0.4 * (1 - (1 - u) * (1 - u));
      pts.push([sx + d[0] * o + sway * u * u, sy + d[1] * o - len * Math.pow(u, 1.5), sz + d[2] * o]);
    }
    polys.push({ pts, w: 1 });
    made++;
  }
  return { polys, link: [0.3, 0.04] };
}

/* --- Forma 2: membrana (barrera hematoencefálica) con hifas que la cruzan --- */
function genMembrana(k) {
  const G = makeGen(37), { r, g } = G;
  const polys = [];
  const ca = Math.cos(1.15), sa = Math.sin(1.15);
  const U = 4.2, Vh = 3.3;
  const hgt = (u, v) => 0.75 * Math.sin(0.7 * u + 0.5 * v) + 0.45 * Math.sin(1.3 * v - 0.4 * u + 1.0) + 0.16 * Math.sin(2.4 * u + 1.7 * v);
  // sistema local (u,v,h) -> mundo (lámina inclinada hacia el fondo)
  const cy = Math.cos(0.5), sy = Math.sin(0.5);
  const toW = (u, v, h) => { const y = v * sa + h * ca, z = -v * ca + h * sa; return [u * cy + z * sy, y, -u * sy + z * cy]; };
  const rows = Math.round(44 * Math.max(k, 0.6));
  for (let i = 0; i < rows; i++) {
    const v = -Vh + (i / (rows - 1)) * 2 * Vh;
    const pts = [];
    for (let j = 0; j <= 70; j++) { const u = -U + (j / 70) * 2 * U; pts.push(toW(u, v, hgt(u, v))); }
    polys.push({ pts, w: 1 });
  }
  // hifas que atraviesan la lámina de lado a lado
  const nX = Math.round(150 * k + 24);
  for (let i = 0; i < nX; i++) {
    const u0 = (r() * 2 - 1) * U * 0.9, v0 = (r() * 2 - 1) * Vh * 0.85;
    const dx = g() * 0.5, dv = g() * 0.5;
    const pts = [];
    const h0 = -1.7 - r() * 0.6, h1 = 1.6 + r() * 0.7;
    for (let j = 0; j <= 9; j++) {
      const t = j / 9;
      const u = u0 + dx * t + Math.sin(t * 7 + i) * 0.1;
      const v = v0 + dv * t + Math.cos(t * 6 + i) * 0.1;
      pts.push(toW(u, v, hgt(u0, v0) + h0 + (h1 - h0) * t));
    }
    polys.push({ pts, w: 1.1 });
  }
  return { polys, link: [0.22, 0.55] };
}

/* --- Forma 3: neurona (soma + dendritas + axón), L-system determinista --- */
function genNeurona(k) {
  const G = makeGen(59), { r, g, dir, perturb } = G;
  const polys = [];
  const soma = [-0.4, 0.7, 0];
  // soma: ovillo de arcos cortos
  for (let i = 0; i < Math.round(34 * Math.max(k, 0.6)); i++) {
    polys.push({ pts: surfaceArc(G, soma, [0.75, 0.7, 0.7], { seg: 6, wob: 0.3, rho: 0.75 + r() * 0.3 }), w: 1.9 });
  }
  const maxDepth = 5;
  function branch(p, d, len, depth, w) {
    const n = 6;
    const pts = [p];
    let cur = p, dd = d;
    for (let i = 0; i < n; i++) {
      dd = perturb(dd, 0.16);
      cur = add(cur, mul(dd, len / n));
      pts.push(cur);
    }
    polys.push({ pts, w: Math.max(0.35, w) });
    if (depth >= maxDepth) return;
    const kids = depth < 2 ? 2 + (r() < 0.35 ? 1 : 0) : 2;
    for (let c = 0; c < kids; c++) branch(cur, perturb(dd, 0.45 + r() * 0.45), len * (0.76 + r() * 0.06), depth + 1, w - 0.14);
  }
  const prim = 9;
  for (let i = 0; i < prim; i++) {
    let d = dir();
    d[0] = d[0] * 0.9 - 0.15; // dendritas hacia atrás/lados
    d = norm(d);
    const p = add(soma, mul(d, 0.65));
    branch(p, d, 1.0 + r() * 0.2, 0, 1.4);
  }
  // axón: largo, con colaterales y arborización terminal
  let p = add(soma, [0.55, -0.5, 0]), d = norm([0.8, -0.5, 0.1]);
  const axon = [p];
  const bumps = [];
  for (let i = 0; i < 28; i++) {
    d = perturb(d, 0.07); d = norm(add(d, [0.01, 0.006, 0]));
    p = add(p, mul(d, 0.14));
    axon.push(p);
    if (i === 10 || i === 17 || i === 24) bumps.push([p, d]);
  }
  polys.push({ pts: axon, w: 2.4 });
  const tw = (pp, dd, len, depth) => {
    const pts = [pp]; let c = pp, q = dd;
    for (let i = 0; i < 5; i++) { q = perturb(q, 0.2); c = add(c, mul(q, len / 5)); pts.push(c); }
    polys.push({ pts, w: 1.2 });
    if (depth < 3) { tw(c, perturb(q, 0.5), len * 0.75, depth + 1); tw(c, perturb(q, -0.5), len * 0.75, depth + 1); }
  };
  bumps.forEach(([bp, bd]) => { const s = r() < 0.5 ? 1 : -1; tw(bp, perturb(bd, 0.9 * s), 0.7, 1); });
  tw(p, d, 0.7, 0); tw(p, perturb(d, 0.6), 0.7, 1); tw(p, perturb(d, -0.6), 0.7, 1);
  return { polys, link: [0.16, 0.1] };
}

/* --- Forma 4: red densa, dos lóbulos de cerebro estilizado --- */
function genRed(k) {
  const G = makeGen(71), { r, g } = G;
  const polys = [];
  const lobes = [[-1.9, 0.3, 0], [1.9, 0.3, 0]];
  const R = [2.0, 1.95, 2.1];
  const nSurf = Math.round(210 * k + 40), nIn = Math.round(110 * k + 24), nBr = Math.round(60 * k + 12);
  lobes.forEach((c) => {
    for (let i = 0; i < nSurf; i++) polys.push({ pts: surfaceArc(G, c, R, { seg: 16, wob: 0.18, rho: 1, gyri: 0.2 }), w: 1.1 });
    for (let i = 0; i < nIn; i++) polys.push({ pts: surfaceArc(G, c, R, { seg: 12, wob: 0.25, rho: 0.3 + r() * 0.55, gyri: 0.08 }), w: 0.9 });
  });
  // comisura entre lóbulos
  for (let i = 0; i < nBr; i++) {
    const a = [lobes[0][0] + (r() - 0.2) * 1.6, 0.35 + g() * 1.0, g() * 1.0];
    const b = [lobes[1][0] - (r() - 0.2) * 1.6, 0.35 + g() * 1.0, g() * 1.0];
    const pts = [];
    for (let j = 0; j <= 8; j++) { const t = j / 8; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + Math.sin(t * 3.14) * 0.5, a[2] + (b[2] - a[2]) * t]); }
    polys.push({ pts, w: 1.1 });
  }
  // tronco / cerebelo
  for (let i = 0; i < Math.round(36 * k + 8); i++) {
    polys.push({ pts: surfaceArc(G, [0, -2.1, -0.4], [1.2, 0.75, 0.9], { seg: 8, wob: 0.2, rho: 0.9, gyri: 0.1 }), w: 0.9 });
  }
  return { polys, link: [0.36, 0.7] };
}

/* ------------------------------------------------------------------ */
/*  Remuestreo de polilíneas a exactamente N nodos                      */
/* ------------------------------------------------------------------ */
const PERIOD = 34; // longitud del paquete de señal en nodos (debe coincidir con el shader)

function resample(polys, N, rng) {
  const lens = polys.map((p) => {
    let L = 0;
    for (let i = 1; i < p.pts.length; i++) L += vlen([p.pts[i][0] - p.pts[i - 1][0], p.pts[i][1] - p.pts[i - 1][1], p.pts[i][2] - p.pts[i - 1][2]]);
    return Math.max(L, 1e-3) * p.w;
  });
  const total = lens.reduce((a, b) => a + b, 0);
  const counts = lens.map((l) => Math.max(2, Math.round((l / total) * N)));
  let sum = counts.reduce((a, b) => a + b, 0);
  // ajuste fino hasta N exacto
  let guard = 0;
  while (sum !== N && guard++ < N * 4) {
    const i = guard % counts.length;
    if (sum < N) { counts[i]++; sum++; } else if (counts[i] > 2) { counts[i]--; sum--; }
  }
  const pos = new Float32Array(N * 3), next = new Int32Array(N), J = new Float32Array(N), strand = new Int32Array(N);
  let n = 0;
  polys.forEach((p, pi) => {
    const pts = p.pts, c = counts[pi];
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const L = cum[cum.length - 1] || 1e-3;
    const off = rng() * PERIOD;
    let seg = 0;
    for (let m = 0; m < c; m++) {
      const s = (m / (c - 1)) * L;
      while (seg < pts.length - 2 && cum[seg + 1] < s) seg++;
      const t = Math.min(1, Math.max(0, (s - cum[seg]) / ((cum[seg + 1] - cum[seg]) || 1e-3)));
      const a = pts[seg], b = pts[seg + 1];
      pos[n * 3] = a[0] + (b[0] - a[0]) * t;
      pos[n * 3 + 1] = a[1] + (b[1] - a[1]) * t;
      pos[n * 3 + 2] = a[2] + (b[2] - a[2]) * t;
      next[n] = m < c - 1 ? n + 1 : n;
      J[n] = m + off;
      strand[n] = pi;
      n++;
    }
  });
  return { pos, next, J, strand };
}

// Enlace de anastomosis: cada nodo se une (con prob.) a su vecino más cercano de otra hifa
function linkNearest(pos, strand, N, maxD, prob, rng) {
  const link = new Int32Array(N);
  const cs = maxD;
  const key = (x, y, z) => ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512);
  const grid = new Map();
  for (let i = 0; i < N; i++) {
    const kk = key(Math.floor(pos[i * 3] / cs), Math.floor(pos[i * 3 + 1] / cs), Math.floor(pos[i * 3 + 2] / cs));
    let a = grid.get(kk);
    if (!a) grid.set(kk, (a = []));
    a.push(i);
  }
  const md2 = maxD * maxD;
  for (let i = 0; i < N; i++) {
    link[i] = i;
    if (rng() > prob) continue;
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const cx = Math.floor(x / cs), cy = Math.floor(y / cs), cz = Math.floor(z / cs);
    let best = -1, bd = md2;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const a = grid.get(key(cx + dx, cy + dy, cz + dz));
      if (!a) continue;
      for (let q = 0; q < a.length; q++) {
        const j = a[q];
        if (strand[j] === strand[i]) continue;
        const ex = pos[j * 3] - x, ey = pos[j * 3 + 1] - y, ez = pos[j * 3 + 2] - z;
        const d2 = ex * ex + ey * ey + ez * ez;
        if (d2 < bd) { bd = d2; best = j; }
      }
    }
    if (best >= 0) link[i] = best;
  }
  return link;
}

/* ------------------------------------------------------------------ */
/*  Shaders                                                             */
/* ------------------------------------------------------------------ */
const VERT = /* glsl */ `
attribute vec3 aP1; attribute vec3 aP2; attribute vec3 aP3; attribute vec3 aP4;
attribute vec4 aJ;  attribute vec2 aM;   // aM.x = J de la forma 4, aM.y = semilla
uniform vec4 uWa; uniform float uWb;
uniform float uTime, uClock, uMotion, uMorph, uDpr, uSize, uPtrAmp, uPulse, uGain;
uniform vec2 uPtr;
uniform vec4 uRip[4];
uniform vec3 uAccent, uMari, uAzur;
varying vec3 vCol; varying float vA;
float hash(float n){ return fract(sin(n*127.1+311.7)*43758.5453); }
void main(){
  vec3 p = position*uWa.x + aP1*uWa.y + aP2*uWa.z + aP3*uWa.w + aP4*uWb;
  float J = dot(aJ, uWa) + aM.x*uWb;
  float seed = aM.y;
  // deriva orgánica + turbulencia durante el morph
  vec3 q = p*0.4;
  vec3 n = vec3(sin(q.y*2.1+q.z*1.3+uTime*0.23), sin(q.z*1.9+q.x*1.1-uTime*0.19), sin(q.x*2.3+q.y*1.7+uTime*0.21));
  p += n*(0.13*uMotion + 0.9*uMorph);
  vec4 wp = modelMatrix*vec4(p,1.0);
  // cursor: repulsión suave + iluminación
  vec2 dl = wp.xy - uPtr;
  float d2 = dot(dl,dl);
  float g = exp(-d2*0.6)*uPtrAmp;
  wp.xy += dl/(sqrt(d2)+0.6)*g*0.5;
  wp.z += g*0.8;
  // paquetes de señal que recorren cada hifa
  float x = J/${PERIOD.toFixed(1)} - uTime*0.42;
  float cell = floor(x); float fr = x - cell;
  float on = step(hash(cell), 0.17);
  float prof = (1.0 - smoothstep(0.93,1.0,fr)) * exp(-(0.93 - min(fr,0.93))*7.0);
  float pk = on*prof*uPulse;
  float hc = hash(cell+17.0);
  vec3 pcol = hc < 0.7 ? uAccent : (hc < 0.85 ? uMari : uAzur);
  // ondas por clic
  float rip = 0.0;
  for (int i=0;i<4;i++){
    float age = uClock - uRip[i].z;
    if (age > 0.0 && age < 3.5){
      float dd = distance(wp.xyz, vec3(uRip[i].xy, 0.0));
      float e = (dd - age*5.5)/0.9;
      rip += exp(-e*e)*(1.0 - age/3.5);
    }
  }
  vec3 bone = vec3(0.945,0.933,0.902);
  vec3 col = mix(bone, pcol, clamp(pk,0.0,1.0));
  col = mix(col, uAccent, clamp(rip,0.0,1.0));
  vec3 ptc = mix(uAzur, uAccent, smoothstep(0.05,0.55,g));
  col = mix(col, ptc, clamp(g*1.1,0.0,1.0));
  float gl = clamp(pk + rip + g*0.95, 0.0, 1.0);
  vCol = col;
  vec4 mv = viewMatrix*wp;
  float depth = clamp(0.78 + wp.z*0.07, 0.35, 1.0);
  #ifdef IS_LINE
    vA = (0.15 + 0.06*seed)*depth*uGain + gl*0.5;
  #else
    vA = (0.5 + 0.25*seed)*depth*uGain + gl*0.34;
    float big = step(0.94, seed);
    float sz = uSize*(1.0 + 1.5*big)*(1.0 + gl*1.0);
    gl_PointSize = min(sz*uDpr*(12.0/-mv.z), 14.0*uDpr);
  #endif
  gl_Position = projectionMatrix*mv;
}`;

const FRAG_POINTS = /* glsl */ `
varying vec3 vCol; varying float vA;
void main(){
  float d = length(gl_PointCoord-0.5)*2.0;
  if (d>1.0) discard;
  float a = 1.0 - smoothstep(0.15,1.0,d);
  gl_FragColor = vec4(vCol, vA*a);
}`;
const FRAG_LINES = /* glsl */ `
varying vec3 vCol; varying float vA;
void main(){ gl_FragColor = vec4(vCol, vA); }`;

/* ------------------------------------------------------------------ */
/*  createScene                                                         */
/* ------------------------------------------------------------------ */
export function createScene(canvas, opts = {}) {
  const lite = !!opts.lite;
  const reduced = !!opts.reducedMotion;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !lite, powerPreference: "high-performance" });
    if (!renderer.getContext()) throw new Error("no gl");
  } catch (e) {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  let maxDpr = lite ? 1 : 1.75;

  const N = lite ? 2200 : 7000;
  const k = N / 7000;
  const rng = mulberry32(5);

  /* --- datos por forma --- */
  const gens = [genMicelio, genMelena, genMembrana, genNeurona, genRed];
  const shapes = gens.map((gen) => {
    const { polys, link: lk } = gen(k);
    const s = resample(polys, N, rng);
    s.link = lite ? null : linkNearest(s.pos, s.strand, N, lk[0], lk[1], rng);
    return s;
  });
  const seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) seeds[i] = rng();

  /* --- geometría de nodos --- */
  const pGeo = new THREE.BufferGeometry();
  const pAttrNames = ["position", "aP1", "aP2", "aP3", "aP4"];
  shapes.forEach((s, i) => pGeo.setAttribute(pAttrNames[i], new THREE.BufferAttribute(s.pos, 3)));
  const aJ = new Float32Array(N * 4), aM = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    for (let s = 0; s < 4; s++) aJ[i * 4 + s] = shapes[s].J[i];
    aM[i * 2] = shapes[4].J[i]; aM[i * 2 + 1] = seeds[i];
  }
  pGeo.setAttribute("aJ", new THREE.BufferAttribute(aJ, 4));
  pGeo.setAttribute("aM", new THREE.BufferAttribute(aM, 2));

  /* --- geometría de hifas (segmentos nodo -> siguiente / enlace) --- */
  const slots = lite ? 1 : 2;
  const V = N * slots * 2;
  const lGeo = new THREE.BufferGeometry();
  const lP = shapes.map(() => new Float32Array(V * 3));
  const lJ = new Float32Array(V * 4), lM = new Float32Array(V * 2);
  {
    let v = 0;
    for (let s = 0; s < slots; s++) {
      for (let i = 0; i < N; i++) {
        for (let end = 0; end < 2; end++, v++) {
          let node0 = i;
          for (let sh = 0; sh < 5; sh++) {
            const idx = end === 0 ? i : (s === 0 ? shapes[sh].next[i] : shapes[sh].link[i]);
            const P = shapes[sh].pos;
            lP[sh][v * 3] = P[idx * 3]; lP[sh][v * 3 + 1] = P[idx * 3 + 1]; lP[sh][v * 3 + 2] = P[idx * 3 + 2];
            if (sh < 4) lJ[v * 4 + sh] = shapes[sh].J[idx]; else lM[v * 2] = shapes[4].J[idx];
            if (sh === 0) node0 = idx;
          }
          lM[v * 2 + 1] = seeds[node0];
        }
      }
    }
  }
  shapes.forEach((_, i) => lGeo.setAttribute(pAttrNames[i], new THREE.BufferAttribute(lP[i], 3)));
  lGeo.setAttribute("aJ", new THREE.BufferAttribute(lJ, 4));
  lGeo.setAttribute("aM", new THREE.BufferAttribute(lM, 2));
  // los buffers de CPU ya no hacen falta tras subirlos a la GPU
  shapes.forEach((s) => { s.link = null; });

  /* --- uniformes compartidos --- */
  const ripples = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, -100, 0));
  const uniforms = {
    uWa: { value: new THREE.Vector4(1, 0, 0, 0) }, uWb: { value: 0 },
    uTime: { value: reduced ? 4 : 0 }, uClock: { value: 0 }, uMotion: { value: reduced ? 0 : 1 }, uMorph: { value: 0 },
    uDpr: { value: 1 }, uSize: { value: 2.1 }, uPtrAmp: { value: 0 }, uPulse: { value: reduced ? 0.55 : 1 },
    uPtr: { value: new THREE.Vector2(0, 0) }, uRip: { value: ripples },
    uAccent: { value: new THREE.Vector3(0.863, 0.306, 0.533) },
    uMari: { value: new THREE.Vector3(0.89, 0.69, 0.353) },
    uAzur: { value: new THREE.Vector3(0.424, 0.576, 0.902) },
  };
  const mk = (frag, defines, gainName) => new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: frag, defines,
    uniforms: Object.assign({}, uniforms, { uGain: { value: 1 } }),
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.NormalBlending,
  });
  const pMat = mk(FRAG_POINTS, {});
  const lMat = mk(FRAG_LINES, { IS_LINE: "" });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const group = new THREE.Group();
  const points = new THREE.Points(pGeo, pMat);
  const lines = new THREE.LineSegments(lGeo, lMat);
  points.frustumCulled = false; lines.frustumCulled = false;
  group.add(lines, points);
  scene.add(group);

  /* --- estado --- */
  const tanH = Math.tan((camera.fov * Math.PI) / 360);
  let visW = 14, visH = 10;
  let progT = 0, progC = 0;
  let accTarget = [0.863, 0.306, 0.533];
  const ptrT = { x: 0, y: 0, on: 0 }, ptrC = { x: 0, y: 0 };
  let offT = 0, offC = 0;
  let active = true, disposed = false, raf = 0, last = 0, dirty = true;
  let ripIdx = 0, ripEnd = 0;
  let lowFrames = 0, avgDt = 0.016, frames = 0;
  const wv = [0, 0, 0, 0, 0];

  function resize() {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    uniforms.uDpr.value = dpr;
    const aspect = w / h;
    camera.aspect = aspect;
    // distancia para encuadrar altura útil y, en vertical (móvil), un ancho mínimo
    const d = Math.max(4.4 / tanH, 4.0 / (aspect * tanH));
    camera.position.set(0, 0, d);
    camera.updateProjectionMatrix();
    visH = 2 * d * tanH; visW = visH * aspect;
    dirty = true;
    wake();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const hex = (h) => {
    let s = String(h).trim().replace("#", "");
    if (s.length === 3) s = s.replace(/./g, "$&$&");
    const v = parseInt(s, 16);
    if (!/^[0-9a-f]{6}$/i.test(s) || Number.isNaN(v)) return null;
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
  };
  const smooth = (x) => x * x * (3 - 2 * x);

  function update(dt, now) {
    // progreso (con suavizado corto) -> pesos de forma
    const kp = 1 - Math.exp(-dt * 9);
    progC += (progT - progC) * kp;
    if (Math.abs(progT - progC) < 1e-4) progC = progT;
    const t = Math.min(4, Math.max(0, progC));
    const i = Math.min(3, Math.floor(t));
    const f = smooth(t - i);
    wv[0] = wv[1] = wv[2] = wv[3] = wv[4] = 0;
    wv[i] = 1 - f; wv[i + 1] = f;
    uniforms.uWa.value.set(wv[0], wv[1], wv[2], wv[3]);
    uniforms.uWb.value = wv[4];
    uniforms.uMorph.value = Math.sin(Math.PI * f) * (f > 0 && f < 1 ? 1 : 0);
    let pg = 0, lg = 0;
    for (let s = 0; s < 5; s++) { pg += wv[s] * PER_SHAPE_POINT_GAIN[s]; lg += wv[s] * PER_SHAPE_LINE_GAIN[s]; }
    pMat.uniforms.uGain.value = pg; lMat.uniforms.uGain.value = lg;

    // acento
    const ka = 1 - Math.exp(-dt * 4.5);
    const ac = uniforms.uAccent.value;
    ac.x += (accTarget[0] - ac.x) * ka; ac.y += (accTarget[1] - ac.y) * ka; ac.z += (accTarget[2] - ac.z) * ka;

    // cursor
    const kc = 1 - Math.exp(-dt * 6);
    ptrC.x += (ptrT.x - ptrC.x) * kc; ptrC.y += (ptrT.y - ptrC.y) * kc;
    uniforms.uPtrAmp.value += (ptrT.on - uniforms.uPtrAmp.value) * (1 - Math.exp(-dt * 5));
    uniforms.uPtr.value.set(ptrC.x * visW * 0.5, ptrC.y * visH * 0.5);

    // desplazamiento horizontal
    offC += (offT - offC) * (1 - Math.exp(-dt * 4));
    group.position.x = offC * visW;

    // tiempo y rotación suave
    if (!reduced) uniforms.uTime.value += dt;
    uniforms.uClock.value = now;
    const tt = uniforms.uTime.value;
    group.rotation.y = reduced ? 0 : Math.sin(tt * 0.07) * 0.2 + ptrC.x * 0.1;
    group.rotation.x = reduced ? 0 : Math.sin(tt * 0.05) * 0.05 - ptrC.y * 0.07;
  }

  function settled() {
    const ac = uniforms.uAccent.value;
    return progT === progC && Math.abs(offT - offC) < 1e-4 && Math.abs(ptrT.x - ptrC.x) < 1e-3 && Math.abs(ptrT.y - ptrC.y) < 1e-3
      && Math.abs(ptrT.on - uniforms.uPtrAmp.value) < 1e-3
      && Math.abs(accTarget[0] - ac.x) + Math.abs(accTarget[1] - ac.y) + Math.abs(accTarget[2] - ac.z) < 2e-3
      && uniforms.uClock.value > ripEnd;
  }

  function tick(ms) {
    raf = 0;
    if (disposed || !active || document.hidden) return;
    const now = ms * 0.001;
    const dt = Math.min(0.05, last ? now - last : 0.016);
    last = now;
    update(dt, now);
    renderer.render(scene, camera);
    // degradar DPR si el equipo no da la talla
    if (!lite && maxDpr > 1 && ++frames > 60) {
      avgDt += (dt - avgDt) * 0.05;
      lowFrames = avgDt > 0.027 ? lowFrames + 1 : 0;
      if (lowFrames > 90) { maxDpr = 1; resize(); lowFrames = 0; }
    }
    if (!reduced || !settled()) raf = requestAnimationFrame(tick);
    else last = 0;
  }
  function wake() {
    if (!raf && !disposed && active && !document.hidden) raf = requestAnimationFrame(tick);
  }
  const onVis = () => { last = 0; if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else wake(); };
  document.addEventListener("visibilitychange", onVis);
  const onLost = (e) => e.preventDefault();
  const onRestored = () => { dirty = true; wake(); };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  resize();
  wake();

  return {
    setProgress(t) { const v = Math.min(4, Math.max(0, +t || 0)); if (v !== progT) { progT = v; wake(); } },
    setAccent(h) { const c = hex(h); if (c) { accTarget = c; wake(); } },
    setPointer(nx, ny) {
      ptrT.x = Math.max(-1, Math.min(1, +nx || 0)); ptrT.y = Math.max(-1, Math.min(1, +ny || 0));
      ptrT.on = nx || ny ? (reduced ? 0 : 1) : 0;
      wake();
    },
    setOffset(x) { offT = +x || 0; wake(); },
    setActive(a) {
      active = !!a;
      if (!active) { if (raf) cancelAnimationFrame(raf); raf = 0; } else { last = 0; wake(); }
    },
    pulse(nx, ny) {
      const r = ripples[ripIdx]; ripIdx = (ripIdx + 1) % 4;
      const now = performance.now() * 0.001;
      r.set((+nx || 0) * visW * 0.5 - 0, (+ny || 0) * visH * 0.5, now, 0);
      ripEnd = now + 3.6;
      wake();
    },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      pGeo.dispose(); lGeo.dispose(); pMat.dispose(); lMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss && renderer.forceContextLoss();
    },
  };
}
