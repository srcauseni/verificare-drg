/*
 * reguli.js — regulile de verificare a fișei înainte de statistică
 * IMSP Spitalul Raional Căușeni „Ana și Alexandru”
 *
 * Acest fișier conține DOAR reguli. Nu adăugați aici date de pacient,
 * numere de fișă sau rezultate nominale ale auditurilor.
 *
 * Cum se editează:
 *  - „potrivire”: începutul codului, fără punct și fără cratimă (ex. "I10", "E11", "9204400").
 *    Se aplică regula cu potrivirea cea mai lungă.
 *  - „logica”: "oricare" = ajunge un „Da”; "toate" = trebuie „Da” la toate;
 *    "inversa" = un „Da” declanșează verdictul de eșec (ex. cauza unei manifestări e cunoscută).
 *  - „laEsec”: verdictul când condiția nu e îndeplinită: "eliminat", "completat", "recodificat", "atentie".
 *  - După orice modificare, rulați testele (vezi README) și notați schimbarea în ISTORIC_REGULI.md.
 */
(function (root) {
  const Q_MANAGEMENT = [
    { id: "trat", text: "Tratament pentru această boală administrat sau ajustat în acest episod, vizibil în foaia de prescripții?" },
    { id: "eval", text: "Evaluare sau investigație făcută pentru această boală, cu concluzie notată în jurnal?" },
    { id: "mon",  text: "Monitorizare sau îngrijire suplimentară (peste rutina secției) notată în fișă?" }
  ];
  const Q_LABORATOR = [
    { id: "interp", text: "Medicul a interpretat valoarea anormală în jurnal (ce înseamnă clinic)?" },
    { id: "act",    text: "S-a făcut ceva pentru ea — tratament, investigație suplimentară sau control repetat — notat în fișă?" }
  ];
  const Q_CLINIC = [
    { id: "clin", text: "Diagnosticul este descris clinic în jurnal pentru acest pacient (semne, evaluare), nu doar în lista finală?" },
    { id: "act",  text: "A determinat tratament, investigații, consult sau monitorizare specifice, notate în fișă?" }
  ];

  const REGULI = {
    versiune: "1.0 · octombrie 2026",
    sursa: "Tiparele auditului extern CNAM 2026 și standardele de codificare ACS 0001, ACS 0002, ACS 0042 (formularea exactă se verifică în ediția în vigoare).",

    /* ---------- DIAGNOSTICUL PRINCIPAL ---------- */
    dpBaza: {
      intrebari: [{ id: "motiv", text: "Este afecțiunea care, după investigații, a determinat internarea (nu doar prima scrisă sau cea mai gravă)?" }],
      logica: "toate",
      laEsec: "recodificat",
      motiv: "Diagnosticul principal trebuie să fie afecțiunea stabilită, după investigații, drept cauza principală a internării (ACS 0001).",
      ceScriem: "În epicriză: motivul internării și concluzia investigațiilor care l-au confirmat."
    },
    dp: [
      { potrivire: ["J81", "E86", "E87", "R"], titlu: "Manifestare sau simptom ca diagnostic principal",
        intrebari: [{ id: "cauza", text: "Cauza acestei manifestări a fost stabilită și este documentată în fișă?" }],
        logica: "inversa", laEsec: "recodificat",
        motiv: "Când cauza e cunoscută, cauza devine diagnostic principal; manifestarea nu (la audit: edem pulmonar → angină, tulburare hidro-electrolitică → nefrită).",
        ceScriem: "Dacă etiologia NU a fost stabilită, scrieți explicit în epicriză că a rămas neprecizată." },
      { potrivire: ["K350", "K352"], titlu: "Apendicită acută cu peritonită generalizată",
        intrebari: [{ id: "perit", text: "Protocolul operator descrie explicit peritonita generalizată?" }],
        logica: "toate", laEsec: "recodificat",
        motiv: "Specificitatea se codifică doar dacă protocolul operator o descrie; altfel auditorul trece la apendicită fără precizare.",
        ceScriem: "În protocol: extinderea peritonitei, aspectul exsudatului, cadranele afectate." }
    ],

    /* ---------- DIAGNOSTICE SECUNDARE ---------- */
    dsGeneric: {
      titlu: "Diagnostic secundar",
      intrebari: Q_MANAGEMENT, logica: "oricare", laEsec: "eliminat",
      motiv: "Un diagnostic secundar se codifică doar dacă în acest episod a cerut evaluare, tratament sau monitorizare suplimentară (ACS 0002).",
      ceScriem: "Ce s-a făcut pentru această boală în această internare: prescripție, valoare urmărită, notă în jurnal."
    },
    ds: [
      /* boli cronice preluate din anamneză */
      { potrivire: ["I10"], titlu: "Hipertensiune arterială esențială", grup: "cronic",
        intrebari: Q_MANAGEMENT, logica: "oricare", laEsec: "eliminat",
        motiv: "Frecvent eliminată la audit când în fișă nu se vede managementul HTA în acest episod. Măsurarea de rutină a TA nu este suficientă.",
        ceScriem: "Valorile TA urmărite și tratamentul antihipertensiv administrat sau ajustat, notate în jurnal și în epicriză." },
      { potrivire: ["I11"], titlu: "Cardiopatie hipertensivă", grup: "cronic",
        intrebari: Q_MANAGEMENT, logica: "oricare", laEsec: "eliminat",
        motiv: "Eliminată la audit când nu exista urma managementului în episod.",
        ceScriem: "Evaluarea cardiacă (ECG, ecocardiografie cu concluzie) și tratamentul administrat." },
      { potrivire: ["I20"], titlu: "Angină pectorală", grup: "cronic",
        intrebari: Q_MANAGEMENT, logica: "oricare", laEsec: "eliminat",
        motiv: "Frecvent preluată din anamneză fără episoade sau tratament în internarea actuală.",
        ceScriem: "Episoade anginoase în această internare, ECG cu concluzie, tratament antianginos administrat." },
      { potrivire: ["I25"], titlu: "Cardiopatie ischemică cronică", grup: "cronic",
        intrebari: Q_MANAGEMENT, logica: "oricare", laEsec: "eliminat",
        motiv: "Boală cronică — se codifică doar cu urmă de management în episod.",
        ceScriem: "Evaluarea și tratamentul administrat pentru cardiopatia ischemică în această internare." },
      { potrivire: ["I48"], titlu: "Fibrilație / flutter atrial", grup: "cronic",
        intrebari: Q_MANAGEMENT, logica: "oricare", laEsec: "eliminat",
        motiv: "La audit, același diagnostic a fost acceptat sau eliminat în funcție de documentarea managementului.",
        ceScriem: "Controlul frecvenței sau al ritmului, anticoagularea, ECG cu concluzie." },
      { potrivire: ["E10", "E11", "E13", "E14"], titlu: "Diabet zaharat", grup: "cronic",
        intrebari: Q_MANAGEMENT, logica: "oricare", laEsec: "eliminat",
        motiv: "Frecvent eliminat la audit când nu se vedeau glicemiile urmărite sau tratamentul.",
        ceScriem: "Glicemiile urmărite, insulina sau antidiabeticele administrate ori ajustate." },
      { potrivire: ["E78"], titlu: "Dislipidemie", grup: "cronic",
        intrebari: Q_MANAGEMENT, logica: "oricare", laEsec: "eliminat",
        motiv: "Eliminată frecvent la audit fără urmă de management.",
        ceScriem: "Profilul lipidic interpretat și tratamentul hipolipemiant administrat sau inițiat." },
      { potrivire: ["I69"], titlu: "Sechele de boală cerebrovasculară", grup: "cronic",
        intrebari: Q_MANAGEMENT, logica: "oricare", laEsec: "eliminat",
        motiv: "Sechelele se codifică doar dacă au influențat îngrijirea în acest episod.",
        ceScriem: "Deficitul neurologic și impactul lui asupra îngrijirii (mobilizare, nursing, recuperare)." },
      { potrivire: ["J44"], titlu: "BPOC", grup: "cronic",
        intrebari: Q_MANAGEMENT, logica: "oricare", laEsec: "eliminat",
        motiv: "Boală cronică — se codifică doar cu urmă de management în episod.",
        ceScriem: "Tratamentul bronhodilatator administrat, evaluarea respiratorie." },
      { potrivire: ["K86"], titlu: "Pancreatită cronică", grup: "cronic",
        intrebari: Q_MANAGEMENT, logica: "oricare", laEsec: "eliminat",
        motiv: "Acceptată la audit doar când managementul era documentat.",
        ceScriem: "Simptome în episod, enzime interpretate, tratament (enzimatic, dietă, analgezie) notat." },

      /* valori de laborator trecute ca diagnostic */
      { potrivire: ["K752"], titlu: "Hepatită reactivă nespecifică", grup: "laborator",
        intrebari: Q_LABORATOR, logica: "toate", laEsec: "eliminat",
        motiv: "Eliminată frecvent la audit: transaminaze crescute fără interpretare și acțiune nu sunt diagnostic.",
        ceScriem: "Interpretarea în jurnal + acțiunea (control repetat, investigație, tratament)." },
      { potrivire: ["K71"], titlu: "Boală toxică a ficatului", grup: "laborator",
        intrebari: Q_LABORATOR, logica: "toate", laEsec: "eliminat",
        motiv: "Eliminată frecvent la audit fără interpretare și acțiune documentate.",
        ceScriem: "Agentul toxic suspectat, interpretarea probelor hepatice, conduita." },
      { potrivire: ["R74"], titlu: "Valori anormale ale enzimelor serice", grup: "laborator",
        intrebari: Q_LABORATOR, logica: "toate", laEsec: "eliminat",
        motiv: "Rezultat de laborator — se codifică doar dacă a schimbat conduita.",
        ceScriem: "Interpretarea și acțiunea notate în jurnal." },
      { potrivire: ["E87"], titlu: "Tulburări hidro-electrolitice sau acido-bazice", grup: "laborator",
        intrebari: Q_LABORATOR, logica: "toate", laEsec: "eliminat",
        motiv: "Eliminate la audit când erau doar valori în analize, fără corecție sau monitorizare.",
        ceScriem: "Valoarea, interpretarea și corecția administrată (soluții, electroliți), cu control." },
      { potrivire: ["E86"], titlu: "Hipovolemie / deshidratare", grup: "laborator",
        intrebari: Q_LABORATOR, logica: "toate", laEsec: "eliminat",
        motiv: "Acceptată doar când evaluarea și rehidratarea erau documentate.",
        ceScriem: "Semnele clinice de deshidratare și rehidratarea administrată." },
      { potrivire: ["D64", "D50", "D62"], titlu: "Anemie", grup: "laborator",
        intrebari: Q_LABORATOR, logica: "toate", laEsec: "eliminat",
        motiv: "Hemoglobina scăzută fără interpretare și acțiune nu este diagnostic.",
        ceScriem: "Tipul anemiei, interpretarea, tratamentul sau controlul hemoglobinei." },

      /* coduri frecvente în șabloane */
      { potrivire: ["G934"], titlu: "Encefalopatie nespecificată", grup: "sablon",
        intrebari: Q_CLINIC, logica: "toate", laEsec: "eliminat",
        motiv: "Eliminată frecvent la audit: apărea ca parte a unui set copiat.",
        ceScriem: "Tabloul neurologic concret (conștiență, orientare), evaluarea și conduita." },
      { potrivire: ["G92"], titlu: "Encefalopatie toxică", grup: "sablon",
        intrebari: Q_CLINIC, logica: "toate", laEsec: "eliminat",
        motiv: "Eliminată frecvent la audit, inclusiv la copii cu bronșiolită.",
        ceScriem: "Semnele neurologice concrete și conduita specifică." },
      { potrivire: ["M62"], titlu: "Atrofie / contractură musculară", grup: "sablon",
        intrebari: Q_CLINIC, logica: "toate", laEsec: "eliminat",
        motiv: "Eliminată frecvent la audit (șablon de bronșiolită).",
        ceScriem: "Codificați doar dacă a fost evaluată și tratată specific." },
      { potrivire: ["R"], titlu: "Simptom sau semn", grup: "sablon",
        intrebari: Q_CLINIC, logica: "toate", laEsec: "eliminat",
        motiv: "Simptomele nu se codifică atunci când fac parte din tabloul diagnosticului de bază.",
        ceScriem: "Codificați simptomul doar dacă nu e explicat de alt diagnostic și a cerut conduită proprie." },

      /* insuficiența respiratorie */
      { potrivire: ["J96"], titlu: "Insuficiență respiratorie", grup: "respirator",
        intrebari: [
          { id: "spo2",  text: "SpO₂ notată, cu precizarea „aer atmosferic” sau „pe oxigen”?" },
          { id: "fr",    text: "Frecvența respiratorie și semnele de efort respirator notate?" },
          { id: "o2",    text: "Oxigenoterapia notată cu debit, mod de administrare și durată?" },
          { id: "gaze",  text: "Gaze sanguine efectuate și interpretate?" },
          { id: "dg",    text: "Diagnosticul formulat în jurnal și în epicriză, nu doar în lista finală?" }
        ],
        logica: "j96", laEsec: "completat",
        motiv: "La audit, același cod a fost acceptat sau eliminat în funcție de dovada hipoxemiei și a tratamentului.",
        ceScriem: "SpO₂ cu precizarea aer/oxigen, FR, efortul respirator, oxigenoterapia (debit, durată), diagnosticul în jurnal." }
    ],

    /* ---------- PROCEDURI ---------- */
    proceduriRutina: [
      { cod: "5850000", denumire: "Radiografia toracică" },
      { cod: "1170000", denumire: "Electrocardiografie (ECG)" },
      { cod: "3005500", denumire: "Pansamentul plăgilor" },
      { cod: "5503600", denumire: "Ultrasonografia abdominală" },
      { cod: "5503800", denumire: "Ultrasonografia tractului urinar" },
      { cod: "9616200", denumire: "Masaj terapeutic / manipulare de țesut moale" },
      { cod: "9204300", denumire: "Medicație respiratorie prin nebulizator" },
      { cod: "9250000", denumire: "Evaluare anestezică preoperatorie de rutină" },
      { cod: "9250002", denumire: "Evaluare anestezică preoperatorie de urgență" }
    ],
    proceduriFrecventEliminate: [
      { cod: "9203600", denumire: "Inserția tubului nasogastric" },
      { cod: "9704200", denumire: "Examinarea și identificarea culturilor" },
      { cod: "1150310", denumire: "Măsurarea schimbului de gaze" },
      { cod: "5810000", denumire: "Radiografia coloanei cervicale" },
      { cod: "1420000", denumire: "Lavajul gastric" },
      { cod: "3680000", denumire: "Cateterismul vezical" }
    ],
    proceduriSuspecte: [
      { cod: "1190300", denumire: "Cistometria" },
      { cod: "1190000", denumire: "Debitmetria urinară" },
      { cod: "1383902", denumire: "Prelevarea venei glandei suprarenale" }
    ],
    debridare: {
      cod: "3002300", denumire: "Debridarea excizională a părților moi",
      intrebari: [
        { id: "tesut", text: "Protocolul descrie ce țesut a fost excizat (necrotic, devitalizat, infectat)?" },
        { id: "limita", text: "Protocolul descrie limita exciziei — până la țesut viabil, sângerând?" },
        { id: "instr", text: "Protocolul menționează instrumentul tăietor (bisturiu, foarfece)?" },
        { id: "arie", text: "Protocolul notează aria și profunzimea (straturile atinse)?" }
      ],
      logica: "toate", laEsec: "recodificat",
      motiv: "La audit, debridarea excizională fără descriere a fost recodificată în intervenții mai simple, cu pierdere mare de valoare.",
      ceScriem: "Descrierea completă a exciziei în protocolul operator."
    },
    ventilatie: {
      oxigen: { cod: "9204400", denumire: "Oxigenoterapie (alt tip de îmbogățire a aerului cu oxigen)" },
      monitorizareIntubatie: { cod: "2200701", denumire: "Monitorizarea intubației endotraheale" },
      rcp: { cod: "9205200", denumire: "Resuscitare cardio-pulmonară" },
      masajCardiac: { cod: "9205300", denumire: "Masaj cardiac închis" },
      coduri: [
        { cod: "1388200", denumire: "Ventilație mecanică continuă ≤ 24 ore", min: 0, max: 24 },
        { cod: "1388201", denumire: "Ventilație mecanică continuă > 24 și < 96 ore", min: 24, max: 96 },
        { cod: "1388202", denumire: "Ventilație mecanică continuă ≥ 96 ore", min: 96, max: Infinity }
      ],
      notaPraguri: "Pragurile de durată se verifică în ediția ACHI în vigoare."
    }
  };

  root.REGULI = REGULI;
  if (typeof module !== "undefined" && module.exports) module.exports = REGULI;
})(typeof window !== "undefined" ? window : globalThis);
