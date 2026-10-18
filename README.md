# Problem Statement — PS2: Agentic AI, Private Legal Document Triage Agent

> **This project is a submission for ZeroDay OSS Hacktoberfest 2026 (IIIT Dharwad), problem statement PS2 — Private Legal Document Triage Agent.**

Legal documents such as rental agreements, employment contracts, legal notices and service agreements contain complex terminology and clauses that ordinary people find hard to understand, and professional help for every first question is not always practical.

**The challenge.** Build a privacy-first, fully on-device AI agent powered by a Gemma 3n-class model that can read legal documents, explain legal terminology in plain language, summarise key clauses, and highlight potential risks or ambiguities, without presenting its explanations as definitive legal advice.

| Key requirement | What it means |
|---|---|
| On-device privacy | Process documents locally; sensitive legal information is never sent to external servers. |
| Plain-language explanations | Make clauses, obligations, rights, penalties and termination conditions easier to understand. |
| Uncertainty and safe escalation | Recognise ambiguous, incomplete or jurisdiction-dependent issues; avoid unsupported conclusions; recommend a qualified legal professional when appropriate. |
| Document-grounded responses | Base explanations on the document and separate what the text states from possible interpretations or concerns. |

**Important boundary.** This tool is for preliminary document understanding and issue identification. It is not a lawyer and not a source of definitive legal advice, and it cannot decide legal validity. Presenting output as legal advice will be penalised.

---

# LegalTriage

An offline, on-device legal-document explainer. Upload a PDF or plain-text agreement, ask a question in everyday English, and get a plain-language answer whose every claim is backed by a verbatim quote from your own document — with the page number, the exact source passage, and an honest label for how strong the evidence is.

When the document says nothing, it says so. When a question asks for a legal verdict, it declines and tells you to talk to a qualified professional.

## What works (demo-ready)

| Feature | Evidence |
|---|---|
| **PDF upload (≤20 MB, ≤300 pages)** | `POST /api/upload` → chunks with page numbers |
| **Page-aware parsing** | `pdfjs-dist` extracts per-page text; chunks never cross pages |
| **Verbatim citations** | Every answer includes the exact quote + page; fails gate if not found |
| **Multi-clause broad questions** | "critical things in this doc" → 5 clauses, each with own quote + page |
| **Single-clause specific questions** | "what notice must be given to cancel?" → exact clause + page |
| **Honest refusals** | Document-silent questions → "not in document"; verdict questions → escalation |
| **Zero network egress** | Only socket: `127.0.0.1:11434` (Ollama); proven by connection-monitor script |
| **Works on real legal PDFs** | Tested on SEC exhibits, Indian leave-license, construction contracts |

## Quick start

```bash
# Prerequisites: Node 24, Ollama with gemma3n:e2b, embeddinggemma, gemma3:4b
# (Ollama runs with OLLAMA_NO_UPDATE_CHECKS=true, `ollama serve`)

git clone https://github.com/ZERODAY-2026/Xlr8.git
cd Xlr8
npm install          # pinned deps: express, multer, pdfjs-dist

# Terminal 1: start Ollama (if not already)
ollama serve

# Terminal 2: start the app
npm start            # → http://127.0.0.1:3000

# Or CLI (no browser):
node cli.js ask "path/to/agreement.pdf" "what is the notice period?"
```

## Demo flow (browser)

1. Open `http://127.0.0.1:3000`
2. Drop a PDF (rental, employment, affiliate, service agreement…)
3. Ask: *"what notice must be given to cancel?"* or *"critical things I need to be aware of"*
4. See: plain-language answer + **verbatim quote** + **page chip** (one per clause)
5. Click trash to remove and start over

## Architecture (single-machine, offline)

```
browser (public/) ←── HTTP ──→ Express (server.js)
                                    │
                                    ├── /api/upload  → parse → chunk → embed → ./data/chunks.json
                                    ├── /api/ask     → embed q → top-k 6 → chat → verify → answer
                                    └── /api/doc/:id → return stored chunks (no embeddings)
```

**Pipeline** (lib/):
- `parse.js` — PDF/TXT → `[{page, text}]`
- `chunk.js` — paragraphs per page, 2000-char cap with word-boundary segmentation (CR-01 fix)
- `embed.js` — `embeddinggemma` via Ollama `/api/embed`; cosine top-k (no vector DB)
- `ollama.js` — JSON-mode `/api/chat` with retry + `gemma3:4b` fallback
- `verify.js` — hard gate: normalised quote must be substring of stored chunk text
- `pipeline.js` — ingest + ask (shared by CLI & server)

## Evidence (not assertions)

| Claim | Proof |
|---|---|
| Privacy (loopback only) | `scripts/privacy-evidence.ps1` → `evidence/privacy-report.md` (0 non-loopback sockets) |
| Citation gate | `lib/verify.test.js` — 9 tests; real PDFs pass through gate |
| Segment-boundary quotes | `lib/verify.test.js` — quotes crossing 2000-char cuts still verify |
| Typographic quotes | `lib/verify.test.js` — curly/smart quotes folded before match |
| Multi-claim broad answers | `lib/pipeline.test.js` — 2–5 verified claims, unverifiable dropped |
| Real-doc uploads | `evidence/` — 3 PS2-linked PDFs upload → chunks → asks succeed |

## Contract (docs/api.md)

- `POST /api/upload` (multipart `file`) → `{docId, filename, chunks}`
- `POST /api/ask` `{question}` → `{answer, quote, page, claims?: [{quote, page, plain}]}`
- `GET /api/doc/:id` → `{docId, filename, chunks: [{id, page, text}]}`
- CLI: `node cli.js ask <file> "<question>"` → prints `ANSWER:`, `QUOTE:`, `PAGE:`

## Testing

```bash
npm test              # 29/29 passing
# lib/verify.test.js     — citation gate (9)
# lib/chunk.test.js      — segmentation (4)
# lib/parse.test.js      — page-aware parse (1)
# lib/ollama.test.js     — JSON mode, retry, fallback (3)
# lib/pipeline.test.js   — ingest/ask/verify (4, +2 multi-claim)
# public.test.js         — UI shell + ask panel (6)
# cli.test.js            — CLI contract (2)
```

## Hackathon rubric alignment

| Criterion | How LegalTriage meets it |
|---|---|
| **On-device (G2/G3)** | Zero external sockets; Ollama on localhost; demo runs on fresh clone |
| **Grounded explanations (G1)** | Verbatim quote + page for every claim; gate rejects paraphrases |
| **Uncertainty & refusal (G1)** | `not_in_document` tier; legal-verdict questions decline with escalation |
| **Privacy (G4)** | Connection-monitor script + zero egress architecture |
| **Demo works on judge's machine** | Fresh clone → `npm install` → `ollama serve` → `npm start` → works |

## Known limits (honest)

- CPU-only inference: first ask after idle ~15-40s (model loads), subsequent faster
- Gemma 3n on 7.8 GB model + browser ≈ 15 GB RAM — keep PDFs ≤ ~100 pages
- No multi-document comparison (single-document session)
- Indian jurisdiction: escalation text is generic; local lawyer needed for validity
- Only CC-licensed/self-authored docs committed (PS2-linked PDFs used at demo time)

## License

MIT — see `LICENSE`. Demo documents used at runtime are from the PS2 problem statement's public links.