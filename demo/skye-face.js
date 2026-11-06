// Skye: a calm hologram face drawn on <canvas>. No images, no libraries.
// States: idle (slow breathing), listening (soft ripples), thinking (orbiting lights), speaking (mouth follows the voice level).
(function () {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let canvas = null, ctx = null, raf = 0, dpr = 1, size = 0;
  let mode = "idle", level = 0, target = 0;
  let blinkAt = 2500, blinkT = -1;
  const particles = [];
  const ripples = [];
  let lastRipple = 0;

  function attach(c) {
    if (!c) return;
    canvas = c; ctx = c.getContext("2d");
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function setState(s) { mode = s; if (s !== "speaking") target = 0; }
  function setLevel(v) { target = Math.max(0, Math.min(1, v)); }

  function resize() {
    const w = canvas.clientWidth;
    const r = window.devicePixelRatio || 1;
    if (w !== size || r !== dpr || canvas.width !== Math.round(w * r) || canvas.height !== Math.round(w * r)) {
      size = w; dpr = r;
      canvas.width = Math.round(w * r); canvas.height = Math.round(w * r);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const CY = "139, 233, 245";
  const rgba = a => `rgba(${CY}, ${a})`;

  function frame(now) {
    raf = 0;
    if (!canvas || !canvas.isConnected) { canvas = null; return; }
    raf = requestAnimationFrame(frame);
    if (!canvas.clientWidth) return;
    resize();
    const t = now / 1000;
    const w = size, cx = w / 2, cy = w * 0.43, R = w * 0.25;
    const breath = 1 + (reduce ? 0 : Math.sin(t * 2 * Math.PI / 5) * 0.012);
    level += (target - level) * 0.25;
    if (mode === "speaking" && target === 0 && level < 0.01) level = 0;

    ctx.clearRect(0, 0, w, w);
    ctx.save();
    ctx.globalAlpha = reduce ? 1 : 0.93 + 0.07 * Math.sin(t * 13.7) * Math.sin(t * 3.1);

    // projector base + light cone
    const by = w * 0.9;
    let g = ctx.createRadialGradient(cx, by, 0, cx, by, R * 1.1);
    g.addColorStop(0, rgba(0.55)); g.addColorStop(1, rgba(0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(cx, by, R * 1.1, R * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(0.45); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx, by, R * 0.7, R * 0.11, 0, 0, Math.PI * 2); ctx.stroke();
    g = ctx.createLinearGradient(0, by, 0, cy - R);
    g.addColorStop(0, rgba(0.16)); g.addColorStop(1, rgba(0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(cx - R * 0.7, by); ctx.lineTo(cx - R * 1.15, cy - R * 0.4); ctx.lineTo(cx + R * 1.15, cy - R * 0.4); ctx.lineTo(cx + R * 0.7, by); ctx.closePath(); ctx.fill();

    // rising particles
    if (!reduce && particles.length < 34 && Math.random() < 0.3) {
      particles.push({ x: cx + (Math.random() - 0.5) * R * 1.3, y: by, v: 0.2 + Math.random() * 0.45, life: 1 });
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.y -= p.v; p.life -= 0.004;
      if (p.life <= 0 || p.y < cy - R * 1.2) { particles.splice(i, 1); continue; }
      ctx.fillStyle = rgba(0.5 * p.life); ctx.fillRect(p.x, p.y, 1.4, 1.4);
    }

    ctx.translate(cx, cy); ctx.scale(breath, breath);

    // halo
    g = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.7);
    g.addColorStop(0, rgba(0.18)); g.addColorStop(1, rgba(0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 1.7, 0, Math.PI * 2); ctx.fill();

    // listening ripples
    if (mode === "listening" && t - lastRipple > 1.1) { ripples.push(t); lastRipple = t; }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const k = (t - ripples[i]) / 2.4;
      if (k > 1) { ripples.splice(i, 1); continue; }
      ctx.strokeStyle = rgba(0.35 * (1 - k)); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 0, R * (0.95 + k * 0.9), R * (1.15 + k * 0.9), 0, 0, Math.PI * 2); ctx.stroke();
    }

    // orbit rings
    const spin = t * (mode === "thinking" ? 0.9 : 0.18);
    [[-0.38, 1.0], [0.42, -0.7]].forEach(([tilt, dir], i) => {
      ctx.save(); ctx.rotate(tilt);
      ctx.strokeStyle = rgba(0.16); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, R * 1.42, R * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
      const a = spin * dir + i * 2;
      ctx.fillStyle = rgba(0.9); ctx.shadowColor = rgba(1); ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(Math.cos(a) * R * 1.42, Math.sin(a) * R * 0.3, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.restore();
    });

    // head: dotted contour + faint latitude lines (gives depth)
    const rx = R * 0.8, ry = R;
    ctx.strokeStyle = rgba(0.14); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    for (let k = -2; k <= 2; k++) {
      const yy = k * ry * 0.33, ww = rx * Math.sqrt(1 - (yy / ry) ** 2);
      ctx.strokeStyle = rgba(0.05);
      ctx.beginPath(); ctx.ellipse(0, yy, ww, ww * 0.16, 0, 0, Math.PI); ctx.stroke();
    }
    ctx.strokeStyle = rgba(0.06);
    ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.45, ry, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    g = ctx.createRadialGradient(-rx * 0.2, -ry * 0.25, rx * 0.1, 0, 0, ry);
    g.addColorStop(0, rgba(0.13)); g.addColorStop(1, rgba(0.02));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(0.12); ctx.lineWidth = 1;
    [-1, 1].forEach(s => {
      ctx.beginPath(); ctx.ellipse(s * rx * 0.55, ry * 0.12, rx * 0.32, ry * 0.42, s * 0.25, Math.PI * 0.15, Math.PI * 0.75); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s * R * 0.32, -R * 0.22, R * 0.17, R * 0.06, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(0, -R * 0.02); ctx.quadraticCurveTo(R * 0.035, R * 0.16, -R * 0.02, R * 0.22); ctx.stroke();
    const N = 96;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const j = 1 + Math.sin(a * 5 + t * 1.3) * 0.012;
      const tw = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7));
      ctx.fillStyle = rgba(tw);
      ctx.fillRect(Math.cos(a) * rx * j - 0.8, Math.sin(a) * ry * j - 0.8, 1.6, 1.6);
    }

    // eyes (blink every few seconds; look around while thinking)
    const ms = now;
    if (blinkT < 0 && ms > blinkAt) blinkT = ms;
    let open = 1;
    if (blinkT >= 0) {
      const k = (ms - blinkT) / 180;
      open = k < 1 ? 1 - k : k < 2 ? k - 1 : 1;
      if (k >= 2) { blinkT = -1; blinkAt = ms + 3000 + Math.random() * 4000; }
    }
    if (mode === "listening") open = Math.min(open * 1.15, 1.15);
    const look = mode === "thinking" ? Math.sin(t * 1.4) * R * 0.05 : 0;
    const lookY = mode === "thinking" ? -R * 0.03 : 0;
    // warm cheeks (a gentle smile lifts them)
    [-1, 1].forEach(s => {
      const gx = s * R * 0.46, gy = R * 0.16;
      const cg = ctx.createRadialGradient(gx, gy, 0, gx, gy, R * 0.2);
      cg.addColorStop(0, "rgba(243, 201, 143, 0.16)"); cg.addColorStop(1, "rgba(243, 201, 143, 0)");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(gx, gy, R * 0.2, 0, Math.PI * 2); ctx.fill();
    });
    // smiling eyes: soft ovals with a lifted lower lid
    ctx.shadowColor = rgba(1); ctx.shadowBlur = 16;
    [-1, 1].forEach(s => {
      const ex = s * R * 0.31 + look, ey = -R * 0.1 + lookY;
      const ew = R * 0.2, eh = Math.max(1.2, R * 0.1 * open);
      ctx.fillStyle = rgba(0.95);
      ctx.beginPath(); ctx.ellipse(ex, ey, ew / 2, eh / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(0.75); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(ex, ey + R * 0.1, ew * 0.55, R * 0.05, 0, Math.PI * 1.18, Math.PI * 1.82); ctx.stroke();
    });

    // smiling mouth: a soft upward curve; it ripples with the voice when Skye speaks
    const mw = R * 0.28, my = R * 0.34, smile = R * 0.1;
    const amp = R * (0.006 + (mode === "speaking" ? 0.08 * level : 0));
    ctx.strokeStyle = rgba(0.92); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const u = i / 48, x = -mw + u * mw * 2;
      const env = Math.sin(u * Math.PI);
      const base = my + smile * (1 - (2 * u - 1) ** 2);
      const y = base + amp * env * (Math.sin(u * 18 + t * 14) * 0.6 + Math.sin(u * 7 - t * 9) * 0.4);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    if (mode === "speaking" && level > 0.05) { // lower lip opens a little with the voice
      ctx.globalAlpha *= 0.6; ctx.beginPath();
      for (let i = 0; i <= 32; i++) { const u = i / 32, x = -mw * 0.7 + u * mw * 1.4; const y = my + smile * (1 - (2 * u - 1) ** 2) * 0.9 + R * 0.07 * level * Math.sin(u * Math.PI); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.globalAlpha /= 0.6;
    }
    ctx.shadowBlur = 0;

    // a soft halo above (calm, angel-like)
    const hy = -R * 1.2 + (reduce ? 0 : Math.sin(t * 1.2) * R * 0.02);
    ctx.strokeStyle = "rgba(243, 222, 170, 0.7)"; ctx.lineWidth = 2; ctx.shadowColor = "rgba(243, 222, 170, 0.9)"; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.ellipse(0, hy, R * 0.46, R * 0.08, 0, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;

    // thinking: three lights circling above
    if (mode === "thinking") {
      for (let i = 0; i < 3; i++) {
        const a = t * 2.4 + i * 2.094;
        ctx.fillStyle = rgba(0.85);
        ctx.beginPath(); ctx.arc(Math.cos(a) * R * 0.22, -R * 1.38 + Math.sin(a) * R * 0.06, 2.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();

    // scanlines + a slow moving scan band
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    for (let y = 0; y < w; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.globalCompositeOperation = "source-over";
    if (!reduce) {
      const sy = ((t * 40) % (w * 1.3)) - w * 0.15;
      g = ctx.createLinearGradient(0, sy - 20, 0, sy + 20);
      g.addColorStop(0, rgba(0)); g.addColorStop(0.5, rgba(0.07)); g.addColorStop(1, rgba(0));
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = g; ctx.fillRect(0, sy - 20, w, 40);
      ctx.globalCompositeOperation = "source-over";
    }
  }

  window.SkyeFace = { attach, setState, setLevel };
})();
