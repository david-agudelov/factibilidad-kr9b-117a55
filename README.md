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

No environment variable is required for v1. Optional local overrides can be copied from:

```powershell
Copy-Item .env.example .env.local
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
