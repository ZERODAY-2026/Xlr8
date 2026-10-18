# Implementation Plan: PS2 — Private Legal Document Triage Agent

ZeroDay OSS Hacktoberfest 2026 · 1-day hackathon · 10:00 → 20:30 IST · team of 3

## Overview

An offline, on-device agent that reads a legal document (PDF/TXT), explains clauses in
plain language with verbatim citations, separates what the document *says* from what it
*implies*, flags what it does not answer, and never leaves the machine. All inference
(Gemma 3n E2B via Ollama) and all embeddings (EmbeddingGemma) run on localhost.

## Architecture Decisions

- **Node 24 + TypeScript-free plain JS, Express.** Python on this box is 3.7.9 — unusable
  for modern libs. Node 24 and git are installed.
- **PDF parsing: `pdfjs-dist`.** Gives *per-page* text, which is required for "page N"
  citations (a whole-document string cannot cite a page).
- **No vector DB.** Chunks + embeddings live in one JSON file, cosine similarity in ~20
  lines of JS. Documents are one at a time; a DB is a dependency, not a feature.
- **LLM: Ollama `/api/chat`, `gemma3n:e2b`, `format: "json"`** for structured output.
  Fallback model `gemma3:4b` (already local) if e2b is too slow or does not fit.
- **Embeddings: Ollama `/api/embed`, `embeddinggemma`** (a Gemma model — counts toward
  meaningful Gemma use, and keeps embeddings local).
- **Citation verifier is a hard gate, not a prompt request.** Every `quote` returned by
  the model must occur verbatim (whitespace-normalised) in the stored chunk text;
  non-matching claims are dropped and reported as unverifiable. This is what buys
  rubric #2 (15 pts) and defeats the fabrication gate.
- **Three evidence tiers in the output schema** — `stated` (quote-backed),
  `interpretation`, `not_in_document` — plus `escalate: true` for
  jurisdiction-dependent / validity questions. Buys rubric #3 (15 pts).
- **Privacy proof by construction:** the app holds no outbound socket except
  `127.0.0.1:11434`. `scripts/privacy-evidence.ps1` records every non-loopback TCP
  connection of `node.exe`/`ollama.exe` during a full run while a firewall block rule
  is active, and writes `evidence/privacy-report.md`. Buys rubric #4 (15 pts) and
  mirrors exactly the test judges said they will run.
- **Ollama update checker disabled** (`OLLAMA_NO_UPDATE_CHECKS=true`, and run
  `ollama serve` rather than the tray app) — documented as the one setup-time network
  call; it carries no document content.

## Data flow

```
PDF/TXT → pdfjs-dist (page-aware text) → chunk (paragraph + page)
       → embeddinggemma → chunks.json (local, on disk)
question → cosine top-k → gemma3n:e2b (JSON mode) → {quote, plain, kind, tier, escalate}
       → verifier: quote ∈ chunk? → keep | drop
       → UI: answer + side-by-side source passage + page + tier badge
```

## Roles (parallel after Task 0)

| Owner | Owns | Ends with |
|---|---|---|
| P1 | parsing, chunking, retrieval, Ollama client, verifier, API | `POST /api/ask` returning verified citations |
| P2 | privacy evidence, repo hygiene, docs, tests, submission pack | `evidence/privacy-report.md`, README, S1–S10 checklist |
| P3 | UI: upload, clause list, highlight, Q&A with citations, badges | working browser demo |

## Task List

### Phase 0 — Contract (10:00–10:30, all three)
- [ ] Task 0: agree `chunks.json` shape, answer schema, and routes (`POST /api/upload`,
      `POST /api/ask`, `GET /api/doc/:id`) in `docs/api.md`; `git init`, MIT `LICENSE`,
      `.gitignore` (no `node_modules`, no evidence temp files), pinned `package.json`.

### Phase 1 — Vertical slice (10:30–13:30)
- [ ] Task 1 (P1): `lib/parse.js` — pdfjs-dist → `[{page, text}]`; TXT path too.
- [ ] Task 2 (P1): `lib/chunk.js` + `lib/embed.js` → `chunks.json`; cosine retrieval.
- [ ] Task 3 (P1): `lib/ollama.js` — chat with `format:"json"`, retries, model fallback.
- [ ] Task 4 (P1): `lib/verify.js` — quote-exists gate + tier normalisation.
- [ ] Task 5 (P3): upload + render chunk list with page numbers.

**Checkpoint 1 (13:30):** CLI: `node cli.js ask sample.pdf "what is the notice period?"`
→ plain-language answer + verbatim quote + page, no network outside localhost.
- [ ] Review with a human before proceeding. Stage 1 evaluation begins 13:30 IST — land the clean commit before it.

### Phase 2 — Scored behaviour (13:30–15:00)
- [ ] Task 6 (P1): answer schema with `tier`, `kind` (obligation/right/penalty/
      termination/date/party), `escalate`, `confidence_basis`; prompt that forbids
      verdicts and requires `not_in_document` when unsupported.
- [ ] Task 7 (P1): refusal paths — "is this enforceable?" → decline + escalation text;
      empty retrieval → "document is silent on this".
- [ ] Task 8 (P3): Q&A UI with side-by-side source panel, tier badges, escalation
      banner, disclaimer footer.
- [ ] Task 9 (P2): `scripts/privacy-evidence.ps1` + firewall rule + offline run →
      `evidence/privacy-report.md`.

**Checkpoint 2 (15:00):** end-to-end in the browser; privacy evidence captured on a
full run; refusal and "document is silent" demonstrated.

### Phase 3 — Beyond the minimum (15:00–17:30, in this order)
- [ ] Task 10: structured extraction panel — parties, dates, penalties, notice periods
      (advanced `{OPT}`, lifts rubric #1 and #7).
- [ ] Task 11: adversarial + prompt-injection fixtures (`fixtures/`) and a runner that
      records results → `evidence/robustness.md` (rubric #6, 12 pts).
- [ ] Task 12: speed/memory benchmark — tokens/s, RSS, per-question latency →
      `evidence/benchmarks.md` (rubric #5, 10 pts).
- [ ] Task 13: tests — `node:test` for verifier (fabricated quote rejected), tier
      normalisation, chunker page mapping (C7, 10 pts).
- [ ] Task 14: two-version comparison **only if** 13 and all above are green.

**Checkpoint 3 (17:30):** all scored items done; nothing new starts after this.

### Phase 4 — Ship (17:30–20:30)
- [ ] Task 15 (P2): README (overview, setup, run, config, troubleshooting), pinned
      deps, OS/hardware tested, model sizes, architecture diagram (S2–S4).
- [ ] Task 16 (P2): dataset/licence disclosure, attribution, known limitations (S5, S8).
- [ ] Task 17: 5-minute recording — including limits, a refusal, a silent-document
      case, and the privacy evidence (S7, S9).
- [ ] Task 18: submission checklist `docs/submission.md` — S1–S10 + L1–L10 + gates
      G1–G5, each with where it is proved.

**Checkpoint 4 (20:00):** fresh-clone run-through by someone who did not build it.

## Bonus points ranked by value per hour (do top-down, stop when time runs out)

| # | Item | Serves | Cost |
|---|---|---|---|
| 1 | Privacy evidence w/ connection monitor | crit 4 (15) + gate L2 | ~1.5 h |
| 2 | Verifier + tier schema + refusal | crit 2+3 (30) + gate L4 | built in Phase 2 |
| 3 | Adversarial / prompt-injection suite | crit 6 (12) | ~1 h |
| 4 | Benchmarks (tok/s, RSS, latency) | crit 5 (10) | ~0.5 h |
| 5 | Structured extraction panel | crit 1 (15), usability | ~1.5 h |
| 6 | Tests + pinned deps + README | C5+C7 (25) | ~1.5 h |
| 7 | Two-version comparison | advanced, marginal | ~1.5 h |
| — | OCR for scans, multilingual, encryption-at-rest, CUAD-scale eval | marginal for 1 day | **skipped** |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `gemma3n:e2b` needs newer Ollama; 7.8 GB on a 15 GB box | High | Updating Ollama now (setup time); `gemma3:4b` already local as fallback; measure RSS at Checkpoint 1 |
| CPU inference too slow for a live demo | High | Retrieval keeps prompts to top-k 6 chunks; pre-warm model; recording ready as backup |
| Quote verifier too strict (PDF hyphenation/ligatures) | Medium | Normalise whitespace, dashes, ligatures before matching; fuzzy fallback logs "near-match" honestly |
| Firewall rule blocks our own localhost API | Medium | Verify at Task 9 immediately; if loopback is affected, fall back to monitor-only + document |
| Scope creep past 17:30 | High | Checkpoint 3 is a hard stop; Task 14 is the only stretch item |

## Open Questions

- Which sample documents? Need at least one rental agreement, one employment contract,
  one malformed/adversarial file — gathered by P2 during Phase 1, licences noted (G4).
- Submission portal / deadline specifics announced separately by organizers.
