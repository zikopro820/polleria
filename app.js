/* =========================================================
   POLLERÍA EL POLLÓN — Web / app del cliente
   Carta, carrito, delivery o recojo, pago y seguimiento.
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const soles = n => "S/ " + (Math.round((+n || 0) * 100) / 100).toFixed(2);
const r2 = n => Math.round((+n || 0) * 100) / 100;
const params = new URLSearchParams(location.search);
let AJ = {}, CATS = [], PRODS = [], ZONAS = [];
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const waLink = t => `https://wa.me/${String(AJ.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(t)}`;
function aviso(msg, bad) { let t = $(".pl-toast"); if (!t) { t = document.createElement("div"); t.className = "pl-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.className = "pl-toast show" + (bad ? " bad" : ""); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 3200); }
const IMG = f => !f ? "" : /^(data:|https?:)/.test(f) ? f : `https://images.unsplash.com/photo-${f}?auto=format&fit=crop&w=600&q=70`;
const icoCat = id => (CATS.find(c => c.id === id) || {}).icono || "🍗";
const foto = (p, cls = "") => p.foto ? `<img class="${cls}" src="${esc(IMG(p.foto))}" alt="${esc(p.nombre)}" loading="lazy">` : `<div class="ph ${cls}" aria-hidden="true">${esc(icoCat(p.cat))}</div>`;

/* ---------- Horario (hora de Lima) ---------- */
function horaLima() { const d = new Date(Date.now() - 5 * 3600e3); return { dia: d.getUTCDay(), min: d.getUTCHours() * 60 + d.getUTCMinutes() }; }
const aMin = h => { const [a, b] = String(h || "0:0").split(":"); return (+a || 0) * 60 + (+b || 0); };
function estaAbierto() {
  if (AJ.estadoManual === "abierto") return true; if (AJ.estadoManual === "cerrado") return false;
  const { dia, min } = horaLima(), a = aMin(AJ.abre), c = aMin(AJ.cierra), dias = AJ.dias || [0, 1, 2, 3, 4, 5, 6];
  if (c > a) return dias.includes(dia) && min >= a && min < c;
  return (dias.includes(dia) && min >= a) || (dias.includes((dia + 6) % 7) && min < c);   // cierra pasada la medianoche
}
const textoHorario = () => `${AJ.abre || ""} a ${AJ.cierra || ""}`;

/* ---------- Carrito ---------- */
const CART = {
  get: () => store.get("pl_carrito", []), set(l) { store.set("pl_carrito", l); pintarBadge(); },
  add(it) { const l = CART.get(), k = l.find(x => x.key === it.key); if (k) k.cant += it.cant; else l.push(it); CART.set(l); },
  subtotal: () => r2(CART.get().reduce((a, x) => a + x.precio * x.cant, 0)), cuenta: () => CART.get().reduce((a, x) => a + x.cant, 0)
};
const MIS = { get: () => store.get("pl_pedidos", []), add(c) { const l = MIS.get().filter(x => x !== c); l.unshift(c); store.set("pl_pedidos", l.slice(0, 30)); } };
function pintarBadge() { $$(".js-cnt").forEach(b => { const n = CART.cuenta(); b.textContent = n; b.hidden = !n; }); $$(".js-sub").forEach(b => b.textContent = soles(CART.subtotal())); const f = $("#fab"); if (f) f.hidden = !CART.cuenta(); }

/* ---------- Encabezado y pie comunes ---------- */
function marca() {
  $$(".js-nombre").forEach(e => e.textContent = AJ.nombre); $$(".js-slogan").forEach(e => e.textContent = AJ.slogan || "");
  $$(".js-logo").forEach(e => { if (AJ.logo) e.innerHTML = `<img src="${esc(AJ.logo)}" alt="">`; });
  $$(".js-dir").forEach(e => e.textContent = AJ.direccion || ""); $$(".js-tel").forEach(e => e.textContent = AJ.telefono || "");
  $$(".js-horario").forEach(e => e.textContent = textoHorario());
  $$(".js-wa").forEach(a => { a.href = waLink(`Hola ${AJ.nombre} 👋 quiero hacer un pedido.`); a.target = "_blank"; a.rel = "noopener"; });
  const ab = estaAbierto(); $$(".js-estado").forEach(e => { e.className = "estado js-estado " + (ab ? "on" : "off"); e.textContent = ab ? `Abierto · hasta las ${AJ.cierra}` : `Cerrado · abrimos a las ${AJ.abre}`; });
  document.title = document.title.replace("El Pollón", AJ.nombre.replace(/^Pollería\s+/i, ""));
}

/* ---------- Carta (inicio) ---------- */
function paginaCarta() {
  const box = $("#carta"); if (!box) return;
  const vis = PRODS.filter(p => p.activo !== false), cats = CATS.filter(c => vis.some(p => p.cat === c.id));
  const dest = vis.filter(p => p.destacado && !p.agotado).slice(0, 6);
  $("#chips").innerHTML = (dest.length ? `<a href="#c-dest" class="chip on">⭐ Favoritos</a>` : "") + cats.map(c => `<a href="#c-${esc(c.id)}" class="chip">${esc(c.icono || "")} ${esc(c.nombre)}</a>`).join("");
  const card = p => `<article class="card ${p.agotado ? "agot" : ""}"><button type="button" class="card-b" data-p="${esc(p.id)}" ${p.agotado ? "disabled" : ""} aria-label="${esc(p.nombre)}">
      <div class="card-img">${foto(p)}${p.agotado ? `<span class="tag-ag">Agotado</span>` : p.destacado ? `<span class="tag-st">⭐ Favorito</span>` : ""}</div>
      <div class="card-t"><h3>${esc(p.nombre)}</h3><p>${esc(p.desc || "")}</p><div class="card-f"><b>${soles(p.precio)}</b>${p.agotado ? "" : `<span class="add">+</span>`}</div></div></button></article>`;
  box.innerHTML = (dest.length ? `<section class="sec" id="c-dest"><h2>⭐ Los favoritos de la casa</h2><div class="grid">${dest.map(card).join("")}</div></section>` : "")
    + cats.map(c => `<section class="sec" id="c-${esc(c.id)}"><h2>${esc(c.icono || "")} ${esc(c.nombre)}</h2><div class="grid">${vis.filter(p => p.cat === c.id).map(card).join("")}</div></section>`).join("");
  box.addEventListener("click", e => { const b = e.target.closest("[data-p]"); if (b) abrirProducto(b.dataset.p); });
  // chips: marcar la categoría visible
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) $$("#chips .chip").forEach(c => c.classList.toggle("on", c.getAttribute("href") === "#" + x.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
  $$(".sec", box).forEach(s => io.observe(s));
  if (params.get("p")) abrirProducto(params.get("p"));
  if (params.get("carrito")) abrirCarrito();
}

/* ---------- Ventana del producto: opciones, cremas, cantidad ---------- */
function hoja(html, cls = "") {
  cerrarHoja(); document.body.insertAdjacentHTML("beforeend", `<div class="hoja-bg" id="hoja"><div class="hoja ${cls}" role="dialog" aria-modal="true">${html}</div></div>`);
  const h = $("#hoja"); document.body.classList.add("no-scroll"); requestAnimationFrame(() => h.classList.add("on"));
  h.addEventListener("click", e => { if (e.target === h || e.target.closest("[data-cerrar]")) cerrarHoja(); });
  setTimeout(() => $("input, button:not([data-cerrar]), select, textarea", h)?.focus({ preventScroll: true }), 60); return h;
}
function cerrarHoja() { const h = $("#hoja"); if (h) h.remove(); document.body.classList.remove("no-scroll"); }
document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarHoja(); });

function abrirProducto(id) {
  const p = PRODS.find(x => x.id === id); if (!p || p.agotado || p.activo === false) return;
  const grupos = p.opciones || [], cremas = p.cremas ? (AJ.cremas || []) : [];
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="hp-img">${foto(p)}</div>
    <form class="hp" id="hpF" novalidate><h2>${esc(p.nombre)}</h2><p class="muted">${esc(p.desc || "")}</p><b class="hp-pr">${soles(p.precio)}</b>
      ${grupos.map((g, gi) => `<fieldset class="op" data-g="${gi}"><legend>${esc(g.titulo)} ${g.req ? `<em>Obligatorio</em>` : g.tipo === "varios" ? `<small>Opcional</small>` : `<small>Opcional</small>`}</legend>
        ${(g.items || []).map((it, ii) => `<label class="op-i"><input type="${g.tipo === "varios" ? "checkbox" : "radio"}" name="g${gi}" value="${ii}" ${g.tipo !== "varios" && g.req && ii === 0 ? "checked" : ""}><span>${esc(it.n)}</span>${+it.p ? `<b>+ ${soles(it.p)}</b>` : ""}</label>`).join("")}</fieldset>`).join("")}
      ${cremas.length ? `<fieldset class="op"><legend>Cremas <small>Gratis · elige las que quieras</small></legend><div class="cremas">${cremas.map(c => `<label class="cr"><input type="checkbox" name="crema" value="${esc(c)}"><span>${esc(c)}</span></label>`).join("")}</div></fieldset>` : ""}
      <label class="op-n">¿Alguna indicación? <small>(opcional)</small><textarea name="nota" rows="2" maxlength="140" placeholder="Ej. sin sal, bien dorado, sin ensalada"></textarea></label>
      <div class="hp-f"><div class="qty"><button type="button" data-q="-1" aria-label="Menos">−</button><b id="qN">1</b><button type="button" data-q="1" aria-label="Más">+</button></div>
        <button class="btn btn-red" id="hpAdd">Agregar · <span id="hpTot">${soles(p.precio)}</span></button></div></form>`, "hp-h");
  let cant = 1;
  const calc = () => { let x = +p.precio; grupos.forEach((g, gi) => $$(`[name="g${gi}"]:checked`, h).forEach(i => x += +(g.items[+i.value].p || 0))); return r2(x); };
  const repintar = () => { $("#qN", h).textContent = cant; $("#hpTot", h).textContent = soles(calc() * cant); };
  h.addEventListener("change", repintar);
  h.addEventListener("click", e => { const q = e.target.closest("[data-q]"); if (q) { cant = Math.max(1, Math.min(30, cant + +q.dataset.q)); repintar(); } });
  $("#hpF", h).addEventListener("submit", e => {
    e.preventDefault();
    const falta = grupos.findIndex((g, gi) => g.req && !$(`[name="g${gi}"]:checked`, h)); if (falta >= 0) { aviso(`Elige: ${grupos[falta].titulo}`, true); $(`[data-g="${falta}"]`, h).scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    const opts = grupos.map((g, gi) => $$(`[name="g${gi}"]:checked`, h).map(i => g.items[+i.value].n).join(", ")).filter(Boolean).join(" · ");
    const cr = $$('[name="crema"]:checked', h).map(i => i.value).join(", "), nota = $('[name="nota"]', h).value.trim().slice(0, 140);
    const precio = calc();
    CART.add({ key: [p.id, opts, cr, nota].join("|"), id: p.id, n: p.nombre, precio, cant, opts, cremas: cr, nota, cat: p.cat });
    cerrarHoja(); aviso(`✓ ${cant}× ${p.nombre} agregado`);
    const tieneBebida = CART.get().some(x => x.cat === "bebidas");
    if (p.sugerirBebida && !tieneBebida) sugerirBebida();
  });
}
function sugerirBebida() {
  const beb = PRODS.filter(p => p.cat === "bebidas" && p.activo !== false && !p.agotado).slice(0, 6); if (!beb.length) return;
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="up"><h2>🥤 ¿Le agregas una bebida?</h2><p class="muted">Bien helada para acompañar tu pedido.</p>
    <div class="up-l">${beb.map(b => `<button type="button" class="up-i" data-b="${esc(b.id)}">${foto(b, "mini")}<span><b>${esc(b.nombre)}</b><small>desde ${soles(b.precio)}</small></span><em>Elegir</em></button>`).join("")}</div>
    <button type="button" class="btn btn-light" data-cerrar>No, gracias</button></div>`, "up-h");
  h.addEventListener("click", e => { const b = e.target.closest("[data-b]"); if (b) abrirProducto(b.dataset.b); });
}

/* ---------- Carrito y checkout ---------- */
function abrirCarrito() {
  const l = CART.get();
  if (!l.length) { hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="vacio">🛒<h2>Tu pedido está vacío</h2><p class="muted">Elige tus platos de la carta.</p><button class="btn btn-red" data-cerrar>Ver la carta</button></div>`); return; }
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><div class="cart"><h2>Tu pedido</h2><div id="cartL"></div>
    <div class="cart-f"><div class="tot"><span>Subtotal</span><b class="js-sub">${soles(CART.subtotal())}</b></div>
    ${estaAbierto() ? `<button class="btn btn-red btn-lg" id="irPago">Continuar</button>` : `<div class="cerrado">🔒 Estamos cerrados. Abrimos a las <b>${esc(AJ.abre)}</b> (${esc(textoHorario())}).</div>`}
    <button class="btn btn-light" data-cerrar>Seguir agregando</button></div></div>`, "cart-h");
  const pintar = () => { const l2 = CART.get(); if (!l2.length) return abrirCarrito();
    $("#cartL", h).innerHTML = l2.map((x, i) => `<div class="ci"><div><b>${esc(x.n)}</b>${x.opts ? `<small>${esc(x.opts)}</small>` : ""}${x.cremas ? `<small>Cremas: ${esc(x.cremas)}</small>` : ""}${x.nota ? `<small>📝 ${esc(x.nota)}</small>` : ""}<span>${soles(x.precio * x.cant)}</span></div>
      <div class="qty sm"><button type="button" data-i="${i}" data-d="-1" aria-label="Menos">${x.cant === 1 ? "🗑" : "−"}</button><b>${x.cant}</b><button type="button" data-i="${i}" data-d="1" aria-label="Más">+</button></div></div>`).join("");
    pintarBadge(); };
  pintar();
  h.addEventListener("click", e => { const b = e.target.closest("[data-d]"); if (!b) return; const l2 = CART.get(), x = l2[+b.dataset.i]; x.cant += +b.dataset.d; if (x.cant <= 0) l2.splice(+b.dataset.i, 1); CART.set(l2); pintar(); });
  $("#irPago", h)?.addEventListener("click", checkout);
}
function checkout() {
  const datos = store.get("pl_cliente", {}), puedeD = AJ.delivery !== false && ZONAS.some(z => z.activo !== false), puedeR = AJ.recojo !== false;
  let entrega = datos.entrega && ((datos.entrega === "delivery" && puedeD) || (datos.entrega === "recojo" && puedeR)) ? datos.entrega : puedeD ? "delivery" : "recojo", ubic = null;
  const zonas = ZONAS.filter(z => z.activo !== false);
  const h = hoja(`<button class="x" data-cerrar aria-label="Cerrar">×</button><form class="ck" id="ckF" novalidate><h2>Finalizar pedido</h2>
    <div class="seg">${puedeD ? `<button type="button" data-e="delivery">🛵 Delivery</button>` : ""}${puedeR ? `<button type="button" data-e="recojo">🏪 Recojo en local</button>` : ""}</div>
    <div id="ckD"><label>Zona de reparto *<select id="ckZ">${zonas.map(z => `<option value="${esc(z.id)}" ${datos.zona === z.id ? "selected" : ""}>${esc(z.nombre)} · ${soles(z.costo)}</option>`).join("")}</select></label>
      <label>Dirección *<input id="ckDir" maxlength="140" autocomplete="street-address" placeholder="Calle, número, dpto." value="${esc(datos.direccion || "")}"></label>
      <label>Referencia<input id="ckRef" maxlength="140" placeholder="Ej. frente al parque, puerta verde" value="${esc(datos.referencia || "")}"></label>
      <button type="button" class="btn btn-light btn-sm" id="ckGPS">📍 Usar mi ubicación actual</button><small class="muted" id="ckGPSt"></small></div>
    <div id="ckR" class="ck-local">🏪 Recoges en <b>${esc(AJ.direccion || "")}</b>${AJ.referencia ? ` (${esc(AJ.referencia)})` : ""}. Listo en ${esc(AJ.tiempoRecojo || "20 a 30 min")}.</div>
    <div class="g2"><label>Tu nombre *<input id="ckN" maxlength="60" autocomplete="name" value="${esc(datos.nombre || "")}"></label>
      <label>Celular (WhatsApp) *<input id="ckC" maxlength="15" inputmode="tel" autocomplete="tel" value="${esc(datos.celular || "")}"></label></div>
    <div class="g2"><label>Comprobante<select id="ckK"><option>Boleta</option><option ${datos.comprobante === "Factura" ? "selected" : ""}>Factura</option></select></label>
      <label>DNI o RUC <small>(opcional)</small><input id="ckDoc" maxlength="11" inputmode="numeric" value="${esc(datos.doc || "")}"></label></div>
    <label>Nota para el pedido<input id="ckNota" maxlength="140" placeholder="Ej. tocar el timbre, sin cubiertos"></label>
    <div class="resumen" id="ckRes"></div>
    <h3>Forma de pago</h3><div id="pagoBox"></div>
    <p class="err" id="ckErr" role="alert"></p><button class="btn btn-red btn-lg" id="ckBtn">Hacer pedido</button></form>`, "ck-h");
  const pago = Pago($("#pagoBox", h), AJ, { contraEntrega: AJ.contraEntrega !== false });
  const envio = () => entrega === "delivery" ? +((zonas.find(z => z.id === $("#ckZ", h).value) || {}).costo || 0) : 0;
  const total = () => r2(CART.subtotal() + envio());
  const resumen = () => { $("#ckRes", h).innerHTML = `<div><span>Subtotal</span><b>${soles(CART.subtotal())}</b></div>${entrega === "delivery" ? `<div><span>Delivery</span><b>${soles(envio())}</b></div>` : ""}<div class="t"><span>Total</span><b>${soles(total())}</b></div>`
    + (entrega === "delivery" && CART.subtotal() < (+AJ.pedidoMinimo || 0) ? `<p class="err">El pedido mínimo para delivery es ${soles(AJ.pedidoMinimo)}.</p>` : ""); pago.setMonto(total()); };
  const modo = () => { $$("[data-e]", h).forEach(b => b.classList.toggle("on", b.dataset.e === entrega)); $("#ckD", h).hidden = entrega !== "delivery"; $("#ckR", h).hidden = entrega !== "recojo"; resumen(); };
  h.addEventListener("click", e => { const b = e.target.closest("[data-e]"); if (b) { entrega = b.dataset.e; modo(); } });
  $("#ckZ", h)?.addEventListener("change", resumen);
  $("#ckGPS", h)?.addEventListener("click", () => {
    const t = $("#ckGPSt", h); if (!navigator.geolocation) { t.textContent = "Tu navegador no permite ubicación."; return; } t.textContent = "Buscando tu ubicación…";
    navigator.geolocation.getCurrentPosition(p => { ubic = { lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }; t.textContent = "✓ Ubicación agregada: el repartidor llegará directo."; },
      () => { t.textContent = "No pudimos obtener tu ubicación. Escribe bien tu dirección y referencia."; }, { enableHighAccuracy: true, timeout: 12000 });
  });
  pago.pintar().then(() => pago.setMonto(total())); modo();
  $("#ckF", h).addEventListener("submit", async e => {
    e.preventDefault(); const err = $("#ckErr", h); err.textContent = "";
    const v = id => ($(id, h)?.value || "").trim(), cel = v("#ckC").replace(/\D/g, ""), doc = v("#ckDoc").replace(/\D/g, "");
    if (!estaAbierto()) return err.textContent = "Estamos cerrados en este momento.";
    if (!v("#ckN")) return err.textContent = "Escribe tu nombre.";
    if (cel.length < 9) return err.textContent = "Escribe un celular válido (9 dígitos).";
    if (entrega === "delivery" && !v("#ckDir")) return err.textContent = "Escribe tu dirección de entrega.";
    if (entrega === "delivery" && CART.subtotal() < (+AJ.pedidoMinimo || 0)) return err.textContent = `El pedido mínimo para delivery es ${soles(AJ.pedidoMinimo)}.`;
    if (v("#ckK") === "Factura" && doc.length !== 11) return err.textContent = "Para factura escribe el RUC (11 dígitos).";
    const pe = pago.validar(); if (pe) return err.textContent = pe;
    const pd = pago.datos(), z = zonas.find(x => x.id === v("#ckZ")) || {}, cod = codigo("PL");
    const items = CART.get().map(x => ({ id: x.id, n: x.n, cant: x.cant, precio: x.precio, opts: x.opts || "", cremas: x.cremas || "", nota: x.nota || "" }));
    const ped = { codigo: cod, items, subtotal: CART.subtotal(), envio: envio(), total: total(), entrega, ...(entrega === "delivery" ? { zona: z.nombre || "", direccion: v("#ckDir"), referencia: v("#ckRef"), ...(ubic ? { ubic } : {}) } : {}),
      nombre: v("#ckN").slice(0, 60), celular: cel, comprobante: v("#ckK"), doc, nota: v("#ckNota"), pago: pd.pago, banco: pd.banco, monto: pd.monto, operacion: pd.operacion,
      montoLeido: pd.montoLeido, coincide: pd.coincide, fechaOk: pd.fechaOk, pagaCon: pd.pagaCon, estado: pd.pago === "Efectivo" ? "nuevo" : "por-validar", origen: "web", creado: new Date().toISOString() };
    Object.keys(ped).forEach(k => ped[k] === null || ped[k] === undefined || ped[k] === "" ? delete ped[k] : 0);
    const b = $("#ckBtn", h); b.disabled = true; b.textContent = "Enviando pedido…";
    try { await DB.crearPedido(ped, pd.captura); } catch (x) { console.error(x); b.disabled = false; b.textContent = "Hacer pedido"; err.textContent = "No se pudo enviar. Revisa tu conexión e inténtalo otra vez."; return; }
    store.set("pl_cliente", { nombre: ped.nombre, celular: cel, entrega, zona: v("#ckZ"), direccion: v("#ckDir"), referencia: v("#ckRef"), comprobante: v("#ckK"), doc });
    MIS.add(cod); CART.set([]); cerrarHoja(); location.href = `pedido.html?c=${encodeURIComponent(cod)}&nuevo=1`;
  });
}

/* ---------- Seguimiento del pedido ---------- */
const PASOS = { delivery: [["nuevo", "Recibido", "📝"], ["cocina", "En cocina", "🔥"], ["camino", "En camino", "🛵"], ["entregado", "Entregado", "✅"]],
  recojo: [["nuevo", "Recibido", "📝"], ["cocina", "En cocina", "🔥"], ["listo", "Listo para recoger", "🛍️"], ["entregado", "Entregado", "✅"]] };
const ORDEN = { "por-validar": 0, nuevo: 0, cocina: 1, listo: 2, camino: 2, entregado: 3 };
async function paginaPedido() {
  const box = $("#pedidoBox"); if (!box) return;
  const c = params.get("c"); if (!c) { box.innerHTML = `<div class="vacio">🔎<h2>Sigue tu pedido</h2><p class="muted">Abre el enlace que te llegó o entra a <a href="mis-pedidos.html">Mis pedidos</a>.</p></div>`; return; }
  let ult = "";
  async function pintar() {
    const p = await DB.pedido(c).catch(() => null);
    if (!p) { box.innerHTML = `<div class="vacio">😕<h2>No encontramos el pedido ${esc(c)}</h2><p><a href="mis-pedidos.html">Ver mis pedidos</a></p></div>`; return; }
    MIS.add(p.codigo);
    const firma = p.estado + (p.tiempo || ""); if (ult && ult !== firma && "vibrate" in navigator) navigator.vibrate(200); ult = firma;
    const pasos = PASOS[p.entrega] || PASOS.delivery, idx = ORDEN[p.estado] ?? -1, malo = ["rechazado", "anulado"].includes(p.estado);
    const titulo = { "por-validar": "Estamos validando tu pago", nuevo: "¡Recibimos tu pedido!", cocina: "Tu pedido se está preparando 🔥", listo: p.entrega === "recojo" ? "¡Tu pedido está listo para recoger!" : "Tu pedido está listo, sale en un momento", camino: "Tu pedido está en camino 🛵", entregado: "¡Pedido entregado! Buen provecho 🍗", rechazado: "No pudimos validar tu pago", anulado: "Tu pedido fue anulado" }[p.estado] || p.estado;
    box.innerHTML = `${params.get("nuevo") ? `<div class="ok-top">✓ Pedido enviado · guarda tu código <b>${esc(p.codigo)}</b></div>` : ""}
      <div class="trk"><small>Pedido ${esc(p.codigo)} · ${new Date(p.creado).toLocaleString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small><h1>${esc(titulo)}</h1>
        ${p.estado === "cocina" && p.tiempo ? `<p class="eta">⏱ Listo en aprox. <b>${esc(p.tiempo)} min</b></p>` : ""}${p.repartidor && p.estado === "camino" ? `<p class="eta">🛵 Te lo lleva <b>${esc(p.repartidor)}</b></p>` : ""}
        ${malo ? `<div class="bad">${p.motivo ? esc(p.motivo) + ". " : ""}Escríbenos por WhatsApp para ayudarte.</div>`
          : `<ol class="pasos">${pasos.map(([k, t, ic], i) => `<li class="${i < idx || p.estado === "entregado" ? "done" : i === idx ? "now" : ""}"><i>${ic}</i><span>${t}</span></li>`).join("")}</ol>`}
        ${p.estado === "por-validar" ? `<p class="muted">Revisamos tu captura de ${esc(p.pago || "")} y confirmamos en unos minutos.</p>` : ""}</div>
      <div class="det"><h3>Tu pedido</h3>${(p.items || []).map(x => `<div class="ci"><div><b>${x.cant}× ${esc(x.n)}</b>${x.opts ? `<small>${esc(x.opts)}</small>` : ""}${x.cremas ? `<small>Cremas: ${esc(x.cremas)}</small>` : ""}${x.nota ? `<small>📝 ${esc(x.nota)}</small>` : ""}</div><span>${soles(x.precio * x.cant)}</span></div>`).join("")}
        <div class="resumen"><div><span>Subtotal</span><b>${soles(p.subtotal)}</b></div>${p.envio ? `<div><span>Delivery</span><b>${soles(p.envio)}</b></div>` : ""}<div class="t"><span>Total</span><b>${soles(p.total)}</b></div></div>
        <p class="muted">${p.entrega === "delivery" ? `🛵 ${esc(p.direccion || "")}${p.referencia ? " · " + esc(p.referencia) : ""}` : `🏪 Recojo en ${esc(AJ.direccion || "")}`}<br>💳 ${esc(p.pago || "")}${p.pagaCon ? ` · paga con ${soles(p.pagaCon)} (vuelto ${soles(p.pagaCon - p.total)})` : ""}</p></div>
      <div class="acts"><a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(waLink(`Hola ${AJ.nombre} 👋 consulto por mi pedido ${p.codigo}.`))}">Escribir por WhatsApp</a>
        ${p.estado === "entregado" ? `<button class="btn btn-red" id="repetir">Volver a pedir lo mismo</button>` : `<a class="btn btn-light" href="index.html">Volver a la carta</a>`}</div>`;
    $("#repetir")?.addEventListener("click", () => repetir(p));
    if (["entregado", "rechazado", "anulado"].includes(p.estado)) clearInterval(T);
  }
  const T = setInterval(pintar, 15000); pintar();
}
function repetir(p) {
  let n = 0; (p.items || []).forEach(x => { const pr = PRODS.find(y => y.id === x.id); if (!pr || pr.agotado || pr.activo === false) return; CART.add({ key: [x.id, x.opts, x.cremas, x.nota].join("|"), id: x.id, n: x.n, precio: x.precio, cant: x.cant, opts: x.opts, cremas: x.cremas, nota: x.nota, cat: pr.cat }); n++; });
  if (!n) return aviso("Esos platos no están disponibles ahora", true); location.href = "index.html?carrito=1";
}

/* ---------- Mis pedidos ---------- */
async function paginaMisPedidos() {
  const box = $("#misBox"); if (!box) return; const cods = MIS.get();
  if (!cods.length) { box.innerHTML = `<div class="vacio">🧾<h2>Aún no tienes pedidos en este celular</h2><a class="btn btn-red" href="index.html">Ver la carta</a></div>`; return; }
  box.innerHTML = `<p class="muted">Cargando…</p>`;
  const ps = (await Promise.all(cods.map(c => DB.pedido(c).catch(() => null)))).filter(Boolean);
  const E = { "por-validar": "Validando pago", nuevo: "Recibido", cocina: "En cocina", listo: "Listo", camino: "En camino", entregado: "Entregado", rechazado: "Rechazado", anulado: "Anulado" };
  box.innerHTML = ps.map(p => `<a class="mp" href="pedido.html?c=${encodeURIComponent(p.codigo)}"><div><b>${esc(p.codigo)}</b><small>${new Date(p.creado).toLocaleString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · ${p.entrega === "delivery" ? "Delivery" : "Recojo"}</small>
    <small>${esc((p.items || []).map(x => `${x.cant}× ${x.n}`).join(", "))}</small></div><div><span class="e e-${esc(p.estado)}">${esc(E[p.estado] || p.estado)}</span><b>${soles(p.total)}</b></div></a>`).join("") || `<p class="muted">No encontramos tus pedidos.</p>`;
}

/* ---------- App instalable (PWA) ---------- */
let instalar = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); instalar = e; $$(".js-instalar").forEach(b => b.hidden = false); });
document.addEventListener("click", async e => {
  const b = e.target.closest(".js-instalar"); if (!b) return;
  if (instalar) { instalar.prompt(); await instalar.userChoice; instalar = null; b.hidden = true; }
  else aviso("En iPhone: toca Compartir y luego «Agregar a inicio».");
});
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
if (/iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone) $$(".js-instalar").forEach(b => b.hidden = false);

/* ---------- Arranque ---------- */
document.addEventListener("click", e => { if (e.target.closest(".js-carrito")) { e.preventDefault(); abrirCarrito(); } });
(async () => {
  const c = await DB.catalogo(); AJ = c.aj; CATS = c.cats; PRODS = c.prods; ZONAS = c.zonas;
  marca(); pintarBadge(); paginaCarta(); paginaPedido(); paginaMisPedidos();
  $$(".js-anio").forEach(e => e.textContent = new Date().getFullYear());
})();
