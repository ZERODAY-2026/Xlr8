# LegalTriage API Contract

**Status:** binding cross-phase contract (written before any `lib/` code — contract-first).
Change this file first, then the code. Phase 1 implements; Phases 2–4 extend, never reshape.

Base URL for all HTTP routes: `http://127.0.0.1:3000` — localhost only. The single
permitted outbound socket in the whole application is Ollama at
`http://127.0.0.1:11434`.

## 1. Storage: `chunks.json`

Path: `./data/chunks.json` (gitignored runtime directory — document content, extracted
text, chunks and embeddings live only under `./data/`).

Shape:

```json
{
  "docId": "<sha256 hex of the file bytes>",
  "filename": "rental.txt",
  "chunks": [
    {
      "id": 0,
      "page": 1,
      "text": "…verbatim chunk text…",
      "embedding": [0.0123]
    }
  ]
}
```

Field contract:

- `docId` — sha256 hex digest of the uploaded/selected file's bytes. One document at a
  time; `docId` is the primary key.
- `filename` — original file name as supplied by the uploader.
- `chunks[].id` — 0-based integer, ascending by page, then within-page appearance order.
- `chunks[].page` — 1-based page number the chunk text came from. A chunk never spans
  pages: its page is always the source page of its own text.
- `chunks[].text` — verbatim extracted text of one paragraph-sized chunk (capped at
  2000 chars by `lib/chunk.js`).
- `chunks[].embedding` — array of 768 floats (embeddinggemma output dimension,
  probe-verified). Omitted from `GET /api/doc/:id` responses.

## 2. Answer object

Phase-1 fields (what the CLI and `POST /api/ask` return on a verified answer):

```json
{
  "answer": "plain-language explanation of the document's text",
  "quote": "verbatim text from a chunk of the document",
  "page": 1,
  "claims": [
    { "quote": "verbatim text from a chunk of the document", "page": 1, "plain": "one short sentence" }
  ]
}
```

- `answer` — plain-language explanation. Never a legal verdict or legal advice: the
  model explains what the document says.
- `quote` — must occur verbatim (after normalisation, see `lib/verify.js`) in a stored
  chunk. Quotes that fail the gate are dropped and reported as unverifiable — never
  fuzzy-matched, never displayed.
- `page` — the `page` of the earliest chunk whose text contains the verified quote.
- `claims` — **additive, optional.** The verified per-clause quotes for a broad question,
  most important first (2–5 on a good reply, one object on a narrow question). Each entry
  is `{ "quote", "page", "plain" }` where `plain` is an optional one-sentence summary;
  `quote`/`page` above mirror `claims[0]`. A consumer that ignores `claims` sees exactly
  the Phase-1 object. Every claim passes the same `lib/verify.js` gate — unverifiable
  claims are dropped, and when none survive the response is the unverifiable shape below.

**Reserved field names — reserved, lands Phase 2** (listed now so Phase 2 extends the
object instead of reshaping it):

- `tier` — `stated` | `interpretation` | `not_in_document`
- `kind` — `obligation` | `right` | `penalty` | `termination` | `date` | `party`
- `escalate` — boolean
- `confidence_basis` — string

Verification failure shape (returned instead of the answer object):

```json
{ "unverifiable": true, "reason": "quote not found in source" }
```

## 3. HTTP routes

All routes on `http://127.0.0.1:3000`.

### `POST /api/upload`

- multipart/form-data, field name **`file`**
- allowed extensions: `.pdf` and `.txt` only
- size cap: **20 MB**; page cap: **~300 pages** (checked post-parse) — both rejected
  with a clear message, never a crash
- stores the file and its `chunks.json` under `./data/`
- **201/200 response:** `{ "docId": "<sha256 hex>", "filename": "rental.txt", "chunks": 12 }`

### `POST /api/ask`

- JSON body: `{ "question": "what is the notice period?" }`
- Uses the most recently ingested document; 400 `{ "error": … }` when no document has
  been ingested
- **Response (verified):** `{ "answer": …, "quote": …, "page": …, "claims": [ { "quote": …, "page": …, "plain": … } ] }`
  — `claims` is additive/optional; `quote`/`page` mirror `claims[0]`
- **Response (gate rejected the quote):** `{ "unverifiable": true, "reason": "quote not found in source" }`
- **400** `{ "error": "no document ingested" }` when no document is loaded

### `GET /api/doc/:id`

- **200 response:** `{ "docId": "…", "filename": "…", "chunks": [ { "id": 0, "page": 1, "text": "…" } ] }`
  — embeddings omitted
- **404:** `{ "error": "not found" }` for an unknown `docId`

Error bodies are deterministic `{ "error": … }` JSON; no stack traces, no document
content in errors.

## 4. CLI output contract

Entry point: `node cli.js ask <document> "<question>"`

| Case | Exact stdout |
|------|--------------|
| Happy path | Lines starting exactly with `ANSWER: `, `QUOTE: `, `PAGE: ` |
| Verification failure | `UNVERIFIABLE: quote not found in source` |
| Bad usage | `Usage: node cli.js ask <document> "<question>"` |
| Ollama down | `ERROR: Ollama unavailable at http://127.0.0.1:11434 — start it with 'ollama serve'` |

A verification failure prints the `UNVERIFIABLE:` line and no quote — the quote must
never appear on stdout unless the verifier approved it.

## 5. Runtime artifact hygiene

All runtime artifacts — uploaded files, `chunks.json`, extracted text, chunks,
embeddings — live under `./data/` (gitignored). Nothing is written to any other
location.
