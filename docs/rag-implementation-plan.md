# Agentic RAG Normativo-Predial V2

## Resumen ejecutivo

La V2 agrega un chatbot normativo-predial al modelador existente sin cambiar el motor normativo, geometrico ni de metricas. El chatbot responde solo con soporte en documentos oficiales indexados, documentos del proyecto, fuentes declaradas en manifest y facts geoespaciales deterministas.

La arquitectura es hibrida: los documentos responden "que manda" y "como se aplica"; el motor espacial responde "donde aplica". Si una respuesta normativa no puede citar fuentes y facts suficientes, debe responder exactamente: `No encontré soporte suficiente en los documentos y datos cargados.`

## Arquitectura recomendada

### MVP

- Frontend React: panel `NormativeChatPanel` como cliente sin secretos. Solo envia preguntas al backend y muestra respuestas, citas, facts espaciales y estado de soporte.
- Backend privado `server/rag`: orquesta intencion, resolucion predial, facts espaciales, retrieval documental y politica de respuesta.
- File Search de OpenAI: primera capa de retrieval documental gestionado. La API key vive solo en servidor.
- Manifest `data/rag/manifest/sources.manifest.json`: unica lista autorizada de fuentes oficiales, documentos del proyecto y datasets espaciales.
- Motor espacial `server/spatial`: consume facts derivados desde `data/spatial/facts/`. El LLM no calcula intersecciones.
- Scripts `scripts/rag` y `scripts/spatial`: validan manifest, preparan ingesta documental y generan/validan facts.

### Futuro

- PostGIS para overlays y versionado espacial multi-predio.
- pgvector o Qdrant para embeddings propios cuando se requiera control fino de chunking, filtros y auditoria.
- LangGraph solo cuando el flujo necesite pasos durables, revision humana, memoria, reintentos o multiples herramientas.
- LangChain queda como opcion para loaders o prototipos, no como dependencia base del MVP.

## Decisiones descartadas

- RAG en frontend: expone secretos y debilita control de fuentes.
- Variables `VITE_*` para secretos: prohibido.
- LangChain/LangGraph en MVP: complejidad prematura.
- Vector DB propia en MVP: se pospone hasta validar fuentes, chunking y citas.
- Razonamiento espacial por LLM: prohibido; los overlays deben ser reproducibles.
- Respuestas normativas sin citas: prohibidas.

## Diagrama de carpetas

```text
server/
  rag/
    answerPolicy.ts
    citations.ts
    intent.ts
    query.ts
    retrieval.ts
  spatial/
    overlayFacts.ts
    resolveParcel.ts
data/
  rag/
    manifest/sources.manifest.json
    documents/.gitkeep
  spatial/
    raw/.gitkeep
    processed/.gitkeep
    facts/KR9B_117A55.json
scripts/
  rag/
    ingestDocuments.ts
    validateManifest.ts
  spatial/
    buildParcelFacts.ts
    ingestSpatialLayers.ts
src/
  rag/
    ragClient.ts
    types.ts
  components/
    NormativeChatPanel.tsx
```

## Flujo textual

1. Validar que cada documento esta declarado en el manifest con `id`, autoridad, URL oficial, estado legal, familia, prioridad, formato, fecha y checksum cuando exista archivo local.
2. Descargar o registrar documentos oficiales desde el manifest.
3. Extraer texto con metadatos de pagina/seccion cuando aplique.
4. Indexar solo fuentes con `ragEligible: true`.
5. Guardar el identificador del vector store en variable server-only `OPENAI_VECTOR_STORE_ID`.
6. En retrieval, filtrar por familia de fuente: legal primaria, manual/anexo, cartografia, proyecto o dataset.
7. No construir respuesta normativa si no hay citas verificables.

## Flujo espacial

1. Resolver entrada por predio, CHIP, direccion o caso base.
2. Normalizar geometria oficial en EPSG:4686 o reproyectar de forma explicita si una fuente llega en otro sistema.
3. Ejecutar overlays deterministas contra lote, predios, tratamiento, area de actividad, antejardin, plan parcial, reserva, riesgo, EEP, patrimonio y restricciones aeronauticas.
4. Exportar `SpatialFacts` con valor, capa fuente, fecha de dato, metodo de overlay y nivel de confianza operativo.
5. El chatbot solo lee facts; no intersecta geometria en tiempo de respuesta.

## Flujo agentic

```text
pregunta
-> detectIntent
-> resolveParcel
-> getSpatialFacts
-> retrieveDocuments
-> enforceAnswerPolicy
-> respuesta citada o fallback
```

El agente puede clasificar intenciones como `normative`, `spatial`, `project`, `mixed` o `unsupported`. Para consultas mixtas, los facts espaciales acotan el retrieval documental. Para consultas sin soporte, la respuesta queda bloqueada por politica.

## Variables de entorno

Server-only:

- `OPENAI_API_KEY`: requerida para File Search y Responses API.
- `OPENAI_VECTOR_STORE_ID`: requerida cuando se habilita retrieval documental remoto.
- `RAG_MODEL`: opcional; default definido por servidor.
- `RAG_SOURCE_MANIFEST_PATH`: opcional; default `data/rag/manifest/sources.manifest.json`.
- `RAG_SPATIAL_FACTS_PATH`: opcional; default `data/spatial/facts`.
- `RAG_ALLOWED_ORIGINS`: opcional para CORS del backend.

Frontend publicas:

- `VITE_RAG_ENABLED`: muestra u oculta el panel.
- `VITE_RAG_ENDPOINT`: URL publica del endpoint backend.

Nunca usar `VITE_*` para secretos.

## Riesgos

- Fuentes oficiales cambiantes: mitigar con manifest, fecha, URL, estado legal y checksum.
- PDF con tablas o graficos: validar extraccion y citar pagina/seccion.
- Citas insuficientes: bloquear respuesta.
- Predio ambiguo: pedir precision o devolver fallback.
- Datasets grandes: no publicar datos crudos; producir facts auditables.
- File Search con control limitado: aceptable para MVP, no para auditoria avanzada.

## Criterios de validacion

- `npm test`, `npm run lint` y `npm run build` pasan.
- No hay `OPENAI_API_KEY` ni secretos en frontend.
- El chatbot no calcula geometria ni metricas.
- Toda respuesta soportada incluye citas.
- Sin citas suficientes se devuelve el fallback exacto.
- El manifest valida ids unicos, fuentes oficiales y rutas locales existentes.
- Los facts espaciales indican fuente, metodo y fecha.
- La UI no muestra datos oficiales como sliders ni altera el modelador vivo.

## Fases de implementacion

1. Manifest, tipos y policy de respuesta.
2. Facts espaciales deterministas para `KR9B_117A55`.
3. Orquestador RAG server-side sin dependencia de UI.
4. Scripts de validacion e ingesta sin descargar datos pesados al repo.
5. Panel React conectado por cliente sin secretos.
6. File Search real con `OPENAI_VECTOR_STORE_ID`.
7. PostGIS/pgvector y LangGraph solo cuando el MVP haya sido validado.
