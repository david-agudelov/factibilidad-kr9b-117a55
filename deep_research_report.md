# Fuentes oficiales para un RAG normativo predial en Bogotá

## Resumen ejecutivo

Considera que, para responder con fiabilidad sobre la factibilidad urbanística de un predio en Bogotá, tu RAG no debería apoyarse en un único “manual”, sino en una **capa legal principal** y una **capa espacial operativa**. La capa legal principal hoy la encabeza el **Decreto 670 de 2025**, que expide el Decreto Único Distrital de Ordenamiento Territorial, mientras que varias reglamentaciones relevantes de 2023 y 2024 quedaron **derogadas y compiladas** allí, aunque sus manuales y anexos siguen siendo claves como fuentes operativas y de interpretación técnica. En paralelo, la capa espacial operativa debe cruzar el predio contra datasets oficiales de **lote, predios, área urbanística, tratamiento urbanístico, área de actividad, antejardín, plan parcial, reservas, riesgo, patrimonio, sistema hídrico y restricciones aeroportuarias**. citeturn37search0turn29search1turn5search12turn49search0turn43search0turn30view0turn35view0turn35view1turn35view2turn17search1turn17search0

La investigación apunta a una conclusión práctica: **un RAG predial en Bogotá debe ser híbrido, no solo textual**. Si indexas únicamente PDFs o HTML normativos, el chatbot fallará precisamente en las preguntas más frecuentes de factibilidad: tratamiento, área de actividad, afectación por plan parcial, patrimonio, riesgo, aeropuerto, vías o antejardín. La información oficial disponible en Datos Abiertos Bogotá y en los servicios distritales está suficientemente estructurada para permitir overlays espaciales, y los principales datasets POT revisados comparten metadatos homogéneos, formatos descargables y referencia espacial **EPSG:4686 MAGNA-SIRGAS geographic 2D**, lo que simplifica la orquestación geoespacial. citeturn8view0turn31view0turn36view0turn36view1turn36view2turn36view3turn30view3

También hay una conclusión importante sobre tus términos de trabajo. En las fuentes oficiales actuales sí aparecen con claridad el **Manual de Espacio Público**, el **Manual de Ecourbanismo y Construcción Sostenible** y el **Anexo 5 Manual de Normas Comunes a los Tratamientos Urbanísticos**; en cambio, **no apareció con claridad un “manual de retrocesos” autónomo vigente**. Lo que sí aparece es que el tema de retrocesos se encuentra absorbido dentro del **Anexo 5** y sus actualizaciones, además de capas como **Antejardín** y el mapa **AEROPU** para restricciones de altura/implantación. El término “manual de urbanismo”, como título vigente autónomo del POT actual, tampoco emergió con claridad en sitios distritales; los resultados oficiales remiten más bien a manuales específicos y a antecedentes históricos. citeturn12search3turn12search8turn23search0turn48search1turn17search1turn50search0turn50search3turn50search8turn50search10turn50search12

Por último, para operación del sistema, conviene distinguir entre **fuentes de verificación** y **fuentes de verdad documental**. **SINUPOT** es muy útil como interfaz pública y como referencia para consultar por **dirección catastral actual o CHIP**, pero no debería ser tu único backend documental. Y **SISJUR** es indispensable para trazabilidad jurídica, aunque la propia página advierte que la información allí contenida tiene carácter informativo; por eso, para el RAG conviene guardar siempre el vínculo al acto y, cuando exista, el PDF o anexo oficial asociado. citeturn27search9turn27search3turn37search10turn24search0

## Criterio de selección

La selección que sigue prioriza cuatro cosas: **vigencia o compilación legal comprobable**, **capacidad para responder preguntas prediales concretas**, **disponibilidad oficial y trazable** y **utilidad técnica para ETL/RAG**. En la práctica, eso favorece un núcleo compuesto por decreto compilador + manuales vigentes + datasets geográficos oficiales + cartografía/layouts oficiales del POT. citeturn37search0turn39search2turn43search0turn41search0turn42search0

En la parte geoespacial, la situación es favorable para un pipeline serio. Los datasets POT revisados exponen formatos como **Esri REST, GeoJSON, GPKG, SHP, KMZ y DXF**, y sus metadatos enlazan a **diccionarios de datos** y **catálogos de objetos** distritales. En el caso catastral/IDECA, además existen catálogos específicos para **Lote, Predio, Construcción, Uso, Sector Catastral y Placa Domiciliaria**, lo que te permite fijar esquemas estables y no “adivinar” columnas durante el ETL. citeturn8view0turn36view0turn36view1turn36view2turn36view3turn31view0turn33search2turn34search0turn34search3

En licencias y restricciones también hay una diferencia operativa útil. Los datasets de Datos Abiertos Bogotá revisados muestran **Creative Commons Attribution 4.0**, lo cual facilita ingestion, versionado y reutilización interna del RAG. En cambio, para los textos jurídicos, la regla prudente es conservar el **acto oficial, la URL de consulta y el hash/documento fuente**, y no depender solo del HTML intermedio de SISJUR. citeturn8view0turn30view0turn30view2turn30view3turn37search10

## Equivalencias oficiales de términos del proyecto

La siguiente tabla aterriza tus etiquetas de trabajo a las fuentes oficiales que realmente aparecieron en la investigación.

| Término de proyecto | Hallazgo oficial | Evaluación | Fuente oficial sugerida | Soporte |
|---|---|---|---|---|
| Manual de urbanismo | No apareció con claridad como manual vigente autónomo del POT actual; los resultados oficiales actuales remiten a manuales específicos. | **Por verificar** como nombre vigente; no usarlo como id de fuente principal. | Sustituir por `manual_espacio_publico_2023` + `anexo_05_manual_normas_comunes_2024` + `decreto_670_2025_dot`. | Ver citeturn50search0turn50search3turn50search8turn50search12 |
| Manual de retrocesos | No apareció como documento autónomo; el tema sí aparece dentro del **Anexo 5** y de su actualización, además de capas como **Antejardín** y mapas POT/AEROPU. | **Equivalencia funcional clara**. | `anexo_05_manual_normas_comunes_2024` + `antejardin_pot` + `area_elevacion_maxima_pot`. | Ver citeturn12search3turn12search8turn23search0turn48search1turn17search1 |
| Manual de sostenibilidad | El equivalente oficial vigente sí aparece con claridad. | **Equivalencia clara**. | `manual_ecourbanismo_2023`. | Ver citeturn28search1turn28search3turn50search10 |
| Consulta por predio/CHIP | Sí aparece como flujo oficial de consulta. | **Debe entrar al flujo del RAG agentic**. | Resolver entrada por dirección catastral o CHIP y cruzar geometría con datasets oficiales. | Ver citeturn27search9turn30view0turn34search4 |
| Cartografía/layouts oficiales | Sí aparecen como documentos oficiales del POT. | **Necesarios**, sobre todo para trazabilidad y revisión humana. | `cartografia_decreto_componente_urbano` y, si aplica, `cartografia_decreto_componente_rural`. | Ver citeturn41search0turn41search1turn42search0turn42search1 |

## Documentos, anexos y planos candidatos

### Norma base y manuales

| id sugerido | Título exacto | Autoridad emisora | URL oficial | Tipo | Fecha / versión | Estado legal | Resumen de contenido | Relevancia para factibilidad | Ref. espaciales | Formato disponible | Prioridad | Licencia / restricción | Soporte |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `decreto_670_2025_dot` | Decreto 670 de 2025 | Alcaldía Mayor de Bogotá D.C. | `https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=191905` | decreto | 2025-12-27 | vigente | Expide el Decreto Único Distrital de Ordenamiento Territorial; actúa como compilador del régimen urbanístico vigente. | Es la **fuente jurídica primaria** que debe prevalecer en respuestas normativas. | Sí, por incorporación/relación con cartografía y anexos. | HTML; SISJUR normalmente enlaza PDF/anexos asociados. | alta | Fuente pública de consulta; SISJUR advierte carácter informativo, así que conviene guardar acto y anexo oficial. | Ver citeturn37search0turn37search10 |
| `decreto_263_2023_provenance` | Decreto 263 de 2023 | Alcaldía Mayor de Bogotá D.C. | `https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=143258` | decreto | 2023-06-21 | derogado | Adoptó el Manual de Espacio Público y su Cartilla de Mobiliario Urbano. | Útil como **proveniencia normativa** del manual, pero no como acto principal vigente. | Sí. | HTML; documentos asociados en SISJUR. | media | Usar para trazabilidad histórica y documental. | Ver citeturn29search1turn39search2 |
| `manual_espacio_publico_2023` | Manual de Espacio Público de Bogotá D.C. | Alcaldía Mayor de Bogotá D.C. / Secretaría Distrital de Planeación | `https://www.sdp.gov.co/sites/default/files/generales/manual_espacio_publico_2023_c.pdf` | manual | 2023 | vigente | Manual técnico de diseño e intervención del espacio público peatonal y del sistema de movilidad; fija criterios de accesibilidad, vitalidad, seguridad y conectividad. | Responde dudas sobre andenes, franjas, implantación contra vía, espacio público adyacente y diseño de borde. | Sí. | PDF; también listado documental SISJUR. | alta | Fuente pública oficial; conservar PDF exacto y metadatos. | Ver citeturn39search2turn39search3turn39search6turn14search16 |
| `cartilla_mobiliario_urbano` | Anexo Cartilla de Mobiliario Urbano | Alcaldía Mayor de Bogotá D.C. / Secretaría Distrital de Planeación | `https://www.alcaldiabogota.gov.co/sisjur/normas/admin_norma_doc.jsp?i=143258` | anexo | 2023 | vigente | Anexo del Manual de Espacio Público con piezas, criterios y catálogos de mobiliario urbano. | Relevante cuando el predio exige intervención en borde urbano, espacio público o urbanismo de cesiones. | Sí. | PDF listado en SISJUR. | media | Conviene indexarlo separado por capítulo/ficha. | Ver citeturn39search2 |
| `decreto_582_2023_provenance` | Decreto 582 de 2023 | Alcaldía Mayor de Bogotá D.C. | `https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=151925` | decreto | 2023-12-06 | derogado | Reglamentó ecourbanismo y construcción sostenible; SISJUR muestra que fue derogado y compilado por el Decreto 670 de 2025, **con excepción del anexo**. | Útil como proveniencia del manual ECOS y para trazabilidad de artículos específicos. | Sí. | HTML | media | No usar como primera capa legal; usarlo para enlazar manual y antecedentes. | Ver citeturn5search12turn28search8 |
| `manual_ecourbanismo_2023` | Manual de Ecourbanismo y Construcción Sostenible | Alcaldía Mayor de Bogotá D.C. / Secretaría Distrital de Planeación | `https://www.sdp.gov.co/sites/default/files/manual_ecourb_const.pdf` | manual | 2023 | vigente | Instrumento técnico para guiar ciudadanía y sector constructor en agua, energía, bienestar, reverdecimiento, materiales y residuos. | Es la fuente principal para consultas de “sostenibilidad” del proyecto. | Sí. | PDF | alta | Fuente pública oficial; conviene indexar por capítulo, tipología y medida obligatoria/incentivo. | Ver citeturn28search1turn28search3turn50search10 |
| `decreto_466_2024_provenance` | Decreto 466 de 2024 | Alcaldía Mayor de Bogotá D.C. | `https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=170937` | decreto | 2024-12-24 | derogado | Actualizó, complementó y precisó el Anexo 5 “Manual de Normas Comunes a los Tratamientos Urbanísticos”; luego fue derogado y compilado por el Decreto 670 de 2025. | Es la proveniencia inmediata del ajuste de normas comunes, incluidas reglas asociadas a retrocesos y disposición edificatoria. | Sí. | HTML / gaceta PDF | media | Mantener por trazabilidad, no como fuente primaria vigente. | Ver citeturn13search2turn49search0 |
| `anexo_05_manual_normas_comunes_2024` | ACTUALIZACIÓN ANEXO No. 5: MANUAL DE NORMAS COMUNES A LOS TRATAMIENTOS URBANÍSTICOS | Secretaría Distrital de Planeación / Alcaldía Mayor de Bogotá D.C. | `https://www.sdp.gov.co/sites/default/files/actualizacion_anexo_5_final_201120241_0.pdf` | anexo | actualización 2024 | vigente | Manual operativo del POT para forma, disposición, aislamientos, cubiertas, terrazas, retrocesos y otras reglas comunes a varios tratamientos. | Es probablemente la **fuente más importante después del decreto** para preguntas prediales concretas de edificabilidad y disposición volumétrica. | Sí. | PDF | alta | Fuente pública oficial; requiere chunking cuidadoso por tabla, artículo y caso gráfico. | Ver citeturn38search0turn38search2turn38search9turn50search14 |

### Planos y cartografía oficial

| id sugerido | Título exacto | Autoridad emisora | URL oficial | Tipo | Fecha / versión | Estado legal | Resumen de contenido | Relevancia para factibilidad | Ref. espaciales | Formato disponible | Prioridad | Licencia / restricción | Soporte |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `cartografia_decreto_componente_urbano` | Cartografía del decreto - componente urbano | Alcaldía Mayor de Bogotá D.C. / Secretaría Distrital de Planeación | `https://www.alcaldiabogota.gov.co/sisjur/normas/admin_norma_doc.jsp?i=119582` | mapa | 2021-12-30 | vigente | Compendio oficial de mapas del componente urbano y de expansión urbana del POT. | Fundamental para verificación humana y auditoría del RAG frente a layouts oficiales. | Sí. | PDF | alta | Recomendable almacenar PDF y, si es posible, sus mapas individualizados. | Ver citeturn41search0turn41search1 |
| `cartografia_decreto_componente_rural` | Cartografía del decreto - componente rural | Alcaldía Mayor de Bogotá D.C. / Secretaría Distrital de Planeación | `https://www.alcaldiabogota.gov.co/sisjur/normas/admin_norma_doc.jsp?i=119582` | mapa | 2021-12-30 | vigente | Mapas oficiales del componente rural del POT. | Necesario si el predio es rural, periurbano o toca borde rural. | Sí. | PDF | media | Para predios netamente urbanos puede entrar en una segunda ola. | Ver citeturn42search0turn42search1 |
| `cartografia_decreto_componente_rural_riesgo` | Cartografía del decreto - componente rural riesgo | Alcaldía Mayor de Bogotá D.C. / Secretaría Distrital de Planeación | `https://www.alcaldiabogota.gov.co/sisjur/normas/admin_norma_doc.jsp?i=119582` | mapa | 2021-12-30 | vigente | Mapas oficiales de riesgo en componente rural. | Relevante para predios rurales o en borde con afectaciones ambientales/riesgo. | Sí. | PDF | media | Indexar solo si tu cobertura incluye suelo rural. | Ver citeturn42search1 |
| `mapa_aeropu_referencia` | Mapa de SECTORIZACIÓN DE OBSTÁCULOS POR ALTURA DEL ESPACIO AÉREO DE BOGOTÁ – AEROPU | Secretaría Distrital de Planeación | `https://www.sdp.gov.co/micrositios/pot/decreto-pot-bogota-2021` | mapa | POT vigente en micrositio | vigente | Mapa oficial referido por el micrositio POT para restricciones por altura del espacio aéreo. | Muy relevante para volumetría y altura cerca de corredores del sistema aeroportuario. | Sí. | PDF / micrositio | alta | Puede coexistir con el dataset vectorial de elevación máxima; conviene indexar ambos. | Ver citeturn48search1turn17search1 |

## Datasets, GeoJSON y capas espaciales candidatas

Antes de la tabla, una observación técnica importante: los datasets POT revisados de la SDP exponen, de manera consistente, **Esri REST, GeoJSON, GPKG, SHP, KMZ y DXF**, reportan **EPSG:4686 MAGNA-SIRGAS geographic 2D**, y enlazan a un **diccionario de datos** y un **catálogo de objetos**. En términos de RAG, eso significa que puedes montar una capa geoespacial reproducible y, además, versionar metadatos y esquemas con mucha más disciplina que en un scraping libre. En UAECD/IDECA ocurre algo similar, con catálogos específicos para los objetos catastrales del Mapa de Referencia. citeturn8view0turn31view0turn36view0turn36view1turn36view2turn36view3turn33search2turn34search0turn34search3

| id sugerido | Título exacto | Autoridad emisora | URL oficial | Tipo | Fecha de dato / actualización | Estado legal | Resumen de contenido y relevancia | Ref. espaciales | Proyección y campos relevantes | Formatos | Prioridad | Licencia / restricción | Soporte |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `pot_555_gdb_compendio` | POT- Decreto 555 de 2021 Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/pot-decreto-555-de-2021-bogota-d-c` | otro | actualiz. 2026-06-24 | vigente | Compendio geográfico asociado al POT, incluyendo estructuras territoriales, clasificación del suelo y estrategia normativa. Es la mejor “base madre” para una primera descarga masiva del dominio POT. | Sí | GDB; muy útil para bootstrap de capas y reconciliación de nombres internos. | GDB | alta | CC BY 4.0 | Ver citeturn43search0turn43search3turn43search6 |
| `mapa_referencia_bogota` | Mapa de referencia para Bogotá D.C. | La IDE de Bogotá D.C. / UAECD | `https://datosabiertos.bogota.gov.co/dataset/mapa-de-referencia` | otro | versión 2026-03-30 | vigente | Conjunto organizado de datos espaciales básicos; integra UPL, suelo, área urbanística, sector catastral, manzana, lote, construcción, placa y predio, entre otras capas. | Sí | Ideal como backbone territorial y para joins entre fuentes. | Esri REST, WMS, WFS, HTML, GPKG, GeoJSON, DXF, SHP, ZIP, otros | alta | CC BY 4.0 | Ver citeturn19search5turn30view1 |
| `lote_bogota` | Lote. Bogotá D.C. | Unidad Administrativa Especial de Catastro Distrital | `https://datosabiertos.bogota.gov.co/dataset/lote` | geojson | dato 2026-05-31 | vigente | Geometría mínima donde se ubican uno o más predios. Es la capa más importante para “anclar” cualquier consulta espacial del RAG. | Sí | EPSG 4686; el catálogo del objeto reporta identificador único de lote de 12 dígitos. | Esri REST, WMS, WFS, HTML, GPKG, GeoJSON, DXF, SHP, ZIP | alta | CC BY 4.0 | Ver citeturn31view0turn33search0 |
| `predios_bogota` | Predios. Bogotá D.C | Unidad Administrativa Especial de Catastro Distrital | `https://datosabiertos.bogota.gov.co/dataset/predios-bogota` | otro | actualiz. 2026-05-31 | vigente | Capa/tabla de predios; complementa al lote con la unidad inmobiliaria. Es clave cuando el usuario consulta por chip, número predial o inventario predial. | Sí | Conviene fijar esquema desde el catálogo IDECA de Predio durante el ETL. | Esri REST, dBase, CSV, SHP, GDB | alta | CC BY 4.0 | Ver citeturn34search1turn34search4turn34search10turn34search0 |
| `placa_domiciliaria_bogota` | Placa Domiciliaria. Bogotá D.C | Unidad Administrativa Especial de Catastro Distrital | `https://datosabiertos.bogota.gov.co/dataset/placa-domiciliaria` | geojson | actualiz. 2026-05-31 | vigente | Puntos de nomenclatura domiciliaria para el área urbana; facilitan geocodificación robusta de entrada textual. | Sí | Buena capa para resolver dirección → geometría candidata. | Esri REST, WMS, WFS, HTML, GPKG, GeoJSON, DXF, SHP, ZIP | alta | CC BY 4.0 | Ver citeturn20search1turn20search7 |
| `area_urbanistica_bogota` | Área Urbanística. Bogotá D.C | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/area-urbanistica-bogota-d-c` | geojson | actualiz. 2026-03-31 | vigente | Polígonos de urbanizaciones y planos urbanísticos aprobados por SDP o Curaduría. | Sí | Determina si el predio está dentro de un plano urbanístico/legalización/reloteo/proyecto general. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF | alta | CC BY 4.0 | Ver citeturn44search1turn44search7turn44search13 |
| `barrio_legalizado_bogota` | Barrio legalizado. Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/barrio-legalizado-bogota-d-c` | geojson | actualiz. 2026-06-30 | vigente | Polígonos de barrios legalizados. | Sí | Muy útil para predios en tejido autoconstruido o con antecedentes de legalización. | GPKG, GeoJSON, SHP, KMZ, DXF | media | CC BY 4.0 | Ver citeturn44search0turn44search9 |
| `tratamiento_urbanistico_pot` | Tratamiento urbanístico. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/tratamiento-urbanistico-bogota-d-c` | geojson | dato 2026-03-31 | vigente | Determinaciones para el manejo diferenciado de la norma urbanística en suelo urbano y de expansión. | Sí | EPSG 4686; para ETL conviene priorizar código/nombre de tratamiento y referencias normativas del diccionario. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF | alta | CC BY 4.0 | Ver citeturn8view0 |
| `area_actividad_pot` | Área actividad - POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/area-actividad-bogota-d-c` | geojson | dato 2026-02-03 | vigente | Territorios que orientan dinámicas urbanas y sobre los cuales se establecen usos del suelo, mezcla y cargas urbanísticas. | Sí | EPSG 4686; estructural para responder “qué mezcla/uso permite el área”. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF | alta | CC BY 4.0 | Ver citeturn21search2turn36view0 |
| `sector_uso_residencial_pot` | Sector uso residencial. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/sector-uso-residencial-bogota-d-c` | geojson | actualiz. 2022-05-09 | vigente | Subdivide áreas donde el uso predominante es vivienda: residencial neto, predominante, con actividad económica en vivienda, etc. | Sí | Capa complementaria para interpretación fina de vivienda y mezcla. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF | media | CC BY 4.0 | Ver citeturn21search3turn21search7 |
| `antejardin_pot` | Antejardín. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/antejardin-bogota-d-c` | geojson | dato 2023-08-02; metadato 2024-11-25 | vigente | Área libre de un predio entre lindero contra vía y construcción; el dataset la trata como parte del espacio público. | Sí | EPSG 4686; crítica para retiros efectivos, borde-vía y diseño de implantación. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF | alta | CC BY 4.0 | Ver citeturn23search0turn36view3 |
| `rango_edificabilidad_desarrollo_pot` | Rango edificabilidad en tratamiento de desarrollo. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/rango-edificabilidad-en-tratamiento-de-desarrollo-bogota-d-c` | geojson | actualiz. 2022-05-09 | vigente | Delimita rangos de edificabilidad para áreas en tratamiento de desarrollo. | Sí | Solo aplica cuando el predio cae en ese tratamiento; muy útil como regla condicionada. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF | media | CC BY 4.0 | Ver citeturn23search1turn23search13 |
| `plan_parcial_pot` | Plan parcial. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/plan-parcial-bogota-d-c1` | geojson | actualiz. 2026-06-24 | vigente | Delimita planes parciales, instrumento de segundo nivel que desarrolla y complementa el POT. | Sí | Si el predio cae dentro de un PP, esta capa puede desplazar respuestas “genéricas” del decreto. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF | alta | CC BY 4.0 | Ver citeturn21search0turn21search4 |
| `actuacion_estrategica_pot` | Actuación estratégica. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/actuacion-estrategica-bogota-d-c` | geojson | actualiz. 2026-02-19 | vigente | Instrumento de gestión del suelo para gestión asociada y transformaciones estratégicas. | Sí | Relevante si el predio entra en áreas de transformación mayor. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF | media | CC BY 4.0 | Ver citeturn21search1turn21search9 |
| `suelo_reserva_pot` | Suelo Reserva. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/suelo-reserva-bogota-d-c` | geojson | actualiz. 2026-05-26 | vigente | Franjas de terreno necesarias para infraestructura, sistemas generales y suelos de la estructura ecológica principal. | Sí | Clave para detectar afectaciones por futuras infraestructuras o reservas. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF | alta | CC BY 4.0 | Ver citeturn16search0turn16search3 |
| `red_infraestructura_vial_pot` | Red infraestructura vial. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/red-infraestructura-vial-bogota-d-c` | geojson | actualiz. 2026-05-26 | vigente | Red de elementos de infraestructura vial del POT. | Sí | Hace falta para interpretar frente de vía, conectividad y condicionantes de borde. | GPKG, GeoJSON, SHP, KMZ, DXF | alta | CC BY 4.0 | Ver citeturn45search0turn45search6 |
| `eep_sistema_hidrico_pot` | EEP - Sistema hídrico. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/eep-sistema-hidrico-bogota-d-c` | geojson | actualiz. 2026-05-15 | vigente | Cuerpos de agua naturales y/o artificiales del drenaje distrital. | Sí | Necesario para restricciones ambientales, rondas y compatibilidades del predio. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF | alta | CC BY 4.0 | Ver citeturn45search1turn45search7 |
| `suelo_proteccion_riesgo_pot` | Suelo de protección por riesgo. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/suelo-de-proteccion-por-riesgo-bogota-d-c` | geojson | dato 2026-02-03 | vigente | Zonas de suelo urbano, rural o de expansión que se encuentran en riesgo. | Sí | Debe entrar al top de reglas excluyentes o condicionantes. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF | alta | CC BY 4.0 | Ver citeturn22search1turn36view1 |
| `eep_areas_protegidas_sinap_dc_pot` | EEP - Áreas protegidas SINAP-DC. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/eep-areas-protegidas-sinap-distrital-bogota-d-c` | geojson | actualiz. 2025-09-24 | vigente | Zonas correspondientes a áreas protegidas del SINAP. | Sí | Relevancia alta cuando el predio está en borde ecológico o rural. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF | media | CC BY 4.0 | Ver citeturn47search2 |
| `bic_zona_influencia_pot` | Zona influencia BIC SIU PEMP. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/zona-influencia-bic-sic-pemp-bogota-d-c` | geojson | dato 2026-01-28 | vigente | Zonas de influencia de BIC, sectores de interés urbanístico y PEMP. | Sí | Puede modificar o intensificar restricciones de intervención y licenciamiento. | GPKG, GeoJSON, SHP, KMZ, DXF; EPSG 4686 | alta | CC BY 4.0 | Ver citeturn22search2turn36view2 |
| `bic_bien_interes_cultural_pot` | Bien interés cultural-BIC. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/?_tags_limit=0&groups=ordenamiento-territorial&res_format=GeoJSON&tags=Patrimonio+Cultural` | geojson | actualiz. 2026-04-29 | vigente | Capa de inmuebles/elementos con valores arquitectónicos, artísticos o históricos bajo el POT. | Sí | Complementa la zona de influencia y ayuda a distinguir afectación directa vs contextual. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF | alta | CC BY 4.0 | Ver citeturn46search5turn46search7 |
| `area_elevacion_maxima_pot` | Área elevación máxima. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/area-elevacion-maxima-bogota-d-c` | geojson | dato 2022-09-19 | vigente | Área de elevación máxima definida por la Aeronáutica Civil. | Sí | Restricción crítica para altura, volumetría y viabilidad aérea. | GPKG, GeoJSON, SHP, KMZ, DXF; EPSG 4686 | alta | CC BY 4.0 | Ver citeturn17search1turn30view3 |
| `aeropuerto_influencia_indirecta_pot` | Área de influencia indirecta del Aeropuerto El Dorado. POT Bogotá D.C. | Secretaría Distrital de Planeación | `https://datosabiertos.bogota.gov.co/dataset/area-de-influencia-indirecta-del-aeropuerto-el-dorado-bogota-d-c` | geojson | dato 2022-09-19 | vigente | Área de influencia indirecta del sistema aeroportuario El Dorado. | Sí | Muy útil para contextualizar restricciones y consultas de implantación alrededor del aeropuerto. | Esri REST, GPKG, GeoJSON, SHP, KMZ, DXF; EPSG 4686 | alta | CC BY 4.0 | Ver citeturn17search0turn30view2 |

## Manifest JSON vigente

El siguiente manifest está pensado para `rag/sources/sources.manifest.json`. Incluye solo fuentes que, con base en la revisión anterior, conviene tratar como **vigentes** o como **datasets oficiales activos**. En los actos compilados, el manifiesto conserva únicamente la fuente consolidada o el anexo/manual operativo vigente, para evitar duplicidad jurídica dentro del RAG. La justificación y trazabilidad de cada entrada está en las tablas anteriores. citeturn37search0turn43search0turn31view0turn36view0turn36view1turn36view2turn30view3

```json
{
  "version": "1.0",
  "generated_at": "2026-07-03",
  "jurisdiction": "Bogotá D.C.",
  "notes": [
    "Solo incluye fuentes vigentes o datasets oficiales activos recomendados para un RAG normativo-predial.",
    "Conservar en metadata el estado legal, la fecha de actualización y la URL oficial del listado SISJUR o Datos Abiertos.",
    "Para actos compilados, usar el decreto compilador como fuente legal primaria y los anexos/manuales vigentes como fuentes operativas."
  ],
  "sources": [
    {
      "id": "decreto_670_2025_dot",
      "title": "Decreto 670 de 2025",
      "authority": "Alcaldía Mayor de Bogotá D.C.",
      "url": "https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=191905",
      "type": "decreto",
      "legal_status": "vigente",
      "format": ["HTML"],
      "priority": "alta"
    },
    {
      "id": "anexo_05_manual_normas_comunes_2024",
      "title": "ACTUALIZACIÓN ANEXO No. 5: MANUAL DE NORMAS COMUNES A LOS TRATAMIENTOS URBANÍSTICOS",
      "authority": "Secretaría Distrital de Planeación / Alcaldía Mayor de Bogotá D.C.",
      "url": "https://www.sdp.gov.co/sites/default/files/actualizacion_anexo_5_final_201120241_0.pdf",
      "type": "anexo",
      "legal_status": "vigente",
      "format": ["PDF"],
      "priority": "alta"
    },
    {
      "id": "manual_espacio_publico_2023",
      "title": "Manual de Espacio Público de Bogotá D.C.",
      "authority": "Alcaldía Mayor de Bogotá D.C. / Secretaría Distrital de Planeación",
      "url": "https://www.sdp.gov.co/sites/default/files/generales/manual_espacio_publico_2023_c.pdf",
      "type": "manual",
      "legal_status": "vigente",
      "format": ["PDF"],
      "priority": "alta"
    },
    {
      "id": "cartilla_mobiliario_urbano",
      "title": "Anexo Cartilla de Mobiliario Urbano",
      "authority": "Alcaldía Mayor de Bogotá D.C. / Secretaría Distrital de Planeación",
      "url": "https://www.alcaldiabogota.gov.co/sisjur/normas/admin_norma_doc.jsp?i=143258",
      "type": "anexo",
      "legal_status": "vigente",
      "format": ["PDF"],
      "priority": "media"
    },
    {
      "id": "manual_ecourbanismo_2023",
      "title": "Manual de Ecourbanismo y Construcción Sostenible",
      "authority": "Alcaldía Mayor de Bogotá D.C. / Secretaría Distrital de Planeación",
      "url": "https://www.sdp.gov.co/sites/default/files/manual_ecourb_const.pdf",
      "type": "manual",
      "legal_status": "vigente",
      "format": ["PDF"],
      "priority": "alta"
    },
    {
      "id": "cartografia_decreto_componente_urbano",
      "title": "Cartografía del decreto - componente urbano",
      "authority": "Alcaldía Mayor de Bogotá D.C. / Secretaría Distrital de Planeación",
      "url": "https://www.alcaldiabogota.gov.co/sisjur/normas/admin_norma_doc.jsp?i=119582",
      "type": "mapa",
      "legal_status": "vigente",
      "format": ["PDF"],
      "priority": "alta"
    },
    {
      "id": "pot_555_gdb_compendio",
      "title": "POT- Decreto 555 de 2021 Bogotá D.C.",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/pot-decreto-555-de-2021-bogota-d-c",
      "type": "otro",
      "legal_status": "vigente",
      "format": ["GDB"],
      "priority": "alta"
    },
    {
      "id": "mapa_referencia_bogota",
      "title": "Mapa de referencia para Bogotá D.C.",
      "authority": "La IDE de Bogotá D.C. / UAECD",
      "url": "https://datosabiertos.bogota.gov.co/dataset/mapa-de-referencia",
      "type": "otro",
      "legal_status": "vigente",
      "format": ["Esri REST", "WMS", "WFS", "HTML", "GPKG", "GeoJSON", "DXF", "SHP", "ZIP"],
      "priority": "alta"
    },
    {
      "id": "lote_bogota",
      "title": "Lote. Bogotá D.C.",
      "authority": "Unidad Administrativa Especial de Catastro Distrital",
      "url": "https://datosabiertos.bogota.gov.co/dataset/lote",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["Esri REST", "WMS", "WFS", "HTML", "GPKG", "GeoJSON", "DXF", "SHP", "ZIP"],
      "priority": "alta"
    },
    {
      "id": "predios_bogota",
      "title": "Predios. Bogotá D.C",
      "authority": "Unidad Administrativa Especial de Catastro Distrital",
      "url": "https://datosabiertos.bogota.gov.co/dataset/predios-bogota",
      "type": "otro",
      "legal_status": "vigente",
      "format": ["Esri REST", "dBase", "CSV", "SHP", "GDB"],
      "priority": "alta"
    },
    {
      "id": "placa_domiciliaria_bogota",
      "title": "Placa Domiciliaria. Bogotá D.C",
      "authority": "Unidad Administrativa Especial de Catastro Distrital",
      "url": "https://datosabiertos.bogota.gov.co/dataset/placa-domiciliaria",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["Esri REST", "WMS", "WFS", "HTML", "GPKG", "GeoJSON", "DXF", "SHP", "ZIP"],
      "priority": "alta"
    },
    {
      "id": "area_urbanistica_bogota",
      "title": "Área Urbanística. Bogotá D.C",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/area-urbanistica-bogota-d-c",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["Esri REST", "GPKG", "GeoJSON", "SHP", "KMZ", "DXF"],
      "priority": "alta"
    },
    {
      "id": "tratamiento_urbanistico_pot",
      "title": "Tratamiento urbanístico. POT Bogotá D.C.",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/tratamiento-urbanistico-bogota-d-c",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["Esri REST", "GPKG", "GeoJSON", "SHP", "KMZ", "DXF"],
      "priority": "alta"
    },
    {
      "id": "area_actividad_pot",
      "title": "Área actividad - POT Bogotá D.C.",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/area-actividad-bogota-d-c",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["Esri REST", "GPKG", "GeoJSON", "SHP", "KMZ", "DXF"],
      "priority": "alta"
    },
    {
      "id": "antejardin_pot",
      "title": "Antejardín. POT Bogotá D.C.",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/antejardin-bogota-d-c",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["Esri REST", "GPKG", "GeoJSON", "SHP", "KMZ", "DXF"],
      "priority": "alta"
    },
    {
      "id": "plan_parcial_pot",
      "title": "Plan parcial. POT Bogotá D.C.",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/plan-parcial-bogota-d-c1",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["Esri REST", "GPKG", "GeoJSON", "SHP", "KMZ", "DXF"],
      "priority": "alta"
    },
    {
      "id": "suelo_reserva_pot",
      "title": "Suelo Reserva. POT Bogotá D.C.",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/suelo-reserva-bogota-d-c",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["Esri REST", "GPKG", "GeoJSON", "SHP", "KMZ", "DXF"],
      "priority": "alta"
    },
    {
      "id": "red_infraestructura_vial_pot",
      "title": "Red infraestructura vial. POT Bogotá D.C.",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/red-infraestructura-vial-bogota-d-c",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["GPKG", "GeoJSON", "SHP", "KMZ", "DXF"],
      "priority": "alta"
    },
    {
      "id": "eep_sistema_hidrico_pot",
      "title": "EEP - Sistema hídrico. POT Bogotá D.C.",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/eep-sistema-hidrico-bogota-d-c",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["Esri REST", "GPKG", "GeoJSON", "SHP", "KMZ", "DXF"],
      "priority": "alta"
    },
    {
      "id": "suelo_proteccion_riesgo_pot",
      "title": "Suelo de protección por riesgo. POT Bogotá D.C.",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/suelo-de-proteccion-por-riesgo-bogota-d-c",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["Esri REST", "GPKG", "GeoJSON", "SHP", "KMZ", "DXF"],
      "priority": "alta"
    },
    {
      "id": "bic_zona_influencia_pot",
      "title": "Zona influencia BIC SIU PEMP. POT Bogotá D.C.",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/zona-influencia-bic-sic-pemp-bogota-d-c",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["GPKG", "GeoJSON", "SHP", "KMZ", "DXF"],
      "priority": "alta"
    },
    {
      "id": "bic_bien_interes_cultural_pot",
      "title": "Bien interés cultural-BIC. POT Bogotá D.C.",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/?_tags_limit=0&groups=ordenamiento-territorial&res_format=GeoJSON&tags=Patrimonio+Cultural",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["Esri REST", "GPKG", "GeoJSON", "SHP", "KMZ", "DXF"],
      "priority": "alta"
    },
    {
      "id": "area_elevacion_maxima_pot",
      "title": "Área elevación máxima. POT Bogotá D.C.",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/area-elevacion-maxima-bogota-d-c",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["GPKG", "GeoJSON", "SHP", "KMZ", "DXF"],
      "priority": "alta"
    },
    {
      "id": "aeropuerto_influencia_indirecta_pot",
      "title": "Área de influencia indirecta del Aeropuerto El Dorado. POT Bogotá D.C.",
      "authority": "Secretaría Distrital de Planeación",
      "url": "https://datosabiertos.bogota.gov.co/dataset/area-de-influencia-indirecta-del-aeropuerto-el-dorado-bogota-d-c",
      "type": "geojson",
      "legal_status": "vigente",
      "format": ["Esri REST", "GPKG", "GeoJSON", "SHP", "KMZ", "DXF"],
      "priority": "alta"
    }
  ]
}
```

## Recomendaciones de ingestión y gobierno

La comparación útil para diseñar el RAG es esta: los **decretos** responden el “qué manda”; los **manuales/anexos** responden el “cómo se aplica”; los **mapas y datasets** responden el “dónde aplica”. Si te falta una de esas tres capas, el sistema tenderá a alucinar o a generalizar indebidamente. En otras palabras, para un predio en Bogotá, un buen flujo no es “pregunta → embedding → párrafo”, sino **pregunta → resolver predio → overlay espacial → shortlist normativo → respuesta citada**. Esto es una inferencia operativa derivada de la estructura oficial de fuentes halladas. citeturn37search0turn39search3turn28search1turn43search0turn30view0turn35view0turn35view1turn17search1

| Familia de fuente | Rol dentro del RAG | Preguntas que responde mejor | Riesgo si falta |
|---|---|---|---|
| Decretos compiladores | Autoridad legal primaria | “¿Qué norma rige hoy?”, “¿Está vigente?”, “¿Qué artículo aplica?” | Respuestas jurídicamente débiles o desactualizadas |
| Manuales y anexos | Aplicación técnica y operativa | “¿Cómo se interpreta el antejardín, el borde, la disposición, la sostenibilidad?” | Respuestas demasiado abstractas o incompletas |
| Cartografía oficial PDF | Auditoría visual y control humano | “¿Coincide la capa con el mapa oficial?”, “¿Cómo se ve en layout oficial?” | Dificultad para explicar o auditar resultados |
| Datasets vectoriales | Localización precisa por predio | “¿Qué tratamiento/área/afectación tiene este lote?” | El RAG textual no podrá contestar preguntas prediales reales |
| Catálogos y diccionarios | Gobierno de datos y ETL | “¿Qué significa cada campo y cómo versionarlo?” | ETL frágil, columnas ambiguas, joins inestables |

La prioridad de ingestión la dejaría así. **Primera ola**: Decreto 670, Anexo 5 actualizado, Manual de Espacio Público, Manual ECOS, compendio POT GDB, Lote, Predios, Placa Domiciliaria, Área Urbanística, Tratamiento Urbanístico, Área de Actividad y Plan Parcial. **Segunda ola**: Antejardín, Red de infraestructura vial, Suelo Reserva, Sistema hídrico, Suelo de protección por riesgo, BIC/zonas de influencia y restricciones aeroportuarias. **Tercera ola**: Barrio legalizado, Sector uso residencial, Rango de edificabilidad en desarrollo, actuación estratégica, cartografía rural y documentos explicativos o ilustrados. Esa secuencia refleja qué fuentes contestan primero la mayoría de consultas de factibilidad y cuáles refinan casos especiales. citeturn43search0turn30view0turn34search4turn20search1turn44search1turn8view0turn21search2turn21search0turn23search0turn45search0turn16search0turn45search1turn22search1turn22search2turn17search1

La última recomendación es de gobernanza documental. En cada fuente del RAG deberías guardar, además del contenido, al menos estos metadatos: `authority`, `legal_status`, `date_of_issue`, `data_date`, `metadata_updated_at`, `spatial_reference`, `formats`, `source_family`, `official_url`, `checksum`, `ingested_at` y `priority`. En el caso de las capas SDP, además conviene conservar el enlace al **diccionario de datos** y al **catálogo de objetos**; en el caso catastral, el enlace al catálogo IDECA correspondiente. Eso convierte el RAG en un sistema audit-able y no en un simple índice de textos. citeturn8view0turn36view0turn36view1turn36view2turn36view3turn33search2turn34search0turn34search3