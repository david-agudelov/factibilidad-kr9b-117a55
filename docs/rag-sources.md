# Fuentes RAG normativo-predial

Este documento acompaña `rag/sources/sources.manifest.json` y define cómo se separan las fuentes del RAG normativo-predial de Bogotá. La base inicial es `deep_research_report.md`; no se descargaron documentos ni datasets en esta fase.

## Principio de uso

El chatbot no debe responder normativa con memoria general ni con fuentes secundarias. Cada respuesta debe apoyarse en documentos indexados, el manifest y facts geoespaciales generados por overlays determinísticos.

Si no existe soporte suficiente, debe responder exactamente:

```text
No encontré soporte suficiente en los documentos y datos cargados.
```

## Corpus textual

Entran al corpus textual las fuentes con `indexText: true`.

Fuentes normativas y técnicas:

- `decreto_670_2025_dot`: fuente legal primaria si el manifest la conserva como vigente.
- `anexo_05_manual_normas_comunes_2024`: fuente operativa principal para normas comunes, retrocesos, aislamientos y disposición volumétrica.
- `manual_espacio_publico_2023`: fuente técnica para espacio público, andenes, franjas y relación con borde urbano.
- `cartilla_mobiliario_urbano`: fuente técnica complementaria del Manual de Espacio Público.
- `manual_ecourbanismo_2023`: fuente técnica para sostenibilidad, ecourbanismo y construcción sostenible.
- `cartografia_decreto_componente_urbano`: mapa PDF para auditoría visual y referencia textual limitada.
- `mapa_aeropu_referencia`: mapa PDF o micrositio para auditoría visual de restricciones aeroportuarias.

Capa de codigo arquitectonico:

- `nsr10_decreto_926_2010`: fuente legal nacional que adopta la NSR-10.
- `nsr10_titulo_j_proteccion_incendios`: fuente oficial para proteccion contra incendios; estado `por_verificar` hasta confirmar version consolidada.
- `nsr10_titulo_k_requisitos_complementarios`: fuente oficial para requisitos complementarios, ocupacion, evacuacion y condiciones arquitectonicas; estado `por_verificar` hasta confirmar version consolidada.
- `nsr10_decreto_340_2012_provenance` y `nsr10_decreto_945_2017_provenance`: modificaciones vigentes de la NSR-10 usadas para trazabilidad, no como manuales autonomos.

La capa de codigo arquitectonico solo responde con citas. No valida automaticamente salidas, escaleras, vacios, ventanas, ventilacion ni iluminacion porque esa validacion requiere un motor deterministico separado y datos del edificio que el modelador actual no captura.

Documentos del proyecto:

- `project_requirements_md`
- `project_rag_implementation_plan_md`

Estos documentos solo aportan contexto del producto y de implementación. No pueden contradecir ni reemplazar fuentes oficiales.

## Índice espacial

Entran al índice espacial las fuentes con `indexSpatial: true`. Estas capas no deben indexarse como texto principal ni citarse como artículos normativos. Su función es producir `SpatialFacts` auditables mediante overlays.

Capas base y catastrales:

- `pot_555_gdb_compendio`
- `mapa_referencia_bogota`
- `lote_bogota`
- `predios_bogota`
- `placa_domiciliaria_bogota`
- `ideca_catalogos_objetos_mapa_referencia` queda como provenance de esquema para entender catalogos de predio, lote, placa, construccion, uso y sector catastral. No es capa de overlay ni fuente normativa.

Capas urbanísticas:

- `area_urbanistica_bogota`
- `barrio_legalizado_bogota`
- `tratamiento_urbanistico_pot`
- `area_actividad_pot`
- `sector_uso_residencial_pot`
- `antejardin_pot`
- `rango_edificabilidad_desarrollo_pot`
- `plan_parcial_pot`
- `actuacion_estrategica_pot`

Capas de afectaciones, sistemas y restricciones:

- `suelo_reserva_pot`
- `red_infraestructura_vial_pot`
- `eep_sistema_hidrico_pot`
- `suelo_proteccion_riesgo_pot`
- `eep_areas_protegidas_sinap_dc_pot`
- `bic_zona_influencia_pot`
- `bic_bien_interes_cultural_pot`
- `area_elevacion_maxima_pot`
- `aeropuerto_influencia_indirecta_pot`

Capas IDU de borde urbano:

- `idu_anden_bogota`
- `idu_calzada_bogota`
- `idu_separador_bogota`
- `idu_cicloruta_bogota`
- `idu_puente_bogota`
- `idu_estado_superficial_bogota`

Estas fuentes IDU deben producir facts espaciales sobre el frente y borde vial. No entran al vector store textual principal y no deben citarse como articulos normativos.

El resultado espacial debe diferenciar hechos calculados, interpretación normativa y advertencias. El LLM no debe calcular intersecciones ni resolver geometría.

## Provenance

Quedan como provenance no textual las fuentes con `ragRole: "provenance"` e `indexText: false`.

- `decreto_263_2023_provenance`
- `decreto_582_2023_provenance`
- `decreto_466_2024_provenance`
- `ideca_catalogos_objetos_mapa_referencia`

Estas fuentes sirven para trazabilidad histórica, origen de manuales o anexos y revisión jurídica. No deben usarse como `primary_law` si están derogadas o compiladas. Para respuestas normativas vigentes, debe prevalecer el Decreto 670 de 2025 si el manifest lo marca como vigente.

Los modificatorios vigentes de la NSR-10 (`nsr10_decreto_340_2012_provenance` y `nsr10_decreto_945_2017_provenance`) conservan `ragRole: "provenance"` pero `indexText: true` para permitir trazabilidad citada del codigo arquitectonico. No deben presentarse como manuales autonomos ni como reemplazo del Decreto 926 de 2010 y los titulos tecnicos aplicables.

## Por verificar

Campos vacíos como `checksum`, `localPath` e `ingestedAt` indican que todavía no hay descarga ni ingesta local. Antes de indexar, cada fuente debe verificar:

- que la URL oficial siga activa,
- que el estado legal coincida con el manifest,
- que el archivo descargado tenga checksum,
- que los documentos PDF conserven versión y fecha,
- que los datasets mantengan sistema de referencia, fecha de dato y metadatos.

Los mapas PDF pueden servir para auditoría visual o referencia textual limitada, pero la operación predial debe venir de datasets vectoriales.

## Scripts de ingesta

La primera versión de ingesta vive en:

- `rag/scripts/downloadSources.ts`
- `rag/scripts/prepareTextCorpus.ts`
- `rag/scripts/prepareSpatialCorpus.ts`

Comandos npm:

```powershell
npm run rag:download
npm run rag:prepare:text
npm run rag:prepare:spatial
npm run rag:prepare
```

`rag:download` descarga únicamente fuentes documentales con `download: true`, familia `legal`, `manual`, `annex`, `map` o `project_doc`, y estado `vigente`, `no_aplica` o `por_verificar`. Los actos `derogado` o `compilado` quedan fuera de descarga como fuente legal primaria.

`rag:prepare:text` extrae texto desde archivos ya descargados o desde `localPath` cuando se trate de documentos del proyecto. Escribe texto plano en `rag/processed/text` y chunks JSONL en `rag/processed/chunks`.

`rag:prepare:spatial` no descarga datasets pesados por defecto. Lee archivos colocados en `rag/raw/spatial`, normaliza GeoJSON cuando sea posible y escribe índice de metadata en `rag/processed/spatial-index`. Los datasets grandes deben manejarse server-side, fuera del bundle público de Vite.

## Estado inicial de ingesta

Estado al crear los pipelines: no se han descargado documentos ni datasets. La columna de errores queda vacía porque todavía no se ejecutó una descarga real.

| Fuente | Ubicación local esperada | Estado de descarga/preparación | Errores | Razón de omisión o inclusión |
|---|---|---|---|---|
| `decreto_670_2025_dot` | `rag/raw/legal/decreto_670_2025_dot.html` -> `rag/processed/text/decreto_670_2025_dot.txt` | pendiente de descarga |  | fuente textual autorizada |
| `anexo_05_manual_normas_comunes_2024` | `rag/raw/manuals/anexo_05_manual_normas_comunes_2024.pdf` -> `rag/processed/text/anexo_05_manual_normas_comunes_2024.txt` | pendiente de descarga |  | fuente textual autorizada |
| `manual_espacio_publico_2023` | `rag/raw/manuals/manual_espacio_publico_2023.pdf` -> `rag/processed/text/manual_espacio_publico_2023.txt` | pendiente de descarga |  | fuente textual autorizada |
| `cartilla_mobiliario_urbano` | `rag/raw/manuals/cartilla_mobiliario_urbano.html` -> `rag/processed/text/cartilla_mobiliario_urbano.txt` | pendiente de descarga |  | fuente textual autorizada |
| `manual_ecourbanismo_2023` | `rag/raw/manuals/manual_ecourbanismo_2023.pdf` -> `rag/processed/text/manual_ecourbanismo_2023.txt` | pendiente de descarga |  | fuente textual autorizada |
| `cartografia_decreto_componente_urbano` | `rag/raw/maps/cartografia_decreto_componente_urbano.html` -> `rag/processed/text/cartografia_decreto_componente_urbano.txt` | pendiente de descarga |  | fuente textual autorizada |
| `mapa_aeropu_referencia` | `rag/raw/maps/mapa_aeropu_referencia.pdf` -> `rag/processed/text/mapa_aeropu_referencia.txt` | pendiente de descarga |  | fuente textual autorizada |
| `decreto_263_2023_provenance` | no aplica | omitida |  | provenance; no `primary_law` |
| `decreto_582_2023_provenance` | no aplica | omitida |  | provenance; no `primary_law` |
| `decreto_466_2024_provenance` | no aplica | omitida |  | provenance; no `primary_law` |
| `pot_555_gdb_compendio` | `rag/raw/spatial/pot_555_gdb_compendio.gdb` -> `rag/processed/spatial-index/pot_555_gdb_compendio.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `mapa_referencia_bogota` | `rag/raw/spatial/mapa_referencia_bogota.gpkg` -> `rag/processed/spatial-index/mapa_referencia_bogota.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `lote_bogota` | `rag/raw/spatial/lote_bogota.geojson` -> `rag/processed/spatial-index/lote_bogota.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `predios_bogota` | `rag/raw/spatial/predios_bogota.shp` -> `rag/processed/spatial-index/predios_bogota.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `placa_domiciliaria_bogota` | `rag/raw/spatial/placa_domiciliaria_bogota.geojson` -> `rag/processed/spatial-index/placa_domiciliaria_bogota.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `area_urbanistica_bogota` | `rag/raw/spatial/area_urbanistica_bogota.geojson` -> `rag/processed/spatial-index/area_urbanistica_bogota.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `barrio_legalizado_bogota` | `rag/raw/spatial/barrio_legalizado_bogota.geojson` -> `rag/processed/spatial-index/barrio_legalizado_bogota.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `tratamiento_urbanistico_pot` | `rag/raw/spatial/tratamiento_urbanistico_pot.geojson` -> `rag/processed/spatial-index/tratamiento_urbanistico_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `area_actividad_pot` | `rag/raw/spatial/area_actividad_pot.geojson` -> `rag/processed/spatial-index/area_actividad_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `sector_uso_residencial_pot` | `rag/raw/spatial/sector_uso_residencial_pot.geojson` -> `rag/processed/spatial-index/sector_uso_residencial_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `antejardin_pot` | `rag/raw/spatial/antejardin_pot.geojson` -> `rag/processed/spatial-index/antejardin_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `rango_edificabilidad_desarrollo_pot` | `rag/raw/spatial/rango_edificabilidad_desarrollo_pot.geojson` -> `rag/processed/spatial-index/rango_edificabilidad_desarrollo_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `plan_parcial_pot` | `rag/raw/spatial/plan_parcial_pot.geojson` -> `rag/processed/spatial-index/plan_parcial_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `actuacion_estrategica_pot` | `rag/raw/spatial/actuacion_estrategica_pot.geojson` -> `rag/processed/spatial-index/actuacion_estrategica_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `suelo_reserva_pot` | `rag/raw/spatial/suelo_reserva_pot.geojson` -> `rag/processed/spatial-index/suelo_reserva_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `red_infraestructura_vial_pot` | `rag/raw/spatial/red_infraestructura_vial_pot.geojson` -> `rag/processed/spatial-index/red_infraestructura_vial_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `eep_sistema_hidrico_pot` | `rag/raw/spatial/eep_sistema_hidrico_pot.geojson` -> `rag/processed/spatial-index/eep_sistema_hidrico_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `suelo_proteccion_riesgo_pot` | `rag/raw/spatial/suelo_proteccion_riesgo_pot.geojson` -> `rag/processed/spatial-index/suelo_proteccion_riesgo_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `eep_areas_protegidas_sinap_dc_pot` | `rag/raw/spatial/eep_areas_protegidas_sinap_dc_pot.geojson` -> `rag/processed/spatial-index/eep_areas_protegidas_sinap_dc_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `bic_zona_influencia_pot` | `rag/raw/spatial/bic_zona_influencia_pot.geojson` -> `rag/processed/spatial-index/bic_zona_influencia_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `bic_bien_interes_cultural_pot` | `rag/raw/spatial/bic_bien_interes_cultural_pot.geojson` -> `rag/processed/spatial-index/bic_bien_interes_cultural_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `area_elevacion_maxima_pot` | `rag/raw/spatial/area_elevacion_maxima_pot.geojson` -> `rag/processed/spatial-index/area_elevacion_maxima_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `aeropuerto_influencia_indirecta_pot` | `rag/raw/spatial/aeropuerto_influencia_indirecta_pot.geojson` -> `rag/processed/spatial-index/aeropuerto_influencia_indirecta_pot.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial; no se descarga ni indexa como texto |
| `ideca_catalogos_objetos_mapa_referencia` | no aplica | omitida |  | provenance de esquema; no es norma ni overlay |
| `idu_anden_bogota` | `rag/raw/spatial/idu_anden_bogota.geojson` -> `rag/processed/spatial-index/idu_anden_bogota.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial IDU; no se indexa como texto |
| `idu_calzada_bogota` | `rag/raw/spatial/idu_calzada_bogota.geojson` -> `rag/processed/spatial-index/idu_calzada_bogota.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial IDU; no se indexa como texto |
| `idu_separador_bogota` | `rag/raw/spatial/idu_separador_bogota.geojson` -> `rag/processed/spatial-index/idu_separador_bogota.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial IDU; no se indexa como texto |
| `idu_cicloruta_bogota` | `rag/raw/spatial/idu_cicloruta_bogota.geojson` -> `rag/processed/spatial-index/idu_cicloruta_bogota.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial IDU; no se indexa como texto |
| `idu_puente_bogota` | `rag/raw/spatial/idu_puente_bogota.geojson` -> `rag/processed/spatial-index/idu_puente_bogota.geojson` | metadata-only hasta proveer archivo local |  | dataset espacial IDU; no se indexa como texto |
| `idu_estado_superficial_bogota` | `rag/raw/spatial/idu_estado_superficial_bogota.csv` -> `rag/processed/spatial-index/idu_estado_superficial_bogota.geojson` | metadata-only hasta definir join espacial |  | dataset IDU asociado a calzada/SIGIDU; no se indexa como texto |
| `nsr10_decreto_926_2010` | `rag/raw/legal/nsr10_decreto_926_2010.pdf` -> `rag/processed/text/nsr10_decreto_926_2010.txt` | pendiente de descarga |  | fuente textual autorizada para NSR-10 |
| `nsr10_titulo_j_proteccion_incendios` | `rag/raw/legal/nsr10_titulo_j_proteccion_incendios.pdf` -> `rag/processed/text/nsr10_titulo_j_proteccion_incendios.txt` | pendiente de descarga y verificacion de version |  | fuente textual de codigo arquitectonico |
| `nsr10_titulo_k_requisitos_complementarios` | `rag/raw/legal/nsr10_titulo_k_requisitos_complementarios.pdf` -> `rag/processed/text/nsr10_titulo_k_requisitos_complementarios.txt` | pendiente de descarga y verificacion de version |  | fuente textual de codigo arquitectonico |
| `nsr10_decreto_340_2012_provenance` | `rag/raw/legal/nsr10_decreto_340_2012_provenance.pdf` -> `rag/processed/text/nsr10_decreto_340_2012_provenance.txt` | pendiente de descarga |  | modificatorio NSR-10; trazabilidad |
| `nsr10_decreto_945_2017_provenance` | `rag/raw/legal/nsr10_decreto_945_2017_provenance.pdf` -> `rag/processed/text/nsr10_decreto_945_2017_provenance.txt` | pendiente de descarga |  | modificatorio NSR-10; trazabilidad |
| `project_deep_research_report` | no aplica | omitida |  | contexto base del manifest; no se indexa para respuestas |
| `project_requirements_md` | `rag/raw/project-docs/project_requirements_md.md` -> `rag/processed/text/project_requirements_md.txt` | pendiente de preparación local |  | documento local de proyecto |
| `project_rag_implementation_plan_md` | `rag/raw/project-docs/project_rag_implementation_plan_md.md` -> `rag/processed/text/project_rag_implementation_plan_md.txt` | pendiente de preparación local |  | documento local de proyecto |
| `project_rag_sources_md` | no aplica | omitida |  | documento de gobierno del manifest; no se indexa para respuestas |

## Estrategia para archivos espaciales grandes

Los datasets vectoriales grandes no deben entrar al bundle frontend ni al directorio `public`. Si un archivo excede el umbral operativo del script o no es GeoJSON/JSON, la normalización queda diferida y debe resolverse con:

- simplificación geométrica controlada,
- filtro por bbox,
- clipping al área de interés,
- almacenamiento externo,
- lazy loading server-side.

## Manual de retrocesos

`manual_de_retrocesos` no debe usarse como id principal porque el deep research no encontró un documento autónomo oficial vigente con ese nombre. La equivalencia funcional del tema de retrocesos se debe resolver con:

- `anexo_05_manual_normas_comunes_2024`,
- `antejardin_pot`,
- `area_elevacion_maxima_pot`,
- otros facts espaciales aplicables al predio.

Esto evita que el RAG cite una fuente inexistente o informal cuando debe citar artículos, tablas, capítulos o datasets oficiales.

## Manual de urbanismo

`manual_de_urbanismo` tampoco debe usarse como id principal. El deep research indica que ese nombre no apareció como manual autónomo vigente del POT actual. Debe reemplazarse por fuentes oficiales específicas según la pregunta:

- `decreto_670_2025_dot` para fuente legal primaria,
- `anexo_05_manual_normas_comunes_2024` para normas comunes y disposición edificatoria,
- `manual_espacio_publico_2023` para espacio público,
- `manual_ecourbanismo_2023` para sostenibilidad,
- datasets POT y catastrales para hechos espaciales del predio.

Usar fuentes específicas mejora la citabilidad, reduce ambigüedad y evita que el chatbot convierta nombres genéricos en autoridad normativa.
