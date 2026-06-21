/* ============================================================
   Sonidos sintetizados con Web Audio API.
   Sin archivos externos: todo se genera en el navegador.
   ============================================================ */

const Sound = (() => {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // Tono simple con envolvente.
  function tone(freq, start, duration, type = "sine", gain = 0.2) {
    const c = ensure();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + duration);
    osc.connect(g).connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + duration + 0.02);
  }

  // Ráfaga de ruido filtrado (clicks mecánicos, cajón, alimentación de papel).
  function noise(start, duration, gain, freq = 1200, q = 1) {
    const c = ensure();
    if (!c) return;
    const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * duration)), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + duration);
    src.connect(bp).connect(g).connect(c.destination);
    src.start(c.currentTime + start);
    src.stop(c.currentTime + start + duration + 0.02);
  }

  // 💰 "Ka-CHING" de caja registradora:
  //  "ka" = golpe del cajón (ruido) + "ching" = campanita brillante que resuena.
  function caching() {
    if (muted) return;
    noise(0, 0.05, 0.30, 1700, 0.8);              // "ka" — cajón
    tone(196, 0.0, 0.08, "square", 0.10);          // golpe grave del mecanismo
    tone(1318.5, 0.07, 0.5, "triangle", 0.30);     // E6  — campana
    tone(1975.5, 0.07, 0.5, "triangle", 0.18);     // B6  — armónico
    tone(2637.0, 0.085, 0.45, "sine", 0.10);       // E7  — brillo
    noise(0.07, 0.04, 0.06, 3000, 1.5);            // chispa metálica de la campana
  }

  // Sonido grave de "quitar / deshacer".
  function undo() {
    if (muted) return;
    tone(440, 0, 0.10, "sine", 0.18);
    tone(300, 0.06, 0.16, "sine", 0.18);
  }

  // ❌ Error "no te alcanza": bocinazo descendente tipo buzzer.
  function error() {
    if (muted) return;
    tone(220, 0.0,  0.18, "sawtooth", 0.18);
    tone(180, 0.16, 0.26, "sawtooth", 0.18);
    noise(0.0, 0.14, 0.05, 300, 0.7);
  }

  // 🧹 Barrido descendente al borrar todas las compras.
  function sweep() {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(900, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, c.currentTime + 0.35);
    g.gain.setValueAtTime(0.22, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4);
    osc.connect(g).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.42);
  }

  // 🖨️ Impresora: motor que zumba (saw + trémolo) con clicks de alimentación
  //    de papel y un "beep" final. Dura ~1.2 s, igual que la animación.
  function printer(duration = 1.25) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;

    // Motor / cabezal: onda diente de sierra grave modulada por un LFO.
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(78, t0);
    osc.frequency.linearRampToValueAtTime(96, t0 + duration);

    const lfo = c.createOscillator();
    lfo.type = "square";
    lfo.frequency.value = 26;                 // textura "brrrr"
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.05;

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.10, t0 + 0.05);
    g.gain.setValueAtTime(0.10, t0 + duration - 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1400;

    lfo.connect(lfoGain).connect(g.gain);
    osc.connect(lp).connect(g).connect(c.destination);
    osc.start(t0); lfo.start(t0);
    osc.stop(t0 + duration); lfo.stop(t0 + duration);

    // Clicks de alimentación del papel.
    for (let t = 0.06; t < duration - 0.12; t += 0.105) {
      noise(t, 0.018, 0.05, 2400, 1.4);
    }
    // Beep final "listo".
    tone(1568, duration + 0.02, 0.13, "square", 0.12);
  }

  // Fanfarria corta (al terminar de imprimir el recibo).
  function fanfare() {
    if (muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((f, i) => tone(f, i * 0.1, 0.25, "triangle", 0.2));
  }

  function setMuted(v) { muted = v; }
  function isMuted() { return muted; }

  return { caching, undo, error, sweep, printer, fanfare, setMuted, isMuted, ensure };
})();
