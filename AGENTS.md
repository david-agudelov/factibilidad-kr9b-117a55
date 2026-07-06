# AGENTS.md - Factibilidad Live Modeler

Guia de trabajo para construir por etapas una app de factibilidad normativa con calculos en vivo para el caso KR9B_117A55.

## 1. Objetivo del proyecto

Construir un modelador parametricamente controlado para evaluar una factibilidad preliminar de edificabilidad. La app debe permitir modificar pocos parametros relevantes, recalcular en vivo la geometria, actualizar metricas derivadas y visualizar el resultado en 2D/3D.

El proyecto no debe comportarse como un formulario con submit. Cada cambio de slider debe actualizar inmediatamente:

- reglas normativas aplicadas
- geometria derivada
- metricas
- validacion
- visualizacion 2D y 3D

El caso base es KR9B_117A55. Los datos del lote son fijos para esta version y no deben aparecer como sliders.

## 2. Stack tecnologico

- React
- Vite
- TypeScript
- Tailwind CSS
- Three.js
- GSAP
- Vitest
- Testing Library
- oxlint
- PowerShell en Windows para comandos locales

## 3. Arquitectura base

La app debe separar estrictamente estas capas:

- Datos fijos del lote: ancho, fondo, area, perimetro, ICe y datos del caso.
- Inputs editables: parametros que el usuario realmente puede controlar.
- Motor normativo: reglas que derivan setbacks, umbrales, alturas y limites.
- Motor geometrico: generacion de footprints y masa 3D desde los resultados normativos.
- Motor de metricas: calculo de area, ocupacion, espacio libre, area construida, area vendible y margen ICe.
- Validacion: deteccion de combinaciones no viables o advertencias normativas.
- UI: sliders, paneles informativos, panel de metricas, validaciones, render 2D y render 3D.

Regla central: la UI no debe calcular ni hardcodear metricas. La UI solo muestra datos derivados por motores puros.

## 4. Apps requeridas

Para trabajar en este proyecto se requieren:

- Codex para edicion asistida y revision por etapas.
- Terminal PowerShell para instalar dependencias, correr pruebas y levantar Vite.
- Navegador local o in-app browser para verificar la UI.
- Editor de codigo para inspeccion manual.

Opcional en fases futuras:

- Rhino 8
- Grasshopper
- Python para Grasshopper
- Rhino.Inside o flujos de exportacion DXF/OBJ/JSON

Estas apps opcionales no son requeridas para la version React/Vite actual.

## 5. Modelos principales

Los modelos deben mantenerse tipados y separados por responsabilidad.

### SITE_CONSTANTS

Datos fijos del lote y del caso:

- direccion o identificador del caso
- ancho oficial aproximado
- fondo oficial aproximado
- area oficial
- perimetro oficial
- ICe del caso
- eficiencia vendible default si aplica
- fuente del caso

Estos valores son informativos y no deben ser sliders.

### EditableParams

Parametros que si puede controlar el usuario:

- floors
- floorHeight
- ecosMode
- sellableEfficiency, solo si se mantiene como supuesto economico secundario

No incluir aqui ancho, fondo, setbacks, patios ni umbrales normativos.

### NormativeEnvelope

Resultado derivado de aplicar la norma:

- totalHeight
- rearSetback
- lateralOnsetHeight
- sideSetbackApplied
- lowerFloors
- upperFloors
- maxFloors
- limitingFactors
- normativeWarnings

### ModelGeometry

Geometria derivada:

- lotPolygon
- lowerFootprint
- upperFootprint
- massing data para 3D
- boundingBox
- grossFootprintArea
- netFootprintArea si aplica

### MetricItem

Cada metrica debe ser renderizable:

- id
- label
- value
- unit
- formatted
- tone
- description

### ValidationResult

Estado de validacion:

- isValid
- severity
- messages
- warnings

## 6. Flujo funcional

El flujo debe ser explicito y unidireccional:

```text
floors + floorHeight + ecosMode
-> computeNormativeEnvelope
-> buildPolygon
-> computeMetrics
-> validateModel
-> render 2D/3D
```

La app debe recalcular todo automaticamente cada vez que cambie un input editable.

No usar boton de submit.

## 7. Convenciones de codigo

- Usar TypeScript para tipos de parametros, geometria, metricas y validacion.
- Preferir funciones puras en `src/norms`, `src/geometry`, `src/metrics` y `src/validation` si se crea.
- Mantener React como capa de estado y presentacion, no como motor de calculo.
- No duplicar formulas entre UI y motores.
- No mezclar datos fijos con estado editable.
- No convertir resultados normativos en sliders.
- No usar valores hardcodeados en componentes si pertenecen al caso o a la norma.
- Mantener nombres claros y arquitectonicos: `floorHeight`, `rearSetback`, `lateralOnsetHeight`, `builtArea`.
- Escribir tests antes de modificar motores puros.
- Evitar refactors grandes no relacionados con la etapa actual.
- Mantener comentarios breves solo cuando expliquen una regla normativa o una decision geometrica no obvia.

## 8. Estructura de carpetas esperada

```text
src/
  components/
    SliderPanel.tsx
    MetricsPanel.tsx
    ValidationPanel.tsx
    PolygonViewport2D.tsx
    MassViewport3D.tsx
  config/
    sliderConfig.ts
  geometry/
    buildPolygon.ts
    polygonMath.ts
    *.test.ts
  metrics/
    computeMetrics.ts
    *.test.ts
  model/
    caseDefaults.ts
    types.ts
  norms/
    computeFloorLimit.ts
    computeNormativeEnvelope.ts
    *.test.ts
  state/
    useParametricModel.ts
    modelReducer.ts
    *.test.ts
  test/
    setup.ts
```

La estructura puede crecer, pero cada carpeta debe conservar una responsabilidad clara.

## 9. Variables de entorno requeridas

Para la version actual no se requieren variables de entorno.

Si en fases futuras se agregan APIs externas, mapas, autenticacion o servicios de datos, documentar aqui:

- nombre de variable
- proposito
- ejemplo sin secretos reales
- si es requerida u opcional

Nunca commitear secretos reales.

## 10. Comandos de instalacion, migracion y ejecucion

Instalar dependencias:

```powershell
npm install
```

Ejecutar desarrollo local:

```powershell
npm run dev
```

Ejecutar pruebas:

```powershell
npm test
```

Ejecutar lint:

```powershell
npm run lint
```

Compilar build de produccion:

```powershell
npm run build
```

Vista previa del build:

```powershell
npm run preview
```

Migraciones:

```text
No aplica para v1. Este proyecto no usa base de datos ni migraciones.
```

## 11. Reglas para trabajar por etapas

El proyecto debe construirse por etapas. No pasar a la siguiente etapa si la actual no esta validada.

### Etapa 1 - Tipos y constantes

- Definir `SITE_CONSTANTS`.
- Definir `EditableParams`.
- Separar datos fijos de inputs editables.
- Confirmar que ancho, fondo, area e ICe no son sliders.

### Etapa 2 - Motor normativo

- Implementar o ajustar `computeNormativeEnvelope`.
- Derivar setback posterior desde altura total.
- Derivar activacion lateral desde norma base o ECOS.
- Derivar setback lateral aplicado.
- Validar pisos minimos y maximos.

### Etapa 3 - Motor geometrico

- Generar lote fijo.
- Generar footprint inferior.
- Generar footprint superior cuando aplica lateral.
- Quitar patio central de v1 hasta tener regla normativa clara.

### Etapa 4 - Motor de metricas

- Calcular metricas solo desde geometria y envelope normativo.
- Verificar que eficiencia vendible solo afecte area vendible.
- Verificar que la UI no tenga formulas duplicadas.

### Etapa 5 - Estado de aplicacion

- Conectar inputs editables con motores derivados.
- Usar `useMemo` para derivados cuando sea util.
- Evitar guardar en estado valores calculables.

### Etapa 6 - UI

- Mostrar sliders solo para `floors` y `floorHeight`.
- Mostrar `ecosMode` como toggle de escenario.
- Mostrar datos fijos como informacion, no sliders.
- Mostrar setbacks y umbrales como resultados normativos.
- Mostrar metricas desde `MetricItem`.

### Etapa 7 - Verificacion en navegador

- Revisar desktop.
- Revisar mobile.
- Confirmar ausencia de overflow horizontal.
- Confirmar que sliders actualizan 2D, 3D, metricas y validacion.

## 12. Criterios de validacion antes de finalizar cada cambio

Antes de dar por terminado cualquier cambio:

- `npm test` debe pasar.
- `npm run lint` debe pasar.
- `npm run build` debe pasar.
- El cambio debe ser verificable en navegador si afecta UI.
- No debe haber overflow horizontal en desktop ni mobile.
- Los datos fijos del lote no deben aparecer como sliders.
- Setbacks, patios y umbrales laterales no deben aparecer como inputs editables.
- `floors` y `floorHeight` deben recalcular resultados en vivo.
- Las metricas deben venir de calculos derivados, no de texto hardcodeado.
- Las validaciones deben explicar la causa del problema con texto, no solo color.
- No se debe avanzar a la siguiente etapa si la etapa actual no tiene tests o verificacion manual suficiente.

## Reglas especiales del dominio

- Este modelo es preliminar y no reemplaza licencia, concepto de Curaduria, Aerocivil, topografia ni perfil vial oficial.
- La geometria debe conectarse siempre con una logica arquitectonica: norma, constructibilidad, area, ocupacion y documentacion.
- Evitar "forma por forma". Cada control debe tener una razon normativa o de factibilidad.
- Si una regla no esta confirmada, mostrarla como pendiente o supuesto, no como derecho adquirido.

## Fase v2 - Agentic RAG normativo-predial

1. El RAG debe ser server-side.
2. Nunca exponer `OPENAI_API_KEY`, `OPENAI_VECTOR_STORE_ID` ni secretos en frontend.
3. No usar variables `VITE_*` para secretos.
4. El chatbot solo puede responder con base en:
   - documentos indexados,
   - `sources.manifest.json`,
   - facts geoespaciales producidos por overlays determinísticos.
5. Toda respuesta normativa debe incluir citas:
   - documento fuente,
   - sección, artículo, capítulo o tabla si existe,
   - URL oficial,
   - fecha o versión,
   - nivel de confianza.
6. Toda respuesta predial debe diferenciar:
   - hechos espaciales calculados,
   - interpretación normativa,
   - advertencias o incertidumbres.
7. Si no hay soporte documental o espacial suficiente, responder:
   `"No encontré soporte suficiente en los documentos y datos cargados."`
8. No inventar artículos, restricciones, alturas, usos, tratamientos ni áreas de actividad.
9. Separar estrictamente:
   - UI chat,
   - cliente API,
   - endpoint server-side,
   - prompts,
   - ingesta documental,
   - ingesta geoespacial,
   - manifest de fuentes,
   - evals.
10. No mezclar el RAG con `src/norms` ni con motores geométricos existentes.
11. El RAG explica y cita; no reemplaza el motor normativo determinístico.
12. Los overlays espaciales deben vivir en una capa separada, por ejemplo `src/spatial` o `rag/spatial`.
13. Toda fuente debe declararse en `rag/sources/sources.manifest.json`.
14. Cada fuente debe guardar:
   - `id`,
   - `title`,
   - `authority`,
   - `officialUrl`,
   - `sourceDomain`,
   - `sourceFamily`,
   - `type`,
   - `legalStatus`,
   - `effectiveDate`,
   - `versionDate`,
   - `dataDate`,
   - `metadataUpdatedAt`,
   - `spatialReference`,
   - `formats`,
   - `localPath`,
   - `checksum`,
   - `ingestedAt`,
   - `priority`,
   - `notes`.
15. No usar fuentes secundarias como base normativa.
16. Los actos derogados o compilados solo pueden usarse como provenance, no como fuente legal primaria.
17. Para Bogotá, tratar el Decreto 670 de 2025 como fuente legal primaria si el manifest lo marca vigente.
18. Tratar manuales/anexos como fuentes operativas.
19. Tratar datasets vectoriales como fuentes espaciales, no como textos para embeddings.
20. Todo cambio debe pasar:
   - `npm test`
   - `npm run lint`
   - `npm run build`
21. Si afecta UI, verificar desktop/mobile y ausencia de overflow horizontal.
