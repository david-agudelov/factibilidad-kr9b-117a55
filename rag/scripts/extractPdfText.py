import json
import os
import sys
from pathlib import Path


def extract_with_pdfplumber(pdf_path):
    import pdfplumber

    pages = []
    warnings = []
    with pdfplumber.open(pdf_path) as pdf:
        for index, page in enumerate(pdf.pages, start=1):
            try:
                text = page.extract_text(x_tolerance=1, y_tolerance=3) or ""
            except Exception as exc:
                text = ""
                warnings.append(f"page {index}: pdfplumber failed: {exc}")
            pages.append(
                {
                    "page": index,
                    "text": text,
                    "method": "pdfplumber",
                    "warnings": [],
                }
            )
    return pages, warnings


def extract_with_pypdf(pdf_path):
    from pypdf import PdfReader

    reader = PdfReader(pdf_path)
    pages = []
    warnings = []
    for index, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception as exc:
            text = ""
            warnings.append(f"page {index}: pypdf failed: {exc}")
        pages.append(
            {
                "page": index,
                "text": text,
                "method": "pypdf",
                "warnings": [],
            }
        )
    return pages, warnings


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    if len(sys.argv) != 2:
        print(
            json.dumps(
                {
                    "ok": False,
                    "pages": [],
                    "warnings": [],
                    "error": "Usage: extractPdfText.py <pdf-path>",
                },
                ensure_ascii=False,
            )
        )
        return 2

    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        print(
            json.dumps(
                {
                    "ok": False,
                    "pages": [],
                    "warnings": [],
                    "error": f"PDF not found: {pdf_path}",
                },
                ensure_ascii=False,
            )
        )
        return 1

    warnings = []
    extractor = os.environ.get("RAG_PDF_EXTRACTOR", "pdfplumber").strip().lower()
    if extractor == "pypdf":
        try:
            pages, extractor_warnings = extract_with_pypdf(str(pdf_path))
            warnings.extend(["RAG_PDF_EXTRACTOR=pypdf; pdfplumber was skipped."])
            warnings.extend(extractor_warnings)
        except Exception as pypdf_error:
            print(
                json.dumps(
                    {
                        "ok": False,
                        "pages": [],
                        "warnings": warnings,
                        "error": f"pypdf failed: {pypdf_error}",
                    },
                    ensure_ascii=False,
                )
            )
            return 1
    else:
        try:
            pages, extractor_warnings = extract_with_pdfplumber(str(pdf_path))
            warnings.extend(extractor_warnings)
        except Exception as pdfplumber_error:
            warnings.append(f"pdfplumber unavailable or failed: {pdfplumber_error}")
            try:
                pages, extractor_warnings = extract_with_pypdf(str(pdf_path))
                warnings.extend(extractor_warnings)
            except Exception as pypdf_error:
                print(
                    json.dumps(
                        {
                            "ok": False,
                            "pages": [],
                            "warnings": warnings,
                            "error": f"pypdf failed: {pypdf_error}",
                        },
                        ensure_ascii=False,
                    )
                )
                return 1

    print(
        json.dumps(
            {
                "ok": True,
                "pages": pages,
                "warnings": warnings,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
