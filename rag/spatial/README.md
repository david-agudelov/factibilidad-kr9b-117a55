# KR9B spatial facts

This folder contains the offline spatial overlay pipeline for the RAG chatbot.

The frontend and Cloudflare Worker do not download or process heavy GIS files.
For V2.1, `overlayEngine.py` resolves the KR9B address against official
Catastro/IDECA layers, resolves the lot, and queries selected POT/IDU Esri REST
layers with deterministic point/centroid overlays.

Run from the repository root:

```powershell
npm.cmd run rag:build:spatial-facts
npm.cmd run cf:build:data
```

Outputs:

- `data/spatial/facts/KR9B_117A55.json`: small auditable facts consumed by the Worker.
- `cloudflare-worker/src/data/spatialFacts.generated.ts`: generated Worker data.

Rules:

- Do not place raw GIS datasets under `public`.
- Do not index spatial datasets as text chunks.
- If a layer has no configured REST endpoint or cannot be computed, report it as
  `method: "not_computed"` instead of guessing.
- A chatbot answer may interpret facts only when the corresponding legal/manual
  documents provide citations.
