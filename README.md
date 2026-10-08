# Verificarea fișei înainte de statistică

Instrument intern al IMSP Spitalul Raional Căușeni „Ana și Alexandru” pentru autocontrolul codificării (ICD-10-AM / ACHI / DRG) înainte ca fișa să fie trimisă la statistică.

Pagina publicată: `https://srcauseni.github.io/verificare-drg/`

## Cum se folosește

1. Introduceți codurile cazului: diagnosticul principal, diagnosticele secundare, intervențiile și procedurile. Marcați dacă pacientul a trecut prin ATI și dacă a fost ventilat mecanic.
2. Pentru fiecare cod apar întrebările pe care le-ar pune auditorul. Răspundeți cu ce **scrie** în fișă — ce nu e scris nu există pentru audit.
3. Citiți verdictul pe fiecare cod: susținut, de eliminat, de recodificat, de completat în fișă sau de verificat. Copiați raportul sau tipăriți-l.

## Confidențialitate

- Pagina nu trimite nimic în rețea (politica de securitate a paginii blochează orice conexiune) și nu salvează nimic. Datele dispar la închiderea paginii.
- Nu introduceți nume, IDNP sau numărul real al fișei; folosiți un cod intern.
- **În acest repository nu se încarcă niciodată date de pacient:** nici fișe, nici extrase, nici fișierele CNAM, nici tabele cu numere de fișă. Repository-ul este public.

## Ce verifică

- **Diagnosticul principal:** afecțiunea care, după investigații, a determinat internarea; manifestări folosite ca diagnostic principal când cauza e cunoscută; specificitatea neconfirmată de protocol.
- **Diagnosticele secundare:** urma managementului în episod (tratament, investigație, monitorizare) — boli cronice copiate din anamneză, valori de laborator trecute ca diagnostic, coduri frecvente în șabloane, insuficiența respiratorie fără dovada hipoxemiei.
- **Combinații:** hipertensiune + insuficiență cardiacă (I11.0); lipsa codului de cauză externă la traumatisme; duplicate.
- **Proceduri:** proceduri de rutină care nu se codifică, coduri alese greșit, debridarea excizională descrisă incomplet.
- **Ventilația mecanică:** oxigenoterapie sau monitorizarea intubației codificate în locul ventilației, ventilație necodificată, categoria de durată după ore.

## Ce nu face

- Nu citește fișa: verifică doar ce declară cel care o completează.
- Nu garantează codul exact ICD-10-AM / ACHI: se verifică în clasificarea în vigoare.
- Nu decide: verdictul este o predicție a auditului. Decizia aparține medicului curant și codificatorului.
- Nu caută coduri care cresc ICM-ul. Semnalează subcodificarea doar când fișa o susține.

## Cum se actualizează regulile

1. Deschideți `reguli.js` pe GitHub → creionul „Edit”.
2. Modificați regula (instrucțiunile sunt la începutul fișierului) și salvați cu „Commit changes”.
3. Verificați bifa verde din fila **Actions**: testele din `teste/` au trecut. Dacă e roșie, deschideți rezultatul și corectați.
4. Notați modificarea în `ISTORIC_REGULI.md`.

Testele se pot rula și local: `node teste/run.js`. Cazurile de test sunt **inventate**.

## Publicare

Settings → Pages → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.

## Fișiere

| Fișier | Rol |
|---|---|
| `index.html` | Pagina |
| `app.js` | Legătura dintre formular și reguli |
| `motor.js` | Aplică regulile asupra unui caz |
| `reguli.js` | Regulile — singurul fișier care se editează de obicei |
| `teste/` | Cazuri de test inventate și rularea lor |
| `sablon-extras-anonimizat.md` | Șablon pentru verificarea detaliată a cazurilor grele |
| `ISTORIC_REGULI.md` | Ce s-a schimbat în reguli, când și de ce |
