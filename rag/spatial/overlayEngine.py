#!/usr/bin/env python
"""Build deterministic spatial facts for the KR9B_117A55 RAG case.

The script keeps heavy spatial work outside the frontend and Worker runtime.
For V2.1 it queries official Esri REST layers with the resolved parcel point or
lot centroid. Layers that require heavier GeoJSON clipping are reported as
not_computed instead of being guessed.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    config = read_json(Path(args.config))
    manifest = read_json(Path(args.manifest))
    sources = {source["id"]: source for source in manifest.get("sources", [])}
    warnings: list[str] = []

    address_feature = query_where(
        config["resolution"]["addressPoint"]["restUrl"],
        config["resolution"]["addressPoint"]["where"],
        return_geometry=True,
    )
    if address_feature is None:
        raise RuntimeError("Could not resolve KR9B address point from placa_domiciliaria_bogota.")

    address_attrs = address_feature.get("attributes", {})
    address_geometry = address_feature.get("geometry", {})
    lot_code = address_attrs.get("PDOCLOTE")
    if not lot_code:
        raise RuntimeError("Resolved address point did not include PDOCLOTE.")

    lot_where = config["resolution"]["lot"]["whereTemplate"].replace("{lotCode}", str(lot_code))
    lot_feature = query_where(
        config["resolution"]["lot"]["restUrl"],
        lot_where,
        return_geometry=True,
    )
    if lot_feature is None:
        raise RuntimeError(f"Could not resolve lot geometry for LOTCODIGO={lot_code}.")

    lot_attrs = lot_feature.get("attributes", {})
    lot_geometry = lot_feature.get("geometry", {})
    lot_centroid = centroid_from_rings(lot_geometry.get("rings", []))
    front_point = {
        "x": float(address_geometry["x"]),
        "y": float(address_geometry["y"]),
    }

    facts = [
        make_fact(
            source=sources.get("placa_domiciliaria_bogota", {}),
            source_id="placa_domiciliaria_bogota",
            label="Placa domiciliaria",
            value=f"{address_attrs.get('PDONVIAL', '')} {address_attrs.get('PDOTEXTO', '')}".strip(),
            matched=True,
            method="address_resolution",
            attributes=address_attrs,
            geometry_relation={"frontPoint": front_point},
            confidence="high",
        ),
        make_fact(
            source=sources.get("lote_bogota", {}),
            source_id="lote_bogota",
            label="Lote catastral",
            value=str(lot_attrs.get("LOTCODIGO", lot_code)),
            matched=True,
            method="lot_lookup",
            attributes=lot_attrs,
            geometry_relation={"centroid": lot_centroid},
            confidence="high",
        ),
    ]

    for layer in config.get("layers", []):
        source_id = layer["sourceId"]
        source = sources.get(source_id, {})
        method = layer.get("method", "centroid_within")

        if not layer.get("restUrl"):
            facts.append(
                make_fact(
                    source=source,
                    source_id=source_id,
                    label=source.get("title", source_id),
                    value="No calculado",
                    matched=False,
                    method="not_computed",
                    attributes={"notes": layer.get("notes", "Layer has no configured REST endpoint.")},
                    geometry_relation={"centroid": lot_centroid},
                    confidence="low",
                )
            )
            warnings.append(f"{source_id}: overlay not computed in V2.1.")
            continue

        point = front_point if method == "front_point_intersects" else lot_centroid
        feature = query_point(layer["restUrl"], point["x"], point["y"])
        if feature is None:
            facts.append(
                make_fact(
                    source=source,
                    source_id=source_id,
                    label=source.get("title", source_id),
                    value="Sin coincidencia",
                    matched=False,
                    method=method,
                    attributes={},
                    geometry_relation={"queryPoint": point},
                    confidence="medium",
                )
            )
            continue

        attrs = feature.get("attributes", {})
        facts.append(
            make_fact(
                source=source,
                source_id=source_id,
                label=source.get("title", source_id),
                value=select_value(attrs, layer.get("valueFields", [])),
                matched=True,
                method=method,
                attributes=attrs,
                geometry_relation={"queryPoint": point},
                confidence="high",
            )
        )

    output = {
        "parcelId": config["caseId"],
        "caseId": config["caseId"],
        "resolvedFrom": {
            "kind": "address",
            "value": config["address"],
            "confidence": "high",
        },
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "spatialReference": config.get("spatialReference", "EPSG:4686"),
        "parcel": {
            "address": config["address"],
            "lotCode": lot_code,
            "frontPoint": front_point,
            "centroid": lot_centroid,
        },
        "facts": facts,
        "warnings": warnings,
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(facts)} spatial facts to {output_path}")
    return 0


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def query_where(rest_url: str, where: str, return_geometry: bool) -> dict[str, Any] | None:
    params = {
        "f": "json",
        "where": where,
        "outFields": "*",
        "returnGeometry": "true" if return_geometry else "false",
        "outSR": "4686",
        "resultRecordCount": "5",
    }
    data = request_json(rest_url.rstrip("/") + "/query", params)
    return first_feature(data)


def query_point(rest_url: str, x: float, y: float) -> dict[str, Any] | None:
    params = {
        "f": "json",
        "geometry": f"{x},{y}",
        "geometryType": "esriGeometryPoint",
        "inSR": "4686",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": "*",
        "returnGeometry": "false",
        "resultRecordCount": "5",
    }
    data = request_json(rest_url.rstrip("/") + "/query", params)
    return first_feature(data)


def request_json(url: str, params: dict[str, str]) -> dict[str, Any]:
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(f"{url}?{query}", headers={"User-Agent": "kr9b-rag-spatial-facts/1.0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def first_feature(data: dict[str, Any]) -> dict[str, Any] | None:
    features = data.get("features") or []
    if not features:
        return None
    return features[0]


def centroid_from_rings(rings: list[list[list[float]]]) -> dict[str, float]:
    if not rings or not rings[0]:
        raise RuntimeError("Lot geometry has no polygon rings.")
    ring = rings[0]
    points = ring[:-1] if ring[0] == ring[-1] else ring
    area_twice = 0.0
    cx = 0.0
    cy = 0.0
    for index, point in enumerate(points):
        next_point = points[(index + 1) % len(points)]
        cross = point[0] * next_point[1] - next_point[0] * point[1]
        area_twice += cross
        cx += (point[0] + next_point[0]) * cross
        cy += (point[1] + next_point[1]) * cross
    if math.isclose(area_twice, 0.0):
        return {
            "x": sum(point[0] for point in points) / len(points),
            "y": sum(point[1] for point in points) / len(points),
        }
    return {
        "x": cx / (3.0 * area_twice),
        "y": cy / (3.0 * area_twice),
    }


def select_value(attributes: dict[str, Any], fields: list[str]) -> str:
    for field in fields:
        value = attributes.get(field)
        if value not in (None, ""):
            return str(value)
    for value in attributes.values():
        if value not in (None, ""):
            return str(value)
    return "Coincidencia sin atributo principal"


def make_fact(
    *,
    source: dict[str, Any],
    source_id: str,
    label: str,
    value: str,
    matched: bool,
    method: str,
    attributes: dict[str, Any],
    geometry_relation: dict[str, Any],
    confidence: str,
) -> dict[str, Any]:
    return {
        "id": source_id,
        "label": label,
        "value": value,
        "sourceId": source_id,
        "matched": matched,
        "method": method,
        "attributes": attributes,
        "geometryRelation": geometry_relation,
        "sourceUrl": source.get("officialUrl", ""),
        "dataDate": source.get("dataDate", ""),
        "confidence": confidence,
    }


if __name__ == "__main__":
    sys.exit(main())
