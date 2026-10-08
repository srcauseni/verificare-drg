// Rulare: node teste/run.js   (din dosarul proiectului)
// Verifică că regulile dau verdictele așteptate pe cazuri INVENTATE.
const path = require("path");
const fs = require("fs");
require(path.join(__dirname, "..", "reguli.js"));
const M = require(path.join(__dirname, "..", "motor.js"));

const cazuri = JSON.parse(fs.readFileSync(path.join(__dirname, "cazuri.json"), "utf8"));
let ok = 0, esec = 0;
for (const t of cazuri) {
  const rez = M.evalueaza(t.caz, t.raspunsuri);
  const erori = [];
  for (const [cod, v] of Object.entries(t.asteptat || {})) {
    const r = rez.randuri.find(x => x.cod === cod);
    if (!r) erori.push(`lipsește rândul ${cod}`);
    else if (r.verdict !== v) erori.push(`${cod}: așteptat ${v}, obținut ${r.verdict} (${r.motiv})`);
  }
  for (const [cod, text] of Object.entries(t.contine || {})) {
    const r = rez.randuri.find(x => x.cod === cod);
    if (!r || !r.motiv.includes(text)) erori.push(`${cod}: motivul nu conține „${text}”`);
  }
  for (const cod of t.lipseste || []) {
    if (rez.randuri.some(x => x.cod === cod)) erori.push(`${cod}: rândul nu trebuia să apară`);
  }
  for (const [verdict, n] of Object.entries(t.numar || {})) {
    if (rez.sumar[verdict] !== n) erori.push(`numărul de „${verdict}”: așteptat ${n}, obținut ${rez.sumar[verdict]}`);
  }
  const raport = M.raportText({ codIntern: "TEST" }, rez);
  if (!raport.includes("VERIFICAREA FIȘEI")) erori.push("raportul text nu s-a generat");
  if (erori.length) { esec++; console.log("✗ " + t.nume); erori.forEach(e => console.log("    " + e)); }
  else { ok++; console.log("✓ " + t.nume); }
}
console.log(`\n${ok} trecute, ${esec} eșuate, din ${cazuri.length}`);
process.exit(esec ? 1 : 0);
