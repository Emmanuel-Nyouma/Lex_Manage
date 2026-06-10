# -*- coding: utf-8 -*-
"""Read report.pdf, find the page of each @@token@@ marker, write pages.json."""
import json, os, re
import pdfplumber

HERE = os.path.dirname(os.path.abspath(__file__))
pdf_path = os.path.join(HERE, "report.pdf")
pages = {}
pat = re.compile(r"@@(t\d+)@@")
with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages, start=1):
        text = page.extract_text() or ""
        for tok in pat.findall(text):
            if tok not in pages:        # first occurrence = where it starts
                pages[tok] = i
with open(os.path.join(HERE, "pages.json"), "w", encoding="utf-8") as f:
    json.dump(pages, f)
print("pages.json written:", len(pages), "markers mapped")
