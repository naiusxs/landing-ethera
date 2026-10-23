// Aura de color de Ethera: orbes de gradiente difuminado (universo gráfico del manual) sobre el beige base.
// WebGL puro, una sola pasada de fragment shader a baja resolución. Devuelve null si no hay WebGL.
const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uT, uScroll, uAmp; uniform vec2 uPtr;
const vec3 BG = vec3(1., .988, .941);
const vec3 CYAN = vec3(0., .635, 1.), GREEN = vec3(.545, .765, .227), YELLOW = vec3(.9, .78, 0.),
           ORANGE = vec3(1., .43, .12), PURPLE = vec3(.416, .27, .627), RED = vec3(1., .165, .04);
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec4 blob(vec2 p, vec2 c, float r, vec3 col){
  float d = length(p - c);
  float w = exp(-(d * d) / (r * r));
  return vec4(col * w, w);
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - .5) * vec2(asp, 1.);
  float t = uT * .12, s = uScroll * 6.2832;
  vec4 a = vec4(0.);
  a += blob(p, vec2(sin(t + s) * .75 * asp * .5 - .38 * asp, cos(t * 1.3 + s) * .38), .30, CYAN);
  a += blob(p, vec2(cos(t * .9 + s * 1.2) * .5 * asp * .5 - .5 * asp * .5, sin(t * 1.1 + 1.) * .42), .26, GREEN);
  a += blob(p, vec2(sin(t * .8 + 2. + s) * .4 * asp, cos(t + s * .8) * .45 - .1), .24, YELLOW);
  a += blob(p, vec2(cos(t * 1.2 + s * 1.5) * .6 * asp * .5 + .35 * asp, sin(t * .7 + s) * .4), .30, ORANGE);
  a += blob(p, vec2(sin(t * .6 + 4. + s * .7) * .5 * asp * .5 + .45 * asp * .5, cos(t * .9 + 2.) * .45), .26, PURPLE);
  a += blob(p, vec2(cos(t + 3. - s) * .55 * asp * .5 + .5 * asp * .5, sin(t * 1.4 + s * 1.3) * .4 + .1), .22, RED);
  // un orbe cálido sigue al puntero
  vec2 q = (uPtr - .5) * vec2(asp, 1.);
  a += blob(p, q, .20, mix(ORANGE, YELLOW, .5)) * .8;
  vec3 col = a.w > 0. ? a.rgb / a.w : BG;
  // más color en los bordes, el centro queda calmado para leer
  float edge = smoothstep(.12, .62, abs(p.x) / (asp * .5));
  float k = clamp(a.w, 0., 1.) * uAmp * mix(.14, .8, edge);
  vec3 outc = mix(BG, col, clamp(k, 0., .38));
  outc += (hash(gl_FragCoord.xy + uT) - .5) * .018;
  gl_FragColor = vec4(outc, 1.);
}`;

export function createScene(canvas, { lite = false, reducedMotion = false } = {}) {
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
  const u = (n) => gl.getUniformLocation(prog, n);
  const U = { res: u("uRes"), t: u("uT"), scroll: u("uScroll"), amp: u("uAmp"), ptr: u("uPtr") };

  // Resolución interna baja: el difuminado es el efecto y así cuesta casi nada
  const scale = lite ? 0.22 : 0.34;
  const resize = () => {
    canvas.width = Math.max(2, Math.round(innerWidth * scale));
    canvas.height = Math.max(2, Math.round(innerHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  addEventListener("resize", resize);

  const st = { scroll: 0, px: 0.5, py: 0.5, tx: 0.5, ty: 0.5, amp: innerWidth < 700 ? 0.26 : 0.7, active: true, raf: 0, last: 0 };
  const frame = (now) => {
    st.raf = 0;
    if (!st.active) return;
    // 30 fps en modo ligero, 60 fps si no
    if (lite && now - st.last < 33) return (st.raf = requestAnimationFrame(frame));
    st.last = now;
    st.px += (st.tx - st.px) * 0.06;
    st.py += (st.ty - st.py) * 0.06;
    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.t, reducedMotion ? 0 : now / 1000);
    gl.uniform1f(U.scroll, st.scroll);
    gl.uniform1f(U.amp, st.amp);
    gl.uniform2f(U.ptr, st.px, st.py);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reducedMotion) st.raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (!st.raf) st.raf = requestAnimationFrame(frame);
  };
  kick();

  return {
    setScroll(v) {
      st.scroll = v;
      if (reducedMotion) kick();
    },
    setPointer(x, y) {
      st.tx = x;
      st.ty = y;
    },
    setActive(on) {
      st.active = on;
      if (on) kick();
    },
  };
}
