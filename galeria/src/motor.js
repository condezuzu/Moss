// Motor WebGL2 del cielo para la galería.
// Es la referencia visual que después se pasa a Skia: cada pasada de acá tiene su par nativo
// (fondo → imagen fija de un RuntimeEffect, aurora → RuntimeEffect por cuadro a baja resolución,
// sprites y líneas → Atlas / Paths con brillo). Ver spec/plan.md, etapa 1.
// Coordenadas: "mundo" en unidades de alto de pantalla, y hacia arriba; la cámara se mueve en el
// mundo y cada capa la sigue con su propio paralaje.

const Motor = (() => {
  const ENCABEZADO = '#version 300 es\nprecision highp float;\n';

  const VS_PANTALLA = ENCABEZADO + `
layout(location = 0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const fsFondo = (comun, fondo) => ENCABEZADO + `
uniform vec2 uRes;
uniform vec2 uMundoMin;
uniform vec2 uMundoTam;
uniform float uPxPorUnidad;
uniform float uHorizonte;
uniform float uOctavas;
uniform float uCapas;
uniform float uSemilla;
out vec4 color;
${comun}
${fondo}
void main() {
  vec2 w = uMundoMin + gl_FragCoord.xy / uRes * uMundoTam;
  vec3 c = colorFondo(w, uPxPorUnidad, uHorizonte, uOctavas, uCapas, uSemilla);
  // Tramado: sin esto el degradé azul se ve en escalones en una pantalla OLED.
  c += (hash12(gl_FragCoord.xy + 0.5) - 0.5) / 255.0;
  color = vec4(c, 1.0);
}`;

  const fsAurora = (comun, aurora) => ENCABEZADO + `
uniform vec2 uRes;
uniform vec2 uCam;
uniform float uEscala;
uniform float uTiempo;
uniform float uHorizonte;
uniform float uIntensidad;
uniform float uOleada;
uniform float uCortinas;
out vec4 color;
${comun}
${aurora}
void main() {
  vec2 w = uCam + (gl_FragCoord.xy - 0.5 * uRes) / uEscala;
  color = vec4(colorAurora(w, uTiempo, uHorizonte, uIntensidad, uOleada, uCortinas), 1.0);
}`;

  const fsComponer = (comun) => ENCABEZADO + `
uniform sampler2D uFondo;
uniform sampler2D uAurora;
uniform vec2 uLienzo;
uniform vec2 uMundoMin;
uniform vec2 uMundoTam;
uniform vec2 uCamFondo;
uniform float uEscala;
uniform vec4 uOnda;
uniform float uAparicion;
out vec4 color;
${comun}
void main() {
  vec2 px = gl_FragCoord.xy;
  vec2 w = uCamFondo + (px - 0.5 * uLienzo) / uEscala;
  vec3 c = texture(uFondo, (w - uMundoMin) / uMundoTam).rgb;
  // La onda del día completo: un anillo que enciende el cielo a su paso.
  if (uOnda.w > 0.0) {
    float d = length(w - uOnda.xy);
    float anillo = exp(-pow((d - uOnda.z) / 0.07, 2.0));
    c *= 1.0 + uOnda.w * anillo * 1.8;
    c += vec3(1.0, 0.84, 0.52) * uOnda.w * anillo * 0.03;
  }
  c += texture(uAurora, px / uLienzo).rgb;
  vec2 q = px / uLienzo - 0.5;
  c *= 1.0 - 0.40 * dot(q, q);
  c *= uAparicion;
  c += (hash12(px + 0.5) - 0.5) / 255.0;
  color = vec4(c, 1.0);
}`;

  // Sprites instanciados: resplandores, estrellas, anillos, arcos y destellos en una sola pasada.
  const VS_SPRITES = ENCABEZADO + `
layout(location = 0) in vec2 aEsquina;
layout(location = 1) in vec4 aPosTam;   // xy mundo, z radio en px CSS, w paralaje
layout(location = 2) in vec4 aColor;    // rgb, intensidad
layout(location = 3) in vec4 aForma;    // x tipo, y/z parámetros, w rotación
uniform vec2 uLienzo;
uniform vec2 uCam;
uniform float uEscala;
uniform float uDpr;
out vec2 vQ;
out vec4 vColor;
out vec4 vForma;
void main() {
  vec2 centro = (aPosTam.xy - uCam * aPosTam.w) * uEscala + 0.5 * uLienzo;
  float c = cos(aForma.w);
  float s = sin(aForma.w);
  vec2 e = vec2(c * aEsquina.x - s * aEsquina.y, s * aEsquina.x + c * aEsquina.y);
  vec2 p = centro + e * aPosTam.z * uDpr;
  gl_Position = vec4(p / uLienzo * 2.0 - 1.0, 0.0, 1.0);
  vQ = aEsquina;
  vColor = aColor;
  vForma = aForma;
}`;

  const FS_SPRITES = ENCABEZADO + `
in vec2 vQ;
in vec4 vColor;
in vec4 vForma;
out vec4 color;
void main() {
  float r = length(vQ);
  float tipo = vForma.x;
  float a = 0.0;
  if (tipo < 0.5) {
    // 0: resplandor suave
    a = exp(-r * r * 5.0) * 0.9 + exp(-r * 3.2) * 0.25;
    a *= smoothstep(1.0, 0.72, r);
  } else if (tipo < 1.5) {
    // 1: estrella con destellos en cruz (y = fuerza de los brazos)
    float nucleo = exp(-r * r * 70.0) * 1.3 + exp(-r * r * 14.0) * 0.45;
    float brazos = exp(-abs(vQ.x) * 60.0) * exp(-abs(vQ.y) * 2.8) + exp(-abs(vQ.y) * 60.0) * exp(-abs(vQ.x) * 2.8);
    a = (nucleo + brazos * vForma.y) * smoothstep(1.0, 0.82, r);
  } else if (tipo < 2.5) {
    // 2: anillo (y = radio relativo, z = grosor relativo)
    a = smoothstep(vForma.z, 0.0, abs(r - vForma.y));
  } else if (tipo < 3.5) {
    // 3: arco de avance desde las doce, en sentido horario (y = radio, z = fracción)
    float ang = atan(vQ.x, vQ.y);
    float frac = (ang < 0.0 ? ang + 6.2831853 : ang) / 6.2831853;
    a = smoothstep(0.075, 0.0, abs(r - vForma.y)) * step(frac, vForma.z);
  } else {
    // 4: destello de disco
    a = smoothstep(1.0, 0.0, r);
    a *= a;
  }
  color = vec4(vColor.rgb * vColor.a * a, 0.0);
}`;

  // Segmentos con núcleo, halo y una chispa en la punta que avanza.
  const VS_LINEAS = ENCABEZADO + `
layout(location = 0) in vec2 aEsquina;  // x: 0..1 a lo largo, y: -1..1 de través
layout(location = 1) in vec4 aAB;
layout(location = 2) in vec4 aColor;
layout(location = 3) in vec4 aParam;    // x ancho px, y avance 0..1, z período punteado px (0 = lleno), w chispa
uniform vec2 uLienzo;
uniform vec2 uCam;
uniform float uEscala;
uniform float uDpr;
uniform float uParalaje;
out vec2 vL;
out float vLargo;
out vec4 vColor;
out vec4 vParam;
void main() {
  vec2 a = (aAB.xy - uCam * uParalaje) * uEscala + 0.5 * uLienzo;
  vec2 b = (aAB.zw - uCam * uParalaje) * uEscala + 0.5 * uLienzo;
  vec2 d = b - a;
  float largo = max(length(d), 0.001);
  vec2 t = d / largo;
  vec2 n = vec2(-t.y, t.x);
  float ancho = aParam.x * uDpr;
  float margen = ancho * 4.0 + 8.0 * uDpr;
  float x = mix(-margen, largo + margen, aEsquina.x);
  float y = aEsquina.y * margen;
  vec2 p = a + t * x + n * y;
  gl_Position = vec4(p / uLienzo * 2.0 - 1.0, 0.0, 1.0);
  vL = vec2(x, y);
  vLargo = largo;
  vColor = aColor;
  vParam = vec4(ancho, aParam.y, aParam.z * uDpr, aParam.w);
}`;

  const FS_LINEAS = ENCABEZADO + `
in vec2 vL;
in float vLargo;
in vec4 vColor;
in vec4 vParam;
out vec4 color;
void main() {
  float fin = vLargo * vParam.y;
  if (fin <= 0.01) discard;
  float ancho = vParam.x;
  float x = clamp(vL.x, 0.0, fin);
  float d = length(vec2(vL.x - x, vL.y));
  float a = smoothstep(ancho * 0.5 + 1.0, ancho * 0.5 - 0.5, d) + exp(-d / (ancho * 2.2)) * 0.45;
  if (vParam.z > 0.0) {
    a *= step(fract(vL.x / vParam.z), 0.38);
  }
  float dc = length(vec2(vL.x - fin, vL.y));
  a += vParam.w * exp(-dc * dc / (40.0 + ancho * ancho * 8.0)) * 1.6;
  color = vec4(vColor.rgb * vColor.a * a, 0.0);
}`;

  const VS_MUSGO = ENCABEZADO + `
layout(location = 0) in vec2 aPos;
layout(location = 1) in float aBajo;
uniform vec2 uLienzo;
uniform vec2 uCam;
uniform float uEscala;
uniform float uParalaje;
out vec2 vMundo;
out float vBajo;
void main() {
  vec2 p = (aPos - uCam * uParalaje) * uEscala + 0.5 * uLienzo;
  gl_Position = vec4(p / uLienzo * 2.0 - 1.0, 0.0, 1.0);
  vMundo = aPos;
  vBajo = aBajo;
}`;

  const fsMusgo = (comun) => ENCABEZADO + `
in vec2 vMundo;
in float vBajo;
uniform float uFranja;
uniform vec3 uCuerpo;
uniform vec3 uBorde;
uniform float uLuz;
out vec4 color;
${comun}
void main() {
  // La franja de arriba suaviza la silueta: el borde de la malla no tiene antialiasing.
  float alfa = smoothstep(-uFranja, uFranja * 0.35, vBajo);
  float b = max(vBajo, 0.0);
  float textura = ruido(vMundo * 260.0) * 0.55 + ruido(vMundo * 70.0) * 0.45;
  vec3 c = uCuerpo * (0.70 + 0.60 * textura);
  c += uBorde * exp(-b / 0.0055) * uLuz * (0.45 + 0.55 * textura);
  c *= 1.0 - 0.55 * smoothstep(0.0, 0.22, b);
  color = vec4(c * alfa, alfa);
}`;

  function compilar(gl, tipo, fuente) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      throw new Error('No compiló un shader: ' + log);
    }
    return s;
  }

  function programa(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compilar(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compilar(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('No enlazó un programa: ' + gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      u[info.name] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  }

  function crearDestino(gl, ancho, alto) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, ancho, alto, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fb, ancho, alto };
  }

  function borrarDestino(gl, d) {
    if (!d) return;
    gl.deleteTexture(d.tex);
    gl.deleteFramebuffer(d.fb);
  }

  // Un VAO con un cuadrado fijo + un buffer por instancia de tres vec4 (posiciones 1, 2 y 3).
  function crearInstanciado(gl, esquinas, capacidad) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(esquinas), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const inst = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, inst);
    gl.bufferData(gl.ARRAY_BUFFER, capacidad * 48, gl.DYNAMIC_DRAW);
    for (let i = 0; i < 3; i++) {
      gl.enableVertexAttribArray(1 + i);
      gl.vertexAttribPointer(1 + i, 4, gl.FLOAT, false, 48, i * 16);
      gl.vertexAttribDivisor(1 + i, 1);
    }
    gl.bindVertexArray(null);
    return { vao, inst, capacidad };
  }

  function crear(lienzo, fuentes) {
    const gl = lienzo.getContext('webgl2', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('Este navegador no tiene WebGL2.');

    const prog = {
      fondo: programa(gl, VS_PANTALLA, fsFondo(fuentes.comun, fuentes.fondo)),
      aurora: programa(gl, VS_PANTALLA, fsAurora(fuentes.comun, fuentes.aurora)),
      componer: programa(gl, VS_PANTALLA, fsComponer(fuentes.comun)),
      sprites: programa(gl, VS_SPRITES, FS_SPRITES),
      lineas: programa(gl, VS_LINEAS, FS_LINEAS),
      musgo: programa(gl, VS_MUSGO, fsMusgo(fuentes.comun)),
    };

    const vaoPantalla = gl.createVertexArray();
    gl.bindVertexArray(vaoPantalla);
    const bufPantalla = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufPantalla);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const sprites = crearInstanciado(gl, [-1, -1, 1, -1, -1, 1, 1, 1], 6000);
    const lineas = crearInstanciado(gl, [0, -1, 1, -1, 0, 1, 1, 1], 1200);

    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const estado = {
      ancho: 1, alto: 1, dpr: 1,
      fondo: null, aurora: null,
      fondoCfg: null, franjaSiguiente: 0, franjas: 1,
    };

    function redimensionar(anchoPx, altoPx, dpr) {
      estado.ancho = Math.max(1, Math.round(anchoPx));
      estado.alto = Math.max(1, Math.round(altoPx));
      estado.dpr = dpr;
      lienzo.width = estado.ancho;
      lienzo.height = estado.alto;
    }

    // El fondo se arma por franjas a lo largo de varios cuadros: un solo dibujo enorme en un
    // teléfono puede tardar tanto que el sistema mata el contexto, y además congela la página.
    function prepararFondo(cfg) {
      borrarDestino(gl, estado.fondo);
      let escalaTex = cfg.escala;
      const altoTex = cfg.mundoTam[1] * escalaTex;
      const anchoTex = cfg.mundoTam[0] * escalaTex;
      const ajuste = Math.min(1, (maxTex - 2) / Math.max(altoTex, anchoTex));
      escalaTex *= ajuste;
      const w = Math.ceil(cfg.mundoTam[0] * escalaTex);
      const h = Math.ceil(cfg.mundoTam[1] * escalaTex);
      estado.fondo = crearDestino(gl, w, h);
      estado.fondoCfg = Object.assign({}, cfg, { pxPorUnidad: escalaTex });
      estado.franjas = Math.max(4, Math.ceil(h / 220));
      estado.franjaSiguiente = 0;
    }

    function avanzarFondo(cuantas) {
      const f = estado.fondo;
      const cfg = estado.fondoCfg;
      if (!f || estado.franjaSiguiente >= estado.franjas) return true;
      const p = prog.fondo;
      gl.bindFramebuffer(gl.FRAMEBUFFER, f.fb);
      gl.viewport(0, 0, f.ancho, f.alto);
      gl.useProgram(p.p);
      gl.uniform2f(p.u.uRes, f.ancho, f.alto);
      gl.uniform2f(p.u.uMundoMin, cfg.mundoMin[0], cfg.mundoMin[1]);
      gl.uniform2f(p.u.uMundoTam, cfg.mundoTam[0], cfg.mundoTam[1]);
      gl.uniform1f(p.u.uPxPorUnidad, cfg.pxPorUnidad);
      gl.uniform1f(p.u.uHorizonte, cfg.horizonte);
      gl.uniform1f(p.u.uOctavas, cfg.octavas);
      gl.uniform1f(p.u.uCapas, cfg.capas);
      gl.uniform1f(p.u.uSemilla, cfg.semilla);
      gl.enable(gl.SCISSOR_TEST);
      gl.disable(gl.BLEND);
      gl.bindVertexArray(vaoPantalla);
      const altoFranja = Math.ceil(f.alto / estado.franjas);
      for (let i = 0; i < cuantas && estado.franjaSiguiente < estado.franjas; i++) {
        gl.scissor(0, estado.franjaSiguiente * altoFranja, f.ancho, altoFranja);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        estado.franjaSiguiente++;
      }
      gl.disable(gl.SCISSOR_TEST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return estado.franjaSiguiente >= estado.franjas;
    }

    function pasadaAurora(cfg) {
      const w = Math.max(16, Math.round(estado.ancho * cfg.resolucion));
      const h = Math.max(16, Math.round(estado.alto * cfg.resolucion));
      if (!estado.aurora || estado.aurora.ancho !== w || estado.aurora.alto !== h) {
        borrarDestino(gl, estado.aurora);
        estado.aurora = crearDestino(gl, w, h);
      }
      if (cfg.saltar) return;
      const p = prog.aurora;
      gl.bindFramebuffer(gl.FRAMEBUFFER, estado.aurora.fb);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.BLEND);
      gl.useProgram(p.p);
      gl.uniform2f(p.u.uRes, w, h);
      gl.uniform2f(p.u.uCam, cfg.cam[0], cfg.cam[1]);
      gl.uniform1f(p.u.uEscala, cfg.escala * cfg.resolucion);
      gl.uniform1f(p.u.uTiempo, cfg.tiempo);
      gl.uniform1f(p.u.uHorizonte, cfg.horizonte);
      gl.uniform1f(p.u.uIntensidad, cfg.intensidad);
      gl.uniform1f(p.u.uOleada, cfg.oleada);
      gl.uniform1f(p.u.uCortinas, cfg.cortinas);
      gl.bindVertexArray(vaoPantalla);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    function componer(cfg) {
      if (!estado.fondo || !estado.aurora) return;
      const p = prog.componer;
      const f = estado.fondoCfg;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, estado.ancho, estado.alto);
      gl.disable(gl.BLEND);
      gl.useProgram(p.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, estado.fondo.tex);
      gl.uniform1i(p.u.uFondo, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, estado.aurora.tex);
      gl.uniform1i(p.u.uAurora, 1);
      gl.uniform2f(p.u.uLienzo, estado.ancho, estado.alto);
      gl.uniform2f(p.u.uMundoMin, f.mundoMin[0], f.mundoMin[1]);
      gl.uniform2f(p.u.uMundoTam, f.mundoTam[0], f.mundoTam[1]);
      gl.uniform2f(p.u.uCamFondo, cfg.camFondo[0], cfg.camFondo[1]);
      gl.uniform1f(p.u.uEscala, cfg.escala);
      gl.uniform4f(p.u.uOnda, cfg.onda[0], cfg.onda[1], cfg.onda[2], cfg.onda[3]);
      gl.uniform1f(p.u.uAparicion, cfg.aparicion);
      gl.bindVertexArray(vaoPantalla);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function aditivo() {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
    }

    function dibujarSprites(datos, n, cam, escala) {
      if (n <= 0) return;
      n = Math.min(n, sprites.capacidad);
      const p = prog.sprites;
      aditivo();
      gl.useProgram(p.p);
      gl.uniform2f(p.u.uLienzo, estado.ancho, estado.alto);
      gl.uniform2f(p.u.uCam, cam[0], cam[1]);
      gl.uniform1f(p.u.uEscala, escala);
      gl.uniform1f(p.u.uDpr, estado.dpr);
      gl.bindVertexArray(sprites.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, sprites.inst);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, datos, 0, n * 12);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
    }

    function dibujarLineas(datos, n, cam, escala, paralaje) {
      if (n <= 0) return;
      n = Math.min(n, lineas.capacidad);
      const p = prog.lineas;
      aditivo();
      gl.useProgram(p.p);
      gl.uniform2f(p.u.uLienzo, estado.ancho, estado.alto);
      gl.uniform2f(p.u.uCam, cam[0], cam[1]);
      gl.uniform1f(p.u.uEscala, escala);
      gl.uniform1f(p.u.uDpr, estado.dpr);
      gl.uniform1f(p.u.uParalaje, paralaje);
      gl.bindVertexArray(lineas.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, lineas.inst);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, datos, 0, n * 12);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
    }

    // Cada loma de musgo es una malla fija (x, y, distancia bajo el borde).
    function crearLoma(vertices) {
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 12, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 12, 8);
      gl.bindVertexArray(null);
      return { vao, buf, n: vertices.length / 3 };
    }

    function borrarLoma(l) {
      if (!l) return;
      gl.deleteVertexArray(l.vao);
      gl.deleteBuffer(l.buf);
    }

    function dibujarLoma(loma, cfg) {
      const p = prog.musgo;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(p.p);
      gl.uniform2f(p.u.uLienzo, estado.ancho, estado.alto);
      gl.uniform2f(p.u.uCam, cfg.cam[0], cfg.cam[1]);
      gl.uniform1f(p.u.uEscala, cfg.escala);
      gl.uniform1f(p.u.uParalaje, cfg.paralaje);
      gl.uniform1f(p.u.uFranja, cfg.franja);
      gl.uniform3f(p.u.uCuerpo, cfg.cuerpo[0], cfg.cuerpo[1], cfg.cuerpo[2]);
      gl.uniform3f(p.u.uBorde, cfg.borde[0], cfg.borde[1], cfg.borde[2]);
      gl.uniform1f(p.u.uLuz, cfg.luz);
      gl.bindVertexArray(loma.vao);
      gl.drawArrays(gl.TRIANGLES, 0, loma.n);
    }

    return {
      gl,
      estado,
      redimensionar,
      prepararFondo,
      avanzarFondo,
      pasadaAurora,
      componer,
      dibujarSprites,
      dibujarLineas,
      crearLoma,
      borrarLoma,
      dibujarLoma,
    };
  }

  return { crear };
})();
