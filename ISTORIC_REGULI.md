# Istoricul regulilor

Fiecare modificare a fișierului `reguli.js` se notează aici: data, ce s-a schimbat, de ce, cine a aprobat.

| Versiune | Data | Modificare | Motiv | Aprobat |
|---|---|---|---|---|
| 1.0 | 2026-10-08 | Prima versiune: diagnostic principal (ACS 0001), diagnostice secundare (boli cronice, valori de laborator, coduri din șabloane, J96), combinația HTA + insuficiență cardiacă, cauza externă, proceduri de rutină, debridarea excizională, ventilația mecanică. | Tiparele auditului extern CNAM 2026. | de completat |

## Modificări ale programului (fără schimbarea regulilor)

| Data | Modificare | Motiv |
|---|---|---|
| 2026-10-08 | Citirea codurilor: mai multe coduri pe un rând, separate prin spațiu; virgulă zecimală (E11,9); litere chirilice identice cu cele latine; denumire după cod în câmpul diagnosticului principal; cratimă cu spații la ACHI (92044 - 00). Avertisment când câmpul diagnosticului principal conține mai multe coduri. 0 ore de ventilație sunt tratate ca durată lipsă. | Testare pe pagina publicată: codurile scrise după primul de pe un rând erau ignorate fără avertisment. |
