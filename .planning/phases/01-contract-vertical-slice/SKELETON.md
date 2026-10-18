# Walking Skeleton — LegalTriage (PS2)

**Phase:** 1
**Generated:** 2026-10-18

## Capability Proven End-to-End

From a fresh checkout, a legal document (TXT/PDF) is ingested page-aware into `./data/chunks.json` via `node cli.js ask <doc> "<question>"`, and a plain-language answer is returned with a verbatim, page-cited quote that passed the code-level citation gate — while the browser upload shell shows the same document's chunks with their page numbers; every byte stays on-device (only socket: `127.0.0.1:11434`).

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Runtime / language | Node 24, plain JavaScript ESM (`"type": "module"`), no build step | System Python 3.7.9 unusable; a demo must run from a fresh clone with zero build failure modes; pdfjs-dist v6 is ESM-only |
| HTTP framework | Express 5.3.0 + multer 2.4.0 (exact-pinned) | Official Express middleware for multipart upload; smallest dependency surface that is not hand-rolled |
| PDF parsing | `pdfjs-dist@6.4.299` **legacy build** (`pdfjs-dist/legacy/build/pdf.mjs`), per-page `getTextContent()` | Probe-verified on this machine; page-aware extraction is required for "page N" citations; modern build crashes on Node 24 |
| LLM | Local Ollama `/api/chat`, `gemma3n:e2b` (`format:"json"`, temperature 0), fallback `gemma3:4b` | Required track technology; probe-verified JSON mode (~58 tok/s on this CPU box); fallback already local |
| Embeddings / retrieval | Ollama `/api/embed`, `embeddinggemma` (768-dim, mandated task prefixes), cosine top-k 6 over a JSON file | One document at a time — a vector DB would be a dependency, not a feature |
| Data layer | Single gitignored `./data/chunks.json` (`{docId, filename, chunks:[{id,page,text,embedding}]}`) | No DB; docId = sha256 of file bytes; chunk page rides on the chunk by construction (chunks never span pages) |
| Grounding | Code-level verifier `lib/verify.js` (NFKC/dash/whitespace normalise → exact substring) as a hard gate before any quote is displayed | The rubric's grounding claim is enforcement, not prompt guidance — exists from the first slice |
| Auth | none (single-user local demo, loopback binding only) | Out of scope for a 1-day local tool; server binds `127.0.0.1` exclusively |
| Storage location | All runtime artifacts under gitignored `./data/` | Temp hygiene: nothing leaks to system temp or OneDrive-synced stray paths; judges check this |
| Deployment target | Local run only: `npm start` → `node server.js` at `http://127.0.0.1:3000`; CLI runs without the server | The demo IS the local machine; no hosting exists for a privacy-first tool |
| Directory layout | `lib/` single-word lowercase modules (parse, chunk, embed, ollama, verify, pipeline), `cli.js`, `server.js`, `public/`, `fixtures/`, `docs/` | Project convention: one responsibility per module, relative imports, no aliases |

## Stack Touched in Phase 1

- [x] Project scaffold — `package.json` (ESM, pinned deps, `start`/`test` scripts) + committed lockfile
- [x] Routing — `POST /api/upload`, `POST /api/ask`, `GET /api/doc/:id` (contract in `docs/api.md`)
- [x] Data layer — real write (`ingest` → `./data/chunks.json`) AND real read (retrieval + `GET /api/doc/:id`)
- [x] UI — upload drop zone + chunk list with `p. {page}` chips wired to the API (per 01-UI-SPEC, D-04: no Q&A UI yet)
- [x] Deployment — documented local full-stack run: `npm start` (browser) and `node cli.js ask <doc> "<q>"` (no server needed)

## Out of Scope (Deferred to Later Slices)

- Q&A screen, side-by-side source panel, tier badges, escalation banner, disclaimer footer (Phase 2, per D-04)
- Answer schema tiers `stated`/`interpretation`/`not_in_document`, `kind`, `escalate`, refusal paths, "document is silent" path (Phase 2 — field names reserved in `docs/api.md` now)
- `scripts/privacy-evidence.ps1` + `evidence/privacy-report.md`, firewall rule, temp-hygiene audit report (Phase 2)
- Structured extraction panel, adversarial/prompt-injection fixture suite, benchmarks, full `node:test` sweep (Phase 3)
- Multi-document sessions, OCR, TypeScript, any vector DB, cloud anything (never — project out of scope)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: browser Q&A — ask a question in the UI, every claim shown side-by-side with its verified quote, page, tier badge; verdict questions refused with escalation; privacy evidence report
- Phase 3: survives malformed files, huge documents and prompt injection; structured extraction panel; measured benchmarks
- Phase 4: a stranger clones the public repo and runs the demo from the README; docs, recording, submission
