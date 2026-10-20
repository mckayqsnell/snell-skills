---
name: to-markdown
description: Convert files to Markdown — PDFs, images, Word/PowerPoint/Excel docs, HTML, audio, and other media — so their content can be used as lightweight AI context. Use when the user says "/to-markdown", "to markdown", "convert this PDF/image/doc", or wants file contents extracted into .md files.
---

# to-markdown

Convert the given file(s) to Markdown. Goal: capture roughly all the information, not pixel-perfect fidelity. Unless told otherwise, write the output next to the source with the same basename and a `.md` extension (`Benefits Guide.pdf` → `Benefits Guide.md`). If given a directory, convert every supported file in it.

## By file type

**PDF, DOCX, PPTX, XLSX, HTML, CSV, EPUB, audio** — use MarkItDown (Microsoft, https://github.com/microsoft/markitdown). No install needed with uv:

```bash
uvx --from 'markitdown[all]' markitdown "input.pdf" -o "output.md"
```

(`markitdown[pdf]` is enough if only converting PDFs.)

**Images (png/jpg/webp/heic, screenshots, photos of documents)** — MarkItDown only extracts EXIF/OCR fragments. Instead, read the image directly with your vision and transcribe it yourself into Markdown: reproduce headings, tables, and lists; describe charts/diagrams in prose.

**Scanned PDFs** — if MarkItDown's output is empty or near-empty, the PDF is an image scan. Read the PDF directly (vision) and transcribe it to Markdown yourself, same as an image.

## Quality checks (always)

1. After converting, verify the .md is non-empty and skim it — MarkItDown tables from complex layouts can come out mangled. If a table is garbled but legible, leave it; if information was *lost*, re-read the source and fix that section by hand.
2. Note in one line to the user anything that didn't survive conversion (images, charts, scanned pages you transcribed manually).
