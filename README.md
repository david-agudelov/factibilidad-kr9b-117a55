# Factibilidad Live Modeler

App React/Vite para construir una factibilidad normativa preliminar con calculos en vivo para el caso `KR9B_117A55`.

La app debe construirse por etapas. Cada modulo debe validarse antes de pasar al siguiente.

## Objetivo

Construir una herramienta de modelado para evaluar pisos, altura, envolvente normativa, geometria derivada, metricas y validacion. El usuario debe controlar solo los parametros que realmente son editables; los datos fijos del lote y los resultados normativos deben mostrarse como informacion derivada.

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- Three.js
- GSAP
- Vitest
- Testing Library
- oxlint

## Arquitectura Base

```text
src/
  components/   React UI only
  config/       app/env/slider configuration
  geometry/     pure geometry engine
  metrics/      pure metrics engine
  model/        constants and shared types
  norms/        pure normative rules
  state/        React state orchestration
  templates/    reusable UI templates
  test/         test setup
public/
  static/       public static assets
  templates/    public static templates
docs/
  requirements.md
```

## Environment

No secret is required in the frontend. Optional local overrides can be copied from:

```powershell
Copy-Item .env.example .env.local
```

RAG v2 public frontend flags:

```text
VITE_RAG_ENABLED=true
VITE_RAG_ENDPOINT=/api/normative-chat
```

RAG v2 server-only variables must never use `VITE_*`:

```text
OPENAI_API_KEY
OPENAI_VECTOR_STORE_ID
RAG_MODEL
RAG_SOURCE_MANIFEST_PATH
RAG_SPATIAL_FACTS_PATH
```

## Install

```powershell
npm install
```

## Development

```powershell
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://127.0.0.1:5173
```

## Validation

Run all checks before finishing a change:

```powershell
npm test
npm run lint
npm run build
```

RAG v2 local validation helpers:

```powershell
node scripts/rag/validateManifest.ts
node scripts/spatial/buildParcelFacts.ts KR9B_117A55
node scripts/rag/ingestDocuments.ts
```

## Probar RAG con Cloudflare Workers

El frontend React nunca debe recibir claves secretas. Para probar el backend RAG
en Cloudflare Workers:

```powershell
npm.cmd run cf:build:data
Copy-Item cloudflare-worker/.dev.vars.example cloudflare-worker/.dev.vars
npx.cmd wrangler login
npm.cmd run cf:dev
```

En otra terminal, apunta Vite al Worker local:

```powershell
$env:VITE_RAG_ENABLED="true"
$env:VITE_RAG_ENDPOINT="http://localhost:8787/api/normative-chat"
npm.cmd run dev
```

Los secretos server-side viven en `cloudflare-worker/.dev.vars` para desarrollo
local y en Cloudflare Workers Secrets para producción:

```powershell
npx.cmd wrangler secret put OPENAI_API_KEY --config cloudflare-worker/wrangler.jsonc
npx.cmd wrangler secret put OPENAI_VECTOR_STORE_ID --config cloudflare-worker/wrangler.jsonc
```

Para el MVP con Cloudflare, usa `RAG_PROVIDER=cloudflare`. Para migrar luego a
OpenAI File Search, cambia a `RAG_PROVIDER=openai` y configura los secretos
`OPENAI_API_KEY` y `OPENAI_VECTOR_STORE_ID`.

## Migrations

No migrations are required for v1. This project does not use a database.

## Work By Stages

1. Define types and constants.
2. Validate the normative engine.
3. Validate the geometry engine.
4. Validate the metrics engine.
5. Connect React state.
6. Connect UI.
7. Verify in browser.

Do not advance to the next stage until the current stage has tests or practical verification.

## Domain Rule

This app is a preliminary feasibility model. It does not replace Curaduria, Aerocivil, official topography, official road profile, license review, or legal due diligence.
