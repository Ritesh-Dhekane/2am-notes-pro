#!/usr/bin/env python3
"""Extract the text of every mirrored SPPU syllabus PDF, for splitting into subjects.

Reads <drive>/_syllabus/<id>.pdf for each entry in public/data/syllabus.json and writes <out>/<id>.txt
with "## p<N>" page markers (the page numbers the split's "pages" refer to), cleaned by
tools/python-tools/doc_text.py. <out>/_report.json records pages, characters and whether the file looks
scanned (no text layer). Files already extracted are skipped, so a stopped run carries on.

    python scripts/sppu-syllabus/extract.py                 # everything not extracted yet
    python scripts/sppu-syllabus/extract.py <id> <id>       # only these (re-extracts them)
    python scripts/sppu-syllabus/extract.py --force         # everything again

Run from the repo root. Needs pypdf. Reading from a streamed Drive downloads each PDF, so a full run is slow.
"""
import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOGUE = ROOT / "public" / "data" / "syllabus.json"

# A page with fewer characters than this has no usable text; a file mostly made of such pages is scanned.
EMPTY_PAGE = 30
SCANNED_SHARE = 0.6


def load_doc_text(tools):
    sys.path.insert(0, str(tools))
    import doc_text

    return doc_text


def read_pages(doc_text, pdf):
    try:
        return doc_text.pages_pdf(pdf)
    except Exception:  # pypdf rejects some PDFs (e.g. duplicate font entries); pdfplumber reads them
        import pdfplumber

        with pdfplumber.open(str(pdf)) as doc:
            return [(p.extract_text() or "") for p in doc.pages]


def extract(doc_text, pdf):
    raw = read_pages(doc_text, pdf)
    pages, _ = doc_text.clean(raw)
    empty = sum(1 for text in raw if len(text.strip()) < EMPTY_PAGE)
    text = "\n".join(f"## p{n}\n" + "\n".join(lines) for n, lines in pages)
    return text, {
        "pages": len(raw),
        "chars": sum(len(ln) for _, lines in pages for ln in lines),
        "emptyPages": empty,
        "scanned": bool(raw) and empty / len(raw) >= SCANNED_SHARE,
    }


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("ids", nargs="*", help="only these catalogue ids")
    ap.add_argument("--drive", default=r"G:\My Drive\2-am-notes-pro\_syllabus", help="folder with <id>.pdf")
    ap.add_argument("--out", default=str(ROOT.parent / "notes-studio" / "syllabus-split" / "text"))
    ap.add_argument("--tools", default=str(ROOT.parents[1] / "tools" / "python-tools"), help="folder with doc_text.py")
    ap.add_argument("--force", action="store_true", help="extract files that already have text")
    a = ap.parse_args()

    doc_text = load_doc_text(a.tools)
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    report_path = out / "_report.json"
    report = json.loads(report_path.read_text(encoding="utf-8")) if report_path.exists() else {}

    catalogue = json.loads(CATALOGUE.read_text(encoding="utf-8"))["items"]
    ids = a.ids or [e["id"] for e in catalogue]
    todo = [i for i in ids if a.ids or a.force or not (out / f"{i}.txt").exists()]
    print(f"{len(todo)} to extract ({len(ids) - len(todo)} already done)")

    for n, sid in enumerate(todo, 1):
        pdf = Path(a.drive) / f"{sid}.pdf"
        start = time.time()
        try:
            if not pdf.exists():
                raise FileNotFoundError("not mirrored yet")
            text, info = extract(doc_text, pdf)
            (out / f"{sid}.txt").write_text(text, encoding="utf-8")
        except Exception as err:  # a broken or missing PDF is recorded, the run goes on
            info = {"error": f"{type(err).__name__}: {err}"[:300]}
        report[sid] = info
        report_path.write_text(json.dumps(report, indent=1, ensure_ascii=False), encoding="utf-8")
        flag = info.get("error") or ("scanned" if info.get("scanned") else f"{info['pages']} pages")
        print(f"[{n}/{len(todo)}] {sid}: {flag} ({time.time() - start:.1f}s)")

    bad = [i for i in ids if report.get(i, {}).get("error")]
    scanned = [i for i in ids if report.get(i, {}).get("scanned")]
    print(f"done: {len(ids) - len(bad) - len(scanned)} with text, {len(scanned)} scanned, {len(bad)} failed")


if __name__ == "__main__":
    main()
