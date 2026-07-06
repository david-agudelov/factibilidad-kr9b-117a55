# Evaluación RAG normativo-predial

Esta suite valida el contrato mínimo del chatbot normativo-predial antes de exponerlo como flujo de consulta. No descarga documentos, no llama OpenAI y no requiere secretos. Su primera función es impedir que los casos de evaluación contradigan `rag/sources/sources.manifest.json`; su segunda función es evaluar respuestas capturadas del chat cuando se proporcione un archivo de resultados.

## Archivos

- `rag/evals/normative-qa-cases.json`: preguntas normativas mínimas, fuentes esperadas, términos obligatorios y términos prohibidos.
- `rag/evals/spatial-qa-cases.json`: preguntas prediales que requieren resolver predio y usar capas espaciales.
- `rag/scripts/evaluateRag.ts`: arnés de evaluación local.

## Comandos

```powershell
npm run rag:evaluate
npm run rag:evaluate:normative
npm run rag:evaluate:spatial
```

Por defecto, los comandos corren en modo `static_manifest`: validan que los ids de fuentes y capas existan, que las capas espaciales sean `spatial_dataset` con `indexSpatial: true`, que las fuentes textuales no sean datasets y que ningún acto `derogado` o `compilado` aparezca como `primary_law`.

Para evaluar respuestas reales o capturadas:

```powershell
node rag/scripts/evaluateRag.ts --answers rag/evals/latest-answers.json
```

El archivo de respuestas puede ser un objeto por id o un objeto con llaves `normative` y `spatial`.

```json
{
  "normative": {
    "norm-001": {
      "status": "answered",
      "answer": "Respuesta en español...",
      "spatialFactsUsed": [],
      "citations": [],
      "warnings": ["Consulta preliminar. No reemplaza Curaduría Urbana."]
    }
  },
  "spatial": {}
}
```

## Reglas Que Hacen Fallar

El evaluador falla cuando una respuesta `answered`:

- no incluye citas si el caso las exige,
- cita una fuente no declarada en el manifest,
- contradice la familia de fuente declarada en el manifest,
- usa una fuente `derogado` o `compilado` como fuente legal primaria,
- menciona un artículo específico sin una cita con artículo coincidente,
- responde una pregunta predial sin facts espaciales requeridos,
- omite capas obligatorias del overlay,
- usa certeza legal absoluta,
- omite el disclaimer preliminar,
- declara insuficiencia sin usar la frase exacta: `No encontré soporte suficiente en los documentos y datos cargados.`

## Cobertura Normativa

Los casos normativos cubren:

- fuente legal primaria vigente,
- retrocesos y Anexo 5,
- inexistencia de un manual de retrocesos autónomo vigente,
- sostenibilidad,
- espacio público,
- diferencia entre decreto, manual, anexo y dataset,
- límite del chat frente a Curaduría,
- comportamiento sin citas,
- tratamiento de actos derogados o compilados,
- restricciones aeroportuarias y AEROPU,
- codigo arquitectonico citado: salidas, escaleras, evacuacion, proteccion contra incendios, vacios, ventanas, ventilacion e iluminacion,
- bloqueo de validacion automatica de codigo arquitectonico hasta tener motor deterministico y datos suficientes del edificio.

## Cobertura Espacial

Los casos espaciales exigen overlays para:

- tratamiento urbanístico,
- área de actividad,
- plan parcial,
- antejardín,
- suelo de reserva,
- sistema hídrico,
- suelo de protección por riesgo,
- patrimonio/BIC,
- elevación máxima/AEROPU,
- red vial y borde,
- borde urbano IDU: anden, calzada, separador, cicloruta y puente.

## Alcance

Esta suite no reemplaza evaluaciones jurídicas ni validación oficial de datasets. Tampoco comprueba calidad semántica profunda del retrieval si no se le entregan respuestas reales. El flujo recomendado es:

1. Mantener los casos alineados con `sources.manifest.json`.
2. Ejecutar `npm run rag:evaluate` como preflight local.
3. Capturar respuestas del endpoint server-side.
4. Ejecutar `node rag/scripts/evaluateRag.ts --answers <archivo>`.
5. Bloquear cualquier despliegue que falle por citas, facts espaciales, fuentes derogadas o disclaimer.
