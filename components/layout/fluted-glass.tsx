"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/**
 * A softly lit backdrop (procedural noise) seen through reeded / fluted glass: each vertical flute
 * acts as a half-cylinder lens that squeezes and mirrors a slice of the scene. The brand logo is
 * composited mostly unrefracted on top, keeping only a light trace of the flutes (LOGO_GLASS).
 */
const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_dpr;
uniform sampler2D u_logo;
uniform float u_logoAspect;  // width / height of the logo texture
uniform float u_hasLogo;     // 0 until the logo image has loaded

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.0;
    a *= 0.5;
  }
  return v;
}

// What sits behind the glass. p.x runs 0..aspect, p.y runs 0..1 (bottom to top).
vec3 scene(vec2 p) {
  float aspect = u_resolution.x / u_resolution.y;
  float t = u_time * 0.05;

  p.x += sin(p.y * 2.3 + t * 3.0) * 0.015;                   // grass swaying
  float blades = fbm(vec2(p.x * 7.0, p.y * 0.8 - t));         // tall, soft stalks
  float fine = noise(vec2(p.x * 31.0, p.y * 1.5 + t * 1.7));  // thin stalks
  float b = clamp(blades * 1.1 + fine * 0.22 - 0.1, 0.0, 1.0);

  vec2 sunPos = vec2(aspect * (0.58 + u_pointer.x * 0.05), 0.46 - u_pointer.y * 0.06);
  vec2 d = (p - sunPos) * vec2(0.85, 1.5);
  float sun = exp(-dot(d, d) * 2.4);
  float halo = exp(-dot(d, d) * 0.4);

  vec3 deep = vec3(0.02, 0.06, 0.18);
  vec3 moss = vec3(0.07, 0.2, 0.5);
  vec3 azure = vec3(0.2, 0.42, 0.82);
  vec3 gold = vec3(0.98, 0.72, 0.12);

  vec3 col = mix(deep, moss, smoothstep(0.2, 0.7, b) * (0.45 + 0.55 * halo));
  col = mix(col, azure, smoothstep(0.45, 0.9, b) * (0.25 + 0.75 * halo));
  col += gold * sun * (0.2 + 0.8 * smoothstep(0.35, 0.85, b));
  col *= 0.72 + 0.28 * smoothstep(0.0, 0.55, p.y);            // darker near the ground
  return col;
}

// Logo colour + coverage at scene position p (same coordinate space as scene()).
vec4 logoAt(vec2 p) {
  if (u_hasLogo < 0.5) return vec4(0.0);
  float aspect = u_resolution.x / u_resolution.y;
  vec2 size = vec2(0.44 * u_logoAspect, 0.44);
  size *= min(1.0, aspect * 0.42 / size.x);
  // Anchored to the right edge (inset ≈ the header's side padding), between the actions and search.
  vec2 uv = (p - vec2(aspect - 0.1 - size.x * 0.5, 0.5)) / size + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  vec4 logo = texture2D(u_logo, uv);
  logo.a *= 0.6 + 0.4 * smoothstep(0.9, 1.6, aspect);
  return logo;
}

// How much of the glass distortion the logo keeps (0 = perfectly crisp, 1 = fully refracted).
const float LOGO_GLASS = 0.25;

void main() {
  vec2 frag = gl_FragCoord.xy;
  float fluteWidth = 13.0 * u_dpr;
  // Gently vary flute widths so the reeds read as hand-made glass rather than a uniform grille.
  float reedX = frag.x + (sin(frag.x * 0.017 / u_dpr) * 5.0 + sin(frag.x * 0.049 / u_dpr) * 2.0) * u_dpr;
  float f = fract(reedX / fluteWidth);  // 0..1 across one flute
  float s = f * 2.0 - 1.0;

  // Half-cylinder lens: light bends more toward a flute's edges. Tilting (pointer) shifts the slice.
  float bend = s * (0.6 + 0.4 * s * s);
  float strength = (2.2 + u_pointer.x * 0.6) * fluteWidth;
  vec2 p = vec2(frag.x - bend * strength, frag.y) / u_resolution.y;

  // Two offset samples give colour fringing at the flute edges and a little softness.
  float fringe = 0.003 * bend;
  vec3 a = scene(p - vec2(fringe, 0.0));
  vec3 c = scene(p + vec2(fringe, 0.0));
  vec3 col = vec3(c.r, (a.g + c.g) * 0.5, a.b);

  // Logo: mostly the crisp, unbent image with a faint refracted copy mixed in, so it stays
  // clearly legible but still reads as sitting behind the glass.
  vec4 crisp = logoAt(frag / u_resolution.y);
  vec4 bent = logoAt(p);
  vec4 logo = mix(crisp, bent, LOGO_GLASS);
  col = mix(col, logo.rgb, logo.a);
  float glass = mix(1.0, LOGO_GLASS, logo.a);  // full flute shading on the backdrop, light on the logo

  // Dark groove between flutes and a bright ridge on each one.
  float groove = smoothstep(0.0, 0.09, f) * smoothstep(1.0, 0.91, f);
  col *= mix(1.0, mix(0.7, 1.0, groove), glass);
  float ridge = pow(max(0.0, 1.0 - abs(f - 0.7) * 4.0), 3.0);
  float luma = dot(col, vec3(0.3, 0.59, 0.11));
  float sweep = exp(-pow((frag.x / u_resolution.x - 0.5 - u_pointer.x * 0.35) * 3.0, 2.0));
  col += ridge * (0.03 + 0.28 * luma + 0.06 * sweep) * glass;

  col += (hash(frag + fract(u_time) * 97.0) - 0.5) * 0.025;   // film grain, avoids banding
  gl_FragColor = vec4(col, 1.0);
}
`;

function createProgram(gl: WebGLRenderingContext) {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("[fluted-glass]", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("[fluted-glass]", gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

/**
 * WebGL fluted-glass backdrop for the hero banner. Renders into its own canvas, pauses when
 * off-screen or in a background tab, and draws a single still frame for reduced-motion users.
 * If WebGL is unavailable the canvas never appears and the CSS `.hero-bg` underneath shows instead.
 * `logoSrc` (same-origin SVG/PNG) is rasterised once and sampled as a texture inside the scene.
 */
export function FlutedGlass({ className, logoSrc }: { className?: string; logoSrc?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // A fresh canvas per mount, so Strict Mode's double effect never reuses a lost context.
    const canvas = document.createElement("canvas");
    canvas.className = "block size-full opacity-0 transition-opacity duration-700";
    host.appendChild(canvas);

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    const program = gl && createProgram(gl);
    if (!gl || !program) {
      canvas.remove();
      return;
    }

    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // One oversized triangle covers the whole viewport.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uPointer = gl.getUniformLocation(program, "u_pointer");
    const uDpr = gl.getUniformLocation(program, "u_dpr");
    const uLogoAspect = gl.getUniformLocation(program, "u_logoAspect");
    const uHasLogo = gl.getUniformLocation(program, "u_hasLogo");

    // Logo texture: starts as a 1×1 transparent pixel so the sampler is always complete.
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.uniform1i(gl.getUniformLocation(program, "u_logo"), 0);
    gl.uniform1f(uHasLogo, 0);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const start = performance.now();
    let frame = 0;
    let running = false;
    let onScreen = true;
    let lost = false;

    const resize = () => {
      // The image is soft by design, so cap the pixel ratio to keep the shader cheap.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uResolution, width, height);
      gl.uniform1f(uDpr, dpr);
    };

    const draw = (now: number) => {
      if (lost) return;
      pointer.x += (pointer.targetX - pointer.x) * 0.05;
      pointer.y += (pointer.targetY - pointer.y) * 0.05;
      gl.uniform1f(uTime, reducedMotion.matches ? 40 : (now - start) / 1000 + 40);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.style.opacity = "1";
    };

    const loop = (now: number) => {
      draw(now);
      frame = requestAnimationFrame(loop);
    };

    const sync = () => {
      const shouldRun = onScreen && !document.hidden && !reducedMotion.matches && !lost;
      if (shouldRun && !running) {
        running = true;
        frame = requestAnimationFrame(loop);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(frame);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.targetX = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      pointer.targetY = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      canvas.style.opacity = "0";
      sync();
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!running) draw(performance.now());
    });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });

    resize();
    draw(performance.now());
    resizeObserver.observe(canvas);
    visibilityObserver.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);
    canvas.addEventListener("webglcontextlost", onContextLost);
    sync();

    // Rasterise the (usually SVG) logo at a fixed height, then upload it as the texture.
    const logo = new Image();
    if (logoSrc) {
      logo.decoding = "async";
      logo.onload = () => {
        if (lost) return;
        const naturalW = logo.naturalWidth || 1024;
        const naturalH = logo.naturalHeight || 1024;
        const height = 512;
        const width = Math.min(2048, Math.max(1, Math.round((height * naturalW) / naturalH)));
        const raster = document.createElement("canvas");
        raster.width = width;
        raster.height = height;
        raster.getContext("2d")?.drawImage(logo, 0, 0, width, height);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, raster);
        gl.uniform1f(uLogoAspect, width / height);
        gl.uniform1f(uHasLogo, 1);
        if (!running) draw(performance.now());
      };
      logo.onerror = () => console.warn("[fluted-glass] could not load logo:", logoSrc);
      logo.src = logoSrc;
    }

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      logo.onload = logo.onerror = null;
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, [logoSrc]);

  return <div ref={hostRef} aria-hidden className={cn("pointer-events-none absolute inset-0", className)} />;
}
