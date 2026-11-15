// Capacitación, autoevaluación y certificado en PDF: todo ocurre en el navegador.
// No se envía ni se guarda ningún dato personal.
(function () {
  const NOTA_MINIMA = 70;
  const CURSO = "Capacitación en Huerta Agroecológica";
  const FIRMANTES = [
    ["Amadey Alex", "Profesor en Agronomía"],
    ["Aguilera David", "Técnico en Agroindustria"],
    ["Zabala Matías", "Técnico en Alimentos"]
  ];
  const CLASES = [
    ["Clase 1: Qué sembrar y cómo empezar la huerta", ["Qué sembrar en cada época del año", "Cómo hacer una huerta desde cero", "Huerta a menor y mayor escala"]],
    ["Clase 2: Siembra, distancias y riego", ["Métodos de siembra (directa, almácigo y trasplante)", "Distancia entre plantas y entre líneas", "Croquis de huerta y sistemas de riego"]],
    ["Clase 3: Cuidados, cosechas y semillas", ["Cuidados y manejo", "Métodos de cosecha", "Conservación de semillas"]],
    ["Clase 4: Agroecología y saberes tradicionales", ["Rotación y asociación de cultivos", "Conocimientos campesinos: ciclo lunar y ciclo del viento", "Presentados como saberes tradicionales, no como reglas garantizadas"]]
  ];
  const PREGUNTAS = [
    ["¿Cómo se siembra la zanahoria según el INTA?", ["Siempre en siembra directa, nunca trasplantada", "Solo en almácigo", "Indistintamente"], 0],
    ["¿Cuántos días tarda aproximadamente el rabanito hasta la cosecha?", ["25 a 30 días", "90 a 100 días", "150 días"], 0],
    ["La 'chacra' de ProHuerta es una asociación de:", ["Tomate, lechuga y zanahoria", "Maíz, zapallo y poroto", "Papa, cebolla y ajo"], 1],
    ["¿Cómo se secan las semillas cosechadas?", ["Al sol directo en una chapa", "A la sombra, con buena ventilación y al menos 10 días", "En la heladera, mojadas"], 1],
    ["Regla general de distancias: a mayor tamaño de la planta y ciclo más largo...", ["Mayor distancia entre plantas", "Menor distancia entre plantas", "No cambia la distancia"], 0],
    ["La asociación de cultivos sirve para:", ["Aprovechar mejor el espacio y ayudar al control de plagas", "Evitar el riego", "Eliminar la rotación"], 0],
    ["Para producir semillas, ¿cuándo se suspende el riego?", ["Al sembrar", "Desde la madurez o cuando las flores empiezan a secarse", "Nunca se suspende"], 1],
    ["Según saberes tradicionales y un trabajo de la UNNE, la lechuga se siembra en cuarto menguante para:", ["Obtener hojas grandes y que no espigue rápido", "Que dé más frutos", "Que germine sin agua"], 0]
  ];

  const $ = id => document.getElementById(id);
  const el = (tag, props, ...hijos) => { const e = Object.assign(document.createElement(tag), props || {}); hijos.forEach(h => e.append(h)); return e; };

  // Clases
  const cont = $("clases");
  CLASES.forEach(([titulo, temas]) => { cont.append(el("h3", { textContent: titulo }), el("ul", {}, ...temas.map(t => el("li", { textContent: t })))); });

  // Preguntas
  const quiz = $("quiz");
  PREGUNTAS.forEach(([texto, ops], i) => {
    const fs = el("fieldset", {}, el("legend", { textContent: `${i + 1}. ${texto}` }));
    ops.forEach((o, j) => {
      const r = el("input", { type: "radio", name: "p" + i, value: j, required: true });
      fs.append(el("label", { className: "op" }, r, " " + o));
    });
    quiz.insertBefore(fs, quiz.querySelector("button"));
  });

  quiz.addEventListener("submit", e => {
    e.preventDefault();
    const aciertos = PREGUNTAS.filter((p, i) => parseInt(quiz.querySelector(`input[name=p${i}]:checked`).value, 10) === p[2]).length;
    const pct = Math.round(100 * aciertos / PREGUNTAS.length);
    const res = $("resultado");
    if (pct >= NOTA_MINIMA) {
      res.className = "ok"; res.textContent = `Aprobaste con ${pct}%.`;
      $("datos").classList.remove("oculto"); $("datos").scrollIntoView({ behavior: "smooth" });
    } else {
      res.className = "error"; res.textContent = `Sacaste ${pct}%. Necesitás ${NOTA_MINIMA}%. Podés intentarlo de nuevo.`;
      $("datos").classList.add("oculto");
    }
  });

  // Consentimiento
  $("si").onclick = () => { $("formdatos").classList.remove("oculto"); $("rechazo").classList.add("oculto"); };
  $("no").onclick = () => { $("formdatos").classList.add("oculto"); $("rechazo").classList.remove("oculto"); };

  const normNombre = t => { const s = (t || "").trim().replace(/\s+/g, " "); return s.length >= 5 && s.includes(" ") ? s : null; };
  const normDni = t => { const d = (t || "").replace(/[.\s-]/g, ""); return /^\d{7,8}$/.test(d) ? d : null; };
  const fechaLarga = () => new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  function cargarImagen(src) {
    return new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = src; });
  }

  async function certificado(nombre, dni) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const W = 297, H = 210, C = W / 2;
    doc.setFillColor(251, 248, 238); doc.rect(0, 0, W, H, "F");
    doc.setDrawColor(201, 162, 39); doc.setLineWidth(1.6); doc.rect(8, 8, W - 16, H - 16);
    doc.setDrawColor(31, 107, 63); doc.setLineWidth(0.5); doc.rect(12, 12, W - 24, H - 24);
    try { const img = await cargarImagen("img/logo.png"); doc.addImage(img, "PNG", C - 17, 18, 34, 34); } catch (e) { /* sin logo */ }
    doc.setTextColor(14, 59, 40);
    doc.setFont("helvetica", "bold"); doc.setFontSize(30); doc.text("CERTIFICADO DE PARTICIPACIÓN", C, 68, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(13); doc.setTextColor(36, 59, 46);
    doc.text("BrotIA certifica que", C, 82, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.setTextColor(31, 107, 63);
    let tam = 28; while (doc.getTextWidth(nombre) > W - 60 && tam > 12) { tam -= 1; doc.setFontSize(tam); }
    doc.text(nombre, C, 98, { align: "center" });
    doc.setDrawColor(201, 162, 39); doc.setLineWidth(0.6); doc.line(C - 70, 102, C + 70, 102);
    doc.setFont("helvetica", "normal"); doc.setFontSize(13); doc.setTextColor(36, 59, 46);
    doc.text(`DNI ${dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`, C, 111, { align: "center" });
    doc.text("aprobó la autoevaluación del curso", C, 122, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(14, 59, 40);
    doc.text(CURSO, C, 133, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(36, 59, 46);
    doc.text(fechaLarga(), C, 143, { align: "center" });
    const xs = [W * 0.2, W * 0.5, W * 0.8];
    FIRMANTES.forEach(([n, t], i) => {
      doc.setDrawColor(36, 59, 46); doc.setLineWidth(0.3); doc.line(xs[i] - 32, 170, xs[i] + 32, 170);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(n, xs[i], 176, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.text(t, xs[i], 181, { align: "center" });
    });
    doc.setFontSize(8.5); doc.setTextColor(90, 90, 90);
    doc.text("Certificado de participación emitido por BrotIA. No reemplaza una titulación oficial.", C, 194, { align: "center" });
    return doc;
  }

  $("formdatos").addEventListener("submit", async e => {
    e.preventDefault();
    const msg = $("msgdatos"); msg.className = "";
    const nombre = normNombre($("nombre").value), dni = normDni($("dni").value);
    if (!nombre) { msg.className = "error"; msg.textContent = "Escribí nombre y apellido."; return; }
    if (!dni) { msg.className = "error"; msg.textContent = "El DNI debe tener 7 u 8 números."; return; }
    msg.textContent = "Generando…";
    try {
      const doc = await certificado(nombre, dni);
      doc.save("certificado-brotia.pdf");
      $("nombre").value = ""; $("dni").value = "";
      msg.className = "ok"; msg.textContent = "¡Listo! Tu certificado se descargó. Tus datos no salieron de tu dispositivo.";
    } catch (err) { msg.className = "error"; msg.textContent = "No pude generar el PDF. Probá de nuevo."; }
  });
})();
