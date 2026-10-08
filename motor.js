/*
 * motor.js — aplică regulile din reguli.js asupra unui caz.
 * Funcție pură: nu trimite nimic în rețea și nu salvează nimic.
 */
(function (root) {
  const R = root.REGULI || (typeof require !== "undefined" ? require("./reguli.js") : null);

  const VERDICTE = {
    ok:          { eticheta: "Susținut",              ordine: 5 },
    info:        { eticheta: "Fără regulă specifică", ordine: 6 },
    nedecis:     { eticheta: "Răspundeți la întrebări", ordine: 4 },
    atentie:     { eticheta: "De verificat",           ordine: 3 },
    completat:   { eticheta: "De completat în fișă",   ordine: 2 },
    recodificat: { eticheta: "De recodificat",         ordine: 1 },
    eliminat:    { eticheta: "De eliminat",            ordine: 0 }
  };

  function norm(c) { return String(c || "").toUpperCase().replace(/[\s.\-+*†‡]/g, ""); }
  function esteICD(n) { return /^[A-Z]\d{2,5}$/.test(n); }
  function esteACHI(n) { return /^\d{7}$/.test(n); }
  function afisare(n) {
    if (esteICD(n)) return n.length > 3 ? n.slice(0, 3) + "." + n.slice(3) : n;
    if (esteACHI(n)) return n.slice(0, 5) + "-" + n.slice(5);
    return n;
  }
  function parseLista(text) {
    return String(text || "")
      .split(/[\n,;]+/)
      .map(s => norm(s.trim().split(/\s+/)[0]))
      .filter(Boolean);
  }
  function regulaPotrivita(lista, cod) {
    let best = null;
    for (const r of lista) for (const p of r.potrivire) {
      if (cod.startsWith(p) && (!best || p.length > best.len)) best = { r, len: p.length };
    }
    return best ? best.r : null;
  }
  function q(prefix, intrebari, rasp) {
    return intrebari.map(x => ({ id: prefix + ":" + x.id, text: x.text, val: rasp[prefix + ":" + x.id] }));
  }
  function aplicaLogica(tip, qs) {
    const v = qs.map(x => x.val);
    const da = k => (qs.find(x => x.id.endsWith(":" + k)) || {}).val === "da";
    const nu = k => (qs.find(x => x.id.endsWith(":" + k)) || {}).val === "nu";
    if (tip === "oricare") {
      if (v.includes("da")) return "ok";
      if (v.length && v.every(x => x === "nu")) return "esec";
      return "nedecis";
    }
    if (tip === "toate") {
      if (v.length && v.every(x => x === "da")) return "ok";
      if (v.includes("nu")) return "esec";
      return "nedecis";
    }
    if (tip === "inversa") {
      if (v.includes("da")) return "esec";
      if (v.length && v.every(x => x === "nu")) return "ok";
      return "nedecis";
    }
    if (tip === "j96") {
      if (da("spo2") && (da("o2") || da("gaze")) && da("dg")) return "ok";
      if (nu("spo2") && nu("gaze")) return "eliminat";
      if (v.includes("nu")) return "esec";
      return "nedecis";
    }
    return "nedecis";
  }
  function oreIntre(start, stop) {
    if (!start || !stop) return null;
    const a = new Date(start), b = new Date(stop);
    if (isNaN(a) || isNaN(b) || b <= a) return null;
    return Math.round((b - a) / 36e5 * 10) / 10;
  }

  function categorieVent(ore) {
    const c = R.ventilatie.coduri;
    if (ore <= 24) return c[0];
    if (ore < 96) return c[1];
    return c[2];
  }

  function evalueaza(caz, rasp) {
    rasp = rasp || {};
    const dp = norm(caz.dp);
    const ds = parseLista(caz.ds);
    const pr = parseLista(caz.proc);
    const toateDg = [dp, ...ds].filter(Boolean);
    const randuri = [];
    const V = R.ventilatie;

    /* ---- diagnostic principal ---- */
    if (dp) {
      const spec = regulaPotrivita(R.dp, dp);
      const qsBaza = q("DP:" + dp, R.dpBaza.intrebari, rasp);
      const rand = { zona: "Diagnostic principal", cod: afisare(dp), denumire: spec ? spec.titlu : "", intrebari: [], verdict: "nedecis", motiv: "", ceScriem: "" };
      let rezSpec = null;
      if (spec) {
        const qsSpec = q("DP:" + dp, spec.intrebari, rasp);
        rand.intrebari.push(...qsSpec);
        rezSpec = aplicaLogica(spec.logica, qsSpec);
        if (rezSpec === "esec") {
          Object.assign(rand, { verdict: spec.laEsec, motiv: spec.motiv, ceScriem: spec.ceScriem });
        }
      }
      if (rand.verdict === "nedecis") {
        rand.intrebari.push(...qsBaza);
        const rb = aplicaLogica(R.dpBaza.logica, qsBaza);
        if (rb === "esec") Object.assign(rand, { verdict: R.dpBaza.laEsec, motiv: R.dpBaza.motiv, ceScriem: R.dpBaza.ceScriem });
        else if (rb === "ok" && (!spec || rezSpec === "ok")) Object.assign(rand, { verdict: "ok", motiv: spec ? spec.ceScriem : "Afecțiunea care a motivat internarea." });
        else rand.motiv = R.dpBaza.motiv;
      }
      if (!esteICD(dp)) Object.assign(rand, { verdict: "atentie", motiv: "Codul nu are formatul ICD-10 (literă + cifre)." });
      randuri.push(rand);
    }

    /* ---- diagnostice secundare ---- */
    const vazute = new Set();
    for (const cod of ds) {
      if (cod === dp) {
        randuri.push({ zona: "Diagnostic secundar", cod: afisare(cod), denumire: "", intrebari: [], verdict: "eliminat", motiv: "Același cod ca diagnosticul principal.", ceScriem: "" });
        continue;
      }
      if (vazute.has(cod)) {
        randuri.push({ zona: "Diagnostic secundar", cod: afisare(cod), denumire: "", intrebari: [], verdict: "eliminat", motiv: "Cod introdus de două ori.", ceScriem: "" });
        continue;
      }
      vazute.add(cod);
      if (/^[VWXY]\d/.test(cod)) {
        randuri.push({ zona: "Diagnostic secundar", cod: afisare(cod), denumire: "Cauză externă", intrebari: [], verdict: "ok",
          motiv: "Cod de cauză externă — se codifică împreună cu traumatismul sau intoxicația, fără criteriile de management.", ceScriem: "" });
        continue;
      }
      const reg = regulaPotrivita(R.ds, cod) || R.dsGeneric;
      const qs = q("DS:" + cod, reg.intrebari, rasp);
      const rez = aplicaLogica(reg.logica, qs);
      const rand = { zona: "Diagnostic secundar", cod: afisare(cod), denumire: reg.titlu, intrebari: qs, verdict: "nedecis", motiv: reg.motiv, ceScriem: reg.ceScriem };
      if (rez === "ok") Object.assign(rand, { verdict: "ok", motiv: "Există urma managementului în fișă." });
      else if (rez === "esec") rand.verdict = reg.laEsec;
      else if (rez === "eliminat") rand.verdict = "eliminat";
      if (!esteICD(cod)) Object.assign(rand, { verdict: "atentie", motiv: "Codul nu are formatul ICD-10 (literă + cifre)." });
      randuri.push(rand);
    }

    /* ---- combinația HTA + insuficiență cardiacă ---- */
    const areHTA = toateDg.some(c => c === "I10" || c.startsWith("I119"));
    const areIC = toateDg.some(c => c.startsWith("I50") || c === "I519");
    if (areHTA && areIC && !toateDg.some(c => c.startsWith("I110"))) {
      const qs = q("COMB:I11", [{ id: "etio", text: "Etiologia insuficienței cardiace / cardiopatiei este scrisă explicit ca NEhipertensivă (ischemică, valvulară, alta)?" }], rasp);
      const rez = aplicaLogica("toate", qs);
      const dpIC = dp.startsWith("I50") || dp === "I519";
      const rand = { zona: "Combinație de coduri", cod: "HTA + IC", denumire: "Hipertensiune + insuficiență cardiacă / cardiopatie", intrebari: qs, verdict: "nedecis",
        motiv: "La audit, combinația a fost recodificată consecvent în I11.0 (cardiopatie hipertensivă cu insuficiență cardiacă). Regula exactă se verifică în ICD-10-AM.",
        ceScriem: "Etiologia insuficienței cardiace, explicit, în diagnosticul clinic și în epicriză." };
      if (rez === "ok") Object.assign(rand, { verdict: "ok", motiv: "Etiologia documentată susține codurile separate." });
      else if (rez === "esec") Object.assign(rand, { verdict: "recodificat", motiv: "Combinați în I11.0." + (dpIC ? " Diagnosticul principal se schimbă — efect important asupra DRG." : "") + " Regula exactă se verifică în ICD-10-AM." });
      randuri.push(rand);
    }

    /* ---- cauza externă la traumatisme ---- */
    const areTrauma = toateDg.some(c => /^[ST]/.test(c));
    const areCauza = toateDg.some(c => /^[VWXY]/.test(c));
    if (areTrauma && !areCauza) {
      randuri.push({ zona: "Combinație de coduri", cod: "V01–Y98", denumire: "Cauză externă", intrebari: [], verdict: "completat",
        motiv: "Traumatism sau intoxicație fără cod de cauză externă (la audit, CNAM a adăugat un astfel de cod).",
        ceScriem: "Mecanismul și locul producerii traumatismului, în anamneză și epicriză." });
    }

    /* ---- proceduri ---- */
    const ventCoduri = V.coduri.map(x => x.cod);
    const areVentCod = pr.some(c => ventCoduri.includes(c));
    const ventilat = caz.ventilat || "necunoscut";
    const ore = caz.oreVentilatie != null && caz.oreVentilatie !== "" ? Number(caz.oreVentilatie) : oreIntre(caz.ventStart, caz.ventStop);
    const vazuteP = new Set();
    for (const cod of pr) {
      if (vazuteP.has(cod)) { randuri.push({ zona: "Procedură", cod: afisare(cod), denumire: "", intrebari: [], verdict: "eliminat", motiv: "Cod introdus de două ori.", ceScriem: "" }); continue; }
      vazuteP.add(cod);
      const rand = { zona: "Procedură", cod: afisare(cod), denumire: "", intrebari: [], verdict: "info", motiv: "Verificați că protocolul sau fișa descriu procedura.", ceScriem: "" };
      const rut = R.proceduriRutina.find(x => x.cod === cod);
      const frec = R.proceduriFrecventEliminate.find(x => x.cod === cod);
      const susp = R.proceduriSuspecte.find(x => x.cod === cod);
      const vc = V.coduri.find(x => x.cod === cod);
      if (rut) Object.assign(rand, { denumire: rut.denumire, verdict: "eliminat", motiv: "Procedură de rutină — de regulă nu se codifică (ACS 0042; verificați lista în vigoare)." });
      else if (frec) Object.assign(rand, { denumire: frec.denumire, verdict: "atentie", motiv: "Eliminată frecvent la audit. Codificați doar dacă o regulă de codificare o cere în acest context." });
      else if (susp) {
        const qs = q("PR:" + cod, [{ id: "real", text: "Procedura a fost efectiv efectuată și este descrisă în fișă?" }], rasp);
        const rez = aplicaLogica("toate", qs);
        Object.assign(rand, { denumire: susp.denumire, intrebari: qs, verdict: rez === "ok" ? "ok" : rez === "esec" ? "eliminat" : "nedecis",
          motiv: "Cod ales frecvent greșit din listă (apărea fără legătură cu cazul)." });
      }
      else if (cod === R.debridare.cod) {
        const qs = q("PR:" + cod, R.debridare.intrebari, rasp);
        const rez = aplicaLogica(R.debridare.logica, qs);
        Object.assign(rand, { denumire: R.debridare.denumire, intrebari: qs, verdict: rez === "ok" ? "ok" : rez === "esec" ? R.debridare.laEsec : "nedecis",
          motiv: R.debridare.motiv, ceScriem: R.debridare.ceScriem });
      }
      else if (cod === V.oxigen.cod || cod === V.monitorizareIntubatie.cod) {
        const den = cod === V.oxigen.cod ? V.oxigen.denumire : V.monitorizareIntubatie.denumire;
        if (ventilat === "da") Object.assign(rand, { denumire: den, verdict: "recodificat", motiv: "Pacientul a fost ventilat mecanic: se codifică ventilația (13882-0x după durată), nu acest cod. La audit, exact această eroare a fost cea mai scumpă." });
        else if (ventilat === "necunoscut" && caz.ati === "da") Object.assign(rand, { denumire: den, verdict: "atentie", motiv: "Pacient din ATI: verificați în fișa ATI dacă a existat ventilație mecanică." });
        else if (cod === V.monitorizareIntubatie.cod) Object.assign(rand, { denumire: den, verdict: "atentie", motiv: "Monitorizarea intubației fără ventilație documentată a fost eliminată la audit." });
        else Object.assign(rand, { denumire: den, verdict: "ok", motiv: "Fără ventilație mecanică documentată — oxigenoterapia poate rămâne." });
      }
      else if (cod === V.masajCardiac.cod && pr.includes(V.rcp.cod)) Object.assign(rand, { denumire: V.masajCardiac.denumire, verdict: "eliminat", motiv: "Masajul cardiac este inclus în resuscitarea cardio-pulmonară codificată." });
      else if (cod === V.rcp.cod) {
        Object.assign(rand, { denumire: V.rcp.denumire, verdict: "ok", motiv: "Resuscitare documentată." });
        if (!areVentCod && ventilat !== "nu") Object.assign(rand, { verdict: "atentie", motiv: "Resuscitare fără cod de ventilație: verificați dacă a urmat intubare și ventilație mecanică." });
      }
      else if (vc) {
        Object.assign(rand, { denumire: vc.denumire, verdict: "ok", motiv: V.notaPraguri });
        if (ventilat === "nu") Object.assign(rand, { verdict: "atentie", motiv: "Cod de ventilație, dar în datele cazului ventilația este marcată „Nu”." });
        else if (ore == null) Object.assign(rand, { verdict: "completat", motiv: "Lipsesc orele de început și de sfârșit ale ventilației — durata nu poate fi verificată.", ceScriem: "Data și ora intubării/conectării și a extubării/deconectării; durata totală în ore." });
        else {
          const corect = categorieVent(ore);
          if (corect && corect.cod !== cod) Object.assign(rand, { verdict: "recodificat", motiv: `Durata calculată: ${ore} ore → ${afisare(corect.cod)}. ${V.notaPraguri}` });
          else Object.assign(rand, { motiv: `Durata calculată: ${ore} ore — corespunde. ${V.notaPraguri}` });
        }
      }
      if (!esteACHI(cod)) Object.assign(rand, { verdict: "atentie", motiv: "Codul nu are formatul ACHI (7 cifre, ex. 92044-00)." });
      randuri.push(rand);
    }

    /* ---- ventilație documentată, dar necodificată ---- */
    if (ventilat === "da" && !areVentCod) {
      let motiv = "Ventilația mecanică documentată nu este codificată. Adăugați codul 13882-0x în funcție de durată.";
      let verdict = "recodificat";
      if (ore == null) { verdict = "completat"; motiv += " Lipsesc orele — durata nu poate fi stabilită."; }
      else {
        const corect = categorieVent(ore);
        motiv += ` Durata calculată: ${ore} ore → ${afisare(corect.cod)} (${corect.denumire}).`;
      }
      randuri.push({ zona: "Ventilație", cod: "13882-0x", denumire: "Ventilație mecanică necodificată", intrebari: [], verdict, motiv: motiv + " " + V.notaPraguri,
        ceScriem: "În epicriză: „VAP de la [data, ora] până la [data, ora], total [N] ore”." });
    }
    if (caz.ati === "da" && ventilat === "necunoscut") {
      randuri.push({ zona: "Ventilație", cod: "ATI", denumire: "Pacient trecut prin ATI", intrebari: [], verdict: "atentie",
        motiv: "Completați câmpul „Ventilație mecanică” din datele cazului după verificarea fișei ATI.", ceScriem: "" });
    }

    /* ---- sumar ---- */
    const sumar = {};
    for (const k of Object.keys(VERDICTE)) sumar[k] = 0;
    for (const r of randuri) sumar[r.verdict]++;
    const riscDRG = randuri.some(r => r.zona === "Diagnostic secundar" && r.verdict === "eliminat")
      || randuri.some(r => r.verdict === "recodificat");
    return { randuri, sumar, riscDRG, oreVentilatie: ore };
  }

  function raportText(caz, rez) {
    const L = [];
    L.push("VERIFICAREA FIȘEI ÎNAINTE DE STATISTICĂ");
    L.push(`Cod intern: ${caz.codIntern || "—"} · Secția: ${caz.sectia || "—"} · Zile-pat: ${caz.zilePat || "—"} · ATI: ${caz.ati || "—"} · Ventilație: ${caz.ventilat || "—"}${rez.oreVentilatie != null ? " (" + rez.oreVentilatie + " ore)" : ""}`);
    L.push("");
    for (const r of rez.randuri) {
      L.push(`[${VERDICTE[r.verdict].eticheta.toUpperCase()}] ${r.zona}: ${r.cod}${r.denumire ? " — " + r.denumire : ""}`);
      if (r.motiv) L.push("   Motiv: " + r.motiv);
      if (r.ceScriem && r.verdict !== "ok") L.push("   Ce scriem: " + r.ceScriem);
    }
    L.push("");
    if (rez.riscDRG) L.push("Atenție: eliminările sau recodificările pot schimba grupa sau nivelul DRG.");
    L.push(`Reguli: versiunea ${R.versiune}. Verdictul este o predicție a auditului, nu o decizie; decizia finală aparține medicului și codificatorului.`);
    return L.join("\n");
  }

  const API = { evalueaza, raportText, norm, afisare, parseLista, VERDICTE };
  root.MotorDRG = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
