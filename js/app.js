/* ============================================================
   GASTA LA PLATA DE ELON — Lógica principal
   ============================================================ */

(() => {
  "use strict";

  // -------- Estado --------
  const ITEMS = {};                 // id -> item (lookup rápido)
  CATEGORIES.forEach(c => c.items.forEach(it => { ITEMS[it.id] = it; it.qty = 0; }));

  let netWorth = NET_WORTH;         // sube en tiempo real
  let spent = 0;                    // total gastado por el usuario
  const startTime = Date.now();

  // -------- Helpers de formato --------
  const fmtFull = n => "$" + Math.floor(n).toLocaleString("en-US");

  function fmtShort(n) {
    const abs = Math.abs(n);
    if (abs >= 1e12) return "$" + (n / 1e12).toFixed(2) + " B"; // billón (millón de millones)
    if (abs >= 1e9)  return "$" + (n / 1e9).toFixed(2) + " mil M";
    if (abs >= 1e6)  return "$" + (n / 1e6).toFixed(1) + " M";
    if (abs >= 1e3)  return "$" + (n / 1e3).toFixed(1) + " mil";
    return "$" + Math.floor(n);
  }

  // -------- Refs DOM --------
  const $ = sel => document.querySelector(sel);
  const netWorthEl = $("#netWorth");
  const spentEl = $("#spent");
  const percentEl = $("#percent");
  const progressBar = $("#progressBar");
  const rateEl = $("#rate");

  // ============================================================
  //  CONTADOR EN TIEMPO REAL (la fortuna nunca para de subir)
  // ============================================================
  let displayedNet = netWorth;
  function tickFortune() {
    const elapsed = (Date.now() - startTime) / 1000; // segundos
    // Fortuna BRUTA: nunca para de subir.
    netWorth = NET_WORTH + elapsed * EARN_PER_SECOND;
    // Contador OFICIAL = fortuna bruta menos lo que ya gastaste.
    // Al comprar baja de golpe... pero como sigue subiendo, lo barato
    // ni se nota; solo lo MUY caro deja una mella visible.
    const official = netWorth - spent;
    // suavizado: deja ver la "caída" en compras grandes y el repunte.
    displayedNet += (official - displayedNet) * 0.18;
    netWorthEl.textContent = fmtFull(displayedNet);
    requestAnimationFrame(tickFortune);
  }

  // ============================================================
  //  ACTUALIZAR "GASTADO" Y BARRA
  // ============================================================
  function updateSpent(pulse) {
    spentEl.textContent = fmtFull(spent);
    const pct = (spent / netWorth) * 100;
    percentEl.textContent = (pct < 0.01 && spent > 0 ? "menos de 0.01" : pct.toFixed(pct < 1 ? 3 : 1)) + "% de su fortuna";
    progressBar.style.width = Math.min(pct, 100) + "%";
    if (pulse) {
      spentEl.classList.remove("bump"); void spentEl.offsetWidth; spentEl.classList.add("bump");
    }
  }

  // ============================================================
  //  COMPRAR / VENDER
  // ============================================================
  function currentGross() {
    return NET_WORTH + ((Date.now() - startTime) / 1000) * EARN_PER_SECOND;
  }

  function buy(item, delta) {
    if (delta > 0) {
      // ¿Le alcanza a Elon? (fortuna actual menos lo ya gastado)
      const available = currentGross() - spent;
      if (item.price > available) {
        Sound.error();
        shakeCard(item);
        showElonDiss();
        return;
      }
    }
    const next = item.qty + delta;
    if (next < 0) return;
    item.qty = next;
    spent += delta * item.price;
    if (spent < 0) spent = 0;

    if (delta > 0) { Sound.caching(); burstConfetti(); }
    else { Sound.undo(); }

    updateSpent(true);
    renderCard(item);
  }

  function shakeCard(item) {
    const card = document.getElementById("card-" + item.id);
    if (!card) return;
    card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
  }

  // ============================================================
  //  TOAST SARCÁSTICO DE ELON (compra bloqueada)
  // ============================================================
  const elonToast = $("#elonToast");
  const elonToastMsg = $("#elonToastMsg");
  let toastTimer = null;
  function showElonDiss() {
    const msg = ELON_DISS[(Math.random() * ELON_DISS.length) | 0];
    elonToastMsg.textContent = msg;
    elonToast.hidden = false;
    elonToast.classList.remove("show"); void elonToast.offsetWidth; elonToast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideElonDiss, 3600);
  }
  function hideElonDiss() {
    elonToast.classList.remove("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { elonToast.hidden = true; }, 300);
  }

  // ============================================================
  //  BORRAR TODAS LAS COMPRAS
  // ============================================================
  function clearAll() {
    Object.values(ITEMS).forEach(it => { if (it.qty > 0) { it.qty = 0; renderCard(it); } });
    spent = 0;
    updateSpent(true);
    Sound.sweep();
  }

  // ============================================================
  //  RENDER: SUELDOS — "Toda tu VIDA" vs un ratito de Elon
  // ============================================================
  function renderSalaries() {
    const perMin = EARN_PER_SECOND * 60;
    const html = SALARIES.map(s => {
      const lifetime = s.usd * 12 * WORKING_YEARS;        // todo lo que ganas en la vida
      const secs = Math.max(1, Math.round(lifetime / EARN_PER_SECOND)); // a Elon le toma esto
      const youW = Math.min((lifetime / perMin) * 100, 100); // barra "tú" vs 1 min de Elon
      return `
        <div class="vs">
          <div class="vs__head">
            <span class="vs__flag">👴 ${s.pais}</span>
            <span class="vs__mult">${secs}<small> seg</small></span>
          </div>
          <p class="vs__big">Lo que ganarás en <b>toda tu vida</b>, Elon lo gana en <b>${secs} segundos</b>. ⏱️</p>
          <div class="vs__bars">
            <div class="vs__row">
              <span class="vs__tag">Elon · 1 min</span>
              <div class="vs__track"><div class="vs__fill vs__fill--elon" style="width:100%"></div></div>
              <span class="vs__amt">${fmtFull(perMin)}</span>
            </div>
            <div class="vs__row">
              <span class="vs__tag">Tú · toda la vida</span>
              <div class="vs__track"><div class="vs__fill vs__fill--you" style="width:${youW}%"></div></div>
              <span class="vs__amt">${fmtFull(lifetime)}</span>
            </div>
          </div>
          <p class="vs__line">≈${WORKING_YEARS} años trabajando &middot; sueldo ${s.local}/mes</p>
        </div>`;
    }).join("");
    $("#salaries").innerHTML = html;
  }

  // ============================================================
  //  RENDER: TIENDA
  // ============================================================
  function renderStore() {
    const store = $("#tienda");
    store.innerHTML = CATEGORIES.map(cat => `
      <section class="cat" id="cat-${cat.id}">
        <div class="cat__head">
          <h2 class="cat__title">${cat.emoji} ${cat.title}</h2>
          <p class="cat__blurb">${cat.blurb}</p>
        </div>
        <div class="grid">
          ${cat.items.map(it => cardHTML(it)).join("")}
        </div>
      </section>
    `).join("");

    // delegación de eventos
    store.addEventListener("click", e => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const item = ITEMS[btn.dataset.id];
      if (!item) return;
      buy(item, btn.dataset.act === "add" ? 1 : -1);
    });
  }

  function cardHTML(it) {
    return `
      <article class="card ${it.qty > 0 ? "owned" : ""}" id="card-${it.id}">
        <span class="card__badge" id="badge-${it.id}">×${it.qty}</span>
        <div class="card__emoji">${it.emoji}</div>
        <div class="card__name">${it.name}</div>
        <div class="card__note">${it.note}</div>
        <div class="card__price ${it.price >= 1e12 ? "is-xl" : it.price >= 1e9 ? "is-med" : ""}">${fmtFull(it.price)}</div>
        <div class="card__actions">
          <button class="card__remove" data-act="sub" data-id="${it.id}" aria-label="Quitar uno">−</button>
          <button class="card__add" data-act="add" data-id="${it.id}">
            <span class="card__add-txt">Añadir</span> 🛒
          </button>
        </div>
      </article>`;
  }

  // re-render mínimo de una card (solo lo que cambia)
  function renderCard(it) {
    const card = document.getElementById("card-" + it.id);
    if (!card) return;
    card.classList.toggle("owned", it.qty > 0);
    const badge = document.getElementById("badge-" + it.id);
    badge.textContent = "×" + it.qty;
  }

  // ============================================================
  //  TICKER DEL HERO
  // ============================================================
  function renderHeroTicker() {
    const perMin = EARN_PER_SECOND * 60;
    const perDay = EARN_PER_SECOND * 86400;
    $("#perMin").textContent = fmtFull(perMin);
    $("#perDay").textContent = fmtShort(perDay);
    const peru = SALARIES.find(s => s.pais.includes("Perú"));
    $("#vsPeru").textContent = Math.round(perMin / peru.usd).toLocaleString("es") + "×";
    rateEl.textContent = "+" + fmtFull(EARN_PER_SECOND) + " / segundo";
    const rateBig = $("#rateBig");
    if (rateBig) rateBig.textContent = fmtFull(perMin);
  }

  // ============================================================
  //  RECIBO
  // ============================================================
  const modal = $("#modal");
  let printTimer = null;

  function openReceipt() {
    const bought = Object.values(ITEMS).filter(it => it.qty > 0);
    const itemsEl = $("#receiptItems");

    if (bought.length === 0) {
      itemsEl.innerHTML = `<li class="empty">No compraste nada… ¿te dio culpa? 😅</li>`;
    } else {
      itemsEl.innerHTML = bought.map(it =>
        `<li><span>${it.emoji} ${it.name} ${it.qty > 1 ? "×" + it.qty : ""}</span><span>${fmtFull(it.qty * it.price)}</span></li>`
      ).join("");
    }

    const left = netWorth - spent;
    const pct = (spent / netWorth) * 100;
    $("#receiptTotal").textContent = fmtFull(spent);
    $("#receiptLeft").textContent = fmtFull(left);
    $("#receiptPct").textContent = (pct < 0.01 && spent > 0 ? "<0.01" : pct.toFixed(2)) + "%";
    $("#receiptDate").textContent = new Date().toLocaleString("es-PE");
    $("#receiptPunch").innerHTML = punchline(pct, spent);

    // 1 frase sarcástica (con conciencia) al azar, de un pool de 50+
    const one = RECEIPT_LINES[(Math.random() * RECEIPT_LINES.length) | 0];
    $("#receiptNotes").innerHTML = `<p>“${one}”</p>`;

    // --- Mostrar + animación de impresión ---
    const PRINT_MS = 1250;
    modal.hidden = false;
    clearTimeout(printTimer);
    modal.classList.remove("printing");
    void modal.offsetWidth;            // reflow para re-disparar la animación
    modal.classList.add("printing");
    Sound.printer(PRINT_MS / 1000);    // zumbido de impresora
    printTimer = setTimeout(() => {
      modal.classList.remove("printing");
      Sound.fanfare();
      bigConfetti();
    }, PRINT_MS);
  }

  function punchline(pct, spent) {
    if (spent === 0) return "Gastaste $0 y su fortuna igual subió. Imagínate.";
    if (pct < 1)  return `Gastaste una locura de dinero… y apenas tocaste el <b>${pct.toFixed(2)}%</b> de su fortuna.<br>Eso es la desigualdad en una pantalla.`;
    if (pct < 25) return `Increíble: ni comprando todo esto llegaste al 25%.<br>Y mientras leías, el contador siguió subiendo.`;
    if (pct < 100) return `¡Casi lo logras! Pero ojo: él ya recuperó parte mientras comprabas.`;
    return `Vaciaste su fortuna… en una simulación. En la vida real, el contador no para. 🙃`;
  }

  function closeReceipt() { clearTimeout(printTimer); modal.classList.remove("printing"); modal.hidden = true; }

  // ============================================================
  //  COMPARTIR (imagen del recibo + enlace)
  // ============================================================
  const SITE_URL = "https://eltrillonario.com";

  function shareText() {
    const pct = ((spent / Math.max(netWorth, 1)) * 100).toFixed(2);
    return `Gasté ${fmtFull(spent)} de la fortuna de Elon (el primer trillonario) y apenas fue el ${pct}% 😳 ¿Cuánto gastas tú? 👉 ${SITE_URL}`;
  }

  // Captura el recibo como imagen PNG (Blob) con html2canvas.
  async function captureReceipt() {
    const node = $("#receipt");
    if (typeof html2canvas === "undefined" || !node) return null;
    node.classList.add("capturing");
    const prevMax = node.style.maxHeight, prevOv = node.style.overflow;
    node.style.maxHeight = "none"; node.style.overflow = "visible";
    let blob = null;
    try {
      const canvas = await html2canvas(node, { backgroundColor: "#fdfdf7", scale: 2, useCORS: true, logging: false });
      blob = await new Promise(r => canvas.toBlob(r, "image/png"));
    } catch (e) { /* noop */ }
    node.style.maxHeight = prevMax; node.style.overflow = prevOv;
    node.classList.remove("capturing");
    return blob;
  }

  // Intenta compartir la IMAGEN por la hoja nativa del sistema
  // (incluye WhatsApp, Instagram, etc. en móvil). Devuelve true si funcionó.
  async function shareImageNative() {
    try {
      const blob = await captureReceipt();
      if (blob && navigator.canShare) {
        const file = new File([blob], "recibo-elon.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: shareText(), title: "Gasta la plata de Elon" });
          return true;
        }
      }
    } catch (e) { /* el usuario canceló o no soportado */ }
    return false;
  }

  async function downloadImage(showTip) {
    const blob = await captureReceipt();
    if (!blob) { flashTip("No se pudo generar la imagen 😕"); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "recibo-elon.png";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    if (showTip) flashTip("📥 Imagen guardada. ¡Súbela a tu historia con el link eltrillonario.com!");
  }

  function shareWhatsApp() {
    shareImageNative().then(ok => {
      if (!ok) window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`, "_blank", "noopener");
    });
  }
  function shareFacebook() {
    const u = encodeURIComponent(SITE_URL);
    const q = encodeURIComponent(shareText());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${q}`, "_blank", "noopener");
  }
  function shareInstagram() {
    // Instagram no acepta enlaces web: compartimos imagen nativa o la descargamos.
    shareImageNative().then(ok => { if (!ok) downloadImage(true); });
  }

  // Mini aviso temporal (para tips de compartir).
  let tipTimer = null;
  function flashTip(msg) {
    elonToastMsg.textContent = msg;
    elonToast.classList.add("elon-toast--tip");
    elonToast.hidden = false;
    elonToast.classList.remove("show"); void elonToast.offsetWidth; elonToast.classList.add("show");
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => { hideElonDiss(); elonToast.classList.remove("elon-toast--tip"); }, 3600);
  }

  // ============================================================
  //  CONFETI (canvas ligero)
  // ============================================================
  const canvas = $("#confetti");
  const cctx = canvas.getContext("2d");
  let particles = [];
  function resizeCanvas() { canvas.width = innerWidth; canvas.height = innerHeight; }
  resizeCanvas();
  addEventListener("resize", resizeCanvas);

  const COLORS = ["#36d399", "#ffd24a", "#7aa2ff", "#ff6b81", "#ffffff"];
  function spawn(n, originY) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: originY ?? -10,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 2,
        size: Math.random() * 7 + 4,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.3,
        life: 1,
      });
    }
  }
  function burstConfetti() { spawn(14); ensureLoop(); }
  function bigConfetti() { spawn(120); ensureLoop(); }

  let looping = false;
  function ensureLoop() { if (!looping) { looping = true; requestAnimationFrame(confettiLoop); } }
  function confettiLoop() {
    cctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.rot += p.vr; p.life -= 0.006;
      cctx.save();
      cctx.globalAlpha = Math.max(p.life, 0);
      cctx.translate(p.x, p.y); cctx.rotate(p.rot);
      cctx.fillStyle = p.color;
      cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      cctx.restore();
    });
    particles = particles.filter(p => p.life > 0 && p.y < canvas.height + 20);
    if (particles.length > 0) requestAnimationFrame(confettiLoop);
    else { looping = false; cctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  // ============================================================
  //  AUDIO + MUTE
  // ============================================================
  const muteBtn = $("#muteBtn");
  muteBtn.addEventListener("click", () => {
    Sound.setMuted(!Sound.isMuted());
    muteBtn.textContent = Sound.isMuted() ? "🔇" : "🔊";
    if (!Sound.isMuted()) Sound.ensure();
  });
  // desbloquear audio en el primer toque (políticas de navegadores)
  addEventListener("pointerdown", () => Sound.ensure(), { once: true });

  // ============================================================
  //  WIRING
  // ============================================================
  $("#receiptBtn").addEventListener("click", openReceipt);
  $("#clearBtn").addEventListener("click", clearAll);
  $("#receiptClose").addEventListener("click", closeReceipt);
  $("#receiptCloseBottom").addEventListener("click", closeReceipt);
  $("#modalBackdrop").addEventListener("click", closeReceipt);
  $("#shareWa").addEventListener("click", shareWhatsApp);
  $("#shareFb").addEventListener("click", shareFacebook);
  $("#shareIg").addEventListener("click", shareInstagram);
  $("#shareDl").addEventListener("click", () => downloadImage(true));
  elonToast.addEventListener("click", hideElonDiss);
  addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeReceipt(); });

  // -------- Init --------
  renderHeroTicker();
  renderSalaries();
  renderStore();
  updateSpent(false);
  requestAnimationFrame(tickFortune);
})();
