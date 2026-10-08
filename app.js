/* app.js — legătura dintre formular, motor și afișare. Nu salvează și nu trimite nimic. */
(function () {
  const M = window.MotorDRG, R = window.REGULI;
  const $ = id => document.getElementById(id);
  let rasp = {};
  const segVal = { ati: "nu", ventilat: "necunoscut" };

  const EXEMPLU = {
    codIntern: "EXEMPLU", zilePat: 9, sectia: "Terapie", ati: "da", ventilat: "da",
    ventStart: "2026-03-02T22:00", ventStop: "2026-03-07T01:00", oreVentilatie: "",
    dp: "J18.0", ds: "I10\nJ96.0\nG93.4\nK75.2\nE87.4\nI50.0", proc: "58500-00\n11700-00\n92044-00\n92052-00"
  };

  function citesteCaz() {
    return {
      codIntern: $("codIntern").value.trim(), zilePat: $("zilePat").value, sectia: $("sectia").value,
      ati: segVal.ati, ventilat: segVal.ventilat,
      ventStart: $("ventStart").value, ventStop: $("ventStop").value, oreVentilatie: $("oreVentilatie").value,
      dp: $("dp").value, ds: $("ds").value, proc: $("proc").value
    };
  }

  function setSeg(camp, v) {
    segVal[camp] = v;
    document.querySelectorAll(`.seg[data-camp="${camp}"] button`).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
    if (camp === "ventilat") $("ventBloc").hidden = v !== "da";
  }

  function el(tag, attrs, ...copii) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") e.className = v;
      else if (k.startsWith("data-")) e.setAttribute(k, v);
      else e[k] = v;
    }
    for (const c of copii) if (c != null) e.append(c);
    return e;
  }

  function randeaza() {
    const caz = citesteCaz();
    const rez = M.evalueaza(caz, rasp);
    const lista = $("lista");
    const activ = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.cheie : null;
    lista.innerHTML = "";
    $("gol").hidden = rez.randuri.length > 0;
    $("sumar").hidden = rez.randuri.length === 0;
    $("risc").hidden = !rez.riscDRG;

    const sumar = $("sumar"); sumar.innerHTML = "";
    const ordine = Object.entries(M.VERDICTE).sort((a, b) => a[1].ordine - b[1].ordine);
    for (const [k, v] of ordine) if (rez.sumar[k]) sumar.append(el("span", { class: "pastila v-" + k, textContent: `${rez.sumar[k]} · ${v.eticheta.toLowerCase()}` }));

    for (const r of rez.randuri) {
      const st = el("span", { class: "stampila v-" + r.verdict, textContent: M.VERDICTE[r.verdict].eticheta });
      const titlu = el("div", {},
        el("div", { class: "zona", textContent: r.zona }),
        el("span", { class: "cod", textContent: r.cod }),
        r.denumire ? el("span", { class: "den", textContent: r.denumire }) : null);
      const corp = el("div", { class: "corp" });
      if (r.intrebari.length) {
        const ul = el("ul", { class: "intrebari" });
        for (const qq of r.intrebari) {
          const seg = el("div", { class: "seg", role: "group" });
          seg.setAttribute("aria-label", qq.text);
          for (const [v, t] of [["da", "Da"], ["nu", "Nu"]]) {
            const b = el("button", { type: "button", textContent: t, "data-v": v, "data-cheie": qq.id + "|" + v });
            b.setAttribute("aria-pressed", String(qq.val === v));
            b.addEventListener("click", () => { rasp[qq.id] = rasp[qq.id] === v ? undefined : v; randeaza(); });
            seg.append(b);
          }
          ul.append(el("li", {}, el("span", { textContent: qq.text }), seg));
        }
        corp.append(ul);
      }
      if (r.motiv) corp.append(el("p", { class: "motiv", textContent: r.motiv }));
      if (r.ceScriem && r.verdict !== "ok" && r.verdict !== "info") corp.append(el("p", { class: "scriem" }, el("b", { textContent: "Ce scriem în fișă: " }), r.ceScriem));
      lista.append(el("li", { class: `linie v-${r.verdict}-l` }, titlu, st, corp));
    }
    if (activ) { const b = lista.querySelector(`[data-cheie="${CSS.escape(activ)}"]`); if (b) b.focus(); }
    return { caz, rez };
  }

  function copiaza() {
    const { caz, rez } = randeaza();
    const text = M.raportText(caz, rez);
    const gata = () => { const b = $("btnCopiaza"); const t = b.textContent; b.textContent = "Copiat"; setTimeout(() => (b.textContent = t), 1800); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(gata, () => rezerva(text, gata));
    else rezerva(text, gata);
  }
  function rezerva(text, gata) {
    const ta = el("textarea", { value: text }); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.append(ta); ta.select();
    try { document.execCommand("copy"); gata(); } finally { ta.remove(); }
  }

  function umple(c) {
    for (const k of ["codIntern", "zilePat", "sectia", "ventStart", "ventStop", "oreVentilatie", "dp", "ds", "proc"]) $(k).value = c[k] ?? "";
    setSeg("ati", c.ati || "nu"); setSeg("ventilat", c.ventilat || "necunoscut");
  }

  document.querySelectorAll(".seg[data-camp]").forEach(g => g.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return; setSeg(g.dataset.camp, b.dataset.v); randeaza();
  }));
  ["codIntern", "zilePat", "sectia", "ventStart", "ventStop", "oreVentilatie", "dp", "ds", "proc"].forEach(id => $(id).addEventListener("input", randeaza));
  $("btnExemplu").addEventListener("click", () => { rasp = {}; umple(EXEMPLU); randeaza(); });
  $("btnNou").addEventListener("click", () => {
    rasp = {}; umple({ codIntern: "", zilePat: "", sectia: "", ati: "nu", ventilat: "necunoscut", dp: "", ds: "", proc: "" }); randeaza(); $("codIntern").focus();
  });
  $("btnCopiaza").addEventListener("click", copiaza);
  $("btnTipar").addEventListener("click", () => {
    const { caz } = randeaza();
    $("tiparCap").textContent = `Cod intern: ${caz.codIntern || "—"} · Secția: ${caz.sectia || "—"} · Zile-pat: ${caz.zilePat || "—"} · Data verificării: ${new Date().toLocaleDateString("ro-RO")}`;
    window.print();
  });
  $("versiune").textContent = `Reguli: versiunea ${R.versiune}. ${R.sursa}`;
  randeaza();
})();
