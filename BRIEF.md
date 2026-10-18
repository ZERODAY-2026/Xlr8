# LegalTriage — Team & Judge Brief

**One-line pitch:** An offline, on-device agent that explains legal documents (rental agreements, employment contracts, legal notices, service agreements) in plain language — every claim backed by a verbatim quote from *your* document, with page numbers — and it never pretends to be a lawyer.

Read this before a judge walks up. It tells you what we built, how it works, what's done, what's next, and how to answer the hard questions without hand-waving.

---

## 1. The 30-second pitch (say this out loud)

"You upload a PDF or text legal document. It never leaves your machine — the only network connection the app makes is to a local model server on localhost. The tool extracts the text page by page, splits it into chunks, retrieves the parts relevant to your question, and explains them in plain language. Every sentence it says about your document must quote the document verbatim — if the model invents a quote, our verifier drops the claim. When the document is silent, it says so instead of guessing, and when you ask 'is this enforceable?', it declines and tells you to see a lawyer."

---

## 2. How it works (the pipeline — memorise the order)

```
PDF/TXT → page-aware parse → chunk (paragraph + page number)
   → embed locally (embeddinggemma)
   → retrieve top-6 relevant chunks (cosine similarity, ~20 lines of JS)
   → local LLM answers (Gemma via Ollama, JSON mode, on this machine)
   → VERIFIER checks every quote is verbatim in the chunk  ← the hard gate
   → plain-language answer + quote + page number, or a refusal, or "document is silent"
```

Key facts to know cold:

| Topic | The answer |
|-------|-----------|
| Stack | Node 24 + Express, plain JavaScript — no TypeScript, no build step |
| PDF parsing | `pdfjs-dist`, per-page extraction — page numbers exist *because* citations say "page N" |
| Model | Gemma 3n (`gemma3n:e2b`, ~7.8 GB) through local Ollama; fallback `gemma3:4b` |
| Embeddings | `embeddinggemma` via Ollama `/api/embed` |
| Vector store | None — chunks + embeddings live in one `chunks.json`, cosine similarity in JS |
| Retrieval size | Top-k = 6 chunks (15 GB RAM box, CPU inference — speed + memory discipline) |
| Privacy | The process may open NO socket except `127.0.0.1:11434`. Ollama update checks disabled. Document bytes never touch the network. |
| Storage | `./data/` (gitignored) — nothing sensitive in the repo or temp folders |

---

## 3. "Did AI build this without you knowing?" — how to answer

Honest answer: **we used an AI coding agent to scaffold and accelerate, and every design decision is ours, recorded, and explainable.** The proof isn't in the chat log — it's in the repo:

- **`.planning/phases/01-contract-vertical-slice/01-CONTEXT.md`** — our locked decisions (D-01 … D-05) *with reasons and what each would cost to reverse*. Example: D-04 splits the UI across phases (Phase 1 = upload + chunk list; Q&A UI in Phase 2) to avoid rework — that's an engineering tradeoff, not a generated default.
- **`.planning/PROJECT.md`** — constraints we chose before writing code (privacy as a hard rule, safety-capped rubric criteria, memory budget).
- **`tasks/plan.md` + `tasks/todo.md`** — our own timed plan with role ownership (P1 backend, P2 privacy/docs/tests, P3 UI), reconciled against the organizer's checkpoints.

Then pivot to the substance: **the parts that matter are deterministic code, not prompts.** Anyone can verify:

1. **The citation verifier (`lib/verify.js`)** — the model's `quote` field must appear *verbatim* (after whitespace normalisation) in the retrieved chunk. Not "should", not "prompted to" — a substring check in code. Non-matching claims are dropped and reported unverifiable. Ask us to show the test where a fabricated quote gets rejected.
2. **The privacy design** — privacy is proven by monitoring, not promised. `scripts/privacy-evidence.ps1` records every non-loopback TCP connection during a run into `evidence/privacy-report.md`.
3. **Refusal paths** — "is this enforceable / valid?" is a designed refusal with escalation copy, not a model whim. Tier system: `stated` | `interpretation` | `not_in_document` keeps what the document *says* separate from what it *implies*.

**What NOT to claim:** don't claim features that aren't built yet (see §5), don't say "fully offline" without mentioning the one setup-time network call (pulling the model), and never invent benchmark numbers — if we haven't measured it, say "we measure it at Checkpoint 2".

---

## 4. What's done so far (as of 2026-10-18)

Planning and design are **complete**; code lands today in Phase 1.

- [x] **Repo initialised** — git, MIT `LICENSE`, `.gitignore` (excludes `./data/`, chunk artefacts)
- [x] **`.planning/PROJECT.md`** — core value, constraints, decisions
- [x] **`.planning/REQUIREMENTS.md`** — 30 requirements across ingestion, grounding, uncertainty/refusal, privacy, model, robustness, usability — each mapped to a roadmap phase (v2 deferred list included)
- [x] **`.planning/ROADMAP.md`** — 4 phases aligned 1:1 to the organizer's checkpoints
- [x] **Phase 1 decisions captured** — `01-CONTEXT.md` (scope split D-04, checkpoint D-05, upload limits, `./data/` storage) + full discussion log
- [x] **Phase 1 UI design contract** — `01-UI-SPEC.md`, verified **7/7 checker dimensions**: 8-point spacing scale, 4 font sizes / 2 weights, parchment + ink-blue palette with accent reserved to exactly 3 elements, copy for every state (empty/loading/error/destructive), no-CDN rule. State coverage: 62 UI considerations, all resolved.
- [x] **Working plan** — `tasks/plan.md` + `tasks/todo.md` with checkpoints and P1/P2/P3 roles
- [ ] **Code** — `lib/`, API, CLI, `public/` UI: building now (Phase 1)

---

## 5. What's next (today's timeline — IST)

**⚠ Checkpoint 1 is now 13:30 IST — and Stage 1 evaluation begins at 13:30 IST too. The clean commit must land BEFORE 13:30.**

| Time | Gate | Must be true |
|------|------|--------------|
| **13:30** | **Checkpoint 1 + Stage 1 evaluation starts** | One clean commit; `node cli.js ask sample.pdf "what is the notice period?"` returns answer + verbatim quote + page; only localhost connections observed |
| 15:00 | Checkpoint 2 | Browser end-to-end demo, privacy evidence captured, refusal + silent-document demonstrated |
| 17:30 | Checkpoint 3 (hard freeze) | Nothing new starts after this — robustness fixtures, benchmarks, tests done |
| 20:00 | Checkpoint 4 | Fresh-clone run-through by someone who didn't build it |
| 20:30 | **Submission** | Public repo + submission pack |

**Phase 1 build order (what's being written right now):**
1. `lib/parse.js` — pdfjs-dist page-aware text + TXT path (P1)
2. `lib/chunk.js` + `lib/embed.js` → `chunks.json` + cosine retrieval (P1)
3. `lib/ollama.js` — chat, JSON mode, fallback model (P1)
4. `lib/verify.js` — verbatim quote gate + tier normalisation (P1)
5. Upload shell + chunk list with page numbers (P3)
6. `docs/api.md` contract, sample documents + licences, localhost-only check (P2)

---

## 6. Judge FAQ

**Q: How is this different from pasting a contract into ChatGPT?**
Three things: (1) the document never leaves the machine — only localhost traffic; (2) every claim is verified against a verbatim quote with a page number, and fabricated quotes are dropped by code; (3) it has designed non-answers — refusal, escalation, and "the document is silent on this" are first-class outputs.

**Q: What if the model hallucinates?**
The verifier gate means a hallucinated *quote* can't survive — it must be a substring of the actual chunk. A hallucinated *interpretation* is labelled `interpretation`, not `stated`. That's why rubric criteria 2 (grounding), 3 (uncertainty/refusal) and 4 (privacy) are treated as safety caps in our plan — polish is worthless if any of those is Poor.

**Q: Isn't a local small model too weak?**
`gemma3n:e2b` on CPU with top-6 retrieval is deliberately scoped: the model explains short retrieved passages, it doesn't read the whole document. Fallback `gemma3:4b`. Benchmarks land at Checkpoint 2/3 — we'll show numbers, not vibes.

**Q: Is it really offline?**
Setup pulls the model once via Ollama (documented, one-time). After that: `ollama serve` with update checks disabled, and the evidence script records every connection during a run. Judge can watch `Get-NetTCPConnection` during a demo.

**Q: Why no vector database?**
One document at a time, ≤ a few hundred chunks — a vector DB is infrastructure we don't need. Cosine over one JSON file is ~20 lines and has zero supply-chain surface. Deliberate YAGNI.

**Q: Are you giving legal advice?**
No. Plain-language *explanation* with citations, refusal on validity/enforceability questions, escalation banner to consult a lawyer. That's a designed product behaviour, tested with refusal fixtures.

**Q: What data did you train on / commit?**
Nothing private. Only CC-licensed or self-authored sample documents, with sources and attributions disclosed (G4). No private or non-redistributable data in the repo.

---

## 7. Files map (where to point a judge who wants to see the work)

| Question they ask | Show them |
|---|---|
| "What did you decide and why?" | `.planning/phases/01-contract-vertical-slice/01-CONTEXT.md` |
| "What are the requirements?" | `.planning/REQUIREMENTS.md` |
| "What's the architecture?" | `.planning/codebase/ARCHITECTURE.md` |
| "What does the UI contract say?" | `.planning/phases/01-contract-vertical-slice/01-UI-SPEC.md` |
| "How will you prove privacy?" | `scripts/privacy-evidence.ps1` → `evidence/privacy-report.md` (Phase 2) |
| "What's left?" | `tasks/todo.md` (checkboxes are the truth) |

---

*Brief maintained by the team; update §4 and §5 as checkboxes complete. Times are IST, 18 October 2026.*
