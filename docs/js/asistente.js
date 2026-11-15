// Asistente de huerta BrotIA: funciona 100 % en el navegador, sin servidor ni claves.
// Solo responde con lo que está en el calendario (ProHuerta/INTA) y en las clases de la capacitación.
(function () {
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const NOMBRES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const AVISO_NEA = "Ojo: las fechas son del calendario nacional (ProHuerta) y todavía no están validadas para Formosa y Chaco. Ajustalas al calor, las heladas y las lluvias de tu zona.";

  const sinTildes = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const valido = v => v && v !== "Verificar";

  // Meses (0-11) en los que una época indica siembra o trasplante. null = no se sabe.
  function mesesDe(epoca) {
    if (!valido(epoca)) return null;
    const e = sinTildes(epoca);
    if (e.includes("todo el ano")) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const set = new Set();
    const re = /\b(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\s*-\s*(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/g;
    let m;
    while ((m = re.exec(e))) {
      let i = MESES.indexOf(m[1]); const f = MESES.indexOf(m[2]);
      for (let n = 0; n < 12; n++) { set.add(i); if (i === f) break; i = (i + 1) % 12; }
    }
    NOMBRES.forEach((n, i) => { if (e.includes(n)) set.add(i); });
    return set.size ? [...set] : null;
  }

  function ficha(c) {
    const l = [`${c.cultivo} (${c.hoja})`, `• Siembra: ${c.forma}`];
    if (valido(c.epoca) && !/ver calendario/i.test(c.epoca)) l.push(`• Época: ${c.epoca}`);
    else l.push("• Época: no la tengo cargada con certeza; consultá el calendario original de ProHuerta.");
    if (valido(c.entrePlantas) && valido(c.entreLineas))
      l.push(`• Distancias: ${c.entrePlantas} cm entre plantas y ${c.entreLineas} cm entre líneas`);
    else l.push("• Distancias: sin verificar todavía, prefiero no darte un número dudoso.");
    if (valido(c.dias)) l.push(`• Días hasta la cosecha: ${c.dias}`);
    if (c.confianza === "Media") l.push("• Dato de confianza media: conviene confirmarlo.");
    return l.join("\n");
  }

  function buscarCultivos(q) {
    const t = sinTildes(q);
    return CALENDARIO.filter(c => {
      const n = sinTildes(c.cultivo).replace(/\(.*?\)/g, "").trim();
      const base = n.split(" ")[0];
      return t.includes(n) || (base.length > 3 && new RegExp("\\b" + base.replace(/[^a-z]/g, "") + "s?\\b").test(t));
    }).filter((c, i, a) => a.findIndex(x => x.cultivo === c.cultivo) === i);
  }

  function mesPedido(q) {
    const t = sinTildes(q);
    const i = NOMBRES.findIndex(n => t.includes(n));
    if (i >= 0) return i;
    if (/(ahora|este mes|hoy|actual)/.test(t)) return new Date().getMonth();
    return null;
  }

  function queSembrar(mes) {
    const si = [], sinDato = [];
    CALENDARIO.forEach(c => { const m = mesesDe(c.epoca); (m ? (m.includes(mes) && si.push(c)) : sinDato.push(c)); });
    let r = `Para ${NOMBRES[mes]}, según el calendario, se puede sembrar o trasplantar:\n` +
      (si.length ? si.map(c => `• ${c.cultivo}: ${c.epoca}`).join("\n") : "• No tengo cultivos cargados con esa época.");
    r += "\n\nEscribime el nombre de un cultivo y te doy distancias y días a cosecha.\n\n" + AVISO_NEA;
    return r;
  }

  const TEMAS = [
    { re: /(luna|menguante|creciente|lunar)/, r: "La luna y el viento son saberes tradicionales, no reglas garantizadas: las fuentes a veces se contradicen entre sí. Un ejemplo que aparece en un trabajo de la UNNE y en saberes tradicionales: sembrar lechuga en cuarto menguante, para obtener hojas grandes y que no espigue rápido. Probalo como experimento en tu huerta y anotá qué pasa." },
    { re: /(viento)/, r: "El ciclo del viento es un saber tradicional. No encontré documentación sistemática sobre el viento en Chaco y Formosa, así que no puedo darte reglas: tomalo como conocimiento de la comunidad que conviene registrar y comprobar vos misma/o." },
    { re: /(semilla|semillas)/, r: "Sobre semillas, lo que tengo en la capacitación:\n• Secalas a la sombra, con buena ventilación y al menos 10 días (no al sol directo en una chapa).\n• Para producir semillas, suspendé el riego desde la madurez o cuando las flores empiezan a secarse.\nEn la Clase 3 se ve la conservación de semillas." },
    { re: /(asociacion|asociar|rotacion|chacra|agroecolog)/, r: "La asociación de cultivos sirve para aprovechar mejor el espacio y ayudar al control de plagas. La \"chacra\" de ProHuerta asocia maíz, zapallo y poroto. La rotación y la asociación se ven en la Clase 4 (Agroecología y saberes tradicionales)." },
    { re: /(almacigo|trasplant|directa|siembra directa)/, r: "Hay tres formas: siembra directa (en el lugar definitivo), almácigo (semillero) con trasplante después, y a veces directa a golpes o a chorrillo. Por ejemplo, la zanahoria va siempre en siembra directa y nunca se trasplanta. Decime un cultivo y te digo cómo se siembra." },
    { re: /(distancia|separacion|entre plantas|entre lineas|marco)/, r: "Regla general: a mayor tamaño de la planta y ciclo más largo, mayor distancia entre plantas. Decime un cultivo y te doy los centímetros entre plantas y entre líneas (si los tengo verificados)." },
    { re: /(riego|regar|agua|goteo)/, r: "El riego y el croquis de huerta se ven en la Clase 2 de la capacitación. En mi base no tengo cantidades de riego para darte, así que prefiero no inventarlas. Una pauta sí: para producir semillas se suspende el riego desde la madurez." },
    { re: /(cosecha|cosechar)/, r: "Los métodos de cosecha se ven en la Clase 3. Si me decís un cultivo, te cuento cuántos días tarda hasta la cosecha." },
    { re: /(empezar|desde cero|armar|hacer una huerta|huerta nueva)/, r: "Para empezar, la Clase 1 de la capacitación explica cómo hacer una huerta desde cero, a menor y mayor escala. Un buen primer paso: elegí 3 o 4 cultivos de la época actual (preguntame \"qué puedo sembrar ahora\") y empezá chico." },
    { re: /(capacitacion|curso|certificado|clase)/, r: "En la sección Capacitación hay cuatro clases, una autoevaluación de 8 preguntas (se aprueba con 70 %) y, si querés, un certificado de participación en PDF." },
    { re: /(plaga|insecto|hongo|enfermedad)/, r: "Los cuidados y el manejo se ven en la Clase 3, y entre las fuentes hay un material del INTA El Colorado sobre insectos plaga en cultivos hortícolas orgánicos (mirá docs/fuentes.md). No tengo recomendaciones específicas cargadas, así que no quiero inventarlas." }
  ];

  function responder(texto) {
    const q = texto.trim();
    const t = sinTildes(q);
    if (!q) return "Escribime tu consulta.";
    if (/^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey)\b/.test(t) && t.length < 25)
      return "¡Hola! Soy BrotIA. Puedo contarte qué sembrar en cada mes, cómo y a qué distancia sembrar un cultivo, y cosas básicas de semillas y saberes tradicionales. ¿Qué querés saber?";
    if (/(ayuda|que podes|que sabes|que haces)/.test(t))
      return "Puedo ayudarte con:\n• Qué sembrar ahora o en un mes (ej.: \"qué siembro en marzo\")\n• Un cultivo (ej.: \"tomate\", \"zanahoria\")\n• Semillas, asociación de cultivos, luna y viento\n\nNo doy datos que no tenga verificados.";
    const mes = mesPedido(q);
    const cultivos = buscarCultivos(q);
    if (cultivos.length && cultivos.length <= 3) return cultivos.map(ficha).join("\n\n") + "\n\n" + AVISO_NEA;
    if (/(sembrar|siembro|siembra|plantar|planto|epoca|que puedo|que hay)/.test(t) || mes !== null)
      return queSembrar(mes !== null ? mes : new Date().getMonth());
    for (const tema of TEMAS) if (tema.re.test(t)) return tema.r;
    return "No encontré eso en mi base. Probá con el nombre de un cultivo (tomate, zapallo, acelga…), con \"qué puedo sembrar ahora\" o con temas como semillas, luna, asociación de cultivos o distancias.";
  }

  // ---- Interfaz ----
  const chat = document.getElementById("chat"), form = document.getElementById("form"),
    campo = document.getElementById("mensaje"), sugerencias = document.getElementById("sugerencias");
  function agregar(texto, clase) {
    const d = document.createElement("div"); d.className = "msg " + clase; d.textContent = texto;
    chat.appendChild(d); chat.scrollTop = chat.scrollHeight;
  }
  function preguntar(m) { agregar(m, "yo"); setTimeout(() => agregar(responder(m), "bot"), 250); }
  agregar("¡Hola! Soy BrotIA. Contame qué querés saber de tu huerta.", "bot");
  form.addEventListener("submit", e => { e.preventDefault(); const m = campo.value.trim(); if (!m) return; campo.value = ""; preguntar(m); campo.focus(); });
  ["¿Qué puedo sembrar ahora?", "Tomate", "Zanahoria", "¿Cómo guardo semillas?", "Luna y huerta"].forEach(s => {
    const b = document.createElement("button"); b.type = "button"; b.className = "sec chip"; b.textContent = s;
    b.onclick = () => preguntar(s); sugerencias.appendChild(b);
  });
})();
