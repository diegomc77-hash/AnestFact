# Roadmap — autorizaciones y documentos EVWEB por mutual

_Regla de negocio confirmada con Diego (2026-09-24). Implementación: Ticket 11 en `docs/AVISO_INFRA_GRANTS_MIGRACION.md`._

## Tabla de mutuales (docs al encolar / avisar)

| Mutual | Fojas (Qx + Anestésica) | Autorización (`docs.auth`) |
|---|---|---|
| **PAMI** | Obligatorias, bajadas de **Geclisa**. La cola **no** las autogenera. | **No** lleva. No avisar ni bloquear por auth. |
| **ART y demás** (todas salvo APROSS) en flujo Geclisa | Obligatorias desde Geclisa (reales). Sin autogen. | Manual (foto/PDF) → `docs.auth`. |
| **APROSS** | **No lleva fojas.** No bloquear ni avisar por qx/anest. | Solo auth. Sale de **Traditum** en 2 pasos (cirugía → anestesia); por ahora manual y se sube a `docs.auth` igual. |

## Institución

| Sanatorio | Autogen PDF anestésica (`afGenerateAnestDocForEvweb`) |
|---|---|
| **Hospital Aeronáutico** | Permitido, **solo** si falta `docs.anest` y la mutual no es APROSS. Debe pasar por modal `afConfirmAdjunto` (Ticket 11c). |
| **Institución Geclisa** (p.ej. Mayo) | **Nunca** autogenerar. Exigir fojas reales (salvo APROSS). |

## Relacionado

- Cola / validate / lista: `js/40-evweb-queue.js`
- Chequeo paciente en form ADAARC: `chrome-extension-geclisa-batch/content/evweb.js` + `background.js` (Ticket 11a)
- Traditum (código futuro): `docs/ROADMAP_ESCALAMIENTO.md` § P4
