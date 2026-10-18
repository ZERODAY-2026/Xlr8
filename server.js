// server.js — the Express API surface over the proven pipeline (docs/api.md contract).
// PRV-01/T-01-07: binds 127.0.0.1 only — never 0.0.0.0. Every error body is a
// deterministic { error: string } JSON; no stacks, no document content in errors.
import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

import { parseFile } from './lib/parse.js';
import { ingest, askStored } from './lib/pipeline.js';

const DATA_DIR = './data';
const STORE_PATH = './data/chunks.json';
const PAGE_CAP = 300;

// UI-SPEC Copywriting Contract error rows, placeholders resolved (plan 01-03 Task 1).
const ERR_SIZE = 'That file is 20 MB or over. Try a document under 20 MB and about 300 pages.';
const ERR_TYPE = 'That file type is not supported. Try a PDF or plain-text (.txt) document.';
const ERR_PAGES = 'That document is over 300 pages. Try a document under 20 MB and about 300 pages.';
const ERR_MODEL =
  'Processing failed on the local model. Check that Ollama is running (ollama serve), then upload again.';

fs.mkdirSync(DATA_DIR, { recursive: true });

const app = express();

// T-01-06: the client's filename never becomes a storage path — random UUID name,
// 20 MB size cap, .pdf/.txt extension allow-list.
const upload = multer({
  storage: multer.diskStorage({
    destination: DATA_DIR,
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname)),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/\.(pdf|txt)$/i.test(file.originalname)) cb(null, true);
    else {
      const err = new Error(ERR_TYPE);
      err.code = 'LIMIT_UNEXPECTED_FILE';
      cb(err);
    }
  },
});

// POST /api/upload — multipart field "file"; the single-document session ingest.
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: ERR_TYPE });
  const original = path.basename(String(req.file.originalname));

  let pages;
  try {
    pages = await parseFile(req.file.path);
  } catch {
    // Unparseable upload: drop the stored bytes, report as a processing failure.
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(500).json({ error: ERR_MODEL });
  }
  if (pages.length > PAGE_CAP) {
    // Rejected post-parse: the saved file is deleted — no orphan bytes under ./data/.
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: ERR_PAGES });
  }

  try {
    const doc = await ingest(req.file.path, original);
    return res.status(200).json({ docId: doc.docId, filename: original, chunks: doc.chunks.length });
  } catch {
    return res.status(500).json({ error: ERR_MODEL });
  }
});

// GET /api/doc/:id — stored document without embeddings (docs/api.md §3).
app.get('/api/doc/:id', async (req, res) => {
  let stored = null;
  try {
    stored = JSON.parse(await fs.promises.readFile(STORE_PATH, 'utf8'));
  } catch {
    // no document ingested yet — 404 below
  }
  if (!stored || stored.docId !== req.params.id) {
    return res.status(404).json({ error: 'not found' });
  }
  return res.json({
    docId: stored.docId,
    filename: stored.filename,
    chunks: stored.chunks.map((c) => ({ id: c.id, page: c.page, text: c.text })),
  });
});

// POST /api/ask — the same verify() gate as the CLI, one pipeline two entries.
app.post('/api/ask', express.json(), async (req, res) => {
  let result;
  try {
    result = await askStored(req.body && req.body.question);
  } catch (err) {
    if (err && err.message === 'no document') return res.status(400).json({ error: 'no document' });
    if (err && err.usage) return res.status(400).json({ error: err.message });
    // Ollama down or model failure — same copy, 503.
    return res.status(503).json({ error: ERR_MODEL });
  }
  return res.json(result);
});

// Static upload shell (Task 2 builds public/).
app.use(express.static('public/'));

// One error middleware: multer size/type codes map to their verbatim rows; everything
// else collapses to the model-failure copy. Never a stack trace on the wire.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: ERR_SIZE });
  if (err && err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ error: ERR_TYPE });
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'invalid JSON body' });
  console.error(err);
  return res.status(500).json({ error: ERR_MODEL });
});

// T-01-07: loopback bind only — the string '127.0.0.1' is grep-able proof.
app.listen(3000, '127.0.0.1', () => {
  console.log('LegalTriage running at http://127.0.0.1:3000');
});
