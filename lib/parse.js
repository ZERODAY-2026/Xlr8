// lib/parse.js — page-aware extraction (ING-03): PDF/TXT → [{ page, text }].
// PDFs must go through the pdfjs LEGACY build: the modern build crashes on Node 24.
import fs from 'node:fs/promises';
import path from 'node:path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function parseFile(filePath) {
  const ext = path.extname(String(filePath)).toLowerCase();
  if (ext === '.txt') {
    const text = await fs.readFile(filePath, 'utf8');
    return [{ page: 1, text }];
  }
  if (ext === '.pdf') {
    const buf = await fs.readFile(filePath);
    // isEvalSupported: false — uploaded PDFs are hostile input; no JS-eval paths.
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buf),
      useSystemFonts: true,
      isEvalSupported: false,
    }).promise;
    const pages = [];
    // pdfjs v6's document handle exposes no destroy method — nothing to release here.
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      pages.push({ page: p, text: tc.items.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim() });
    }
    return pages;
  }
  throw new Error(`Unsupported file type: ${ext || '(no extension)'}`);
}
